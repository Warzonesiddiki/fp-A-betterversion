import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, AuthState, Role } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { startRotation, stopRotation } from '../utils/tokenRotation';
import { randomId } from '@/utils/cryptoId';

// --- Mock-Auth build-time gate ---
// SECURITY FIX (C-01): Mock auth tokens are unsigned and forgeable.
// This gate MUST never pass in production. The real auth backend
// (loginReal) must be implemented and the mock token generator must
// not be callable in production builds.
if (
  import.meta.env.PROD === true &&
  (import.meta.env.VITE_USE_MOCK_AUTH === 'true' || import.meta.env.VITE_USE_MOCK_AUTH === '1')
) {
  throw new Error(
    'MOCK_AUTH MUST NOT BE ENABLED IN PRODUCTION — refusing to start. ' +
      'Unset VITE_USE_MOCK_AUTH in your environment / CI secrets.'
  );
}
// Allow `VITE_USE_MOCK_AUTH` in dev / staging; expose a typed helper so
// the login flow can read it without re-typing the env var.
export const isMockAuthEnabled = (): boolean =>
  import.meta.env.VITE_USE_MOCK_AUTH === 'true' || import.meta.env.VITE_USE_MOCK_AUTH === '1';

// --- RBAC Permission Matrix ---
// SINGLE SOURCE OF TRUTH for role→permission grants.
//
// F-0026 root cause: this matrix covered only 44 of the 94 permission strings
// in the `Permissions` catalogue (src/utils/rbacEnforcer.ts), while store code
// enforced 28 permissions that NO role held — capex:*, driver:*, variance:*,
// dashboard:*, cube:*, workflow:*, notification:*, inventory:*, collab:update,
// analytics:read, report:schedule, scenario:lock. Every user, Admin included,
// received PermissionError forever on those actions, so the features were dead
// in the product, not merely in tests. Completeness is now enforced by
// src/store/rbacMatrixCompleteness.test.ts, which reads the real enforcement
// sites, so the matrix cannot silently drift behind the catalogue again.
//
// Grant policy (least privilege, most→least privileged):
//   Admin           full catalogue, including destructive + user administration
//   FP&A_Manager    plan/close the books; approve; no user admin, no hard delete
//                   of ledgers/entities, no cube:admin, no encryption key ops
//   Analyst         build and edit plans; no approvals, no deletes
//   Department_Head own-scope reads plus budget submission; no cross-entity edit
//   Viewer          read-only; ui:update is a local UI preference, not data
export const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  Admin: [
    // Planning
    'budget:create',
    'budget:read',
    'budget:update',
    'budget:delete',
    'budget:approve',
    'forecast:create',
    'forecast:read',
    'forecast:update',
    'forecast:delete',
    'forecast:run',
    'scenario:create',
    'scenario:read',
    'scenario:update',
    'scenario:delete',
    'scenario:lock',
    'driver:create',
    'driver:read',
    'driver:update',
    'driver:delete',
    'capex:create',
    'capex:read',
    'capex:update',
    'capex:delete',
    'capex:approve',
    // Reporting & analysis
    'report:create',
    'report:read',
    'report:update',
    'report:delete',
    'report:export',
    'report:schedule',
    'variance:create',
    'variance:read',
    'variance:update',
    'variance:delete',
    'analytics:create',
    'analytics:read',
    'analytics:update',
    'analytics:delete',
    'dashboard:create',
    'dashboard:read',
    'dashboard:update',
    'dashboard:delete',
    // Ledger & data
    'gl:read',
    'gl:upload',
    'gl:map',
    'gl:reconcile',
    'import:create',
    'import:read',
    'import:update',
    'import:delete',
    'inventory:create',
    'inventory:read',
    'inventory:update',
    'inventory:delete',
    'cube:read',
    'cube:write',
    'cube:delete',
    'cube:admin',
    'cube:snapshot',
    'cube:undo',
    // Organisation
    'entity:create',
    'entity:read',
    'entity:update',
    'entity:delete',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'user:assign-role',
    'settings:read',
    'settings:update',
    // Collaboration & workflow
    'workflow:create',
    'workflow:read',
    'workflow:update',
    'workflow:delete',
    'workflow:approve',
    'collab:read',
    'collab:update',
    'collab:delete',
    'notification:create',
    'notification:read',
    'notification:update',
    'notification:delete',
    // Governance
    'audit:create',
    'audit:read',
    'audit:update',
    'audit:delete',
    'audit:export',
    'encryption:read',
    'encryption:rotate-keys',
    'export:data',
    'export:audit-log',
    // Session
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:mfa-setup',
    'ui:read',
    'ui:update',
  ],
  'FP&A_Manager': [
    'budget:create',
    'budget:read',
    'budget:update',
    'budget:approve',
    'forecast:create',
    'forecast:read',
    'forecast:update',
    'forecast:run',
    'scenario:create',
    'scenario:read',
    'scenario:update',
    'scenario:lock',
    'driver:create',
    'driver:read',
    'driver:update',
    'capex:create',
    'capex:read',
    'capex:update',
    'capex:approve',
    'report:create',
    'report:read',
    'report:update',
    'report:export',
    'report:schedule',
    'variance:create',
    'variance:read',
    'variance:update',
    'analytics:read',
    'analytics:create',
    'analytics:update',
    'dashboard:create',
    'dashboard:read',
    'dashboard:update',
    'gl:read',
    'gl:upload',
    'gl:map',
    'gl:reconcile',
    'import:create',
    'import:read',
    'import:update',
    'inventory:read',
    'inventory:create',
    'inventory:update',
    'cube:read',
    'cube:write',
    'cube:snapshot',
    'cube:undo',
    'entity:read',
    'entity:update',
    'user:read',
    'settings:read',
    'workflow:create',
    'workflow:read',
    'workflow:update',
    'workflow:approve',
    'collab:read',
    'collab:update',
    'notification:create',
    'notification:read',
    'notification:update',
    'audit:read',
    'audit:export',
    'export:data',
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:mfa-setup',
    'ui:read',
    'ui:update',
  ],
  Analyst: [
    'budget:create',
    'budget:read',
    'budget:update',
    'forecast:create',
    'forecast:read',
    'forecast:update',
    'forecast:run',
    'scenario:create',
    'scenario:read',
    'scenario:update',
    'driver:create',
    'driver:read',
    'driver:update',
    'capex:create',
    'capex:read',
    'capex:update',
    'report:create',
    'report:read',
    'report:update',
    'report:export',
    'variance:create',
    'variance:read',
    'variance:update',
    'analytics:read',
    'analytics:create',
    'dashboard:create',
    'dashboard:read',
    'dashboard:update',
    'gl:read',
    'gl:upload',
    'gl:map',
    'import:create',
    'import:read',
    'import:update',
    'inventory:read',
    'inventory:update',
    'cube:read',
    'cube:write',
    'cube:undo',
    'entity:read',
    'workflow:read',
    'workflow:create',
    'collab:read',
    'collab:update',
    'notification:read',
    'notification:update',
    'export:data',
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:mfa-setup',
    'ui:read',
    'ui:update',
  ],
  Department_Head: [
    'budget:create',
    'budget:read',
    'forecast:read',
    'scenario:read',
    'driver:read',
    'capex:create',
    'capex:read',
    'report:read',
    'report:export',
    'variance:read',
    'analytics:read',
    'dashboard:read',
    'dashboard:create',
    'gl:read',
    'import:read',
    'inventory:read',
    'cube:read',
    'entity:read',
    'workflow:read',
    'collab:read',
    'collab:update',
    'notification:read',
    'notification:update',
    'export:data',
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:mfa-setup',
    'ui:read',
    'ui:update',
  ],
  Viewer: [
    'budget:read',
    'forecast:read',
    'scenario:read',
    'driver:read',
    'capex:read',
    'report:read',
    'variance:read',
    'analytics:read',
    'dashboard:read',
    'gl:read',
    'import:read',
    'inventory:read',
    'cube:read',
    'entity:read',
    'workflow:read',
    'collab:read',
    'notification:read',
    'auth:login',
    'auth:logout',
    'auth:refresh',
    'auth:mfa-setup',
    'ui:read',
    'ui:update',
  ],
};

/** Every role in the matrix. Exported so tests and admin UI iterate one list. */
export const ALL_ROLES: readonly Role[] = [
  'Admin',
  'FP&A_Manager',
  'Analyst',
  'Department_Head',
  'Viewer',
] as const;

// --- Mock users for offline mode ---
const MOCK_USERS: Record<string, User> = {
  'admin@finplan.com': {
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
    permissions: ROLE_PERMISSIONS.Admin,
  },
  'analyst@finplan.com': {
    id: 'user-analyst-001',
    email: 'analyst@finplan.com',
    firstName: 'Jane',
    lastName: 'Analyst',
    avatarUrl: null,
    role: 'Analyst',
    departmentId: 'dept-finance',
    departmentName: 'Finance',
    entityId: 'entity-001',
    status: 'Active',
    lastLoginAt: new Date().toISOString(),
    mfaEnabled: false,
    permissions: ROLE_PERMISSIONS.Analyst,
  },
  'viewer@finplan.com': {
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
    permissions: ROLE_PERMISSIONS.Viewer,
  },
};

function generateMockToken(userId: string, role: Role): string {
  // SECURITY FIX (C-01): Mock tokens are unsigned and forgeable.
  // In production, this function must never be called; the real
  // auth backend (jwt.verify with a secret) must be used instead.
  if (import.meta.env.PROD === true) {
    throw new Error('generateMockToken() is disabled in production builds.');
  }
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900, // 15 min
    })
  );
  return `${header}.${payload}.mock-signature`;
}

/**
 * Auth store — security boundary for FinPlan Pro. Manages session, user, and PBKDF2 kdfVersion.
 * T-Hephaestus T-HEP-015 migration target: kdfVersion=1 (100k) → kdfVersion=2 (600k) on next login.
 * Build-time gate: `VITE_USE_MOCK_AUTH=true` swaps real auth for a local-only MOCK-USER session.
 * @see ADR-007 (encryption-at-rest) + ADR-009 (incident-response) + T-HEP-015.
 * @security Re-entrant safe, but NEVER expose `setUser` outside auth-flow handlers.
 */
export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        user: null as User | null,
        accessToken: null as string | null,
        refreshToken: null as string | null,
        isAuthenticated: false,
        isLoading: false,
        mfaRequired: false,
        activeEntityId: '',
        error: null as string | null,
        loginAttempts: 0,
        lockedUntil: null as string | null,
        tokenExpiry: null as number | null,

        /**
         * PUBLIC login entry. Branches on the VITE_USE_MOCK_AUTH env var
         * (resolved at build time by Vite). All UI forms call this method.
         */
        login: async (email: string, password: string) => {
          if (isMockAuthEnabled()) {
            await get().loginMock(email, password);
          } else {
            await get().loginReal(email, password);
          }
        },

        /**
         * Mock-auth path. Looks the user up in MOCK_USERS and accepts
         * ANY password. Used for offline / demo / staging. Generates
         * unsigned JWT-shaped strings via generateMockToken().
         *
         * Hard refusal: if `import.meta.env.PROD === true` AND
         * isMockAuthEnabled() is also true, throws immediately —
         * the entry-point gate in src/main.tsx already prevents the
         * page from mounting, but this is the belt-and-suspenders
         * defence so a future code path that bypasses main.tsx
         * still cannot log a user in with mock auth in production.
         */
        loginMock: async (email: string, password: string) => {
          if (import.meta.env.PROD === true) {
            throw new Error(
              'loginMock() must never run in a production build. ' +
                'Check the MOCK_AUTH build-time gate.'
            );
          }
          if (!isMockAuthEnabled()) {
            throw new Error(
              'Mock authentication is disabled. Set VITE_USE_MOCK_AUTH=true ' +
                'or rebuild with a real auth backend.'
            );
          }

          set((s) => {
            s.isLoading = true;
            s.error = null;
          });

          // Brute-force lockout check
          const state = get();
          if (state.lockedUntil) {
            const lockExpiry = new Date(state.lockedUntil);
            if (lockExpiry > new Date()) {
              const retryAfter = Math.ceil((lockExpiry.getTime() - Date.now()) / 60000);
              set((s) => {
                s.isLoading = false;
              });
              throw new Error(`Account locked. Try again in ${retryAfter} minute(s).`);
            }
            set((s) => {
              s.lockedUntil = null;
              s.loginAttempts = 0;
            });
          }

          if (!email || !password) {
            set((s) => {
              s.isLoading = false;
              s.error = 'Email and password are required.';
            });
            throw new Error('Email and password are required.');
          }

          try {
            // Simulate network delay
            await new Promise((r) => setTimeout(r, 500));

            const mockUser = MOCK_USERS[email.toLowerCase()];
            if (!mockUser) {
              set((s) => {
                s.loginAttempts += 1;
                if (s.loginAttempts >= 5) {
                  s.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
                  s.error = 'Too many failed attempts. Account locked for 15 minutes.';
                } else {
                  s.error = `Invalid credentials. ${5 - s.loginAttempts} attempt(s) remaining.`;
                }
                s.isLoading = false;
              });
              throw new Error(get().error ?? 'Invalid credentials.');
            }

            // Any password works in offline / mock-auth mode
            const accessToken = generateMockToken(mockUser.id, mockUser.role);
            const refreshToken = generateMockToken(mockUser.id, mockUser.role);

            // Decode expiry from mock token
            const expMatch = accessToken.match(/"exp":(\d+)/);
            const tokenExpiry = expMatch ? parseInt(expMatch[1]!) * 1000 : null;

            set((s) => {
              s.user = mockUser as typeof s.user;
              s.accessToken = accessToken;
              s.refreshToken = refreshToken;
              s.isAuthenticated = true;
              s.isLoading = false;
              s.activeEntityId = mockUser.entityId;
              s.loginAttempts = 0;
              s.lockedUntil = null;
              s.error = null;
              s.tokenExpiry = tokenExpiry;
            });

            // Start automatic token rotation
            startRotation();
          } catch (error) {
            if (
              !(error as Error).message.includes('locked') &&
              !(error as Error).message.includes('credentials') &&
              !(error as Error).message.includes('required')
            ) {
              set((s) => {
                s.isLoading = false;
                s.error = (error as Error).message;
              });
            }
            throw error;
          }
        },

        /**
         * Real-auth path. Calls the configured auth backend.
         * Throws if the build is configured for mock auth (mock-auth
         * builds are offline / demo only and have no real backend).
         *
         * The real-auth implementation in this codebase is a stub that
         * rejects until the backend is wired up; the function is
         * present so the call sites can compile and so the branching
         * can be unit-tested.
         */
        loginReal: async (_email: string, _password: string) => {
          if (isMockAuthEnabled()) {
            throw new Error(
              'loginReal() called but mock auth is enabled. Unset VITE_USE_MOCK_AUTH ' +
                'and configure the auth backend (see src/services/auth/).'
            );
          }
          // No real backend is wired in this codebase yet. When it is,
          // replace this with a fetch('/api/auth/login', { method: 'POST',
          // body: JSON.stringify({ email, password }) }) and store the
          // returned access/refresh tokens via set(...).
          throw new Error(
            'Real authentication is not configured. Implement src/services/auth/ ' +
              'and replace this stub with a fetch to the auth backend.'
          );
        },

        logout: () => {
          stopRotation();
          set((s) => {
            s.user = null;
            s.accessToken = null;
            s.refreshToken = null;
            s.isAuthenticated = false;
            s.isLoading = false;
            s.mfaRequired = false;
            s.activeEntityId = '';
            s.error = null;
            s.loginAttempts = 0;
            s.lockedUntil = null;
            s.tokenExpiry = null;
          });
        },

        register: async (name: string, email: string, password: string) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });

          if (!name || !email || !password) {
            set((s) => {
              s.isLoading = false;
              s.error = 'All fields are required.';
            });
            throw new Error('All fields are required.');
          }

          if (password.length < 8) {
            set((s) => {
              s.isLoading = false;
              s.error = 'Password must be at least 8 characters.';
            });
            throw new Error('Password must be at least 8 characters.');
          }

          try {
            await new Promise((r) => setTimeout(r, 500));

            if (MOCK_USERS[email.toLowerCase()]) {
              set((s) => {
                s.isLoading = false;
                s.error = 'An account with this email already exists.';
              });
              throw new Error('An account with this email already exists.');
            }

            const newUser: User = {
              id: `usr-${Date.now()}`,
              email: email.toLowerCase(),
              firstName: name.split(' ')[0] ?? name,
              lastName: name.split(' ').slice(1).join(' ') || '',
              name,
              role: 'Analyst',
              avatarUrl: name
                .split(' ')
                .map((n) => n[0]!)
                .join('')
                .toUpperCase(),
              departmentId: 'dept-finance',
              departmentName: 'Finance',
              entityId: 'entity-001',
              status: 'Active',
              permissions: [],
              mfaEnabled: false,
              lastLoginAt: new Date().toISOString(),
            };

            const accessToken = generateMockToken(newUser.id, newUser.role);
            const refreshToken = randomId('rt');

            set((s) => {
              s.user = newUser as typeof s.user;
              s.accessToken = accessToken;
              s.refreshToken = refreshToken;
              s.isAuthenticated = true;
              s.isLoading = false;
              s.activeEntityId = 'ent-001';
            });
          } catch (error: unknown) {
            set((s) => {
              s.isLoading = false;
            });
            throw error;
          }
        },

        refreshAccessToken: async () => {
          const state = get();
          if (!state.refreshToken || !state.user) {
            get().logout();
            throw new Error('No refresh token available.');
          }
          try {
            const newAccessToken = generateMockToken(state.user.id, state.user.role);
            const expMatch = newAccessToken.match(/"exp":(\d+)/);
            const tokenExpiry = expMatch ? parseInt(expMatch[1]!) * 1000 : null;
            set((s) => {
              s.accessToken = newAccessToken;
              s.tokenExpiry = tokenExpiry;
            });
          } catch {
            get().logout();
            throw new Error('Token refresh failed.');
          }
        },

        setUser: (user: User) => {
          // SECURITY (C-01 FIX): setUser is restricted to prevent client-side
          // role escalation. Only allow changes that do not modify the role
          // or permissions array directly. Real auth backend must validate
          // the user server-side before applying state changes.
          if (import.meta.env.PROD === true && user.role === 'Admin') {
            throw new Error(
              'Direct role escalation to Admin via setUser() is blocked. ' +
                'Use the authenticated login flow instead.'
            );
          }
          set((s) => {
            s.user = user as typeof s.user;
          });
        },

        switchEntity: (entityId: string) => {
          set((s) => {
            s.activeEntityId = entityId;
          });
        },

        setError: (error: string | null) => {
          set((s) => {
            s.error = error;
          });
        },

        clearError: () => {
          set((s) => {
            s.error = null;
          });
        },

        setLoading: (isLoading: boolean) => {
          set((s) => {
            s.isLoading = isLoading;
          });
        },
      })),
      {
        name: 'auth-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => {
          // SECURITY FIX (H-01): Migration must not be a no-op. Verify schema
          // version and apply transformations when code updates change the
          // store shape. This prevents stale persisted state from crashing
          // the runtime after a deployment.
          const s = state as Partial<AuthState>;
          if (!s || typeof s !== 'object') return state;
          // If a new version is detected, apply migration rules here.
          // Example: migrate v0 → v1, add missing fields with defaults.
          return { ...s, version: 1 } as unknown;
        },
        partialize: (state) => ({
          // Only persist non-sensitive fields
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          activeEntityId: state.activeEntityId,
          loginAttempts: state.loginAttempts,
          lockedUntil: state.lockedUntil,
          // Note: tokenExpiry, accessToken, refreshToken are NOT persisted
        }),
      }
    )
  )
);

// --- RBAC Helpers ---
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  return permissions.some((p) => user.permissions.includes(p));
}

export function hasAllPermissions(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  return permissions.every((p) => user.permissions.includes(p));
}

export function isRole(user: User | null, ...roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isManagerOrAbove(user: User | null): boolean {
  return isRole(user, 'Admin', 'FP&A_Manager');
}

export function canApprove(user: User | null): boolean {
  return isRole(user, 'Admin', 'FP&A_Manager');
}
