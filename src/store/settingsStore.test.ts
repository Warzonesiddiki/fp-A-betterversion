import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';
import { useAuthStore } from './authStore';
import { PermissionError } from '@/utils/rbacEnforcer';

// W6-P0-14: RBAC-aware fixture — grants exactly the permissions this store's
// guarded actions enforce (mirrors glUploadStore.test.ts).
function authenticateSettingsUser() {
  useAuthStore.setState({
    user: {
      id: 'settings-test-user',
      email: 'settings-test@finplan.local',
      firstName: 'Settings',
      lastName: 'Tester',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: [
        'settings:read',
        'settings:update',
        'user:create',
        'user:read',
        'user:update',
        'user:delete',
        'user:assign-role',
        'ui:update',
      ],
    },
    isAuthenticated: true,
  });
}

describe('settingsStore', () => {
  beforeEach(() => {
    authenticateSettingsUser();
    useSettingsStore.setState({
      organization: {
        name: '',
        fiscalYear: 2024,
        fiscalYearStart: '2024-01-01',
        calendarType: 'Standard',
        baseCurrency: 'USD',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        decimalPlaces: 2,
      },
      users: [],
      roles: [],
      preferences: { activeSector: 'technology' },
      isLoading: false,
    });
  });

  it('should have correct initial state', () => {
    const state = useSettingsStore.getState();
    expect(state.organization.name).toBe('');
    expect(state.users).toEqual([]);
    expect(state.roles).toEqual([]);
    expect(state.preferences.activeSector).toBe('technology');
  });

  it('should update organization', () => {
    useSettingsStore.getState().updateOrganization({ name: 'Acme Corp' });
    expect(useSettingsStore.getState().organization.name).toBe('Acme Corp');
  });

  it('should add a user', () => {
    useSettingsStore.getState().addUser({
      name: 'John',
      email: 'john@test.com',
      role: 'analyst',
    } as any);
    expect(useSettingsStore.getState().users).toHaveLength(1);
    expect(useSettingsStore!.getState().users[0]!.name).toBe('John');
  });

  it('should update a user', () => {
    useSettingsStore.getState().addUser({
      name: 'John',
      email: 'john@test.com',
      role: 'analyst',
    } as any);
    const id = useSettingsStore!.getState().users[0]!.id;
    useSettingsStore.getState().updateUser(id, { name: 'Jane' });
    expect(useSettingsStore!.getState().users[0]!.name).toBe('Jane');
  });

  it('should delete a user', () => {
    useSettingsStore.getState().addUser({
      name: 'John',
      email: 'john@test.com',
      role: 'analyst',
    } as any);
    const id = useSettingsStore!.getState().users[0]!.id;
    useSettingsStore.getState().deleteUser(id);
    expect(useSettingsStore.getState().users).toHaveLength(0);
  });

  it('should set users', () => {
    const users = [{ id: 'u1', name: 'User 1' }] as any;
    useSettingsStore.getState().setUsers(users);
    expect(useSettingsStore.getState().users).toEqual(users);
  });

  it('should set roles', () => {
    const roles = [{ id: 'r1', name: 'Admin' }] as any;
    useSettingsStore.getState().setRoles(roles);
    expect(useSettingsStore.getState().roles).toEqual(roles);
  });

  it('should update role permissions', () => {
    useSettingsStore.setState({ roles: [{ id: 'r1', name: 'Admin', permissions: [] }] as any });
    useSettingsStore.getState().updateRolePermissions('r1', ['read', 'write']);
    expect(useSettingsStore!.getState().roles[0]!.permissions).toEqual(['read', 'write']);
  });

  it('should update preferences', () => {
    useSettingsStore.getState().updatePreferences({ activeSector: 'healthcare' });
    expect(useSettingsStore.getState().preferences.activeSector).toBe('healthcare');
  });
});

// ---------------------------------------------------------------------------
// W6-P0-14 — negative RBAC: org/user/role administration is admin-grade;
// a Viewer (read + ui:update only) is denied, and state stays untouched.
// ---------------------------------------------------------------------------

describe('settingsStore RBAC (W6-P0-14)', () => {
  const authenticateViewer = () => {
    useAuthStore.setState({
      user: {
        id: 'settings-viewer',
        email: 'viewer@finplan.local',
        firstName: 'Vera',
        lastName: 'Viewer',
        avatarUrl: null,
        role: 'Viewer',
        departmentId: 'finance',
        departmentName: 'Finance',
        entityId: 'entity-001',
        status: 'Active',
        lastLoginAt: new Date().toISOString(),
        mfaEnabled: false,
        permissions: ['settings:read', 'ui:update'],
      },
      isAuthenticated: true,
    });
  };

  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    useSettingsStore.setState({
      organization: { name: '', fiscalYear: 2024 } as never,
      users: [],
      roles: [],
      preferences: { activeSector: 'technology' },
      isLoading: false,
    });
  });

  it('viewer cannot update organization', () => {
    authenticateViewer();
    expect(() => useSettingsStore.getState().updateOrganization({ name: 'Evil Corp' })).toThrow(
      PermissionError
    );
    expect(useSettingsStore.getState().organization.name).toBe('');
  });

  it('unauthenticated caller cannot manage users', () => {
    expect(() =>
      useSettingsStore.getState().addUser({ name: 'X', email: 'x@t.co', role: 'analyst' } as never)
    ).toThrow(PermissionError);
    expect(useSettingsStore.getState().users).toHaveLength(0);
  });

  it('viewer cannot rewrite role permissions', () => {
    authenticateViewer();
    useSettingsStore.setState({ roles: [{ id: 'r1', name: 'Admin', permissions: [] }] as never });
    expect(() => useSettingsStore.getState().updateRolePermissions('r1', ['user:delete'])).toThrow(
      PermissionError
    );
    expect(useSettingsStore.getState().roles[0]!.permissions).toEqual([]);
  });

  it('local UI preference updates remain available to Viewer (ui:update)', () => {
    authenticateViewer();
    expect(() =>
      useSettingsStore.getState().updatePreferences({ activeSector: 'retail' })
    ).not.toThrow();
    expect(useSettingsStore.getState().preferences.activeSector).toBe('retail');
  });
});
