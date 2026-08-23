import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserProfile, SettingsState } from '../types';
import { masterStorage } from '../utils/masterStorage';
// W6-P0-14: organization config, user records and role definitions are
// admin-grade settings; updatePreferences is a local UI preference (density /
// active sector) guarded by ui:update, which every role holds.
import { enforce, Permissions } from '../utils/rbacEnforcer';

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        organization: {
          name: '',
          fiscalYear: new Date().getFullYear(),
          fiscalYearStart: '2024-01-01',
          calendarType: 'Standard',
          baseCurrency: 'USD',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          dateFormat: 'MM/DD/YYYY',
          decimalPlaces: 2,
        },
        users: [],
        roles: [],
        preferences: {
          activeSector: 'technology',
          // UI-04: 'standard' (36px rows) is the finance-tool default.
          // Must stay in sync with DEFAULT_DENSITY in @/hooks/useDensity.
          density: 'standard',
        },
        isLoading: false,
        error: null,

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),

        updateOrganization: enforce(Permissions.SETTINGS_UPDATE, 'updateOrganization', (updates) =>
          set((state) => ({
            organization: { ...state.organization, ...updates },
          }))
        ),

        setUsers: enforce(Permissions.USER_UPDATE, 'setUsers', (users) => set({ users })),

        addUser: enforce(Permissions.USER_CREATE, 'addUser', (user) =>
          set((state) => ({
            users: [...state.users, { ...user, id: `usr-${Date.now()}` } as UserProfile],
          }))
        ),

        updateUser: enforce(Permissions.USER_UPDATE, 'updateUser', (id, updates) =>
          set((state) => ({
            users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          }))
        ),

        deleteUser: enforce(Permissions.USER_DELETE, 'deleteUser', (id) =>
          set((state) => ({
            users: state.users.filter((u) => u.id !== id),
          }))
        ),

        setRoles: enforce(Permissions.USER_ASSIGN_ROLE, 'setRoles', (roles) => set({ roles })),

        updateRolePermissions: enforce(
          Permissions.USER_ASSIGN_ROLE,
          'updateRolePermissions',
          (roleId, permissions) =>
            set((state) => ({
              roles: state.roles.map((r) => (r.id === roleId ? { ...r, permissions } : r)),
            }))
        ),

        // Local UI preference (density / active sector) — ui:update is held by
        // every role by design ("UI preference, not data", per ROLE_PERMISSIONS).
        updatePreferences: enforce(Permissions.UI_UPDATE, 'updatePreferences', (updates) =>
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
          }))
        ),
      })),
      {
        name: 'settings-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
        partialize: (state) => ({
          organization: state.organization,
          preferences: state.preferences,
          // users and roles are system-level, might be better to load fresh or handle via master data
          users: state.users,
          roles: state.roles,
        }),
      }
    )
  )
);
