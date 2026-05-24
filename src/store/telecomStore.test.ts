import { describe, it, expect, beforeEach } from 'vitest';
import { useTelecomStore } from './telecomStore';

describe('telecomStore', () => {
  beforeEach(() => {
    useTelecomStore.setState({
      subscribers: [],
      networkMetrics: [],
      arpuTrends: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useTelecomStore.getState();
    expect(state.subscribers).toEqual([]);
    expect(state.networkMetrics).toEqual([]);
    expect(state.arpuTrends).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set subscribers', () => {
    const subscribers = [
      {
        id: 'sub1',
        plan: 'Premium',
        monthlyRevenue: 99.99,
        churnRisk: 'Low' as const,
        status: 'Active' as const,
      },
    ];
    useTelecomStore.getState().setSubscribers(subscribers);
    expect(useTelecomStore.getState().subscribers).toEqual(subscribers);
  });

  it('should add a subscriber', () => {
    useTelecomStore.getState().addSubscriber({
      id: 'sub2',
      plan: 'Basic',
      monthlyRevenue: 29.99,
      churnRisk: 'Medium',
      status: 'Active',
    });
    expect(useTelecomStore.getState().subscribers).toHaveLength(1);
    expect(useTelecomStore.getState().subscribers[0].plan).toBe('Basic');
  });

  it('should update a subscriber', () => {
    useTelecomStore.getState().addSubscriber({
      id: 'sub3',
      plan: 'Standard',
      monthlyRevenue: 59.99,
      churnRisk: 'Low',
      status: 'Active',
    });
    useTelecomStore.getState().updateSubscriber('sub3', { plan: 'Premium', monthlyRevenue: 99.99 });
    const updated = useTelecomStore.getState().subscribers[0];
    expect(updated.plan).toBe('Premium');
    expect(updated.monthlyRevenue).toBe(99.99);
  });

  it('should not update non-existent subscriber', () => {
    useTelecomStore.getState().addSubscriber({
      id: 'sub4',
      plan: 'Basic',
      monthlyRevenue: 29.99,
      churnRisk: 'Low',
      status: 'Active',
    });
    useTelecomStore.getState().updateSubscriber('nonexistent', { plan: 'Premium' });
    expect(useTelecomStore.getState().subscribers[0].plan).toBe('Basic');
  });

  it('should remove a subscriber', () => {
    useTelecomStore.getState().addSubscriber({
      id: 'sub5',
      plan: 'Basic',
      monthlyRevenue: 29.99,
      churnRisk: 'Low',
      status: 'Active',
    });
    useTelecomStore.getState().removeSubscriber('sub5');
    expect(useTelecomStore.getState().subscribers).toHaveLength(0);
  });

  it('should set network metrics', () => {
    const metrics = [{ region: 'Northeast', uptime: 99.99, avgSpeed: 500, subscribers: 50000 }];
    useTelecomStore.getState().setNetworkMetrics(metrics);
    expect(useTelecomStore.getState().networkMetrics).toEqual(metrics);
  });

  it('should set ARPU trends', () => {
    const trends = [{ month: 'Jan 2026', arpu: 65.5, subscribers: 100000 }];
    useTelecomStore.getState().setArpuTrends(trends);
    expect(useTelecomStore.getState().arpuTrends).toEqual(trends);
  });

  it('should set loading state', () => {
    useTelecomStore.getState().setLoading(true);
    expect(useTelecomStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useTelecomStore.getState().setError('Failed');
    expect(useTelecomStore.getState().error).toBe('Failed');
  });

  it('should clear all data', () => {
    useTelecomStore.getState().addSubscriber({
      id: 'sub1',
      plan: 'Basic',
      monthlyRevenue: 29.99,
      churnRisk: 'Low',
      status: 'Active',
    });
    useTelecomStore.getState().setLoading(true);
    useTelecomStore.getState().setError('err');
    useTelecomStore.getState().clearAll();
    const state = useTelecomStore.getState();
    expect(state.subscribers).toEqual([]);
    expect(state.networkMetrics).toEqual([]);
    expect(state.arpuTrends).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should count active subscribers', () => {
    useTelecomStore.getState().setSubscribers([
      { id: 's1', plan: 'A', monthlyRevenue: 50, churnRisk: 'Low', status: 'Active' },
      { id: 's2', plan: 'B', monthlyRevenue: 30, churnRisk: 'High', status: 'Suspended' },
      { id: 's3', plan: 'C', monthlyRevenue: 80, churnRisk: 'Low', status: 'Active' },
      { id: 's4', plan: 'D', monthlyRevenue: 20, churnRisk: 'Medium', status: 'Churned' },
    ]);
    expect(useTelecomStore.getState().getTotalSubscribers()).toBe(2);
  });

  it('should return 0 total subscribers for empty list', () => {
    expect(useTelecomStore.getState().getTotalSubscribers()).toBe(0);
  });

  it('should calculate average ARPU for active subscribers', () => {
    useTelecomStore.getState().setSubscribers([
      { id: 's1', plan: 'A', monthlyRevenue: 50, churnRisk: 'Low', status: 'Active' },
      { id: 's2', plan: 'B', monthlyRevenue: 100, churnRisk: 'Low', status: 'Active' },
      { id: 's3', plan: 'C', monthlyRevenue: 30, churnRisk: 'High', status: 'Suspended' },
    ]);
    // (50+100)/2 = 75
    expect(useTelecomStore.getState().getAverageARPU()).toBe(75);
  });

  it('should return 0 ARPU when no active subscribers', () => {
    useTelecomStore
      .getState()
      .setSubscribers([
        { id: 's1', plan: 'A', monthlyRevenue: 50, churnRisk: 'Low', status: 'Suspended' },
      ]);
    expect(useTelecomStore.getState().getAverageARPU()).toBe(0);
  });

  it('should return 0 ARPU for empty subscribers', () => {
    expect(useTelecomStore.getState().getAverageARPU()).toBe(0);
  });
});
