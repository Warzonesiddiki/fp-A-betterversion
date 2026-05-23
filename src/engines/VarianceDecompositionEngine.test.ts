import { describe, it, expect } from 'vitest';
import { VarianceDecompositionEngine } from './VarianceDecompositionEngine';

describe('VarianceDecompositionEngine', () => {
  describe('computeRateVolumeMix', () => {
    it('should compute RVM variances', () => {
      const result = VarianceDecompositionEngine.computeRateVolumeMix({
        budgetAmount: 100000,
        actualAmount: 120000,
        budgetVolume: 1000,
        actualVolume: 1100,
        budgetRate: 100,
        actualRate: 109.09,
      });
      expect(result.rateVariance).toBeCloseTo(9999, -2);
      expect(result.volumeVariance).toBeCloseTo(10000, 0);
      expect(result.totalVariance).toBe(20000);
    });

    it('should handle zero variances', () => {
      const result = VarianceDecompositionEngine.computeRateVolumeMix({
        budgetAmount: 100000,
        actualAmount: 100000,
        budgetVolume: 1000,
        actualVolume: 1000,
        budgetRate: 100,
        actualRate: 100,
      });
      expect(result.rateVariance).toBe(0);
      expect(result.volumeVariance).toBe(0);
      expect(result.mixVariance).toBe(0);
    });
  });

  describe('computeFiveWayRevenue', () => {
    it('should compute five-way variance decomposition', () => {
      const result = VarianceDecompositionEngine.computeFiveWayRevenue({
        budgetPrice: 100,
        actualPrice: 110,
        budgetVolume: 1000,
        actualVolume: 900,
        budgetMix: 0.5,
        actualMix: 0.6,
        budgetExchangeRate: 1.0,
        actualExchangeRate: 1.1,
      });
      expect(result.priceVariance).toBe(10000);
      expect(result.volumeVariance).toBe(-10000);
      expect(result.totalVariance).toBeCloseTo(8900, 8);
    });

    it('should handle all zeros', () => {
      const result = VarianceDecompositionEngine.computeFiveWayRevenue({
        budgetPrice: 0,
        actualPrice: 0,
        budgetVolume: 0,
        actualVolume: 0,
        budgetMix: 0,
        actualMix: 0,
        budgetExchangeRate: 0,
        actualExchangeRate: 0,
      });
      expect(result.priceVariance).toBe(0);
      expect(result.totalVariance).toBe(0);
    });
  });

  describe('computePriceVolumeMix', () => {
    it('should compute PVM variances', () => {
      const result = VarianceDecompositionEngine.computePriceVolumeMix({
        budgetPrice: 100,
        actualPrice: 110,
        budgetVolume: 1000,
        actualVolume: 900,
      });
      expect(result.priceVariance).toBe(9000);
      expect(result.volumeVariance).toBe(-10000);
      expect(result.totalVariance).toBe(-1000);
    });

    it('should handle zero values', () => {
      const result = VarianceDecompositionEngine.computePriceVolumeMix({
        budgetPrice: 0,
        actualPrice: 0,
        budgetVolume: 0,
        actualVolume: 0,
      });
      expect(result.priceVariance).toBe(0);
      expect(result.volumeVariance).toBe(0);
    });
  });
});
