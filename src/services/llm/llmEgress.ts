// =============================================================================
// LLM Egress Chokepoint — FinPlan Pro (Blueprint W0.9, Phase 0)
// -----------------------------------------------------------------------------
// Every outbound LLM/model request from the client MUST go through this module.
// No component or service may call `fetch` directly for model traffic; the only
// sanctioned transport for prompts lives here behind three mandatory gates:
//
//   1. Build-time kill switch — egress is blocked entirely unless
//      `VITE_LLM_EGRESS_ENABLED=true` at build time.
//   2. Host allowlist/denylist on the endpoint URL. Denylist wins. Defaults
//      allow only the NVIDIA NIM API host plus loopback (local proxies).
//   3. Deterministic redaction pass BEFORE egress (see `redactPromptText`):
//      secret shapes (sk-, ghp_, AKIA…), IBAN-ish sequences, GL account
//      references, long digit runs >= 7 (money), and emails (optionally
//      pseudonymized deterministically).
//
// Violations throw the typed `LlmEgressBlockedError` carrying code
// `LLM-EGRESS-BLOCKED`.
//
// Audit hook: each gated attempt appends {ts, endpoint, promptBytes,
// redactions} through `LlmEgressAuditSink`. The default sink is a console-free
// no-op: `auditTrailStore` cannot be wired directly because its record* API
// (`RecordInput`, src/store/auditTrailStore.ts) requires spreadsheet-shaped
// cellId/userId fields and feeds a SHA-256 tamper-evident chain, which synthetic
// LLM events must not pollute. Attach a real sink later via
// `setLlmEgressAuditSink()` without touching this module's callers.
//
// MCP / server-side proxy traffic is intentionally out of scope for this file.
// =============================================================================

/** Role set mirrors the OpenAI-compatible chat shape used by NVIDIA NIM. */
export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

// ---------------------------------------------------------------------------
// Redaction (deterministic, pure — unit-tested via a fixture table)
// ---------------------------------------------------------------------------

export type LlmRedactionCategory =
  | 'email'
  | 'secret'
  | 'iban'
  | 'gl-account'
  | 'money-grouped'
  | 'digits';

export interface LlmRedactionOptions {
  /** Replace emails with a deterministic pseudonym instead of a flat token. */
  pseudonymizeEmails?: boolean;
}

export interface LlmRedactionResult {
  text: string;
  /** Total number of replacements applied across all categories. */
  redactions: number;
  byCategory: Record<LlmRedactionCategory, number>;
}

const EMPTY_BY_CATEGORY: Record<LlmRedactionCategory, number> = {
  email: 0,
  secret: 0,
  iban: 0,
  'gl-account': 0,
  'money-grouped': 0,
  digits: 0,
};

/**
 * Pass order matters and is part of the contract:
 *  1. emails first — so a 7+ digit local part cannot leak the domain by
 *     breaking the email match before the digit-run pass fires;
 *  2. secret shapes, IBAN, GL accounts, grouped money, bare digit runs.
 * Later passes see earlier placeholders, which are digit-free and stable.
 */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;

const SECRET_PATTERN = /\bsk-[A-Za-z0-9_-]{16,}\b|\bghp_[A-Za-z0-9]{16,}\b|\bAKIA[A-Z0-9]{12,}\b/g;

/** Loose IBAN-ish shape: 2 letters + 2 check digits + 10–26 alphanumerics. */
const IBAN_PATTERN = /\b[A-Z]{2}\d{2}[A-Z0-9]{10,26}\b/g;

/** Explicit GL / account references, e.g. "GL-40201", "GL:4020100". */
const GL_ACCOUNT_PATTERN = /\b(?:GL|ACCT|A\/C)\s*[-:#]?\s*#?\d[\d.,-]*\d\b/gi;

/** Thousands-grouped amounts (>= 7 digits total), e.g. "1,234,567". */
const GROUPED_MONEY_PATTERN = /\d{1,3}(?:,\d{3}){2,}/g;

/** Bare digit runs >= 7 (money/account ids outside the shapes above). */
const LONG_DIGITS_PATTERN = /\d{7,}/g;

const PLACEHOLDERS: Record<Exclude<LlmRedactionCategory, 'email'>, string> = {
  secret: '[REDACTED:SECRET]',
  iban: '[REDACTED:IBAN]',
  'gl-account': '[REDACTED:GL_ACCOUNT]',
  'money-grouped': '[REDACTED:MONEY]',
  digits: '[REDACTED:DIGITS]',
};

/** FNV-1a 32-bit — tiny, deterministic, dependency-free. */
function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Deterministic pseudonym. Hex digits are interleaved with 'x' every pair so
 * the output can never contain a 7+ consecutive-digit run (the later
 * long-digits pass therefore cannot corrupt it).
 */
function pseudonymizeEmail(email: string): string {
  const hex = fnv1aHex(email.trim().toLowerCase());
  const spaced = `${hex.slice(0, 2)}x${hex.slice(2, 4)}x${hex.slice(4, 6)}x${hex.slice(6, 8)}`;
  return `user-${spaced}@redacted.invalid`;
}

/** Redact a free-text prompt fragment. Pure and deterministic. */
export function redactPromptText(
  input: string,
  options: LlmRedactionOptions = {}
): LlmRedactionResult {
  const byCategory: Record<LlmRedactionCategory, number> = { ...EMPTY_BY_CATEGORY };
  let text = input;

  // 1) Emails — first, so digit runs inside addresses cannot break the match.
  text = text.replace(EMAIL_PATTERN, (match) => {
    byCategory.email++;
    return options.pseudonymizeEmails ? pseudonymizeEmail(match) : '[REDACTED:EMAIL]';
  });

  // 2–6) Shape-based passes.
  text = text.replace(SECRET_PATTERN, () => {
    byCategory.secret++;
    return PLACEHOLDERS.secret;
  });
  text = text.replace(IBAN_PATTERN, () => {
    byCategory.iban++;
    return PLACEHOLDERS.iban;
  });
  text = text.replace(GL_ACCOUNT_PATTERN, () => {
    byCategory['gl-account']++;
    return PLACEHOLDERS['gl-account'];
  });
  text = text.replace(GROUPED_MONEY_PATTERN, () => {
    byCategory['money-grouped']++;
    return PLACEHOLDERS['money-grouped'];
  });
  text = text.replace(LONG_DIGITS_PATTERN, () => {
    byCategory.digits++;
    return PLACEHOLDERS.digits;
  });

  const redactions = Object.values(byCategory).reduce((sum, n) => sum + n, 0);
  return { text, redactions, byCategory };
}

/** Redact every message content; returns new message objects (never mutates). */
export function redactMessages(
  messages: readonly LlmMessage[],
  options: LlmRedactionOptions = {}
): { messages: LlmMessage[]; redactions: number } {
  let redactions = 0;
  const next = messages.map((message) => {
    const result = redactPromptText(message.content, options);
    redactions += result.redactions;
    return { role: message.role, content: result.text };
  });
  return { messages: next, redactions };
}

// ---------------------------------------------------------------------------
// Gating: build-time kill switch + host allowlist/denylist
// ---------------------------------------------------------------------------

export const LLM_EGRESS_BLOCKED_CODE = 'LLM-EGRESS-BLOCKED' as const;

export type LlmEgressBlockedReason =
  | 'egress-disabled'
  | 'host-denied'
  | 'host-not-allowed'
  | 'invalid-endpoint';

/** Typed violation error required by Blueprint W0.9 requirement 3. */
export class LlmEgressBlockedError extends Error {
  readonly code = LLM_EGRESS_BLOCKED_CODE;
  readonly reason: LlmEgressBlockedReason;
  readonly endpoint: string;

  constructor(reason: LlmEgressBlockedReason, endpoint: string) {
    super(
      `[${LLM_EGRESS_BLOCKED_CODE}:${reason}] outbound LLM traffic to "${endpoint}" was blocked ` +
        `by the egress chokepoint (src/services/llm/llmEgress.ts).`
    );
    this.name = 'LlmEgressBlockedError';
    this.reason = reason;
    this.endpoint = endpoint;
  }
}

/** Non-gating transport failure (non-2xx response from an allowed endpoint). */
export class LlmEgressHttpError extends Error {
  readonly status: number;
  readonly bodyPreview: string;

  constructor(status: number, bodyPreview: string) {
    super(`LLM egress HTTP ${status}: ${bodyPreview}`);
    this.name = 'LlmEgressHttpError';
    this.status = status;
    this.bodyPreview = bodyPreview;
  }
}

const DEFAULT_ALLOWED_HOSTS: readonly string[] = [
  'integrate.api.nvidia.com',
  'localhost',
  '127.0.0.1',
];

const DEFAULT_LLM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';
const DEFAULT_LLM_MODEL = 'meta/llama-3.1-70b-instruct';

function envList(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

/** Read lazily on every call so builds/tests can toggle via import.meta.env. */
export function isEgressEnabled(): boolean {
  return import.meta.env.VITE_LLM_EGRESS_ENABLED === 'true';
}

function resolveHostLists(): { allowed: string[]; denied: string[] } {
  const configuredAllowed = envList(import.meta.env.VITE_LLM_EGRESS_ALLOWED_HOSTS);
  return {
    allowed: configuredAllowed.length > 0 ? configuredAllowed : [...DEFAULT_ALLOWED_HOSTS],
    denied: envList(import.meta.env.VITE_LLM_EGRESS_DENIED_HOSTS),
  };
}

/** Gate one endpoint URL through kill switch -> denylist -> allowlist. */
export function assertEndpointAllowed(endpoint: string): URL {
  if (!isEgressEnabled()) {
    throw new LlmEgressBlockedError('egress-disabled', endpoint);
  }
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new LlmEgressBlockedError('invalid-endpoint', endpoint);
  }
  const host = url.hostname.toLowerCase();
  const { allowed, denied } = resolveHostLists();
  if (denied.includes(host)) {
    throw new LlmEgressBlockedError('host-denied', endpoint);
  }
  if (!allowed.includes(host)) {
    throw new LlmEgressBlockedError('host-not-allowed', endpoint);
  }
  return url;
}

// ---------------------------------------------------------------------------
// Audit trail hook
// ---------------------------------------------------------------------------

export interface LlmEgressAuditEvent {
  readonly ts: number;
  readonly endpoint: string;
  readonly promptBytes: number;
  readonly redactions: number;
}

export interface LlmEgressAuditSink {
  append(event: LlmEgressAuditEvent): void;
}

/** Console-free no-op — the sanctioned fallback (W0.9 requirement 4). */
const NO_OP_SINK: LlmEgressAuditSink = {
  append: () => {
    /* intentional no-op: never log prompt material */
  },
};

let auditSink: LlmEgressAuditSink = NO_OP_SINK;

/** Attach a real sink (e.g. a future store bridge). Pass null to detach. */
export function setLlmEgressAuditSink(sink: LlmEgressAuditSink | null): void {
  auditSink = sink ?? NO_OP_SINK;
}

function emitAudit(event: LlmEgressAuditEvent): void {
  try {
    auditSink.append(event);
  } catch {
    // A broken audit sink must never break (or leak) the egress path itself.
  }
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

export interface LlmCompleteOptions extends LlmRedactionOptions {
  /** Absolute chat-completions endpoint. Must pass the host allowlist. */
  endpoint?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  /** Extra auth headers resolved lazily right before the call. */
  headers?: () => Record<string, string>;
  signal?: AbortSignal;
}

function normalizePrompt(prompt: string | readonly LlmMessage[]): LlmMessage[] {
  if (typeof prompt === 'string') {
    return [{ role: 'user', content: prompt }];
  }
  return prompt.map((message) => ({ role: message.role, content: message.content }));
}

async function readErrorBody(response: Response): Promise<string> {
  if (typeof response.text !== 'function') return 'Unknown error';
  return response.text().catch(() => 'Unknown error');
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (typeof response.json === 'function') {
    return response.json() as Promise<T>;
  }
  return JSON.parse(await response.text()) as T;
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

/**
 * THE chokepoint entry for outbound LLM completions.
 * Gates -> redacts -> audits -> POSTs an OpenAI-compatible chat payload.
 */
export async function complete<T = unknown>(
  prompt: string | readonly LlmMessage[],
  options: LlmCompleteOptions = {}
): Promise<T> {
  const endpoint = options.endpoint ?? DEFAULT_LLM_ENDPOINT;
  assertEndpointAllowed(endpoint);

  const normalized = normalizePrompt(prompt);
  const { messages: redactedMessages, redactions } = redactMessages(normalized, options);

  emitAudit({
    ts: Date.now(),
    endpoint,
    promptBytes: byteLength(JSON.stringify(redactedMessages)),
    redactions,
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers?.() ?? {}) },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_LLM_MODEL,
      messages: redactedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      top_p: options.topP ?? 0.9,
      stream: false,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new LlmEgressHttpError(response.status, await readErrorBody(response));
  }
  return parseResponseBody<T>(response);
}

export type LlmOpenStreamOptions = LlmCompleteOptions;

/**
 * Streaming sibling of {@link complete} living in the same chokepoint module:
 * identical gates/redaction/audit, but returns the raw Response so callers can
 * consume the SSE body. Model traffic still never bypasses this module.
 */
export async function openStream(
  prompt: string | readonly LlmMessage[],
  options: LlmOpenStreamOptions = {}
): Promise<Response> {
  const endpoint = options.endpoint ?? DEFAULT_LLM_ENDPOINT;
  assertEndpointAllowed(endpoint);

  const normalized = normalizePrompt(prompt);
  const { messages: redactedMessages, redactions } = redactMessages(normalized, options);

  emitAudit({
    ts: Date.now(),
    endpoint,
    promptBytes: byteLength(JSON.stringify(redactedMessages)),
    redactions,
  });

  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers?.() ?? {}) },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_LLM_MODEL,
      messages: redactedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      stream: true,
    }),
    signal: options.signal,
  });
}

/** Namespaced facade — the canonical import surface for call sites. */
export const llmEgress = {
  complete,
  openStream,
  redactPromptText,
  redactMessages,
  assertEndpointAllowed,
  isEgressEnabled,
};
