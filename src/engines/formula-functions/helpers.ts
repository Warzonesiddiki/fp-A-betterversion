// =============================================================================
// FORMULA FUNCTION REGISTRY — Shared Types & Helpers
// =============================================================================

export type FunctionCategory =
  | 'financial'
  | 'growth'
  | 'allocation'
  | 'currency'
  | 'statistical'
  | 'logical'
  | 'lookup'
  | 'math'
  | 'text'
  | 'date'
  | 'information'
  | 'engineering'
  | 'array'
  | 'database'
  | 'cube';

export interface FormulaFunction {
  name: string;
  category: FunctionCategory;
  description: string;
  minArgs: number;
  maxArgs: number; // -1 = variadic
  impl: (...args: any[]) => number | number[];
}

// =============================================================================
// NUMERIC HELPERS
// =============================================================================

/** Coerce a value to a number. Strings are parsed; non-numeric values return NaN. */
export const toNum = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isNaN(n) ? NaN : n;
  }
  return NaN;
};

/** Flatten nested arrays and filter to valid numbers (skip NaN, null, undefined). */
export const flattenNums = (args: unknown[]): number[] => {
  const flat = args.flat(Infinity);
  return flat.map((v) => toNum(v)).filter((n) => !isNaN(n));
};

export const safeNum = (v: number): number => {
  return v; // NaN propagates naturally -- callers must handle it
};

// =============================================================================
// MATH HELPERS
// =============================================================================

export const fact = (n: number): number => {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};
export const comb = (n: number, k: number): number =>
  k > n ? 0 : fact(n) / (fact(k) * fact(n - k));
export const perm = (n: number, k: number): number => (k > n ? 0 : fact(n) / fact(n - k));

// =============================================================================
// STATISTICAL DISTRIBUTION HELPERS
// =============================================================================

export const gammln = (x: number): number => {
  const c = [
    76.1800917294714, -86.5053203294167, 24.0140982408309, -1.23173957245015, 0.120865097386617e-2,
    -0.539523938495e-5,
  ];
  let y = x,
    tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.506628274631 * ser) / x);
};

export const betacf = (a: number, b: number, x: number): number => {
  const maxIter = 100,
    eps = 3e-12;
  const qab = a + b,
    qap = a + 1,
    qam = a - 1;
  let c = 1,
    d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= maxIter; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < eps) break;
  }
  return h;
};

export const betai = (a: number, b: number, x: number): number => {
  if (x < 0 || x > 1) return 0;
  if (x === 0 || x === 1) return x;
  const bt = Math.exp(
    gammln(a + b) - gammln(a) - gammln(b) + a * Math.log(x) + b * Math.log(1 - x)
  );
  return x < (a + 1) / (a + b + 2)
    ? (bt * betacf(a, b, x)) / a
    : 1 - (bt * betacf(b, a, 1 - x)) / b;
};

export const gammDist = (x: number, alpha: number, beta: number): number => {
  if (x <= 0) return 0;
  return Math.exp((alpha - 1) * Math.log(x) - x / beta - gammln(alpha) - alpha * Math.log(beta));
};

export const normCDF = (x: number): number => {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
};

export const normInv = (p: number): number => {
  if (p <= 0 || p >= 1) return 0;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425,
    pHigh = 1 - pLow;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return (
    -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
};

export const tDistCDF = (t: number, df: number): number => {
  const x = df / (df + t * t);
  return 1 - 0.5 * betai(df / 2, 0.5, x);
};

export const tDistInv = (p: number, df: number): number => {
  // Approximation using normInv for large df, bisection for small
  if (df > 30) return normInv(p);
  let lo = -10,
    hi = 10;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (tDistCDF(mid, df) < p) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
};
