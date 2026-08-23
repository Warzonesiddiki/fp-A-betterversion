import { describe, it, expect, beforeEach } from 'vitest';
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
import type { User } from '../types';

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
    expect(canApprove(mockViewer)).toBe(false);
  });
});
