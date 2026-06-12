/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ForecastResult {
  forecast: number[];
  fitted: number[];
  confidenceLower: number[];
  confidenceUpper: number[];
  metrics: AccuracyMetrics;
}

export interface AccuracyMetrics {
  mape: number;
  rmse: number;
  mae: number;
  r2: number;
}

export interface MovingAverageOptions {
  type: 'simple' | 'weighted' | 'exponential';
  window: number;
  weights?: number[];
  alpha?: number;
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  predict: (x: number) => number;
  forecast: number[];
  residuals: number[];
  metrics: AccuracyMetrics;
}

export interface SeasonalDecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  deseasonalized: number[];
  seasonalIndices: number[];
  metrics: AccuracyMetrics;
}

export interface HoltWintersResult extends ForecastResult {
  level: number[];
  trend: number[];
  seasonal: number[];
  alpha: number;
  beta: number;
  gamma: number;
}

// ─── Internal helpers ───────────────────────────────────────────────────────────

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function standardDeviation(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length);
}

function calcMAPE(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i]! - predicted[i]!) / actual[i]!);
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

function calcRMSE(actual: number[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += (actual[i]! - predicted[i]!) ** 2;
  }
  return Math.sqrt(sum / actual.length);
}

function calcMAE(actual: number[], predicted: number[]): number {
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.abs(actual[i]! - predicted[i]!);
  }
  return sum / actual.length;
}

function calcR2(actual: number[], predicted: number[]): number {
  const m = mean(actual);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < actual.length; i++) {
    ssRes += (actual[i]! - predicted[i]!) ** 2;
    ssTot += (actual[i]! - m) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

function buildMetrics(actual: number[], predicted: number[]): AccuracyMetrics {
  return {
    mape: calcMAPE(actual, predicted),
    rmse: calcRMSE(actual, predicted),
    mae: calcMAE(actual, predicted),
    r2: calcR2(actual, predicted),
  };
}

function buildConfidenceIntervals(
  residuals: number[],
  forecastLength: number,
  multiplier = 1.96
): { lower: number[]; upper: number[] } {
  const sigma = standardDeviation(residuals);
  const lower: number[] = [];
  const upper: number[] = [];
  for (let i = 0; i < forecastLength; i++) {
    const widen = sigma * multiplier * Math.sqrt(1 + i * 0.1);
    lower.push(-widen);
    upper.push(widen);
  }
  return { lower, upper };
}

// ─── Main engine ────────────────────────────────────────────────────────────────

export class ForecastMethodEngine {
  static simpleMovingAverage(data: number[], window: number): ForecastResult {
    if (window < 1 || window > data.length) {
      throw new Error(`Window ${window} must be between 1 and data length ${data.length}`);
    }

    const fitted: number[] = new Array(data.length).fill(NaN);
    for (let i = window - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = i - window + 1; j <= i; j++) {
        sum += data[j]!;
      }
      fitted[i] = sum / window;
    }

    const forecast: number[] = [];
    const lastWindow = data.slice(-window);
    const lastAvg = mean(lastWindow);
    forecast.push(lastAvg);

    const validFitted = fitted.filter((v) => !isNaN(v));
    const correspondingActual = data.slice(window - 1);
    const residuals = correspondingActual.map((v, i) => v - validFitted[i]!);
    const ci = buildConfidenceIntervals(residuals, forecast.length);

    return {
      forecast,
      fitted,
      confidenceLower: ci.lower,
      confidenceUpper: ci.upper,
      metrics: buildMetrics(correspondingActual, validFitted),
    };
  }

  static weightedMovingAverage(data: number[], weights: number[]): ForecastResult {
    const window = weights.length;
    if (window < 1 || window > data.length) {
      throw new Error(`Weights length ${window} must be between 1 and data length ${data.length}`);
    }

    const weightSum = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map((w) => w / weightSum);

    const fitted: number[] = new Array(data.length).fill(NaN);
    for (let i = window - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < window; j++) {
        sum += data[i - window + 1 + j]! * normalizedWeights[j]!;
      }
      fitted[i] = sum;
    }

    const forecast: number[] = [];
    const lastWindow = data.slice(-window);
    let fSum = 0;
    for (let j = 0; j < window; j++) {
      fSum += lastWindow[j]! * normalizedWeights[j]!;
    }
    forecast.push(fSum);

    const validFitted = fitted.filter((v) => !isNaN(v));
    const correspondingActual = data.slice(window - 1);
    const residuals = correspondingActual.map((v, i) => v - validFitted[i]!);
    const ci = buildConfidenceIntervals(residuals, forecast.length);

    return {
      forecast,
      fitted,
      confidenceLower: ci.lower,
      confidenceUpper: ci.upper,
      metrics: buildMetrics(correspondingActual, validFitted),
    };
  }

  static exponentialSmoothing(data: number[], alpha: number): ForecastResult {
    if (alpha <= 0 || alpha > 1) {
      throw new Error(`Alpha must be between 0 (exclusive) and 1, got ${alpha}`);
    }
    if (data.length < 2) {
      throw new Error('Need at least 2 data points');
    }

    const fitted: number[] = [data[0]!];
    for (let i = 1; i < data.length; i++) {
      fitted.push(alpha * data[i]! + (1 - alpha) * fitted[i - 1]!);
    }

    const lastFitted = fitted[fitted.length - 1]!;
    const forecast = [lastFitted];

    const residuals = data.slice(1).map((v, i) => v - fitted[i]!);
    const ci = buildConfidenceIntervals(residuals, forecast.length);

    return {
      forecast,
      fitted,
      confidenceLower: ci.lower,
      confidenceUpper: ci.upper,
      metrics: buildMetrics(data.slice(1), fitted.slice(1)),
    };
  }

  static movingAverage(data: number[], options: MovingAverageOptions): ForecastResult {
    switch (options.type) {
      case 'simple':
        return this.simpleMovingAverage(data, options.window);
      case 'weighted': {
        const weights = options.weights ?? Array.from({ length: options.window }, (_, i) => i + 1);
        return this.weightedMovingAverage(data, weights);
      }
      case 'exponential': {
        const alpha = options.alpha ?? 2 / (options.window + 1);
        return this.exponentialSmoothing(data, alpha);
      }
      default:
        throw new Error(`Unknown moving average type: ${options.type}`);
    }
  }

  static linearRegression(data: number[], periodsToForecast = 1): LinearRegressionResult {
    if (data.length < 2) {
      throw new Error('Need at least 2 data points for linear regression');
    }

    const n = data.length;
    const xMean = (n - 1) / 2;
    const yMean = mean(data);

    let ssXY = 0;
    let ssXX = 0;
    for (let i = 0; i < n; i++) {
      ssXY += (i - xMean) * (data[i]! - yMean);
      ssXX += (i - xMean) ** 2;
    }

    const slope = ssXX === 0 ? 0 : ssXY / ssXX;
    const intercept = yMean - slope * xMean;

    const predict = (x: number) => intercept + slope * x;

    const fitted = Array.from({ length: n }, (_, i) => predict(i));
    const forecast = Array.from({ length: periodsToForecast }, (_, i) => predict(n + i));
    const residuals = data.map((v, i) => v - fitted[i]!);

    const metrics = buildMetrics(data, fitted);

    const ci = buildConfidenceIntervals(residuals, periodsToForecast);

    return {
      slope,
      intercept,
      r2: metrics.r2,
      predict,
      forecast,
      residuals,
      metrics,
    };
  }

  static seasonalDecomposition(
    data: number[],
    period: number,
    mode: 'additive' | 'multiplicative' = 'additive'
  ): SeasonalDecompositionResult {
    if (period < 2 || period > Math.floor(data.length / 2)) {
      throw new Error(
        `Period ${period} must be between 2 and half data length ${Math.floor(data.length / 2)}`
      );
    }

    const n = data.length;

    // Step 1: Compute trend via centered moving average
    const trend: number[] = new Array(n).fill(NaN);
    const halfP = Math.floor(period / 2);

    for (let i = halfP; i < n - halfP; i++) {
      let sum = 0;
      for (let j = i - halfP; j <= i + halfP; j++) {
        sum += data[j]!;
      }
      trend[i] = sum / period;
    }

    // Fill edges by extending nearest valid trend value
    for (let i = 0; i < halfP; i++) {
      trend[i] = trend[halfP]!;
    }
    for (let i = n - halfP; i < n; i++) {
      trend[i] = trend[n - halfP - 1]!;
    }

    // Step 2: Detrend to get seasonal component
    const detrended: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mode === 'additive') {
        detrended.push(data[i]! - trend[i]!);
      } else {
        detrended.push(trend[i] !== 0 ? data[i]! / trend[i]! : 1);
      }
    }

    // Step 3: Average seasonal indices per position in cycle
    const seasonalIndices: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);

    for (let i = 0; i < n; i++) {
      seasonalIndices[i % period]! += detrended[i]!;
      counts[i % period]!++;
    }

    for (let i = 0; i < period; i++) {
      seasonalIndices[i]! /= counts[i]!;
    }

    // Normalize: additive should sum to 0, multiplicative should multiply to 1
    if (mode === 'additive') {
      const sMean = mean(seasonalIndices);
      for (let i = 0; i < period; i++) {
        seasonalIndices[i]! -= sMean;
      }
    } else {
      const sMean = mean(seasonalIndices);
      if (sMean !== 0) {
        for (let i = 0; i < period; i++) {
          seasonalIndices[i]! /= sMean;
        }
      }
    }

    // Step 4: Build full seasonal array
    const seasonal: number[] = Array.from({ length: n }, (_, i) => seasonalIndices[i % period]!);

    // Step 5: Compute residual
    const residual: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mode === 'additive') {
        residual.push(data[i]! - trend[i]! - seasonal[i]!);
      } else {
        const denom = trend[i]! * seasonal[i]!;
        residual.push(denom !== 0 ? data[i]! / denom : 0);
      }
    }

    // Deseasonalized
    const deseasonalized: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mode === 'additive') {
        deseasonalized.push(data[i]! - seasonal[i]!);
      } else {
        deseasonalized.push(seasonal[i] !== 0 ? data[i]! / seasonal[i]! : data[i]!);
      }
    }

    // Reconstruct for metrics
    const reconstructed: number[] = [];
    for (let i = 0; i < n; i++) {
      if (mode === 'additive') {
        reconstructed.push(trend[i]! + seasonal[i]!);
      } else {
        reconstructed.push(trend[i]! * seasonal[i]!);
      }
    }

    return {
      trend,
      seasonal,
      residual,
      deseasonalized,
      seasonalIndices,
      metrics: buildMetrics(data, reconstructed),
    };
  }

  static holtWinters(
    data: number[],
    alpha: number,
    beta: number,
    gamma: number,
    period: number,
    periodsToForecast = 1,
    mode: 'additive' | 'multiplicative' = 'additive'
  ): HoltWintersResult {
    if (data.length < period * 2) {
      throw new Error(
        `Need at least ${period * 2} data points (2 full seasons), got ${data.length}`
      );
    }
    if (alpha < 0 || alpha > 1) throw new Error(`Alpha must be 0..1, got ${alpha}`);
    if (beta < 0 || beta > 1) throw new Error(`Beta must be 0..1, got ${beta}`);
    if (gamma < 0 || gamma > 1) throw new Error(`Gamma must be 0..1, got ${gamma}`);

    const n = data.length;

    // Initialize level as mean of first season
    let levelInit = 0;
    for (let i = 0; i < period; i++) {
      levelInit += data[i]!;
    }
    levelInit /= period;

    // Initialize trend as average slope across first two seasons
    let trendInit = 0;
    for (let i = 0; i < period; i++) {
      if (mode === 'additive') {
        trendInit += data[period + i]! - data[i]!;
      } else {
        trendInit += data[i] !== 0 ? data[period + i]! / data[i]! : 1;
      }
    }
    trendInit /= period;
    if (mode === 'multiplicative') {
      trendInit = trendInit / period;
    }

    // Initialize seasonal indices
    const seasonalInit: number[] = new Array(period);
    for (let i = 0; i < period; i++) {
      if (mode === 'additive') {
        seasonalInit[i] = data[i]! - levelInit;
      } else {
        seasonalInit[i] = levelInit !== 0 ? data[i]! / levelInit : 1;
      }
    }

    // Arrays for level, trend, seasonal
    const level: number[] = [levelInit];
    const trend: number[] = [trendInit];
    const seasonal: number[] = [...seasonalInit];

    const fitted: number[] = new Array(n).fill(NaN);

    // First season: use initial values
    for (let i = 0; i < period; i++) {
      if (mode === 'additive') {
        fitted[i] = levelInit + trendInit * 0 + seasonalInit[i]!;
      } else {
        fitted[i] = levelInit * trendInit ** 0 * seasonalInit[i]!;
      }
    }

    // Run HW from period onwards
    for (let i = period; i < n; i++) {
      const prevLevel = level[level.length - 1]!;
      const prevTrend = trend[trend.length - 1]!;
      const seasonIdx = i % period;
      const prevSeason = seasonal[((i - period) % period) + (i - period >= 0 ? 0 : period)];

      let newLevel: number;
      let newTrend: number;
      let newSeason: number;
      let forecastVal: number;

      if (mode === 'additive') {
        forecastVal = prevLevel + prevTrend + seasonalInit[seasonIdx]!;
        newLevel =
          alpha * (data[i]! - seasonal[seasonIdx]!) + (1 - alpha) * (prevLevel + prevTrend);
        newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;
        newSeason = gamma * (data[i]! - newLevel) + (1 - gamma) * seasonal[seasonIdx]!;
      } else {
        forecastVal = prevLevel * prevTrend * seasonal[seasonIdx]!;
        newLevel =
          alpha * (seasonal[seasonIdx] !== 0 ? data[i]! / seasonal[seasonIdx]! : data[i]!) +
          (1 - alpha) * (prevLevel * prevTrend);
        newTrend = beta * (prevLevel !== 0 ? newLevel / prevLevel : 1) + (1 - beta) * prevTrend;
        newSeason =
          gamma * (newLevel !== 0 ? data[i]! / newLevel : 1) + (1 - gamma) * seasonal[seasonIdx]!;
      }

      level.push(newLevel);
      trend.push(newTrend);
      seasonal[seasonIdx] = newSeason;
      fitted[i] = forecastVal;
    }

    // Generate forecasts
    const lastLevel = level[level.length - 1]!;
    const lastTrend = trend[trend.length - 1]!;
    const forecast: number[] = [];

    for (let h = 1; h <= periodsToForecast; h++) {
      const seasonIdx = (n + h - 1) % period;
      if (mode === 'additive') {
        forecast.push(lastLevel + lastTrend * h + seasonal[seasonIdx]!);
      } else {
        forecast.push(lastLevel * lastTrend ** h * seasonal[seasonIdx]!);
      }
    }

    // Accuracy
    const validFitted = fitted.filter((_, i) => i >= period);
    const correspondingActual = data.slice(period);
    const residuals = correspondingActual.map((v, i) => v - validFitted[i]!);
    const ci = buildConfidenceIntervals(residuals, periodsToForecast);

    return {
      forecast,
      fitted,
      confidenceLower: ci.lower,
      confidenceUpper: ci.upper,
      metrics: buildMetrics(correspondingActual, validFitted),
      level,
      trend,
      seasonal,
      alpha,
      beta,
      gamma,
    };
  }

  static ensembleForecast(data: number[], periodsToForecast = 1, period = 4): ForecastResult {
    if (data.length < period * 2) {
      throw new Error(`Need at least ${period * 2} data points for ensemble, got ${data.length}`);
    }

    const splitIdx = Math.max(Math.floor(data.length * 0.8), period * 2);
    const train = data.slice(0, splitIdx);
    const test = data.slice(splitIdx);

    // Define candidate methods
    type CandidateMethod = {
      name: string;
      forecast: (train: number[], horizon: number) => number[];
      fitted: (train: number[], full: number[]) => number[];
    };

    const candidates: CandidateMethod[] = [
      {
        name: 'LinearRegression',
        forecast: (t, h) => {
          const lr = ForecastMethodEngine.linearRegression(t, h);
          return lr.forecast;
        },
        fitted: (t, full) => {
          const lr = ForecastMethodEngine.linearRegression(full, 0);
          return lr.forecast.length > 0 ? lr.forecast : full.map((_, i) => lr.predict(i));
        },
      },
      {
        name: 'SimpleMA',
        forecast: (t) => {
          const win = Math.min(Math.floor(t.length / 3), 12);
          return ForecastMethodEngine.simpleMovingAverage(t, Math.max(win, 2)).forecast;
        },
        fitted: (t) => {
          const win = Math.min(Math.floor(t.length / 3), 12);
          return ForecastMethodEngine.simpleMovingAverage(t, Math.max(win, 2)).fitted;
        },
      },
      {
        name: 'ExponentialSmoothing',
        forecast: (t) => ForecastMethodEngine.exponentialSmoothing(t, 0.3).forecast,
        fitted: (t) => ForecastMethodEngine.exponentialSmoothing(t, 0.3).fitted,
      },
      {
        name: 'HoltWinters',
        forecast: (t, h) => {
          try {
            return ForecastMethodEngine.holtWinters(t, 0.3, 0.1, 0.1, period, h).forecast;
          } catch {
            return ForecastMethodEngine.exponentialSmoothing(t, 0.3).forecast;
          }
        },
        fitted: (t) => {
          try {
            return ForecastMethodEngine.holtWinters(t, 0.3, 0.1, 0.1, period, 0).fitted;
          } catch {
            return ForecastMethodEngine.exponentialSmoothing(t, 0.3).fitted;
          }
        },
      },
      {
        name: 'WeightedMA',
        forecast: (t) => {
          const win = Math.min(Math.floor(t.length / 3), 8);
          const w = Array.from({ length: Math.max(win, 2) }, (_, i) => i + 1);
          return ForecastMethodEngine.weightedMovingAverage(t, w).forecast;
        },
        fitted: (t) => {
          const win = Math.min(Math.floor(t.length / 3), 8);
          const w = Array.from({ length: Math.max(win, 2) }, (_, i) => i + 1);
          return ForecastMethodEngine.weightedMovingAverage(t, w).fitted;
        },
      },
    ];

    // Back-test each method on the held-out portion
    const scores: { idx: number; rmse: number }[] = [];

    for (let idx = 0; idx < candidates.length; idx++) {
      const method = candidates[idx];
      try {
        const testForecast = method!.forecast(train, test.length);
        const rmse = calcRMSE(test, testForecast.slice(0, test.length));
        if (isFinite(rmse)) {
          scores.push({ idx, rmse });
        }
      } catch {
        // Method failed — skip
      }
    }

    if (scores.length === 0) {
      throw new Error('All candidate methods failed during back-testing');
    }

    // Sort by RMSE ascending, pick top 3
    scores.sort((a, b) => a.rmse - b.rmse);
    const top = scores.slice(0, 3);

    // Compute inverse-RMSE weights
    const invRmses = top.map((s) => 1 / (s.rmse + 1e-10));
    const weightSum = invRmses.reduce((a, b) => a + b, 0);
    const weights = invRmses.map((w) => w / weightSum);

    // Generate full-data forecasts from top methods and combine
    const forecasts: number[][] = [];
    const fittedArrays: number[][] = [];

    for (const { idx } of top) {
      const method = candidates[idx];
      forecasts.push(method!.forecast(data, periodsToForecast));
      fittedArrays.push(method!.fitted(data, data));
    }

    // Weighted ensemble
    const forecast: number[] = [];
    for (let h = 0; h < periodsToForecast; h++) {
      let sum = 0;
      for (let m = 0; m < top.length; m++) {
        const f = forecasts[m]!;
        sum += (f[h] ?? f[f.length - 1]!) * weights[m]!;
      }
      forecast.push(sum);
    }

    const fitted: number[] = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let validCount = 0;
      for (let m = 0; m < top.length; m++) {
        const val = fittedArrays[m]![i];
        if (val !== undefined && isFinite(val)) {
          sum += val * weights[m]!;
          validCount++;
        }
      }
      fitted.push(
        validCount > 0
          ? sum /
              weights.slice(0, top.length).reduce((a, _, j) => {
                const val = fittedArrays[j]![i];
                return val !== undefined && isFinite(val) ? a + weights[j]! : a;
              }, 0)
          : NaN
      );
    }

    // Compute residuals on valid fitted values
    const validPairs: { actual: number; predicted: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      if (isFinite(fitted[i]!)) {
        validPairs.push({ actual: data[i]!, predicted: fitted[i]! });
      }
    }

    const residuals = validPairs.map((p) => p.actual - p.predicted);
    const ci = buildConfidenceIntervals(residuals, periodsToForecast);

    const actualArr = validPairs.map((p) => p.actual);
    const predictedArr = validPairs.map((p) => p.predicted);

    return {
      forecast,
      fitted,
      confidenceLower: ci.lower,
      confidenceUpper: ci.upper,
      metrics: buildMetrics(actualArr, predictedArr),
    };
  }

  static autoSelectBestMethod(
    data: number[],
    period = 4
  ): {
    methodName: string;
    result: ForecastResult;
  } {
    const methods: { name: string; run: () => ForecastResult }[] = [
      {
        name: 'LinearRegression',
        run: (): ForecastResult => {
          const lr = ForecastMethodEngine.linearRegression(data, 1);
          const ci = buildConfidenceIntervals(lr.residuals, lr.forecast.length);
          return {
            forecast: lr.forecast,
            fitted: Array.from({ length: data.length }, (_, i) => lr.predict(i)),
            confidenceLower: ci.lower,
            confidenceUpper: ci.upper,
            metrics: lr.metrics,
          };
        },
      },
      {
        name: 'ExponentialSmoothing',
        run: () => ForecastMethodEngine.exponentialSmoothing(data, 0.3),
      },
      {
        name: 'SimpleMovingAverage',
        run: () =>
          ForecastMethodEngine.simpleMovingAverage(
            data,
            Math.min(Math.max(Math.floor(data.length / 4), 2), 12)
          ),
      },
    ];

    if (data.length >= period * 2) {
      methods.push({
        name: 'HoltWinters',
        run: () => ForecastMethodEngine.holtWinters(data, 0.3, 0.1, 0.1, period),
      });
    }

    let best = { name: '', rmse: Infinity, result: null as unknown as ForecastResult };

    for (const method of methods) {
      try {
        const result = method.run();
        if (result.metrics.rmse < best.rmse) {
          best = { name: method.name, rmse: result.metrics.rmse, result };
        }
      } catch {
        // Skip failed methods
      }
    }

    if (!best.result) {
      throw new Error('All forecasting methods failed');
    }

    return { methodName: best.name, result: best.result };
  }
}
