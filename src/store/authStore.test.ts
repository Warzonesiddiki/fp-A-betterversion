import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useAuthStore,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRole,
  isManagerOrAbove,
  canApprove,
  ROLE_PERMISSIONS,
} from './authStore';
import { stopRotation } from '../utils/tokenRotation';
import { AuthRequestError } from '@/services/authClient';
import type { User } from '../types';

// ── Hoisted authClient mock ─────────────────────────────────────────────────
// The class lives in the hoisted scope so `instanceof` checks inside
// authStore.loginReal see the SAME constructor this file imports.
const authClientMock = vi.hoisted(() => {
  class TestAuthRequestError extends Error {
    readonly status: number;
    readonly code: string;
    readonly retryAfterSeconds?: number;
    readonly attemptsRemaining?: number;
    readonly lockedUntil?: string;
    constructor(
      status: number,
      code: string,
      message: string,
      extra: {
        retryAfterSeconds?: number;
        attemptsRemaining?: number;
        lockedUntil?: string;
      } = {}
    ) {
      super(message);
      this.name = 'AuthRequestError';
      this.status = status;
      this.code = code;
      if (extra.retryAfterSeconds !== undefined) this.retryAfterSeconds = extra.retryAfterSeconds;
      if (extra.attemptsRemaining !== undefined) this.attemptsRemaining = extra.attemptsRemaining;
      if (extra.lockedUntil !== undefined) this.lockedUntil = extra.lockedUntil;
    }
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

const mockAdmin: User = {
  id: 'user-admin-001',
  email: 'admin@finplan.com',
  firstName: 'Admin',
  lastName: 'User',
  avatarUrl: null,
  role: 'Admin',
  departmentId: 'dept-exec',
  departmentName: 'Executive',
  entityId: 'entity-001',
  status: 'Active',
  lastLoginAt: new Date().toISOString(),
  mfaEnabled: false,
  permissions: ['budget:create', 'budget:read', 'budget:approve', 'user:delete'],
};

const mockViewer: User = {
  id: 'user-viewer-001',
  email: 'viewer@finplan.com',
  firstName: 'View',
  lastName: 'Only',
  avatarUrl: null,
  role: 'Viewer',
  departmentId: 'dept-ops',
  departmentName: 'Operations',
  entityId: 'entity-001',
  status: 'Active',
  lastLoginAt: new Date().toISOString(),
  mfaEnabled: false,
  permissions: ['budget:read', 'forecast:read', 'scenario:read', 'report:read'],
};

describe('authStore', () => {
  beforeEach(() => {
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
    });
  });

  it('should have correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.mfaRequired).toBe(false);
    expect(state.activeEntityId).toBe('');
    expect(state.error).toBeNull();
    expect(state.loginAttempts).toBe(0);
    expect(state.lockedUntil).toBeNull();
  });

  it('should logout and clear state', () => {
    useAuthStore.setState({
      user: mockAdmin as any,
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      isLoading: true,
      mfaRequired: true,
      activeEntityId: 'ent-1',
      loginAttempts: 3,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.mfaRequired).toBe(false);
    expect(state.activeEntityId).toBe('');
    expect(state.loginAttempts).toBe(0);
    expect(state.lockedUntil).toBeNull();
  });

  it('should set user and derive permissions from the role matrix', () => {
    useAuthStore.getState().setUser(mockAdmin);
    expect(useAuthStore.getState().user).toEqual({
      ...mockAdmin,
      permissions: [...ROLE_PERMISSIONS.Admin],
    });
  });

  it('should switch entity', () => {
    useAuthStore.getState().switchEntity('ent-123');
    expect(useAuthStore.getState().activeEntityId).toBe('ent-123');
  });

  it('should login with valid mock user', async () => {
    await useAuthStore.getState().login('admin@finplan.com', 'anypassword');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).not.toBeNull();
    expect(state.user!.email).toBe('admin@finplan.com');
    expect(state.user!.role).toBe('Admin');
    expect(state.accessToken).not.toBeNull();
    expect(state.error).toBeNull();
  });

  it('should reject invalid email', async () => {
    await expect(useAuthStore.getState().login('unknown@test.com', 'pass')).rejects.toThrow(
      /Invalid credentials/
    );
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.loginAttempts).toBe(1);
  });

  it('should reject empty email', async () => {
    await expect(useAuthStore.getState().login('', 'pass')).rejects.toThrow(
      'Email and password are required.'
    );
  });

  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 4; i++) {
      try {
        await useAuthStore.getState().login('bad@test.com', 'pass');
        // eslint-disable-next-line no-empty
      } catch {}
    }
    await expect(useAuthStore.getState().login('bad@test.com', 'pass')).rejects.toThrow(/locked/);
    expect(useAuthStore.getState().lockedUntil).not.toBeNull();
  });

  it('should refresh access token', async () => {
    await useAuthStore.getState().login('admin@finplan.com', 'pass');
    const _oldToken = useAuthStore.getState().accessToken;
    await useAuthStore.getState().refreshAccessToken();
    // Token should be regenerated (may look same due to mock, but no error)
    expect(useAuthStore.getState().accessToken).not.toBeNull();
  });

  it('should clear error', () => {
    useAuthStore.setState({ error: 'some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should set error', () => {
    useAuthStore.getState().setError('test error');
    expect(useAuthStore.getState().error).toBe('test error');
  });

  it('should set loading', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});

describe('setUser permission derivation (P1 security)', () => {
  it('ignores client-injected admin permissions on a Viewer role', () => {
    const escalated: User = { ...mockViewer, permissions: [...ROLE_PERMISSIONS.Admin] };
    useAuthStore.getState().setUser(escalated);

    const stored = useAuthStore.getState().user;
    expect(stored).not.toBeNull();
    expect(stored!.role).toBe('Viewer');
    // Effective permissions MUST equal the Viewer row of ROLE_PERMISSIONS,
    // never the client-supplied array.
    expect(stored!.permissions).toEqual([...ROLE_PERMISSIONS.Viewer]);
    expect(hasPermission(stored, 'user:delete')).toBe(false);
    expect(hasPermission(stored, 'budget:create')).toBe(false);
  });

  it('derives the full Admin catalogue for an Admin user', () => {
    const tampered: User = { ...mockAdmin, permissions: ['budget:read'] };
    useAuthStore.getState().setUser(tampered);

    const stored = useAuthStore.getState().user;
    expect(stored!.permissions).toEqual([...ROLE_PERMISSIONS.Admin]);
    expect(hasPermission(stored, 'user:delete')).toBe(true);
    expect(hasPermission(stored, 'cube:admin')).toBe(true);
  });

  it('mock demo login keeps the role-derived permission snapshot unchanged', async () => {
    await useAuthStore.getState().loginMock('analyst@finplan.com', 'demo');

    const stored = useAuthStore.getState().user;
    expect(stored!.role).toBe('Analyst');
    expect(stored!.permissions).toEqual([...ROLE_PERMISSIONS.Analyst]);
    expect(hasPermission(stored, 'forecast:update')).toBe(true);
    expect(hasPermission(stored, 'budget:approve')).toBe(false);
  });
});

describe('RBAC helpers', () => {
  it('hasPermission returns true for matching permission', () => {
    expect(hasPermission(mockAdmin, 'budget:create')).toBe(true);
  });

  it('hasPermission returns false for missing permission', () => {
    expect(hasPermission(mockViewer, 'budget:create')).toBe(false);
  });

  it('hasPermission returns false for null user', () => {
    expect(hasPermission(null, 'budget:read')).toBe(false);
  });

  it('hasAnyPermission returns true if any match', () => {
    expect(hasAnyPermission(mockViewer, ['budget:create', 'budget:read'])).toBe(true);
  });

  it('hasAnyPermission returns false if none match', () => {
    expect(hasAnyPermission(mockViewer, ['budget:create', 'budget:delete'])).toBe(false);
  });

  it('hasAllPermissions returns true if all match', () => {
    expect(hasAllPermissions(mockAdmin, ['budget:create', 'budget:read'])).toBe(true);
  });

  it('hasAllPermissions returns false if any missing', () => {
    expect(hasAllPermissions(mockViewer, ['budget:read', 'budget:create'])).toBe(false);
  });

  it('isRole returns true for matching role', () => {
    expect(isRole(mockAdmin, 'Admin')).toBe(true);
    expect(isRole(mockAdmin, 'Admin', 'FP&A_Manager')).toBe(true);
  });

  it('isRole returns false for non-matching role', () => {
    expect(isRole(mockViewer, 'Admin')).toBe(false);
  });

  it('isManagerOrAbove returns true for Admin', () => {
    expect(isManagerOrAbove(mockAdmin)).toBe(true);
  });

  it('isManagerOrAbove returns false for Viewer', () => {
    expect(isManagerOrAbove(mockViewer)).toBe(false);
  });

  it('canApprove returns true for Admin', () => {
    expect(canApprove(mockAdmin)).toBe(true);
  });

  it('canApprove returns false for Viewer', () => {
    expect(canApprove(mockAdmin)).toBe(true);
    expect(canApprove(mockViewer)).toBe(false);
  });
});

// ── Real-auth path (server integration, W02 tenancy) ───────────────────────

function makeJwt(expSeconds: number): string {
  const encode = (o: object): string => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user-admin-001', exp: expSeconds })}.sig`;
}

const EXP_LATE = Math.floor(Date.now() / 1000) + 30 * 60;

describe('authStore real-auth path (VITE_USE_MOCK_AUTH=false)', () => {
  const serverUser = {
    id: 'srv-user-001',
    email: 'ada@finplan.com',
    firstName: 'Ada',
    lastName: 'Admin',
    role: 'Admin',
    entityId: 'entity-001',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'false');
    authClientMock.login.mockReset();
    authClientMock.logout.mockReset();
    authClientMock.me.mockReset();
    authClientMock.refresh.mockReset();
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
    });
  });

  afterEach(() => {
    stopRotation();
    vi.unstubAllEnvs();
  });

  it('login stores user + BOTH tokens + parsed expiry on success', async () => {
    authClientMock.login.mockResolvedValue({
      user: serverUser,
      accessToken: makeJwt(EXP_LATE),
      refreshToken: 'rt-1',
    });

    await useAuthStore.getState().login('ada@finplan.com', 'secret');

    expect(authClientMock.login).toHaveBeenCalledWith('ada@finplan.com', 'secret');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    // Server DTO mapped onto the store User shape with role-derived permissions.
    expect(state.user).toMatchObject({
      id: 'srv-user-001',
      email: 'ada@finplan.com',
      role: 'Admin',
      status: 'Active',
      entityId: 'entity-001',
    });
    expect(state.user!.permissions).toEqual([...ROLE_PERMISSIONS.Admin]);
    // BOTH tokens persisted in state...
    expect(state.accessToken).toBe(makeJwt(EXP_LATE));
    expect(state.refreshToken).toBe('rt-1');
    // ...plus expiry parsed from the access token payload.
    expect(state.tokenExpiry).toBe(EXP_LATE * 1000);
    expect(state.loginAttempts).toBe(0);
    expect(state.lockedUntil).toBeNull();
  });

  it('maps a 401 attemptsRemaining error into store state and stays logged out', async () => {
    authClientMock.login.mockRejectedValue(
      new AuthRequestError(401, 'UNAUTHORIZED', 'Invalid email or password', {
        attemptsRemaining: 2,
      })
    );

    await expect(useAuthStore.getState().login('ada@finplan.com', 'wrong')).rejects.toBeInstanceOf(
      AuthRequestError
    );

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid email or password');
    expect(state.loginAttempts).toBe(2);
    expect(state.isLoading).toBe(false);
  });

  it('seeds lockedUntil from a 423 lockout response', async () => {
    const lockedUntil = '2026-08-25T12:15:00.000Z';
    authClientMock.login.mockRejectedValue(
      new AuthRequestError(423, 'LOCKED', 'Account is locked. Try again in 15 minutes.', {
        lockedUntil,
      })
    );

    await expect(useAuthStore.getState().login('ada@finplan.com', 'pw')).rejects.toBeInstanceOf(
      AuthRequestError
    );

    expect(useAuthStore.getState().lockedUntil).toBe(lockedUntil);
  });

  it('refresh saves BOTH rotated tokens; two consecutive refreshes always send the latest token', async () => {
    // Seed an authenticated session holding rt-1.
    useAuthStore.setState({
      user: mockAdmin,
      accessToken: makeJwt(EXP_LATE),
      refreshToken: 'rt-1',
      isAuthenticated: true,
      tokenExpiry: EXP_LATE * 1000,
    });

    authClientMock.refresh.mockResolvedValueOnce({
      accessToken: makeJwt(EXP_LATE + 60),
      refreshToken: 'rt-2',
    });
    await useAuthStore.getState().refreshAccessToken();

    // First refresh presented rt-1 and stored the FULL rotated pair.
    expect(authClientMock.refresh).toHaveBeenLastCalledWith('rt-1');
    let state = useAuthStore.getState();
    expect(state.accessToken).toBe(makeJwt(EXP_LATE + 60));
    expect(state.refreshToken).toBe('rt-2');

    // Second refresh MUST present rt-2 — replaying rt-1 would trip the
    // server's SEC-2 reuse detection and revoke the whole token family.
    authClientMock.refresh.mockResolvedValueOnce({
      accessToken: makeJwt(EXP_LATE + 120),
      refreshToken: 'rt-3',
    });
    await useAuthStore.getState().refreshAccessToken();

    expect(authClientMock.refresh).toHaveBeenLastCalledWith('rt-2');
    state = useAuthStore.getState();
    expect(state.accessToken).toBe(makeJwt(EXP_LATE + 120));
    expect(state.refreshToken).toBe('rt-3');
    expect(state.tokenExpiry).toBe((EXP_LATE + 120) * 1000);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout fires best-effort revocation then clears local state', async () => {
    authClientMock.logout.mockResolvedValue(undefined);
    useAuthStore.setState({
      user: mockAdmin,
      accessToken: 'at-live',
      refreshToken: 'rt-live',
      isAuthenticated: true,
      activeEntityId: 'entity-001',
    });

    useAuthStore.getState().logout();

    expect(authClientMock.logout).toHaveBeenCalledWith('rt-live');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it('mock-mode logout does not call the server', async () => {
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'true');
    useAuthStore.setState({ refreshToken: 'rt-mock', isAuthenticated: true });

    useAuthStore.getState().logout();

    expect(authClientMock.logout).not.toHaveBeenCalled();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('persist contract: v1 blobs lose session truth; partialize never persists it', () => {
    const options = useAuthStore.persist.getOptions();
    expect(options.version).toBe(2);

    // A stale v1 blob claiming an authenticated session migrates to a blob
    // with NO auth truth — rehydration therefore lands unauthenticated.
    const migrated = options.migrate?.(
      {
        user: { id: 'u1', role: 'Admin' },
        isAuthenticated: true,
        activeEntityId: 'entity-001',
        loginAttempts: 0,
        lockedUntil: null,
        version: 1,
      },
      1
    ) as Record<string, unknown>;
    expect(migrated.isAuthenticated).toBeUndefined();
    expect(migrated.user).toBeUndefined();
    expect(migrated.activeEntityId).toBe('entity-001');
    expect(migrated.version).toBe(2);

    // And the live partialize output never carries session truth either.
    useAuthStore.setState({
      user: mockAdmin,
      accessToken: 'at-x',
      refreshToken: 'rt-x',
      isAuthenticated: true,
      tokenExpiry: 123,
      activeEntityId: 'entity-001',
    });
    const persisted = options.partialize?.(useAuthStore.getState()) as Record<string, unknown>;
    expect(Object.keys(persisted).sort()).toEqual([
      'activeEntityId',
      'lockedUntil',
      'loginAttempts',
    ]);
  });
});
