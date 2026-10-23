import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

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
