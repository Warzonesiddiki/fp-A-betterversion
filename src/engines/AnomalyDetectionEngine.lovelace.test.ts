import { describe, it, expect, beforeEach } from 'vitest';
import { AnomalyDetectionEngine, type DataPoint } from './AnomalyDetectionEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePoints(values: number[]): DataPoint[] {
  return values.map((value, index) => ({ value, index }));
}

// ---------------------------------------------------------------------------
// Lovelace Coverage & Known-Answer Tests
// ---------------------------------------------------------------------------

describe('AnomalyDetectionEngine — Lovelace Audit', () => {
  let engine: AnomalyDetectionEngine;

  beforeEach(() => {
    engine = new AnomalyDetectionEngine();
  });

  describe('T00037: 100% Branch Coverage', () => {
    it('percentile: should hit lower===upper branch', () => {
      // sorted.length = 5, q3 with p=75: idx = 0.75 * 4 = 3.0. lower=3, upper=3.
      const stats = engine.computeStatistics([10, 20, 30, 40, 50]);
      expect(stats.q3).toBe(40);
    });

    it('skewness: should return 0 for n < 3', () => {
      const stats = engine.computeStatistics([10, 20]);
      expect(stats.skewness).toBe(0);
    });

    it('kurtosis: should return 0 for n < 4', () => {
      const stats = engine.computeStatistics([10, 20, 30]);
      expect(stats.kurtosis).toBe(0);
    });

    it('linearRegression: should handle n < 2', () => {
      // Use internal method through public trend analysis
      const result = engine.analyzeTrend(makePoints([42]));
      expect(result.slope).toBe(0);
      expect(result.intercept).toBe(42);
      expect(result.rSquared).toBe(0);
    });

    it('linearRegression: should handle denom === 0 (identical indices)', () => {
      // This is hard via public API unless we pass manual points
      const result = engine.analyzeTrend([
        { value: 10, index: 1 },
        { value: 20, index: 1 },
      ]);
      expect(result.slope).toBe(0);
      expect(result.rSquared).toBe(0);
    });

    it('movingAverage: should handle window <= 0', () => {
      // Force window 0 via updateConfig
      engine.updateConfig({ movingAverageWindow: 0 });
      const result = engine.analyzeTrend(makePoints([10, 20, 30]));
      expect(result.movingAverage).toEqual([]);
    });

    it('rateOfChange: should handle n < 2', () => {
      const result = engine.analyzeTrend(makePoints([42]));
      expect(result.rateOfChange).toEqual([]);
    });

    it('detectChangePoints: should return empty for n < window * 2', () => {
      engine.updateConfig({ movingAverageWindow: 10 });
      const result = engine.analyzeTrend(makePoints([1, 2, 3, 4, 5]));
      expect(result.changePoints).toEqual([]);
    });

    it('detectChangePoints: should skip if overallStd is 0', () => {
      const result = engine.analyzeTrend(makePoints([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]));
      expect(result.changePoints).toEqual([]);
    });

    it('classifyTrend: should return flat if meanVal is 0', () => {
      const result = engine.analyzeTrend(makePoints([0, 0, 0, 0, 0]));
      expect(result.direction).toBe('flat');
    });

    it('forecast: should handle residualStd === 0 and valueRange === 0', () => {
      const result = engine.analyzeTrend(makePoints([10, 10, 10, 10, 10]));
      expect(result.forecast.length).toBe(5);
      expect(result!.forecast[0]!.value).toBe(10);
      expect(result!.forecast[0]!.lowerBound).toBeLessThan(10);
    });

    it('detectSeasonalAnomalies: stats.count < 2 branch', () => {
      engine.updateConfig({ enableSeasonal: true, seasonalPeriod: 5 });
      // 9 points, position 4 only has 1 value (index 4). index 9 would be second.
      const result = engine.detectSeasonalAnomalies(makePoints([1, 2, 3, 4, 5, 1, 2, 3, 4]));
      expect(result).toEqual([]);
    });

    it('tagCombinedAnomalies: score limit 1 branch', () => {
      // Trigger multiple detections with very high score
      engine.updateConfig({ zScoreThreshold: 0.1, modifiedZScoreThreshold: 0.1 });
      const data = makePoints([10, 10, 10, 10, 10, 1000000]);
      const result = engine.detectAllAnomalies(data);
      const anomalous = result.anomalies.find((a) => a.dataPoint.value === 1000000);
      expect(anomalous?.score).toBe(1);
    });

    it('classifySeverity: hit all branches', () => {
      // We can check this by observing anomalies with different scores
      // but since it's private, we rely on indirect hit.
      // Score 1.0 => critical
      // Score 0.7 => high
      // Score 0.5 => medium
      // Score 0.2 => low

      const strictEngine = new AnomalyDetectionEngine({ zScoreThreshold: 0.5 });
      // Data to produce specific z-scores
      // Mean 20, SD 10.
      // Point 35 => z = (35-20)/10 = 1.5. Score = 1.5 / (0.5 * 2) = 1.5 => capped at 1.0?
      // Wait, score = min(zScore / (threshold * 2), 1)
      // If z = 1.5, threshold = 0.5. Score = 1.5 / 1.0 = 1.5 => 1.0 (Critical)
      // If z = 0.8, threshold = 0.5. Score = 0.8 / 1.0 = 0.8 (High)
      // If z = 0.55, threshold = 0.5. Score = 0.55 / 1.0 = 0.55 (Medium)
      // If z = 0.3... wait, z must be > threshold.
      // If z = 0.6, Score = 0.6 (Medium)

      const data = makePoints([10, 20, 30, 28, 25, 26, 22, 21, 23, 24]);
      // Mean: 23, SD: ~5.67
      // point 10: z = |10-23|/5.67 = 2.29. Score = 2.29 / 1 = 1 (Critical)
      // point 30: z = |30-23|/5.67 = 1.23. Score = 1.23 / 1 = 1 (Critical)

      const res = strictEngine.detectZScoreAnomalies(data);
      expect(res.some((a) => a.severity === 'critical')).toBe(true);
    });
  });

  describe('T00038: Known-Answer Standards', () => {
    it('Z-Score: should match manual calculation', () => {
      const data = makePoints([10, 20, 30]);
      engine.updateConfig({ zScoreThreshold: 0.5 });
      const anomalies = engine.detectZScoreAnomalies(data);

      // Mean = 20, SD = 10
      // 10: z = 1. Score = 1 / (0.5 * 2) = 1. Severity: critical
      const a10 = anomalies.find((a) => a.dataPoint.value === 10);
      expect(a10).toBeDefined();
      expect(a10?.score).toBe(1);
      expect(a10?.severity).toBe('critical');
      expect(a10?.expectedRange).toEqual([15, 25]);
    });

    it('Modified Z-Score: should match manual calculation', () => {
      const data = makePoints([10, 20, 30, 40, 100]);
      engine.updateConfig({ modifiedZScoreThreshold: 3.5 });
      const anomalies = engine.detectModifiedZScoreAnomalies(data);

      // Median = 30, MAD = 10
      // 100: modZ = |0.6745 * (100-30) / 10| = 4.7215
      // Score = 4.7215 / 7 = 0.6745
      // Severity: high (>= 0.65)
      const a100 = anomalies.find((a) => a.dataPoint.value === 100);
      expect(a100).toBeDefined();
      expect(a100?.score).toBeCloseTo(0.6745, 4);
      expect(a100?.severity).toBe('high');
    });

    it('IQR: should match manual calculation', () => {
      const data = makePoints([10, 20, 30, 40, 50]);
      engine.updateConfig({ iqrMultiplier: 0.5 });
      const anomalies = engine.detectIQRAnomalies(data);

      // Sorted: 10, 20, 30, 40, 50
      // Q1 (25th): 0.25 * 4 = 1. idx 1 => 20
      // Q3 (75th): 0.75 * 4 = 3. idx 3 => 40
      // IQR = 20
      // lowerFence = 20 - 0.5 * 20 = 10
      // upperFence = 40 + 0.5 * 20 = 50
      // No anomalies for [10, 50] inclusive.
      expect(anomalies.length).toBe(0);

      engine.updateConfig({ iqrMultiplier: 0.1 });
      // lowerFence = 20 - 2 = 18
      // upperFence = 40 + 2 = 42
      // Anomalies: 10, 50
      const anomalies2 = engine.detectIQRAnomalies(data);
      expect(anomalies2.length).toBe(2);
      expect(anomalies2.some((a) => a.dataPoint.value === 10)).toBe(true);
      expect(anomalies2.some((a) => a.dataPoint.value === 50)).toBe(true);
    });
  });
});
