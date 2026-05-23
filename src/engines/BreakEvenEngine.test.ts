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
  });

  describe('targetProfit', () => {
    it('calculates units for target profit', () => {
      const result = BreakEvenEngine.targetProfit(100, costStructure, 50000);
      expect(result.unitsNeeded).toBeGreaterThan(0);
      expect(result.revenueNeeded).toBeGreaterThan(0);
    });
  });
});
