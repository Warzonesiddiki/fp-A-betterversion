import { describe, it, expect } from 'vitest';
import { ForecastMethodEngine } from './ForecastMethodEngine';

describe('ForecastMethodEngine', () => {
  const upwardData = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210];
  const seasonalData = [100, 120, 140, 110, 100, 120, 140, 110, 100, 120, 140, 110];

  describe('simpleMovingAverage', () => {
    it('should calculate 3-period simple moving average', () => {
      const result = ForecastMethodEngine.simpleMovingAverage(upwardData, 3);
      expect(result.fitted[2]).toBeCloseTo(110, 0);
      expect(result.forecast).toHaveLength(1);
    });

    it('should calculate 5-period simple moving average', () => {
      const result = ForecastMethodEngine.simpleMovingAverage(upwardData, 5);
      expect(result.fitted[4]).toBeCloseTo(120, 0);
    });

    it('should throw when window exceeds data length', () => {
      expect(() => ForecastMethodEngine.simpleMovingAverage([1, 2, 3], 5)).toThrow();
    });
  });

  describe('movingAverage', () => {
    it('should delegate to simple moving average via options', () => {
      const result = ForecastMethodEngine.movingAverage(upwardData, { type: 'simple', window: 3 });
      expect(result.fitted[2]).toBeCloseTo(110, 0);
      expect(result.forecast).toHaveLength(1);
    });
  });

  describe('linearRegression', () => {
    it('should fit linear trend', () => {
      const result = ForecastMethodEngine.linearRegression(upwardData);
      expect(result.slope).toBeGreaterThan(0);
      expect(result.intercept).toBeDefined();
      expect(result.r2).toBeGreaterThan(0.9);
    });

    it('should forecast future values', () => {
      const result = ForecastMethodEngine.linearRegression(upwardData, 3);
      expect(result.forecast).toHaveLength(3);
      expect(result.forecast[0]).toBeGreaterThan(upwardData[upwardData.length - 1]);
    });

    it('should handle flat data', () => {
      const result = ForecastMethodEngine.linearRegression([100, 100, 100, 100, 100]);
      expect(result.slope).toBeCloseTo(0, 1);
    });
  });

  describe('holtWinters', () => {
    it('should forecast with Holt-Winters (additive)', () => {
      const result = ForecastMethodEngine.holtWinters(seasonalData, 0.3, 0.1, 0.1, 4, 4);
      expect(result.forecast).toHaveLength(4);
      expect(result.forecast[0]).toBeDefined();
    });

    it('should produce seasonal and trend components', () => {
      const result = ForecastMethodEngine.holtWinters(seasonalData, 0.3, 0.1, 0.1, 4, 4);
      expect(result.seasonal).toBeDefined();
      expect(result.seasonal.length).toBe(4);
    });
  });

  describe('seasonalDecomposition', () => {
    it('should decompose into trend, seasonal, residual', () => {
      const result = ForecastMethodEngine.seasonalDecomposition(seasonalData, 4);
      expect(result.trend).toBeDefined();
      expect(result.seasonal).toBeDefined();
      expect(result.residual).toBeDefined();
    });

    it('should have seasonal indices matching the period', () => {
      const result = ForecastMethodEngine.seasonalDecomposition(seasonalData, 4);
      expect(result.seasonalIndices).toHaveLength(4);
    });
  });
});
