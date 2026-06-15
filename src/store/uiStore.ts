import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { UIState } from '@/types';
import { masterStorage } from '../utils/masterStorage';

import { isTauri } from '@tauri-apps/api/core';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        sidebarCollapsed: false,
        mobileSidebarOpen: false,
        theme: 'dark',
        commandPaletteOpen: false,
        toasts: [],
        isOnline: true,
        globalDateRange: { start: '2024-01-01', end: '2024-12-31' },
        error: null,
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        openMobileSidebar: () => set({ mobileSidebarOpen: true }),
        closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
        setTheme: (theme) => {
          const isDark = theme === 'dark';
          document.documentElement.classList.toggle('dark', isDark);
          document.documentElement.classList.toggle('light', !isDark);
          // Theme is persisted via the persist middleware's partialize config;
          // no direct localStorage write (Athena v2 finding + masterStorage-as-
          // single-source pattern, per ADR-005).
          set({ theme });
        },
        toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
        addToast: (toast) => {
          const id = `toast-${Date.now()}`;
          set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
          setTimeout(
            () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
            toast.duration || 5000
          );

          // Native notification for high-priority alerts
          if (
            toast.type === 'error' ||
            (toast.title &&
              (toast.title.toLowerCase().includes('import complete') ||
                toast.title.toLowerCase().includes('security')))
          ) {
            if (isTauri()) {
              isPermissionGranted()
                .then((granted) => {
                  if (!granted) {
                    return requestPermission();
                  }
                  return granted ? 'granted' : 'denied';
                })
                .then((permission) => {
                  if (permission === 'granted') {
                    sendNotification({
                      title: toast.title || 'Notification',
                      body: toast.message || '',
                    });
                  }
                })
                .catch((err) => {
                  console.error('Failed to send native notification:', err);
                });
            }
          }
        },
        removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        setOnline: (online) => set({ isOnline: online }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      })),
      {
        name: 'ui-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
        partialize: (state: UIState) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          globalDateRange: state.globalDateRange,
        }),
      }
    )
  )
);
