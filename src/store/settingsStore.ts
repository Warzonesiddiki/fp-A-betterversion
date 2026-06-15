import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserProfile, SettingsState } from '../types';
import { masterStorage } from '../utils/masterStorage';

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
          density: 'comfortable',
        },
        isLoading: false,
        error: null,

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),

        updateOrganization: (updates) =>
          set((state) => ({
            organization: { ...state.organization, ...updates },
          })),

        setUsers: (users) => set({ users }),

        addUser: (user) =>
          set((state) => ({
            users: [...state.users, { ...user, id: `usr-${Date.now()}` } as UserProfile],
          })),

        updateUser: (id, updates) =>
          set((state) => ({
            users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          })),

        deleteUser: (id) =>
          set((state) => ({
            users: state.users.filter((u) => u.id !== id),
          })),

        setRoles: (roles) => set({ roles }),

        updateRolePermissions: (roleId, permissions) =>
          set((state) => ({
            roles: state.roles.map((r) => (r.id === roleId ? { ...r, permissions } : r)),
          })),

        updatePreferences: (updates) =>
          set((state) => ({
            preferences: { ...state.preferences, ...updates },
          })),
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
