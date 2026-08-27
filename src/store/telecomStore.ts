import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { divideMoney, sumMoney } from '@/utils/money';
// W6-P0-14: subscriber records carry revenue data (INVENTORY_* family per
// sector-store precedent); network/ARPU analytics datasets use DASHBOARD_UPDATE
// (healthcareStore/insuranceStore metric precedent). Flags stay unguarded.
import { enforce, Permissions } from '../utils/rbacEnforcer';

export interface Subscriber {
  id: string;
  plan: string;
  monthlyRevenue: number;
  churnRisk: 'Low' | 'Medium' | 'High';
  status: 'Active' | 'Suspended' | 'Churned';
}

export interface NetworkMetric {
  region: string;
  uptime: number;
  avgSpeed: number;
  subscribers: number;
}

export interface ARPUTrend {
  month: string;
  arpu: number;
  subscribers: number;
}

interface TelecomState {
  subscribers: Subscriber[];
  networkMetrics: NetworkMetric[];
  arpuTrends: ARPUTrend[];
  isLoading: boolean;
  error: string | null;
  setSubscribers: (subscribers: Subscriber[]) => void;
  addSubscriber: (subscriber: Subscriber) => void;
  updateSubscriber: (id: string, updates: Partial<Subscriber>) => void;
  removeSubscriber: (id: string) => void;
  setNetworkMetrics: (metrics: NetworkMetric[]) => void;
  setArpuTrends: (trends: ARPUTrend[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  getTotalSubscribers: () => number;
  getAverageARPU: () => number;
}

export const useTelecomStore = create<TelecomState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        subscribers: [],
        networkMetrics: [],
        arpuTrends: [],
        isLoading: false,
        error: null,
        setSubscribers: enforce(Permissions.INVENTORY_UPDATE, 'setSubscribers', (subscribers) =>
          set((s) => {
            s.subscribers = subscribers;
          })
        ),
        addSubscriber: enforce(Permissions.INVENTORY_CREATE, 'addSubscriber', (subscriber) =>
          set((s) => {
            s.subscribers.push(subscriber);
          })
        ),
        updateSubscriber: enforce(Permissions.INVENTORY_UPDATE, 'updateSubscriber', (id, updates) =>
          set((s) => {
            const i = s.subscribers.findIndex((x) => x.id === id);
            if (i !== -1) Object.assign(s.subscribers[i]!, updates);
          })
        ),
        removeSubscriber: enforce(Permissions.INVENTORY_DELETE, 'removeSubscriber', (id) =>
          set((s) => {
            s.subscribers = s.subscribers.filter((x) => x.id !== id);
          })
        ),
        setNetworkMetrics: enforce(Permissions.DASHBOARD_UPDATE, 'setNetworkMetrics', (metrics) =>
          set((s) => {
            s.networkMetrics = metrics;
          })
        ),
        setArpuTrends: enforce(Permissions.DASHBOARD_UPDATE, 'setArpuTrends', (trends) =>
          set((s) => {
            s.arpuTrends = trends;
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
        clearAll: enforce(Permissions.INVENTORY_DELETE, 'clearAll', () =>
          set((s) => {
            s.subscribers = [];
            s.networkMetrics = [];
            s.arpuTrends = [];
            s.isLoading = false;
            s.error = null;
          })
        ),
        getTotalSubscribers: () => get().subscribers.filter((s) => s.status === 'Active').length,
        getAverageARPU: () => {
          const active = get().subscribers.filter((s) => s.status === 'Active');
          // ARPU is money: decimal aggregation, never float `+` over revenue.
          return active.length > 0
            ? divideMoney(sumMoney(active.map((s) => s.monthlyRevenue)), active.length).toNumber()
            : 0;
        },
      })),
      {
        name: 'telecom-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
      }
    )
  )
);
