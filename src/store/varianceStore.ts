import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { VarianceState } from '../types';
import { masterStorage } from '../utils/masterStorage';

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

        setAnalyses: (analyses) => set({ analyses }),

        addAnalysis: (analysis) =>
          set((state) => ({
            analyses: [...state.analyses, { ...analysis, id: `var-${Date.now()}` }],
          })),

        deleteAnalysis: (id) =>
          set((state) => ({
            analyses: state.analyses.filter((a) => a.id !== id),
          })),
      })),
      {
        name: 'variance-store',
        storage: masterStorage,
      }
    )
  )
);
