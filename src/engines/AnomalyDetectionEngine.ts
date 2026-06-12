/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================================
// ANOMALY DETECTION ENGINE — On-device AI anomaly detection
// Statistical anomaly detection, trend analysis, outlier identification
// Pure TypeScript, deterministic, no external dependencies
// =============================================================================

/**
 * Severity level for detected anomalies.
 */
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Detection method used to identify an anomaly.
 */
export type DetectionMethod =
  | 'zscore'
  | 'modified-zscore'
  | 'iqr'
  | 'trend-break'
  | 'seasonal'
  | 'combined';

/**
 * A single data point for anomaly detection.
 */
export interface DataPoint {
  /** Numeric value of the data point. */
  value: number;
  /** Timestamp or index (for time-series analysis). */
  index: number;
  /** Optional label or category. */
  label?: string;
  /** Optional metadata. */
  metadata?: Record<string, unknown>;
}

/**
 * A detected anomaly with details.
 */
export interface Anomaly {
  /** The data point that is anomalous. */
  dataPoint: DataPoint;
  /** Detection method that flagged this anomaly. */
  method: DetectionMethod;
  /** Severity of the anomaly. */
  severity: AnomalySeverity;
  /** Anomaly score (0-1, higher = more anomalous). */
  score: number;
  /** Human-readable explanation. */
  reason: string;
  /** Expected value range [min, max]. */
  expectedRange: [number, number];
}

/**
 * Result of anomaly detection across a dataset.
 */
export interface AnomalyDetectionResult {
  /** All detected anomalies. */
  anomalies: Anomaly[];
  /** Total number of data points analyzed. */
  totalPoints: number;
  /** Number of anomalies detected. */
  anomalyCount: number;
  /** Anomaly rate (0-1). */
  anomalyRate: number;
  /** Statistical summary of the dataset. */
  statistics: DatasetStatistics;
  /** Timestamp when analysis was performed. */
  generatedAt: string;
}

/**
 * Statistical summary of a numeric dataset.
 */
export interface DatasetStatistics {
  mean: number;
  median: number;
  stdDev: number;
  mad: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
  count: number;
}

/**
 * Trend direction detected in time-series data.
 */
export type TrendDirection = 'upward' | 'downward' | 'flat' | 'volatile';

/**
 * Result of trend analysis.
 */
export interface TrendAnalysisResult {
  /** Overall trend direction. */
  direction: TrendDirection;
  /** Linear regression slope (value per index). */
  slope: number;
  /** Linear regression intercept. */
  intercept: number;
  /** R-squared goodness of fit (0-1). */
  rSquared: number;
  /** Moving average values (window size from config). */
  movingAverage: number[];
  /** Rate of change between consecutive points (%). */
  rateOfChange: number[];
  /** Trend change points (indices where trend shifts). */
  changePoints: number[];
  /** Forecasted values (next N periods). */
  forecast: ForecastPoint[];
}

/**
 * A forecasted data point.
 */
export interface ForecastPoint {
  index: number;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

/**
 * Configuration for anomaly detection.
 */
export interface AnomalyDetectionConfig {
  /** Z-score threshold for anomaly detection (default: 3.0). */
  zScoreThreshold: number;
  /** Modified Z-score threshold using MAD (default: 3.5). */
  modifiedZScoreThreshold: number;
  /** IQR multiplier for outlier detection (default: 1.5). */
  iqrMultiplier: number;
  /** Window size for moving average (default: 5). */
  movingAverageWindow: number;
  /** Number of periods to forecast (default: 5). */
  forecastPeriods: number;
  /** Minimum data points required for analysis. */
  minDataPoints: number;
  /** Enable seasonal decomposition. */
  enableSeasonal: boolean;
  /** Seasonal period length (e.g., 12 for monthly data with yearly seasonality). */
  seasonalPeriod: number;
}

const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  zScoreThreshold: 3.0,
  modifiedZScoreThreshold: 3.5,
  iqrMultiplier: 1.5,
  movingAverageWindow: 5,
  forecastPeriods: 5,
  minDataPoints: 3,
  enableSeasonal: false,
  seasonalPeriod: 12,
};

// ---------------------------------------------------------------------------
// Statistical Helpers (pure functions)
// ---------------------------------------------------------------------------

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function stdDev(values: number[], avg?: number): number {
  if (values.length < 2) return 0;
  const m = avg ?? mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function mad(values: number[], med?: number): number {
  if (values.length === 0) return 0;
  const m = med ?? median(values);
  const deviations = values.map((v) => Math.abs(v - m));
  return median(deviations);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (idx - lower);
}

function skewness(values: number[], avg?: number, sd?: number): number {
  if (values.length < 3) return 0;
  const m = avg ?? mean(values);
  const s = sd ?? stdDev(values, m);
  if (s === 0) return 0;
  const n = values.length;
  const sumCubed = values.reduce((sum, v) => sum + ((v - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sumCubed;
}

function kurtosis(values: number[], avg?: number, sd?: number): number {
  if (values.length < 4) return 0;
  const m = avg ?? mean(values);
  const s = sd ?? stdDev(values, m);
  if (s === 0) return 0;
  const n = values.length;
  const sumFourth = values.reduce((sum, v) => sum + ((v - m) / s) ** 4, 0);
  const factor = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const correction = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return factor * sumFourth - correction;
}

// ---------------------------------------------------------------------------
// AnomalyDetectionEngine
// ---------------------------------------------------------------------------

export class AnomalyDetectionEngine {
  private config: AnomalyDetectionConfig;

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -------------------------------------------------------------------------
  // Public API — Statistical Anomaly Detection
  // -------------------------------------------------------------------------

  /**
   * Compute descriptive statistics for a numeric dataset.
   */
  computeStatistics(values: number[]): DatasetStatistics {
    if (values.length === 0) {
      return {
        mean: 0,
        median: 0,
        stdDev: 0,
        mad: 0,
        min: 0,
        max: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        skewness: 0,
        kurtosis: 0,
        count: 0,
      };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const m = mean(values);
    const med = median(values);
    const sd = stdDev(values, m);
    const md = mad(values, med);
    const q1 = percentile(sorted, 25);
    const q3 = percentile(sorted, 75);

    return {
      mean: m,
      median: med,
      stdDev: sd,
      mad: md,
      min: sorted[0]!,
      max: sorted[sorted.length - 1]!,
      q1,
      q3,
      iqr: q3 - q1,
      skewness: skewness(values, m, sd),
      kurtosis: kurtosis(values, m, sd),
      count: values.length,
    };
  }

  /**
   * Detect anomalies using Z-score method.
   * Flags data points that deviate more than `zScoreThreshold` standard deviations from the mean.
   */
  detectZScoreAnomalies(dataPoints: DataPoint[]): Anomaly[] {
    const values = dataPoints.map((dp) => dp.value);
    const stats = this.computeStatistics(values);
    if (stats.stdDev === 0) return [];

    const anomalies: Anomaly[] = [];
    for (const dp of dataPoints) {
      const zScore = Math.abs((dp.value - stats.mean) / stats.stdDev);
      if (zScore > this.config.zScoreThreshold) {
        const score = Math.min(zScore / (this.config.zScoreThreshold * 2), 1);
        anomalies.push({
          dataPoint: dp,
          method: 'zscore',
          severity: this.classifySeverity(score),
          score,
          reason: `Z-score ${zScore.toFixed(2)} exceeds threshold ${this.config.zScoreThreshold} (mean=${stats.mean.toFixed(2)}, std=${stats.stdDev.toFixed(2)})`,
          expectedRange: [
            stats.mean - this.config.zScoreThreshold * stats.stdDev,
            stats.mean + this.config.zScoreThreshold * stats.stdDev,
          ],
        });
      }
    }
    return anomalies;
  }

  /**
   * Detect anomalies using Modified Z-score (MAD-based).
   * More robust to outliers than standard Z-score since it uses median absolute deviation.
   */
  detectModifiedZScoreAnomalies(dataPoints: DataPoint[]): Anomaly[] {
    const values = dataPoints.map((dp) => dp.value);
    const stats = this.computeStatistics(values);
    if (stats.mad === 0) return [];

    const anomalies: Anomaly[] = [];
    const consistencyConstant = 1.4826; // For normally distributed data

    for (const dp of dataPoints) {
      const modifiedZScore = Math.abs((0.6745 * (dp.value - stats.median)) / stats.mad);
      if (modifiedZScore > this.config.modifiedZScoreThreshold) {
        const score = Math.min(modifiedZScore / (this.config.modifiedZScoreThreshold * 2), 1);
        const threshold = (this.config.modifiedZScoreThreshold * stats.mad) / 0.6745;
        anomalies.push({
          dataPoint: dp,
          method: 'modified-zscore',
          severity: this.classifySeverity(score),
          score,
          reason: `Modified Z-score ${modifiedZScore.toFixed(2)} exceeds threshold ${this.config.modifiedZScoreThreshold} (median=${stats.median.toFixed(2)}, MAD=${stats.mad.toFixed(2)})`,
          expectedRange: [stats.median - threshold, stats.median + threshold],
        });
      }
    }
    return anomalies;
  }

  /**
   * Detect anomalies using the Interquartile Range (IQR) method.
   * Points outside [Q1 - k*IQR, Q3 + k*IQR] are flagged.
   */
  detectIQRAnomalies(dataPoints: DataPoint[]): Anomaly[] {
    const values = dataPoints.map((dp) => dp.value);
    const stats = this.computeStatistics(values);
    if (stats.iqr === 0) return [];

    const lowerFence = stats.q1 - this.config.iqrMultiplier * stats.iqr;
    const upperFence = stats.q3 + this.config.iqrMultiplier * stats.iqr;

    const anomalies: Anomaly[] = [];
    for (const dp of dataPoints) {
      if (dp.value < lowerFence || dp.value > upperFence) {
        const distance = dp.value < lowerFence ? lowerFence - dp.value : dp.value - upperFence;
        const score = Math.min(distance / (stats.iqr * 2), 1);
        anomalies.push({
          dataPoint: dp,
          method: 'iqr',
          severity: this.classifySeverity(score),
          score,
          reason: `Value ${dp.value.toFixed(2)} is outside IQR fences [${lowerFence.toFixed(2)}, ${upperFence.toFixed(2)}] (Q1=${stats.q1.toFixed(2)}, Q3=${stats.q3.toFixed(2)}, IQR=${stats.iqr.toFixed(2)})`,
          expectedRange: [lowerFence, upperFence],
        });
      }
    }
    return anomalies;
  }

  /**
   * Run all statistical anomaly detection methods and merge results.
   * Deduplicates anomalies on the same data point, keeping the highest severity.
   * Points flagged by multiple methods are tagged as 'combined'.
   */
  detectAllAnomalies(dataPoints: DataPoint[]): AnomalyDetectionResult {
    if (dataPoints.length < this.config.minDataPoints) {
      return {
        anomalies: [],
        totalPoints: dataPoints.length,
        anomalyCount: 0,
        anomalyRate: 0,
        statistics: this.computeStatistics(dataPoints.map((dp) => dp.value)),
        generatedAt: new Date().toISOString(),
      };
    }

    const zScoreAnomalies = this.detectZScoreAnomalies(dataPoints);
    const modifiedZScoreAnomalies = this.detectModifiedZScoreAnomalies(dataPoints);
    const iqrAnomalies = this.detectIQRAnomalies(dataPoints);

    // Tag combined anomalies BEFORE merging (so we can detect multi-method flags)
    const allRaw = [...zScoreAnomalies, ...modifiedZScoreAnomalies, ...iqrAnomalies];
    this.tagCombinedAnomalies(allRaw);

    // Merge and deduplicate (keep highest score per data point index)
    const merged = this.mergeAnomalies(allRaw);

    const values = dataPoints.map((dp) => dp.value);
    return {
      anomalies: merged.sort((a, b) => b.score - a.score),
      totalPoints: dataPoints.length,
      anomalyCount: merged.length,
      anomalyRate: dataPoints.length > 0 ? merged.length / dataPoints.length : 0,
      statistics: this.computeStatistics(values),
      generatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Public API — Trend Analysis
  // -------------------------------------------------------------------------

  /**
   * Perform trend analysis on time-series data.
   * Includes linear regression, moving average, rate of change, and change-point detection.
   */
  analyzeTrend(dataPoints: DataPoint[]): TrendAnalysisResult {
    const values = dataPoints.map((dp) => dp.value);
    const indices = dataPoints.map((dp) => dp.index);

    // Linear regression
    const { slope, intercept, rSquared } = this.linearRegression(indices, values);

    // Moving average
    const ma = this.movingAverage(values, this.config.movingAverageWindow);

    // Rate of change
    const roc = this.rateOfChange(values);

    // Change points (where trend direction reverses)
    const changePoints = this.detectChangePoints(values, this.config.movingAverageWindow);

    // Trend direction
    const direction = this.classifyTrend(slope, rSquared, values);

    // Forecast
    const last = indices[indices.length - 1]!;
    const forecast = this.forecast(slope, intercept, last, values, this.config.forecastPeriods);

    return {
      direction,
      slope,
      intercept,
      rSquared,
      movingAverage: ma,
      rateOfChange: roc,
      changePoints,
      forecast,
    };
  }

  /**
   * Detect trend-break anomalies — points where the value deviates significantly
   * from the expected trend. Uses MAD-based threshold for robustness against outliers.
   */
  detectTrendBreakAnomalies(dataPoints: DataPoint[]): Anomaly[] {
    if (dataPoints.length < this.config.minDataPoints) return [];

    const values = dataPoints.map((dp) => dp.value);
    const indices = dataPoints.map((dp) => dp.index);
    const { slope, intercept } = this.linearRegression(indices, values);

    // Compute residuals
    const residuals = dataPoints.map((dp) => ({
      dp,
      residual: dp.value - (slope * dp.index + intercept),
    }));

    const residualValues = residuals.map((r) => r.residual);
    const residualMedian = median(residualValues);
    const residualMad = mad(residualValues, residualMedian);
    const residualStd = stdDev(residualValues);

    // Use MAD if available (more robust), fall back to stdDev
    const spread = residualMad > 0 ? residualMad : residualStd;
    if (spread === 0) return [];

    const anomalies: Anomaly[] = [];
    const threshold = this.config.modifiedZScoreThreshold;

    for (const { dp, residual } of residuals) {
      // Modified Z-score for residuals
      const score_mad =
        residualMad > 0
          ? Math.abs((0.6745 * (residual - residualMedian)) / residualMad)
          : Math.abs(residual) / residualStd;

      if (score_mad > threshold) {
        const expected = slope * dp.index + intercept;
        const score = Math.min(score_mad / (threshold * 2), 1);
        const ciWidth = (spread * threshold) / 0.6745;
        anomalies.push({
          dataPoint: dp,
          method: 'trend-break',
          severity: this.classifySeverity(score),
          score,
          reason: `Value deviates from trend by ${score_mad.toFixed(2)} MAD units (expected=${expected.toFixed(2)}, actual=${dp.value.toFixed(2)})`,
          expectedRange: [expected - ciWidth, expected + ciWidth],
        });
      }
    }
    return anomalies;
  }

  // -------------------------------------------------------------------------
  // Public API — Seasonal Anomaly Detection
  // -------------------------------------------------------------------------

  /**
   * Detect seasonal anomalies by comparing each point to its seasonal position.
   * Requires `enableSeasonal: true` in config and enough data for at least 2 full periods.
   */
  detectSeasonalAnomalies(dataPoints: DataPoint[]): Anomaly[] {
    if (!this.config.enableSeasonal) return [];
    const period = this.config.seasonalPeriod;
    if (dataPoints.length < period * 2) return [];

    const values = dataPoints.map((dp) => dp.value);

    // Compute seasonal averages and standard deviations for each position in the period
    const seasonalStats: Array<{ mean: number; stdDev: number; count: number }> = [];
    for (let pos = 0; pos < period; pos++) {
      const posValues: number[] = [];
      for (let i = pos; i < values.length; i += period) {
        posValues.push(values[i]!);
      }
      const m = mean(posValues);
      const sd = stdDev(posValues, m);
      seasonalStats.push({ mean: m, stdDev: sd, count: posValues.length });
    }

    const anomalies: Anomaly[] = [];
    for (let i = 0; i < dataPoints.length; i++) {
      const pos = i % period;
      const stats = seasonalStats[pos];
      if (stats!.stdDev === 0 || stats!.count < 2) continue;

      const zScore = Math.abs((dataPoints[i]!.value - stats!.mean) / stats!.stdDev);
      if (zScore > this.config.zScoreThreshold) {
        const score = Math.min(zScore / (this.config.zScoreThreshold * 2), 1);
        anomalies.push({
          dataPoint: dataPoints[i]!,
          method: 'seasonal',
          severity: this.classifySeverity(score),
          score,
          reason: `Seasonal position ${pos}: value ${dataPoints[i]!.value.toFixed(2)} deviates ${zScore.toFixed(2)} standard deviations from seasonal mean ${stats!.mean.toFixed(2)}`,
          expectedRange: [
            stats!.mean - this.config.zScoreThreshold * stats!.stdDev,
            stats!.mean + this.config.zScoreThreshold * stats!.stdDev,
          ],
        });
      }
    }
    return anomalies;
  }

  // -------------------------------------------------------------------------
  // Public API — Combined Analysis
  // -------------------------------------------------------------------------

  /**
   * Run a comprehensive anomaly analysis combining all detection methods:
   * statistical (Z-score, Modified Z-score, IQR), trend breaks, and seasonal.
   */
  runFullAnalysis(dataPoints: DataPoint[]): AnomalyDetectionResult {
    const statisticalResult = this.detectAllAnomalies(dataPoints);
    const trendAnomalies = this.detectTrendBreakAnomalies(dataPoints);
    const seasonalAnomalies = this.detectSeasonalAnomalies(dataPoints);

    const allAnomalies = [...statisticalResult.anomalies, ...trendAnomalies, ...seasonalAnomalies];

    // Tag combined anomalies BEFORE merging
    this.tagCombinedAnomalies(allAnomalies);
    const merged = this.mergeAnomalies(allAnomalies);

    return {
      anomalies: merged.sort((a, b) => b.score - a.score),
      totalPoints: dataPoints.length,
      anomalyCount: merged.length,
      anomalyRate: dataPoints.length > 0 ? merged.length / dataPoints.length : 0,
      statistics: statisticalResult.statistics,
      generatedAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------------------
  // Public API — Helpers
  // -------------------------------------------------------------------------

  /**
   * Convert a plain numeric array into DataPoint[] for convenience.
   */
  static fromValues(values: number[], startIndex: number = 0): DataPoint[] {
    return values.map((value, i) => ({ value, index: startIndex + i }));
  }

  /**
   * Convert a Record<string, number> time-series into DataPoint[].
   */
  static fromTimeSeries(series: Array<{ timestamp: number; value: number }>): DataPoint[] {
    return series.map((s, i) => ({ value: s.value, index: s.timestamp }));
  }

  /**
   * Get the current configuration.
   */
  getConfig(): AnomalyDetectionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (partial merge).
   */
  updateConfig(partial: Partial<AnomalyDetectionConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  // -------------------------------------------------------------------------
  // Private — Linear Regression
  // -------------------------------------------------------------------------

  private linearRegression(
    x: number[],
    y: number[]
  ): { slope: number; intercept: number; rSquared: number } {
    const n = x.length;
    if (n < 2) return { slope: 0, intercept: mean(y), rSquared: 0 };

    const sumX = x.reduce((s, v) => s + v, 0);
    const sumY = y.reduce((s, v) => s + v, 0);
    const sumXY = x.reduce((s, v, i) => s + v * y[i]!, 0);
    const sumX2 = x.reduce((s, v) => s + v * v, 0);
    const sumY2 = y.reduce((s, v) => s + v * v, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const ssRes = y.reduce((s, yi, i) => s + (yi - (slope * x[i]! + intercept)) ** 2, 0);
    const yMean = sumY / n;
    const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, intercept, rSquared };
  }

  // -------------------------------------------------------------------------
  // Private — Moving Average
  // -------------------------------------------------------------------------

  private movingAverage(values: number[], window: number): number[] {
    if (values.length === 0 || window <= 0) return [];
    const w = Math.min(window, values.length);
    const result: number[] = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - w + 1);
      const slice = values.slice(start, i + 1);
      result.push(mean(slice));
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // Private — Rate of Change
  // -------------------------------------------------------------------------

  private rateOfChange(values: number[]): number[] {
    if (values.length < 2) return [];
    const result: number[] = [0]; // First point has no prior
    for (let i = 1; i < values.length; i++) {
      const prev = values[i - 1]!;
      result.push(prev === 0 ? 0 : ((values[i]! - prev) / Math.abs(prev)) * 100);
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // Private — Change-Point Detection
  // -------------------------------------------------------------------------

  private detectChangePoints(values: number[], window: number): number[] {
    if (values.length < window * 2) return [];
    const w = Math.min(window, Math.floor(values.length / 3));
    const changePoints: number[] = [];

    for (let i = w; i < values.length - w; i++) {
      const leftMean = mean(values.slice(i - w, i));
      const rightMean = mean(values.slice(i, i + w));
      const overallStd = stdDev(values);

      if (overallStd === 0) continue;
      const diff = Math.abs(rightMean - leftMean);
      if (diff > overallStd * 1.5) {
        // Avoid clustering nearby change points
        if (changePoints.length === 0 || i - changePoints[changePoints.length - 1]! >= w) {
          changePoints.push(i);
        }
      }
    }
    return changePoints;
  }

  // -------------------------------------------------------------------------
  // Private — Trend Classification
  // -------------------------------------------------------------------------

  private classifyTrend(slope: number, rSquared: number, values: number[]): TrendDirection {
    const overallStd = stdDev(values);
    const meanVal = mean(values);
    if (meanVal === 0 || overallStd === 0) return 'flat';

    const normalizedSlope = Math.abs(slope * values.length) / Math.abs(meanVal);

    // If variance is very high relative to mean, it's volatile
    const cv = overallStd / Math.abs(meanVal); // coefficient of variation
    if (cv > 0.5 && rSquared < 0.3) return 'volatile';

    // If the slope is small relative to the data, it's flat
    if (normalizedSlope < 0.05 || rSquared < 0.1) return 'flat';

    return slope > 0 ? 'upward' : 'downward';
  }

  // -------------------------------------------------------------------------
  // Private — Forecasting
  // -------------------------------------------------------------------------

  private forecast(
    slope: number,
    intercept: number,
    lastIndex: number,
    values: number[],
    periods: number
  ): ForecastPoint[] {
    const residuals = values.map((v, i) => v - (slope * i + intercept));
    const residualStd = stdDev(residuals);

    // Use residualStd if available, otherwise fall back to a small fraction of the value range
    const valueRange = Math.max(...values) - Math.min(...values);
    const effectiveStd =
      residualStd > 0
        ? residualStd
        : valueRange > 0
          ? valueRange * 0.01
          : Math.abs(mean(values)) * 0.01 || 1;

    const result: ForecastPoint[] = [];
    for (let i = 1; i <= periods; i++) {
      const idx = lastIndex + i;
      const predicted = slope * idx + intercept;
      const confidenceWidth = effectiveStd * Math.sqrt(i) * 1.96; // 95% CI widens over time
      result.push({
        index: idx,
        value: predicted,
        lowerBound: predicted - confidenceWidth,
        upperBound: predicted + confidenceWidth,
        confidence: Math.max(0, 1 - i / (periods * 2)),
      });
    }
    return result;
  }

  // -------------------------------------------------------------------------
  // Private — Anomaly Merging
  // ---------------------------------------------------------------------------

  private mergeAnomalies(anomalies: Anomaly[]): Anomaly[] {
    // Group by data point index
    const grouped = new Map<number, Anomaly[]>();
    for (const a of anomalies) {
      const key = a.dataPoint.index;
      const existing = grouped.get(key) || [];
      existing.push(a);
      grouped.set(key, existing);
    }

    // For each group, keep the anomaly with the highest score
    const merged: Anomaly[] = [];
    for (const [, group] of grouped) {
      const best = group.reduce((a, b) => (a.score >= b.score ? a : b));
      merged.push(best);
    }
    return merged;
  }

  private tagCombinedAnomalies(anomalies: Anomaly[]): void {
    // Group by data point index
    const grouped = new Map<number, Anomaly[]>();
    for (const a of anomalies) {
      const key = a.dataPoint.index;
      const existing = grouped.get(key) || [];
      existing.push(a);
      grouped.set(key, existing);
    }

    // If a point was flagged by multiple methods, upgrade the best to 'combined'
    for (const [, group] of grouped) {
      const methods = new Set(group.map((a) => a.method));
      if (methods.size > 1) {
        const best = group.reduce((a, b) => (a.score >= b.score ? a : b));
        best.method = 'combined';
        best.reason = `Flagged by ${methods.size} methods (${[...methods].join(', ')}): ${best.reason}`;
        best.score = Math.min(best.score * 1.2, 1); // Boost combined score slightly
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private — Severity Classification
  // ---------------------------------------------------------------------------

  private classifySeverity(score: number): AnomalySeverity {
    if (score >= 0.85) return 'critical';
    if (score >= 0.65) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }
}
