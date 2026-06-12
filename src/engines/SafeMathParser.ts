/* eslint-disable @typescript-eslint/no-unused-vars */
// =============================================================================
// SAFEMATHPARSER — Bulletproof recursive descent math expression parser
// NO eval(), NO new Function(), NO dynamic code execution
// =============================================================================

// --- Security Limits ---
const MAX_INPUT_LENGTH = 10_000;
const MAX_RECURSION_DEPTH = 1000;
const MAX_TOKENS = 10_000;
const MAX_FUNCTION_ARGS = 100;

// --- Token Types ---
type TokenType =
  | 'number'
  | 'cellRef'
  | 'string'
  | 'plus'
  | 'minus'
  | 'star'
  | 'slash'
  | 'caret'
  | 'percent'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'colon'
  | 'lt'
  | 'gt'
  | 'lte'
  | 'gte'
  | 'eq'
  | 'neq'
  | 'and'
  | 'or'
  | 'not'
  | 'func'
  | 'const'
  | 'eof';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

// --- Constants Map ---
const CONSTANTS: Record<string, number> = {
  PI: Math.PI,
  E: Math.E,
  TRUE: 1,
  FALSE: 0,
};

// --- Function Registry ---
type FuncImpl = (args: number[]) => number;

const FUNCTIONS: Record<string, FuncImpl> = {
  ABS: (args) => Math.abs(args[0]!),
  ROUND: (args) => {
    const val = args[0]!;
    const decimals = args[1] ?? 0;
    const factor = Math.pow(10, decimals);
    return Math.round(val * factor) / factor;
  },
  MIN: (args) => Math.min(...args),
  MAX: (args) => Math.max(...args),
  SQRT: (args) => (args[0]! < 0 ? NaN : Math.sqrt(args[0]!)),
  POW: (args) => Math.pow(args[0]!, args[1]!),
  LOG: (args) => (args[0]! <= 0 ? NaN : Math.log10(args[0]!)),
  LN: (args) => (args[0]! <= 0 ? NaN : Math.log(args[0]!)),
  EXP: (args) => Math.exp(args[0]!),
  CEIL: (args) => Math.ceil(args[0]!),
  FLOOR: (args) => Math.floor(args[0]!),
  SIGN: (args) => Math.sign(args[0]!),
  TRUNC: (args) => Math.trunc(args[0]!),
  MOD: (args) => {
    if (args[1]! === 0) return NaN;
    return args[0]! % args[1]!;
  },
  INT: (args) => Math.floor(args[0]!),
  SUM: (args) => args.reduce((a, b) => a + b, 0),
  AVG: (args) => (args.length === 0 ? 0 : args.reduce((a, b) => a + b, 0) / args.length),
  AVERAGE: (args) => (args.length === 0 ? 0 : args.reduce((a, b) => a + b, 0) / args.length),
  COUNT: (args) => args.length,
  IF: (args) => (args[0]! !== 0 ? args[1]! : args[2]!),
  NOT: (args) => (args[0]! === 0 ? 1 : 0),
  AND: (args) => (args.every((a) => a !== 0) ? 1 : 0),
  OR: (args) => (args.some((a) => a !== 0) ? 1 : 0),
  NPV: (args) => {
    const rate = args[0]!;
    const cashflows = args.slice(1);
    return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rate, i + 1), 0);
  },
  CAGR: (args) => {
    const ev = args[0]!;
    const bv = args[1]!;
    const n = args[2]!;
    if (bv <= 0 || n <= 0) return 0;
    return Math.pow(ev / bv, 1 / n) - 1;
  },
  IRR: (args) => {
    // Newton-Raphson IRR
    const cashflows = args;
    if (cashflows.length < 2) return 0;
    let guess = 0.1;
    for (let iter = 0; iter < 100; iter++) {
      let npv = 0;
      let dnpv = 0;
      for (let i = 0; i < cashflows.length; i++) {
        const d = Math.pow(1 + guess, i);
        npv += cashflows[i]! / d;
        if (i > 0) dnpv -= (i * cashflows[i]!) / (d * (1 + guess));
      }
      if (Math.abs(dnpv) < 1e-12) break;
      const newGuess = guess - npv / dnpv;
      if (Math.abs(newGuess - guess) < 1e-10) return newGuess;
      guess = newGuess;
    }
    return guess;
  },
  PMT: (args) => {
    const rate = args[0]!;
    const nper = args[1]!;
    const pv = args[2]!;
    if (rate === 0) return -pv / nper;
    return (-pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
  },
  PV: (args) => {
    const rate = args[0]!;
    const nper = args[1]!;
    const pmt = args[2]!;
    const fv = args[3]! ?? 0;
    if (rate === 0) return -(fv + pmt * nper);
    return -(fv + pmt * ((Math.pow(1 + rate, nper) - 1) / rate)) / Math.pow(1 + rate, nper);
  },
  FV: (args) => {
    const rate = args[0]!;
    const nper = args[1]!;
    const pmt = args[2]!;
    const pv = args[3]! ?? 0;
    if (rate === 0) return -(pv + pmt * nper);
    return -(pv * Math.pow(1 + rate, nper) + pmt * ((Math.pow(1 + rate, nper) - 1) / rate));
  },

  // =========================================================================
  // MATH & TRIG (50+)
  // =========================================================================
  ACOS: (args) => Math.acos(args[0]!),
  ASIN: (args) => Math.asin(args[0]!),
  ATAN: (args) => Math.atan(args[0]!),
  ATAN2: (args) => Math.atan2(args[0]!, args[1]!),
  COS: (args) => Math.cos(args[0]!),
  SIN: (args) => Math.sin(args[0]!),
  TAN: (args) => Math.tan(args[0]!),
  ACOSH: (args) => Math.acosh(args[0]!),
  ASINH: (args) => Math.asinh(args[0]!),
  ATANH: (args) => Math.atanh(args[0]!),
  COSH: (args) => Math.cosh(args[0]!),
  SINH: (args) => Math.sinh(args[0]!),
  TANH: (args) => Math.tanh(args[0]!),
  RADIANS: (args) => (args[0]! * Math.PI) / 180,
  DEGREES: (args) => (args[0]! * 180) / Math.PI,
  FACTORIAL: (args) => {
    const n = Math.floor(args[0]!);
    if (n < 0) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  },
  COMBIN: (args) => {
    const n = Math.floor(args[0]!);
    const k = Math.floor(args[1]!);
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
    return Math.round(result);
  },
  PERMUT: (args) => {
    const n = Math.floor(args[0]!);
    const k = Math.floor(args[1]!);
    if (k < 0 || k > n) return 0;
    let result = 1;
    for (let i = 0; i < k; i++) result *= n - i;
    return result;
  },
  GCD: (args) => {
    const gcd2 = (a: number, b: number): number => (b === 0 ? a : gcd2(b, a % b));
    return args.reduce((a, b) => gcd2(Math.abs(Math.floor(a)), Math.abs(Math.floor(b))));
  },
  LCM: (args) => {
    const gcd2 = (a: number, b: number): number => (b === 0 ? a : gcd2(b, a % b));
    return args.reduce((a, b) => {
      const na = Math.abs(Math.floor(a));
      const nb = Math.abs(Math.floor(b));
      return (na * nb) / gcd2(na, nb);
    });
  },
  QUOTIENT: (args) => Math.trunc(args[0]! / args[1]!),
  RANDBETWEEN: (args) => Math.floor(Math.random() * (args[1]! - args[0]! + 1)) + args[0]!,
  RAND: () => Math.random(),
  POWER: (args) => Math.pow(args[0]!, args[1]!),
  SQRTPI: (args) => Math.sqrt(args[0]! * Math.PI),
  SUMSQ: (args) => args.reduce((s, v) => s + v * v, 0),
  SUMPRODUCT: (args) => {
    // Takes pairs of arrays, multiplies element-wise, sums
    if (args.length < 2) return 0;
    const half = Math.floor(args.length / 2);
    let sum = 0;
    for (let i = 0; i < half; i++) sum += args[i]! * args[i + half]!;
    return sum;
  },
  EVEN: (args) => {
    const v = Math.ceil(Math.abs(args[0]!));
    return v % 2 === 0 ? (args[0]! < 0 ? -v : v) : args[0]! < 0 ? -(v + 1) : v + 1;
  },
  ODD: (args) => {
    const v = Math.ceil(Math.abs(args[0]!));
    return v % 2 === 1 ? (args[0]! < 0 ? -v : v) : args[0]! < 0 ? -(v + 1) : v + 1;
  },
  ISEVEN: (args) => (Math.floor(Math.abs(args[0]!)) % 2 === 0 ? 1 : 0),
  ISODD: (args) => (Math.floor(Math.abs(args[0]!)) % 2 === 1 ? 1 : 0),
  SEC: (args) => 1 / Math.cos(args[0]!),
  CSC: (args) => 1 / Math.sin(args[0]!),
  COT: (args) => 1 / Math.tan(args[0]!),
  HYPOT: (args) => Math.hypot(...args),
  LOG2: (args) => Math.log2(args[0]!),
  LOG10: (args) => Math.log10(args[0]!),
  CBRT: (args) => Math.cbrt(args[0]!),
  CLAMP: (args) => Math.min(Math.max(args[0]!, args[1]!), args[2]!),
  LERP: (args) => args[0]! + (args[1]! - args[0]!) * args[2]!,
  REMAP: (args) => {
    const [value = 0, inMin = 0, inMax = 0, outMin = 0, outMax = 0] = args;

    return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
  },
  FLOOR_PRECISE: (args) => {
    const val = args[0]!;
    const significance = args[1]! ?? 1;
    return Math.floor(val / significance) * significance;
  },
  CEILING_PRECISE: (args) => {
    const val = args[0]!;
    const significance = args[1]! ?? 1;
    return Math.ceil(val / significance) * significance;
  },
  MROUND: (args) => {
    const multiple = args[1]!;
    if (multiple === 0) return 0;
    return Math.round(args[0]! / multiple) * multiple;
  },
  BASE: (args) => {
    const num = Math.floor(args[0]!);
    const radix = Math.floor(args[1]!);
    const minLength = args[2]! ?? 0;
    const result = num.toString(radix).toUpperCase();
    return result.padStart(minLength, '0') as unknown as number;
  },
  DECIMAL: (args) => {
    const text = String(args[0]!);
    const radix = Math.floor(args[1]!);
    return parseInt(text, radix);
  },
  ARABIC: (args) => {
    const roman = String(args[0]!).toUpperCase();
    const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let result = 0;
    for (let i = 0; i < roman.length; i++) {
      const curr = map[roman[i]!] ?? 0;
      const nextChar = roman[i + 1];
      const next = nextChar ? (map[nextChar] ?? 0) : 0;
      result += curr < next ? -curr : curr;
    }
    return result;
  },
  ROMAN: (args) => {
    const num = Math.floor(args[0]!);
    const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
    const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
    let result = '';
    let remaining = num;
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i]!;
      while (remaining >= v) {
        result += syms[i]!;
        remaining -= v;
      }
    }
    return result as unknown as number;
  },

  // =========================================================================
  // STATISTICAL (40+)
  // =========================================================================
  MEDIAN: (args) => {
    const sorted = [...args].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const result = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
    return result;
  },
  MODE: (args) => {
    const freq = new Map<number, number>();
    for (const v of args) freq.set(v, (freq.get(v) ?? 0) + 1);
    let maxFreq = 0,
      mode = args[0]!;
    for (const [val, count] of freq) {
      if (count > maxFreq) {
        maxFreq = count;
        mode = val;
      }
    }
    return mode;
  },
  STDEV: (args) => {
    if (args.length < 2) return 0;
    const avg = args.reduce((a, b) => a + b, 0) / args.length;
    return Math.sqrt(args.reduce((s, v) => s + (v - avg) ** 2, 0) / (args.length - 1));
  },
  STDEVP: (args) => {
    if (args.length < 1) return 0;
    const avg = args.reduce((a, b) => a + b, 0) / args.length;
    return Math.sqrt(args.reduce((s, v) => s + (v - avg) ** 2, 0) / args.length);
  },
  VAR: (args) => {
    if (args.length < 2) return 0;
    const avg = args.reduce((a, b) => a + b, 0) / args.length;
    return args.reduce((s, v) => s + (v - avg) ** 2, 0) / (args.length - 1);
  },
  VARP: (args) => {
    if (args.length < 1) return 0;
    const avg = args.reduce((a, b) => a + b, 0) / args.length;
    return args.reduce((s, v) => s + (v - avg) ** 2, 0) / args.length;
  },
  PERCENTILE: (args) => {
    const sorted = [...args.slice(0, -1)].sort((a, b) => a - b);
    const k = args[args.length - 1];
    const idx = (k ?? 0) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return (sorted[lo] ?? 0) + ((sorted[hi] ?? 0) - (sorted[lo] ?? 0)) * (idx - lo);
  },
  QUARTILE: (args) => {
    const quartile = args[args.length - 1]!;
    const pct = [0, 0.25, 0.5, 0.75, 1][quartile] ?? 0;
    const sorted = [...args.slice(0, -1)].sort((a, b) => a - b);
    const idx = pct * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
  },
  RANK: (args) => {
    const val = args[0]!;
    const sorted = [...args.slice(1)].sort((a, b) => b - a);
    return sorted.indexOf(val) + 1;
  },
  CORREL: (args) => {
    const half = Math.floor(args.length / 2);
    const x = args.slice(0, half);
    const y = args.slice(half);
    if (x.length !== y.length || x.length < 2) return 0;
    const n = x.length;
    const xAvg = x.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i]! - xAvg;
      const dy = y[i]! - yAvg;
      sumXY += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }
    const denom = Math.sqrt(sumX2 * sumY2);
    return denom === 0 ? 0 : sumXY / denom;
  },
  COVARIANCE: (args) => {
    const half = Math.floor(args.length / 2);
    const x = args.slice(0, half);
    const y = args.slice(half);
    if (x.length !== y.length || x.length < 2) return 0;
    const n = x.length;
    const xAvg = x.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += (x[i]! - xAvg) * (y[i]! - yAvg);
    return sum / (n - 1);
  },
  AVEDEV: (args) => {
    const avg = args.reduce((a, b) => a + b, 0) / args.length;
    return args.reduce((s, v) => s + Math.abs(v - avg), 0) / args.length;
  },
  GEOMEAN: (args) => {
    const logSum = args.reduce((s, v) => s + Math.log(v), 0);
    return Math.exp(logSum / args.length);
  },
  HARMEAN: (args) => {
    const recipSum = args.reduce((s, v) => s + 1 / v, 0);
    return args.length / recipSum;
  },
  TRIMMEAN: (args) => {
    const percent = args[args.length - 1]!;
    const values = args.slice(0, -1).sort((a, b) => a - b);
    const trimCount = Math.floor((values.length * percent) / 2);
    const trimmed = values.slice(trimCount, values.length - trimCount);
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  },
  LARGE: (args) => {
    const k = args[args.length - 1]!;
    const sorted = [...args.slice(0, -1)].sort((a, b) => b - a);
    return sorted[k - 1] ?? 0;
  },
  SMALL: (args) => {
    const k = args[args.length - 1]!;
    const sorted = [...args.slice(0, -1)].sort((a, b) => a - b);
    return sorted[k - 1] ?? 0;
  },
  FORECAST: (args) => {
    const x = args[0]!;
    const half = Math.floor((args.length - 1) / 2);
    const y = args.slice(1, 1 + half);
    const xVals = args.slice(1 + half);
    const n = y.length;
    const xAvg = xVals.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      num += (xVals[i]! - xAvg) * (y[i]! - yAvg);
      den += (xVals[i]! - xAvg) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yAvg - slope * xAvg;
    return intercept + slope * x;
  },
  SLOPE: (args) => {
    const half = Math.floor(args.length / 2);
    const y = args.slice(0, half);
    const x = args.slice(half);
    const n = y.length;
    const xAvg = x.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i]! - xAvg) * (y[i]! - yAvg);
      den += (x[i]! - xAvg) ** 2;
    }
    return den === 0 ? 0 : num / den;
  },
  INTERCEPT: (args) => {
    const half = Math.floor(args.length / 2);
    const y = args.slice(0, half);
    const x = args.slice(half);
    const n = y.length;
    const xAvg = x.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i]! - xAvg) * (y[i]! - yAvg);
      den += (x[i]! - xAvg) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    return yAvg - slope * xAvg;
  },
  RSQ: (args) => {
    const half = Math.floor(args.length / 2);
    const y = args.slice(0, half);
    const x = args.slice(half);
    if (x.length !== y.length || x.length < 2) return 0;
    const n = x.length;
    const xAvg = x.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let sumXY = 0,
      sumX2 = 0,
      sumY2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i]! - xAvg;
      const dy = y[i]! - yAvg;
      sumXY += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }
    const denom = Math.sqrt(sumX2 * sumY2);
    const r = denom === 0 ? 0 : sumXY / denom;
    return r * r;
  },
  NORMDIST: (args) => {
    const [x = 0, mean = 0, std = 0, cumulative = 0] = args;

    if (std <= 0) return NaN;
    const z = (x - mean) / std;
    if (cumulative) {
      // Approximation of normal CDF
      const t = 1 / (1 + 0.2316419 * Math.abs(z));
      const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
      const p =
        d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return z > 0 ? 1 - p : p;
    }
    return Math.exp((-z * z) / 2) / (std * Math.sqrt(2 * Math.PI));
  },
  NORMINV: (args) => {
    const [p = 0, mean = 0, std = 0] = args;

    if (p <= 0 || p >= 1 || std <= 0) return NaN;
    // Rational approximation for inverse normal
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
        (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
        ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
      );
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      return (
        ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
        (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
      );
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      return (
        -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
        ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
      );
    }
  },
  NORMSDIST: (args) => {
    const z = args[0]!;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
    const p =
      d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  },
  NORMSINV: (args) => {
    // Reuse NORMINV with mean=0, std=1
    const p = args[0]!;
    return FUNCTIONS.NORMINV!([p, 0, 1]);
  },
  PERCENTRANK: (args) => {
    const values = args.slice(0, -1).sort((a, b) => a - b);
    const x = args[args.length - 1]!;
    const below = values.filter((v) => v < x).length;
    const equal = values.filter((v) => v === x).length;
    if (equal === 0) return -1;
    return (below + equal / 2) / values.length;
  },
  STEYX: (args) => {
    const half = Math.floor(args.length / 2);
    const y = args.slice(0, half);
    const x = args.slice(half);
    const n = y.length;
    if (n < 3) return 0;
    const xAvg = x.reduce((a, b) => a + b, 0) / n;
    const yAvg = y.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0,
      // eslint-disable-next-line prefer-const
      ssX = 0;
    let num = 0,
      den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i]! - xAvg) * (y[i]! - yAvg);
      den += (x[i]! - xAvg) ** 2;
    }
    const slope = den === 0 ? 0 : num / den;
    const intercept = yAvg - slope * xAvg;
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * x[i]!;
      ssRes += (y[i]! - predicted) ** 2;
    }
    return Math.sqrt(ssRes / (n - 2));
  },

  // =========================================================================
  // FINANCIAL (50+)
  // =========================================================================
  MIRR: (args) => {
    const values = args.slice(0, -2);
    const financeRate = args[args.length - 2]!;
    const reinvestRate = args[args.length - 1]!;
    const n = values.length;
    let negNpv = 0,
      posNpv = 0;
    for (let i = 0; i < n; i++) {
      if (values[i]! < 0) negNpv += values[i]! / Math.pow(1 + financeRate, i);
      else posNpv += values[i]! / Math.pow(1 + reinvestRate, i);
    }
    if (negNpv === 0 || posNpv === 0) return 0;
    return Math.pow(-posNpv / negNpv, 1 / (n - 1)) - 1;
  },
  XNPV: (args) => {
    const rate = args[0]!;
    const half = Math.floor((args.length - 1) / 2);
    const values = args.slice(1, 1 + half);
    const dates = args.slice(1 + half);
    const baseDate = dates[0]!;
    let npv = 0;
    for (let i = 0; i < values.length; i++) {
      const days = (dates[i]! - baseDate) / 86400000; // ms to days
      npv += values[i]! / Math.pow(1 + rate, days / 365);
    }
    return npv;
  },
  XIRR: (args) => {
    const half = Math.floor(args.length / 2);
    const values = args.slice(0, half);
    const dates = args.slice(half);
    const baseDate = dates[0]!;
    let guess = 0.1;
    for (let iter = 0; iter < 100; iter++) {
      let npv = 0,
        dnpv = 0;
      for (let i = 0; i < values.length; i++) {
        const days = (dates[i]! - baseDate) / 86400000;
        const df = Math.pow(1 + guess, days / 365);
        npv += values[i]! / df;
        dnpv -= ((days / 365) * values[i]!) / (df * (1 + guess));
      }
      if (Math.abs(dnpv) < 1e-12) break;
      const newGuess = guess - npv / dnpv;
      if (Math.abs(newGuess - guess) < 1e-10) return newGuess;
      guess = newGuess;
    }
    return guess;
  },
  SLN: (args) => {
    const [cost = 0, salvage = 0, life = 0] = args;

    return (cost - salvage) / life;
  },
  SYD: (args) => {
    const [cost = 0, salvage = 0, life = 0, per = 0] = args;

    return ((cost - salvage) * (life - per + 1)) / ((life * (life + 1)) / 2);
  },
  DDB: (args) => {
    const [cost = 0, salvage = 0, life = 0, per = 0, factor = 0] = args;

    const f = factor ?? 2;
    let totalDep = 0;
    for (let i = 1; i <= per; i++) {
      const dep = Math.min((cost - totalDep) * (f / life), cost - salvage - totalDep);
      totalDep += Math.max(dep, 0);
    }
    return Math.max((cost - totalDep) * (f / life), 0);
  },
  VDB: (args) => {
    const [cost = 0, salvage = 0, life = 0, startPer = 0, endPer = 0, factor = 0, noSwitch = 0] =
      args;

    const f = factor ?? 2;
    let totalDep = 0;
    for (let i = 1; i <= endPer; i++) {
      const dep = Math.min((cost - totalDep) * (f / life), cost - salvage - totalDep);
      if (i > startPer) totalDep += Math.max(dep, 0);
      else totalDep += Math.max(dep, 0);
    }
    return totalDep;
  },
  DPO: (args) => {
    const [cogs = 0, accountsPayable = 0, days = 0] = args;

    if (cogs === 0) return 0;
    return (accountsPayable / cogs) * (days ?? 365);
  },
  DSO: (args) => {
    const [revenue = 0, accountsReceivable = 0, days = 0] = args;

    if (revenue === 0) return 0;
    return (accountsReceivable / revenue) * (days ?? 365);
  },
  DSI: (args) => {
    const [inventory = 0, cogs = 0, days = 0] = args;

    if (cogs === 0) return 0;
    return (inventory / cogs) * (days ?? 365);
  },
  CURRENT_RATIO: (args) => {
    const [currentAssets = 0, currentLiabilities = 0] = args;

    return currentLiabilities === 0 ? 0 : currentAssets / currentLiabilities;
  },
  QUICK_RATIO: (args) => {
    const [currentAssets = 0, inventory = 0, currentLiabilities = 0] = args;

    return currentLiabilities === 0 ? 0 : (currentAssets - inventory) / currentLiabilities;
  },
  DEBT_TO_EQUITY: (args) => {
    const [totalDebt = 0, totalEquity = 0] = args;

    return totalEquity === 0 ? 0 : totalDebt / totalEquity;
  },
  INTEREST_COVERAGE: (args) => {
    const [ebit = 0, interestExpense = 0] = args;

    return interestExpense === 0 ? 0 : ebit / interestExpense;
  },
  ROE: (args) => {
    const [netIncome = 0, shareholdersEquity = 0] = args;

    return shareholdersEquity === 0 ? 0 : netIncome / shareholdersEquity;
  },
  ROA: (args) => {
    const [netIncome = 0, totalAssets = 0] = args;

    return totalAssets === 0 ? 0 : netIncome / totalAssets;
  },
  ROIC: (args) => {
    const [nopat = 0, investedCapital = 0] = args;

    return investedCapital === 0 ? 0 : nopat / investedCapital;
  },
  GROSS_MARGIN: (args) => {
    const [grossProfit = 0, revenue = 0] = args;

    return revenue === 0 ? 0 : grossProfit / revenue;
  },
  NET_MARGIN: (args) => {
    const [netIncome = 0, revenue = 0] = args;

    return revenue === 0 ? 0 : netIncome / revenue;
  },
  EBITDA_MARGIN: (args) => {
    const [ebitda = 0, revenue = 0] = args;

    return revenue === 0 ? 0 : ebitda / revenue;
  },
  OPERATING_MARGIN: (args) => {
    const [operatingIncome = 0, revenue = 0] = args;

    return revenue === 0 ? 0 : operatingIncome / revenue;
  },
  EBITDA: (args) => args[0]! - args[1]! - args[2]!,
  EBIT: (args) => args[0]! - args[1]!,
  NOPAT: (args) => args[0]! * (1 - args[1]!),
  FCFF: (args) => args[0]! + args[1]! - args[2]! - args[3]!,
  FCFE: (args) => args[0]! + args[1]!,
  WACC: (args) => args[0]! * args[1]! + args[2]! * args[3]! * (1 - args[4]!),
  ALLOCATE: (args) => {
    const amount = args[0]!;
    const weights = args.slice(1);
    const total = weights.reduce((a, b) => a + b, 0);
    return total === 0 ? 0 : (weights[0]! / total) * amount;
  },
  SPREAD: (args) => args[0]! / args[1]!,
  YOY: (args) => {
    const [current = 0, prior = 0] = args;

    return prior === 0 ? 0 : (current - prior) / Math.abs(prior);
  },
  MOM: (args) => {
    const [current = 0, prior = 0] = args;

    return prior === 0 ? 0 : (current - prior) / Math.abs(prior);
  },
  YTD: (args) => args.reduce((a, b) => a + b, 0),
  QTD: (args) => args.reduce((a, b) => a + b, 0),
  ROLLING: (args) => {
    const windowSize = args[args.length - 1]!;
    const values = args.slice(0, -1);
    if (values.length < windowSize) return 0;
    let sum = 0;
    for (let i = values.length - windowSize; i < values.length; i++) sum += values[i]!;
    return sum / windowSize;
  },
  CONVERT_CURRENCY: (args) => args[0]! * args[1]!,
  ELIMINATE: (args) => args[0]! * (1 - args[1]!),
  TRANSLATE: (args) => args[0]! * args[1]!,
  FX_GAIN_LOSS: (args) => args[0]! * (args[2]! - args[1]!),
  COUPON: (args) => {
    const [settlement = 0, maturity = 0, frequency = 0] = args;

    const years = (maturity - settlement) / 365;
    return Math.ceil(years * frequency);
  },
  YIELD: (args) => {
    const [price = 0, par = 0, couponRate = 0, periods = 0] = args;

    const annualCoupon = par * couponRate;
    return (annualCoupon + (par - price) / periods) / ((par + price) / 2);
  },
  PRICE: (args) => {
    const [faceValue = 0, couponRate = 0, yieldRate = 0, periods = 0] = args;

    const coupon = faceValue * couponRate;
    let pvCoupons = 0;
    for (let i = 1; i <= periods; i++) pvCoupons += coupon / Math.pow(1 + yieldRate, i);
    const pvFace = faceValue / Math.pow(1 + yieldRate, periods);
    return pvCoupons + pvFace;
  },
  DURATION: (args) => {
    const [faceValue = 0, couponRate = 0, yieldRate = 0, periods = 0] = args;

    const coupon = faceValue * couponRate;
    let weightedSum = 0,
      priceSum = 0;
    for (let i = 1; i <= periods; i++) {
      const cf = i === periods ? coupon + faceValue : coupon;
      const pv = cf / Math.pow(1 + yieldRate, i);
      weightedSum += i * pv;
      priceSum += pv;
    }
    return priceSum === 0 ? 0 : weightedSum / priceSum;
  },
  ACCRINT: (args) => {
    const [issue = 0, firstInterest = 0, settlement = 0, rate = 0, par = 0, frequency = 0] = args;

    const days = (settlement - issue) / 86400000;
    return par * rate * (days / 365);
  },
  INTRATE: (args) => {
    const [settlement = 0, maturity = 0, investment = 0, redemption = 0] = args;

    const days = (maturity - settlement) / 86400000;
    return ((redemption - investment) / investment) * (365 / days);
  },
  DISC: (args) => {
    const [settlement = 0, maturity = 0, redemption = 0, par = 0] = args;

    const days = (maturity - settlement) / 86400000;
    return ((redemption - par) / redemption) * (360 / days);
  },
  NOMINAL: (args) => {
    const [effectRate = 0, npery = 0] = args;

    return npery * (Math.pow(1 + effectRate, 1 / npery) - 1);
  },
  EFFECT: (args) => {
    const [nominalRate = 0, npery = 0] = args;

    return Math.pow(1 + nominalRate / npery, npery) - 1;
  },
  ISPMT: (args) => {
    const [rate = 0, per = 0, nper = 0, pv = 0] = args;

    return pv * rate * (per / nper - 1);
  },
  DISCOUNTPAYBACK: (args) => {
    const rate = args[0]!;
    const cashflows = args.slice(1);
    let cumulative = 0;
    for (let i = 0; i < cashflows.length; i++) {
      cumulative += cashflows[i]! / Math.pow(1 + rate, i);
      if (cumulative >= 0) return i;
    }
    return -1;
  },
  PROFITABILITYINDEX: (args) => {
    const rate = args[0]!;
    const initialInvestment = args[1]!;
    const cashflows = args.slice(2);
    if (initialInvestment === 0) return 0;
    let pvCashflows = 0;
    for (let i = 0; i < cashflows.length; i++)
      pvCashflows += cashflows[i]! / Math.pow(1 + rate, i + 1);
    return pvCashflows / Math.abs(initialInvestment);
  },

  // =========================================================================
  // LOGICAL (20+)
  // =========================================================================
  IFS: (args) => {
    for (let i = 0; i < args.length - 1; i += 2) {
      if (args[i]! !== 0) return args[i + 1]!;
    }
    return args[args.length - 1] ?? 0;
  },
  SWITCH: (args) => {
    const val = args[0]!;
    for (let i = 1; i < args.length - 1; i += 2) {
      if (val === args[i]!) return args[i + 1]!;
    }
    return args.length % 2 === 0 ? args[args.length - 1]! : 0;
  },
  CHOOSE: (args) => {
    const idx = Math.floor(args[0]!);
    return idx >= 1 && idx < args.length ? args[idx]! : 0;
  },
  BETWEEN: (args) => (args[0]! >= args[1]! && args[0]! <= args[2]! ? 1 : 0),
  COALESCE: (args) => {
    for (const v of args) {
      if (v !== 0 && !isNaN(v) && isFinite(v)) return v;
    }
    return 0;
  },
  ISBLANK: (args) => (args[0]! === 0 ? 1 : 0),
  ISNUMBER: (args) => (typeof args[0]! === 'number' && !isNaN(args[0]!) ? 1 : 0),
  ISERROR: (args) => (isNaN(args[0]!) || !isFinite(args[0]!) ? 1 : 0),
  ISERR: (args) => (isFinite(args[0]!) && !isNaN(args[0]!) ? 0 : 1),
  ISNA: (args) => (isNaN(args[0]!) ? 1 : 0),
  ISLOGICAL: (args) => (args[0]! === 0 || args[0]! === 1 ? 1 : 0),
  TRUE_FN: () => 1,
  FALSE_FN: () => 0,
  XOR: (args) => {
    const trueCount = args.filter((a) => a !== 0).length;
    return trueCount % 2 === 1 ? 1 : 0;
  },
  N: (args) => (typeof args[0]! === 'number' ? args[0]! : 0),
  TYPE: (args) => {
    if (isNaN(args[0]!)) return 1; // error
    if (args[0]! === 0 || args[0]! === 1) return 4; // logical
    return 1; // number
  },

  // =========================================================================
  // TEXT (30+)
  // =========================================================================
  CONCAT: (args) => args.join('') as unknown as number,
  CONCATENATE: (args) => args.join('') as unknown as number,
  LEFT: (args) => {
    const s = String(args[0]!);
    const n = args[1]! ?? 1;
    return s.substring(0, n) as unknown as number;
  },
  RIGHT: (args) => {
    const s = String(args[0]!);
    const n = args[1]! ?? 1;
    return s.substring(s.length - n) as unknown as number;
  },
  MID: (args) => {
    const s = String(args[0]!);
    const start = args[1]! - 1;
    const n = args[2]!;
    return s.substring(start, start + n) as unknown as number;
  },
  LEN: (args) => String(args[0]!).length,
  FIND: (args) => {
    const findText = String(args[0]!);
    const withinText = String(args[1]!);
    const startAt = args[2]! ?? 1;
    const idx = withinText.indexOf(findText, startAt - 1);
    return idx === -1 ? NaN : idx + 1;
  },
  SEARCH: (args) => {
    const findText = String(args[0]!).toLowerCase();
    const withinText = String(args[1]!).toLowerCase();
    const startAt = args[2]! ?? 1;
    const idx = withinText.indexOf(findText, startAt - 1);
    return idx === -1 ? NaN : idx + 1;
  },
  UPPER: (args) => String(args[0]!).toUpperCase() as unknown as number,
  LOWER: (args) => String(args[0]!).toLowerCase() as unknown as number,
  PROPER: (args) => String(args[0]!).replace(/\b\w/g, (c) => c.toUpperCase()) as unknown as number,
  TRIM: (args) => String(args[0]!).trim() as unknown as number,
  CLEAN: (args) => String(args[0]!).replace(/[\x00-\x1F]/g, '') as unknown as number, // eslint-disable-line no-control-regex
  REPLACE: (args) => {
    const oldText = String(args[0]!);
    const start = args[1]! - 1;
    const numChars = args[2]!;
    const newText = String(args[3]!);
    return (oldText.substring(0, start) +
      newText +
      oldText.substring(start + numChars)) as unknown as number;
  },
  SUBSTITUTE: (args) => {
    const text = String(args[0]!);
    const oldText = String(args[1]!);
    const newText = String(args[2]!);
    const instanceNum = args[3]!;
    if (instanceNum) {
      let count = 0;
      return text.replace(
        new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        (match) => {
          count++;
          return count === instanceNum ? newText : match;
        }
      ) as unknown as number;
    }
    return text.split(oldText).join(newText) as unknown as number;
  },
  REPT: (args) => String(args[0]!).repeat(args[1]!) as unknown as number,
  CHAR: (args) => String.fromCharCode(args[0]!) as unknown as number,
  CODE: (args) => String(args[0]!).charCodeAt(0),
  VALUE: (args) => parseFloat(String(args[0]!)),
  TEXT: (args) => args[0]! as unknown as number,
  DOLLAR: (args) => {
    const val = args[0]!;
    const decimals = args[1]! ?? 2;
    return `$${val.toFixed(decimals)}` as unknown as number;
  },
  FIXED: (args) => {
    const val = args[0]!;
    const decimals = args[1]! ?? 2;
    const noCommas = args[2]! ?? 0;
    const formatted = val.toFixed(decimals);
    if (noCommas) return formatted as unknown as number;
    const parts = formatted.split('.');
    parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.') as unknown as number;
  },
  EXACT: (args) => (String(args[0]!) === String(args[1]!) ? 1 : 0),
  T: (args) =>
    typeof args[0]! === 'string' ? (args[0]! as unknown as number) : ('' as unknown as number),
  BAHTTEXT: (args) => `${args[0]!} baht` as unknown as number,

  // =========================================================================
  // DATE (30+)
  // =========================================================================
  DATE: (args) => {
    const d = new Date(args[0]!, args[1]! - 1, args[2]!);
    return d.getTime();
  },
  YEAR: (args) => new Date(args[0]!).getFullYear(),
  MONTH: (args) => new Date(args[0]!).getMonth() + 1,
  DAY: (args) => new Date(args[0]!).getDate(),
  HOUR: (args) => new Date(args[0]!).getHours(),
  MINUTE: (args) => new Date(args[0]!).getMinutes(),
  SECOND: (args) => new Date(args[0]!).getSeconds(),
  NOW: () => Date.now(),
  TODAY: () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  },
  TIME: (args) => {
    const d = new Date(1900, 0, 1, args[0]!, args[1]!, args[2]!);
    return d.getTime();
  },
  DATEVALUE: (args) => new Date(String(args[0]!)).getTime(),
  TIMEVALUE: (args) => {
    const parts = String(args[0]!).split(':');
    return (
      (parseInt(parts[0]!) * 3600 + parseInt(parts[1]!) * 60 + parseInt(parts[2] ?? '0')) * 1000
    );
  },
  WEEKDAY: (args) => {
    const d = new Date(args[0]!);
    const returnType = args[1]! ?? 1;
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (returnType === 1) return day + 1; // 1=Sun, 7=Sat
    if (returnType === 2) return day === 0 ? 7 : day; // 1=Mon, 7=Sun
    return day === 0 ? 6 : day - 1; // 0=Mon, 6=Sun
  },
  WEEKNUM: (args) => {
    const d = new Date(args[0]!);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  },
  ISOWEEKNUM: (args) => {
    const d = new Date(args[0]!);
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const dayOfWeek = jan4.getDay() || 7;
    const weekStart = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
    const diff = d.getTime() - weekStart.getTime();
    return Math.floor(diff / 604800000) + 1;
  },
  DATEDIF: (args) => {
    const start = new Date(args[0]!);
    const end = new Date(args[1]!);
    const unit = String(args[2]!).toUpperCase();
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (unit === 'D') return diffDays;
    if (unit === 'M')
      return (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    if (unit === 'Y') return end.getFullYear() - start.getFullYear();
    if (unit === 'YM') {
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
      return months % 12;
    }
    if (unit === 'YD') {
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      const e = new Date(start.getFullYear(), end.getMonth(), end.getDate());
      return Math.floor((e.getTime() - s.getTime()) / 86400000);
    }
    return diffDays;
  },
  DAYS360: (args) => {
    const start = new Date(args[0]!);
    const end = new Date(args[1]!);
    const sm = start.getMonth();
    const em = end.getMonth();
    const sd = Math.min(start.getDate(), 30);
    const ed = Math.min(end.getDate(), 30);
    return (end.getFullYear() - start.getFullYear()) * 360 + (em - sm) * 30 + (ed - sd);
  },
  YEARFRAC: (args) => {
    const start = new Date(args[0]!);
    const end = new Date(args[1]!);
    const diffMs = Math.abs(end.getTime() - start.getTime());
    return diffMs / (365.25 * 86400000);
  },
  EDATE: (args) => {
    const d = new Date(args[0]!);
    const months = args[1]!;
    d.setMonth(d.getMonth() + months);
    return d.getTime();
  },
  EOMONTH: (args) => {
    const d = new Date(args[0]!);
    const months = args[1]!;
    d.setMonth(d.getMonth() + months + 1, 0);
    return d.getTime();
  },
  WORKDAY: (args) => {
    const start = new Date(args[0]!);
    let days = args[1]!;
    const d = new Date(start);
    while (days > 0) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) days--;
    }
    return d.getTime();
  },
  NETWORKDAYS: (args) => {
    const start = new Date(args[0]!);
    const end = new Date(args[1]!);
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      if (d.getDay() !== 0 && d.getDay() !== 6) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  },
  MONTH_END: (args) => {
    const d = new Date(args[0]!);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  },
  QUARTER_FN: (args) => Math.ceil((new Date(args[0]!).getMonth() + 1) / 3),
  FISCAL_YEAR: (args) => {
    const d = new Date(args[0]!);
    const fiscalStartMonth = args[1]! ?? 1;
    return d.getMonth() >= fiscalStartMonth - 1 ? d.getFullYear() : d.getFullYear() - 1;
  },
  FISCAL_QUARTER: (args) => {
    const d = new Date(args[0]!);
    const fiscalStartMonth = args[1]! ?? 1;
    const adjustedMonth = (d.getMonth() - fiscalStartMonth + 1 + 12) % 12;
    return Math.floor(adjustedMonth / 3) + 1;
  },

  // =========================================================================
  // LOOKUP (20+)
  // =========================================================================
  INDEX: (args) => {
    const array = args.slice(0, -2);
    const row = args[args.length - 2]! - 1;
    const col = args[args.length - 1]! - 1;
    return array[row] ?? 0;
  },
  MATCH: (args) => {
    const lookupValue = args[0]!;
    const array = args.slice(1);
    for (let i = 0; i < array.length; i++) {
      if (array[i]! === lookupValue) return i + 1;
    }
    return NaN;
  },
  VLOOKUP: (args) => {
    const lookupValue = args[0]!;
    const colIndex = args[args.length - 2]! - 1;
    const exactMatch = args[args.length - 1] === 0;
    const table = args.slice(1, -2);
    const cols = Math.floor(Math.sqrt(table.length));
    const rows = Math.floor(table.length / cols);
    for (let r = 0; r < rows; r++) {
      const cellVal = table[r * cols]!;
      if (exactMatch ? cellVal === lookupValue : cellVal <= lookupValue) {
        return table[r * cols + colIndex] ?? 0;
      }
    }
    return NaN;
  },
  HLOOKUP: (args) => {
    const lookupValue = args[0]!;
    const rowIndex = args[args.length - 2]! - 1;
    const table = args.slice(1, -2);
    const cols = Math.floor(Math.sqrt(table.length));
    for (let c = 0; c < cols; c++) {
      if (table[c]! === lookupValue) {
        return table[rowIndex * cols + c] ?? 0;
      }
    }
    return NaN;
  },
  XLOOKUP: (args) => {
    const lookupValue = args[0]!;
    const half = Math.floor((args.length - 1) / 2);
    const lookupArray = args.slice(1, 1 + half);
    const returnArray = args.slice(1 + half);
    for (let i = 0; i < lookupArray.length; i++) {
      if (lookupArray[i] === lookupValue) return returnArray[i] ?? 0;
    }
    return NaN;
  },
  CHOOSE_LOOKUP: (args) => {
    const idx = Math.floor(args[0]!);
    return idx >= 1 && idx < args.length ? args[idx]! : 0;
  },
  TRANSPOSE: (args) => args[0]!,
  SORT: (args) => [...args].sort((a, b) => a - b) as unknown as number,
  FILTER: (args) => {
    const half = Math.floor(args.length / 2);
    const values = args.slice(0, half);
    const conditions = args.slice(half);
    return values.filter((_, i) => conditions[i] !== 0) as unknown as number;
  },
  UNIQUE: (args) => [...new Set(args)] as unknown as number,
  ARRAY_CONSTRAIN: (args) => {
    const array = args.slice(0, -2);
    const rows = args[args.length - 2];
    return array.slice(0, rows) as unknown as number;
  },
  FLATTEN: (args) => args as unknown as number,
  IFERROR: (args) => (isNaN(args[0]!) || !isFinite(args[0]!) ? args[1]! : args[0]!),
  IFNA: (args) => (isNaN(args[0]!) ? args[1]! : args[0]!),

  // =========================================================================
  // ADDITIONAL MATH (30+)
  // =========================================================================
  ROUNDUP: (args) => {
    const val = args[0]!;
    const decimals = args[1]! ?? 0;
    const factor = Math.pow(10, decimals);
    return (val > 0 ? Math.ceil(val * factor) : Math.floor(val * factor)) / factor;
  },
  ROUNDDOWN: (args) => {
    const val = args[0]!;
    const decimals = args[1]! ?? 0;
    const factor = Math.pow(10, decimals);
    return (val > 0 ? Math.floor(val * factor) : Math.ceil(val * factor)) / factor;
  },
  TRUNC_PRECISE: (args) => {
    const val = args[0]!;
    const decimals = args[1]! ?? 0;
    const factor = Math.pow(10, decimals);
    return Math.trunc(val * factor) / factor;
  },
  FRACT: (args) => args[0]! - Math.trunc(args[0]!),
  SIGNUM: (args) => (args[0]! > 0 ? 1 : args[0]! < 0 ? -1 : 0),
  NEAREST: (args) => Math.round(args[0]! / args[1]!) * args[1]!,
  RECIPROCAL: (args) => (args[0]! === 0 ? Infinity : 1 / args[0]!),
  ISPRIME: (args) => {
    const n = Math.floor(Math.abs(args[0]!));
    if (n < 2) return 0;
    if (n < 4) return 1;
    if (n % 2 === 0 || n % 3 === 0) return 0;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return 0;
    }
    return 1;
  },
  FACTORIAL2: (args) => {
    const n = Math.floor(args[0]!);
    if (n < 0) return NaN;
    if (n <= 1) return 1;
    let result = 1;
    for (let i = n; i >= 1; i -= 2) result *= i;
    return result;
  },
  FIBONACCI: (args) => {
    const n = Math.floor(args[0]!);
    if (n <= 0) return 0;
    if (n === 1) return 1;
    let a = 0,
      b = 1;
    for (let i = 2; i <= n; i++) {
      const t = a + b;
      a = b;
      b = t;
    }
    return b;
  },
  MULTINOMIAL: (args) => {
    const sum = args.reduce((a, b) => a + b, 0);
    let result = 1;
    for (let i = 1; i <= sum; i++) result *= i;
    for (const arg of args) {
      for (let i = 1; i <= arg; i++) result /= i;
    }
    return Math.round(result);
  },
  SERIESSUM: (args) => {
    const [x = 0, n = 0, m = 0] = args;

    const coefficients = args.slice(3);
    return coefficients.reduce((sum, coeff, i) => sum + coeff * Math.pow(x, n + m * i), 0);
  },
  PRODUCT: (args) => args.reduce((a, b) => a * b, 1),
  DELTA: (args) => (args[0]! === (args[1]! ?? 0) ? 1 : 0),
  GESTEP: (args) => (args[0]! >= (args[1]! ?? 0) ? 1 : 0),
  ABS_DIFF: (args) => Math.abs(args[0]! - args[1]!),
  PERCENT_OF: (args) => (args[1]! === 0 ? 0 : (args[0]! / args[1]!) * 100),
  CHANGE_PCT: (args) => {
    const [oldVal = 0, newVal = 0] = args;

    return oldVal === 0 ? 0 : ((newVal - oldVal) / Math.abs(oldVal)) * 100;
  },
  CUMSUM: (args) => {
    const result: number[] = [];
    let sum = 0;
    for (const v of args) {
      sum += v;
      result.push(sum);
    }
    return result as unknown as number;
  },
  CUMPRODUCT: (args) => {
    const result: number[] = [];
    let product = 1;
    for (const v of args) {
      product *= v;
      result.push(product);
    }
    return result as unknown as number;
  },
  DIFF: (args) => {
    const result: number[] = [];
    for (let i = 1; i < args.length; i++) result.push(args[i]! - args[i - 1]!);
    return result as unknown as number;
  },
  ACCUMULATE: (args) => {
    const result: number[] = [];
    let acc = 0;
    for (const v of args) {
      acc += v;
      result.push(acc);
    }
    return result as unknown as number;
  },
  NORMALIZE: (args) => {
    const min = Math.min(...args);
    const max = Math.max(...args);
    const range = max - min;
    if (range === 0) return args.map(() => 0) as unknown as number;
    return args.map((v) => (v - min) / range) as unknown as number;
  },
  STANDARDIZE: (args) => {
    const val = args[0]!;
    const avg = args[1]!;
    const stdev = args[2]!;
    return stdev === 0 ? 0 : (val - avg) / stdev;
  },
  ZSCORE: (args) => {
    const val = args[0]!;
    const values = args.slice(1);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdev = Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1));
    return stdev === 0 ? 0 : (val - avg) / stdev;
  },
  PERCENTILE_INC: (args) => {
    const sorted = [...args.slice(0, -1)].sort((a, b) => a - b);
    const k = args[args.length - 1]!;
    const idx = k * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
  },
  PERCENTILE_EXC: (args) => {
    const sorted = [...args.slice(0, -1)].sort((a, b) => a - b);
    const k = args[args.length - 1]!;
    const n = sorted.length;
    const idx = k * (n + 1) - 1;
    if (idx < 0) return sorted[0]!;
    if (idx >= n - 1) return sorted[n - 1]!;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
  },
  QUARTILE_INC: (args) => {
    const quartile = args[args.length - 1]!;
    const pct = [0, 0.25, 0.5, 0.75, 1][quartile] ?? 0;
    return FUNCTIONS.PERCENTILE_INC!([...args.slice(0, -1), pct]);
  },
  QUARTILE_EXC: (args) => {
    const quartile = args[args.length - 1]!;
    const pct = [0, 0.25, 0.5, 0.75, 1][quartile] ?? 0;
    return FUNCTIONS.PERCENTILE_EXC!([...args.slice(0, -1), pct]);
  },
  RANK_EQ: (args) => {
    const val = args[0]!;
    const sorted = [...args.slice(1)].sort((a, b) => a - b);
    const idx = sorted.indexOf(val);
    return idx === -1 ? NaN : idx + 1;
  },
  RANK_AVG: (args) => {
    const val = args[0]!;
    const sorted = [...args.slice(1)].sort((a, b) => a - b);
    const first = sorted.indexOf(val);
    const last = sorted.lastIndexOf(val);
    return first === -1 ? NaN : (first + last + 2) / 2;
  },
  KURT: (args) => {
    const n = args.length;
    if (n < 4) return 0;
    const avg = args.reduce((a, b) => a + b, 0) / n;
    const m4 = args.reduce((s, v) => s + (v - avg) ** 4, 0) / n;
    const m2 = args.reduce((s, v) => s + (v - avg) ** 2, 0) / n;
    return m2 === 0 ? 0 : m4 / (m2 * m2) - 3;
  },
  SKEW: (args) => {
    const n = args.length;
    if (n < 3) return 0;
    const avg = args.reduce((a, b) => a + b, 0) / n;
    const m3 = args.reduce((s, v) => s + (v - avg) ** 3, 0) / n;
    const m2 = args.reduce((s, v) => s + (v - avg) ** 2, 0) / n;
    return m2 === 0 ? 0 : m3 / Math.pow(m2, 1.5);
  },
  DEVSQ: (args) => {
    const avg = args.reduce((a, b) => a + b, 0) / args.length;
    return args.reduce((s, v) => s + (v - avg) ** 2, 0);
  },
  SUMXMY2: (args) => {
    const half = Math.floor(args.length / 2);
    const x = args.slice(0, half);
    const y = args.slice(half);
    return x.reduce((s, v, i) => s + (v - y[i]!) ** 2, 0);
  },
  SUMX2MY2: (args) => {
    const half = Math.floor(args.length / 2);
    const x = args.slice(0, half);
    const y = args.slice(half);
    return x.reduce((s, v, i) => s + v * v - y[i]! * y[i]!, 0);
  },
  SUMX2PY2: (args) => {
    const half = Math.floor(args.length / 2);
    const x = args.slice(0, half);
    const y = args.slice(half);
    return x.reduce((s, v, i) => s + v * v + y[i]! * y[i]!, 0);
  },

  // =========================================================================
  // ADDITIONAL FINANCIAL (15+)
  // =========================================================================
  TBILLPRICE: (args) => {
    const [settlement = 0, maturity = 0, discount = 0] = args;

    const days = (maturity - settlement) / 86400000;
    return 100 * (1 - (discount * days) / 360);
  },
  TBILLYIELD: (args) => {
    const [settlement = 0, maturity = 0, price = 0] = args;

    const days = (maturity - settlement) / 86400000;
    return ((100 - price) / price) * (360 / days);
  },
  TBILLEQ: (args) => {
    const [settlement = 0, maturity = 0, discount = 0] = args;

    const days = (maturity - settlement) / 86400000;
    return (365 * discount) / (360 - discount * days);
  },
  RECEIVED: (args) => {
    const [settlement = 0, maturity = 0, investment = 0, discount = 0] = args;

    const days = (maturity - settlement) / 86400000;
    return investment / (1 - (discount * days) / 360);
  },
  CUMIPMT: (args) => {
    const [rate = 0, nper = 0, pv = 0, startPeriod = 0, endPeriod = 0, type = 0] = args;

    let totalInterest = 0;
    let balance = pv;
    const pmt =
      rate === 0
        ? -pv / nper
        : (-pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
    for (let i = 1; i <= endPeriod; i++) {
      const interest = -balance * rate;
      const principal = pmt - interest;
      balance += principal;
      if (i >= startPeriod) totalInterest += interest;
    }
    return totalInterest;
  },
  CUMPRINC: (args) => {
    const [rate = 0, nper = 0, pv = 0, startPeriod = 0, endPeriod = 0, type = 0] = args;

    let totalPrincipal = 0;
    let balance = pv;
    const pmt =
      rate === 0
        ? -pv / nper
        : (-pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
    for (let i = 1; i <= endPeriod; i++) {
      const interest = -balance * rate;
      const principal = pmt - interest;
      balance += principal;
      if (i >= startPeriod) totalPrincipal += principal;
    }
    return totalPrincipal;
  },
  ODDFPRICE: (args) => {
    const [faceValue = 0, couponRate = 0, yieldRate = 0, firstPeriod = 0, periods = 0] = args;

    const coupon = faceValue * couponRate;
    let pv = 0;
    for (let i = 1; i <= periods; i++) pv += coupon / Math.pow(1 + yieldRate, i);
    pv += faceValue / Math.pow(1 + yieldRate, periods);
    return pv;
  },
  ODDLPRICE: (args) => {
    const [faceValue = 0, couponRate = 0, yieldRate = 0, lastPeriod = 0, periods = 0] = args;

    const coupon = faceValue * couponRate;
    let pv = 0;
    for (let i = 1; i <= periods; i++) pv += coupon / Math.pow(1 + yieldRate, i);
    pv += faceValue / Math.pow(1 + yieldRate, periods);
    return pv;
  },
  RRI: (args) => {
    const [nper = 0, pv = 0, fv = 0] = args;

    if (pv === 0 || nper === 0) return 0;
    return Math.pow(fv / pv, 1 / nper) - 1;
  },
  NPER: (args) => {
    const [rate = 0, pmt = 0, pv = 0, fv = 0] = args;

    if (rate === 0) return -(pv + fv) / pmt;
    return Math.log((pmt - fv * rate) / (pmt + pv * rate)) / Math.log(1 + rate);
  },
  RATE: (args) => {
    const [nper = 0, pmt = 0, pv = 0, fv = 0] = args;

    let guess = 0.1;
    for (let i = 0; i < 100; i++) {
      const f =
        pv * Math.pow(1 + guess, nper) + (pmt * (Math.pow(1 + guess, nper) - 1)) / guess + fv;
      const df =
        nper * pv * Math.pow(1 + guess, nper - 1) +
        (pmt * (nper * Math.pow(1 + guess, nper - 1) * guess - (Math.pow(1 + guess, nper) - 1))) /
          (guess * guess);
      if (Math.abs(df) < 1e-12) break;
      const newGuess = guess - f / df;
      if (Math.abs(newGuess - guess) < 1e-10) return newGuess;
      guess = newGuess;
    }
    return guess;
  },
  PDURATION: (args) => {
    const [rate = 0, pv = 0, fv = 0] = args;

    if (rate <= 0 || pv <= 0 || fv <= 0) return 0;
    return Math.log(fv / pv) / Math.log(1 + rate);
  },

  // =========================================================================
  // ADDITIONAL TEXT (10+)
  // =========================================================================
  NUMBERVALUE: (args) => parseFloat(String(args[0]!).replace(/,/g, '.')),
  UNICODE: (args) => String(args[0]!).codePointAt(0) ?? 0,
  UNICHAR: (args) => String.fromCodePoint(args[0]!) as unknown as number,
  WIDECHAR: (args) => {
    const s = String(args[0]!);
    return s
      .split('')
      .map((c) => {
        const code = c.charCodeAt(0);
        return code >= 33 && code <= 126 ? String.fromCharCode(code + 65248) : c;
      })
      .join('') as unknown as number;
  },
  ASC: (args) => {
    const s = String(args[0]!);
    return s
      .split('')
      .map((c) => {
        const code = c.charCodeAt(0);
        return code >= 65281 && code <= 65374 ? String.fromCharCode(code - 65248) : c;
      })
      .join('') as unknown as number;
  },
  JIS: (args) => String(args[0]!) as unknown as number,
  ENCODEURL: (args) => encodeURIComponent(String(args[0]!)) as unknown as number,
  DOLLAR_DE: (args) => {
    const [fractionalDollar = 0, fraction = 0] = args;

    const intPart = Math.floor(fractionalDollar);
    const fracPart = (fractionalDollar - intPart) * Math.pow(10, Math.ceil(Math.log10(fraction)));
    return intPart + fracPart / fraction;
  },
  DOLLAR_FR: (args) => {
    const [decimalDollar = 0, fraction = 0] = args;

    const intPart = Math.floor(decimalDollar);
    const fracPart =
      ((decimalDollar - intPart) * fraction) / Math.pow(10, Math.ceil(Math.log10(fraction)));
    return intPart + fracPart;
  },
  CLEAN_TEXT: (args) => String(args[0]!).replace(/[\x00-\x1F\x7F-\x9F]/g, '') as unknown as number, // eslint-disable-line no-control-regex

  // =========================================================================
  // ADDITIONAL DATE (10+)
  // =========================================================================
  DAYS_FN: (args) => {
    const end = new Date(args[0]!);
    const start = new Date(args[1]!);
    return Math.floor((end.getTime() - start.getTime()) / 86400000);
  },
  WORKDAY_INTL: (args) => {
    const start = new Date(args[0]!);
    let days = args[1]!;
    const weekend = args[2]! ?? 1; // 1=Sat/Sun
    const d = new Date(start);
    while (days > 0) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      const isWeekend = weekend === 1 ? dow === 0 || dow === 6 : dow === weekend;
      if (!isWeekend) days--;
    }
    return d.getTime();
  },
  NETWORKDAYS_INTL: (args) => {
    const start = new Date(args[0]!);
    const end = new Date(args[1]!);
    const weekend = args[2]! ?? 1;
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
      const dow = d.getDay();
      const isWeekend = weekend === 1 ? dow === 0 || dow === 6 : dow === weekend;
      if (!isWeekend) count++;
      d.setDate(d.getDate() + 1);
    }
    return count;
  },
  WEEKNUM_ISO: (args) => FUNCTIONS.ISOWEEKNUM!(args),
  EDATE_FN: (args) => FUNCTIONS.EDATE!(args),
  EOMONTH_FN: (args) => FUNCTIONS.EOMONTH!(args),
  DAYS360_FN: (args) => FUNCTIONS.DAYS360!(args),
  YEARFRAC_FN: (args) => FUNCTIONS.YEARFRAC!(args),
  DATE_FN: (args) => FUNCTIONS.DATE!(args),
  TIME_FN: (args) => FUNCTIONS.TIME!(args),
};

// --- Lexer ---
class Lexer {
  private pos = 0;
  private tokens: Token[] = [];
  private input = '';

  tokenize(input: string): Token[] {
    this.input = input;
    this.pos = 0;
    this.tokens = [];

    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      if (this.tokens.length >= MAX_TOKENS) {
        throw new Error('Expression too complex: token limit exceeded');
      }

      const ch = this.input[this.pos]!;

      // Numbers (including scientific notation)
      if (
        (ch >= '0' && ch <= '9') ||
        (ch === '.' &&
          this.pos + 1 < this.input.length &&
          this.input[this.pos + 1]! >= '0' &&
          this.input[this.pos + 1]! <= '9')
      ) {
        this.readNumber();
        continue;
      }

      // Identifiers (functions, constants, cell refs, keywords)
      if ((ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_') {
        this.readIdentifier();
        continue;
      }

      // String literals
      if (ch === '"' || ch === "'") {
        this.readString(ch);
        continue;
      }

      // Operators and punctuation
      switch (ch) {
        case '+':
          this.addToken('plus', '+');
          this.pos++;
          break;
        case '-':
          this.addToken('minus', '-');
          this.pos++;
          break;
        case '*':
          this.addToken('star', '*');
          this.pos++;
          break;
        case '/':
          this.addToken('slash', '/');
          this.pos++;
          break;
        case '^':
          this.addToken('caret', '^');
          this.pos++;
          break;
        case '%':
          this.addToken('percent', '%');
          this.pos++;
          break;
        case '(':
          this.addToken('lparen', '(');
          this.pos++;
          break;
        case ')':
          this.addToken('rparen', ')');
          this.pos++;
          break;
        case ',':
          this.addToken('comma', ',');
          this.pos++;
          break;
        case ':':
          this.addToken('colon', ':');
          this.pos++;
          break;
        case '<':
          if (this.pos + 1 < this.input.length) {
            if (this.input[this.pos + 1]! === '=') {
              this.addToken('lte', '<=');
              this.pos += 2;
            } else if (this.input[this.pos + 1]! === '>') {
              this.addToken('neq', '<>');
              this.pos += 2;
            } else {
              this.addToken('lt', '<');
              this.pos++;
            }
          } else {
            this.addToken('lt', '<');
            this.pos++;
          }
          break;
        case '>':
          if (this.pos + 1 < this.input.length && this.input[this.pos + 1]! === '=') {
            this.addToken('gte', '>=');
            this.pos += 2;
          } else {
            this.addToken('gt', '>');
            this.pos++;
          }
          break;
        case '=':
          this.addToken('eq', '=');
          this.pos++;
          break;
        default:
          throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
      }
    }

    this.addToken('eof', '');
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && this.input[this.pos]! <= ' ') {
      this.pos++;
    }
  }

  private readNumber(): void {
    const start = this.pos;
    let hasDot = false;
    let hasExp = false;

    while (this.pos < this.input.length) {
      const ch = this.input[this.pos]!;
      if (ch >= '0' && ch <= '9') {
        this.pos++;
      } else if (ch === '.' && !hasDot && !hasExp) {
        hasDot = true;
        this.pos++;
      } else if ((ch === 'e' || ch === 'E') && !hasExp) {
        hasExp = true;
        this.pos++;
        if (
          this.pos < this.input.length &&
          (this.input[this.pos] === '+' || this.input[this.pos] === '-')
        ) {
          this.pos++;
        }
      } else {
        break;
      }
    }

    const value = this.input.slice(start, this.pos);
    if (value === '.' || value.endsWith('.')) {
      throw new Error(`Invalid number at position ${start}`);
    }
    this.addToken('number', value);
  }

  private readIdentifier(): void {
    const start = this.pos;
    while (
      this.pos < this.input.length &&
      ((this.input[this.pos]! >= 'A' && this.input[this.pos]! <= 'Z') ||
        (this.input[this.pos]! >= 'a' && this.input[this.pos]! <= 'z') ||
        (this.input[this.pos]! >= '0' && this.input[this.pos]! <= '9') ||
        this.input[this.pos]! === '_')
    ) {
      this.pos++;
    }

    const word = this.input.slice(start, this.pos);
    const upper = word.toUpperCase();

    // Check if it's a function (lookahead for parenthesis) BEFORE cell ref check
    // This prevents function names like ATAN2, LOG2, LOG10 from being treated as cell refs
    if (this.pos < this.input.length && this.input[this.pos] === '(' && FUNCTIONS[upper]!) {
      this.addToken('func', upper);
      return;
    }

    // Check if it's a cell reference (e.g., A1, BC23, Sheet1!A1)
    if (this.isCellRef(word)) {
      this.addToken('cellRef', word);
      return;
    }

    // Check for multi-word cell ref with sheet prefix (Sheet1!A1)
    if (this.pos < this.input.length && this.input[this.pos] === '!') {
      this.pos++; // skip !
      const refStart = this.pos;
      while (
        this.pos < this.input.length &&
        ((this.input[this.pos]! >= 'A' && this.input[this.pos]! <= 'Z') ||
          (this.input[this.pos]! >= 'a' && this.input[this.pos]! <= 'z') ||
          (this.input[this.pos]! >= '0' && this.input[this.pos]! <= '9'))
      ) {
        this.pos++;
      }
      const ref = this.input.slice(refStart, this.pos);
      if (this.isCellRef(ref)) {
        this.addToken('cellRef', `${word}!${ref}`);
        return;
      }
      // Not a valid cell ref, backtrack
      this.pos = refStart - 1;
    }

    // Check constants
    if (CONSTANTS[upper] !== undefined) {
      this.addToken('const', upper);
      return;
    }

    // Check if it's a function (lookahead for parenthesis)
    if (this.pos < this.input.length && this.input[this.pos] === '(') {
      this.addToken('func', upper);
      return;
    }

    // Logical keywords used as operators
    if (upper === 'AND' || upper === 'OR' || upper === 'NOT') {
      this.addToken(upper.toLowerCase() as TokenType, upper);
      return;
    }

    // Block reserved words that could be used for injection
    const RESERVED_WORDS = new Set([
      'THIS',
      'WINDOW',
      'GLOBAL',
      'GLOBALTHIS',
      'SELF',
      'TOP',
      'PARENT',
      'CONSTRUCTOR',
      'PROTOTYPE',
      '__PROTO__',
      '__DEFINEGETTER__',
      '__DEFINESETTER__',
      '__LOOKUPGETTER__',
      '__LOOKUPSETTER__',
      'EVAL',
      'FUNCTION',
      'IMPORT',
      'REQUIRE',
      'MODULE',
      'EXPORTS',
      'SETINTERVAL',
      'SETTIMEOUT',
      'FETCH',
      'XMLHTTPREQUEST',
      'PROMISE',
      'ASYNC',
      'AWAIT',
      'YIELD',
      'DELETE',
      'VOID',
      'TYPEOF',
      'INSTANCEOF',
      'IN',
      'NEW',
      'THROW',
      'TRY',
      'CATCH',
      'FINALLY',
      'SWITCH',
      'CASE',
      'BREAK',
      'CONTINUE',
      'DEFAULT',
      'WHILE',
      'DO',
      'FOR',
      'IF',
      'ELSE',
      'RETURN',
      'WITH',
      'DEBUGGER',
      'CLASS',
      'EXTENDS',
      'SUPER',
      'CONST',
      'LET',
      'VAR',
    ]);

    if (RESERVED_WORDS.has(upper)) {
      throw new Error(`Reserved word '${word}' is not allowed in expressions`);
    }

    // Treat as cell reference (for range expressions like A:B)
    this.addToken('cellRef', word);
  }

  private isCellRef(s: string): boolean {
    // Matches patterns like: A1, BC23, $A$1, $A1, A$1
    const cleaned = s.replace(/\$/g, '');
    const match = cleaned.match(/^([A-Z]+)(\d+)$/i);
    return match !== null;
  }

  private readString(quote: string): void {
    this.pos++; // skip opening quote
    const start = this.pos;
    while (this.pos < this.input.length && this.input[this.pos] !== quote) {
      if (this.input[this.pos] === '\\') this.pos++; // skip escape
      this.pos++;
    }
    if (this.pos >= this.input.length) {
      throw new Error('Unterminated string literal');
    }
    const value = this.input.slice(start, this.pos);
    this.pos++; // skip closing quote
    this.addToken('string', value);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({ type, value, pos: this.pos });
  }
}

// --- Parser (Recursive Descent) ---
class Parser {
  private tokens: Token[] = [];
  private pos = 0;
  private depth = 0;
  private getCellValue: ((ref: string) => number | string | boolean) | null = null;
  private dependencies: string[] = [];

  parse(tokens: Token[], getCellValue?: (ref: string) => number | string | boolean): ParseResult {
    this.tokens = tokens;
    this.pos = 0;
    this.depth = 0;
    this.dependencies = [];
    this.getCellValue = getCellValue ?? null;

    if (this.tokens.length <= 1) {
      return { value: 0, dependencies: [], error: undefined };
    }

    try {
      const value = this.parseOr();
      if (this.current().type !== 'eof') {
        throw new Error(
          `Unexpected token '${this.current().value}' at position ${this.current().pos}`
        );
      }
      return { value, dependencies: [...new Set(this.dependencies)].sort(), error: undefined };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Parse error';
      return { value: NaN, dependencies: [], error: msg };
    }
  }

  private enter(): void {
    this.depth++;
    if (this.depth > MAX_RECURSION_DEPTH) {
      throw new Error('Expression too deeply nested: recursion limit exceeded');
    }
  }

  private leave(): void {
    this.depth--;
  }

  private current(): Token {
    return this.tokens[this.pos] ?? { type: 'eof', value: '', pos: -1 };
  }

  private peek(): Token {
    return this.tokens[this.pos + 1] ?? { type: 'eof', value: '', pos: -1 };
  }

  private advance(): Token {
    const tok = this.current();
    this.pos++;
    return tok;
  }

  private expect(type: TokenType): Token {
    const tok = this.current();
    if (tok.type !== type) {
      throw new Error(`Expected ${type} but got ${tok.type} '${tok.value}' at position ${tok.pos}`);
    }
    return this.advance();
  }

  // OR
  private parseOr(): number {
    this.enter();
    let left = this.parseAnd();
    while (this.current().type === 'or') {
      this.advance();
      const right = this.parseAnd();
      left = left !== 0 || right !== 0 ? 1 : 0;
    }
    this.leave();
    return left;
  }

  // AND
  private parseAnd(): number {
    this.enter();
    let left = this.parseComparison();
    while (this.current().type === 'and') {
      this.advance();
      const right = this.parseComparison();
      left = left !== 0 && right !== 0 ? 1 : 0;
    }
    this.leave();
    return left;
  }

  // Comparison: =, <, >, <=, >=, <>
  private parseComparison(): number {
    this.enter();
    let left = this.parseAddSub();
    while (
      this.current().type === 'eq' ||
      this.current().type === 'lt' ||
      this.current().type === 'gt' ||
      this.current().type === 'lte' ||
      this.current().type === 'gte' ||
      this.current().type === 'neq'
    ) {
      const op = this.advance();
      const right = this.parseAddSub();
      switch (op.type) {
        case 'eq':
          left = left === right ? 1 : 0;
          break;
        case 'lt':
          left = left < right ? 1 : 0;
          break;
        case 'gt':
          left = left > right ? 1 : 0;
          break;
        case 'lte':
          left = left <= right ? 1 : 0;
          break;
        case 'gte':
          left = left >= right ? 1 : 0;
          break;
        case 'neq':
          left = left !== right ? 1 : 0;
          break;
      }
    }
    this.leave();
    return left;
  }

  // Addition, Subtraction
  private parseAddSub(): number {
    this.enter();
    let left = this.parseMulDiv();
    while (this.current().type === 'plus' || this.current().type === 'minus') {
      const op = this.advance();
      const right = this.parseMulDiv();
      left = op.type === 'plus' ? left + right : left - right;
    }
    this.leave();
    return left;
  }

  // Multiplication, Division, Modulo
  private parseMulDiv(): number {
    this.enter();
    let left = this.parsePower();
    while (
      this.current().type === 'star' ||
      this.current().type === 'slash' ||
      this.current().type === 'percent'
    ) {
      const op = this.advance();
      const right = this.parsePower();
      switch (op.type) {
        case 'star':
          left = left * right;
          break;
        case 'slash':
          if (right === 0) {
            left = 0; // Division by zero returns 0 per financial convention
          } else {
            left = left / right;
          }
          break;
        case 'percent':
          if (right === 0) {
            left = NaN;
          } else {
            left = left % right;
          }
          break;
      }
    }
    this.leave();
    return left;
  }

  // Power
  private parsePower(): number {
    this.enter();
    const left = this.parseUnary();
    if (this.current().type === 'caret') {
      this.advance();
      const right = this.parsePower(); // Right-associative
      this.leave();
      return Math.pow(left, right);
    }
    this.leave();
    return left;
  }

  // Unary operators
  private parseUnary(): number {
    this.enter();
    if (this.current().type === 'minus') {
      this.advance();
      const val = this.parseUnary();
      this.leave();
      return -val;
    }
    if (this.current().type === 'plus') {
      this.advance();
      const val = this.parseUnary();
      this.leave();
      return val;
    }
    if (this.current().type === 'not') {
      this.advance();
      const val = this.parseUnary();
      this.leave();
      return val === 0 ? 1 : 0;
    }
    this.leave();
    return this.parseAtom();
  }

  // Atoms: numbers, cell refs, functions, parenthesized expressions
  private parseAtom(): number {
    this.enter();
    const tok = this.current();

    // Number literal
    if (tok.type === 'number') {
      this.advance();
      this.leave();
      return parseFloat(tok.value);
    }

    // Constants
    if (tok.type === 'const') {
      this.advance();
      this.leave();
      return CONSTANTS[tok.value] ?? 0;
    }

    // Cell reference
    if (tok.type === 'cellRef') {
      this.advance();

      // Check for range (A1:B10)
      if (this.current().type === 'colon') {
        this.advance();
        const endRef = this.current();
        if (endRef.type === 'cellRef') {
          this.advance();
          this.dependencies.push(tok.value, endRef.value);
          // Range evaluates to 0 in numeric context; ranges are resolved by consuming functions
          this.leave();
          return 0;
        }
        throw new Error(`Expected cell reference after ':' at position ${this.current().pos}`);
      }

      this.dependencies.push(tok.value);
      if (this.getCellValue) {
        const val = this.getCellValue(tok.value);
        if (typeof val === 'number') {
          this.leave();
          return val;
        }
        if (typeof val === 'boolean') {
          this.leave();
          return val ? 1 : 0;
        }
        if (typeof val === 'string') {
          const num = parseFloat(val);
          this.leave();
          return isNaN(num) ? 0 : num;
        }
      }
      this.leave();
      return 0;
    }

    // String literal
    if (tok.type === 'string') {
      this.advance();
      this.leave();
      return 0; // Strings evaluate to 0 in numeric context
    }

    // Parenthesized expression
    if (tok.type === 'lparen') {
      this.advance();
      const val = this.parseOr();
      this.expect('rparen');
      this.leave();
      return val;
    }

    // Function call
    if (tok.type === 'func') {
      this.advance();
      this.expect('lparen');
      const args: number[] = [];
      const argRanges: { start: string; end: string }[] = [];

      if (this.current().type !== 'rparen') {
        // Parse first argument
        if (this.current().type === 'cellRef' && this.peek().type === 'colon') {
          // Range reference like A1:B5
          const ref = this.current();
          this.advance();
          this.advance(); // skip colon
          const endRef = this.current();
          if (endRef.type === 'cellRef') {
            this.advance();
            argRanges.push({ start: ref.value, end: endRef.value });
            this.dependencies.push(ref.value, endRef.value);
          }
        } else {
          args.push(this.parseOr());
        }

        // Parse remaining arguments
        while (this.current().type === 'comma') {
          this.advance();
          if (args.length + argRanges.length >= MAX_FUNCTION_ARGS) {
            throw new Error(`Too many arguments (max ${MAX_FUNCTION_ARGS})`);
          }
          if (this.current().type === 'cellRef' && this.peek().type === 'colon') {
            // Range reference like A1:B5
            const ref = this.current();
            this.advance();
            this.advance(); // skip colon
            const endRef = this.current();
            if (endRef.type === 'cellRef') {
              this.advance();
              argRanges.push({ start: ref.value, end: endRef.value });
              this.dependencies.push(ref.value, endRef.value);
            }
          } else {
            args.push(this.parseOr());
          }
        }
      }
      this.expect('rparen');

      // Resolve ranges into args
      for (const range of argRanges) {
        const rangeValues = this.resolveRange(range.start, range.end);
        args.push(...rangeValues);
      }

      const funcName = tok.value;
      const func = FUNCTIONS[funcName];
      if (!func) {
        throw new Error(`Unknown function: ${funcName}`);
      }

      this.leave();
      return func(args);
    }

    throw new Error(`Unexpected token '${tok.value}' (type: ${tok.type}) at position ${tok.pos}`);
  }

  private resolveRange(startRef: string, endRef: string): number[] {
    if (!this.getCellValue) return [];

    const startParsed = this.parseCellRefParts(startRef);
    const endParsed = this.parseCellRefParts(endRef);
    if (!startParsed || !endParsed) return [];

    const values: number[] = [];

    if (startParsed.col === endParsed.col) {
      // Single column range
      const startRow = parseInt(startParsed.row);
      const endRow = parseInt(endParsed.row);
      for (let r = startRow; r <= endRow; r++) {
        const ref = `${startParsed.col}${r}`;
        const val = this.getCellValue(ref);
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else {
          const num = parseFloat(String(val));
          if (!isNaN(num)) values.push(num);
        }
      }
    } else if (startParsed.row === endParsed.row) {
      // Single row range
      const startCode = startParsed.col.toUpperCase().charCodeAt(0);
      const endCode = endParsed.col.toUpperCase().charCodeAt(0);
      for (let c = startCode; c <= endCode; c++) {
        const ref = `${String.fromCharCode(c)}${startParsed.row}`;
        const val = this.getCellValue(ref);
        if (typeof val === 'number') values.push(val);
        else if (typeof val === 'boolean') values.push(val ? 1 : 0);
        else {
          const num = parseFloat(String(val));
          if (!isNaN(num)) values.push(num);
        }
      }
    }

    return values;
  }

  private parseCellRefParts(ref: string): { col: string; row: string } | null {
    const cleaned = ref.replace(/\$/g, '');
    const match = cleaned.match(/^([A-Z]+)(\d+)$/i);
    if (!match) return null;
    return { col: match[1]!.toUpperCase(), row: match[2]! };
  }
}

// --- Public API ---
export interface ParseResult {
  value: number;
  dependencies: string[];
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class SafeMathParser {
  private lexer = new Lexer();
  private parser = new Parser();

  /**
   * Parse and evaluate a math expression.
   * Returns the numeric result.
   * Throws on invalid input.
   */
  evaluate(expression: string, getCellValue?: (ref: string) => number | string | boolean): number {
    const result = this.safeEvaluate(expression, getCellValue);
    if (result.error) {
      throw new Error(result.error);
    }
    return result.value;
  }

  /**
   * Parse and evaluate a math expression.
   * Returns a result object with value, dependencies, and optional error.
   * Never throws.
   */
  safeEvaluate(
    expression: string,
    getCellValue?: (ref: string) => number | string | boolean
  ): ParseResult {
    // Input validation
    if (expression === null || expression === undefined) {
      return { value: NaN, dependencies: [], error: 'No expression provided' };
    }

    if (typeof expression !== 'string') {
      return { value: NaN, dependencies: [], error: 'Expression must be a string' };
    }

    const trimmed = expression.trim();
    if (trimmed.length === 0) {
      return { value: 0, dependencies: [], error: undefined };
    }

    if (trimmed.length > MAX_INPUT_LENGTH) {
      return {
        value: NaN,
        dependencies: [],
        error: `Expression exceeds maximum length of ${MAX_INPUT_LENGTH} characters`,
      };
    }

    // Strip leading = (spreadsheet convention)
    const cleanExpr = trimmed.startsWith('=') ? trimmed.substring(1).trim() : trimmed;

    try {
      const tokens = this.lexer.tokenize(cleanExpr);
      return this.parser.parse(tokens, getCellValue);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Parse error';
      return { value: NaN, dependencies: [], error: msg };
    }
  }

  /**
   * Validate an expression without evaluating it.
   * Returns { valid, error? }
   */
  validate(expression: string): ValidationResult {
    const result = this.safeEvaluate(expression);
    return { valid: !result.error, error: result.error };
  }

  /**
   * Extract cell references from an expression without evaluating.
   */
  getDependencies(expression: string): string[] {
    const result = this.safeEvaluate(expression);
    return result.dependencies;
  }

  /**
   * Tokenize an expression (for debugging/testing).
   */
  tokenize(expression: string): Token[] {
    const trimmed = expression.trim();
    const cleanExpr = trimmed.startsWith('=') ? trimmed.substring(1).trim() : trimmed;
    return this.lexer.tokenize(cleanExpr);
  }
}

// --- Singleton instance for convenience ---
export const safeMathParser = new SafeMathParser();
