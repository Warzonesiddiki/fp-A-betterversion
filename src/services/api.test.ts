import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoisted test state ─────────────────────────────────────────────────────
// These mocks need to survive vi.clearAllMocks() within the factory closure.
// The interceptor use spies capture handlers at module load time.
// testState provides stable references accessible in both factory and tests.

const testState = vi.hoisted(() => ({
  mockGetState: vi.fn(),
  mockSetState: vi.fn(),
  mockReqUse: vi.fn(),
  mockResUse: vi.fn(),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: Object.assign(vi.fn(), {
    getState: testState.mockGetState,
    setState: testState.mockSetState,
  }),
}));

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  const instance = actual.default.create({
    baseURL: '/api',
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Patch interceptor use methods with spies so we can extract handlers
  instance.interceptors.request.use = testState.mockReqUse;
  instance.interceptors.response.use = testState.mockResUse;

  return {
    default: {
      ...actual.default,
      create: vi.fn(() => instance),
    },
  };
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('api', () => {
  let onRequestFulfilled: (config: unknown) => unknown;
  let onRequestRejected: (error: unknown) => unknown;
  let onResponseFulfilled: (response: unknown) => unknown;
  let onResponseRejected: (error: unknown) => Promise<unknown>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    testState.mockGetState.mockReturnValue({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      logout: vi.fn(),
    });

    // Load module to trigger interceptor registration
    await import('./api');

    // Extract handler functions from the mock interceptor use calls
    onRequestFulfilled = testState.mockReqUse.mock.calls[0]?.[0];
    onRequestRejected = testState.mockReqUse.mock.calls[0]?.[1];
    onResponseFulfilled = testState.mockResUse.mock.calls[0]?.[0];
    onResponseRejected = testState.mockResUse.mock.calls[0]?.[1];
  });

  describe('exports', () => {
    it('exports api with default baseURL', async () => {
      const { api } = await import('./api');
      expect(api).toBeDefined();
      expect(api.defaults.baseURL).toBe('/api');
    });
  });

  describe('request interceptor', () => {
    it('attaches Bearer token when accessToken exists', () => {
      const config = { headers: {} };
      const result = onRequestFulfilled(config) as typeof config;
      expect(result.headers).toEqual({ Authorization: 'Bearer test-token' });
    });

    it('does not attach token when accessToken is null', () => {
      testState.mockGetState.mockReturnValue({ accessToken: null, refreshToken: null });
      const config = { headers: {} };
      const result = onRequestFulfilled(config) as typeof config;
      expect(result.headers).toEqual({});
    });

    it('passes through request errors', async () => {
      const error = new Error('Request error');
      await expect(onRequestRejected(error)).rejects.toThrow('Request error');
    });
  });

  describe('response interceptor', () => {
    it('passes through successful responses', () => {
      const response = { data: { ok: true }, status: 200 };
      expect(onResponseFulfilled(response)).toBe(response);
    });

    it('rejects non-401 errors', async () => {
      const error = { response: { status: 500 }, config: { _retry: false } };
      await expect(onResponseRejected(error)).rejects.toBe(error);
    });

    it('rejects if request already retried', async () => {
      const error = {
        response: { status: 401 },
        config: { _retry: true, headers: {} },
      };
      await expect(onResponseRejected(error)).rejects.toBe(error);
    });

    it('redirects to login when /auth/refresh itself fails with 401', async () => {
      const mockLogout = vi.fn();
      testState.mockGetState.mockReturnValue({
        accessToken: 'expired',
        refreshToken: 'refresh',
        logout: mockLogout,
      });

      const error = {
        response: { status: 401 },
        config: { url: '/auth/refresh', _retry: false, headers: {} },
      };

      const origHref = window.location.href;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });

      try {
        await onResponseRejected(error);
      } catch {
        // expected — handler returns Promise.reject(error)
      }

      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('/login');

      Object.defineProperty(window, 'location', {
        value: { href: origHref },
        writable: true,
      });
    });
  });
});
