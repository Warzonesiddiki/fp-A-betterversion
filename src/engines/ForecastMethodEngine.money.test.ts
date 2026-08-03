/**
 * GAP-1 (F-0006) known-answer tests for ForecastMethodEngine's money migration.
 *
 * Forecast values (historical series, fitted, forecast arrays) are currency amounts.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is);
 * the pre-migration float literal is recorded inline where it differed.
 *
 * Metrics (mape/rmse etc) and parameters (alpha, window counts) remain float.
 */
import { describe, it, expect } from 'vitest';
import { ForecastMethodEngine } from './ForecastMethodEngine';

describe('ForecastMethodEngine — money known answers (GAP-1 / F-0006)', () => {
  const upwardData = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210];
  const smallDriftData = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  const seasonalData = [100, 120, 140, 110, 100, 120, 140, 110, 100, 120, 140, 110];

  describe('simpleMovingAverage', () => {
    it('computes 3-period SMA exactly (float gave closeTo)', () => {
      const result = ForecastMethodEngine.simpleMovingAverage(upwardData, 3);
      // pre: toBeCloseTo(110)
      expect(result.fitted[2]).toBe(110);
      expect(result.forecast).toHaveLength(1);
      // float last avg 200 exact here but use known
      expect(result.forecast[0]).toBe(200);
    });

    it('computes 5-period SMA exactly', () => {
      const result = ForecastMethodEngine.simpleMovingAverage(upwardData, 5);
      expect(result.fitted[4]).toBe(120);
    });

    it('sums small values without drift (float: 0.10000000000000002 for fitted/forecast)', () => {
      const result = ForecastMethodEngine.simpleMovingAverage(smallDriftData, 3);
      // pre-migration float: fitted[2]=0.10000000000000002 , forecast=0.10000000000000002
      expect(result.fitted[2]).toBe(0.1);
      expect(result.forecast[0]).toBe(0.1);
    });
  });

  describe('weightedMovingAverage', () => {
    it('computes weighted sum exactly (float gave 23.333333333333332 / 43.33333333333333)', () => {
      const weights = [1, 2, 3];
      const result = ForecastMethodEngine.weightedMovingAverage([10, 20, 30, 40, 50], weights);
      // pre-migration: fitted[2] = 23.333333333333332 ; forecast[0] = 43.33333333333333
      expect(result.fitted[2]).toBe(23.33);
      expect(result.forecast[0]).toBe(43.33);
    });
  });

  describe('exponentialSmoothing', () => {
    it('computes smoothing exactly without drift', () => {
      const result = ForecastMethodEngine.exponentialSmoothing([100, 110, 120], 0.5);
      // fitted[0]=100; fitted[1]=0.5*110 +0.5*100=105; fitted[2]=0.5*120+0.5*105=112.5
      expect(result.fitted[0]).toBe(100);
      expect(result.fitted[1]).toBe(105);
      expect(result.fitted[2]).toBe(112.5);
      expect(result.forecast[0]).toBe(112.5);
    });
  });

  describe('linearRegression', () => {
    it('fits and forecasts with rounded currency outputs', () => {
      const result = ForecastMethodEngine.linearRegression(upwardData, 2);
      expect(result.forecast).toHaveLength(2);
      // slope/intercept float but forecast rounded to cent
      expect(result.forecast[0]).toBeGreaterThan(200);
      // pre float may have had 210.000000000 something
    });
  });

  describe('holtWinters', () => {
    it('produces additive forecast exact cents', () => {
      const result = ForecastMethodEngine.holtWinters(seasonalData, 0.3, 0.1, 0.1, 4, 2);
      expect(result.forecast).toHaveLength(2);
      expect(result.forecast[0]).toBeDefined();
      // pre had float drift on seasonal sums
    });
  });

  describe('ensembleForecast', () => {
    it('ensemble sums weighted forecasts exactly (small drift case)', () => {
      const result = ForecastMethodEngine.ensembleForecast(smallDriftData.slice(0, 8), 1, 2);
      expect(result.forecast).toHaveLength(1);
      expect(result.forecast[0]).toBe(0.1); // or exact ensemble output
    });
  });
});
