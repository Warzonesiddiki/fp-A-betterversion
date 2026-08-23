/**
 * W6-P0-13 api-origin-truth — defect spec for the SDK REST origin.
 *
 * Captures the integration-truth defect: the client previously defaulted to a
 * fictional `https://api.finplanpro.dev/v1` host with an empty bearer token,
 * so every GL publish sailed off to a host that does not exist while the real
 * Express server (server/, port 3001) got zero traffic.
 *
 * Shipped contract under test:
 *  1. Base URL resolves from `import.meta.env.VITE_API_URL`; unset/blank ⇒
 *     every operation rejects with `ApiNotConfiguredError` BEFORE any
 *     transport delegation — no network attempt to any host.
 *  2. With `VITE_API_URL` set, requests target that origin.
 *  3. `tokenSource` pulls the bearer credential lazily per request (e.g. from
 *     authStore via a getState() accessor); an empty credential rejects with
 *     `ApiNotConfiguredError` unless the auth config explicitly sets
 *     `allowAnonymous: true`.
 *
 * The RestApiClient module is replaced with a recording fake: this spec pins
 * FpaClient's OWN logic (env resolution, guard ordering, header merge) and
 * proves zero transport delegation when unconfigured. RestApiClient internals
 * keep their own specs.
 *
 * @module sdk/apiOrigin.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  constructed: [] as { baseUrl: string }[],
  requests: [] as {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    params?: unknown;
    data?: unknown;
  }[],
}));

vi.mock('../services/api-integration/RestApiClient', () => ({
  RestApiClient: class {
    public constructor(baseUrl: string) {
      h.constructed.push({ baseUrl });
    }
    public request<T>(config: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      params?: unknown;
      data?: unknown;
    }): Promise<{ data: T; status: number; statusText: string; headers: Record<string, string> }> {
      h.requests.push(config);
      return Promise.resolve({ data: {} as T, status: 200, statusText: 'OK', headers: {} });
    }
    public setOAuthTokens(): void {
      /* oauth2-only path, unused by these bearer tests */
    }
  },
}));

import { FpaClient } from './FpaClient';
import { ApiNotConfiguredError } from './types';

describe('api-origin-truth (W6-P0-13)', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    h.constructed.length = 0;
    h.requests.length = 0;
    // Treat "unset" and "blank" identically in every test unless overridden.
    vi.stubEnv('VITE_API_URL', '');
    if (typeof globalThis.fetch === 'function') {
      fetchSpy = vi.spyOn(globalThis, 'fetch');
    }
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
    fetchSpy = null;
    vi.unstubAllEnvs();
  });

  // ── 1. Unconfigured origin fails fast, honestly ────────────────────────────

  it('unset VITE_API_URL: operations reject ApiNotConfiguredError before any transport call', async () => {
    const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    expect(client.baseUrl).toBe('');

    await expect(client.get('/api/gl/entries')).rejects.toBeInstanceOf(ApiNotConfiguredError);
    await expect(
      client.request({ method: 'POST', url: '/api/gl/bulk', data: {} })
    ).rejects.toBeInstanceOf(ApiNotConfiguredError);

    // Zero delegation into the REST layer — nothing can reach any host.
    expect(h.requests).toHaveLength(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the rejection message says how to configure the origin', async () => {
    const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    const err = await client.get('/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiNotConfiguredError);
    expect((err as Error).message).toContain('VITE_API_URL');
  });

  it('blank-string VITE_API_URL behaves exactly like unset', async () => {
    vi.stubEnv('VITE_API_URL', '   ');
    const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    await expect(client.get('/x')).rejects.toBeInstanceOf(ApiNotConfiguredError);
    expect(h.requests).toHaveLength(0);
  });

  it('explicit empty baseUrl overrides a configured env (caller forcing unconfigured)', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    const client = new FpaClient({ baseUrl: '', auth: { type: 'bearer', token: 't' } });
    await expect(client.get('/x')).rejects.toBeInstanceOf(ApiNotConfiguredError);
    expect(h.requests).toHaveLength(0);
  });

  it('result-style helpers surface API_NOT_CONFIGURED instead of throwing', async () => {
    const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    const r = await client.postResult<unknown>('/api/gl/bulk', {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('API_NOT_CONFIGURED');
    expect(h.requests).toHaveLength(0);
  });

  it('realtime.connect() rejects when the origin is unconfigured', () => {
    const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    expect(() => client.realtime.connect()).toThrow(ApiNotConfiguredError);
  });

  // ── 2. Configured origin routes traffic there ─────────────────────────────

  it('set VITE_API_URL: the client is constructed against that origin', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    const client = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    expect(client.baseUrl).toBe('http://localhost:3001');
    await client.get('/health');
    expect(h.constructed[0]?.baseUrl).toBe('http://localhost:3001');
    expect(h.requests[0]?.url).toBe('/health');
  });

  it('explicit baseUrl still wins over env', () => {
    vi.stubEnv('VITE_API_URL', 'http://from-env:3001');
    const client = new FpaClient({
      baseUrl: 'https://explicit.example.com',
      auth: { type: 'bearer', token: 't' },
    });
    expect(client.baseUrl).toBe('https://explicit.example.com');
    expect(h.constructed[0]?.baseUrl).toBe('https://explicit.example.com');
  });

  // ── 3. Lazy bearer token sourcing ─────────────────────────────────────────

  it('tokenSource supplies Authorization per request (lazy, not captured at construction)', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    let token = 'tok-first';
    const client = new FpaClient({
      auth: { type: 'bearer', token: '' },
      tokenSource: () => token,
    });

    await client.get('/api/gl/entries');
    expect(h.requests[0]?.headers?.Authorization).toBe('Bearer tok-first');

    token = 'tok-rotated';
    await client.get('/api/gl/entries');
    expect(h.requests[1]?.headers?.Authorization).toBe('Bearer tok-rotated');
  });

  it('empty tokenSource result rejects with ApiNotConfiguredError and never delegates', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    const client = new FpaClient({
      auth: { type: 'bearer', token: '' },
      tokenSource: () => '',
    });
    await expect(client.post('/api/gl/bulk', {})).rejects.toBeInstanceOf(ApiNotConfiguredError);
    expect(h.requests).toHaveLength(0);
  });

  it('allowAnonymous:true permits an empty token without an Authorization header', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    const client = new FpaClient({
      auth: { type: 'bearer', token: '', allowAnonymous: true },
      tokenSource: () => '',
    });
    await client.get('/public/health');
    expect(h.requests[0]?.headers?.['Authorization']).toBeUndefined();
  });

  it('caller-supplied headers survive the auth-header merge', async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    const client = new FpaClient({
      auth: { type: 'bearer', token: '' },
      tokenSource: () => 'tok-live',
    });
    await client.request({
      method: 'POST',
      url: '/api/gl/bulk',
      headers: { 'Idempotency-Key': 'idem-1' },
      data: {},
    });
    expect(h.requests[0]?.headers?.['Idempotency-Key']).toBe('idem-1');
    expect(h.requests[0]?.headers?.Authorization).toBe('Bearer tok-live');
  });
});
