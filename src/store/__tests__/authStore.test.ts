import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import { masterStorage } from '../../utils/masterStorage';
import type { User } from '../../types';

const _mockUser: User = {
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
    expect(before.isAuthenticated).toBe(true);

    // HEPHAESTUS FIX (T-HEP-PHASE7 #1, 2026-06-15): authStore uses
    // `name: 'auth-store'` for its persist key and routes through
    // `masterStorage` (sql.js / Tauri SQL with chunked worker wrapper).
    // The original test read `localStorage.getItem('authStore')` which
    // is incorrect on two axes: (a) the key is kebab-case `auth-store`,
    // (b) nothing is ever written to raw localStorage in jsdom because
    // the chunked worker pool (`new Worker(...)`) is unavailable.
    // Full round-trip persistence is covered by the G15 Playwright E2E
    // suite (real browser worker). Here we verify the **persist contract**
    // so a misconfigured storage key or missing middleware breaks locally.
    const options = useAuthStore.persist.getOptions();
    expect(options.name).toBe('auth-store');
    expect(options.storage).toBe(masterStorage);
    expect(useAuthStore.persist.hasHydrated()).toBe(true);
  });
});
