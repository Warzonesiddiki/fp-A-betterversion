import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  refreshToken,
  scheduleRefresh,
  handleTokenExpiry,
  startRotation,
  stopRotation,
  getAuthHeader,
  installFetchInterceptor,
  uninstallFetchInterceptor,
} from './tokenRotation';
import { useAuthStore } from '@/store/authStore';

// Helper to create a mock JWT with given expiry
function makeMockToken(expMs: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: 'user-001',
      role: 'Admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expMs / 1000),
    })
  );
  return `${header}.${payload}.mock-sig`;
}

describe('tokenRotation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopRotation();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      tokenExpiry: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    stopRotation();
  });

  describe('getAuthHeader', () => {
    it('returns empty object when no token', () => {
      useAuthStore.setState({ accessToken: null });
      expect(getAuthHeader()).toEqual({});
    });

    it('returns Authorization header when token exists', () => {
      const token = 'test-token';
      useAuthStore.setState({ accessToken: token });
      expect(getAuthHeader()).toEqual({ Authorization: `Bearer ${token}` });
    });
  });

  describe('refreshToken', () => {
    it('returns false when not authenticated', async () => {
      useAuthStore.setState({ isAuthenticated: false });
      const result = await refreshToken();
      expect(result).toBe(false);
    });

    it('calls refreshAccessToken and schedules next refresh', async () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@test.com',
        name: 'Test User',
        role: 'Admin' as const,
        permissions: ['budget:read'],
      };
      const oldToken = makeMockToken(Date.now() + 10 * 60 * 1000);

      useAuthStore.setState({
        user: mockUser,
        accessToken: oldToken,
        refreshToken: 'rt-123',
        isAuthenticated: true,
        tokenExpiry: Date.now() + 10 * 60 * 1000,
      });

      const result = await refreshToken();
      expect(result).toBe(true);

      // Token should have been updated
      const newToken = useAuthStore.getState().accessToken;
      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(oldToken);
    });
  });

  describe('handleTokenExpiry', () => {
    it('logs out the user', () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@test.com',
        name: 'Test User',
        role: 'Admin' as const,
        permissions: [],
      };
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        accessToken: 'expired-token',
      });

      // Mock window.location
      const originalLocation = window.location;
      // @ts-expect-error — partial mock
      window.location = { href: '/dashboard' };

      handleTokenExpiry();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();

      window.location = originalLocation;
    });
  });

  describe('startRotation / stopRotation', () => {
    it('starts and stops without error', () => {
      const mockUser = {
        id: 'user-001',
        email: 'test@test.com',
        name: 'Test User',
        role: 'Admin' as const,
        permissions: [],
      };
      const token = makeMockToken(Date.now() + 30 * 60 * 1000);
      useAuthStore.setState({
        user: mockUser,
        accessToken: token,
        refreshToken: 'rt-123',
        isAuthenticated: true,
        tokenExpiry: Date.now() + 30 * 60 * 1000,
      });

      expect(() => startRotation()).not.toThrow();
      expect(() => stopRotation()).not.toThrow();
    });

    it('stopRotation is idempotent', () => {
      expect(() => {
        stopRotation();
        stopRotation();
      }).not.toThrow();
    });
  });

  describe('installFetchInterceptor', () => {
    it('installs and uninstalls without error', () => {
      const originalFetch = globalThis.fetch;
      expect(() => installFetchInterceptor()).not.toThrow();
      expect(globalThis.fetch).not.toBe(originalFetch);
      expect(() => uninstallFetchInterceptor()).not.toThrow();
      expect(globalThis.fetch).toBe(originalFetch);
    });

    it('is idempotent', () => {
      installFetchInterceptor();
      installFetchInterceptor(); // Second call should be no-op
      uninstallFetchInterceptor();
    });
  });
});
