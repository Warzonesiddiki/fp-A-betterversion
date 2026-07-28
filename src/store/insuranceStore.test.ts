import { describe, it, expect, beforeEach } from 'vitest';
import { useInsuranceStore } from './insuranceStore';
import { actAs } from '@/test/rbacFixtures';

describe('insuranceStore', () => {
  beforeEach(() => {
    actAs('Admin');
    useInsuranceStore.setState({
      rateAdequacy: [],
      lossPicks: [],
      rateFilings: [],
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useInsuranceStore.getState();
    expect(state.rateAdequacy).toEqual([]);
    expect(state.lossPicks).toEqual([]);
    expect(state.rateFilings).toEqual([]);
  });

  it('should set rate adequacy data', () => {
    const data = [{ month: 'Jan', indicatedRate: 100, filedRate: 95, adequate: 92 }];
    useInsuranceStore.getState().setRateAdequacy(data);
    expect(useInsuranceStore.getState().rateAdequacy).toEqual(data);
  });

  it('should set loss picks', () => {
    const picks = [
      { line: 'Auto', pick: '$5M', ultimate: '$4.8M', dev: '95%', credibility: 'High' as const },
    ];
    useInsuranceStore.getState().setLossPicks(picks);
    expect(useInsuranceStore.getState().lossPicks).toEqual(picks);
  });

  it('should add a rate filing', () => {
    useInsuranceStore.getState().addRateFiling({
      id: 'RF-001',
      line: 'Homeowners',
      state: 'CA',
      filing: 'HO-2026-01',
      change: '+5.2%',
      status: 'Pending',
      effective: '2026-07-01',
    });
    expect(useInsuranceStore.getState().rateFilings).toHaveLength(1);
    expect(useInsuranceStore!.getState().rateFilings[0]!.line).toBe('Homeowners');
  });

  it('should update a rate filing', () => {
    useInsuranceStore.getState().addRateFiling({
      id: 'RF-002',
      line: 'Commercial',
      state: 'NY',
      filing: 'CO-2026-02',
      change: '+3.1%',
      status: 'Pending',
      effective: '2026-08-01',
    });
    useInsuranceStore.getState().updateRateFiling('RF-002', { status: 'Approved' });
    expect(useInsuranceStore!.getState().rateFilings[0]!.status).toBe('Approved');
  });

  it('should not update non-existent filing', () => {
    useInsuranceStore.getState().addRateFiling({
      id: 'RF-003',
      line: 'Life',
      state: 'TX',
      filing: 'LF-2026-03',
      change: '+1.5%',
      status: 'Pending',
      effective: '2026-09-01',
    });
    useInsuranceStore.getState().updateRateFiling('RF-999', { status: 'Approved' });
    expect(useInsuranceStore!.getState().rateFilings[0]!.status).toBe('Pending');
  });
});
