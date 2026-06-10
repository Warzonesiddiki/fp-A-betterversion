export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length);
}

export function variance(values: number[]): number {
  return standardDeviation(values) ** 2;
}

export function min(values: number[]): number {
  if (values.length === 0) return NaN;
  return Math.min(...values);
}

export function max(values: number[]): number {
  if (values.length === 0) return NaN;
  return Math.max(...values);
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const weight = index - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

export function calcMAPE(actual: number[], predicted: number[]): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual![i]! - predicted![i]!) / actual![i]!);
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

export function calcRMSE(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += (actual![i]! - predicted![i]!) ** 2;
  }
  return Math.sqrt(sum / actual.length);
}

export function calcMAE(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < actual.length; i++) {
    sum += Math.abs(actual![i]! - predicted![i]!);
  }
  return sum / actual.length;
}

export function calcR2(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0;
  const m = mean(actual);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < actual.length; i++) {
    ssRes += (actual![i]! - predicted![i]!) ** 2;
    ssTot += (actual![i]! - m) ** 2;
  }
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

export function buildConfidenceIntervals(
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

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number, decimals: number = 2): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
