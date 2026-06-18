import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { AnalyticsFilter, AnalyticsState } from '@/types';
import { masterStorage } from '../utils/masterStorage';
import { useUIStore } from './uiStore';
import { enforce, Permissions } from '../utils/rbacEnforcer';

const defaultFilter: AnalyticsFilter = {
  accountTypes: ['Revenue', 'COGS', 'OpEx'],
  departments: [],
  entities: [],
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
};

export const useAnalyticsStore = create<AnalyticsState>()(
  subscribeWithSelector(
    persist(
      immer((set) => ({
        charts: [],
        selectedChartId: null,
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        selectedMetrics: ['revenue', 'expenses', 'netIncome'],
        filter: { ...defaultFilter },
        isDrillDown: false,
        drillDownPath: [],
        error: null,
        isLoading: false,

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (isLoading) => set({ isLoading }),

        addChart: enforce(Permissions.DASHBOARD_CREATE, 'addChart', (chart) => {
          const id = `chart-${Date.now()}`;
          set((state) => ({ charts: [...state.charts, { ...chart, id }] }));
          useUIStore.getState().addToast({
            type: 'success',
            title: 'Chart Added',
            message: `Successfully created chart: ${chart.name}`,
          });
        }),

        updateChart: enforce(Permissions.DASHBOARD_UPDATE, 'updateChart', (id, updates) => {
          set((state) => ({
            charts: state.charts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          }));
        }),

        removeChart: enforce(Permissions.DASHBOARD_DELETE, 'removeChart', (id) => {
          set((state) => {
            const chart = state.charts.find((c) => c.id === id);
            if (chart) {
              useUIStore.getState().addToast({
                type: 'info',
                title: 'Chart Removed',
                message: `Successfully removed chart: ${chart.name}`,
              });
            }
            return {
              charts: state.charts.filter((c) => c.id !== id),
              selectedChartId: state.selectedChartId === id ? null : state.selectedChartId,
            };
          });
        }),

        setSelectedChart: (id) => set({ selectedChartId: id }),

        setDateRange: (dateRange) => set({ dateRange }),

        setSelectedMetrics: (selectedMetrics) => set({ selectedMetrics }),

        setFilter: (filter) => {
          set((state) => ({ filter: { ...state.filter, ...filter } }));
        },

        clearFilters: () => {
          set({ filter: { ...defaultFilter } });
          useUIStore.getState().addToast({
            type: 'info',
            title: 'Filters Cleared',
            message: 'Analytics filters have been reset to default values',
          });
        },

        enterDrillDown: (dimension) => {
          set((state) => ({
            isDrillDown: true,
            drillDownPath: [...state.drillDownPath, dimension],
          }));
        },

        exitDrillDown: () => {
          set((state) => {
            const newPath = state.drillDownPath.slice(0, -1);
            return {
              drillDownPath: newPath,
              isDrillDown: newPath.length > 0,
            };
          });
        },
      })),
      {
        name: 'analytics-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
