import { describe, it, expect, beforeEach } from 'vitest';
import { useVarianceStore } from './varianceStore';
import type { VarianceAnalysis } from '../types';
import { actAs } from '@/test/rbacFixtures';

function createMockAnalysis(overrides?: Partial<VarianceAnalysis>): VarianceAnalysis {
  return {
    id: `var-${Date.now()}`,
    accountId: 'acc-001',
    accountName: 'Test Account',
    accountCode: 'A-001',
    accountType: 'Revenue',
    budgetAmount: 1000,
    actualAmount: 1200,
    forecastAmount: 1100,
    dollarVariance: 200,
    percentVariance: 0.2,
    varianceStatus: 'Favorable',
    thresholdStatus: 'Within',
    commentary: null,
    commentaryStatus: 'NotStarted',
    monthlyBreakdown: [],
    rateVariance: 0,
    volumeVariance: 0,
    ...overrides,
  };
}

describe('varianceStore', () => {
  beforeEach(() => {
    actAs('Admin');
    useVarianceStore.setState({
      analyses: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have correct initial state', () => {
    const state = useVarianceStore.getState();
    expect(state.analyses).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set analyses', () => {
    const analyses = [createMockAnalysis({ id: 'var-1', accountName: 'Q1 Variance' })];
    useVarianceStore.getState().setAnalyses(analyses);
    expect(useVarianceStore.getState().analyses).toEqual(analyses);
  });

  it('should add an analysis', () => {
    useVarianceStore
      .getState()
      .addAnalysis(createMockAnalysis({ accountName: 'Revenue Variance' }));
    expect(useVarianceStore.getState().analyses).toHaveLength(1);
    expect(useVarianceStore!.getState().analyses[0]!.accountName).toBe('Revenue Variance');
  });

  it('should assign id to new analysis', () => {
    useVarianceStore.getState().addAnalysis(createMockAnalysis());
    expect(useVarianceStore!.getState().analyses[0]!.id).toBeDefined();
    expect(useVarianceStore!.getState().analyses[0]!.id).toContain('var-');
  });

  it('should delete an analysis', () => {
    useVarianceStore.getState().addAnalysis(createMockAnalysis());
    const id = useVarianceStore!.getState().analyses[0]!.id;
    useVarianceStore.getState().deleteAnalysis(id);
    expect(useVarianceStore.getState().analyses).toHaveLength(0);
  });

  it('should not delete non-existent analysis', () => {
    useVarianceStore.getState().addAnalysis(createMockAnalysis());
    useVarianceStore.getState().deleteAnalysis('non-existent');
    expect(useVarianceStore.getState().analyses).toHaveLength(1);
  });

  it('should set and clear error', () => {
    useVarianceStore.getState().setError('Something went wrong');
    expect(useVarianceStore.getState().error).toBe('Something went wrong');
    useVarianceStore.getState().clearError();
    expect(useVarianceStore.getState().error).toBeNull();
  });

  it('should set loading state', () => {
    useVarianceStore.getState().setLoading(true);
    expect(useVarianceStore.getState().isLoading).toBe(true);
    useVarianceStore.getState().setLoading(false);
    expect(useVarianceStore.getState().isLoading).toBe(false);
  });

  it('should handle multiple analyses', () => {
    useVarianceStore.getState().addAnalysis(createMockAnalysis({ accountName: 'A' }));
    useVarianceStore.getState().addAnalysis(createMockAnalysis({ accountName: 'B' }));
    useVarianceStore.getState().addAnalysis(createMockAnalysis({ accountName: 'C' }));
    expect(useVarianceStore.getState().analyses).toHaveLength(3);
  });

  it('should delete from middle of list', () => {
    useVarianceStore
      .getState()
      .setAnalyses([
        createMockAnalysis({ id: 'var-a', accountName: 'A' }),
        createMockAnalysis({ id: 'var-b', accountName: 'B' }),
        createMockAnalysis({ id: 'var-c', accountName: 'C' }),
      ]);
    useVarianceStore.getState().deleteAnalysis('var-b');
    expect(useVarianceStore.getState().analyses).toHaveLength(2);
    expect(useVarianceStore!.getState().analyses[0]!.accountName).toBe('A');
    expect(useVarianceStore!.getState().analyses[1]!.accountName).toBe('C');
  });
});
