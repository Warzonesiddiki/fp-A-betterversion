import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import type { ToastMessage, UIState } from '@/types';
import { masterStorage } from '../utils/masterStorage';

export const useUIStore = create<UIState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
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
          localStorage.setItem('theme', theme);
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
        },
        removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        setOnline: (online) => set({ isOnline: online }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'ui-store',
        storage: masterStorage,
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          globalDateRange: state.globalDateRange,
        }),
      }
    )
  )
);
