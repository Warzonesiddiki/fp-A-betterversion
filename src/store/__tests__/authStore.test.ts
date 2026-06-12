/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { User } from '../../types';

const mockUser: User = {
  id: 'user-test-001',
  email: 'tester@finplan.com',
  firstName: 'Test',
  lastName: 'User',
  avatarUrl: null,
  role: 'FP&A_Manager',
  departmentId: 'dept-fp',
  departmentName: 'FP&A',
  entityId: 'entity-001',
  status: 'Active',
  lastLoginAt: new Date().toISOString(),
  mfaEnabled: false,
  permissions: ['budget:create', 'budget:read'],
};

const initialState = {
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
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ ...initialState });
  });

  it('starts with initial state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.mfaRequired).toBe(false);
    expect(state.activeEntityId).toBe('');
    expect(state.error).toBeNull();
    expect(state.loginAttempts).toBe(0);
    expect(state.lockedUntil).toBeNull();
  });

  it('logs in a user', async () => {
    await useAuthStore.getState().login('admin@finplan.com', 'anypassword');
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe('admin@finplan.com');
    expect(state.accessToken).not.toBeNull();
    expect(state.error).toBeNull();
  });

  it('logs out a user', async () => {
    await useAuthStore.getState().login('admin@finplan.com', 'anypassword');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

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
  });

  it('persists across rehydration', async () => {
    await useAuthStore.getState().login('admin@finplan.com', 'anypassword');
    const before = useAuthStore.getState();

    const persistedRaw = localStorage.getItem('authStore');
    expect(persistedRaw).not.toBeNull();
    const persisted = JSON.parse(persistedRaw!);
    expect(persisted.state.user).toEqual(before.user);
    expect(persisted.state.isAuthenticated).toBe(true);
    expect(persisted.state.accessToken).toEqual(before.accessToken);
  });
});
