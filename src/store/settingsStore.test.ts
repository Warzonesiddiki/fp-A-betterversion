import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
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
