import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { User, AuthState, Role } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { startRotation, stopRotation } from '../utils/tokenRotation';

// --- RBAC Permission Matrix ---
const ROLE_PERMISSIONS: Record<Role, readonly string[]> = {
  Admin: [
    'budget:create',
    'budget:read',
    'budget:update',
    'budget:delete',
    'budget:approve',
    'forecast:create',
    'forecast:read',
    'forecast:update',
    'forecast:delete',
    'scenario:create',
    'scenario:read',
    'scenario:update',
    'scenario:delete',
    'report:create',
    'report:read',
    'report:update',
    'report:delete',
    'gl:create',
    'gl:read',
    'gl:update',
    'gl:delete',
    'entity:create',
    'entity:read',
    'entity:update',
    'entity:delete',
    'user:create',
    'user:read',
    'user:update',
    'user:delete',
    'settings:create',
    'settings:read',
    'settings:update',
    'settings:delete',
    'audit:read',
    'encryption:create',
    'encryption:read',
    'encryption:update',
    'encryption:delete',
    'export:create',
  ],
  'FP&A_Manager': [
    'budget:create',
    'budget:read',
    'budget:update',
    'budget:approve',
    'forecast:create',
    'forecast:read',
    'forecast:update',
    'scenario:create',
    'scenario:read',
    'scenario:update',
    'report:create',
    'report:read',
    'report:update',
    'gl:read',
    'entity:read',
    'user:read',
    'settings:read',
    'audit:read',
    'export:create',
  ],
  Analyst: [
    'budget:create',
    'budget:read',
    'budget:update',
    'forecast:create',
    'forecast:read',
    'forecast:update',
    'scenario:create',
    'scenario:read',
    'scenario:update',
    'report:create',
    'report:read',
    'report:update',
    'gl:read',
    'entity:read',
    'export:create',
  ],
  Department_Head: [
    'budget:read',
    'budget:create',
    'forecast:read',
    'scenario:read',
    'report:read',
    'gl:read',
    'entity:read',
    'export:create',
  ],
  Viewer: ['budget:read', 'forecast:read', 'scenario:read', 'report:read'],
};

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

        login: async (email: string, password: string) => {
          set((s) => {
            s.isLoading = true;
            s.error = null;
          });

          // Check brute force lockout
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

            // Offline mock authentication
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

            // Any password works in offline mode
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
              !(error as Error).message.includes('credentials')
            ) {
              set((s) => {
                s.isLoading = false;
                s.error = (error as Error).message;
              });
            }
            throw error;
          }
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
            const refreshToken = `rt-${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
