import { describe, it, expect, beforeEach } from 'vitest';
import { useAnalyticsStore } from './analyticsStore';

describe('analyticsStore', () => {
  beforeEach(() => {
    useAnalyticsStore.setState({
      charts: [],
      selectedChartId: null,
      dateRange: { start: '2024-01-01', end: '2024-12-31' },
      selectedMetrics: ['revenue', 'expenses', 'netIncome'],
      filter: {
        accountTypes: ['Revenue', 'COGS', 'OpEx'],
        departments: [],
        entities: [],
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
      },
      isDrillDown: false,
      drillDownPath: [],
    });
  });

  it('should have correct initial state', () => {
    const state = useAnalyticsStore.getState();
    expect(state.charts).toEqual([]);
    expect(state.selectedChartId).toBeNull();
    expect(state.isDrillDown).toBe(false);
    expect(state.drillDownPath).toEqual([]);
  });

  it('should add a chart', () => {
    useAnalyticsStore.getState().addChart({ name: 'Test Chart', type: 'bar' } as any);
    expect(useAnalyticsStore.getState().charts).toHaveLength(1);
    expect(useAnalyticsStore!.getState().charts[0]!.name).toBe('Test Chart');
  });

  it('should update a chart', () => {
    useAnalyticsStore.getState().addChart({ name: 'Chart 1', type: 'bar' } as any);
    const id = useAnalyticsStore!.getState().charts[0]!.id;
    useAnalyticsStore.getState().updateChart(id, { name: 'Updated' });
    expect(useAnalyticsStore!.getState().charts[0]!.name).toBe('Updated');
  });

  it('should remove a chart', () => {
    useAnalyticsStore.getState().addChart({ name: 'Chart 1', type: 'bar' } as any);
    const id = useAnalyticsStore!.getState().charts[0]!.id;
    useAnalyticsStore.getState().removeChart(id);
    expect(useAnalyticsStore.getState().charts).toHaveLength(0);
  });

  it('should clear selected chart when removed', () => {
    useAnalyticsStore.getState().addChart({ name: 'Chart 1', type: 'bar' } as any);
    const id = useAnalyticsStore!.getState().charts[0]!.id;
    useAnalyticsStore.getState().setSelectedChart(id);
    useAnalyticsStore.getState().removeChart(id);
    expect(useAnalyticsStore.getState().selectedChartId).toBeNull();
  });

  it('should set selected chart', () => {
    useAnalyticsStore.getState().setSelectedChart('chart-1');
    expect(useAnalyticsStore.getState().selectedChartId).toBe('chart-1');
  });

  it('should set date range', () => {
    const range = { start: '2025-01-01', end: '2025-12-31' };
    useAnalyticsStore.getState().setDateRange(range);
    expect(useAnalyticsStore.getState().dateRange).toEqual(range);
  });

  it('should set selected metrics', () => {
    useAnalyticsStore.getState().setSelectedMetrics(['profit']);
    expect(useAnalyticsStore.getState().selectedMetrics).toEqual(['profit']);
  });

  it('should set filter', () => {
    useAnalyticsStore.getState().setFilter({ departments: ['Finance'] });
    expect(useAnalyticsStore.getState().filter.departments).toEqual(['Finance']);
  });

  it('should clear filters', () => {
    useAnalyticsStore.getState().setFilter({ departments: ['Finance'] });
    useAnalyticsStore.getState().clearFilters();
    expect(useAnalyticsStore.getState().filter.departments).toEqual([]);
  });

  it('should enter drill down', () => {
    useAnalyticsStore.getState().enterDrillDown('Entity');
    expect(useAnalyticsStore.getState().isDrillDown).toBe(true);
    expect(useAnalyticsStore.getState().drillDownPath).toEqual(['Entity']);
  });

  it('should exit drill down', () => {
    useAnalyticsStore.getState().enterDrillDown('Entity');
    useAnalyticsStore.getState().enterDrillDown('Account');
    useAnalyticsStore.getState().exitDrillDown();
    expect(useAnalyticsStore.getState().drillDownPath).toEqual(['Entity']);
    expect(useAnalyticsStore.getState().isDrillDown).toBe(true);
  });

  it('should set isDrillDown to false when path is empty', () => {
    useAnalyticsStore.getState().enterDrillDown('Entity');
    useAnalyticsStore.getState().exitDrillDown();
    expect(useAnalyticsStore.getState().isDrillDown).toBe(false);
  });
});
