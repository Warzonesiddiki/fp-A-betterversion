import { describe, it, expect } from 'vitest';
import {
  calculateGrowthRate,
  calculateEBITDA,
  calculateGrossProfit,
  calculateNetIncome,
  calculateGrossMargin,
  calculateEBITDAMargin,
  calculateNetMargin,
  calculateBurnRate,
  calculateRunway,
  applyGrowthRate,
  distributeAnnualToMonths,
  calculateVariancePercentage,
  sum,
  average,
} from '../calculations';

describe('calculations', () => {
  describe('calculateGrowthRate', () => {
    it('calculates positive growth', () => {
      expect(calculateGrowthRate(150, 100)).toBe(50);
    });
    it('returns 100 when previous is 0 and current > 0', () => {
      expect(calculateGrowthRate(100, 0)).toBe(100);
    });
    it('returns 0 when both are 0', () => {
      expect(calculateGrowthRate(0, 0)).toBe(0);
    });
    it('handles negative growth', () => {
      expect(calculateGrowthRate(50, 100)).toBe(-50);
    });
  });

  describe('calculateEBITDA', () => {
    it('subtracts cogs and opex from revenue', () => {
      expect(calculateEBITDA(1000, 400, 200)).toBe(400);
    });
    it('handles zero values', () => {
      expect(calculateEBITDA(0, 0, 0)).toBe(0);
    });
  });

  describe('calculateGrossProfit', () => {
    it('subtracts cogs from revenue', () => {
      expect(calculateGrossProfit(1000, 400)).toBe(600);
    });
  });

  describe('calculateNetIncome', () => {
    it('calculates net income correctly', () => {
      expect(calculateNetIncome(1000, 400, 200, 50, 100)).toBe(350);
    });
    it('handles negative other income', () => {
      expect(calculateNetIncome(1000, 400, 200, -50, 100)).toBe(250);
    });
  });

  describe('calculateGrossMargin', () => {
    it('returns percentage', () => {
      expect(calculateGrossMargin(1000, 400)).toBe(60);
    });
    it('returns 0 when revenue is 0', () => {
      expect(calculateGrossMargin(0, 100)).toBe(0);
    });
  });

  describe('calculateEBITDAMargin', () => {
    it('returns percentage of revenue', () => {
      expect(calculateEBITDAMargin(1000, 400)).toBe(40);
    });
    it('returns 0 when revenue is 0', () => {
      expect(calculateEBITDAMargin(0, 100)).toBe(0);
    });
  });

  describe('calculateNetMargin', () => {
    it('returns percentage of revenue', () => {
      expect(calculateNetMargin(1000, 200)).toBe(20);
    });
  });

  describe('calculateBurnRate', () => {
    it('averages monthly expenses', () => {
      expect(calculateBurnRate([100, 200, 300])).toBe(200);
    });
    it('returns 0 for empty array', () => {
      expect(calculateBurnRate([])).toBe(0);
    });
  });

  describe('calculateRunway', () => {
    it('divides cash by burn rate', () => {
      expect(calculateRunway(100000, 10000)).toBe(10);
    });
    it('returns 999 when burn rate is 0', () => {
      expect(calculateRunway(100000, 0)).toBe(999);
    });
  });

  describe('applyGrowthRate', () => {
    it('applies compound growth', () => {
      const result = applyGrowthRate(100, 10, 3);
      expect(result[0]).toBe(110);
      expect(result[1]).toBe(121);
      expect(result[2]).toBe(133);
    });
    it('returns empty array for 0 periods', () => {
      expect(applyGrowthRate(100, 10, 0)).toEqual([]);
    });
  });

  describe('distributeAnnualToMonths', () => {
    it('uses equal weights by default', () => {
      const result = distributeAnnualToMonths(1200);
      expect(result).toHaveLength(12);
      expect(result.every((v) => v === 100)).toBe(true);
    });
    it('uses custom weights', () => {
      const weights = [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      const result = distributeAnnualToMonths(1200, weights);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      expect(result[0]).toBe(Math.round((1200 * weights[0]) / totalWeight));
      expect(result[1]).toBe(Math.round((1200 * weights[1]) / totalWeight));
    });
  });

  describe('calculateVariancePercentage', () => {
    it('calculates variance', () => {
      expect(calculateVariancePercentage(100, 120)).toBe(20);
    });
    it('handles zero budget', () => {
      expect(calculateVariancePercentage(0, 50)).toBe(100);
    });
  });

  describe('sum', () => {
    it('sums array', () => {
      expect(sum([1, 2, 3])).toBe(6);
    });
    it('returns 0 for empty', () => {
      expect(sum([])).toBe(0);
    });
  });

  describe('average', () => {
    it('averages array', () => {
      expect(average([1, 2, 3])).toBe(2);
    });
    it('returns 0 for empty', () => {
      expect(average([])).toBe(0);
    });
  });
});
