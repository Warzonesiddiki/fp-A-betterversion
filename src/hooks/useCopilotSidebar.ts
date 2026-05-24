import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface CopilotSidebarState {
  readonly isOpen: boolean;
  readonly activeTab: 'chat' | 'alerts' | 'suggestions';
  readonly toggle: () => void;
  readonly open: () => void;
  readonly close: () => void;
  readonly setActiveTab: (tab: CopilotSidebarState['activeTab']) => void;
}

export const useCopilotSidebar = create<CopilotSidebarState>()(
  subscribeWithSelector((set) => ({
    isOpen: false,
    activeTab: 'chat',
    toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    setActiveTab: (tab) => set({ activeTab: tab }),
  }))
);
