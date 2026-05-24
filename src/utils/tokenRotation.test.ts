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
import type { User } from '@/types';

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

function makeMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-001',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    role: 'Admin',
    departmentId: 'dept-001',
    departmentName: 'Finance',
    entityId: 'entity-001',
    status: 'Active',
    lastLoginAt: new Date().toISOString(),
    mfaEnabled: false,
    permissions: [],
    ...overrides,
  };
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
      const mockUser = makeMockUser({
        role: 'Admin',
        permissions: ['budget:read'],
      });
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

      const newToken = useAuthStore.getState().accessToken;
      expect(newToken).toBeTruthy();
      expect(newToken).not.toBe(oldToken);
    });
  });

  describe('handleTokenExpiry', () => {
    it('logs out the user', () => {
      const mockUser = makeMockUser();
      useAuthStore.setState({
        user: mockUser,
        isAuthenticated: true,
        accessToken: 'expired-token',
      });

      handleTokenExpiry();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('startRotation / stopRotation', () => {
    it('starts and stops without error', () => {
      const mockUser = makeMockUser();
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
      installFetchInterceptor();
      uninstallFetchInterceptor();
    });
  });
});
