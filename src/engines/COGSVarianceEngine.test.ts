import { describe, it, expect } from 'vitest';
import { COGSVarianceEngine } from './COGSVarianceEngine';

describe('COGSVarianceEngine', () => {
  describe('computePurchasePriceVariance', () => {
    it('should compute favorable variance', () => {
      expect(COGSVarianceEngine.computePurchasePriceVariance(10, 8, 100)).toBe(200);
    });

    it('should compute unfavorable variance', () => {
      expect(COGSVarianceEngine.computePurchasePriceVariance(10, 12, 100)).toBe(-200);
    });

    it('should handle zero quantity', () => {
      expect(COGSVarianceEngine.computePurchasePriceVariance(10, 8, 0)).toBe(0);
    });
  });

  describe('computeUsageVariance', () => {
    it('should compute favorable usage variance', () => {
      expect(COGSVarianceEngine.computeUsageVariance(100, 90, 10)).toBe(100);
    });

    it('should compute unfavorable usage variance', () => {
      expect(COGSVarianceEngine.computeUsageVariance(100, 110, 10)).toBe(-100);
    });
  });

  describe('computeEfficiencyVariance', () => {
    it('should compute favorable efficiency variance', () => {
      expect(COGSVarianceEngine.computeEfficiencyVariance(90, 100, 20)).toBe(200);
    });

    it('should compute unfavorable efficiency variance', () => {
      expect(COGSVarianceEngine.computeEfficiencyVariance(110, 100, 20)).toBe(-200);
    });
  });

  describe('computeVolumeVariance', () => {
    it('should compute favorable volume variance', () => {
      expect(COGSVarianceEngine.computeVolumeVariance(1200, 1000, 5)).toBe(1000);
    });

    it('should compute unfavorable volume variance', () => {
      expect(COGSVarianceEngine.computeVolumeVariance(800, 1000, 5)).toBe(-1000);
    });
  });

  describe('computeTotalCOGSVariance', () => {
    it('should compute total variance with matching components', () => {
      const result = COGSVarianceEngine.computeTotalCOGSVariance({
        standardCost: 10000,
        actualCost: 9500,
        priceVariance: 200,
        usageVariance: 100,
        efficiencyVariance: 150,
        volumeVariance: 50,
      });
      expect(result.totalVariance).toBe(500);
      expect(result.accountedFor).toBe(true);
      expect(result.unexplained).toBeCloseTo(0, 2);
    });

    it('should detect unexplained variance', () => {
      const result = COGSVarianceEngine.computeTotalCOGSVariance({
        standardCost: 10000,
        actualCost: 9500,
        priceVariance: 100,
        usageVariance: 100,
        efficiencyVariance: 100,
        volumeVariance: 100,
      });
      expect(result.accountedFor).toBe(false);
      expect(result.unexplained).toBe(100);
    });

    it('should handle zero variances', () => {
      const result = COGSVarianceEngine.computeTotalCOGSVariance({
        standardCost: 10000,
        actualCost: 10000,
        priceVariance: 0,
        usageVariance: 0,
        efficiencyVariance: 0,
        volumeVariance: 0,
      });
      expect(result.totalVariance).toBe(0);
      expect(result.accountedFor).toBe(true);
    });
  });
});
