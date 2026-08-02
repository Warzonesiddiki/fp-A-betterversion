/**
 * GAP-1 (F-0006) known-answer tests for VarianceDecompositionEngine's money
 * migration.
 *
 * Variance decomposition explains the budget-to-actual gap on the P&L, so every
 * component is settleable money. Each case is a FIXED input -> EXACT expected
 * decimal asserted with `toBe` (Object.is); the pre-migration float literal is
 * recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { VarianceDecompositionEngine } from './VarianceDecompositionEngine';

describe('VarianceDecompositionEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('computeRateVolumeMix', () => {
    it('computes the rate variance exactly (float gave 3.149999999999997)', () => {
      const result = VarianceDecompositionEngine.computeRateVolumeMix({
        budgetAmount: 27.15,
        actualAmount: 30.3,
        budgetRate: 9.05,
        actualRate: 10.1,
        budgetVolume: 3,
        actualVolume: 3,
      });
      expect(result.rateVariance).toBe(3.15);
      expect(result.volumeVariance).toBe(0);
      expect(result.mixVariance).toBe(0);
      expect(result.totalVariance).toBe(3.15);
    });

    it('reconciles rate + volume + mix to the total variance', () => {
      const result = VarianceDecompositionEngine.computeRateVolumeMix({
        budgetAmount: 27.15, // 9.05 x 3
        actualAmount: 40.4, // 10.10 x 4
        budgetRate: 9.05,
        actualRate: 10.1,
        budgetVolume: 3,
        actualVolume: 4,
      });
      // rate 1.05 x 4 = 4.20; volume 1 x 9.05 = 9.05; mix 1 x 1.05 = 1.05
      expect(result.rateVariance).toBe(4.2);
      expect(result.volumeVariance).toBe(9.05);
      expect(result.mixVariance).toBe(1.05);
      expect(result.totalVariance).toBe(13.25);
      // rate + volume reconstructs the total without the mix double-count
      expect(result.rateVariance + result.volumeVariance).toBe(13.25);
    });

    it('returns zeros when budget and actual agree', () => {
      const result = VarianceDecompositionEngine.computeRateVolumeMix({
        budgetAmount: 100.1,
        actualAmount: 100.1,
        budgetRate: 10.01,
        actualRate: 10.01,
        budgetVolume: 10,
        actualVolume: 10,
      });
      expect(result.rateVariance).toBe(0);
      expect(result.volumeVariance).toBe(0);
      expect(result.mixVariance).toBe(0);
      expect(result.totalVariance).toBe(0);
    });
  });

  describe('computeFiveWayRevenue', () => {
    it('computes the FX variance exactly (float gave 1.5150000000000012)', () => {
      const result = VarianceDecompositionEngine.computeFiveWayRevenue({
        budgetPrice: 9.05,
        actualPrice: 10.1,
        budgetVolume: 3,
        actualVolume: 3,
        budgetMix: 1,
        actualMix: 1,
        budgetExchangeRate: 1.05,
        actualExchangeRate: 1.1,
      });
      // 3 x 10.10 x (1.10 - 1.05) = 1.515 -> 1.52 half-up
      expect(result.fxVariance).toBe(1.52);
    });

    it('computes the total FX-translated variance exactly (float gave 4.8224999999999945)', () => {
      const result = VarianceDecompositionEngine.computeFiveWayRevenue({
        budgetPrice: 9.05,
        actualPrice: 10.1,
        budgetVolume: 3,
        actualVolume: 3,
        budgetMix: 1,
        actualMix: 1,
        budgetExchangeRate: 1.05,
        actualExchangeRate: 1.1,
      });
      // 10.10 x 3 x 1.10 - 9.05 x 3 x 1.05 = 4.8225 -> 4.82 half-up
      expect(result.totalVariance).toBe(4.82);
    });

    it('computes the price variance against budget volume exactly', () => {
      const result = VarianceDecompositionEngine.computeFiveWayRevenue({
        budgetPrice: 9.05,
        actualPrice: 10.1,
        budgetVolume: 3,
        actualVolume: 5,
        budgetMix: 1,
        actualMix: 1,
        budgetExchangeRate: 1,
        actualExchangeRate: 1,
      });
      expect(result.priceVariance).toBe(3.15);
      expect(result.volumeVariance).toBe(18.1);
      expect(result.mixVariance).toBe(0);
      expect(result.fxVariance).toBe(0);
    });

    it('computes the mix variance from an exact mix delta', () => {
      const result = VarianceDecompositionEngine.computeFiveWayRevenue({
        budgetPrice: 10,
        actualPrice: 10,
        budgetVolume: 3,
        actualVolume: 3,
        budgetMix: 0.3,
        actualMix: 0.4,
        budgetExchangeRate: 1,
        actualExchangeRate: 1,
      });
      // Float: (0.4 - 0.3) === 0.10000000000000003 -> 3.0000000000000013
      expect(result.mixVariance).toBe(3);
    });
  });

  describe('computePriceVolumeMix', () => {
    it('computes the total variance exactly (float gave 3.149999999999995)', () => {
      const result = VarianceDecompositionEngine.computePriceVolumeMix({
        budgetPrice: 9.05,
        actualPrice: 10.1,
        budgetVolume: 3,
        actualVolume: 3,
      });
      expect(result.priceVariance).toBe(3.15);
      expect(result.volumeVariance).toBe(0);
      expect(result.totalVariance).toBe(3.15);
    });

    it('splits a combined price and volume move into exact components', () => {
      const result = VarianceDecompositionEngine.computePriceVolumeMix({
        budgetPrice: 9.05,
        actualPrice: 10.1,
        budgetVolume: 3,
        actualVolume: 4,
      });
      // price 1.05 x 4 = 4.20; volume 1 x 9.05 = 9.05; total 40.40 - 27.15 = 13.25
      expect(result.priceVariance).toBe(4.2);
      expect(result.volumeVariance).toBe(9.05);
      expect(result.totalVariance).toBe(13.25);
      expect(result.priceVariance + result.volumeVariance).toBe(result.totalVariance);
    });

    it('returns zeros when budget equals actual', () => {
      const result = VarianceDecompositionEngine.computePriceVolumeMix({
        budgetPrice: 0.1,
        actualPrice: 0.1,
        budgetVolume: 3,
        actualVolume: 3,
      });
      expect(result.priceVariance).toBe(0);
      expect(result.volumeVariance).toBe(0);
      expect(result.totalVariance).toBe(0);
    });
  });
});
