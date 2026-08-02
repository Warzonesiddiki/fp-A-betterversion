import { describe, it, expect, beforeEach } from 'vitest';
import { useLeaseStore } from './leaseStore';
import type { LeaseInput } from './leaseStore';
import { actAs } from '@/test/rbacFixtures';

const lease = (overrides: Partial<LeaseInput> = {}): LeaseInput => ({
  id: 'L-TEST',
  property: 'Test Office',
  type: 'Operating',
  payment: 10000,
  commencementDate: '2026-01-01',
  leaseTerm: 36,
  discountRate: 0.05,
  ...overrides,
});

describe('leaseStore (GAP-NEW-A)', () => {
  beforeEach(() => {
    actAs('Admin');
    // Reset to a clean, seeded state between tests.
    useLeaseStore.setState({ leases: [] });
  });

  it('exposes a persisted, typed leases array', () => {
    useLeaseStore.getState().setLeases([lease({ id: 'A', property: 'Alpha' })]);
    expect(useLeaseStore.getState().leases).toHaveLength(1);
    expect(useLeaseStore.getState().leases[0]!.property).toBe('Alpha');
  });

  it('addLease appends a lease', () => {
    useLeaseStore.getState().addLease(lease({ id: 'A' }));
    useLeaseStore.getState().addLease(lease({ id: 'B' }));
    expect(useLeaseStore.getState().leases.map((l) => l.id)).toEqual(['A', 'B']);
  });

  it('updateLease merges partial updates by id', () => {
    useLeaseStore.getState().addLease(lease({ id: 'A', payment: 5000 }));
    useLeaseStore.getState().updateLease('A', { payment: 9000, discountRate: 0.07 });
    const updated = useLeaseStore.getState().leases[0]!;
    expect(updated.payment).toBe(9000);
    expect(updated.discountRate).toBe(0.07);
  });

  it('removeLease deletes by id', () => {
    useLeaseStore.getState().addLease(lease({ id: 'A' }));
    useLeaseStore.getState().addLease(lease({ id: 'B' }));
    useLeaseStore.getState().removeLease('A');
    expect(useLeaseStore.getState().leases.map((l) => l.id)).toEqual(['B']);
  });

  it('setLeases replaces the whole portfolio (reachable empty state)', () => {
    useLeaseStore.getState().addLease(lease({ id: 'A' }));
    useLeaseStore.getState().setLeases([]);
    expect(useLeaseStore.getState().leases).toHaveLength(0);
  });
});
