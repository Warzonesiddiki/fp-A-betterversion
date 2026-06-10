import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { masterStorage } from '@/utils/masterStorage';

export type WidgetType =
  | 'kpi'
  | 'chart'
  | 'table'
  | 'text'
  | 'image'
  | 'filter'
  | 'gauge'
  | 'sparkline';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  config: Record<string, unknown>;
  dataSource?: string;
  refreshInterval?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: 'grid' | 'free';
  columns: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isTemplate: boolean;
  tags: string[];
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  widgetIds: string[];
  config: Record<string, unknown>;
}

export interface DashboardState {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  filters: Record<string, DashboardFilter[]>;
  isLoading: boolean;
  error: string | null;

  setDashboards: (dashboards: Dashboard[]) => void;
  addDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  setActiveDashboard: (id: string | null) => void;

  addWidget: (dashboardId: string, widget: Omit<Widget, 'id'>) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  moveWidget: (dashboardId: string, widgetId: string, position: WidgetPosition) => void;

  addFilter: (dashboardId: string, filter: Omit<DashboardFilter, 'id'>) => void;
  removeFilter: (dashboardId: string, filterId: string) => void;

  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        dashboards: [],
        activeDashboardId: null,
        filters: {},
        isLoading: false,
        error: null,

        setDashboards: (dashboards) => set({ dashboards }),

        addDashboard: (data) => {
          const id = generateId('dash');
          const now = new Date().toISOString();
          const dashboard: Dashboard = { ...data, id, createdAt: now, updatedAt: now };
          set((state) => ({ dashboards: [...state.dashboards, dashboard] }));
          return id;
        },

        updateDashboard: (id, updates) =>
          set((state) => ({
            dashboards: state.dashboards.map((d) =>
              d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
            ),
          })),

        deleteDashboard: (id) =>
          set((state) => ({
            dashboards: state.dashboards.filter((d) => d.id !== id),
            activeDashboardId: state.activeDashboardId === id ? null : state.activeDashboardId,
          })),

        setActiveDashboard: (id) => set({ activeDashboardId: id }),

        addWidget: (dashboardId, data) =>
          set((state) => ({
            dashboards: state.dashboards.map((d) => {
              if (d.id !== dashboardId) return d;
              const widget: Widget = { ...data, id: generateId('w') };
              return { ...d, widgets: [...d.widgets, widget], updatedAt: new Date().toISOString() };
            }),
          })),

        updateWidget: (dashboardId, widgetId, updates) =>
          set((state) => ({
            dashboards: state.dashboards.map((d) => {
              if (d.id !== dashboardId) return d;
              return {
                ...d,
                widgets: d.widgets.map((w) => (w.id === widgetId ? { ...w, ...updates } : w)),
                updatedAt: new Date().toISOString(),
              };
            }),
          })),

        removeWidget: (dashboardId, widgetId) =>
          set((state) => ({
            dashboards: state.dashboards.map((d) => {
              if (d.id !== dashboardId) return d;
              return {
                ...d,
                widgets: d.widgets.filter((w) => w.id !== widgetId),
                updatedAt: new Date().toISOString(),
              };
            }),
          })),

        moveWidget: (dashboardId, widgetId, position) =>
          set((state) => ({
            dashboards: state.dashboards.map((d) => {
              if (d.id !== dashboardId) return d;
              return {
                ...d,
                widgets: d.widgets.map((w) => (w.id === widgetId ? { ...w, position } : w)),
                updatedAt: new Date().toISOString(),
              };
            }),
          })),

        addFilter: (dashboardId, data) =>
          set((state) => {
            const filter: DashboardFilter = { ...data, id: generateId('flt') };
            const existing = state.filters[dashboardId] ?? [];
            return { filters: { ...state.filters, [dashboardId]: [...existing, filter] } };
          }),

        removeFilter: (dashboardId, filterId) =>
          set((state) => {
            const existing = state.filters[dashboardId] ?? [];
            return {
              filters: {
                ...state.filters,
                [dashboardId]: existing.filter((f) => f.id !== filterId),
              },
            };
          }),

        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'dashboard-store',
        storage: masterStorage,
      }
    )
  )
);

export const dashboardSelectors = {
  dashboards: (state: DashboardState) => state.dashboards,
  activeDashboardId: (state: DashboardState) => state.activeDashboardId,
  activeDashboard: (state: DashboardState) =>
    state.dashboards.find((d) => d.id === state.activeDashboardId) ?? null,
  dashboardCount: (state: DashboardState) => state.dashboards.length,
  hasDashboards: (state: DashboardState) => state.dashboards.length > 0,
  getFilters: (dashboardId: string) => (state: DashboardState) => state.filters[dashboardId] ?? [],
};
