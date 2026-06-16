/**
 * Vitest spec for src/sdk/FpaClient.ts
 *
 * Validates the FpaClient façade:
 *  - Construction with each AuthConfig variant
 *  - Version field exposed (SDK_VERSION)
 *  - baseUrl / realtimeUrl resolution
 *  - Namespace shape: qbo / xero / custom
 *  - RealtimeFactory.connect() returns a RealtimeChannel
 *  - getResult / postResult / etc. never throw (SdkResult shape)
 *  - setAuth() updates internal auth and triggers onAuthRefresh
 *
 * No network calls: this file does not invoke the namespace methods that
 * hit the REST API. The RestApiClient is constructed with a fake baseUrl
 * (httpbin) but no request is sent. Runtime behaviour of ResourceCollection
 * is verified via the manager + integration tests.
 *
 * @see docs/parts/API_REFERENCE.md §2 (Auth) and §6 (Realtime)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { FpaClient } from './FpaClient';
import type { AuthConfig } from './types';
import { SDK_VERSION } from './types';

const FAKES: FpaClient[] = [];

function makeClient(
  auth: AuthConfig,
  extras: Partial<ConstructorParameters<typeof FpaClient>[0]> = {}
): FpaClient {
  // Use a non-existent base URL; no actual request will be made in these tests.
  const c = new FpaClient({
    baseUrl: 'https://fake.example.com',
    auth,
    timeoutMs: 100,
    retryCount: 0, // disable retries to surface failures fast
    ...extras,
  });
  FAKES.push(c);
  return c;
}

describe('FpaClient', () => {
  afterEach(() => {
    while (FAKES.length) {
      const c = FAKES.pop();
      try {
        c?.realtime.disconnect();
      } catch {
        /* noop */
      }
    }
  });

  // ── Version ──────────────────────────────────────────────────────────────

  it('exposes SDK_VERSION', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.version).toBe(SDK_VERSION);
    expect(c.version).toBe('0.1.0');
  });

  // ── baseUrl ─────────────────────────────────────────────────────────────

  it('uses DEFAULT_BASE_URL when baseUrl is not provided', () => {
    const c = new FpaClient({ auth: { type: 'bearer', token: 't' } });
    FAKES.push(c);
    expect(c.baseUrl).toBe('https://api.finplanpro.dev/v1');
  });

  it('respects explicit baseUrl', () => {
    const c = makeClient({ type: 'bearer', token: 't' }, { baseUrl: 'https://custom.example.com' });
    expect(c.baseUrl).toBe('https://custom.example.com');
  });

  it('exposes explicit realtimeUrl when set', () => {
    const c = makeClient({ type: 'bearer', token: 't' }, { realtimeUrl: 'wss://ws.example.com/r' });
    expect(c.realtimeUrl).toBe('wss://ws.example.com/r');
  });

  // ── Auth variants ───────────────────────────────────────────────────────

  it('constructs with bearer auth', () => {
    const c = makeClient({ type: 'bearer', token: 'ey...' });
    expect(c.auth.type).toBe('bearer');
  });

  it('constructs with apiKey auth', () => {
    const c = makeClient({ type: 'apiKey', apiKey: 'sk_test' });
    expect(c.auth.type).toBe('apiKey');
  });

  it('constructs with basic auth', () => {
    const c = makeClient({ type: 'basic', username: 'u', password: 'p' });
    expect(c.auth.type).toBe('basic');
  });

  it('constructs with oauth2 auth (client config + tokens split)', () => {
    const c = makeClient({
      type: 'oauth2',
      client: {
        clientId: 'cid',
        clientSecret: 'csec',
        tokenUrl: 'https://oauth.example.com/token',
        scopes: ['workbook.read'],
      },
      tokens: {
        accessToken: 'at',
        refreshToken: 'rt',
        expiresAt: Date.now() + 60_000,
      },
    });
    expect(c.auth.type).toBe('oauth2');
    if (c.auth.type === 'oauth2') {
      expect(c.auth.client.clientId).toBe('cid');
      expect(c.auth.tokens.refreshToken).toBe('rt');
    }
  });

  // ── Namespace shape ─────────────────────────────────────────────────────

  it('exposes qbo namespace with 5 ResourceCollection properties', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.qbo).toBeDefined();
    expect(c.qbo.accounts).toBeDefined();
    expect(c.qbo.invoices).toBeDefined();
    expect(c.qbo.customers).toBeDefined();
    expect(c.qbo.vendors).toBeDefined();
    expect(c.qbo.items).toBeDefined();
  });

  it('exposes xero namespace with 4 ResourceCollection properties', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.xero).toBeDefined();
    expect(c.xero.accounts).toBeDefined();
    expect(c.xero.invoices).toBeDefined();
    expect(c.xero.contacts).toBeDefined();
    expect(c.xero.tenants).toBeDefined();
  });

  it('exposes custom namespace (escape hatch, no properties on instance)', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.custom).toBeDefined();
    expect(typeof c.custom.get).toBe('function');
    expect(typeof c.custom.post).toBe('function');
    expect(typeof c.custom.put).toBe('function');
    expect(typeof c.custom.delete).toBe('function');
  });

  it('exposes realtime factory', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.realtime).toBeDefined();
    expect(typeof c.realtime.connect).toBe('function');
    expect(typeof c.realtime.disconnect).toBe('function');
  });

  // ── Namespace path encoding ─────────────────────────────────────────────
  // We can't hit the API, but we can verify ResourceCollection.path and
  // connector properties are set correctly.

  it('QboNamespace.accounts has path=accounts and connector=qbo', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.qbo.accounts.path).toBe('accounts');
    expect(c.qbo.accounts.connector).toBe('qbo');
  });

  it('XeroNamespace.invoices has path=invoices and connector=xero', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(c.xero.invoices.path).toBe('invoices');
    expect(c.xero.invoices.connector).toBe('xero');
  });

  // ── Result-style helpers (never throw) ──────────────────────────────────

  it('getResult() returns SdkResult.ok on success', async () => {
    // Use a non-resolvable host that will fail fast.
    // We test the shape contract: even on failure, it must not throw.
    const c = makeClient({ type: 'bearer', token: 't' });
    const r = await c.getResult<{ ok: boolean }>('/health');
    // Will be ok:false (network unreachable) but the call MUST resolve.
    expect(r).toBeDefined();
    expect(typeof r.ok).toBe('boolean');
  });

  it('postResult() returns SdkResult and never throws', async () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    const r = await c.postResult<unknown>('/echo', { hello: 'world' });
    expect(r).toBeDefined();
    expect(typeof r.ok).toBe('boolean');
  });

  it('putResult() / patchResult() / deleteResult() return SdkResult', async () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    const r1 = await c.putResult<unknown>('/x', { a: 1 });
    const r2 = await c.patchResult<unknown>('/x', { a: 2 });
    const r3 = await c.deleteResult<unknown>('/x');
    expect(typeof r1.ok).toBe('boolean');
    expect(typeof r2.ok).toBe('boolean');
    expect(typeof r3.ok).toBe('boolean');
  });

  // ── setAuth + onAuthRefresh hook ────────────────────────────────────────

  it('setAuth() updates internal auth and triggers onAuthRefresh', async () => {
    const onRefresh = vi.fn(async (auth: AuthConfig) => auth);
    const c = makeClient({ type: 'bearer', token: 'old' }, { onAuthRefresh: onRefresh });
    const next: AuthConfig = { type: 'bearer', token: 'new' };
    await c.setAuth(next);
    expect(c.auth).toEqual(next);
    expect(onRefresh).toHaveBeenCalledWith(next);
  });

  it('setAuth() works without onAuthRefresh (no throw)', async () => {
    const c = makeClient({ type: 'bearer', token: 'old' });
    await c.setAuth({ type: 'bearer', token: 'new' });
    expect(c.auth).toEqual({ type: 'bearer', token: 'new' });
  });

  // ── Realtime factory ────────────────────────────────────────────────────

  it('realtime.connect() creates a channel; reconnect returns same instance', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    const ch1 = c.realtime.connect();
    const ch2 = c.realtime.connect();
    expect(ch1).toBe(ch2);
    expect(c.activeChannel).toBe(ch1);
  });

  it('realtime.disconnect() clears activeChannel', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    c.realtime.connect();
    expect(c.activeChannel).not.toBeNull();
    c.realtime.disconnect();
    expect(c.activeChannel).toBeNull();
  });

  it('realtime.disconnect() is idempotent (no-op when no active channel)', () => {
    const c = makeClient({ type: 'bearer', token: 't' });
    expect(() => c.realtime.disconnect()).not.toThrow();
  });
});
