import { describe, it, expect, beforeEach } from 'vitest';
import { useESGStore } from './esgStore';

describe('esgStore', () => {
  beforeEach(() => {
    useESGStore.setState({
      metrics: [],
      initiatives: [],
      isLoading: false,
      error: null,
    });
  });

  it('should have initial empty state after reset', () => {
    const state = useESGStore.getState();
    expect(state.metrics).toEqual([]);
    expect(state.initiatives).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set metrics', () => {
    const metrics = [
      {
        id: 'm1',
        name: 'Carbon Emissions',
        category: 'environmental' as const,
        value: 85,
        unit: 'tons CO2',
        target: 100,
        trend: 'down' as const,
      },
    ];
    useESGStore.getState().setMetrics(metrics);
    expect(useESGStore.getState().metrics).toEqual(metrics);
  });

  it('should add a metric', () => {
    useESGStore.getState().addMetric({
      id: 'm2',
      name: 'Water Usage',
      category: 'environmental',
      value: 70,
      unit: 'gallons',
      target: 80,
      trend: 'stable',
    });
    expect(useESGStore.getState().metrics).toHaveLength(1);
    expect(useESGStore.getState().metrics[0].name).toBe('Water Usage');
  });

  it('should update a metric', () => {
    useESGStore.getState().addMetric({
      id: 'm3',
      name: 'Diversity Score',
      category: 'social',
      value: 60,
      unit: '%',
      target: 75,
      trend: 'up',
    });
    useESGStore.getState().updateMetric('m3', { value: 72, trend: 'up' });
    const updated = useESGStore.getState().metrics[0];
    expect(updated.value).toBe(72);
  });

  it('should not update non-existent metric', () => {
    useESGStore.getState().addMetric({
      id: 'm4',
      name: 'Test',
      category: 'governance',
      value: 50,
      unit: '%',
      target: 60,
      trend: 'stable',
    });
    useESGStore.getState().updateMetric('nonexistent', { value: 99 });
    expect(useESGStore.getState().metrics[0].value).toBe(50);
  });

  it('should remove a metric', () => {
    useESGStore.getState().addMetric({
      id: 'm5',
      name: 'ToRemove',
      category: 'environmental',
      value: 10,
      unit: '%',
      target: 20,
      trend: 'down',
    });
    useESGStore.getState().removeMetric('m5');
    expect(useESGStore.getState().metrics).toHaveLength(0);
  });

  it('should set initiatives', () => {
    const initiatives = [
      {
        id: 'i1',
        name: 'Solar Installation',
        description: 'Install solar panels',
        status: 'In Progress',
        progress: 60,
        budget: 500000,
        spent: 300000,
      },
    ];
    useESGStore.getState().setInitiatives(initiatives);
    expect(useESGStore.getState().initiatives).toEqual(initiatives);
  });

  it('should set loading state', () => {
    useESGStore.getState().setLoading(true);
    expect(useESGStore.getState().isLoading).toBe(true);
  });

  it('should set error state', () => {
    useESGStore.getState().setError('Load failed');
    expect(useESGStore.getState().error).toBe('Load failed');
  });

  it('should clear all data', () => {
    useESGStore.getState().addMetric({
      id: 'm1',
      name: 'Test',
      category: 'environmental',
      value: 50,
      unit: '%',
      target: 100,
      trend: 'stable',
    });
    useESGStore.getState().setLoading(true);
    useESGStore.getState().setError('err');
    useESGStore.getState().clearAll();
    const state = useESGStore.getState();
    expect(state.metrics).toEqual([]);
    expect(state.initiatives).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should filter metrics by category', () => {
    useESGStore.getState().setMetrics([
      {
        id: 'm1',
        name: 'Carbon',
        category: 'environmental',
        value: 80,
        unit: '%',
        target: 100,
        trend: 'up',
      },
      {
        id: 'm2',
        name: 'Diversity',
        category: 'social',
        value: 70,
        unit: '%',
        target: 80,
        trend: 'up',
      },
      {
        id: 'm3',
        name: 'Board Independence',
        category: 'governance',
        value: 90,
        unit: '%',
        target: 100,
        trend: 'stable',
      },
    ]);
    expect(useESGStore.getState().getMetricsByCategory('environmental')).toHaveLength(1);
    expect(useESGStore.getState().getMetricsByCategory('social')).toHaveLength(1);
    expect(useESGStore.getState().getMetricsByCategory('governance')).toHaveLength(1);
  });

  it('should return empty for category with no metrics', () => {
    expect(useESGStore.getState().getMetricsByCategory('environmental')).toHaveLength(0);
  });

  it('should calculate overall score', () => {
    useESGStore.getState().setMetrics([
      {
        id: 'm1',
        name: 'A',
        category: 'environmental',
        value: 80,
        unit: '%',
        target: 100,
        trend: 'up',
      },
      { id: 'm2', name: 'B', category: 'social', value: 60, unit: '%', target: 100, trend: 'up' },
    ]);
    // (80/100*100 + 60/100*100) / 2 = (80+60)/2 = 70
    expect(useESGStore.getState().getOverallScore()).toBe(70);
  });

  it('should return 0 overall score for empty metrics', () => {
    expect(useESGStore.getState().getOverallScore()).toBe(0);
  });
});
