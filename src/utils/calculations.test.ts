import { describe, it, expect } from 'vitest';
import * as calc from './calculations';

describe('calculations utility', () => {
  describe('calculateGrowthRate', () => {
    it('should calculate positive growth correctly', () => {
      expect(calc.calculateGrowthRate(110, 100)).toBe(10);
    });
    it('should calculate negative growth correctly', () => {
      expect(calc.calculateGrowthRate(90, 100)).toBe(-10);
    });
    it('should handle division by zero (previous=0)', () => {
      expect(calc.calculateGrowthRate(100, 0)).toBe(100);
      expect(calc.calculateGrowthRate(0, 0)).toBe(0);
    });
  });

  describe('calculateEBITDA', () => {
    it('should calculate EBITDA correctly', () => {
      expect(calc.calculateEBITDA(1000, 400, 300)).toBe(300);
    });
  });

  describe('calculateGrossMargin', () => {
    it('should calculate margin percentage', () => {
      expect(calc.calculateGrossMargin(100, 40)).toBe(60);
    });
    it('should handle zero revenue', () => {
      expect(calc.calculateGrossMargin(0, 40)).toBe(0);
    });
  });

  describe('calculateBurnRate', () => {
    it('should average monthly expenses', () => {
      expect(calc.calculateBurnRate([100, 200, 300])).toBe(200);
    });
    it('should handle empty array', () => {
      expect(calc.calculateBurnRate([])).toBe(0);
    });
  });

  describe('calculateRunway', () => {
    it('should calculate months of runway', () => {
      expect(calc.calculateRunway(1000, 200)).toBe(5);
    });
    it('should handle zero or negative burn rate', () => {
      expect(calc.calculateRunway(1000, 0)).toBe(999);
      expect(calc.calculateRunway(1000, -10)).toBe(999);
    });
  });

  describe('applyGrowthRate', () => {
    it('should project values with compounding growth', () => {
      const result = calc.applyGrowthRate(100, 10, 3);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe(110);
      expect(result[1]).toBe(121);
      expect(result[2]).toBe(133); // Math.round(121 * 1.1) = 133
    });
  });

  describe('distributeAnnualToMonths', () => {
    it('should distribute equally by default', () => {
      const result = calc.distributeAnnualToMonths(1200);
      expect(result).toHaveLength(12);
      expect(result.every((v) => v === 100)).toBe(true);
    });
    it('should distribute according to weights', () => {
      const weights = [2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const result = calc.distributeAnnualToMonths(300, weights);
      expect(result[0]).toBe(200);
      expect(result[1]).toBe(100);
      expect(result[2]).toBe(0);
    });
  });

  describe('calculateVariancePercentage', () => {
    it('should calculate positive variance', () => {
      expect(calc.calculateVariancePercentage(100, 120)).toBe(20);
    });
    it('should calculate negative variance', () => {
      expect(calc.calculateVariancePercentage(100, 80)).toBe(-20);
    });
    it('should handle zero budget', () => {
      expect(calc.calculateVariancePercentage(0, 50)).toBe(100);
      expect(calc.calculateVariancePercentage(0, 0)).toBe(0);
    });
  });
});
