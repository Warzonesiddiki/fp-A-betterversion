/**
 * RBAC test fixtures (F-0026).
 *
 * These helpers authenticate a test session as a REAL role from the shipped
 * ROLE_PERMISSIONS matrix. They deliberately do NOT stub `enforce()`, do NOT
 * grant a wildcard permission set, and do NOT monkey-patch `hasPermission`.
 * A test that passes with these fixtures proves the action is reachable by an
 * actual role in production; a test that fails proves a real authorization gap.
 *
 * Use `actAs(role)` for the positive path and `signOut()` / `actAsRoleWithout()`
 * for negative authorization tests.
 */
import { useAuthStore, ROLE_PERMISSIONS } from '@/store/authStore';
import type { Role, User } from '@/types';

export interface TestUserOverrides {
  readonly id?: string;
  readonly email?: string;
  readonly entityId?: string;
  readonly departmentId?: string;
  /** Explicit permission list. Defaults to the role's real matrix grant. */
  readonly permissions?: readonly string[];
}

/** Build a User carrying exactly the permissions its role holds in production. */
export function makeTestUser(role: Role, overrides: TestUserOverrides = {}): User {
  const slug = role.toLowerCase().replace(/[^a-z]+/g, '-');
  return {
    id: overrides.id ?? `test-user-${slug}`,
    email: overrides.email ?? `${slug}@finplan.test`,
    firstName: 'Test',
    lastName: role,
    avatarUrl: null,
    role,
    departmentId: overrides.departmentId ?? 'dept-finance',
    departmentName: 'Finance',
    entityId: overrides.entityId ?? 'entity-001',
    status: 'Active',
    lastLoginAt: '2026-01-01T00:00:00.000Z',
    mfaEnabled: false,
    permissions: overrides.permissions ?? [...ROLE_PERMISSIONS[role]],
  };
}

/** Authenticate the store as `role`. Returns the user for assertions. */
export function actAs(role: Role, overrides: TestUserOverrides = {}): User {
  const user = makeTestUser(role, overrides);
  useAuthStore.setState({ user, isAuthenticated: true });
  return user;
}

/**
 * Authenticate as `role` but strip specific permissions — the precise setup for
 * a negative authorization test that must not also change the user's identity.
 */
export function actAsRoleWithout(role: Role, ...withheld: string[]): User {
  const denied = new Set(withheld);
  return actAs(role, {
    permissions: [...ROLE_PERMISSIONS[role]].filter((p) => !denied.has(p)),
  });
}

/** Clear the session: no user, not authenticated. */
export function signOut(): void {
  useAuthStore.setState({ user: null, isAuthenticated: false });
}

/**
 * Assert a thunk is rejected by RBAC. Returns the PermissionError so callers can
 * assert on the permission string. Fails loudly if the action was ALLOWED —
 * a silent pass here would certify an authorization bypass.
 */
export function expectPermissionDenied(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error && error.name === 'PermissionError') return error;
    throw error;
  }
  throw new Error(
    'Expected a PermissionError but the action was ALLOWED. ' +
      'This means the store action is not enforcing authorization.'
  );
}
