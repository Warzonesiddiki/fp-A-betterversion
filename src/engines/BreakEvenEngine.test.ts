import { describe, it, expect } from 'vitest';
import { BreakEvenEngine } from './BreakEvenEngine';

describe('BreakEvenEngine', () => {
  const costStructure = {
    fixedCosts: 200000,
    variableCostPerUnit: 60,
  };

  describe('calculate', () => {
    it('calculates break-even point', () => {
      const result = BreakEvenEngine.calculate(100, costStructure);
      expect(result).toBeDefined();
      expect(result.breakEvenUnits).toBeGreaterThan(0);
      expect(result.breakEvenRevenue).toBeGreaterThan(0);
    });

    it('handles zero contribution margin', () => {
      const result = BreakEvenEngine.calculate(100, { ...costStructure, variableCostPerUnit: 100 });
      expect(result.breakEvenUnits).toBe(0);
    });

    it('handles high margin', () => {
      const result = BreakEvenEngine.calculate(100, {
        ...costStructure,
        variableCostPerUnit: 10,
        fixedCosts: 100000,
      });
      expect(result.breakEvenUnits).toBeLessThan(2000);
    });

    it('known-answer (money primitive): exact break-even with no float drift', () => {
      // price=100, fixed=200000, variable=60
      // contributionMargin = 100 - 60 = 40
      // breakEvenUnits = 200000 / 40 = 5000
      // breakEvenRevenue = 5000 * 100 = 500000
      const result = BreakEvenEngine.calculate(100, costStructure, 6000);
      expect(result.contributionMargin).toBe(40);
      expect(result.breakEvenUnits).toBe(5000);
      expect(result.breakEvenRevenue).toBe(500000);
      expect(result.marginOfSafetyUnits).toBe(1000);
      expect(result.valid).toBe(true);
    });
  });

  describe('targetProfit', () => {
    it('calculates units for target profit', () => {
      const result = BreakEvenEngine.targetProfit(100, costStructure, 50000);
      expect(result.requiredUnits).toBeGreaterThan(0);
      expect(result.requiredRevenue).toBeGreaterThan(0);
    });

    it('known-answer (money primitive): target-profit units exact', () => {
      // (200000 + 50000) / 40 = 6250 units -> 6250 * 100 = 625000 revenue
      const result = BreakEvenEngine.targetProfit(100, costStructure, 50000);
      expect(result.requiredUnits).toBe(6250);
      expect(result.requiredRevenue).toBe(625000);
      expect(result.valid).toBe(true);
    });
  });
});
