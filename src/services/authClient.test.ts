import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthClient, AuthRequestError } from './authClient';

const BASE = 'http://test.local/api';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

function makeFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) =>
    handler(String(url), init ?? {})
  );
}

const serverUser = {
  id: 'user-001',
  email: 'admin@finplan.com',
  firstName: 'Ada',
  lastName: 'Admin',
  role: 'Admin',
  entityId: 'entity-001',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('AuthClient', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('login', () => {
    it('POSTs credentials to /auth/login and returns the typed pair', async () => {
      const fetchImpl = makeFetch((url, init) => {
        expect(url).toBe(`${BASE}/auth/login`);
        expect(init.method).toBe('POST');
        expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
        expect(JSON.parse(String(init.body))).toEqual({
          email: 'admin@finplan.com',
          password: 'secret',
        });
        return jsonResponse(200, {
          user: serverUser,
          accessToken: 'at-1',
          refreshToken: 'rt-1',
        });
      });
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const result = await client.login('admin@finplan.com', 'secret');

      expect(fetchImpl).toHaveBeenCalledTimes(1);
      expect(result.accessToken).toBe('at-1');
      expect(result.refreshToken).toBe('rt-1');
      expect(result.user).toEqual(serverUser);
    });

    it('maps a 401 with attemptsRemaining onto AuthRequestError', async () => {
      const fetchImpl = makeFetch(() =>
        jsonResponse(401, { error: 'Invalid email or password', attemptsRemaining: 2 })
      );
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.login('admin@finplan.com', 'wrong').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      const authErr = err as AuthRequestError;
      expect(authErr.status).toBe(401);
      expect(authErr.code).toBe('UNAUTHORIZED');
      expect(authErr.attemptsRemaining).toBe(2);
      expect(authErr.message).toBe('Invalid email or password');
    });

    it('maps a 423 lockout onto a LOCKED error with lockedUntil', async () => {
      const fetchImpl = makeFetch(() =>
        jsonResponse(423, {
          error: 'Account is locked due to too many failed login attempts.',
          lockedUntil: '2026-08-25T12:15:00.000Z',
        })
      );
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.login('admin@finplan.com', 'pw').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      const authErr = err as AuthRequestError;
      expect(authErr.status).toBe(423);
      expect(authErr.code).toBe('LOCKED');
      expect(authErr.lockedUntil).toBe('2026-08-25T12:15:00.000Z');
    });

    it('maps a 429 rate limit onto a RATE_LIMITED error with retryAfterSeconds', async () => {
      const fetchImpl = makeFetch(() =>
        jsonResponse(429, {
          error: 'Too many authentication attempts for this account. Try again later.',
          retryAfterSeconds: 60,
        })
      );
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.login('admin@finplan.com', 'pw').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      const authErr = err as AuthRequestError;
      expect(authErr.status).toBe(429);
      expect(authErr.code).toBe('RATE_LIMITED');
      expect(authErr.retryAfterSeconds).toBe(60);
    });

    it('normalizes network failures to status 0 / NETWORK_ERROR', async () => {
      const fetchImpl = makeFetch(() => {
        throw new Error('connection refused');
      });
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.login('admin@finplan.com', 'pw').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      const authErr = err as AuthRequestError;
      expect(authErr.status).toBe(0);
      expect(authErr.code).toBe('NETWORK_ERROR');
      expect(authErr.message).toBe('connection refused');
    });

    it('rejects a success response that does not match the login contract', async () => {
      const fetchImpl = makeFetch(() => jsonResponse(200, { accessToken: 'at-1' }));
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.login('admin@finplan.com', 'pw').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      expect((err as AuthRequestError).code).toBe('MALFORMED_RESPONSE');
    });
  });

  describe('refresh', () => {
    it('POSTs the presented token to /auth/refresh and returns the rotated pair', async () => {
      const fetchImpl = makeFetch((url, init) => {
        expect(url).toBe(`${BASE}/auth/refresh`);
        expect(init.method).toBe('POST');
        expect(JSON.parse(String(init.body))).toEqual({ refreshToken: 'rt-old' });
        return jsonResponse(200, { accessToken: 'at-2', refreshToken: 'rt-2' });
      });
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const result = await client.refresh('rt-old');

      expect(result).toEqual({ accessToken: 'at-2', refreshToken: 'rt-2' });
    });

    it('surfaces a 401 reuse-detection rejection', async () => {
      const fetchImpl = makeFetch(() =>
        jsonResponse(401, { error: 'Refresh token reuse detected; all sessions revoked' })
      );
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.refresh('revoked').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      expect((err as AuthRequestError).status).toBe(401);
      expect((err as AuthRequestError).message).toContain('reuse detected');
    });
  });

  describe('logout', () => {
    it('POSTs the refresh token and resolves on 200 even for unknown tokens', async () => {
      const fetchImpl = makeFetch((url, init) => {
        expect(url).toBe(`${BASE}/auth/logout`);
        expect(init.method).toBe('POST');
        expect(JSON.parse(String(init.body))).toEqual({ refreshToken: 'gone' });
        return jsonResponse(200, { message: 'Logged out successfully' });
      });
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      await expect(client.logout('gone')).resolves.toBeUndefined();
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('throws AuthRequestError on 5xx so callers can decide to retry', async () => {
      const fetchImpl = makeFetch(() => jsonResponse(500, { error: 'Internal server error' }));
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const err = await client.logout('rt').catch((e: unknown) => e);

      expect(err).toBeInstanceOf(AuthRequestError);
      expect((err as AuthRequestError).status).toBe(500);
    });
  });

  describe('me', () => {
    it('GETs /auth/me with a Bearer access token', async () => {
      const fetchImpl = makeFetch((url, init) => {
        expect(url).toBe(`${BASE}/auth/me`);
        expect(init.method).toBe('GET');
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer at-live');
        return jsonResponse(200, { user: serverUser });
      });
      const client = new AuthClient({ baseUrl: BASE, fetchImpl });

      const user = await client.me('at-live');

      expect(user.id).toBe('user-001');
    });
  });

  describe('baseUrl resolution', () => {
    it('strips trailing slashes from an injected baseUrl', async () => {
      const fetchImpl = makeFetch((url) => {
        expect(url).toBe(`${BASE}/auth/refresh`);
        return jsonResponse(200, { accessToken: 'a', refreshToken: 'r' });
      });
      const client = new AuthClient({ baseUrl: `${BASE}///`, fetchImpl });

      await client.refresh('rt');

      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('defaults to normalized VITE_API_URL when no baseUrl is injected', async () => {
      vi.stubEnv('VITE_API_URL', 'http://envhost:3001/api/');
      vi.resetModules();
      const { AuthClient: FreshAuthClient } = await import('./authClient');

      const fetchImpl = makeFetch((url) => {
        expect(url).toBe('http://envhost:3001/api/auth/me');
        return jsonResponse(200, { user: serverUser });
      });
      const client = new FreshAuthClient({ fetchImpl });

      await client.me('at');

      vi.unstubAllEnvs();
      vi.resetModules();
    });

    it("falls back to '/api' when VITE_API_URL is unset", async () => {
      vi.stubEnv('VITE_API_URL', undefined);
      vi.resetModules();
      const { AuthClient: FreshAuthClient } = await import('./authClient');

      const fetchImpl = makeFetch((url) => {
        expect(url).toBe('/api/auth/refresh');
        return jsonResponse(200, { accessToken: 'a', refreshToken: 'r' });
      });
      const client = new FreshAuthClient({ fetchImpl });

      await client.refresh('rt');

      vi.unstubAllEnvs();
      vi.resetModules();
    });
  });
});
