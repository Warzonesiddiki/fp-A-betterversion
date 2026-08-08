// =============================================================================
// ForecastMethodEngine — branch coverage sweep
//
// Covers the seasonal decomposition (additive + multiplicative), Holt-Winters
// (both modes + validation errors), ensemble forecasting and auto-selection
// paths that the existing suites only partially exercise.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { ForecastMethodEngine } from './ForecastMethodEngine';

// Deterministic 16-point seasonal series (4 seasons × 4 cycles, upward trend)
const seasonalData = [10, 20, 30, 40, 12, 22, 32, 42, 14, 24, 34, 44, 16, 26, 36, 46];

describe('ForecastMethodEngine — branch sweep', () => {
  describe('movingAverage dispatch', () => {
    it('routes to simple/weighted/exponential and rejects unknown types', () => {
      const simple = ForecastMethodEngine.movingAverage(seasonalData, {
        type: 'simple',
        window: 3,
      });
      expect(simple.forecast.length).toBe(1);
      expect(simple.fitted[2]).toBeCloseTo(20, 5);

      const weighted = ForecastMethodEngine.movingAverage(seasonalData, {
        type: 'weighted',
        window: 3,
      });
      expect(weighted.forecast.length).toBe(1);

      const weightedDefaultWeights = ForecastMethodEngine.movingAverage(seasonalData, {
        type: 'weighted',
        window: 4,
      });
      expect(weightedDefaultWeights.forecast.length).toBe(1);

      const expo = ForecastMethodEngine.movingAverage(seasonalData, {
        type: 'exponential',
        window: 4,
      });
      expect(expo.forecast.length).toBe(1);

      const expoDefault = ForecastMethodEngine.movingAverage(seasonalData, {
        type: 'exponential',
        window: 4,
        alpha: 0.5,
      });
      expect(expoDefault.forecast.length).toBe(1);

      expect(() =>
        ForecastMethodEngine.movingAverage(seasonalData, { type: 'bogus' as never, window: 3 })
      ).toThrow(/Unknown moving average type/);
    });

    it('validates window bounds', () => {
      expect(() => ForecastMethodEngine.simpleMovingAverage(seasonalData, 0)).toThrow(/Window/);
      expect(() => ForecastMethodEngine.simpleMovingAverage(seasonalData, 100)).toThrow(/Window/);
      expect(() => ForecastMethodEngine.weightedMovingAverage(seasonalData, [])).toThrow(/Weights/);
    });
  });

  describe('exponentialSmoothing validation', () => {
    it('rejects invalid alpha and short series', () => {
      expect(() => ForecastMethodEngine.exponentialSmoothing([1, 2], 0)).toThrow(/Alpha/);
      expect(() => ForecastMethodEngine.exponentialSmoothing([1, 2], 1.5)).toThrow(/Alpha/);
      expect(() => ForecastMethodEngine.exponentialSmoothing([1], 0.5)).toThrow(/at least 2/);
    });
  });

  describe('linearRegression', () => {
    it('rejects short series and returns prediction slope', () => {
      expect(() => ForecastMethodEngine.linearRegression([1])).toThrow(/at least 2/);

      const lr = ForecastMethodEngine.linearRegression([1, 2, 3, 4, 5], 3);
      expect(lr.forecast).toHaveLength(3);
      expect(lr.predict(5)).toBeCloseTo(6, 5);
      expect(lr.residuals).toHaveLength(5);
      expect(lr.metrics).toBeDefined();
    });
  });

  describe('seasonalDecomposition', () => {
    it('validates period bounds', () => {
      expect(() => ForecastMethodEngine.seasonalDecomposition(seasonalData, 1)).toThrow(/Period/);
      expect(() => ForecastMethodEngine.seasonalDecomposition(seasonalData, 9)).toThrow(/Period/);
    });

    it('additive mode decomposes into trend/seasonal/residual/deseasonalized', () => {
      const r = ForecastMethodEngine.seasonalDecomposition(seasonalData, 4, 'additive');
      expect(r.trend).toHaveLength(16);
      expect(r.seasonal).toHaveLength(16);
      expect(r.residual).toHaveLength(16);
      expect(r.deseasonalized).toHaveLength(16);
      expect(r.seasonalIndices).toHaveLength(4);
      // additive seasonal indices sum to ~0
      expect(r.seasonalIndices.reduce((s, v) => s + v, 0)).toBeCloseTo(0, 5);
      // trend edges filled
      expect(r.trend[0]).toBeCloseTo(r.trend[2]!, 5);
      expect(r.trend[15]).toBeCloseTo(r.trend[13]!, 5);
      expect(r.metrics.rmse).toBeGreaterThanOrEqual(0);
    });

    it('multiplicative mode normalizes indices (mean-normalized)', () => {
      const r = ForecastMethodEngine.seasonalDecomposition(seasonalData, 4, 'multiplicative');
      // normalization divides by the arithmetic mean → indices sum to ~period
      expect(r.seasonalIndices.reduce((s, v) => s + v, 0)).toBeCloseTo(4, 1);
      expect(r.residual).toHaveLength(16);
      expect(r.deseasonalized).toHaveLength(16);
      expect(r.metrics).toBeDefined();
    });
  });

  describe('holtWinters', () => {
    it('validates length and smoothing params', () => {
      expect(() => ForecastMethodEngine.holtWinters([1, 2, 3, 4], 0.3, 0.1, 0.1, 4)).toThrow(
        /2 full seasons/
      );
      expect(() => ForecastMethodEngine.holtWinters(seasonalData, -0.1, 0.1, 0.1, 4)).toThrow(
        /Alpha/
      );
      expect(() => ForecastMethodEngine.holtWinters(seasonalData, 0.3, 2, 0.1, 4)).toThrow(/Beta/);
      expect(() => ForecastMethodEngine.holtWinters(seasonalData, 0.3, 0.1, -1, 4)).toThrow(
        /Gamma/
      );
    });

    it('runs additive mode and forecasts ahead', () => {
      const r = ForecastMethodEngine.holtWinters(seasonalData, 0.3, 0.1, 0.1, 4, 3, 'additive');
      expect(r.forecast).toHaveLength(3);
      expect(r.fitted).toHaveLength(16);
      expect(r.level).toHaveLength(13); // 1 init + 12 updates
      expect(r.trend).toHaveLength(13);
      expect(r.seasonal).toHaveLength(4);
      expect(r.alpha).toBe(0.3);
      expect(r.beta).toBe(0.1);
      expect(r.gamma).toBe(0.1);
      expect(r.metrics).toBeDefined();
      expect(r.confidenceLower.length).toBe(3);
    });

    it('runs multiplicative mode', () => {
      const r = ForecastMethodEngine.holtWinters(
        seasonalData,
        0.3,
        0.1,
        0.1,
        4,
        2,
        'multiplicative'
      );
      expect(r.forecast).toHaveLength(2);
      expect(r.fitted).toHaveLength(16);
      expect(r.metrics).toBeDefined();
    });
  });

  describe('ensembleForecast', () => {
    it('validates data length', () => {
      expect(() => ForecastMethodEngine.ensembleForecast([1, 2, 3, 4, 5, 6, 7], 1, 4)).toThrow(
        /ensemble/
      );
    });

    it('produces a weighted forecast and fitted series', () => {
      const r = ForecastMethodEngine.ensembleForecast(seasonalData, 3, 4);
      expect(r.forecast).toHaveLength(3);
      expect(r.fitted).toHaveLength(16);
      // at least one valid fitted value
      expect(r.fitted.some((v) => isFinite(v))).toBe(true);
      expect(r.metrics).toBeDefined();
      expect(r.confidenceLower.length).toBe(3);
    });
  });

  describe('autoSelectBestMethod', () => {
    it('selects the best method and tolerates short data', () => {
      const result = ForecastMethodEngine.autoSelectBestMethod(seasonalData, 4);
      expect(result.methodName).toBeTruthy();
      expect(result.result.forecast.length).toBeGreaterThanOrEqual(1);
      expect(result.result.metrics).toBeDefined();

      // short data still works (HoltWinters candidate is skipped)
      const short = ForecastMethodEngine.autoSelectBestMethod([1, 2, 3, 4, 5, 6, 7, 8], 4);
      expect(short.methodName).toBeTruthy();
    });
  });
});
