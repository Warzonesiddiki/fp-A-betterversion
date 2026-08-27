import { afterEach, beforeEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../index.js';
import { JWT_SECRET } from '../config/env.js';
import { db } from '../db/connection.js';
import { resetNimRateLimiter } from './ai.js';

/**
 * Wave 3 (lane R24) — server-side NVIDIA NIM proxy contract tests.
 *
 * Contract under test (server/src/routes/ai.ts):
 *   - JWT required (authMiddleware)
 *   - strict body validation
 *   - server-held NIM_API_KEY (lazy env read); 503 when absent
 *   - fixed server-side upstream allowlist + model whitelist
 *   - redaction pass PORTED from client llmEgress.redactPromptText runs
 *     BEFORE egress (same pass order / placeholders)
 *   - per-tenant in-memory fixed-window rate limiting (429)
 *   - upstream failures surface as sanitized 502s (no body relay)
 */

const USER_ID = 'u-r24-nim';
const API_KEY = 'test-nim-key';

function makeToken(): string {
  return jwt.sign({ id: USER_ID, email: 'r24@finplan.test', role: 'Admin' }, JWT_SECRET, {
    expiresIn: '15m',
  });
}

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/ai/nim — server-held-key NIM proxy', () => {
  let bearer: string;

  beforeAll(() => {
    // The request-audit middleware records user_id per authenticated call,
    // so the JWT actor must exist in users.
    db.prepare(
      `INSERT OR REPLACE INTO users (id, email, password_hash, first_name, last_name, role, is_active)
       VALUES (?, 'r24@finplan.test', 'not-a-real-hash', 'R24', 'Nim', 'Admin', 1)`
    ).run(USER_ID);
    bearer = makeToken();
  });

  beforeEach(() => {
    resetNimRateLimiter();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('401s without a JWT', async () => {
    const res = await request(app).post('/api/ai/nim').send({ messages: [] });
    expect(res.status).toBe(401);
  });

  it('400s on an invalid body (no messages)', async () => {
    const res = await request(app)
      .post('/api/ai/nim')
      .set('Authorization', `Bearer ${bearer}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('503s when NIM_API_KEY is not configured on the server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('upstream must not be reached');
      })
    );
    const res = await request(app)
      .post('/api/ai/nim')
      .set('Authorization', `Bearer ${bearer}`)
      .send({ messages: [{ role: 'user', content: 'hello' }] });
    expect(res.status).toBe(503);
    expect((res.body as { error: string }).error).toMatch(/NIM_API_KEY/i);
  });

  it('redacts prompts before egress and relays the completion with a redaction count', async () => {
    vi.stubEnv('NIM_API_KEY', API_KEY);
    const fetchMock = vi.fn(async (_url: string | URL, _init?: RequestInit) =>
      jsonResponse(200, {
        choices: [{ message: { role: 'assistant', content: 'ok' } }],
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post('/api/ai/nim')
      .set('Authorization', `Bearer ${bearer}`)
      .send({
        messages: [
          {
            role: 'user',
            content:
              'Email alice@example.com owes $1,234,567 on account GL-4020100, IBAN DE89370400440532013000, id 9876543210, key sk-abcdefghijklmnop123456',
          },
        ],
      });
    expect(res.status).toBe(200);
    const body = res.body as { choices?: unknown[]; redactions?: number };
    expect(body.choices).toHaveLength(1);
    // email + secret + iban + gl-account + currency money + bare digit run
    expect(body.redactions).toBe(6);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      { headers: Record<string, string>; body: string },
    ];
    // Fixed server-side allowlist target — never client-influenced.
    expect(url).toBe('https://integrate.api.nvidia.com/v1/chat/completions');
    // Server-held key travels only to the allowlisted upstream.
    expect(init.headers['Authorization']).toBe(`Bearer ${API_KEY}`);

    const sent = JSON.parse(init.body) as { messages: { content: string }[] };
    const out = sent.messages[0]!.content;
    expect(out).toContain('[REDACTED:EMAIL]');
    expect(out).toContain('[REDACTED:MONEY]');
    expect(out).toContain('[REDACTED:GL_ACCOUNT]');
    expect(out).toContain('[REDACTED:IBAN]');
    expect(out).toContain('[REDACTED:DIGITS]');
    expect(out).toContain('[REDACTED:SECRET]');
    expect(out).not.toContain('alice@example.com');
    expect(out).not.toContain('1,234,567');
    expect(out).not.toContain('sk-abcdefghijklmnop123456');
  });

  it('rejects models outside the whitelist before any egress', async () => {
    vi.stubEnv('NIM_API_KEY', API_KEY);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app)
      .post('/api/ai/nim')
      .set('Authorization', `Bearer ${bearer}`)
      .send({
        model: 'not-a-real/model',
        messages: [{ role: 'user', content: 'hello' }],
      });
    expect(res.status).toBe(400);
    expect((res.body as { error: string }).error).toMatch(/Model not allowed/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sanitizes upstream non-OK responses into a 502 without relaying the body', async () => {
    vi.stubEnv('NIM_API_KEY', API_KEY);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(401, {
          detail: 'Incorrect API key: nvapi-SUPER-SECRET-ORG-DETAILS',
        })
      )
    );

    const res = await request(app)
      .post('/api/ai/nim')
      .set('Authorization', `Bearer ${bearer}`)
      .send({ messages: [{ role: 'user', content: 'hello' }] });
    expect(res.status).toBe(502);
    expect((res.body as { upstreamStatus?: number }).upstreamStatus).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain('SUPER-SECRET');
  });

  it('maps upstream connection failures to 502', async () => {
    vi.stubEnv('NIM_API_KEY', API_KEY);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      })
    );

    const res = await request(app)
      .post('/api/ai/nim')
      .set('Authorization', `Bearer ${bearer}`)
      .send({ messages: [{ role: 'user', content: 'hello' }] });
    expect(res.status).toBe(502);
  });

  it('rate-limits per tenant with an in-memory fixed window', async () => {
    vi.stubEnv('NIM_API_KEY', API_KEY);
    vi.stubEnv('NIM_RATE_LIMIT_MAX', '2');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { choices: [] }))
    );

    const send = () =>
      request(app)
        .post('/api/ai/nim')
        .set('Authorization', `Bearer ${bearer}`)
        .send({ messages: [{ role: 'user', content: 'hello' }] });

    expect((await send()).status).toBe(200);
    expect((await send()).status).toBe(200);
    const third = await send();
    expect(third.status).toBe(429);
    expect((third.body as { error: string }).error).toMatch(/rate limit/i);
  });
});
