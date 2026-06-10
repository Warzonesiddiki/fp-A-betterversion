import { describe, it, expect, beforeEach } from 'vitest';
import { useGovernmentStore } from './governmentStore';

describe('governmentStore', () => {
  beforeEach(() => {
    useGovernmentStore.setState({
      funds: [],
      compliance: [],
      budgetLines: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useGovernmentStore.getState();
    expect(state.funds).toEqual([]);
    expect(state.compliance).toEqual([]);
    expect(state.budgetLines).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set funds', () => {
    const funds = [
      {
        id: 'f1',
        fund: 'General Fund',
        department: 'Public Works',
        allocated: 5000000,
        utilized: 3500000,
        status: 'On Track' as const,
      },
    ];
    useGovernmentStore.getState().setFunds(funds);
    expect(useGovernmentStore.getState().funds).toEqual(funds);
  });

  it('should add a fund', () => {
    useGovernmentStore.getState().addFund({
      id: 'f2',
      fund: 'Education Fund',
      department: 'Education',
      allocated: 2000000,
      utilized: 1800000,
      status: 'At Risk',
    });
    expect(useGovernmentStore.getState().funds).toHaveLength(1);
    expect(useGovernmentStore!.getState().funds[0]!.fund).toBe('Education Fund');
  });

  it('should update a fund', () => {
    useGovernmentStore.getState().addFund({
      id: 'f3',
      fund: 'Health Fund',
      department: 'Health',
      allocated: 3000000,
      utilized: 2500000,
      status: 'On Track',
    });
    useGovernmentStore.getState().updateFund('f3', { status: 'Overspent', utilized: 3200000 });
    const updated = useGovernmentStore.getState().funds[0];
    expect(updated!.status).toBe('Overspent');
    expect(updated!.utilized).toBe(3200000);
  });

  it('should not update non-existent fund', () => {
    useGovernmentStore.getState().addFund({
      id: 'f4',
      fund: 'Test',
      department: 'Test',
      allocated: 100,
      utilized: 50,
      status: 'On Track',
    });
    useGovernmentStore.getState().updateFund('nonexistent', { status: 'Overspent' });
    expect(useGovernmentStore!.getState().funds[0]!.status).toBe('On Track');
  });

  it('should remove a fund', () => {
    useGovernmentStore.getState().addFund({
      id: 'f5',
      fund: 'ToRemove',
      department: 'Test',
      allocated: 100,
      utilized: 50,
      status: 'On Track',
    });
    useGovernmentStore.getState().removeFund('f5');
    expect(useGovernmentStore.getState().funds).toHaveLength(0);
  });

  it('should set compliance items', () => {
    const items = [
      {
        id: 'c1',
        regulation: 'SOX',
        agency: 'SEC',
        nextAudit: '2026-06-01',
        status: 'Compliant' as const,
      },
    ];
    useGovernmentStore.getState().setCompliance(items);
    expect(useGovernmentStore.getState().compliance).toEqual(items);
  });

  it('should set budget lines', () => {
    const lines = [{ category: 'Salaries', budgeted: 1000000, actual: 950000 }];
    useGovernmentStore.getState().setBudgetLines(lines);
    expect(useGovernmentStore.getState().budgetLines).toEqual(lines);
  });

  it('should set loading state', () => {
    useGovernmentStore.getState().setLoading(true);
    expect(useGovernmentStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useGovernmentStore.getState().setError('Failed');
    expect(useGovernmentStore.getState().error).toBe('Failed');
  });

  it('should clear all data', () => {
    useGovernmentStore.getState().addFund({
      id: 'f1',
      fund: 'Test',
      department: 'Test',
      allocated: 100,
      utilized: 50,
      status: 'On Track',
    });
    useGovernmentStore.getState().setLoading(true);
    useGovernmentStore.getState().setError('err');
    useGovernmentStore.getState().clearAll();
    const state = useGovernmentStore.getState();
    expect(state.funds).toEqual([]);
    expect(state.compliance).toEqual([]);
    expect(state.budgetLines).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should calculate total utilization percentage', () => {
    useGovernmentStore.getState().setFunds([
      { id: 'f1', fund: 'A', department: 'D1', allocated: 1000, utilized: 500, status: 'On Track' },
      { id: 'f2', fund: 'B', department: 'D2', allocated: 1000, utilized: 800, status: 'On Track' },
    ]);
    // total utilized=1300, total allocated=2000 => 65%
    expect(useGovernmentStore.getState().getTotalUtilization()).toBe(65);
  });

  it('should return 0 utilization for empty funds', () => {
    expect(useGovernmentStore.getState().getTotalUtilization()).toBe(0);
  });

  it('should return 0 utilization when total allocated is 0', () => {
    useGovernmentStore
      .getState()
      .setFunds([
        { id: 'f1', fund: 'A', department: 'D1', allocated: 0, utilized: 0, status: 'On Track' },
      ]);
    expect(useGovernmentStore.getState().getTotalUtilization()).toBe(0);
  });

  it('should filter funds by status', () => {
    useGovernmentStore.getState().setFunds([
      { id: 'f1', fund: 'A', department: 'D1', allocated: 100, utilized: 50, status: 'On Track' },
      { id: 'f2', fund: 'B', department: 'D2', allocated: 200, utilized: 180, status: 'At Risk' },
      { id: 'f3', fund: 'C', department: 'D3', allocated: 300, utilized: 350, status: 'Overspent' },
    ]);
    expect(useGovernmentStore.getState().getFundsByStatus('On Track')).toHaveLength(1);
    expect(useGovernmentStore.getState().getFundsByStatus('At Risk')).toHaveLength(1);
    expect(useGovernmentStore.getState().getFundsByStatus('Overspent')).toHaveLength(1);
  });
});
