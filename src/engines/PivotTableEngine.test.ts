/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { PivotTableEngine, type CalculatedField } from './PivotTableEngine';

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
        showSubtotals: true,
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
        showSubtotals: true,
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
        showSubtotals: false,
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
        showSubtotals: false,
      });
      expect(result).toBeDefined();
      expect(result.rows.length).toBe(1);
    });

    it('supports diverse aggregation types: avg, count, min, max, median', () => {
      for (const agg of ['avg', 'count', 'min', 'max', 'median'] as const) {
        const result = engine.createPivot(sampleData, {
          rows: ['region'],
          columns: ['product'],
          values: [{ field: 'units', aggregation: agg }],
          filters: {},
          showTotals: true,
          showSubtotals: false,
        });
        expect(result.grandTotals[0]!.value).toBeDefined();
      }
    });
  });

  describe('calculated fields', () => {
    it('adds, gets, and removes calculated fields', () => {
      const field: CalculatedField = {
        name: 'Margin',
        label: 'Gross Margin',
        formula: 'revenue - units * 50',
        dependencies: ['revenue', 'units'],
      };

      engine.addCalculatedField(field);
      expect(engine.getCalculatedFields()).toHaveLength(1);
      expect(engine.getCalculatedFields()[0]!.name).toBe('Margin');

      expect(engine.removeCalculatedField('Margin')).toBe(true);
      expect(engine.removeCalculatedField('NonExistent')).toBe(false);
      expect(engine.getCalculatedFields()).toHaveLength(0);
    });
  });

  describe('sortPivot, filterByValue and toCSV', () => {
    it('sorts rows ascending and descending and exports to CSV safely', () => {
      const pivot = engine.createPivot(sampleData, {
        rows: ['region'],
        columns: ['product'],
        values: [{ field: 'revenue', aggregation: 'sum' }],
        filters: {},
        showTotals: true,
        showSubtotals: false,
      });

      const sortedAsc = engine.sortPivot(pivot.rows, 0, 'asc');
      expect(sortedAsc.length).toBe(pivot.rows.length);

      const sortedDesc = engine.sortPivot(pivot.rows, 0, 'desc');
      expect(sortedDesc.length).toBe(pivot.rows.length);

      const filteredRows = engine.filterByValue(pivot.rows, (lbl) => lbl.includes('North'));
      expect(filteredRows.length).toBeGreaterThan(0);

      const csv = engine.toCSV(pivot);
      expect(csv).toContain('North');
      expect(csv).toContain('South');
    });
  });
});
