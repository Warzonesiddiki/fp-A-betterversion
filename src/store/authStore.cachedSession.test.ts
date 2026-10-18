import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { stopRotation } from '../utils/tokenRotation';
import { setClock, resetClock } from '../utils/clock';

// Hoisted authClient mock (same pattern as authStore.test.ts).
const authClientMock = vi.hoisted(() => {
  class TestAuthRequestError extends Error {
    readonly status = 401;
    readonly code = 'invalid';
  }
  return {
    AuthRequestError: TestAuthRequestError,
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(),
  };
});

vi.mock('@/services/authClient', () => ({
  authClient: {
    login: authClientMock.login,
    logout: authClientMock.logout,
    me: authClientMock.me,
    refresh: authClientMock.refresh,
  },
  AuthRequestError: authClientMock.AuthRequestError,
}));

function makeJwt(expSeconds: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64({ exp: expSeconds })}.sig`;
}

const serverUser = {
  id: 'srv-user-001',
  email: 'ada@finplan.com',
  firstName: 'Ada',
  lastName: 'Admin',
  role: 'Admin' as const,
  entityId: 'entity-001',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

describe('DEC-014 cached local session (offline sign-in)', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'false');
    authClientMock.login.mockReset();
    authClientMock.logout.mockReset();
    authClientMock.logout.mockResolvedValue(undefined);
    localStorage.setItem('finplan-device-binding-v1', 'device-A');
    setClock('2026-10-15T09:00:00.000Z');
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      mfaRequired: false,
      activeEntityId: '',
      error: null,
      loginAttempts: 0,
      lockedUntil: null,
      tokenExpiry: null,
      cachedSession: null,
      sessionMode: null,
    });
  });

  afterEach(() => {
    stopRotation();
    resetClock();
    vi.unstubAllEnvs();
  });

  async function enroll() {
    authClientMock.login.mockResolvedValue({
      user: serverUser,
      accessToken: makeJwt(Math.floor(Date.parse('2026-10-15T09:30:00Z') / 1000)),
      refreshToken: 'rt-1',
    });
    await useAuthStore.getState().login('ada@finplan.com', 'secret');
  }

  it('a successful online login enrolls a cached session expiring 30 days out', async () => {
    await enroll();
    const state = useAuthStore.getState();
    expect(state.cachedSession).not.toBeNull();
    expect(state.cachedSession!.email).toBe('ada@finplan.com');
    expect(state.cachedSession!.issuedAt).toBe('2026-10-15T09:00:00.000Z');
    expect(state.cachedSession!.expiresAt).toBe('2026-11-14T09:00:00.000Z');
    expect(state.cachedSession!.user.id).toBe('srv-user-001');
    // The cache never carries tokens.
    expect(JSON.stringify(state.cachedSession)).not.toContain('rt-1');
    expect(state.sessionMode).toBe('online');
  });

  it('offline restore signs in from the cache without any network call', async () => {
    await enroll();
    // Simulate a later cold start: session truth gone, cache remains.
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      sessionMode: null,
    });
    authClientMock.login.mockReset();
    setClock('2026-10-20T08:00:00.000Z');

    const restored = useAuthStore.getState().restoreCachedSession('device-A');

    expect(restored).toBe(true);
    expect(authClientMock.login).not.toHaveBeenCalled();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('ada@finplan.com');
    expect(state.sessionMode).toBe('offline-cache');
    expect(state.accessToken).toBeNull();
  });

  it('restore refuses a different device binding and an expired cache (and wipes the expired one)', async () => {
    await enroll();
    useAuthStore.setState({ user: null, isAuthenticated: false, sessionMode: null });

    expect(useAuthStore.getState().restoreCachedSession('device-B')).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().cachedSession).not.toBeNull();

    setClock('2026-11-15T09:00:01.000Z'); // one second past expiry
    expect(useAuthStore.getState().restoreCachedSession('device-A')).toBe(false);
    expect(useAuthStore.getState().cachedSession).toBeNull();
  });

  it('logout and revoke wipe the cached session', async () => {
    await enroll();
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().cachedSession).toBeNull();

    await enroll();
    useAuthStore.getState().revokeCachedSession();
    expect(useAuthStore.getState().cachedSession).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
