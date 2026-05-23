/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { PivotTableEngine } from './PivotTableEngine';

describe('PivotTableEngine', () => {
  const engine = new PivotTableEngine();

  const sampleData = [
    { region: 'North', product: 'Widget A', revenue: 10000, units: 100 },
    { region: 'North', product: 'Widget B', revenue: 20000, units: 200 },
    { region: 'South', product: 'Widget A', revenue: 15000, units: 150 },
    { region: 'South', product: 'Widget B', revenue: 25000, units: 250 },
  ];

  describe('createPivot', () => {
    it('creates pivot with rows and columns', () => {
      const result = engine.createPivot(sampleData, {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'revenue', aggregation: 'sum' }],
        filters: {},
        showTotals: true,
      });
      expect(result).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.columnHeaders.length).toBeGreaterThan(0);
    });

    it('creates pivot with grand totals', () => {
      const result = engine.createPivot(sampleData, {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'revenue', aggregation: 'sum' }],
        filters: {},
        showTotals: true,
      });
      expect(result.grandTotals).toBeDefined();
      expect(result.grandTotals.length).toBeGreaterThan(0);
    });

    it('handles empty data', () => {
      const result = engine.createPivot([], {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'revenue', aggregation: 'sum' }],
        filters: {},
        showTotals: false,
      });
      expect(result).toBeDefined();
      expect(result.rows.length).toBe(0);
    });

    it('filters data correctly', () => {
      const result = engine.createPivot(sampleData, {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'revenue', aggregation: 'sum' }],
        filters: { region: ['North'] },
        showTotals: false,
      });
      expect(result).toBeDefined();
      expect(result.rows.length).toBe(1);
    });
  });
});
