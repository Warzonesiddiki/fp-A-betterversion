// =============================================================================
// FORMULA FUNCTION REGISTRY — Statistical Functions
// =============================================================================
import type { FormulaFunction } from './helpers';
import {
  flattenNums,
  toNum,
  fact,
  comb,
  normCDF,
  normInv,
  betai,
  gammDist,
  tDistCDF,
  tDistInv,
  safeNum,
} from './helpers';
import { PERCENTILE } from './financial';

// =============================================================================
// STATISTICAL FUNCTIONS
// =============================================================================

export function SUM(...args: unknown[]): number {
  const valid = flattenNums(args).filter((n) => Number.isFinite(n) || !isNaN(n));
  return valid.reduce((s, x) => s + x, 0);
}
export function COUNT(...args: unknown[]): number {
  return flattenNums(args).length;
}
export function AVERAGE(...args: unknown[]): number {
  const valid = flattenNums(args);
  return valid.length === 0 ? 0 : valid.reduce((s, x) => s + x, 0) / valid.length;
}
export function MEDIAN(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length === 0) return 0;
  const s = [...valid].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1]! + s[m]!) / 2 : s[m]!;
}
export function STDEV(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length < 2) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / valid.length;
  return Math.sqrt(valid.reduce((s, x) => s + (x - avg) ** 2, 0) / (valid.length - 1));
}
export function VARIANCE(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length < 2) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / valid.length;
  return valid.reduce((s, x) => s + (x - avg) ** 2, 0) / (valid.length - 1);
}
export function CORREL(x: unknown, y: unknown): number {
  const rawX = Array.isArray(x) ? x : [x as number];
  const rawY = Array.isArray(y) ? y : [y as number];
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(rawX.length, rawY.length); i++) {
    const xv = toNum(rawX[i]!),
      yv = toNum(rawY[i]!);
    if (!isNaN(xv) && !isNaN(yv)) pairs.push([xv, yv]);
  }
  if (pairs.length < 2) return 0;
  const xa = pairs.reduce((s, p) => s + p[0]!, 0) / pairs.length;
  const ya = pairs.reduce((s, p) => s + p[1]!, 0) / pairs.length;
  let sxy = 0,
    sx2 = 0,
    sy2 = 0;
  for (const [px, py] of pairs) {
    const dx = px - xa,
      dy = py - ya;
    sxy += dx * dy;
    sx2 += dx * dx;
    sy2 += dy * dy;
  }
  const d = Math.sqrt(sx2 * sy2);
  return d === 0 ? 0 : sxy / d;
}
export function MIN(...args: unknown[]): number {
  const valid = flattenNums(args);
  return valid.length === 0 ? 0 : Math.min(...valid);
}
export function MAX(...args: unknown[]): number {
  const valid = flattenNums(args);
  return valid.length === 0 ? 0 : Math.max(...valid);
}
export function ABS(v: number): number {
  return Math.abs(v);
}
export function STDEVP(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length < 1) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / valid.length;
  return Math.sqrt(valid.reduce((s, x) => s + (x - avg) ** 2, 0) / valid.length);
}
export function VARP(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length < 1) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / valid.length;
  return valid.reduce((s, x) => s + (x - avg) ** 2, 0) / valid.length;
}
export function COVAR(x: unknown, y: unknown): number {
  const rawX = Array.isArray(x) ? x : [x as number];
  const rawY = Array.isArray(y) ? y : [y as number];
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(rawX.length, rawY.length); i++) {
    const xv = toNum(rawX[i]!),
      yv = toNum(rawY[i]!);
    if (!isNaN(xv) && !isNaN(yv)) pairs.push([xv, yv]);
  }
  if (pairs.length === 0) return 0;
  const xa = pairs.reduce((s, p) => s + p[0]!, 0) / pairs.length;
  const ya = pairs.reduce((s, p) => s + p[1]!, 0) / pairs.length;
  return pairs.reduce((s, [px, py]) => s + (px - xa) * (py - ya), 0) / pairs.length;
}
export function MODE(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length === 0) return 0;
  const freq = new Map<number, number>();
  valid.forEach((x) => freq.set(x, (freq.get(x) || 0) + 1));
  let maxF = 0,
    mode: number = valid[0]!;
  freq.forEach((f, k) => {
    if (f > maxF) {
      maxF = f;
      mode = k;
    }
  });
  return mode;
}
export function PERCENTRANK(v: unknown, x: number): number {
  const valid = flattenNums(Array.isArray(v) ? v : [v]);
  if (valid.length < 2) return 0;
  const sorted = [...valid].sort((a, b) => a - b);
  let count = 0;
  for (const s of sorted) if (s < x) count++;
  return count / (sorted.length - 1);
}
export function QUARTILE(v: unknown, q: number): number {
  return PERCENTILE(v, q * 25);
}
export function FORECAST(x: number, ys: unknown, xs: unknown): number {
  const rawY = Array.isArray(ys) ? ys : [ys as number];
  const rawX = Array.isArray(xs) ? xs : [xs as number];
  const pairs: [number, number][] = [];
  for (let i = 0; i < Math.min(rawY.length, rawX.length); i++) {
    const xv = toNum(rawX[i]!),
      yv = toNum(rawY[i]!);
    if (!isNaN(xv) && !isNaN(yv)) pairs.push([xv, yv]);
  }
  if (pairs.length < 2) return 0;
  const ya = pairs.reduce((s, p) => s + p[1]!, 0) / pairs.length;
  const xa = pairs.reduce((s, p) => s + p[0]!, 0) / pairs.length;
  let sxy = 0,
    sx2 = 0;
  for (const [px, py] of pairs) {
    sxy += (px - xa) * (py - ya);
    sx2 += (px - xa) ** 2;
  }
  return sx2 === 0 ? ya : ya + (sxy / sx2) * (x - xa);
}
function linearRegression(ys: number[], xs: number[]): { slope: number; intercept: number } {
  const n = Math.min(ys.length, xs.length);
  if (n < 2) return { slope: 0, intercept: 0 };
  const xMean = xs.reduce((s, x) => s + x, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;
  let ssxy = 0;
  let ssxx = 0;
  for (let i = 0; i < n; i++) {
    ssxy += (xs![i]! - xMean) * (ys![i]! - yMean);
    ssxx += (xs![i]! - xMean) ** 2;
  }
  if (ssxx === 0) return { slope: 0, intercept: yMean };
  const slope = ssxy / ssxx;
  return { slope, intercept: yMean - slope * xMean };
}

export function SLOPE(ys: unknown, xs: unknown): number {
  const yArr = flattenNums([ys]);
  const xArr = flattenNums([xs]);
  return linearRegression(yArr, xArr).slope;
}

export function INTERCEPT(ys: unknown, xs: unknown): number {
  const yArr = flattenNums([ys]);
  const xArr = flattenNums([xs]);
  return linearRegression(yArr, xArr).intercept;
}

export function SLOPE_FN(ys: unknown, xs: unknown): number {
  return SLOPE(ys, xs);
}
export function INTERCEPT_FN(ys: unknown, xs: unknown): number {
  return INTERCEPT(ys, xs);
}
export function RSQ(ys: number, xs: number): number {
  return CORREL(xs, ys) ** 2;
}
export function PEARSON(x: number, y: number): number {
  return CORREL(x, y);
}
export function GEOMEAN(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length === 0 || valid.some((x) => x <= 0)) return 0;
  return Math.exp(valid.reduce((s, x) => s + Math.log(x), 0) / valid.length);
}
export function HARMEAN(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length === 0 || valid.some((x) => x === 0)) return 0;
  return valid.length / valid.reduce((s, x) => s + 1 / x, 0);
}
export function TRIMMEAN(v: unknown, pct: number): number {
  const valid = flattenNums(Array.isArray(v) ? v : [v]);
  if (valid.length === 0) return 0;
  const sorted = [...valid].sort((a, b) => a - b);
  const trim = Math.floor((valid.length * pct) / 2);
  const trimmed = sorted.slice(trim, sorted.length - trim);
  return trimmed.length === 0 ? 0 : trimmed.reduce((s, x) => s + x, 0) / trimmed.length;
}
export function AVEDEV(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / valid.length;
  return valid.reduce((s, x) => s + Math.abs(x - avg), 0) / valid.length;
}
export function DEVSQ(...args: unknown[]): number {
  const valid = flattenNums(args);
  if (valid.length === 0) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / valid.length;
  return valid.reduce((s, x) => s + (x - avg) ** 2, 0);
}
export function KURT(...args: unknown[]): number {
  const valid = flattenNums(args);
  const n = valid.length;
  if (n < 4) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / n;
  const st = Math.sqrt(valid.reduce((s, x) => s + (x - avg) ** 2, 0) / (n - 1));
  if (st === 0) return 0;
  return (
    ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
      valid.reduce((s, x) => s + ((x - avg) / st) ** 4, 0) -
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3))
  );
}
export function SKEW(...args: unknown[]): number {
  const valid = flattenNums(args);
  const n = valid.length;
  if (n < 3) return 0;
  const avg = valid.reduce((s, x) => s + x, 0) / n;
  const st = Math.sqrt(valid.reduce((s, x) => s + (x - avg) ** 2, 0) / (n - 1));
  if (st === 0) return 0;
  return (n / ((n - 1) * (n - 2))) * valid.reduce((s, x) => s + ((x - avg) / st) ** 3, 0);
}
export function NORMDIST(x: number, mean: number, sd: number, cum: number): number {
  return cum
    ? normCDF((x - mean) / sd)
    : Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
}
export function NORMINV(p: number, mean: number, sd: number): number {
  return mean + sd * normInv(p);
}
export function NORMSDIST(z: number): number {
  return normCDF(z);
}
export function NORMSINV(p: number): number {
  return normInv(p);
}
export function TDIST(t: number, df: number): number {
  return 1 - tDistCDF(t, df);
}
export function TINV(p: number, df: number): number {
  return tDistInv(1 - p / 2, df);
}
export function EXPONDIST(x: number, lambda: number, cum: number): number {
  return cum ? 1 - Math.exp(-lambda * x) : lambda * Math.exp(-lambda * x);
}
export function GAMMADIST(x: number, alpha: number, beta: number, cum: number): number {
  return cum ? betai(alpha, 1, x / beta) : gammDist(x, alpha, beta);
}
export function BETADIST(x: number, a: number, b: number): number {
  return betai(a, b, x);
}
export function WEIBULL(x: number, alpha: number, beta: number, cum: number): number {
  return cum
    ? 1 - Math.exp(-Math.pow(x / beta, alpha))
    : (alpha / beta) * Math.pow(x / beta, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha));
}
export function LOGNORMDIST(x: number, mean: number, sd: number): number {
  return normCDF((Math.log(x) - mean) / sd);
}
export function LOGINV(p: number, mean: number, sd: number): number {
  return Math.exp(mean + sd * normInv(p));
}
export function CHIDIST(x: number, df: number): number {
  return 1 - betai(df / 2, 0.5, df / (df + x));
}
export function CHIINV(p: number, df: number): number {
  let lo = 0,
    hi = 100;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    const val = CHIDIST(m, df);
    if (isNaN(val)) break;
    if (val > p) {
      lo = m;
    } else {
      hi = m;
    }
  }
  return safeNum((lo + hi) / 2);
}
export function FDIST(x: number, df1: number, df2: number): number {
  return 1 - betai(df1 / 2, df2 / 2, (df1 * x) / (df1 * x + df2));
}
export function FINV(p: number, df1: number, df2: number): number {
  let lo = 0,
    hi = 100;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    const val = FDIST(m, df1, df2);
    if (isNaN(val)) break;
    if (val > p) {
      lo = m;
    } else {
      hi = m;
    }
  }
  return safeNum((lo + hi) / 2);
}
export function CONFIDENCE(alpha: number, sd: number, size: number): number {
  return (normInv(1 - alpha / 2) * sd) / Math.sqrt(size);
}
export function FISHER(x: number): number {
  return 0.5 * Math.log((1 + x) / (1 - x));
}
export function FISHERINV(y: number): number {
  const e2y = Math.exp(2 * y);
  return (e2y - 1) / (e2y + 1);
}
export function BINOMDIST(k: number, n: number, p: number, cum: number): number {
  if (cum) {
    let s = 0;
    for (let i = 0; i <= k; i++) s += comb(n, i) * Math.pow(p, i) * Math.pow(1 - p, n - i);
    return s;
  }
  return comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}
export function POISSON(k: number, mean: number, cum: number): number {
  if (cum) {
    let s = 0;
    for (let i = 0; i <= k; i++) s += (Math.exp(-mean) * Math.pow(mean, i)) / fact(i);
    return s;
  }
  return (Math.exp(-mean) * Math.pow(mean, k)) / fact(k);
}

// =============================================================================
// REGISTER ALL STATISTICAL FUNCTIONS
// =============================================================================

export function registerStatisticalFunctions(r: (fn: FormulaFunction) => void): void {
  r({
    name: 'SUM',
    category: 'statistical',
    description: 'Sum of values',
    minArgs: 1,
    maxArgs: -1,
    impl: SUM,
  });
  r({
    name: 'COUNT',
    category: 'statistical',
    description: 'Count of values',
    minArgs: 1,
    maxArgs: -1,
    impl: COUNT,
  });
  r({
    name: 'AVERAGE',
    category: 'statistical',
    description: 'Average of values',
    minArgs: 1,
    maxArgs: -1,
    impl: AVERAGE,
  });
  r({
    name: 'MEDIAN',
    category: 'statistical',
    description: 'Median of values',
    minArgs: 1,
    maxArgs: -1,
    impl: MEDIAN,
  });
  r({
    name: 'MODE',
    category: 'statistical',
    description: 'Mode of values',
    minArgs: 1,
    maxArgs: -1,
    impl: MODE,
  });
  r({
    name: 'STDEV',
    category: 'statistical',
    description: 'Standard deviation (sample)',
    minArgs: 1,
    maxArgs: -1,
    impl: STDEV,
  });
  r({
    name: 'STDEVP',
    category: 'statistical',
    description: 'Standard deviation (population)',
    minArgs: 1,
    maxArgs: -1,
    impl: STDEVP,
  });
  r({
    name: 'VARIANCE',
    category: 'statistical',
    description: 'Variance (sample)',
    minArgs: 1,
    maxArgs: -1,
    impl: VARIANCE,
  });
  r({
    name: 'VARP',
    category: 'statistical',
    description: 'Variance (population)',
    minArgs: 1,
    maxArgs: -1,
    impl: VARP,
  });
  r({
    name: 'CORREL',
    category: 'statistical',
    description: 'Correlation coefficient',
    minArgs: 2,
    maxArgs: 2,
    impl: CORREL,
  });
  r({
    name: 'COVAR',
    category: 'statistical',
    description: 'Covariance',
    minArgs: 2,
    maxArgs: 2,
    impl: COVAR,
  });
  r({
    name: 'PERCENTRANK',
    category: 'statistical',
    description: 'Percent rank of a value',
    minArgs: 2,
    maxArgs: 2,
    impl: PERCENTRANK,
  });
  r({
    name: 'QUARTILE',
    category: 'statistical',
    description: 'Quartile of a dataset',
    minArgs: 2,
    maxArgs: 2,
    impl: QUARTILE,
  });
  r({
    name: 'FORECAST',
    category: 'statistical',
    description: 'Linear forecast',
    minArgs: 3,
    maxArgs: 3,
    impl: FORECAST,
  });
  r({
    name: 'SLOPE',
    category: 'statistical',
    description: 'Slope of linear regression',
    minArgs: 2,
    maxArgs: 2,
    impl: SLOPE_FN,
  });
  r({
    name: 'INTERCEPT',
    category: 'statistical',
    description: 'Y-intercept of linear regression',
    minArgs: 2,
    maxArgs: 2,
    impl: INTERCEPT_FN,
  });
  r({
    name: 'RSQ',
    category: 'statistical',
    description: 'R-squared value',
    minArgs: 2,
    maxArgs: 2,
    impl: RSQ,
  });
  r({
    name: 'PEARSON',
    category: 'statistical',
    description: 'Pearson correlation coefficient',
    minArgs: 2,
    maxArgs: 2,
    impl: PEARSON,
  });
  r({
    name: 'GEOMEAN',
    category: 'statistical',
    description: 'Geometric mean',
    minArgs: 1,
    maxArgs: -1,
    impl: GEOMEAN,
  });
  r({
    name: 'HARMEAN',
    category: 'statistical',
    description: 'Harmonic mean',
    minArgs: 1,
    maxArgs: -1,
    impl: HARMEAN,
  });
  r({
    name: 'TRIMMEAN',
    category: 'statistical',
    description: 'Trimmed mean',
    minArgs: 2,
    maxArgs: 2,
    impl: TRIMMEAN,
  });
  r({
    name: 'AVEDEV',
    category: 'statistical',
    description: 'Average absolute deviation',
    minArgs: 1,
    maxArgs: -1,
    impl: AVEDEV,
  });
  r({
    name: 'DEVSQ',
    category: 'statistical',
    description: 'Sum of squared deviations',
    minArgs: 1,
    maxArgs: -1,
    impl: DEVSQ,
  });
  r({
    name: 'KURT',
    category: 'statistical',
    description: 'Kurtosis',
    minArgs: 1,
    maxArgs: -1,
    impl: KURT,
  });
  r({
    name: 'SKEW',
    category: 'statistical',
    description: 'Skewness',
    minArgs: 1,
    maxArgs: -1,
    impl: SKEW,
  });
  r({
    name: 'NORMDIST',
    category: 'statistical',
    description: 'Normal distribution',
    minArgs: 4,
    maxArgs: 4,
    impl: NORMDIST,
  });
  r({
    name: 'NORMINV',
    category: 'statistical',
    description: 'Inverse normal distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: NORMINV,
  });
  r({
    name: 'NORMSDIST',
    category: 'statistical',
    description: 'Standard normal CDF',
    minArgs: 1,
    maxArgs: 1,
    impl: NORMSDIST,
  });
  r({
    name: 'NORMSINV',
    category: 'statistical',
    description: 'Inverse standard normal',
    minArgs: 1,
    maxArgs: 1,
    impl: NORMSINV,
  });
  r({
    name: 'TDIST',
    category: 'statistical',
    description: 'Student t-distribution',
    minArgs: 2,
    maxArgs: 2,
    impl: TDIST,
  });
  r({
    name: 'TINV',
    category: 'statistical',
    description: 'Inverse t-distribution',
    minArgs: 2,
    maxArgs: 2,
    impl: TINV,
  });
  r({
    name: 'EXPONDIST',
    category: 'statistical',
    description: 'Exponential distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: EXPONDIST,
  });
  r({
    name: 'GAMMADIST',
    category: 'statistical',
    description: 'Gamma distribution',
    minArgs: 4,
    maxArgs: 4,
    impl: GAMMADIST,
  });
  r({
    name: 'BETADIST',
    category: 'statistical',
    description: 'Beta distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: BETADIST,
  });
  r({
    name: 'WEIBULL',
    category: 'statistical',
    description: 'Weibull distribution',
    minArgs: 4,
    maxArgs: 4,
    impl: WEIBULL,
  });
  r({
    name: 'LOGNORMDIST',
    category: 'statistical',
    description: 'Lognormal distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: LOGNORMDIST,
  });
  r({
    name: 'LOGINV',
    category: 'statistical',
    description: 'Inverse lognormal distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: LOGINV,
  });
  r({
    name: 'CHIDIST',
    category: 'statistical',
    description: 'Chi-squared distribution',
    minArgs: 2,
    maxArgs: 2,
    impl: CHIDIST,
  });
  r({
    name: 'CHIINV',
    category: 'statistical',
    description: 'Inverse chi-squared distribution',
    minArgs: 2,
    maxArgs: 2,
    impl: CHIINV,
  });
  r({
    name: 'FDIST',
    category: 'statistical',
    description: 'F-distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: FDIST,
  });
  r({
    name: 'FINV',
    category: 'statistical',
    description: 'Inverse F-distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: FINV,
  });
  r({
    name: 'CONFIDENCE',
    category: 'statistical',
    description: 'Confidence interval',
    minArgs: 3,
    maxArgs: 3,
    impl: CONFIDENCE,
  });
  r({
    name: 'FISHER',
    category: 'statistical',
    description: 'Fisher transformation',
    minArgs: 1,
    maxArgs: 1,
    impl: FISHER,
  });
  r({
    name: 'FISHERINV',
    category: 'statistical',
    description: 'Inverse Fisher transformation',
    minArgs: 1,
    maxArgs: 1,
    impl: FISHERINV,
  });
  r({
    name: 'BINOMDIST',
    category: 'statistical',
    description: 'Binomial distribution',
    minArgs: 4,
    maxArgs: 4,
    impl: BINOMDIST,
  });
  r({
    name: 'POISSON',
    category: 'statistical',
    description: 'Poisson distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: POISSON,
  });
  r({
    name: 'MIN',
    category: 'statistical',
    description: 'Minimum value',
    minArgs: 1,
    maxArgs: -1,
    impl: MIN,
  });
  r({
    name: 'MAX',
    category: 'statistical',
    description: 'Maximum value',
    minArgs: 1,
    maxArgs: -1,
    impl: MAX,
  });
  r({
    name: 'ABS',
    category: 'statistical',
    description: 'Absolute value',
    minArgs: 1,
    maxArgs: 1,
    impl: ABS,
  });
  r({
    name: 'MAXA',
    category: 'statistical',
    description: 'Max including text',
    minArgs: 1,
    maxArgs: -1,
    impl: MAX,
  });
  r({
    name: 'MINA',
    category: 'statistical',
    description: 'Min including text',
    minArgs: 1,
    maxArgs: -1,
    impl: MIN,
  });
  r({
    name: 'AVERAGEA',
    category: 'statistical',
    description: 'Average including text',
    minArgs: 1,
    maxArgs: -1,
    impl: AVERAGE,
  });
  r({
    name: 'COUNTA',
    category: 'statistical',
    description: 'Count non-empty',
    minArgs: 1,
    maxArgs: -1,
    impl: COUNT,
  });
  r({
    name: 'COUNTBLANK',
    category: 'statistical',
    description: 'Count blanks',
    minArgs: 1,
    maxArgs: -1,
    impl: (v: unknown) => {
      const vals = Array.isArray(v) ? v : [v as number];
      return vals.filter((x) => x === 0).length;
    },
  });
  r({
    name: 'VARA',
    category: 'statistical',
    description: 'Variance including text',
    minArgs: 1,
    maxArgs: -1,
    impl: VARIANCE,
  });
  r({
    name: 'VARPA',
    category: 'statistical',
    description: 'Population variance including text',
    minArgs: 1,
    maxArgs: -1,
    impl: VARP,
  });
  r({
    name: 'STDEVA',
    category: 'statistical',
    description: 'Std dev including text',
    minArgs: 1,
    maxArgs: -1,
    impl: STDEV,
  });
  r({
    name: 'STDEVPA',
    category: 'statistical',
    description: 'Population std dev including text',
    minArgs: 1,
    maxArgs: -1,
    impl: STDEVP,
  });
  r({
    name: 'LARGE',
    category: 'statistical',
    description: 'Kth largest value',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: unknown, k: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      return [...vals].sort((a, b) => b - a)[k - 1];
    },
  });
  r({
    name: 'SMALL',
    category: 'statistical',
    description: 'Kth smallest value',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: unknown, k: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      return [...vals].sort((a, b) => a - b)[k - 1];
    },
  });
  r({
    name: 'RANK',
    category: 'statistical',
    description: 'Rank of value',
    minArgs: 2,
    maxArgs: 3,
    impl: (x: number, v: unknown, _order?: number) => {
      const vals = Array.isArray(v) ? v : [v as number];
      const sorted = [...vals].sort((a, b) => b - a);
      return sorted.indexOf(x) + 1;
    },
  });
  r({
    name: 'PERMUTATIONA',
    category: 'statistical',
    description: 'Permutations with repetition',
    minArgs: 2,
    maxArgs: 2,
    impl: (n: number, k: number) => Math.pow(n, k),
  });
  r({
    name: 'MULTINOMIAL',
    category: 'statistical',
    description: 'Multinomial coefficient',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => {
      const sum = args.reduce((s, x) => s + x, 0);
      let result = fact(sum);
      for (const a of args) result /= fact(a);
      return result;
    },
  });
  r({
    name: 'SERIESSUM',
    category: 'statistical',
    description: 'Sum of power series',
    minArgs: 4,
    maxArgs: 4,
    impl: (x: number, n: number, m: number, coeffs: unknown) => {
      const c = Array.isArray(coeffs) ? coeffs : [coeffs as number];
      return c.reduce((s, a, i) => s + a * Math.pow(x, n + m * i), 0);
    },
  });
  r({
    name: 'SUMXMY2',
    category: 'statistical',
    description: 'Sum of (x-y)^2',
    minArgs: 2,
    maxArgs: 2,
    impl: (x: unknown, y: unknown) => {
      const xs = Array.isArray(x) ? x : [x as number];
      const ys = Array.isArray(y) ? y : [y as number];
      return xs.reduce((s, v, i) => s + (v - ys[i]!) ** 2, 0);
    },
  });
  r({
    name: 'SUMX2MY2',
    category: 'statistical',
    description: 'Sum of x^2-y^2',
    minArgs: 2,
    maxArgs: 2,
    impl: (x: unknown, y: unknown) => {
      const xs = Array.isArray(x) ? x : [x as number];
      const ys = Array.isArray(y) ? y : [y as number];
      return xs.reduce((s, v, i) => s + v ** 2 - ys[i] ** 2, 0);
    },
  });
  r({
    name: 'SUMX2PY2',
    category: 'statistical',
    description: 'Sum of x^2+y^2',
    minArgs: 2,
    maxArgs: 2,
    impl: (x: unknown, y: unknown) => {
      const xs = Array.isArray(x) ? x : [x as number];
      const ys = Array.isArray(y) ? y : [y as number];
      return xs.reduce((s, v, i) => s + v ** 2 + ys[i] ** 2, 0);
    },
  });
  r({
    name: 'NEGBINOMDIST',
    category: 'statistical',
    description: 'Negative binomial distribution',
    minArgs: 3,
    maxArgs: 3,
    impl: (k: number, r: number, p: number) =>
      comb(k + r - 1, k) * Math.pow(p, r) * Math.pow(1 - p, k),
  });
  r({
    name: 'CRITBINOM',
    category: 'statistical',
    description: 'Criterion binomial',
    minArgs: 3,
    maxArgs: 3,
    impl: (n: number, p: number, alpha: number) => {
      for (let k = 0; k <= n; k++) {
        if ((BINOMDIST(k, n, p, 1) as number) >= alpha) return k;
      }
      return n;
    },
  });
  r({
    name: 'ZTEST',
    category: 'statistical',
    description: 'Z-test probability',
    minArgs: 2,
    maxArgs: 3,
    impl: (data: unknown, x: number, sigma?: number) => {
      const vals = Array.isArray(data) ? data : [data as number];
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      const sd =
        sigma || Math.sqrt(vals.reduce((s, v) => s + (v - avg) ** 2, 0) / (vals.length - 1));
      const z = (avg - x) / (sd / Math.sqrt(vals.length));
      return 1 - normCDF(z);
    },
  });
  r({
    name: 'FREQUENCY',
    category: 'statistical',
    description: 'Frequency distribution',
    minArgs: 2,
    maxArgs: 2,
    impl: (data: unknown, bins: unknown) => {
      const d = Array.isArray(data) ? data : [data as number];
      const b = Array.isArray(bins) ? bins : [bins as number];
      const result: number[] = new Array(b.length + 1).fill(0);
      for (const v of d) {
        let placed = false;
        for (let i = 0; i < b.length; i++) {
          if (v <= b[i]!) {
            result![i]!++;
            placed = true;
            break;
          }
        }
        if (!placed) result![b.length]!++;
      }
      return result;
    },
  });
  r({
    name: 'LINEST',
    category: 'statistical',
    description: 'Linear regression statistics',
    minArgs: 2,
    maxArgs: 2,
    impl: (ys: unknown, xs: unknown) => {
      const slope = SLOPE(ys, xs);
      const intercept = INTERCEPT(ys, xs);
      return [slope, intercept];
    },
  });
  r({
    name: 'LOGEST',
    category: 'statistical',
    description: 'Exponential regression statistics',
    minArgs: 2,
    maxArgs: 2,
    impl: (ys: unknown, xs: unknown) => {
      const slope = SLOPE(ys, xs);
      const intercept = INTERCEPT(ys, xs);
      return [Math.exp(slope), Math.exp(intercept)];
    },
  });
  r({
    name: 'GROWTH_FN',
    category: 'statistical',
    description: 'Exponential growth prediction',
    minArgs: 2,
    maxArgs: 2,
    impl: (ys: unknown, xs: unknown) => {
      const logYs = (Array.isArray(ys) ? ys : [ys as number]).map((y: number) => Math.log(y));
      const slope = SLOPE(logYs, xs);
      const intercept = INTERCEPT(logYs, xs);
      return Math.exp(intercept + slope * (Array.isArray(xs) ? xs[xs.length - 1] : (xs as number)));
    },
  });
  r({
    name: 'TREND_FN',
    category: 'statistical',
    description: 'Linear trend prediction',
    minArgs: 2,
    maxArgs: 2,
    impl: (ys: unknown, xs: unknown) => {
      const slope = SLOPE(ys, xs);
      const intercept = INTERCEPT(ys, xs);
      return intercept + slope * (Array.isArray(xs) ? xs[xs.length - 1] : (xs as number));
    },
  });
  r({
    name: 'DSTDEV',
    category: 'statistical',
    description: 'Database std dev (sample) with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      const matched: number[] = [];
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) matched.push(d[i]!);
      if (matched.length < 2) return 0;
      const avg = matched.reduce((s, x) => s + x, 0) / matched.length;
      return Math.sqrt(matched.reduce((s, x) => s + (x - avg) ** 2, 0) / (matched.length - 1));
    },
  });
  r({
    name: 'DSTDEVP',
    category: 'statistical',
    description: 'Database std dev (population) with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      const matched: number[] = [];
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) matched.push(d[i]!);
      if (matched.length < 1) return 0;
      const avg = matched.reduce((s, x) => s + x, 0) / matched.length;
      return Math.sqrt(matched.reduce((s, x) => s + (x - avg) ** 2, 0) / matched.length);
    },
  });
  r({
    name: 'DVAR',
    category: 'statistical',
    description: 'Database variance (sample) with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      const matched: number[] = [];
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) matched.push(d[i]!);
      if (matched.length < 2) return 0;
      const avg = matched.reduce((s, x) => s + x, 0) / matched.length;
      return matched.reduce((s, x) => s + (x - avg) ** 2, 0) / (matched.length - 1);
    },
  });
  r({
    name: 'DVARP',
    category: 'statistical',
    description: 'Database variance (population) with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      const matched: number[] = [];
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) matched.push(d[i]!);
      if (matched.length < 1) return 0;
      const avg = matched.reduce((s, x) => s + x, 0) / matched.length;
      return matched.reduce((s, x) => s + (x - avg) ** 2, 0) / matched.length;
    },
  });
  r({
    name: 'CUBEVALUE',
    category: 'statistical',
    description: 'Cube value (returns first arg)',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => args[0] ?? 0,
  });
  r({
    name: 'CUBEMEMBER',
    category: 'statistical',
    description: 'Cube member (returns first arg)',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => args[0] ?? 0,
  });
  r({
    name: 'CUBESET',
    category: 'statistical',
    description: 'Cube set (returns first arg)',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => args[0] ?? 0,
  });
  r({
    name: 'CUBERANKEDMEMBER',
    category: 'statistical',
    description: 'Cube ranked member (returns first arg)',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => args[0] ?? 0,
  });
  r({
    name: 'CUBESETCOUNT',
    category: 'statistical',
    description: 'Cube set count (returns first arg)',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => v,
  });
  r({
    name: 'CUBEMEMBERPROPERTY',
    category: 'statistical',
    description: 'Cube member property (returns first arg)',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => args[0] ?? 0,
  });
}
