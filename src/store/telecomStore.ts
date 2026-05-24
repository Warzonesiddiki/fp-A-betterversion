import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';

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
        setSubscribers: (subscribers) =>
          set((s) => {
            s.subscribers = subscribers;
          }),
        addSubscriber: (subscriber) =>
          set((s) => {
            s.subscribers.push(subscriber);
          }),
        updateSubscriber: (id, updates) =>
          set((s) => {
            const i = s.subscribers.findIndex((x) => x.id === id);
            if (i !== -1) Object.assign(s.subscribers[i], updates);
          }),
        removeSubscriber: (id) =>
          set((s) => {
            s.subscribers = s.subscribers.filter((x) => x.id !== id);
          }),
        setNetworkMetrics: (metrics) =>
          set((s) => {
            s.networkMetrics = metrics;
          }),
        setArpuTrends: (trends) =>
          set((s) => {
            s.arpuTrends = trends;
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
            s.subscribers = [];
            s.networkMetrics = [];
            s.arpuTrends = [];
            s.isLoading = false;
            s.error = null;
          }),
        getTotalSubscribers: () => get().subscribers.filter((s) => s.status === 'Active').length,
        getAverageARPU: () => {
          const active = get().subscribers.filter((s) => s.status === 'Active');
          return active.length > 0
            ? active.reduce((sum, s) => sum + s.monthlyRevenue, 0) / active.length
            : 0;
        },
      })),
      { name: 'telecom-store', storage: masterStorage }
    )
  )
);
