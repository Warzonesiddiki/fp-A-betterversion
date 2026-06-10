import { describe, it, expect } from 'vitest';
import { SpreadEngine } from './SpreadEngine';

describe('SpreadEngine', () => {
  describe('even', () => {
    it('distributes evenly across periods', () => {
      const result = SpreadEngine.even(1200000, 12);
      expect(result).toHaveLength(12);
      expect(result[0]!).toBe(100000);
      expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(1200000);
    });

    it('returns empty for zero periods', () => {
      expect(SpreadEngine.even(100, 0)).toEqual([]);
    });

    it('returns empty for negative periods', () => {
      expect(SpreadEngine.even(100, -1)).toEqual([]);
    });
  });

  describe('frontLoaded', () => {
    it('front-loads amounts', () => {
      const result = SpreadEngine.frontLoaded(1200000, 4);
      expect(result).toHaveLength(4);
      expect(result[0]!).toBeGreaterThan(result[3]!);
    });

    it('preserves total', () => {
      const result = SpreadEngine.frontLoaded(1200000, 12);
      expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(1200000);
    });
  });

  describe('backLoaded', () => {
    it('back-loads amounts', () => {
      const result = SpreadEngine.backLoaded(1200000, 4);
      expect(result).toHaveLength(4);
      expect(result[3]!).toBeGreaterThan(result[0]!);
    });
  });

  describe('seasonal', () => {
    it('distributes by weights', () => {
      const result = SpreadEngine.seasonal(1200000, [1, 1, 1, 1]);
      expect(result).toHaveLength(4);
      expect(result[0]!).toBe(300000);
    });

    it('normalizes weights', () => {
      const result = SpreadEngine.seasonal(100, [10, 20, 30, 40]);
      expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(100);
    });

    it('handles zero weights', () => {
      const result = SpreadEngine.seasonal(100, [0, 0, 0, 0]);
      expect(result).toHaveLength(4);
    });
  });

  describe('driverBased', () => {
    it('distributes by driver values', () => {
      const result = SpreadEngine.driverBased(1000, [10, 20, 30, 40]);
      expect(result).toHaveLength(4);
      expect(result[0]!).toBe(100);
      expect(result[3]!).toBe(400);
    });
  });

  describe('custom', () => {
    it('distributes by custom percentages', () => {
      const result = SpreadEngine.custom(1000, [0.25, 0.25, 0.25, 0.25]);
      expect(result).toHaveLength(4);
      expect(result[0]!).toBeCloseTo(250);
    });
  });

  describe('spread', () => {
    it('dispatches to correct method', () => {
      const result = SpreadEngine.spread(1200, { method: 'even', periods: 12 });
      expect(result).toHaveLength(12);
      expect(result[0]!).toBe(100);
    });
  });

  describe('generatePeriodLabels', () => {
    it('generates monthly labels for ≤12', () => {
      expect(SpreadEngine.generatePeriodLabels(12)).toEqual([
        'M1',
        'M2',
        'M3',
        'M4',
        'M5',
        'M6',
        'M7',
        'M8',
        'M9',
        'M10',
        'M11',
        'M12',
      ]);
    });

    it('generates generic labels for >12', () => {
      expect(SpreadEngine.generatePeriodLabels(13)[0]).toBe('P1');
    });
  });

  describe('roundToTotal', () => {
    it('rounds amounts preserving total', () => {
      const result = SpreadEngine.roundToTotal([33.333, 33.333, 33.334], 100);
      expect(result.reduce((s, v) => s + v, 0)).toBeCloseTo(100);
    });
  });
});
