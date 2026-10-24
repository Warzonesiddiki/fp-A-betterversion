import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

export interface RateAdequacyPoint {
  month: string;
  indicatedRate: number;
  filedRate: number;
  adequate: number;
}

export interface LossPickEntry {
  line: string;
  pick: string;
  ultimate: string;
  dev: string;
  credibility: 'High' | 'Medium' | 'Low';
}

export interface RateFiling {
  id: string;
  line: string;
  state: string;
  filing: string;
  change: string;
  status: 'Approved' | 'Pending' | 'Objection';
  effective: string;
}

interface InsuranceState {
  rateAdequacy: RateAdequacyPoint[];
  lossPicks: LossPickEntry[];
  rateFilings: RateFiling[];
  setRateAdequacy: (data: RateAdequacyPoint[]) => void;
  setLossPicks: (data: LossPickEntry[]) => void;
  addRateFiling: (filing: RateFiling) => void;
  updateRateFiling: (id: string, updates: Partial<RateFiling>) => void;
}

export const useInsuranceStore = create<InsuranceState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        rateAdequacy: [],
        lossPicks: [],
        rateFilings: [],

        setRateAdequacy: enforce(Permissions.DASHBOARD_UPDATE, 'setRateAdequacy', (data) =>
          set((state) => {
            state.rateAdequacy = data;
          })
        ),

        setLossPicks: enforce(Permissions.DASHBOARD_UPDATE, 'setLossPicks', (data) =>
          set((state) => {
            state.lossPicks = data;
          })
        ),

        addRateFiling: enforce(Permissions.BUDGET_CREATE, 'addRateFiling', (filing) =>
          set((state) => {
            state.rateFilings.push(filing);
          })
        ),

        updateRateFiling: enforce(Permissions.BUDGET_UPDATE, 'updateRateFiling', (id, updates) =>
          set((state) => {
            const idx = state.rateFilings.findIndex((f) => f.id === id);
            if (idx !== -1) Object.assign(state.rateFilings[idx]!, updates);
          })
        ),
      })),

      {
        name: 'insurance-store',
        storage: masterStorage,
        version: 2,
        migrate: (state: unknown, version: number) => {
          if (version < 2) {
            return { rateAdequacy: [], lossPicks: [], rateFilings: [] };
          }
          return state;
        },
      }
    )
  )
);
