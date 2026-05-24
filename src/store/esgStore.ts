import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

export interface ESGMetric {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  value: number;
  unit: string;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ESGInitiative {
  id: string;
  name: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  spent: number;
}

interface ESGState {
  metrics: ESGMetric[];
  initiatives: ESGInitiative[];
  isLoading: boolean;
  error: string | null;
  setMetrics: (metrics: ESGMetric[]) => void;
  addMetric: (metric: ESGMetric) => void;
  updateMetric: (id: string, updates: Partial<ESGMetric>) => void;
  removeMetric: (id: string) => void;
  setInitiatives: (initiatives: ESGInitiative[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  getMetricsByCategory: (category: ESGMetric['category']) => ESGMetric[];
  getOverallScore: () => number;
}

export const useESGStore = create<ESGState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        metrics: [],
        initiatives: [],
        isLoading: false,
        error: null,

        setMetrics: (metrics) =>
          set((state) => {
            state.metrics = metrics;
          }),

        addMetric: (metric) =>
          set((state) => {
            state.metrics.push(metric);
          }),

        updateMetric: (id, updates) =>
          set((state) => {
            const idx = state.metrics.findIndex((m) => m.id === id);
            if (idx !== -1) Object.assign(state.metrics[idx], updates);
          }),

        removeMetric: (id) =>
          set((state) => {
            state.metrics = state.metrics.filter((m) => m.id !== id);
          }),

        setInitiatives: (initiatives) =>
          set((state) => {
            state.initiatives = initiatives;
          }),

        setLoading: (isLoading) =>
          set((state) => {
            state.isLoading = isLoading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
          }),

        clearAll: () =>
          set((state) => {
            state.metrics = [];
            state.initiatives = [];
            state.isLoading = false;
            state.error = null;
          }),

        getMetricsByCategory: (category) => get().metrics.filter((m) => m.category === category),

        getOverallScore: () => {
          const metrics = get().metrics;
          if (metrics.length === 0) return 0;
          const total = metrics.reduce((sum, m) => sum + (m.value / m.target) * 100, 0);
          return Math.round(total / metrics.length);
        },
      })),
      { name: 'esg-store', storage: masterStorage }
    )
  )
);
