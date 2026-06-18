import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { VarianceState } from '../types';
import { masterStorage } from '../utils/masterStorage';
import { enforce, Permissions } from '../utils/rbacEnforcer';

export const useVarianceStore = create<VarianceState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        analyses: [],
        isLoading: false,
        error: null,

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),

        setAnalyses: enforce(Permissions.VARIANCE_UPDATE, 'setAnalyses', (analyses) => set({ analyses })),

        addAnalysis: enforce(Permissions.VARIANCE_CREATE, 'addAnalysis', (analysis) =>
          set((state) => ({
            analyses: [...state.analyses, { ...analysis, id: `var-${Date.now()}` }],
          }))),

        deleteAnalysis: enforce(Permissions.VARIANCE_DELETE, 'deleteAnalysis', (id) =>
          set((state) => ({
            analyses: state.analyses.filter((a) => a.id !== id),
          }))),
      })),
      {
        name: 'variance-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
