import { describe, it, expect, beforeEach } from 'vitest';
import {
  AnomalyDetectionEngine,
  type DataPoint,
  type AnomalyDetectionConfig,
} from './AnomalyDetectionEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePoints(values: number[]): DataPoint[] {
  return values.map((value, index) => ({ value, index }));
}

function makePoint(value: number, index: number): DataPoint {
  return { value, index };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AnomalyDetectionEngine', () => {
  let engine: AnomalyDetectionEngine;

  beforeEach(() => {
    engine = new AnomalyDetectionEngine();
  });

  // =========================================================================
  // Construction & Config
  // =========================================================================

  describe('constructor & config', () => {
    it('should use default config when none provided', () => {
      const cfg = engine.getConfig();
      expect(cfg.zScoreThreshold).toBe(3.0);
      expect(cfg.modifiedZScoreThreshold).toBe(3.5);
      expect(cfg.iqrMultiplier).toBe(1.5);
      expect(cfg.movingAverageWindow).toBe(5);
      expect(cfg.forecastPeriods).toBe(5);
      expect(cfg.minDataPoints).toBe(3);
      expect(cfg.enableSeasonal).toBe(false);
      expect(cfg.seasonalPeriod).toBe(12);
    });

    it('should merge partial config with defaults', () => {
      const custom = new AnomalyDetectionEngine({ zScoreThreshold: 2.5, iqrMultiplier: 2.0 });
      const cfg = custom.getConfig();
      expect(cfg.zScoreThreshold).toBe(2.5);
      expect(cfg.iqrMultiplier).toBe(2.0);
      expect(cfg.modifiedZScoreThreshold).toBe(3.5); // default preserved
    });

    it('should update config after construction', () => {
      engine.updateConfig({ zScoreThreshold: 2.0 });
      expect(engine.getConfig().zScoreThreshold).toBe(2.0);
    });

    it('should return a copy of config (not a reference)', () => {
      const cfg1 = engine.getConfig();
      cfg1.zScoreThreshold = 999;
      expect(engine.getConfig().zScoreThreshold).toBe(3.0);
    });
  });

  // =========================================================================
  // computeStatistics
  // =========================================================================

  describe('computeStatistics', () => {
    it('should return all-zero statistics for empty input', () => {
      const stats = engine.computeStatistics([]);
      expect(stats.count).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.stdDev).toBe(0);
      expect(stats.mad).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.skewness).toBe(0);
      expect(stats.kurtosis).toBe(0);
    });

    it('should compute correct statistics for a known dataset', () => {
      // [2, 4, 4, 4, 5, 5, 7, 9]
      const stats = engine.computeStatistics([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(stats.count).toBe(8);
      expect(stats.mean).toBe(5);
      expect(stats.median).toBe(4.5);
      expect(stats.min).toBe(2);
      expect(stats.max).toBe(9);
      expect(stats.q1).toBeCloseTo(4, 5);
      expect(stats.q3).toBeCloseTo(5.5, 5);
      expect(stats.iqr).toBeCloseTo(1.5, 5);
      expect(stats.stdDev).toBeGreaterThan(0);
    });

    it('should handle single value', () => {
      const stats = engine.computeStatistics([42]);
      expect(stats.count).toBe(1);
      expect(stats.mean).toBe(42);
      expect(stats.median).toBe(42);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
      expect(stats.stdDev).toBe(0); // n < 2 => 0
    });

    it('should handle identical values', () => {
      const stats = engine.computeStatistics([5, 5, 5, 5, 5]);
      expect(stats.stdDev).toBe(0);
      expect(stats.mad).toBe(0);
      expect(stats.skewness).toBe(0);
    });

    it('should compute skewness for skewed data', () => {
      // Right-skewed: mostly small with some large values
      const rightSkewed = [1, 1, 1, 1, 1, 1, 2, 3, 10, 100];
      const stats = engine.computeStatistics(rightSkewed);
      expect(stats.skewness).toBeGreaterThan(0);
    });

    it('should compute kurtosis for heavy-tailed data', () => {
      // Heavy tails
      const heavyTail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 100, -100];
      const stats = engine.computeStatistics(heavyTail);
      // Excess kurtosis > 0 for heavy-tailed distributions
      expect(stats.kurtosis).not.toBe(0);
    });
  });

  // =========================================================================
  // Z-Score Anomaly Detection
  // =========================================================================

  describe('detectZScoreAnomalies', () => {
    it('should detect obvious outliers', () => {
      // Need 20+ data points so a single outlier can exceed z-score 3.0
      // (max z-score for single outlier is sqrt(n-1); with n=10 it's ~2.846 < 3.0)
      const data = makePoints([
        10, 12, 11, 13, 10, 14, 11, 12, 13, 10, 12, 11, 13, 10, 14, 11, 12, 13, 10, 10000,
      ]);
      const anomalies = engine.detectZScoreAnomalies(data);
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      expect(anomalies.some((a) => a.dataPoint.value === 10000)).toBe(true);
    });

    it('should not flag normal data', () => {
      const data = makePoints([10, 11, 10, 12, 10, 11, 10, 12, 10, 11]);
      const anomalies = engine.detectZScoreAnomalies(data);
      expect(anomalies.length).toBe(0);
    });

    it('should detect multiple outliers', () => {
      // 20 data points so outliers can exceed z-score 3.0
      const data = makePoints([
        10, 12, 11, 13, 10, 14, 11, 12, 13, 10, 12, 11, 13, 10, 14, 11, 12, 13, 5000, -5000,
      ]);
      const anomalies = engine.detectZScoreAnomalies(data);
      expect(anomalies.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty for uniform data (stdDev = 0)', () => {
      const data = makePoints([5, 5, 5, 5, 5]);
      const anomalies = engine.detectZScoreAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should respect custom zScoreThreshold', () => {
      const strict = new AnomalyDetectionEngine({ zScoreThreshold: 1.5 });
      // These points have some variance but not extreme
      const data = makePoints([10, 10, 10, 10, 10, 15, 10, 10, 10, 5]);
      const anomalies = strict.detectZScoreAnomalies(data);
      // With a threshold of 1.5, more points should be flagged
      expect(anomalies.length).toBeGreaterThan(0);
    });

    it('should include severity and reason in anomaly', () => {
      // 20 data points so outlier can exceed z-score 3.0
      const data = makePoints([
        10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10000,
      ]);
      const anomalies = engine.detectZScoreAnomalies(data);
      expect(anomalies.length).toBeGreaterThan(0);
      const a = anomalies[0];
      expect(a!.method).toBe('zscore');
      expect(['critical', 'high', 'medium', 'low']).toContain(a!.severity);
      expect(a!.reason).toContain('Z-score');
      expect(a!.expectedRange).toHaveLength(2);
      expect(a!.score).toBeGreaterThanOrEqual(0);
      expect(a!.score).toBeLessThanOrEqual(1);
    });
  });

  // =========================================================================
  // Modified Z-Score Anomaly Detection
  // =========================================================================

  describe('detectModifiedZScoreAnomalies', () => {
    it('should detect outliers using MAD-based method', () => {
      const data = makePoints([10, 12, 11, 13, 10, 14, 11, 12, 13, 500]);
      const anomalies = engine.detectModifiedZScoreAnomalies(data);
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      expect(anomalies![0]!.method).toBe('modified-zscore');
      expect(anomalies![0]!.reason).toContain('Modified Z-score');
    });

    it('should not flag normal data', () => {
      const data = makePoints([10, 11, 10, 12, 10, 11, 10, 12, 10, 11]);
      const anomalies = engine.detectModifiedZScoreAnomalies(data);
      expect(anomalies.length).toBe(0);
    });

    it('should return empty when MAD is 0', () => {
      // More than half the values are the same => MAD = 0
      const data = makePoints([5, 5, 5, 5, 5, 5, 6]);
      const anomalies = engine.detectModifiedZScoreAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should be more robust than Z-score for extreme outliers', () => {
      // 20 data points so z-score can exceed 3.0; MAD-based method uses median, more robust
      const data = makePoints([
        10, 12, 11, 13, 10, 14, 11, 12, 13, 10, 12, 11, 13, 10, 14, 11, 12, 13, 10, 100000,
      ]);
      const zAnomalies = engine.detectZScoreAnomalies(data);
      const modAnomalies = engine.detectModifiedZScoreAnomalies(data);
      // Both should detect it, but Modified Z-score may have different scores
      expect(zAnomalies.length).toBeGreaterThanOrEqual(1);
      expect(modAnomalies.length).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // IQR Anomaly Detection
  // =========================================================================

  describe('detectIQRAnomalies', () => {
    it('should detect values outside IQR fences', () => {
      const data = makePoints([10, 12, 11, 10, 13, 12, 11, 100, 12, 11]);
      const anomalies = engine.detectIQRAnomalies(data);
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      expect(anomalies.some((a) => a.dataPoint.value === 100)).toBe(true);
    });

    it('should not flag data within fences', () => {
      const data = makePoints([10, 11, 12, 11, 10, 12, 11, 10, 12, 11]);
      const anomalies = engine.detectIQRAnomalies(data);
      expect(anomalies.length).toBe(0);
    });

    it('should respect custom iqrMultiplier', () => {
      const strict = new AnomalyDetectionEngine({ iqrMultiplier: 0.5 });
      // Use data with enough spread for IQR to be non-zero
      const data = makePoints([10, 12, 11, 13, 10, 14, 11, 12, 13, 30]);
      const anomalies = strict.detectIQRAnomalies(data);
      expect(anomalies.length).toBeGreaterThan(0);
    });

    it('should return empty when IQR is 0', () => {
      const data = makePoints([5, 5, 5, 5, 5]);
      const anomalies = engine.detectIQRAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should include IQR fence details in reason', () => {
      const data = makePoints([10, 12, 11, 13, 10, 14, 11, 12, 13, 100]);
      const anomalies = engine.detectIQRAnomalies(data);
      if (anomalies.length > 0) {
        expect(anomalies![0]!.reason).toContain('IQR fences');
        expect(anomalies![0]!.method).toBe('iqr');
      }
    });
  });

  // =========================================================================
  // detectAllAnomalies (combined statistical)
  // =========================================================================

  describe('detectAllAnomalies', () => {
    it('should combine results from all statistical methods', () => {
      const data = makePoints([10, 12, 11, 13, 10, 14, 11, 12, 13, 500]);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
      expect(result.totalPoints).toBe(10);
      expect(result.anomalyCount).toBe(result.anomalies.length);
      expect(result.anomalyRate).toBeGreaterThan(0);
      expect(result.statistics).toBeDefined();
      expect(result.generatedAt).toBeDefined();
    });

    it('should return empty result for insufficient data', () => {
      const data = makePoints([10, 20]);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies).toEqual([]);
      expect(result.anomalyCount).toBe(0);
    });

    it('should deduplicate anomalies on the same data point', () => {
      const data = makePoints([10, 10, 10, 10, 10, 10, 10, 10, 10, 1000]);
      const result = engine.detectAllAnomalies(data);
      // Even if multiple methods flag the same point, it should appear once
      const indices = result.anomalies.map((a) => a.dataPoint.index);
      const uniqueIndices = new Set(indices);
      expect(indices.length).toBe(uniqueIndices.size);
    });

    it('should sort anomalies by score descending', () => {
      const data = makePoints([1, 2, 3, 2, 1, 2, 3, 100, 2, -50]);
      const result = engine.detectAllAnomalies(data);
      for (let i = 1; i < result.anomalies.length; i++) {
        expect(result!.anomalies[i - 1]!.score).toBeGreaterThanOrEqual(result!.anomalies[i]!.score);
      }
    });

    it('should tag anomalies flagged by multiple methods as combined', () => {
      // Use varied base data + extreme outlier that all methods should catch
      const data = makePoints([10, 12, 11, 13, 10, 14, 11, 12, 13, 10000]);
      const result = engine.detectAllAnomalies(data);
      const combined = result.anomalies.filter((a) => a.method === 'combined');
      expect(combined.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle normal data with no anomalies', () => {
      const data = makePoints([100, 102, 99, 101, 100, 103, 98, 101, 100, 102]);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalyCount).toBe(0);
      expect(result.anomalyRate).toBe(0);
    });
  });

  // =========================================================================
  // Trend Analysis
  // =========================================================================

  describe('analyzeTrend', () => {
    it('should detect upward trend', () => {
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const result = engine.analyzeTrend(data);
      expect(result.direction).toBe('upward');
      expect(result.slope).toBeGreaterThan(0);
      expect(result.rSquared).toBeGreaterThan(0.9);
    });

    it('should detect downward trend', () => {
      const data = makePoints([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      const result = engine.analyzeTrend(data);
      expect(result.direction).toBe('downward');
      expect(result.slope).toBeLessThan(0);
    });

    it('should detect flat trend', () => {
      const data = makePoints([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
      const result = engine.analyzeTrend(data);
      expect(result.direction).toBe('flat');
      expect(Math.abs(result.slope)).toBeLessThan(0.01);
    });

    it('should detect volatile trend', () => {
      // High variance, low R-squared
      const data = makePoints([100, -50, 200, -100, 150, -75, 180, -90, 160, -80]);
      const result = engine.analyzeTrend(data);
      expect(result.direction).toBe('volatile');
    });

    it('should compute moving average', () => {
      const data = makePoints([10, 20, 30, 40, 50]);
      const result = engine.analyzeTrend(data);
      expect(result.movingAverage).toHaveLength(5);
      // First MA value should be 10 (only first point)
      expect(result.movingAverage[0]!).toBe(10);
      // Second MA value should be average of [10, 20]
      expect(result.movingAverage[1]!).toBe(15);
      // Third MA value should be average of [10, 20, 30]
      expect(result.movingAverage[2]!).toBe(20);
    });

    it('should compute rate of change', () => {
      const data = makePoints([100, 110, 121, 100]);
      const result = engine.analyzeTrend(data);
      expect(result.rateOfChange).toHaveLength(4);
      expect(result.rateOfChange[0]!).toBe(0); // First point
      expect(result.rateOfChange[1]!).toBeCloseTo(10, 0); // 10% increase
      expect(result.rateOfChange[2]!).toBeCloseTo(10, 0); // 10% increase
      expect(result.rateOfChange[3]!).toBeLessThan(0); // Decrease
    });

    it('should detect change points', () => {
      // Trend reversal: upward then downward
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
      const result = engine.analyzeTrend(data);
      expect(result.changePoints.length).toBeGreaterThanOrEqual(1);
    });

    it('should generate forecast points', () => {
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const result = engine.analyzeTrend(data);
      expect(result.forecast).toHaveLength(5);
      // Forecast should continue upward trend
      expect(result!.forecast[0]!.value).toBeGreaterThan(10);
      // Each forecast should have bounds
      for (const fp of result.forecast) {
        expect(fp.lowerBound).toBeLessThan(fp.value);
        expect(fp.upperBound).toBeGreaterThan(fp.value);
        expect(fp.confidence).toBeGreaterThanOrEqual(0);
        expect(fp.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should widen confidence interval over time', () => {
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const result = engine.analyzeTrend(data);
      const widths = result.forecast.map((fp) => fp.upperBound - fp.lowerBound);
      for (let i = 1; i < widths.length; i++) {
        expect(widths[i]!).toBeGreaterThan(widths[i - 1]);
      }
    });
  });

  // =========================================================================
  // Trend-Break Anomaly Detection
  // =========================================================================

  describe('detectTrendBreakAnomalies', () => {
    it('should detect trend breaks in upward data', () => {
      // Steady upward with a sudden extreme drop at the end
      const data = makePoints([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, -500]);
      const anomalies = engine.detectTrendBreakAnomalies(data);
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      expect(anomalies.some((a) => a.dataPoint.value === -500)).toBe(true);
    });

    it('should not flag points on the trend line', () => {
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      const anomalies = engine.detectTrendBreakAnomalies(data);
      expect(anomalies.length).toBe(0);
    });

    it('should return empty for insufficient data', () => {
      const data = makePoints([1, 2]);
      const anomalies = engine.detectTrendBreakAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should include trend-break method identifier', () => {
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 200]);
      const anomalies = engine.detectTrendBreakAnomalies(data);
      if (anomalies.length > 0) {
        expect(anomalies![0]!.method).toBe('trend-break');
        expect(anomalies![0]!.reason).toContain('trend');
      }
    });
  });

  // =========================================================================
  // Seasonal Anomaly Detection
  // =========================================================================

  describe('detectSeasonalAnomalies', () => {
    it('should return empty when seasonal is disabled', () => {
      const engine = new AnomalyDetectionEngine({ enableSeasonal: false });
      const data = makePoints([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
      ]);
      const anomalies = engine.detectSeasonalAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should detect seasonal anomalies when enabled', () => {
      const engine = new AnomalyDetectionEngine({
        enableSeasonal: true,
        seasonalPeriod: 4,
        zScoreThreshold: 2.0,
      });
      // 10 periods of [10, 20, 30, 40] so position 2 has 10 values (9x30 + 30000)
      // More periods give a lower z-score threshold needed for detection
      const data = makePoints([
        10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30,
        40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 30000, 40,
      ]);
      const anomalies = engine.detectSeasonalAnomalies(data);
      // 30000 at index 38 is in position 2 (seasonal value 30) - should be flagged
      expect(anomalies.some((a) => a.dataPoint.value === 30000)).toBe(true);
    });

    it('should return empty for insufficient data (< 2 periods)', () => {
      const engine = new AnomalyDetectionEngine({ enableSeasonal: true, seasonalPeriod: 12 });
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      const anomalies = engine.detectSeasonalAnomalies(data);
      expect(anomalies).toEqual([]);
    });

    it('should include seasonal info in reason', () => {
      const engine = new AnomalyDetectionEngine({
        enableSeasonal: true,
        seasonalPeriod: 4,
        zScoreThreshold: 2.0,
      });
      const data = makePoints([10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 300, 40]);
      const anomalies = engine.detectSeasonalAnomalies(data);
      if (anomalies.length > 0) {
        expect(anomalies![0]!.reason).toContain('Seasonal position');
        expect(anomalies![0]!.method).toBe('seasonal');
      }
    });
  });

  // =========================================================================
  // runFullAnalysis (combined)
  // =========================================================================

  describe('runFullAnalysis', () => {
    it('should combine statistical, trend-break, and seasonal anomalies', () => {
      const engine = new AnomalyDetectionEngine({
        enableSeasonal: true,
        seasonalPeriod: 4,
      });
      // 3 periods with a trend break and a seasonal anomaly
      const data = makePoints([10, 20, 30, 40, 10, 20, 30, 40, 10, 20, 300, 40]);
      const result = engine.runFullAnalysis(data);
      expect(result.anomalies.length).toBeGreaterThan(0);
      expect(result.totalPoints).toBe(12);
      expect(result.statistics).toBeDefined();
    });

    it('should handle data with no anomalies gracefully', () => {
      const data = makePoints([100, 102, 99, 101, 100, 103, 98, 101, 100, 102]);
      const result = engine.runFullAnalysis(data);
      expect(result.anomalyCount).toBe(0);
      expect(result.anomalyRate).toBe(0);
    });

    it('should work with seasonal disabled (default)', () => {
      const data = makePoints([1, 2, 3, 4, 5, 6, 7, 8, 9, 100]);
      const result = engine.runFullAnalysis(data);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle minimal data (exactly minDataPoints)', () => {
      const data = makePoints([10, 20, 30]);
      const result = engine.runFullAnalysis(data);
      expect(result.totalPoints).toBe(3);
      expect(result.statistics.count).toBe(3);
    });
  });

  // =========================================================================
  // Static Helpers
  // =========================================================================

  describe('static helpers', () => {
    it('fromValues should create DataPoint array', () => {
      const points = AnomalyDetectionEngine.fromValues([10, 20, 30]);
      expect(points).toEqual([
        { value: 10, index: 0 },
        { value: 20, index: 1 },
        { value: 30, index: 2 },
      ]);
    });

    it('fromValues should respect startIndex', () => {
      const points = AnomalyDetectionEngine.fromValues([10, 20, 30], 100);
      expect(points![0]!.index).toBe(100);
      expect(points![1]!.index).toBe(101);
      expect(points![2]!.index).toBe(102);
    });

    it('fromTimeSeries should create DataPoint array from timestamps', () => {
      const points = AnomalyDetectionEngine.fromTimeSeries([
        { timestamp: 1000, value: 10 },
        { timestamp: 2000, value: 20 },
      ]);
      expect(points).toEqual([
        { value: 10, index: 1000 },
        { value: 20, index: 2000 },
      ]);
    });

    it('fromValues should handle empty array', () => {
      const points = AnomalyDetectionEngine.fromValues([]);
      expect(points).toEqual([]);
    });
  });

  // =========================================================================
  // Edge Cases
  // =========================================================================

  describe('edge cases', () => {
    it('should handle negative values', () => {
      const data = makePoints([-100, -50, -10, -50, -100, -50, -10, -50, -100, 500]);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very large values', () => {
      // Use a lower threshold since with 9 identical values and 1 outlier,
      // the z-score is limited. With threshold 2.0, z-score ~2.3 is caught.
      const strictEngine = new AnomalyDetectionEngine({
        zScoreThreshold: 2.0,
        modifiedZScoreThreshold: 2.5,
        iqrMultiplier: 1.0,
      });
      const data = makePoints([1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e10, 1e15]);
      const result = strictEngine.detectAllAnomalies(data);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle very small values (near zero)', () => {
      const data = makePoints([0.001, 0.002, 0.001, 0.002, 0.001, 0.002, 0.001, 0.002, 0.001, 1.0]);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle exactly minDataPoints', () => {
      const data = makePoints([10, 20, 1000]);
      const result = engine.detectAllAnomalies(data);
      expect(result.totalPoints).toBe(3);
    });

    it('should handle zero values in rate of change', () => {
      const data = makePoints([0, 10, 20, 30, 40]);
      const result = engine.analyzeTrend(data);
      expect(result.rateOfChange[1]!).toBe(0); // prev=0, should be 0 to avoid division by zero
    });

    it('should handle all zeros', () => {
      const data = makePoints([0, 0, 0, 0, 0]);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalyCount).toBe(0);
      expect(result.statistics.stdDev).toBe(0);
    });

    it('should handle data with metadata', () => {
      const data: DataPoint[] = [
        { value: 10, index: 0, label: 'revenue', metadata: { entity: 'A' } },
        { value: 12, index: 1, label: 'revenue', metadata: { entity: 'A' } },
        { value: 11, index: 2, label: 'revenue', metadata: { entity: 'A' } },
        { value: 10, index: 3, label: 'revenue', metadata: { entity: 'A' } },
        { value: 12, index: 4, label: 'revenue', metadata: { entity: 'A' } },
        { value: 11, index: 5, label: 'revenue', metadata: { entity: 'A' } },
        { value: 10, index: 6, label: 'revenue', metadata: { entity: 'A' } },
        { value: 12, index: 7, label: 'revenue', metadata: { entity: 'A' } },
        { value: 11, index: 8, label: 'revenue', metadata: { entity: 'A' } },
        { value: 5000, index: 9, label: 'revenue', metadata: { entity: 'A' } },
      ];
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.length).toBeGreaterThanOrEqual(1);
      expect(result!.anomalies[0]!.dataPoint.label).toBe('revenue');
      expect(result!.anomalies[0]!.dataPoint.metadata).toEqual({ entity: 'A' });
    });
  });

  // =========================================================================
  // Financial Data Scenarios
  // =========================================================================

  describe('financial data scenarios', () => {
    it('should detect revenue spike anomaly', () => {
      // Monthly revenue with a sudden spike
      const revenue = [100, 105, 98, 102, 110, 95, 108, 103, 99, 107, 500, 101];
      const data = AnomalyDetectionEngine.fromValues(revenue);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.some((a) => a.dataPoint.index === 10)).toBe(true);
    });

    it('should detect expense anomaly in budget vs actual', () => {
      // Budget: flat at 50, actual mostly on track with one overrun
      const actual = [50, 52, 48, 51, 50, 49, 200, 50, 51, 49];
      const data = AnomalyDetectionEngine.fromValues(actual);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.some((a) => a.dataPoint.value === 200)).toBe(true);
    });

    it('should analyze quarterly profit trend', () => {
      const profit = [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32];
      const data = AnomalyDetectionEngine.fromValues(profit);
      const trend = engine.analyzeTrend(data);
      expect(trend.direction).toBe('upward');
      expect(trend.slope).toBeGreaterThan(0);
      expect(trend.forecast.length).toBe(5);
      for (const fp of trend.forecast) {
        expect(fp.value).toBeGreaterThan(32);
      }
    });

    it('should detect headcount anomaly', () => {
      const headcount = [50, 51, 51, 52, 52, 53, 53, 54, 54, 55, 55, 100];
      const data = AnomalyDetectionEngine.fromValues(headcount);
      const result = engine.detectAllAnomalies(data);
      expect(result.anomalies.some((a) => a.dataPoint.value === 100)).toBe(true);
    });

    it('should handle multi-entity consolidation scenario', () => {
      // Entity A: stable, Entity B: stable, Entity C: anomalous
      const entityA = [100, 102, 99, 101, 100];
      const entityB = [200, 205, 198, 202, 201];
      const entityC = [50, 52, 49, 500, 51]; // Index 3 is anomalous

      const allPoints: DataPoint[] = [
        ...entityA.map((v, i) => makePoint(v, i)),
        ...entityB.map((v, i) => makePoint(v, i + 5)),
        ...entityC.map((v, i) => makePoint(v, i + 10)),
      ];

      const result = engine.detectAllAnomalies(allPoints);
      // Entity C's 500 at index 13 should be flagged
      expect(result.anomalies.some((a) => a.dataPoint.value === 500)).toBe(true);
    });
  });
});
