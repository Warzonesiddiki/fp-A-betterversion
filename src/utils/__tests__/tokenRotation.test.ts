import { describe, it, expect, vi, beforeEach } from 'vitest';

interface MockAuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string } | null;
  accessToken: string | null;
  refreshAccessToken: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
}

const mockAuthState: MockAuthState = {
  isAuthenticated: true,
  user: { id: '1', name: 'Test' },
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.test',
  refreshAccessToken: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
};

vi.mock('@/store/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => mockAuthState),
  },
}));

const {
  refreshToken,
  scheduleRefresh,
  handleTokenExpiry,
  installFetchInterceptor,
  uninstallFetchInterceptor,
  startRotation,
  stopRotation,
  getAuthHeader,
} = await import('../tokenRotation');

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('console', { log: vi.fn(), warn: vi.fn(), error: vi.fn() });
  vi.stubGlobal('window', { location: { href: '' } });
  vi.stubGlobal('document', {
    cookie: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    visibilityState: 'visible',
  });
  mockAuthState.isAuthenticated = true;
  mockAuthState.user = { id: '1', name: 'Test' };
  mockAuthState.accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjk5OTk5OTk5OTl9.test';
  mockAuthState.refreshAccessToken = vi.fn().mockResolvedValue(undefined);
  mockAuthState.logout = vi.fn();
  stopRotation();
});

describe('tokenRotation', () => {
  it('getAuthHeader returns Authorization header', () => {
    const header = getAuthHeader();
    expect(header).toHaveProperty('Authorization');
    expect(header.Authorization).toContain('Bearer ');
  });

  it('refreshToken returns true on success', async () => {
    const result = await refreshToken();
    expect(result).toBe(true);
  });

  it('refreshToken returns false when not authenticated', async () => {
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;
    mockAuthState.accessToken = null;
    const result = await refreshToken();
    expect(result).toBe(false);
  });

  it('handleTokenExpiry logs out and redirects', () => {
    handleTokenExpiry();
    expect(mockAuthState.logout).toHaveBeenCalled();
  });

  it('installFetchInterceptor patches global fetch', () => {
    const original = globalThis.fetch;
    installFetchInterceptor();
    expect(globalThis.fetch).not.toBe(original);
  });

  it('uninstallFetchInterceptor restores original fetch', () => {
    const original = globalThis.fetch;
    installFetchInterceptor();
    uninstallFetchInterceptor();
    expect(globalThis.fetch).toBe(original);
  });

  it('installFetchInterceptor does not re-install', () => {
    installFetchInterceptor();
    const first = globalThis.fetch;
    installFetchInterceptor();
    expect(globalThis.fetch).toBe(first);
  });

  it('startRotation adds event listener', () => {
    startRotation();
    expect(document.addEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('stopRotation removes event listener', () => {
    startRotation();
    stopRotation();
    expect(document.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('scheduleRefresh does not throw', () => {
    expect(() => scheduleRefresh()).not.toThrow();
  });

  it('intercepted 401 response retries request', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false })
      .mockResolvedValueOnce({ status: 200, ok: true });
    globalThis.fetch = mockFetch;
    installFetchInterceptor();

    const response = await globalThis.fetch('/api/data');
    expect(response.status).toBe(200);
  });
});
