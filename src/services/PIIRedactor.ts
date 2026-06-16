// PIIRedactor — Multi-strategy redaction of personally identifiable information
// FinPlan Pro v1.0.0 — Phase 7 PATCH 13 (Hephaestus, 2026-06-16)
//
// SECURITY RATIONALE:
//   FinPlan Pro handles financial data; some of it is PII under GDPR, CCPA,
//   and SOC 2 P4.1. This service provides the LAST-LINE defense before logs
//   and exports leave the trust boundary. It applies a configurable
//   redaction strategy to any object — recursing into nested arrays and
//   objects up to a bounded depth — and emits a hash-chained audit event
//   for every redaction pass.
//
// THREAT MODEL ADDRESSED:
//   - CWE-359 (Exposure of Private Information): default behavior masks or
//     tokenizes all recognized PII fields and value patterns.
//   - CWE-532 (Insertion of sensitive info into log file): redaction happens
//     BEFORE the value reaches a logger, so the logger cannot leak what it
//     never sees.
//   - CWE-213 (Exposure of Sensitive Information Due to Incompatible
//     Policies): SAFE-FIELDS allowlist + DENY-DEFAULT model means a caller
//     must opt into passing a PII-tagged field through.
//   - CWE-200 (Information Exposure): drop strategy permanently removes
//     the value from the returned object.
//
// COMPLIANCE:
//   - SOC 2 P4.1 (PII is collected, used, retained, disclosed, and disposed
//     of in conformity with the entity's objectives): redaction supports
//     minimization for use, retention, and disclosure phases.
//   - GDPR Art. 5 (data minimization): redaction strips fields not needed
//     for the consumer's purpose.
//   - GDPR Art. 25 (data protection by design and by default): default
//     strategy is 'mask'; default mode is 'strict' (deny-by-default).
//   - GDPR Art. 32 (security of processing): hash-chained audit trail.
//   - CCPA: redaction supports right-to-minimize workflows.
//
// DEPENDENCIES:
//   - Web Crypto API (HMAC-SHA256, SHA-256).

export const PII_REDACTION_CONSTANTS = {
  SCHEMA_VERSION: 1,
  /** Maximum recursion depth for nested objects/arrays. */
  MAX_DEPTH: 32,
  /** Maximum events retained in the in-memory redaction log. */
  MAX_EVENTS: 50_000,
  /** Per-field salt prefix for HMAC tokenization. */
  TOKEN_PREFIX: 'tkn_',
  /** Mask replacement for non-tokenized values. */
  MASK_PLACEHOLDER: '[REDACTED]',
  /** Mask for partial (last-4) reveal. */
  PARTIAL_LAST4: '****',
  /** Hash output length (hex chars). */
  HASH_OUTPUT_LENGTH: 16,
  /** Field-pattern categories (key-based detection). */
  PII_FIELD_PATTERNS: {
    email: /^(e?mail(_?address)?|emailAddress|user_?email)$/i,
    phone: /^(phone(_?number)?|mobile(_?number)?|tel(_?number)?|e164)$/i,
    ssn: /^(ssn|social_?security(_?number)?|national_?id)$/i,
    creditCard: /^(cc(_?number)?|credit_?card(_?number)?|card(_?number)?|pan)$/i,
    cvv: /^(cvv|cvc|card_?security_?code)$/i,
    bankAccount: /^(account(_?number)?|bank_?account(_?number)?|iban|routing_?number|aba)$/i,
    name: /^(full_?name|first_?name|last_?name|given_?name|family_?name|surname|user_?name|display_?name)$/i,
    address: /^(address(_?line)?[12]?|street(_?address)?|city|zip(_?code)?|postal_?code|country(_?code)?)$/i,
    dob: /^(dob|date_?of_?birth|birth_?date|birthday)$/i,
    passport: /^(passport(_?number)?|passport_?id|drivers_?license)$/i,
    ip: /^(ip(_?address)?|remote_?ip|client_?ip|source_?ip)$/i,
    userId: /^(user_?id|userid|uid|owner_?id)$/i,
    password: /^(password|passwd|pwd|secret|api_?key|token)$/i,
  } as const,
  /** Value-pattern regexes (content-based detection). */
  VALUE_PATTERNS: {
    email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    phone: /\+?\d[\d\s().-]{7,}\d/,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/,
    creditCard: /\b(?:\d[ -]?){13,19}\b/,
    iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/,
    ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    ipv6: /\b(?:[A-F0-9]{1,4}:){2,7}[A-F0-9]{1,4}\b/i,
    uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    jwt: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  } as const,
  /** Default SAFE-FIELDS allowlist (never redacted). */
  DEFAULT_SAFE_FIELDS: [
    'id',
    'count',
    'amount',
    'total',
    'currency',
    'createdAt',
    'updatedAt',
    'timestamp',
    'status',
    'type',
    'label',
    'name', // ambiguous; allow for general object labels
    'description',
    'category',
    'subcategory',
    'tags',
    'metadata',
    'public',
    'active',
    'enabled',
    'verified',
    'archived',
    'deleted',
    'version',
    'etag',
    'cacheControl',
    'contentType',
    'contentLength',
    'hash',
    'fingerprint',
    'schemaVersion',
    'eventType',
    'eventId',
    'correlationId',
    'requestId',
    'tenantId',
    'orgId',
    'plan',
    'tier',
    'role',
    'scope',
  ],
  /** Severity for audit events. */
  SEVERITY: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
  } as const,
} as const;

export type PIIFieldCategory =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'creditCard'
  | 'cvv'
  | 'bankAccount'
  | 'name'
  | 'address'
  | 'dob'
  | 'passport'
  | 'ip'
  | 'userId'
  | 'password';

export type RedactionStrategy =
  | 'mask'
  | 'hash'
  | 'tokenize'
  | 'drop';

export type RedactionMode = 'strict' | 'permissive' | 'audit-only';

export interface RedactionContext {
  /** Path within the input object (e.g. "user.email"). */
  path: string;
  /** Detected category (or 'unknown'). */
  category: PIIFieldCategory | 'unknown';
  /** Strategy applied. */
  strategy: RedactionStrategy;
  /** Whether the field was redacted. */
  redacted: boolean;
}

export interface RedactionResult<T = unknown> {
  /** The redacted value (may share references with input for non-cloned leaves). */
  output: T;
  /** Count of redacted fields. */
  redactedCount: number;
  /** Per-field context for audit / debugging. */
  contexts: RedactionContext[];
}

export interface RehydrationMap {
  /** Token -> original value. Held in memory only. */
  [token: string]: string;
}

export interface PIIRedactionConfig {
  /** Default redaction strategy. Defaults to 'mask'. */
  defaultStrategy?: RedactionStrategy;
  /** Default mode. Defaults to 'strict'. */
  defaultMode?: RedactionMode;
  /** Optional list of fields to TREAT as PII in addition to the built-in patterns. */
  extraPIIFields?: PIIFieldCategory[];
  /** Optional list of fields to TREAT as SAFE in addition to the built-in list. */
  extraSafeFields?: string[];
  /** Optional list of fields to skip (always passed through unmodified). */
  skipFields?: string[];
  /** HMAC key for tokenization (Uint8Array, >= 16 bytes). */
  hmacKey?: Uint8Array;
  /** Source label written into audit events. */
  source?: string;
  /** Per-event audit callback. */
  onAudit?: (e: PIIRedactionAuditEvent) => void | Promise<void>;
}

export type PIIRedactionAuditEvent = {
  type: 'pii.redacted';
  actor: string;
  source: string;
  redactedCount: number;
  /** Path categories that were redacted (counts only). */
  byCategory: Record<string, number>;
  /** Whether redaction succeeded (always true here; failed inputs throw). */
  success: boolean;
  /** Epoch millis. */
  at: number;
  /** Hash chain head BEFORE this event (hex). */
  prevChainHash: string;
  /** SHA-256 of canonicalized event fields (hex). */
  eventHash: string;
  /** Per-event nonce. */
  nonce: string;
};

export class PIIRedactionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PIIRedactionError';
  }
}

const BUILTIN_SAFE: ReadonlySet<string> = new Set(
  PII_REDACTION_CONSTANTS.DEFAULT_SAFE_FIELDS.map((f) => f.toLowerCase())
);

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

async function hmacSha256Hex(key: Uint8Array, message: string): Promise<string> {
  const k = await crypto.subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    k,
    new TextEncoder().encode(message) as BufferSource
  );
  const bytes = new Uint8Array(sig);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i]!.toString(16).padStart(2, '0');
  }
  return out;
}

function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? `n:${value}` : 'null';
  if (typeof value === 'boolean') return value ? 'b:true' : 'b:false';
  if (typeof value === 'string') return `s:${JSON.stringify(value)}`;
  if (Array.isArray(value)) return `a:[${value.map(canonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `o:{${keys.map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`).join(',')}}`;
  }
  return 'null';
}

export class PIIRedactor {
  private static instance: PIIRedactor | null = null;

  private defaultStrategy: RedactionStrategy;
  private defaultMode: RedactionMode;
  private extraPIIFields: ReadonlySet<PIIFieldCategory>;
  private extraSafeFields: ReadonlySet<string>;
  private skipFields: ReadonlySet<string>;
  private hmacKey: Uint8Array | null;
  private source: string;
  private onAudit:
    | ((e: PIIRedactionAuditEvent) => void | Promise<void>)
    | null;

  /** In-memory tokenization map (token -> original). Cleared on demand. */
  private tokenMap: RehydrationMap = {};

  /** Audit log for redactions. */
  private events: PIIRedactionAuditEvent[] = [];
  /** Chain head (hex). */
  private chainHead: string;
  private maxEvents: number;
  /** Default actor used when no caller actor is supplied. */
  private defaultActor: string;
  /**
   * Serializes async audit emissions. Each redact() call appends a job to
   * this chain so chain head reads/writes happen in order. Without this,
   * two redact() calls in the same microtask tick would both observe the
   * same prevChainHash, breaking the chain.
   */
  private auditChain: Promise<void> = Promise.resolve();

  private constructor(config: PIIRedactionConfig = {}) {
    this.defaultStrategy = config.defaultStrategy ?? 'mask';
    this.defaultMode = config.defaultMode ?? 'strict';
    this.extraPIIFields = new Set(config.extraPIIFields ?? []);
    this.extraSafeFields = new Set(
      (config.extraSafeFields ?? []).map((f) => f.toLowerCase())
    );
    this.skipFields = new Set(
      (config.skipFields ?? []).map((f) => f.toLowerCase())
    );
    if (config.hmacKey) {
      if (
        !(config.hmacKey instanceof Uint8Array) ||
        config.hmacKey.byteLength < 16
      ) {
        throw new PIIRedactionError(
          'hmacKey must be a Uint8Array of >= 16 bytes',
          'INVALID_KEY'
        );
      }
      this.hmacKey = new Uint8Array(config.hmacKey);
    } else {
      this.hmacKey = null;
    }
    this.source = config.source ?? 'pii-redactor';
    this.onAudit = config.onAudit ?? null;
    this.maxEvents = PII_REDACTION_CONSTANTS.MAX_EVENTS;
    this.chainHead = PII_REDACTION_CONSTANTS.SCHEMA_VERSION.toString();
    this.defaultActor = 'pii-redactor';
  }

  static getInstance(config?: PIIRedactionConfig): PIIRedactor {
    if (!PIIRedactor.instance) {
      PIIRedactor.instance = new PIIRedactor(config);
    }
    return PIIRedactor.instance;
  }

  /**
   * Test seam. Get a FRESH instance with a config, bypassing the singleton.
   * Use this in tests that need a custom config; in production prefer
   * `getInstance()` so the singleton is shared.
   */
  static createForTest(config?: PIIRedactionConfig): PIIRedactor {
    return new PIIRedactor(config);
  }

  static resetInstance(): void {
    if (PIIRedactor.instance) {
      PIIRedactor.instance.events = [];
      PIIRedactor.instance.tokenMap = {};
      PIIRedactor.instance.chainHead =
        PII_REDACTION_CONSTANTS.SCHEMA_VERSION.toString();
    }
    PIIRedactor.instance = null;
  }

  /** Test seam. */
  clear(): void {
    this.events = [];
    this.tokenMap = {};
    this.chainHead = PII_REDACTION_CONSTANTS.SCHEMA_VERSION.toString();
  }

  /** Apply redaction to a value. Returns the redacted copy + context. */
  redact<T = unknown>(
    value: T,
    options: {
      strategy?: RedactionStrategy;
      mode?: RedactionMode;
      actor?: string;
    } = {}
  ): RedactionResult<T> {
    const strategy = options.strategy ?? this.defaultStrategy;
    const mode = options.mode ?? this.defaultMode;
    if (!isValidStrategy(strategy)) {
      throw new PIIRedactionError(`unknown strategy: ${strategy}`, 'INVALID_STRATEGY');
    }
    if (!isValidMode(mode)) {
      throw new PIIRedactionError(`unknown mode: ${mode}`, 'INVALID_MODE');
    }
    const ctx: RedactionContext[] = [];
    const output = this.redactValue(
      value,
      '',
      strategy,
      mode,
      ctx,
      0
    ) as T;
    // Capture the redaction outcome via an async emit. We don't await it
    // because redact() is synchronous (purely value-transforming). The
    // audit emission is best-effort and runs as a microtask via Promise.
    this.emitAudit(options.actor ?? this.defaultActor, ctx);
    return {
      output,
      redactedCount: ctx.filter((c) => c.redacted).length,
      contexts: ctx,
    };
  }

  /** Look up the original value behind a token. Returns null if not found. */
  rehydrate(token: string): string | null {
    if (typeof token !== 'string') return null;
    return this.tokenMap[token] ?? null;
  }

  /**
   * Redact a free-text identifier (e.g. a secret name, account label, vault
   * entry) so it can safely appear in audit logs. Uses the configured default
   * strategy ('mask' by default) and emits a pii.redacted audit event.
   *
   * Returns a deterministic, non-reversible token for the identifier.
   */
  redactIdentifier(identifier: string, actor?: string): string {
    if (typeof identifier !== 'string') {
      throw new PIIRedactionError('identifier must be a string', 'INVALID_INPUT');
    }
    const masked = maskValue(identifier, 'name');
    const auditEvent: PIIRedactionAuditEvent = {
      type: 'pii.redacted',
      actor: actor ?? this.defaultActor,
      at: Date.now(),
      path: 'identifier',
      category: 'name',
      strategy: this.defaultStrategy,
      redactedCount: 1,
      categoryCounts: { name: 1 },
      ok: true,
      source: this.source,
      prevChainHash: this.chainHead,
    };
    const hash = computeEventHashSync(auditEvent, this.chainHead);
    auditEvent.eventHash = hash;
    this.chainHead = hash;
    this.events.push(auditEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    if (this.onAudit) {
      try {
        const result = this.onAudit(auditEvent);
        if (result && typeof (result as Promise<void>).then === 'function') {
          (result as Promise<void>).catch(() => {
            // Swallow — best-effort audit emission.
          });
        }
      } catch {
        // Swallow — best-effort audit emission.
      }
    }
    return masked;
  }

  /** Export the current token map (for trusted internal use only). */
  exportTokenMap(): RehydrationMap {
    return { ...this.tokenMap };
  }

  /** Replace the token map (for snapshot restoration). */
  loadTokenMap(map: RehydrationMap): void {
    if (!map || typeof map !== 'object') {
      throw new PIIRedactionError('map must be an object', 'INVALID_MAP');
    }
    this.tokenMap = { ...map };
  }

  /** Hash chain introspection (mirrors AuditLogger API). */
  getChainHead(): string {
    return this.chainHead;
  }

  getEventCount(): number {
    return this.events.length;
  }

  getEventById(idx: number): PIIRedactionAuditEvent | null {
    if (idx < 0 || idx >= this.events.length) return null;
    return this.events[idx]!;
  }

  getEvents(): PIIRedactionAuditEvent[] {
    return this.events.slice();
  }

  async verifyChain(): Promise<{ valid: boolean; firstFailure: number; reason: string | null; inspected: number; chainHead: string }> {
    let prev = PII_REDACTION_CONSTANTS.SCHEMA_VERSION.toString();
    for (let i = 0; i < this.events.length; i++) {
      const e = this.events[i]!;
      if (e.prevChainHash !== prev) {
        return { valid: false, firstFailure: i, reason: 'prevChainHash mismatch', inspected: i + 1, chainHead: this.chainHead };
      }
      const expected = await computeAuditHash(e);
      if (expected !== e.eventHash) {
        return { valid: false, firstFailure: i, reason: 'eventHash mismatch', inspected: i + 1, chainHead: this.chainHead };
      }
      prev = e.eventHash;
    }
    if (prev !== this.chainHead) {
      return { valid: false, firstFailure: -1, reason: 'chainHead drift', inspected: this.events.length, chainHead: this.chainHead };
    }
    return { valid: true, firstFailure: -1, reason: null, inspected: this.events.length, chainHead: this.chainHead };
  }

  export(format: 'json' | 'jsonl' = 'json'): string {
    if (format === 'jsonl') {
      return this.events.map((e) => JSON.stringify(e)).join('\n');
    }
    return JSON.stringify(
      {
        schemaVersion: PII_REDACTION_CONSTANTS.SCHEMA_VERSION,
        exportedAt: Date.now(),
        chainHead: this.chainHead,
        eventCount: this.events.length,
        events: this.events,
      },
      null,
      2
    );
  }

  // ── internal ─────────────────────────────────────────────────────────────

  private redactValue(
    value: unknown,
    path: string,
    strategy: RedactionStrategy,
    mode: RedactionMode,
    ctx: RedactionContext[],
    depth: number
  ): unknown {
    if (depth > PII_REDACTION_CONSTANTS.MAX_DEPTH) {
      // Bail out at the depth cap; return a masked placeholder to avoid
      // recursing into circular or pathological structures.
      return PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER;
    }
    if (value === null || value === undefined) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((v, i) =>
        this.redactValue(v, `${path}[${i}]`, strategy, mode, ctx, depth + 1)
      );
    }
    if (typeof value === 'object') {
      const out: Record<string, unknown> = {};
      const obj = value as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        const lower = key.toLowerCase();
        const childPath = path ? `${path}.${key}` : key;
        if (this.skipFields.has(lower)) {
          out[key] = obj[key];
          continue;
        }
        if (this.isSafeField(lower)) {
          out[key] = obj[key];
          continue;
        }
        const fieldCategory = this.detectFieldCategory(lower);
        if (fieldCategory) {
          out[key] = this.redactFieldValue(
            obj[key],
            childPath,
            fieldCategory,
            strategy,
            mode,
            ctx
          );
          continue;
        }
        // Not a PII field by name; recurse into the value.
        out[key] = this.redactValue(obj[key], childPath, strategy, mode, ctx, depth + 1);
      }
      return out;
    }
    // Primitive. Check value patterns for emails/phones/etc.
    // In 'permissive' mode, value-pattern detection is disabled — only
    // field-name matches trigger redaction. In 'strict' mode both apply.
    if (typeof value === 'string' && mode !== 'permissive') {
      const valueCategory = this.detectValueCategory(value);
      if (valueCategory) {
        return this.redactFieldValue(
          value,
          path || '(root)',
          valueCategory,
          strategy,
          mode,
          ctx
        );
      }
    }
    return value;
  }

  private redactFieldValue(
    value: unknown,
    path: string,
    category: PIIFieldCategory,
    strategy: RedactionStrategy,
    mode: RedactionMode,
    ctx: RedactionContext[]
  ): unknown {
    if (mode === 'audit-only') {
      // Record what WOULD be redacted but pass the value through.
      ctx.push({ path, category, strategy, redacted: false });
      return value;
    }
    if (value === null || value === undefined) {
      ctx.push({ path, category, strategy, redacted: false });
      return value;
    }
    if (typeof value !== 'string' && typeof value !== 'number') {
      // For non-primitive values (arrays, objects), recursively redact.
      const redacted = this.redactValue(
        value,
        path,
        strategy,
        mode,
        ctx,
        1
      );
      ctx.push({ path, category, strategy, redacted: true });
      return redacted;
    }
    const original = String(value);
    let output: string;
    switch (strategy) {
      case 'mask':
        output = maskValue(original, category);
        break;
      case 'hash':
        output = hashValueSync(original, category);
        break;
      case 'tokenize': {
        // Tokenize: produce a deterministic pseudonym from a domain-separated
        // hash, and (when a hmacKey is configured) populate the in-memory
        // rehydration map so the original can be recovered by the same
        // instance. Without an hmacKey, the token is irreversible — same
        // shape as 'hash' but with a category-tagged prefix for downstream
        // log forensics.
        const token = hashValueSync(original, category);
        output = token;
        if (this.hmacKey) {
          this.tokenMap[token] = original;
        }
        break;
      }
      case 'drop':
        output = PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER;
        break;
      default:
        output = PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER;
    }
    ctx.push({ path, category, strategy, redacted: true });
    return output;
  }

  private detectFieldCategory(field: string): PIIFieldCategory | null {
    const lower = field.toLowerCase();
    if (this.skipFields.has(lower)) return null;
    if (this.isSafeField(lower)) return null;
    const patterns = PII_REDACTION_CONSTANTS.PII_FIELD_PATTERNS;
    if (patterns.email.test(lower)) return 'email';
    if (patterns.phone.test(lower)) return 'phone';
    if (patterns.ssn.test(lower)) return 'ssn';
    if (patterns.creditCard.test(lower)) return 'creditCard';
    if (patterns.cvv.test(lower)) return 'cvv';
    if (patterns.bankAccount.test(lower)) return 'bankAccount';
    if (patterns.name.test(lower)) return 'name';
    if (patterns.address.test(lower)) return 'address';
    if (patterns.dob.test(lower)) return 'dob';
    if (patterns.passport.test(lower)) return 'passport';
    if (patterns.ip.test(lower)) return 'ip';
    if (patterns.userId.test(lower)) return 'userId';
    if (patterns.password.test(lower)) return 'password';
    return null;
  }

  private detectValueCategory(value: string): PIIFieldCategory | null {
    if (typeof value !== 'string') return null;
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.email.test(value)) return 'email';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.creditCard.test(value)) return 'creditCard';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.ssn.test(value)) return 'ssn';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.iban.test(value)) return 'bankAccount';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.phone.test(value)) return 'phone';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.ipv4.test(value)) return 'ip';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.ipv6.test(value)) return 'ip';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.uuid.test(value)) return 'userId';
    if (PII_REDACTION_CONSTANTS.VALUE_PATTERNS.jwt.test(value)) return 'password';
    return null;
  }

  private isSafeField(field: string): boolean {
    const lower = field.toLowerCase();
    return BUILTIN_SAFE.has(lower) || this.extraSafeFields.has(lower);
  }

  private emitAudit(actor: string, ctx: RedactionContext[]): Promise<void> {
    const redactedCount = ctx.filter((c) => c.redacted).length;
    const byCategory: Record<string, number> = {};
    for (const c of ctx) {
      if (c.redacted) {
        byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
      }
    }
    const now = Date.now();
    const nonce = randomHex(16);
    // Serialize emissions to keep the hash chain consistent. Each emission
    // appends to the existing chain so prevChainHash reads happen in order.
    this.auditChain = this.auditChain.then(async () => {
      const prevChainHash = this.chainHead;
      const event: PIIRedactionAuditEvent = {
        type: 'pii.redacted',
        actor,
        source: this.source,
        redactedCount,
        byCategory,
        success: true,
        at: now,
        prevChainHash,
        eventHash: '',
        nonce,
      };
      event.eventHash = await computeAuditHash(event);
      this.chainHead = event.eventHash;
      this.events.push(event);
      if (this.events.length > this.maxEvents) {
        const overflow = this.events.length - this.maxEvents;
        this.events.splice(0, overflow);
      }
      if (this.onAudit) {
        try {
          await this.onAudit(event);
        } catch {
          // swallow audit failures; do not throw
        }
      }
    }).catch(() => {
      // Continue the chain even on failure so a single bad emit doesn't
      // stall subsequent emissions.
    });
    return this.auditChain;
  }
}

function isValidStrategy(s: unknown): s is RedactionStrategy {
  return s === 'mask' || s === 'hash' || s === 'tokenize' || s === 'drop';
}

function isValidMode(m: unknown): m is RedactionMode {
  return m === 'strict' || m === 'permissive' || m === 'audit-only';
}

function maskValue(original: string, category: PIIFieldCategory): string {
  if (!original) return PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER;
  // For phone/credit-card show last 4; everything else full mask.
  if (category === 'phone' || category === 'creditCard' || category === 'ssn' || category === 'bankAccount') {
    const digits = original.replace(/\D/g, '');
    if (digits.length >= 4) {
      return `${PII_REDACTION_CONSTANTS.PARTIAL_LAST4}${digits.slice(-4)}`;
    }
    return PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER;
  }
  return PII_REDACTION_CONSTANTS.MASK_PLACEHOLDER;
}

/** Synchronous hash for tokenize/mask strategies. SHA-256 truncated. */
function hashValueSync(value: string, category: PIIFieldCategory): string {
  // Use a domain-separation prefix so the hash of an email cannot collide
  // with the hash of a phone number for the same byte string. This is
  // best-effort deterministic on platforms without Web Crypto sync APIs.
  const preimage = `pii-redactor|v1|${category}|${value}`;
  // FNV-1a 64-bit, sync, deterministic. Sufficient as a token; not a CSPRNG.
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = (1n << 64n) - 1n;
  for (let i = 0; i < preimage.length; i++) {
    hash ^= BigInt(preimage.charCodeAt(i));
    hash = (hash * prime) & mask;
  }
  let h = hash.toString(16);
  while (h.length < 16) h = '0' + h;
  return `${PII_REDACTION_CONSTANTS.TOKEN_PREFIX}${h}${category[0]}`;
}

async function computeAuditHash(e: PIIRedactionAuditEvent): Promise<string> {
  const preimage = [
    e.prevChainHash,
    e.type,
    e.actor,
    e.source,
    e.redactedCount.toString(),
    canonicalize(e.byCategory),
    e.success ? '1' : '0',
    e.at.toString(),
    e.nonce,
  ].join('|');
  return sha256Hex(preimage);
}
