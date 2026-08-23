import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { sumMoney } from '@/utils/money';
// W6-P0-14: public-fund allocations, compliance items and budget lines are
// planning data — BUDGET_* family per sector-store precedent
// (healthcareStore programs / insuranceStore rate filings). Loading/error
// flags stay unguarded.
import { enforce, Permissions } from '../utils/rbacEnforcer';

export interface FundAllocation {
  id: string;
  fund: string;
  department: string;
  allocated: number;
  utilized: number;
  status: 'On Track' | 'At Risk' | 'Overspent';
}

export interface ComplianceItem {
  id: string;
  regulation: string;
  agency: string;
  nextAudit: string;
  status: 'Compliant' | 'Pending Review' | 'Non-Compliant';
}

export interface BudgetLine {
  category: string;
  budgeted: number;
  actual: number;
}

interface GovernmentState {
  funds: FundAllocation[];
  compliance: ComplianceItem[];
  budgetLines: BudgetLine[];
  isLoading: boolean;
  error: string | null;
  setFunds: (funds: FundAllocation[]) => void;
  addFund: (fund: FundAllocation) => void;
  updateFund: (id: string, updates: Partial<FundAllocation>) => void;
  removeFund: (id: string) => void;
  setCompliance: (items: ComplianceItem[]) => void;
  setBudgetLines: (lines: BudgetLine[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  getTotalUtilization: () => number;
  getFundsByStatus: (status: FundAllocation['status']) => FundAllocation[];
}

export const useGovernmentStore = create<GovernmentState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        funds: [],
        compliance: [],
        budgetLines: [],
        isLoading: false,
        error: null,
        setFunds: enforce(Permissions.BUDGET_UPDATE, 'setFunds', (funds) =>
          set((s) => {
            s.funds = funds;
          })
        ),
        addFund: enforce(Permissions.BUDGET_CREATE, 'addFund', (fund) =>
          set((s) => {
            s.funds.push(fund);
          })
        ),
        updateFund: enforce(Permissions.BUDGET_UPDATE, 'updateFund', (id, updates) =>
          set((s) => {
            const i = s.funds.findIndex((f) => f.id === id);
            if (i !== -1) Object.assign(s.funds[i]!, updates);
          })
        ),
        removeFund: enforce(Permissions.BUDGET_DELETE, 'removeFund', (id) =>
          set((s) => {
            s.funds = s.funds.filter((f) => f.id !== id);
          })
        ),
        setCompliance: enforce(Permissions.BUDGET_UPDATE, 'setCompliance', (items) =>
          set((s) => {
            s.compliance = items;
          })
        ),
        setBudgetLines: enforce(Permissions.BUDGET_UPDATE, 'setBudgetLines', (lines) =>
          set((s) => {
            s.budgetLines = lines;
          })
        ),
        setLoading: (isLoading) =>
          set((s) => {
            s.isLoading = isLoading;
          }),
        setError: (error) =>
          set((s) => {
            s.error = error;
          }),
        clearAll: enforce(Permissions.BUDGET_DELETE, 'clearAll', () =>
          set((s) => {
            s.funds = [];
            s.compliance = [];
            s.budgetLines = [];
            s.isLoading = false;
            s.error = null;
          })
        ),
        getTotalUtilization: () => {
          const { funds } = get();
          // Sum the money amounts exactly, then compute the utilization ratio.
          const totalAllocated = sumMoney(funds.map((f) => f.allocated));
          if (totalAllocated.lessThanOrEqualTo(0)) return 0;
          const totalUtilized = sumMoney(funds.map((f) => f.utilized));
          return totalUtilized.div(totalAllocated).times(100).toNumber();
        },
        getFundsByStatus: (status) => get().funds.filter((f) => f.status === status),
      })),
      {
        name: 'government-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
