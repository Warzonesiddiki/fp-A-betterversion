import { describe, it, expect, beforeEach } from 'vitest';
import { useVarianceStore } from './varianceStore';

describe('varianceStore', () => {
  beforeEach(() => {
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
    const analyses = [{ id: 'var-1', name: 'Q1 Variance' }] as any;
    useVarianceStore.getState().setAnalyses(analyses);
    expect(useVarianceStore.getState().analyses).toEqual(analyses);
  });

  it('should add an analysis', () => {
    useVarianceStore.getState().addAnalysis({
      name: 'Revenue Variance',
      type: 'budget_vs_actual',
    } as any);
    expect(useVarianceStore.getState().analyses).toHaveLength(1);
    expect(useVarianceStore.getState().analyses[0].name).toBe('Revenue Variance');
  });

  it('should assign id to new analysis', () => {
    useVarianceStore.getState().addAnalysis({ name: 'Test', type: 'custom' } as any);
    expect(useVarianceStore.getState().analyses[0].id).toBeDefined();
    expect(useVarianceStore.getState().analyses[0].id).toContain('var-');
  });

  it('should delete an analysis', () => {
    useVarianceStore.getState().addAnalysis({ name: 'Test', type: 'custom' } as any);
    const id = useVarianceStore.getState().analyses[0].id;
    useVarianceStore.getState().deleteAnalysis(id);
    expect(useVarianceStore.getState().analyses).toHaveLength(0);
  });

  it('should not delete non-existent analysis', () => {
    useVarianceStore.getState().addAnalysis({ name: 'Test', type: 'custom' } as any);
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
    useVarianceStore.getState().addAnalysis({ name: 'A', type: 'custom' } as any);
    useVarianceStore.getState().addAnalysis({ name: 'B', type: 'budget_vs_actual' } as any);
    useVarianceStore.getState().addAnalysis({ name: 'C', type: 'custom' } as any);
    expect(useVarianceStore.getState().analyses).toHaveLength(3);
  });

  it('should delete from middle of list', () => {
    // Use setAnalyses to avoid Date.now() id collision
    useVarianceStore.getState().setAnalyses([
      { id: 'var-a', name: 'A', type: 'custom' },
      { id: 'var-b', name: 'B', type: 'custom' },
      { id: 'var-c', name: 'C', type: 'custom' },
    ] as any);
    useVarianceStore.getState().deleteAnalysis('var-b');
    expect(useVarianceStore.getState().analyses).toHaveLength(2);
    expect(useVarianceStore.getState().analyses[0].name).toBe('A');
    expect(useVarianceStore.getState().analyses[1].name).toBe('C');
  });
});
