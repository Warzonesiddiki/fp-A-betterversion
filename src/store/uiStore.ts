import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type { UIState } from '@/types';
import { masterStorage } from '../utils/masterStorage';

import { isTauriRuntime } from '@/utils/tauriRuntime';
import { enforce, Permissions } from '@/utils/rbacEnforcer';
import { createLogger } from '@/utils/logger';

const uiStoreLogger = createLogger('UIStore');

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        sidebarCollapsed: false,
        mobileSidebarOpen: false,
        theme: 'light',
        commandPaletteOpen: false,
        helpPanelOpen: false,
        toasts: [],
        isOnline: true,
        globalDateRange: { start: '2024-01-01', end: '2024-12-31' },
        error: null,
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        openMobileSidebar: () => set({ mobileSidebarOpen: true }),
        closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
        setTheme: enforce(Permissions.UI_UPDATE, 'setTheme', (theme) => {
          const isDark = theme === 'dark';
          document.documentElement.classList.toggle('dark', isDark);
          document.documentElement.classList.toggle('light', !isDark);
          set({ theme });
        }),

        toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
        toggleHelpPanel: () => set((s) => ({ helpPanelOpen: !s.helpPanelOpen })),
        setHelpPanelOpen: (open: boolean) => set({ helpPanelOpen: open }),
        addToast: enforce(Permissions.UI_UPDATE, 'addToast', (toast) => {
          const id = `toast-${Date.now()}`;
          set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
          setTimeout(
            () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
            toast.duration || 5000
          );

          // Native notification for high-priority alerts. Desktop hardening:
          // @tauri-apps/plugin-notification is imported lazily and only when
          // running inside Tauri, so a non-Tauri runtime (including the jsdom
          // test environment) never evaluates the plugin module.
          if (
            toast.type === 'error' ||
            (toast.title &&
              (toast.title.toLowerCase().includes('import complete') ||
                toast.title.toLowerCase().includes('security')))
          ) {
            if (isTauriRuntime()) {
              void import('@tauri-apps/plugin-notification')
                .then(({ isPermissionGranted, requestPermission, sendNotification }) =>
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
                )
                .catch((err) => {
                  uiStoreLogger.error('Failed to send native notification', {
                    error: err instanceof Error ? err.message : String(err),
                  });
                });
            }
          }
        }),

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
