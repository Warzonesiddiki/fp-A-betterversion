/**
 * debtStore â€” Debt instrument persistence (GAP-NEW-A).
 *
 * Typed, persisted store for debt instruments so the DebtSchedulePage reads
 * real user data (via useDebtStore) instead of a hardcoded module-level
 * array, giving it a reachable empty state.
 *
 * Conventions follow constructionStore.ts / leaseStore.ts.
 */
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export type DebtType = 'term_loan' | 'revolver' | 'bond';
export type AmortizationType = 'fully_amortizing' | 'interest_only' | 'bullet';

export interface DebtInstrumentInput {
  id: string;
  name: string;
  lender: string;
  displayType: string;
  status: 'current' | 'watch' | 'past_due';
  principal: number;
  rate: number;
  termMonths: number;
  startDate: string;
  type: DebtType;
  paymentFrequency: 'monthly';
  amortizationType: AmortizationType;
}

interface DebtState {
  instruments: DebtInstrumentInput[];
  addInstrument: (instrument: DebtInstrumentInput) => void;
  updateInstrument: (id: string, updates: Partial<DebtInstrumentInput>) => void;
  removeInstrument: (id: string) => void;
  setInstruments: (instruments: DebtInstrumentInput[]) => void;
}

export const useDebtStore = create<DebtState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        // K17: no invented credit facilities ship as persisted defaults.
        instruments: [],

        addInstrument: enforce(Permissions.BUDGET_CREATE, 'addInstrument', (instrument) =>
          set((state) => {
            state.instruments.push(instrument);
          })
        ),

        updateInstrument: enforce(Permissions.BUDGET_UPDATE, 'updateInstrument', (id, updates) =>
          set((state) => {
            const idx = state.instruments.findIndex((i) => i.id === id);
            if (idx !== -1) Object.assign(state.instruments[idx]!, updates);
          })
        ),

        removeInstrument: enforce(Permissions.BUDGET_DELETE, 'removeInstrument', (id: string) =>
          set((state) => {
            state.instruments = state.instruments.filter((i) => i.id !== id);
          })
        ),

        setInstruments: enforce(Permissions.ENTITY_UPDATE, 'setInstruments', (instruments) =>
          set((state) => {
            state.instruments = instruments;
          })
        ),
      })),
      {
        name: 'debt-store',
        storage: masterStorage,
        // v2 (K17): drop the retired five-facility seed portfolio from any
        // persisted v1 state; user-entered instruments are preserved.
        version: 2,
        migrate: (state) => {
          const s = state as { instruments?: Array<Record<string, unknown>> };
          const seeded = new Set(['DEBT-001', 'DEBT-002', 'DEBT-003', 'DEBT-004', 'DEBT-005']);
          return {
            ...s,
            instruments: Array.isArray(s.instruments)
              ? s.instruments.filter((i) => !seeded.has(String(i.id)))
              : [],
          };
        },
      }
    )
  )
);
