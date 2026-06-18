import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ExchangeRate } from '@/types';
import { masterStorage } from '@/utils/masterStorage';
import { enforce, Permissions } from '@/utils/rbacEnforcer';

interface FxRateState {
  rates: ExchangeRate[];
  setRates: (rates: ExchangeRate[]) => void;
  addRate: (rate: ExchangeRate) => void;
  updateRate: (id: string, rate: Partial<Omit<ExchangeRate, 'id'>>) => void;
  deleteRate: (id: string) => void;
}

export const useFxRateStore = create<FxRateState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        rates: [],

        setRates: enforce(Permissions.FORECAST_UPDATE, 'setRates', (rates) => set({ rates })),

        addRate: enforce(Permissions.FORECAST_CREATE, 'addRate', (rate) =>
          set((state) => ({ rates: [...state.rates, rate] }))
        ),

        updateRate: enforce(Permissions.FORECAST_UPDATE, 'updateRate', (id, updates) =>
          set((state) => ({
            rates: state.rates.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          }))
        ),

        deleteRate: (id) => set((state) => ({ rates: state.rates.filter((r) => r.id !== id) })),
      })),
      {
        name: 'fx-rate-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);

export const fxRateSelectors = {
  rates: (state: FxRateState) => state.rates,
  rateCount: (state: FxRateState) => state.rates.length,
  hasRates: (state: FxRateState) => state.rates.length > 0,
  findRate: (fromCurrency: string, toCurrency: string) => (state: FxRateState) =>
    state.rates.find((r) => r.fromCurrency === fromCurrency && r.toCurrency === toCurrency) ?? null,
};
