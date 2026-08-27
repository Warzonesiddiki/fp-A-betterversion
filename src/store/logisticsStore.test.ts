import { describe, it, expect, beforeEach } from 'vitest';
import { useLogisticsStore } from './logisticsStore';
import { useAuthStore } from './authStore';

// W6-P0-14: RBAC-aware fixture — grants exactly the permissions this store's
// guarded actions enforce (mirrors glUploadStore.test.ts).
function authenticateLogisticsUser() {
  useAuthStore.setState({
    user: {
      id: 'logistics-test-user',
      email: 'logistics-test@finplan.local',
      firstName: 'Logistics',
      lastName: 'Tester',
      avatarUrl: null,
      role: 'Admin',
      departmentId: 'finance',
      departmentName: 'Finance',
      entityId: 'entity-001',
      status: 'Active',
      lastLoginAt: new Date().toISOString(),
      mfaEnabled: false,
      permissions: ['inventory:create', 'inventory:update', 'inventory:delete', 'dashboard:update'],
    },
    isAuthenticated: true,
  });
}

describe('logisticsStore', () => {
  beforeEach(() => {
    authenticateLogisticsUser();
    useLogisticsStore.setState({
      shipments: [],
      carrierPerformance: [],
      routeCosts: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useLogisticsStore.getState();
    expect(state.shipments).toEqual([]);
    expect(state.carrierPerformance).toEqual([]);
    expect(state.routeCosts).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set shipments', () => {
    const shipments = [
      {
        id: 's1',
        origin: 'Shanghai',
        destination: 'LA',
        carrier: 'Maersk',
        status: 'In Transit' as const,
        cost: 5000,
        eta: '2026-02-01',
      },
    ];
    useLogisticsStore.getState().setShipments(shipments);
    expect(useLogisticsStore.getState().shipments).toEqual(shipments);
  });

  it('should add a shipment', () => {
    useLogisticsStore.getState().addShipment({
      id: 's2',
      origin: 'Hamburg',
      destination: 'NYC',
      carrier: 'Hapag-Lloyd',
      status: 'Delivered',
      cost: 4500,
      eta: '2026-01-15',
    });
    expect(useLogisticsStore.getState().shipments).toHaveLength(1);
    expect(useLogisticsStore!.getState().shipments[0]!.carrier).toBe('Hapag-Lloyd');
  });

  it('should update a shipment', () => {
    useLogisticsStore.getState().addShipment({
      id: 's3',
      origin: 'Tokyo',
      destination: 'Seattle',
      carrier: 'ONE',
      status: 'In Transit',
      cost: 3000,
      eta: '2026-03-01',
    });
    useLogisticsStore.getState().updateShipment('s3', { status: 'Delivered' });
    expect(useLogisticsStore!.getState().shipments[0]!.status).toBe('Delivered');
  });

  it('should not update non-existent shipment', () => {
    useLogisticsStore.getState().addShipment({
      id: 's4',
      origin: 'A',
      destination: 'B',
      carrier: 'C',
      status: 'In Transit',
      cost: 100,
      eta: '2026-01-01',
    });
    useLogisticsStore.getState().updateShipment('nonexistent', { status: 'Delivered' });
    expect(useLogisticsStore!.getState().shipments[0]!.status).toBe('In Transit');
  });

  it('should remove a shipment', () => {
    useLogisticsStore.getState().addShipment({
      id: 's5',
      origin: 'A',
      destination: 'B',
      carrier: 'C',
      status: 'In Transit',
      cost: 100,
      eta: '2026-01-01',
    });
    useLogisticsStore.getState().removeShipment('s5');
    expect(useLogisticsStore.getState().shipments).toHaveLength(0);
  });

  it('should set carrier performance', () => {
    const perf = [{ carrier: 'Maersk', onTimeRate: 95, avgCost: 4500, volume: 1200 }];
    useLogisticsStore.getState().setCarrierPerformance(perf);
    expect(useLogisticsStore.getState().carrierPerformance).toEqual(perf);
  });

  it('should set route costs', () => {
    const costs = [{ route: 'Shanghai-LA', cost: 5000, volume: 500 }];
    useLogisticsStore.getState().setRouteCosts(costs);
    expect(useLogisticsStore.getState().routeCosts).toEqual(costs);
  });

  it('should set loading state', () => {
    useLogisticsStore.getState().setLoading(true);
    expect(useLogisticsStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useLogisticsStore.getState().setError('Failed');
    expect(useLogisticsStore.getState().error).toBe('Failed');
  });

  it('should clear all data', () => {
    useLogisticsStore.getState().addShipment({
      id: 's1',
      origin: 'A',
      destination: 'B',
      carrier: 'C',
      status: 'In Transit',
      cost: 100,
      eta: '2026-01-01',
    });
    useLogisticsStore.getState().setLoading(true);
    useLogisticsStore.getState().setError('err');
    useLogisticsStore.getState().clearAll();
    const state = useLogisticsStore.getState();
    expect(state.shipments).toEqual([]);
    expect(state.carrierPerformance).toEqual([]);
    expect(state.routeCosts).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should count active shipments (In Transit)', () => {
    useLogisticsStore.getState().setShipments([
      {
        id: 's1',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'In Transit',
        cost: 100,
        eta: '2026-01-01',
      },
      {
        id: 's2',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'Delivered',
        cost: 100,
        eta: '2026-01-01',
      },
      {
        id: 's3',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'In Transit',
        cost: 100,
        eta: '2026-01-01',
      },
    ]);
    expect(useLogisticsStore.getState().getActiveShipmentCount()).toBe(2);
  });

  it('should return 0 active shipments for empty list', () => {
    expect(useLogisticsStore.getState().getActiveShipmentCount()).toBe(0);
  });

  it('should calculate on-time rate', () => {
    useLogisticsStore.getState().setShipments([
      {
        id: 's1',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'Delivered',
        cost: 100,
        eta: '2026-01-01',
      },
      {
        id: 's2',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'Delivered',
        cost: 100,
        eta: '2026-01-01',
      },
      {
        id: 's3',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'Delayed',
        cost: 100,
        eta: '2026-01-01',
      },
    ]);
    // 2 delivered out of 3 (delivered+delayed) = 66.67%
    expect(useLogisticsStore.getState().getOnTimeRate()).toBeCloseTo(66.67, 1);
  });

  it('should return 0 on-time rate when no delivered/delayed shipments', () => {
    useLogisticsStore.getState().setShipments([
      {
        id: 's1',
        origin: 'A',
        destination: 'B',
        carrier: 'C',
        status: 'In Transit',
        cost: 100,
        eta: '2026-01-01',
      },
    ]);
    expect(useLogisticsStore.getState().getOnTimeRate()).toBe(0);
  });

  it('should return 0 on-time rate for empty shipments', () => {
    expect(useLogisticsStore.getState().getOnTimeRate()).toBe(0);
  });
});
