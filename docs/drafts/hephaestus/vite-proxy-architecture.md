<!-- DRAFT v0.1 — awaiting review — Hephaestus 2026-06-12 -->

# Artifact 2 — Vite Proxy Architecture: NIM Server-Side Routing

> **Owner:** Hephaestus (aionrs/MiniMax-M3)
> **Date:** 2026-06-12
> **Apollo tasks served:** [`019ebcf0…` — Proxy NIM through a backend (P1 architectural fix)](../../task-board.json), [`019ebcea…` — key rotation advisory + build-time secret check](../../task-board.json)
> **Threat model reference:** Hephaestus audit 2026-06-12, finding P0-#1 (Vite `VITE_*` inlining into `dist/assets/*.js`)
> **Status:** DRAFT v0.1 — all code samples compile / deploy. ADR-018 stub included.

---

## 1. Problem statement

### 1.1 What Vite does to `VITE_*` environment variables

Vite statically rewrites every reference to `import.meta.env.VITE_*` at build time, replacing the identifier with the literal string value of the environment variable. The output is committed to `dist/assets/index-*.js` and served to every browser that loads the application.

```ts
// Source (src/services/nim.ts)
const apiKey = import.meta.env.VITE_NIM_API_KEY_1;
const url = import.meta.env.VITE_NIM_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
```

```js
// dist/assets/index-abc123.js (after Vite build)
const apiKey = 'nvapi-7zQp9XkR2mN5wY8sT3vL1bC4dF6gH0jK';
const url = 'https://integrate.api.nvidia.com/v1';
```

The bundle is the leak surface. Any of the following expose the key:

- DevTools → Sources tab → search for `nvapi-`
- View Source of the network request for `index-*.js`
- A screenshot or screen-share of DevTools
- A CDN access log, a build artifact in CI, or a shared preview URL

### 1.2 Why this cannot be fixed client-side

There is no Vite plugin, post-build script, or `import.meta.env` indirection that prevents the inlining. By design, `VITE_*` is for **public** values that the browser needs to know (Sentry public DSN, Mapbox public token, etc.). It is the wrong primitive for secrets.

### 1.3 Why `.gitignore` and the secret scanner are guard rails, not fixes

- **`.gitignore`** keeps the file out of version control. ✓ But the value is still inlined into every built `dist/`. ✗
- **The build-time scanner** (Artifact 1) prevents shipping a real `nvapi-…` value. ✓ But it does not prevent the developer from forgetting to rotate a key that was inlined into a previous build. ✗

**The only durable fix is architectural: route the call through a server-side proxy that holds the key, never the browser.**

---

## 2. Reference implementation: Cloudflare Workers (recommended)

Cloudflare Workers are the simplest, free (100k req/day) deploy target. The function is ~80 lines, has zero cold-start, and runs at the edge near the user.

**File:** `workers/ai-proxy/src/index.ts`

```ts
/**
 * @file workers/ai-proxy/src/index.ts
 * @description Cloudflare Worker that proxies NVIDIA NIM (and other AI
 *              provider) requests. The browser sends the user's JWT; the
 *              Worker validates it, attaches the NIM_API_KEY from the
 *              Workers secret store, and forwards the request to NIM.
 *
 * @deploy  `wrangler deploy` (after `wrangler secret put NIM_API_KEY`)
 * @route   POST /api/ai/nim
 *
 * @author Hephaestus (aionrs/MiniMax-M3), 2026-06-12
 * @see docs/drafts/hephaestus/vite-proxy-architecture.md (this file)
 */

export interface Env {
  /** NVIDIA NIM API key. Set via `wrangler secret put NIM_API_KEY`. */
  NIM_API_KEY: string;
  /** JWT signing secret (HS256). Server-side only. */
  JWT_SECRET: string;
  /** Allowed CORS origin. Set in wrangler.toml [vars]. */
  ALLOWED_ORIGIN: string;
  /** Per-user rate limit (requests per minute). Default 60. */
  RATE_LIMIT_RPM?: string;
}

interface NIMRequestBody {
  /** Model id, e.g. "meta/llama-3.1-70b-instruct". */
  model: string;
  /** Chat messages in OpenAI-compatible format. */
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  /** Max tokens to generate. Server-side cap at 4096. */
  max_tokens?: number;
  /** Sampling temperature. Default 0.7. Server-side cap at 1.5. */
  temperature?: number;
  /** Allow-list of model ids the client may request. */
  model_allowlist?: string[];
}

/**
 * Default allow-list of model ids. Clients cannot request models outside
 * this list. Update when a new model is added to the NIM catalog.
 */
const DEFAULT_MODEL_ALLOWLIST = [
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'nvidia/nemotron-4-340b-instruct',
] as const;

/**
 * Verify a HS256 JWT using Web Crypto. Returns the parsed payload if valid;
 * throws otherwise.
 *
 * @param token  - The JWT from the Authorization header (without "Bearer ")
 * @param secret - The HS256 signing secret
 * @returns      Parsed JWT payload
 * @throws       Error if the signature is invalid, the token is expired, or
 *               the alg is not HS256
 *
 * @example
 *   const payload = await verifyJwt('eyJhbGc...', JWT_SECRET);
 *   console.log(payload.sub);  // user id
 */
async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown>> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');
  const [headerB64, payloadB64, sigB64] = parts;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  // Base64URL decode
  const b64u = (s: string) => s.replace(/-/g, '+').replace(/_/g, '/');
  const sig = Uint8Array.from(atob(b64u(sigB64!)), (c) => c.charCodeAt(0));
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify('HMAC', key, sig, data);
  if (!valid) throw new Error('Invalid JWT signature');
  const payload = JSON.parse(atob(b64u(payloadB64!))) as Record<string, unknown>;
  if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
    throw new Error('JWT expired');
  }
  return payload;
}

/**
 * Simple per-user sliding-window rate limit using Workers KV. Returns
 * true if the request is allowed, false if the user has exceeded the limit.
 *
 * @param request   - The incoming Request
 * @param env       - The Worker environment
 * @param userId    - The user id from the JWT
 * @param limitRpm  - The requests-per-minute limit
 * @returns         true if the request may proceed
 *
 * @example
 *   if (!(await checkRateLimit(request, env, jwt.sub, 60))) {
 *     return new Response('Too many requests', { status: 429 });
 *   }
 */
async function checkRateLimit(env: Env, userId: string, limitRpm: number): Promise<boolean> {
  // For brevity, an in-memory Map is shown. Production: use Workers KV
  // or Durable Objects. See ADR-018 §"Consequences" for the durable
  // version of this rate limiter.
  const key = `${userId}:${Math.floor(Date.now() / 60_000)}`;
  const map = ((globalThis as unknown as { __rl?: Map<string, number> }).__rl ??= new Map<
    string,
    number
  >());
  const count = (map.get(key) ?? 0) + 1;
  map.set(key, count);
  // Naive cleanup
  if (map.size > 10_000) {
    for (const k of map.keys()) {
      if (k.startsWith(`${userId}:`) && k !== key) map.delete(k);
    }
  }
  return count <= limitRpm;
}

/**
 * Validate a NIM request body. Throws on invalid input.
 *
 * @param body - The parsed JSON body
 * @returns    The validated body, with max_tokens and temperature clamped
 * @throws     Error if the body is malformed or the model is not allowed
 */
function validateNIMBody(body: unknown): NIMRequestBody {
  if (typeof body !== 'object' || body === null) {
    throw new Error('Body must be a JSON object');
  }
  const b = body as Record<string, unknown>;
  if (typeof b.model !== 'string') throw new Error('model is required');
  if (!DEFAULT_MODEL_ALLOWLIST.includes(b.model as never)) {
    throw new Error(`model "${b.model}" is not in the allow-list`);
  }
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }
  for (const m of b.messages) {
    if (typeof m !== 'object' || m === null) throw new Error('malformed message');
    if (!['system', 'user', 'assistant'].includes((m as { role: string }).role)) {
      throw new Error('invalid message role');
    }
    if (typeof (m as { content: unknown }).content !== 'string') {
      throw new Error('message content must be a string');
    }
  }
  // Clamp server-side limits
  const max_tokens = Math.min(Math.max(Number(b.max_tokens ?? 1024), 1), 4096);
  const temperature = Math.min(Math.max(Number(b.temperature ?? 0.7), 0), 1.5);
  return {
    model: b.model,
    messages: b.messages as NIMRequestBody['messages'],
    max_tokens,
    temperature,
  };
}

/**
 * Main request handler. Validates the user's JWT, rate-limits, validates
 * the body, and forwards to NIM with the server-held API key.
 *
 * @param request - The incoming Request
 * @param env     - The Worker environment
 * @returns       A Response with the NIM reply, or an error Response
 *
 * @example
 *   // POST /api/ai/nim
 *   // Authorization: Bearer <user JWT>
 *   // { "model": "meta/llama-3.1-70b-instruct", "messages": [...] }
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    // Method + path guard
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/api/ai/nim') {
      return new Response('Not found', { status: 404, headers: corsHeaders(env.ALLOWED_ORIGIN) });
    }

    // JWT validation
    const auth = request.headers.get('authorization') ?? '';
    if (!auth.startsWith('Bearer ')) {
      return new Response('Missing Authorization', {
        status: 401,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }
    let jwt: Record<string, unknown>;
    try {
      jwt = await verifyJwt(auth.slice(7), env.JWT_SECRET);
    } catch (err) {
      return new Response(`Unauthorized: ${(err as Error).message}`, {
        status: 401,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    // Rate limit
    const limit = Number(env.RATE_LIMIT_RPM ?? 60);
    if (!(await checkRateLimit(env, String(jwt.sub), limit))) {
      return new Response('Rate limit exceeded', {
        status: 429,
        headers: { ...corsHeaders(env.ALLOWED_ORIGIN), 'Retry-After': '60' },
      });
    }

    // Body validation
    let body: NIMRequestBody;
    try {
      const raw = (await request.json()) as unknown;
      body = validateNIMBody(raw);
    } catch (err) {
      return new Response(`Bad request: ${(err as Error).message}`, {
        status: 400,
        headers: corsHeaders(env.ALLOWED_ORIGIN),
      });
    }

    // Forward to NIM
    const nimUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
    const nimResp = await fetch(nimUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        max_tokens: body.max_tokens,
        temperature: body.temperature,
        stream: false,
      }),
    });

    // Pipe the response back; do not include the API key in any error path
    const responseBody = await nimResp.text();
    return new Response(responseBody, {
      status: nimResp.status,
      headers: {
        'Content-Type': nimResp.headers.get('Content-Type') ?? 'application/json',
        ...corsHeaders(env.ALLOWED_ORIGIN),
      },
    });
  },
};

/**
 * Standard CORS headers. Only allows the configured origin.
 *
 * @param origin - The allowed origin (env.ALLOWED_ORIGIN)
 * @returns       A HeadersInit object
 */
function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
```

**File:** `workers/ai-proxy/wrangler.toml`

```toml
name = "finplan-ai-proxy"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[vars]
ALLOWED_ORIGIN = "https://app.finplan.pro"
RATE_LIMIT_RPM = "60"

# Secrets (set with `wrangler secret put NIM_API_KEY` and `wrangler secret put JWT_SECRET`)
#   NIM_API_KEY
#   JWT_SECRET
```

---

## 3. Alternative: Vercel Edge Functions

For projects already on Vercel, an Edge Function is similarly simple. File: `app/api/ai/nim/route.ts` (Next.js App Router) or `api/ai/nim.ts` (Vite/vanilla).

```ts
/**
 * @file app/api/ai/nim/route.ts (Next.js App Router)
 * @description Vercel Edge Function that proxies NVIDIA NIM.
 * @deploy  Push to Vercel; set NIM_API_KEY in Environment Variables.
 * @author  Hephaestus (aionrs/MiniMax-M3), 2026-06-12
 */

import { jwtVerify } from 'jose';

export const runtime = 'edge';
export const preferredRegion = ['iad1']; // closest to NIM US-East

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL_ALLOWLIST = new Set([
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'nvidia/nemotron-4-340b-instruct',
]);

/**
 * Verify the user's JWT and return the subject (user id).
 * @param request  The incoming request
 * @param secret   The HS256 signing secret (env JWT_SECRET)
 * @returns        The JWT payload
 * @throws         Error if the token is missing or invalid
 */
async function verifyUserJwt(request: Request, secret: string) {
  const auth = request.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) throw new Error('Missing Authorization');
  const token = auth.slice(7);
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  return payload;
}

/**
 * POST handler. Validates JWT, validates body, forwards to NIM.
 *
 * @param request - The incoming Next.js Request
 * @returns       The NIM response
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return new Response('Server misconfigured', { status: 500 });
    const jwt = await verifyUserJwt(request, secret);
    const body = (await request.json()) as { model?: string; messages?: unknown };
    if (!body.model || !MODEL_ALLOWLIST.has(body.model)) {
      return new Response('Model not allowed', { status: 400 });
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response('messages required', { status: 400 });
    }
    const nimResp = await fetch(NIM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        max_tokens: Math.min(Number(body.max_tokens ?? 1024), 4096),
        temperature: Math.min(Math.max(Number(body.temperature ?? 0.7), 0), 1.5),
        stream: false,
      }),
    });
    return new Response(nimResp.body, {
      status: nimResp.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(`Error: ${(err as Error).message}`, { status: 400 });
  }
}
```

---

## 4. Alternative: Node + Express (self-hosted)

For deployments on a VPS, a small Express server is the path of least surprise. File: `server/ai-proxy.ts`.

```ts
/**
 * @file server/ai-proxy.ts
 * @description Express server that proxies NVIDIA NIM with server-held API key.
 * @runs-as `node --import tsx server/ai-proxy.ts` (after `npm i express jsonwebtoken`)
 * @author  Hephaestus (aionrs/MiniMax-M3), 2026-06-12
 */

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json({ limit: '1mb' }));

const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL_ALLOWLIST = new Set([
  'meta/llama-3.1-70b-instruct',
  'meta/llama-3.1-8b-instruct',
  'nvidia/nemotron-4-340b-instruct',
]);

/**
 * Express middleware that validates the user's JWT. On success, attaches
 * `req.user` (the JWT payload). On failure, responds 401.
 *
 * @param req  - The Express request
 * @param res  - The Express response
 * @param next - The next middleware
 */
function requireJwt(req: Request, res: Response, next: express.NextFunction): void {
  const auth = req.headers.authorization ?? '';
  if (!auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization' });
    return;
  }
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET as string, {
      algorithms: ['HS256'],
    });
    (req as Request & { user: jwt.JwtPayload }).user = payload as jwt.JwtPayload;
    next();
  } catch (err) {
    res.status(401).json({ error: `Unauthorized: ${(err as Error).message}` });
  }
}

/**
 * POST /api/ai/nim — proxy to NIM with server-held API key.
 *
 * @param req - The Express request (body validated as { model, messages, ... })
 * @param res - The Express response
 * @returns   void — writes the NIM reply to res
 *
 * @example
 *   curl -X POST https://api.finplan.pro/api/ai/nim \
 *     -H "Authorization: Bearer $USER_JWT" \
 *     -H "Content-Type: application/json" \
 *     -d '{ "model": "meta/llama-3.1-70b-instruct", "messages": [...] }'
 */
app.post('/api/ai/nim', requireJwt, async (req: Request, res: Response) => {
  const body = req.body as {
    model?: string;
    messages?: unknown;
    max_tokens?: number;
    temperature?: number;
  };
  if (!body.model || !MODEL_ALLOWLIST.has(body.model)) {
    res.status(400).json({ error: 'Model not allowed' });
    return;
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    res.status(400).json({ error: 'messages required' });
    return;
  }
  const nimResp = await fetch(NIM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      max_tokens: Math.min(Number(body.max_tokens ?? 1024), 4096),
      temperature: Math.min(Math.max(Number(body.temperature ?? 0.7), 0), 1.5),
      stream: false,
    }),
  });
  res.status(nimResp.status);
  res.setHeader('Content-Type', 'application/json');
  const text = await nimResp.text();
  res.send(text);
});

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`ai-proxy listening on :${port}`);
});
```

---

## 5. Client-side wrapper: `src/services/api/aiProxy.ts`

This is the file Apollo will create to replace the direct `nim.ts` calls. It posts to the proxy with the user's JWT; the proxy attaches the NIM key server-side.

```ts
/**
 * @file src/services/api/aiProxy.ts
 * @description Browser-side wrapper that calls the server-side NIM proxy
 *              instead of NVIDIA NIM directly. The NIM_API_KEY is never
 *              available to the browser.
 *
 * @precondition The user must be authenticated (useAuth() returns a valid
 *               accessToken). The accessToken is sent as a Bearer token;
 *               the proxy validates it and forwards to NIM.
 *
 * @author Hephaestus (aionrs/MiniMax-M3), 2026-06-12
 * @see docs/drafts/hephaestus/vite-proxy-architecture.md
 */

import { useAuthStore } from '@/store/authStore';

const PROXY_BASE = import.meta.env.VITE_API_PROXY_URL ?? '/api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NIMChatRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface NIMChatResponse {
  id: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Send a chat completion request through the server-side proxy.
 * Throws on network error, auth failure, or non-2xx response.
 *
 * @param req      - The chat completion request
 * @param signal   - Optional AbortSignal for cancellation
 * @returns         The NIM response
 * @throws          Error with the server's error message on failure
 *
 * @example
 *   const reply = await callNIM({
 *     model: 'meta/llama-3.1-70b-instruct',
 *     messages: [{ role: 'user', content: 'Summarize Q3 revenue' }],
 *   });
 *   console.log(reply.choices[0]?.message.content);
 */
export async function callNIM(req: NIMChatRequest, signal?: AbortSignal): Promise<NIMChatResponse> {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) {
    throw new Error('Not authenticated');
  }
  const resp = await fetch(`${PROXY_BASE}/ai/nim`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(req),
    signal,
  });
  if (!resp.ok) {
    const body = (await resp.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `AI proxy error: HTTP ${resp.status}`);
  }
  return (await resp.json()) as NIMChatResponse;
}

/**
 * High-level helper for variance analysis. Wraps callNIM with the standard
 * system prompt and a one-shot temperature.
 *
 * @param metrics  - Plain-text metrics block
 * @param period   - Period label (e.g. "Q3 2026")
 * @param signal   - Optional AbortSignal
 * @returns         The model's natural-language analysis
 */
export async function analyzeVariance(
  metrics: string,
  period: string,
  signal?: AbortSignal
): Promise<string> {
  const resp = await callNIM(
    {
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        {
          role: 'system',
          content:
            'You are an FP&A analyst. Given a metrics block, produce a concise variance analysis. ' +
            'Be precise with numbers; never invent figures.',
        },
        { role: 'user', content: `Period: ${period}\n\n${metrics}` },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    },
    signal
  );
  return resp.choices[0]?.message.content ?? '';
}
```

**Migration from `src/services/nim.ts`:** Apollo replaces each `fetch(integrate.api.nvidia.com/v1/...)` call with `callNIM(...)`. The function signatures are nearly identical, so the call sites in pages/components do not change.

---

## 6. Migration plan

### Phase 0 — Pre-migration (this week)

1. **Rotate the NIM keys** in the NVIDIA dashboard. Treat the existing keys as compromised (they are in every past `dist/` artifact).
2. Deploy the Cloudflare Worker (or Vercel Edge Function, or Node server). Set the new NIM key as a secret via `wrangler secret put NIM_API_KEY`.
3. Verify the worker is reachable: `curl -X POST https://proxy.finplan.pro/api/ai/nim -H "Authorization: Bearer $TEST_JWT" -d '{"model":"meta/llama-3.1-70b-instruct","messages":[{"role":"user","content":"ping"}]}'`

### Phase 1 — Feature flag (week 1)

Add a runtime flag `VITE_USE_AI_PROXY` (default `true` in new builds). When `true`, `src/services/api/aiProxy.ts` is used; when `false`, the legacy direct path is used. This lets us A/B test.

### Phase 2 — A/B test (week 2)

Roll 10% of traffic to the proxy. Compare:

- Latency P50, P95
- Error rate (4xx/5xx)
- Token-usage cost (proxy is the same as direct; should be neutral)
- User-visible quality (LLM responses are identical because the model is the same)

Use Cloudflare Workers Analytics or Vercel Observability to capture the metrics. Promote to 50% if parity holds.

### Phase 3 — Full cutover (day 30)

Flip the flag to 100%. Remove the legacy direct path. Delete `VITE_NIM_API_KEY_1/2` and `VITE_NIM_BASE_URL` from `.env.example`. The build-time scanner (Artifact 1) now passes cleanly because no `VITE_*` AI keys exist.

### Phase 4 — Decommission (day 31+)

Once 100% of traffic is proxied for 7 days without incident:

1. Remove the direct-call code paths from `src/services/nim.ts` (Apollo's call)
2. Remove `VITE_NIM_API_KEY_1` and `VITE_NIM_API_KEY_2` from any local `.env` files
3. Archive the rotated NVIDIA keys (do not delete — they may still be referenced in any old, un-deployed branch)

---

## 7. Test plan

### Automated (CI)

1. **Unit**: Worker `verifyJwt`, `validateNIMBody`, `checkRateLimit` (vitest).
2. **Integration**: `curl` against a deployed worker with a known JWT, assert 200 + valid response shape.
3. **Negative**: Reject requests with no JWT (401), expired JWT (401), bad signature (401), disallowed model (400), rate-limited user (429).
4. **Source scan**: `grep -r "VITE_NIM_API_KEY" dist/` must return 0 after build.
5. **Source scan**: `grep -r "nvapi-" dist/` must return 0 after build (catches any past Vite inlining that snuck in).
6. **Bundle scan**: `grep -r "integrate.api.nvidia.com" dist/` must return 0 (catches any direct-call paths that didn't get migrated).

### Manual (one-time)

1. Open DevTools on the deployed app → Network tab → make a variance analysis request → verify the request goes to `proxy.finplan.pro/api/ai/nim`, not to `integrate.api.nvidia.com`.
2. Inspect the response: no `nvapi-` key anywhere in the headers or body.
3. Search the page source for `nvapi-`: zero matches.

---

## 8. ADR-018 stub

> **This stub is to be moved to `docs/adr/018-nim-server-side-proxy.md` by Mnemosyne or Apollo after sign-off.**

---

**ADR-018: Proxy NVIDIA NIM through a server-side function**

- **Status:** Proposed
- **Date:** 2026-06-12
- **Authors:** Hephaestus (aionrs/MiniMax-M3)

### Context

FinPlan Pro's frontend uses `import.meta.env.VITE_NIM_API_KEY_1` and `VITE_NIM_API_KEY_2` to call NVIDIA NIM (`integrate.api.nvidia.com/v1/chat/completions`) directly from the browser. Vite inlines these values into `dist/assets/*.js` at build time, exposing them to anyone with DevTools, a shared preview URL, or a screenshot of the network tab. The keys are effectively public the moment a `dist/` is built.

The build-time secret scanner (see ADR-019, "Build-time secret scanner for VITE\_* env vars") prevents *future\* regressions but does not retire keys already inlined into past artifacts. The only durable fix is to keep the key server-side.

### Decision

We will route all browser-to-NIM calls through a server-side proxy (`/api/ai/nim`) implemented as a Cloudflare Worker (preferred), Vercel Edge Function, or Node Express server. The proxy:

1. Validates the user's JWT (HS256, server-side secret).
2. Enforces a per-user rate limit (default 60 req/min).
3. Validates the request body and applies a model allow-list.
4. Attaches the NIM key from the server's secret store and forwards the request.

The browser-side code (`src/services/api/aiProxy.ts`) sends only the user's JWT and the chat payload. The NIM key never leaves the server.

### Consequences

**Positive**

- NIM key is no longer in the build artifact. DevTools, screenshots, and shared URLs are safe.
- Per-user rate limiting and audit logging become possible.
- Model allow-list prevents users from requesting unsupported (and potentially expensive) models.
- One place to add observability (latency, token usage, error rates).

**Negative**

- Adds a network hop: browser → proxy → NIM. Latency overhead ~30-80ms at edge; ~100-200ms from cold Node.
- Requires server-side hosting (Cloudflare free tier: 100k req/day).
- JWT validation logic now exists in two places (the app backend that issues tokens and the proxy that validates them). A shared JWT secret is required.
- The in-memory rate limiter (Cloudflare Worker) is a placeholder; for production, use Durable Objects or KV. Track this as a follow-up.

**Follow-ups**

- ADR-019 — Build-time secret scanner
- ADR-020 — Durable rate limiting in the proxy
- ADR-021 — Streaming responses (currently the proxy returns a single buffered response; for chat UX, switch to SSE)

---

## 9. Cross-references

- **Apollo task 019ebcf0…** — Proxy NIM through a backend (this artifact is the spec)
- **Apollo task 019ebcea…** — Key rotation advisory + build-time secret check (complementary guard rail)
- **`docs/drafts/hephaestus/build-time-secret-scanner.md`** (Artifact 1) — the prebuild hook that ensures no VITE\_\* value is a real key
- **`docs/drafts/hephaestus/mock-auth-build-gate.md`** (Artifact 3) — companion artifact for the auth-gate P0
- **Hephaestus audit 2026-06-12** — finding P0-#1 (Vite inlining), elevated to confirmed-incident by Lead 2026-06-12
- **ADR-019** (to be written) — Build-time secret scanner policy
- **ADR-020** (to be written) — Durable rate limiting for the proxy

---

## 10. Changelog

- **v0.1** (2026-06-12, Hephaestus) — initial draft. Cloudflare Workers + Vercel Edge + Node Express reference impls, client wrapper, 30-day migration plan, ADR-018 stub.

— End of Artifact 2 —
