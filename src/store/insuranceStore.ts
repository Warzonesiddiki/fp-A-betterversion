import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

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
        rateAdequacy: [
          { month: 'Jan', indicatedRate: 100, filedRate: 95, adequate: 92 },
          { month: 'Feb', indicatedRate: 102, filedRate: 96, adequate: 91 },
          { month: 'Mar', indicatedRate: 105, filedRate: 97, adequate: 93 },
          { month: 'Apr', indicatedRate: 104, filedRate: 98, adequate: 94 },
          { month: 'May', indicatedRate: 106, filedRate: 99, adequate: 95 },
          { month: 'Jun', indicatedRate: 108, filedRate: 100, adequate: 96 },
        ],

        lossPicks: [
          { line: 'Auto', pick: '62.0%', ultimate: '58.5%', dev: '+350bps', credibility: 'High' },
          {
            line: 'Homeowners',
            pick: '68.0%',
            ultimate: '65.2%',
            dev: '+280bps',
            credibility: 'High',
          },
          {
            line: 'Commercial',
            pick: '55.0%',
            ultimate: '53.1%',
            dev: '+190bps',
            credibility: 'Medium',
          },
          {
            line: 'Workers Comp',
            pick: '70.0%',
            ultimate: '67.8%',
            dev: '+220bps',
            credibility: 'High',
          },
          {
            line: 'Liability',
            pick: '52.0%',
            ultimate: '48.5%',
            dev: '+350bps',
            credibility: 'Low',
          },
        ],

        rateFilings: [
          {
            id: 'RF-401',
            line: 'Personal Auto',
            state: 'California',
            filing: 'CA-2026-012',
            change: '+8.4%',
            status: 'Approved',
            effective: 'Jul 2026',
          },
          {
            id: 'RF-402',
            line: 'Homeowners',
            state: 'Florida',
            filing: 'FL-2026-045',
            change: '+12.2%',
            status: 'Pending',
            effective: 'TBD',
          },
          {
            id: 'RF-403',
            line: 'Commercial Auto',
            state: 'Texas',
            filing: 'TX-2026-088',
            change: '+6.5%',
            status: 'Approved',
            effective: 'Aug 2026',
          },
          {
            id: 'RF-404',
            line: 'Workers Comp',
            state: 'New York',
            filing: 'NY-2026-124',
            change: '+4.1%',
            status: 'Objection',
            effective: 'TBD',
          },
        ],

        setRateAdequacy: (data) =>
          set((state) => {
            state.rateAdequacy = data;
          }),

        setLossPicks: (data) =>
          set((state) => {
            state.lossPicks = data;
          }),

        addRateFiling: (filing) =>
          set((state) => {
            state.rateFilings.push(filing);
          }),

        updateRateFiling: (id, updates) =>
          set((state) => {
            const idx = state.rateFilings.findIndex((f) => f.id === id);
            if (idx !== -1) Object.assign(state.rateFilings[idx]!, updates);
          }),
      })),

      {
        name: 'insurance-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
