import { create } from 'zustand';
import {
  DEFAULT_FINANCIAL_CONTEXT,
  mergeFinancialContext,
  type FinancialContext,
} from '@/types/financialContext';

interface FinancialContextStore {
  context: FinancialContext;
  /** Apply a partial context update; no-op when nothing changes. */
  setContext: (patch: Partial<FinancialContext>) => void;
  resetContext: () => void;
}

export const useFinancialContextStore = create<FinancialContextStore>((set) => ({
  context: DEFAULT_FINANCIAL_CONTEXT,
  setContext: (patch) =>
    set((state) => {
      const next = mergeFinancialContext(state.context, patch);
      if (next === state.context || JSON.stringify(next) === JSON.stringify(state.context)) {
        return state;
      }
      return { context: next };
    }),
  resetContext: () => set({ context: DEFAULT_FINANCIAL_CONTEXT }),
}));
