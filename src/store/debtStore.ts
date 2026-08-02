/**
 * debtStore — Debt instrument persistence (GAP-NEW-A).
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

/** Seed portfolio (kept so existing DebtSchedulePage tests that assert
 * engine-computed schedules continue to pass). Users can clear/edit it. */
const SEED_INSTRUMENTS: DebtInstrumentInput[] = [
  {
    id: 'DEBT-001',
    name: 'Chase Term Loan',
    lender: 'Chase Bank',
    displayType: 'Term Loan',
    status: 'current',
    principal: 15000000,
    rate: 0.0525,
    termMonths: 60,
    startDate: '2026-01-01',
    type: 'term_loan',
    paymentFrequency: 'monthly',
    amortizationType: 'fully_amortizing',
  },
  {
    id: 'DEBT-002',
    name: 'Wells Revolver',
    lender: 'Wells Fargo',
    displayType: 'Revolving LOC',
    status: 'current',
    principal: 8000000,
    rate: 0.0475,
    termMonths: 36,
    startDate: '2026-01-01',
    type: 'revolver',
    paymentFrequency: 'monthly',
    amortizationType: 'interest_only',
  },
  {
    id: 'DEBT-003',
    name: 'Goldman Senior Notes',
    lender: 'Goldman Sachs',
    displayType: 'Senior Notes',
    status: 'current',
    principal: 25000000,
    rate: 0.065,
    termMonths: 120,
    startDate: '2026-01-01',
    type: 'bond',
    paymentFrequency: 'monthly',
    amortizationType: 'bullet',
  },
  {
    id: 'DEBT-004',
    name: 'BoA Equipment Finance',
    lender: 'Bank of America',
    displayType: 'Equipment Finance',
    status: 'current',
    principal: 2500000,
    rate: 0.0725,
    termMonths: 48,
    startDate: '2026-01-01',
    type: 'term_loan',
    paymentFrequency: 'monthly',
    amortizationType: 'fully_amortizing',
  },
  {
    id: 'DEBT-005',
    name: 'JPM Bridge Loan',
    lender: 'JP Morgan',
    displayType: 'Bridge Loan',
    status: 'watch',
    principal: 10000000,
    rate: 0.08,
    termMonths: 24,
    startDate: '2026-01-01',
    type: 'term_loan',
    paymentFrequency: 'monthly',
    amortizationType: 'bullet',
  },
];

export const useDebtStore = create<DebtState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        instruments: SEED_INSTRUMENTS,

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
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
