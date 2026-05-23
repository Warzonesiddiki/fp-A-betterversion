import { describe, it, expect } from 'vitest';
import { SensitivityTableEngine } from './SensitivityTableEngine';

describe('SensitivityTableEngine', () => {
  describe('generate', () => {
    it('generates a 2-way sensitivity table', () => {
      const result = SensitivityTableEngine.generate({
        rowVariable: 'Growth',
        rowValues: [0.02, 0.05, 0.08],
        colVariable: 'Discount',
        colValues: [0.08, 0.1, 0.12],
        outputMetric: 'NPV',
        baseCase: { row: 0.05, col: 0.1 },
        computeFn: (g, d) => (1000 * (1 + g)) / (1 + d),
      });
      expect(result.table).toHaveLength(3);
      expect(result.table[0]).toHaveLength(3);
      expect(result.rowLabels).toHaveLength(3);
      expect(result.colLabels).toHaveLength(3);
    });

    it('calculates min and max', () => {
      const result = SensitivityTableEngine.generate({
        rowVariable: 'X',
        rowValues: [1, 2],
        colVariable: 'Y',
        colValues: [10, 20],
        outputMetric: 'Result',
        baseCase: { row: 1, col: 10 },
        computeFn: (x, y) => x * y,
      });
      expect(result.min).toBe(10);
      expect(result.max).toBe(40);
    });
  });

  describe('highlightBaseCase', () => {
    it('finds base case indices', () => {
      const table = SensitivityTableEngine.generate({
        rowVariable: 'Growth',
        rowValues: [0.02, 0.05, 0.08],
        colVariable: 'Discount',
        colValues: [0.08, 0.1, 0.12],
        outputMetric: 'NPV',
        baseCase: { row: 0.05, col: 0.1 },
        computeFn: (g, d) => (1000 * (1 + g)) / (1 + d),
      });
      const highlighted = SensitivityTableEngine.highlightBaseCase(table, { row: 0.05, col: 0.1 });
      expect(highlighted.baseCaseRowIndex).toBe(1);
      expect(highlighted.baseCaseColIndex).toBe(1);
    });
  });

  describe('formatTable', () => {
    it('formats as currency', () => {
      const table = SensitivityTableEngine.generate({
        rowVariable: 'X',
        rowValues: [1],
        colVariable: 'Y',
        colValues: [100],
        outputMetric: 'Rev',
        baseCase: { row: 1, col: 100 },
        computeFn: () => 1234,
      });
      const formatted = SensitivityTableEngine.formatTable(table, 'currency');
      expect(formatted.rows[0].values[0]).toContain('1,234');
    });
  });

  describe('tornadoAnalysis', () => {
    it('sorts variables by range', () => {
      const result = SensitivityTableEngine.tornadoAnalysis(100, [
        { name: 'Price', baseValue: 10, lowValue: 8, highValue: 12, impactFn: (v) => v * 10 },
        { name: 'Volume', baseValue: 100, lowValue: 80, highValue: 120, impactFn: (v) => v },
      ]);
      expect(result.sortedByRange).toHaveLength(2);
      expect(result.sortedByRange[0].name).toBe('Price');
      expect(result.baseValue).toBe(100);
    });
  });
});
