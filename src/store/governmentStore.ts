import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

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
        setFunds: (funds) =>
          set((s) => {
            s.funds = funds;
          }),
        addFund: (fund) =>
          set((s) => {
            s.funds.push(fund);
          }),
        updateFund: (id, updates) =>
          set((s) => {
            const i = s.funds.findIndex((f) => f.id === id);
            if (i !== -1) Object.assign(s.funds[i], updates);
          }),
        removeFund: (id) =>
          set((s) => {
            s.funds = s.funds.filter((f) => f.id !== id);
          }),
        setCompliance: (items) =>
          set((s) => {
            s.compliance = items;
          }),
        setBudgetLines: (lines) =>
          set((s) => {
            s.budgetLines = lines;
          }),
        setLoading: (isLoading) =>
          set((s) => {
            s.isLoading = isLoading;
          }),
        setError: (error) =>
          set((s) => {
            s.error = error;
          }),
        clearAll: () =>
          set((s) => {
            s.funds = [];
            s.compliance = [];
            s.budgetLines = [];
            s.isLoading = false;
            s.error = null;
          }),
        getTotalUtilization: () => {
          const { funds } = get();
          const totalAllocated = funds.reduce((s, f) => s + f.allocated, 0);
          return totalAllocated > 0
            ? (funds.reduce((s, f) => s + f.utilized, 0) / totalAllocated) * 100
            : 0;
        },
        getFundsByStatus: (status) => get().funds.filter((f) => f.status === status),
      })),
      { name: 'government-store', storage: masterStorage }
    )
  )
);
