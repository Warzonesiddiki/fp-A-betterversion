import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

/**
 * Server-side NVIDIA NIM proxy (wave 3, lane R24 — security hardening spike).
 *
 * WHY: the client's src/services/nim.ts still carries VITE_NIM_API_KEY_* build
 * flags and warns that production keys must not ship in the bundle. This
 * route is the server-held-key replacement surface:
 *
 *   - The NVIDIA key lives ONLY in the server env (`NIM_API_KEY`) and is read
 *     lazily at request time; it is never echoed, logged, or relayed.
 *   - Every request passes authMiddleware (valid JWT required).
 *   - The upstream endpoint is a server-side CONSTANT allowlist entry
 *     (https://integrate.api.nvidia.com/v1/chat/completions) — the request
 *     body cannot influence the target host. The model id is additionally
 *     restricted to the same whitelist the client advertises.
 *   - Prompts pass through a deterministic redaction pass that PORTS the exact
 *     contract of the client egress chokepoint (src/services/llm/llmEgress.ts,
 *     redactPromptText): same pass order, same regexes, same placeholders.
 *     Reimplemented locally by design — the server package must not import
 *     client code.
 *   - Per-tenant rate limiting via a simple in-memory fixed-window bucket
 *     (single-process deployment, Phase 0 scope).
 *
 * Response contract:
 *   200 -> upstream chat-completions JSON + `redactions` count applied
 *   400 -> validation failure / model not whitelisted
 *   401 -> missing or invalid JWT (authMiddleware)
 *   429 -> tenant rate limit exceeded
 *   502 -> upstream non-OK or unreachable (status relayed, body NEVER relayed)
 *   503 -> NIM_API_KEY not configured on the server
 */

const router = Router();
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// Upstream allowlist (server-side constants — not client-influenced)
// ---------------------------------------------------------------------------

const NIM_UPSTREAM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

/** Mirrors NIM_MODELS in client src/services/nim.ts. */
const NIM_ALLOWED_MODELS: readonly string[] = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'mistralai/codestral-24b-instruct',
];

const NIM_DEFAULT_MODEL = 'meta/llama-3.1-70b-instruct';

// ---------------------------------------------------------------------------
// Redaction — minimal port of client llmEgress.redactPromptText.
// Pass order is part of the contract and must match the client chokepoint:
// emails → secret shapes → IBAN (compact, spaced) → prefixed GL accounts →
// currency money → segmented account codes (>=7 digit guard) → grouped money
// → bare digit runs >= 7. Placeholders are digit-free and stable so later
// passes never corrupt earlier ones.
// ---------------------------------------------------------------------------

type RedactionCategory =
  | 'email'
  | 'secret'
  | 'iban'
  | 'gl-account'
  | 'money-grouped'
  | 'digits';

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const SECRET_PATTERN = /\bsk-[A-Za-z0-9_-]{16,}\b|\bghp_[A-Za-z0-9]{16,}\b|\bAKIA[A-Z0-9]{12,}\b/g;
const IBAN_COMPACT_PATTERN = /\b[A-Za-z]{2}\d{2}[A-Za-z0-9]{10,26}\b/g;
const IBAN_SPACED_PATTERN = /\b[A-Za-z]{2}\d{2}(?: [A-Za-z0-9]{2,4}){3,8}\b/g;
const GL_ACCOUNT_PATTERN = /\b(?:GL|ACCT|A\/C)\s*[-.:#]?\s*#?\d[\d.,-]*\d\b/gi;
const CURRENCY_MONEY_PATTERN = /[€£$]\s?\d[\d.,]*/g;
const SEGMENTED_ACCOUNT_PATTERN = /\b\d{1,4}(?:[.-]\d{1,4}){1,3}\b/g;
const GROUPED_MONEY_PATTERN = /\d{1,3}(?:,\d{3}){2,}/g;
const LONG_DIGITS_PATTERN = /\d{7,}/g;

interface RedactionResult {
  text: string;
  byCategory: Record<RedactionCategory, number>;
}

function emptyByCategory(): Record<RedactionCategory, number> {
  return { email: 0, secret: 0, iban: 0, 'gl-account': 0, 'money-grouped': 0, digits: 0 };
}

function redactPromptText(input: string): RedactionResult {
  const byCategory = emptyByCategory();
  let text = input;

  // 1) Emails first — digit runs inside addresses must not break later passes.
  text = text.replace(EMAIL_PATTERN, () => {
    byCategory.email++;
    return '[REDACTED:EMAIL]';
  });

  // 2–8) Shape-based passes (order mirrors the client chokepoint).
  text = text.replace(SECRET_PATTERN, () => {
    byCategory.secret++;
    return '[REDACTED:SECRET]';
  });
  text = text.replace(IBAN_COMPACT_PATTERN, () => {
    byCategory.iban++;
    return '[REDACTED:IBAN]';
  });
  text = text.replace(IBAN_SPACED_PATTERN, () => {
    byCategory.iban++;
    return '[REDACTED:IBAN]';
  });
  text = text.replace(GL_ACCOUNT_PATTERN, () => {
    byCategory['gl-account']++;
    return '[REDACTED:GL_ACCOUNT]';
  });
  // Currency money BEFORE segmented codes so "€1.234.567,00" is consumed whole.
  text = text.replace(CURRENCY_MONEY_PATTERN, (match) => {
    byCategory['money-grouped']++;
    const trimmed = match.replace(/[.,]+\s*$/, '');
    return '[REDACTED:MONEY]' + match.slice(trimmed.length);
  });
  // Segmented codes only count when they carry >= 7 digits total ("4020-100");
  // "20.0%", "v1.2.3" and similar small tokens pass through untouched.
  text = text.replace(SEGMENTED_ACCOUNT_PATTERN, (match) => {
    if (match.replace(/\D/g, '').length < 7) {
      return match;
    }
    byCategory['gl-account']++;
    return '[REDACTED:GL_ACCOUNT]';
  });
  text = text.replace(GROUPED_MONEY_PATTERN, () => {
    byCategory['money-grouped']++;
    return '[REDACTED:MONEY]';
  });
  text = text.replace(LONG_DIGITS_PATTERN, () => {
    byCategory.digits++;
    return '[REDACTED:DIGITS]';
  });

  return { text, byCategory };
}

function redactMessages(messages: { role: string; content: string }[]): {
  messages: { role: string; content: string }[];
  redactions: number;
} {
  let redactions = 0;
  const next = messages.map((message) => {
    const result = redactPromptText(message.content);
    for (const n of Object.values(result.byCategory)) redactions += n;
    return { role: message.role, content: result.text };
  });
  return { messages: next, redactions };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const NimProxySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().max(32_000),
      })
    )
    .min(1)
    .max(64),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().min(1).max(4096).optional(),
});

type NimProxyBody = z.infer<typeof NimProxySchema>;

// ---------------------------------------------------------------------------
// Per-tenant rate limiting (in-memory fixed window)
// ---------------------------------------------------------------------------

const RATE_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_RATE_LIMIT = 30;

const tenantBuckets = new Map<string, { count: number; windowStart: number }>();

/** Test hook: clears all tenant buckets between suites. */
export function resetNimRateLimiter(): void {
  tenantBuckets.clear();
}

function resolveRateLimitMax(): number {
  const raw = Number(process.env.NIM_RATE_LIMIT_MAX);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_RATE_LIMIT;
}

function resolveApiKey(): string | null {
  const key = process.env.NIM_API_KEY;
  return key && key.length > 0 ? key : null;
}

function consumeTenantSlot(tenantId: string): boolean {
  const now = Date.now();
  let bucket = tenantBuckets.get(tenantId);
  if (!bucket || now - bucket.windowStart >= RATE_WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    tenantBuckets.set(tenantId, bucket);
  }
  bucket.count++;
  return bucket.count <= resolveRateLimitMax();
}

// ---------------------------------------------------------------------------
// POST /nim — proxied chat completion
// ---------------------------------------------------------------------------

router.post('/nim', async (req: Request, res: Response): Promise<void> => {
  try {
    // Rate limit FIRST: abusive callers pay before any validation work.
    const tenantId = req.user?.tenantId ?? 'default';
    if (!consumeTenantSlot(tenantId)) {
      res.status(429).json({ error: 'NIM proxy rate limit exceeded for this tenant' });
      return;
    }

    const parsed = NimProxySchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: 'Validation failed', details: parsed.error.flatten() });
      return;
    }

    const apiKey = resolveApiKey();
    if (!apiKey) {
      res.status(503).json({ error: 'NIM proxy is not configured (NIM_API_KEY missing)' });
      return;
    }

    const requestedModel = parsed.data.model ?? NIM_DEFAULT_MODEL;
    if (!NIM_ALLOWED_MODELS.includes(requestedModel)) {
      res.status(400).json({
        error: `Model not allowed. Allowed models: ${NIM_ALLOWED_MODELS.join(', ')}`,
      });
      return;
    }

    const body: NimProxyBody = parsed.data;
    const { messages: redactedMessages, redactions } = redactMessages(body.messages);

    let upstream: globalThis.Response;
    try {
      upstream = await fetch(NIM_UPSTREAM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: requestedModel,
          messages: redactedMessages,
          temperature: body.temperature ?? 0.7,
          max_tokens: body.max_tokens ?? 1024,
          stream: false,
        }),
      });
    } catch {
      res.status(502).json({ error: 'NIM upstream unreachable' });
      return;
    }

    if (!upstream.ok) {
      // Relay only the status code — never the upstream body, which can echo
      // account/organization details tied to the server-held key.
      res.status(502).json({ error: 'NIM upstream error', upstreamStatus: upstream.status });
      return;
    }

    const payload = (await upstream.json()) as Record<string, unknown>;
    res.json({ ...payload, redactions });
  } catch (err) {
    console.error('[ai] NIM proxy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
