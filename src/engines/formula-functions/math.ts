// =============================================================================
// FORMULA FUNCTION REGISTRY — Math & Engineering Functions
// =============================================================================
import type { FormulaFunction } from './helpers';
import { flattenNums, fact, comb, perm, normCDF } from './helpers';
import { SUM, COUNT, AVERAGE, MAX, MIN } from './statistical';

// =============================================================================
// MATH FUNCTIONS
// =============================================================================

export function ROUND(v: number, d = 0): number {
  const f = Math.pow(10, d);
  return Math.round(v * f) / f;
}
export function ROUNDUP(v: number, d = 0): number {
  const f = Math.pow(10, d);
  return Math.ceil(v * f) / f;
}
export function ROUNDDOWN(v: number, d = 0): number {
  const f = Math.pow(10, d);
  return Math.floor(v * f) / f;
}
export function MOD(a: number, b: number): number {
  if (b === 0) return NaN;
  return a - b * Math.floor(a / b);
}
export function POWER(a: number, b: number): number {
  return Math.pow(a, b);
}
export function SQRT(v: number): number {
  return Math.sqrt(v);
}
export function LN(v: number): number {
  return Math.log(v);
}
export function LOG(v: number, base = 10): number {
  return Math.log(v) / Math.log(base);
}
export function LOG10(v: number): number {
  return Math.log10(v);
}
export function EXP(v: number): number {
  return Math.exp(v);
}
export function CEILING(v: number, sig = 1): number {
  return Math.ceil(v / sig) * sig;
}
export function FLOOR(v: number, sig = 1): number {
  return Math.floor(v / sig) * sig;
}
export function MROUND(v: number, m: number): number {
  return m === 0 ? 0 : Math.round(v / m) * m;
}
export function GCD(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}
export function LCM(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : Math.abs(a * b) / GCD(a, b);
}
export function COMBIN(n: number, k: number): number {
  return comb(n, k);
}
export function PERMUT(n: number, k: number): number {
  return perm(n, k);
}
export function SUMPRODUCT(a: number, b: number): number {
  const as = Array.isArray(a) ? a : [a];
  const bs = Array.isArray(b) ? b : [b];
  let s = 0;
  const len = Math.min(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const prod = as[i] * bs[i];
    if (!isNaN(prod)) s += prod;
  }
  return s;
}
export function SUMIF(
  range: number | number[],
  criteria: number,
  sumRange?: number | number[]
): number {
  const vals = Array.isArray(range) ? range : [range];
  const sums = sumRange !== undefined ? (Array.isArray(sumRange) ? sumRange : [sumRange]) : vals;
  let s = 0;
  for (let i = 0; i < vals.length; i++) {
    if (!isNaN(vals[i]) && vals[i] === criteria && i < sums.length && !isNaN(sums[i])) {
      s += sums[i];
    }
  }
  return s;
}
export function COUNTIF(range: number | number[], criteria: number): number {
  const vals = Array.isArray(range) ? range : [range];
  let c = 0;
  for (let i = 0; i < vals.length; i++) {
    if (vals[i] === criteria) c++;
  }
  return c;
}
export function SUMIFS(vals: number, ...args: number[]): number {
  const v = Array.isArray(vals) ? vals : [vals];
  let s = 0;
  for (let i = 0; i < v.length; i++) {
    let match = true;
    for (let j = 0; j < args.length; j += 2) {
      const crit = Array.isArray(args[j]) ? args[j] : [args[j]];
      if (crit[i] !== args[j + 1]) {
        match = false;
        break;
      }
    }
    if (match && !isNaN(v[i])) s += v[i];
  }
  return s;
}
export function COUNTIFS(...args: number[]): number {
  const first = Array.isArray(args[0]) ? args[0] : [args[0]];
  let c = 0;
  for (let i = 0; i < first.length; i++) {
    let match = true;
    for (let j = 0; j < args.length; j += 2) {
      const crit = Array.isArray(args[j]) ? args[j] : [args[j]];
      if (crit[i] !== args[j + 1]) {
        match = false;
        break;
      }
    }
    if (match) c++;
  }
  return c;
}
export function AVERAGEIFS(vals: number, ...args: number[]): number {
  const v = Array.isArray(vals) ? vals : [vals];
  let s = 0,
    c = 0;
  for (let i = 0; i < v.length; i++) {
    let match = true;
    for (let j = 0; j < args.length; j += 2) {
      const crit = Array.isArray(args[j]) ? args[j] : [args[j]];
      if (crit[i] !== args[j + 1]) {
        match = false;
        break;
      }
    }
    if (match) {
      s += v[i];
      c++;
    }
  }
  return c === 0 ? 0 : s / c;
}
export function AVERAGEIF(range: unknown, criteria: unknown, avgRange?: unknown): number {
  const r = Array.isArray(range) ? range : [range as number];
  const a = avgRange ? (Array.isArray(avgRange) ? avgRange : [avgRange as number]) : r;
  let s = 0,
    c = 0;
  for (let i = 0; i < r.length; i++) {
    if (r[i] === criteria) {
      s += typeof a[i] === 'number' ? a[i] : 0;
      c++;
    }
  }
  return c === 0 ? 0 : s / c;
}

// =============================================================================
// ENGINEERING FUNCTIONS
// =============================================================================

export function BIN2DEC(v: number): number {
  return parseInt(String(Math.round(v)), 2);
}
export function DEC2BIN(v: number): number {
  return parseInt(Math.round(v).toString(2));
}
export function HEX2DEC(v: number): number {
  return parseInt(String(Math.round(v)), 16);
}
export function DEC2HEX(v: number): number {
  return parseInt(Math.round(v).toString(16));
}
export function OCT2DEC(v: number): number {
  return parseInt(String(Math.round(v)), 8);
}
export function DEC2OCT(v: number): number {
  return parseInt(Math.round(v).toString(8));
}
export function BIN2HEX(v: number): number {
  return parseInt(parseInt(String(Math.round(v)), 2).toString(16));
}
export function BIN2OCT(v: number): number {
  return parseInt(parseInt(String(Math.round(v)), 2).toString(8));
}
export function HEX2BIN(v: number): number {
  return parseInt(parseInt(String(Math.round(v)), 16).toString(2));
}
export function HEX2OCT(v: number): number {
  return parseInt(parseInt(String(Math.round(v)), 16).toString(8));
}
export function OCT2BIN(v: number): number {
  return parseInt(parseInt(String(Math.round(v)), 8).toString(2));
}
export function OCT2HEX(v: number): number {
  return parseInt(parseInt(String(Math.round(v)), 8).toString(16));
}
export function DELTA(a: number, b: number): number {
  return a === b ? 1 : 0;
}
export function GESTEP(v: number, step = 0): number {
  return v >= step ? 1 : 0;
}
export function ERF(x: number): number {
  return 2 * normCDF(x * Math.SQRT2) - 1;
}
export function ERFC(x: number): number {
  return 1 - ERF(x);
}
export function CONVERT(v: number, from: number, to: number): number {
  return v * (from / to);
}
export function PRODUCT(...args: unknown[]): number {
  const valid = flattenNums(args);
  return valid.length === 0 ? 0 : valid.reduce((s, x) => s * x, 1);
}

// =============================================================================
// REGISTER ALL MATH & ENGINEERING FUNCTIONS
// =============================================================================

export function registerMathFunctions(r: (fn: FormulaFunction) => void): void {
  r({
    name: 'ROUND',
    category: 'math',
    description: 'Round to decimal places',
    minArgs: 1,
    maxArgs: 2,
    impl: ROUND,
  });
  r({
    name: 'ROUNDUP',
    category: 'math',
    description: 'Round up',
    minArgs: 1,
    maxArgs: 2,
    impl: ROUNDUP,
  });
  r({
    name: 'ROUNDDOWN',
    category: 'math',
    description: 'Round down',
    minArgs: 1,
    maxArgs: 2,
    impl: ROUNDDOWN,
  });
  r({ name: 'MOD', category: 'math', description: 'Modulo', minArgs: 2, maxArgs: 2, impl: MOD });
  r({ name: 'POWER', category: 'math', description: 'Power', minArgs: 2, maxArgs: 2, impl: POWER });
  r({
    name: 'SQRT',
    category: 'math',
    description: 'Square root',
    minArgs: 1,
    maxArgs: 1,
    impl: SQRT,
  });
  r({
    name: 'LN',
    category: 'math',
    description: 'Natural logarithm',
    minArgs: 1,
    maxArgs: 1,
    impl: LN,
  });
  r({
    name: 'LOG',
    category: 'math',
    description: 'Logarithm with base',
    minArgs: 1,
    maxArgs: 2,
    impl: LOG,
  });
  r({
    name: 'LOG10',
    category: 'math',
    description: 'Base-10 logarithm',
    minArgs: 1,
    maxArgs: 1,
    impl: LOG10,
  });
  r({
    name: 'EXP',
    category: 'math',
    description: 'Exponential',
    minArgs: 1,
    maxArgs: 1,
    impl: EXP,
  });
  r({
    name: 'CEILING',
    category: 'math',
    description: 'Round up to significance',
    minArgs: 1,
    maxArgs: 2,
    impl: CEILING,
  });
  r({
    name: 'FLOOR',
    category: 'math',
    description: 'Round down to significance',
    minArgs: 1,
    maxArgs: 2,
    impl: FLOOR,
  });
  r({
    name: 'MROUND',
    category: 'math',
    description: 'Round to multiple',
    minArgs: 2,
    maxArgs: 2,
    impl: MROUND,
  });
  r({
    name: 'GCD',
    category: 'math',
    description: 'Greatest common divisor',
    minArgs: 2,
    maxArgs: 2,
    impl: GCD,
  });
  r({
    name: 'LCM',
    category: 'math',
    description: 'Least common multiple',
    minArgs: 2,
    maxArgs: 2,
    impl: LCM,
  });
  r({
    name: 'COMBIN',
    category: 'math',
    description: 'Combinations',
    minArgs: 2,
    maxArgs: 2,
    impl: COMBIN,
  });
  r({
    name: 'PERMUT',
    category: 'math',
    description: 'Permutations',
    minArgs: 2,
    maxArgs: 2,
    impl: PERMUT,
  });
  r({
    name: 'SUMPRODUCT',
    category: 'math',
    description: 'Sum of products',
    minArgs: 2,
    maxArgs: 2,
    impl: SUMPRODUCT,
  });
  r({
    name: 'SUMIF',
    category: 'math',
    description: 'Sum with single criteria',
    minArgs: 2,
    maxArgs: 3,
    impl: SUMIF,
  });
  r({
    name: 'COUNTIF',
    category: 'math',
    description: 'Count with single criteria',
    minArgs: 2,
    maxArgs: 2,
    impl: COUNTIF,
  });
  r({
    name: 'SUMIFS',
    category: 'math',
    description: 'Sum with multiple criteria',
    minArgs: 3,
    maxArgs: -1,
    impl: SUMIFS,
  });
  r({
    name: 'COUNTIFS',
    category: 'math',
    description: 'Count with multiple criteria',
    minArgs: 2,
    maxArgs: -1,
    impl: COUNTIFS,
  });
  r({
    name: 'AVERAGEIF',
    category: 'math',
    description: 'Average with single criteria',
    minArgs: 2,
    maxArgs: 3,
    impl: AVERAGEIF,
  });
  r({
    name: 'AVERAGEIFS',
    category: 'math',
    description: 'Average with multiple criteria',
    minArgs: 3,
    maxArgs: -1,
    impl: AVERAGEIFS,
  });
  r({
    name: 'SIGN',
    category: 'math',
    description: 'Sign of number',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => (v > 0 ? 1 : v < 0 ? -1 : 0),
  });
  r({
    name: 'QUOTIENT',
    category: 'math',
    description: 'Integer division',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) =>
      b === 0 ? (a === 0 ? NaN : a > 0 ? Infinity : -Infinity) : Math.trunc(a / b),
  });
  r({
    name: 'SUBTOTAL',
    category: 'math',
    description: 'Subtotal with function code',
    minArgs: 2,
    maxArgs: -1,
    impl: (fn: number, ...args: number[]) => {
      const vals = args;
      switch (fn) {
        case 1:
          return AVERAGE(vals);
        case 2:
          return COUNT(vals);
        case 3:
          return COUNT(vals);
        case 4:
          return MAX(vals);
        case 5:
          return MIN(vals);
        case 6:
          return PRODUCT(...vals);
        case 9:
          return SUM(vals);
        default:
          return SUM(vals);
      }
    },
  });
  r({
    name: 'PRODUCT',
    category: 'math',
    description: 'Product of values',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => {
      const valid = args.filter((x) => !isNaN(x));
      return valid.length === 0 ? 0 : valid.reduce((s, x) => s * x, 1);
    },
  });
  r({
    name: 'AGGREGATE',
    category: 'math',
    description: 'Aggregate with options',
    minArgs: 3,
    maxArgs: -1,
    impl: (fn: number, _opts: number, ...args: number[]) => {
      switch (fn) {
        case 1:
          return AVERAGE(args);
        case 2:
          return COUNT(args);
        case 4:
          return MAX(args);
        case 5:
          return MIN(args);
        case 9:
          return SUM(args);
        default:
          return SUM(args);
      }
    },
  });
  r({
    name: 'PI',
    category: 'math',
    description: 'Pi constant',
    minArgs: 0,
    maxArgs: 0,
    impl: () => Math.PI,
  });
  r({
    name: 'PHI',
    category: 'math',
    description: 'Golden ratio',
    minArgs: 0,
    maxArgs: 0,
    impl: () => 1.618033988749895,
  });
  r({
    name: 'INT',
    category: 'math',
    description: 'Integer part',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.floor(v),
  });
  r({
    name: 'TRUNC',
    category: 'math',
    description: 'Truncate to digits',
    minArgs: 1,
    maxArgs: 2,
    impl: (v: number, d = 0) => {
      const f = Math.pow(10, d);
      return Math.trunc(v * f) / f;
    },
  });
  r({
    name: 'ODD',
    category: 'math',
    description: 'Round to odd',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => {
      const r = Math.ceil(Math.abs(v));
      return r % 2 === 0 ? r + 1 : r;
    },
  });
  r({
    name: 'EVEN',
    category: 'math',
    description: 'Round to even',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => {
      const r = Math.ceil(Math.abs(v));
      return r % 2 === 0 ? r : r + 1;
    },
  });
  r({
    name: 'FACT',
    category: 'math',
    description: 'Factorial',
    minArgs: 1,
    maxArgs: 1,
    impl: (n: number) => fact(Math.floor(n)),
  });
  r({
    name: 'FACTDOUBLE',
    category: 'math',
    description: 'Double factorial',
    minArgs: 1,
    maxArgs: 1,
    impl: (n: number) => {
      let r = 1;
      for (let i = Math.floor(n); i > 0; i -= 2) r *= i;
      return r;
    },
  });
  r({
    name: 'RAND',
    category: 'math',
    description: 'Random number',
    minArgs: 0,
    maxArgs: 0,
    impl: () => Math.random(),
  });
  r({
    name: 'RANDBETWEEN',
    category: 'math',
    description: 'Random integer between',
    minArgs: 2,
    maxArgs: 2,
    impl: (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo,
  });
  r({
    name: 'DEGREES',
    category: 'math',
    description: 'Radians to degrees',
    minArgs: 1,
    maxArgs: 1,
    impl: (r: number) => (r * 180) / Math.PI,
  });
  r({
    name: 'RADIANS',
    category: 'math',
    description: 'Degrees to radians',
    minArgs: 1,
    maxArgs: 1,
    impl: (d: number) => (d * Math.PI) / 180,
  });
  r({
    name: 'SIN',
    category: 'math',
    description: 'Sine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.sin(v),
  });
  r({
    name: 'COS',
    category: 'math',
    description: 'Cosine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.cos(v),
  });
  r({
    name: 'TAN',
    category: 'math',
    description: 'Tangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.tan(v),
  });
  r({
    name: 'ASIN',
    category: 'math',
    description: 'Arc sine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.asin(v),
  });
  r({
    name: 'ACOS',
    category: 'math',
    description: 'Arc cosine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.acos(v),
  });
  r({
    name: 'ATAN',
    category: 'math',
    description: 'Arc tangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.atan(v),
  });
  r({
    name: 'ATAN2',
    category: 'math',
    description: 'Arc tangent of x/y',
    minArgs: 2,
    maxArgs: 2,
    impl: (x: number, y: number) => Math.atan2(y, x),
  });
  r({
    name: 'SINH',
    category: 'math',
    description: 'Hyperbolic sine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.sinh(v),
  });
  r({
    name: 'COSH',
    category: 'math',
    description: 'Hyperbolic cosine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.cosh(v),
  });
  r({
    name: 'TANH',
    category: 'math',
    description: 'Hyperbolic tangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.tanh(v),
  });
  r({
    name: 'ASINH',
    category: 'math',
    description: 'Inverse hyperbolic sine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.asinh(v),
  });
  r({
    name: 'ACOSH',
    category: 'math',
    description: 'Inverse hyperbolic cosine',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.acosh(v),
  });
  r({
    name: 'ATANH',
    category: 'math',
    description: 'Inverse hyperbolic tangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.atanh(v),
  });
  r({
    name: 'SEC',
    category: 'math',
    description: 'Secant',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 1 / Math.cos(v),
  });
  r({
    name: 'CSC',
    category: 'math',
    description: 'Cosecant',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 1 / Math.sin(v),
  });
  r({
    name: 'COT',
    category: 'math',
    description: 'Cotangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 1 / Math.tan(v),
  });
  r({
    name: 'SECH',
    category: 'math',
    description: 'Hyperbolic secant',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 1 / Math.cosh(v),
  });
  r({
    name: 'CSCH',
    category: 'math',
    description: 'Hyperbolic cosecant',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 1 / Math.sinh(v),
  });
  r({
    name: 'COTH',
    category: 'math',
    description: 'Hyperbolic cotangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 1 / Math.tanh(v),
  });
  r({
    name: 'ACOTH',
    category: 'math',
    description: 'Inverse hyperbolic cotangent',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => 0.5 * Math.log((v + 1) / (v - 1)),
  });
  r({
    name: 'BASE',
    category: 'math',
    description: 'Convert number to text with given base',
    minArgs: 2,
    maxArgs: 3,
    impl: (v: number, base: number) => parseInt(Math.round(v).toString(base)),
  });
  r({
    name: 'DECIMAL',
    category: 'math',
    description: 'Convert text in given base to decimal',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: number, base: number) => parseInt(String(Math.round(v)), base),
  });
  r({
    name: 'ARABIC',
    category: 'math',
    description: 'Convert Roman numeral to Arabic',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => v,
  });
  r({
    name: 'ROMAN',
    category: 'math',
    description: 'Convert Arabic to Roman numeral',
    minArgs: 1,
    maxArgs: 2,
    impl: (v: number) => {
      const n = Math.round(v);
      if (n <= 0 || n > 3999) return 0;
      const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
      const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
      let result = '',
        num = n;
      for (let i = 0; i < vals.length; i++) {
        while (num >= vals[i]) {
          result += syms[i];
          num -= vals[i];
        }
      }
      return Number(result.replace(/[IVXLCDM]/g, (c) => String(c.charCodeAt(0))));
    },
  });
  r({
    name: 'MULTIPLY',
    category: 'math',
    description: 'Multiply two numbers',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) => a * b,
  });
  r({
    name: 'ADD',
    category: 'math',
    description: 'Add two numbers',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) => a + b,
  });
  r({
    name: 'MINUS',
    category: 'math',
    description: 'Subtract two numbers',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) => a - b,
  });
  r({
    name: 'DIVIDE',
    category: 'math',
    description: 'Divide two numbers',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) =>
      b === 0 ? (a === 0 ? NaN : a > 0 ? Infinity : -Infinity) : a / b,
  });
  r({
    name: 'DSUM',
    category: 'math',
    description: 'Database sum with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let s = 0;
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) s += d[i];
      return s;
    },
  });
  r({
    name: 'DAVERAGE',
    category: 'math',
    description: 'Database average with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let s = 0,
        n = 0;
      for (let i = 0; i < d.length; i++)
        if (c[i] === criteria) {
          s += d[i];
          n++;
        }
      return n === 0 ? 0 : s / n;
    },
  });
  r({
    name: 'DCOUNT',
    category: 'math',
    description: 'Database count with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let n = 0;
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) n++;
      return n;
    },
  });
  r({
    name: 'DCOUNTA',
    category: 'math',
    description: 'Database count non-empty with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let n = 0;
      for (let i = 0; i < d.length; i++) if (c[i] === criteria && d[i] !== 0) n++;
      return n;
    },
  });
  r({
    name: 'DGET',
    category: 'math',
    description: 'Database get single value with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) return d[i];
      return 0;
    },
  });
  r({
    name: 'DMAX',
    category: 'math',
    description: 'Database max with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let max = -Infinity;
      for (let i = 0; i < d.length; i++) if (c[i] === criteria && d[i] > max) max = d[i];
      return max === -Infinity ? 0 : max;
    },
  });
  r({
    name: 'DMIN',
    category: 'math',
    description: 'Database min with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let min = Infinity;
      for (let i = 0; i < d.length; i++) if (c[i] === criteria && d[i] < min) min = d[i];
      return min === Infinity ? 0 : min;
    },
  });
  r({
    name: 'DPRODUCT',
    category: 'math',
    description: 'Database product with criteria',
    minArgs: 3,
    maxArgs: 3,
    impl: (data: unknown, criteriaRange: unknown, criteria: number) => {
      const d = Array.isArray(data) ? data : [data as number];
      const c = Array.isArray(criteriaRange) ? criteriaRange : [criteriaRange as number];
      let p = 1;
      for (let i = 0; i < d.length; i++) if (c[i] === criteria) p *= d[i];
      return p;
    },
  });

  // Engineering
  r({
    name: 'BIN2DEC',
    category: 'engineering',
    description: 'Binary to decimal',
    minArgs: 1,
    maxArgs: 1,
    impl: BIN2DEC,
  });
  r({
    name: 'DEC2BIN',
    category: 'engineering',
    description: 'Decimal to binary',
    minArgs: 1,
    maxArgs: 1,
    impl: DEC2BIN,
  });
  r({
    name: 'HEX2DEC',
    category: 'engineering',
    description: 'Hex to decimal',
    minArgs: 1,
    maxArgs: 1,
    impl: HEX2DEC,
  });
  r({
    name: 'DEC2HEX',
    category: 'engineering',
    description: 'Decimal to hex',
    minArgs: 1,
    maxArgs: 1,
    impl: DEC2HEX,
  });
  r({
    name: 'OCT2DEC',
    category: 'engineering',
    description: 'Octal to decimal',
    minArgs: 1,
    maxArgs: 1,
    impl: OCT2DEC,
  });
  r({
    name: 'DEC2OCT',
    category: 'engineering',
    description: 'Decimal to octal',
    minArgs: 1,
    maxArgs: 1,
    impl: DEC2OCT,
  });
  r({
    name: 'BIN2HEX',
    category: 'engineering',
    description: 'Binary to hex',
    minArgs: 1,
    maxArgs: 1,
    impl: BIN2HEX,
  });
  r({
    name: 'BIN2OCT',
    category: 'engineering',
    description: 'Binary to octal',
    minArgs: 1,
    maxArgs: 1,
    impl: BIN2OCT,
  });
  r({
    name: 'HEX2BIN',
    category: 'engineering',
    description: 'Hex to binary',
    minArgs: 1,
    maxArgs: 1,
    impl: HEX2BIN,
  });
  r({
    name: 'HEX2OCT',
    category: 'engineering',
    description: 'Hex to octal',
    minArgs: 1,
    maxArgs: 1,
    impl: HEX2OCT,
  });
  r({
    name: 'OCT2BIN',
    category: 'engineering',
    description: 'Octal to binary',
    minArgs: 1,
    maxArgs: 1,
    impl: OCT2BIN,
  });
  r({
    name: 'OCT2HEX',
    category: 'engineering',
    description: 'Octal to hex',
    minArgs: 1,
    maxArgs: 1,
    impl: OCT2HEX,
  });
  r({
    name: 'DELTA',
    category: 'engineering',
    description: 'Kronecker delta',
    minArgs: 2,
    maxArgs: 2,
    impl: DELTA,
  });
  r({
    name: 'GESTEP',
    category: 'engineering',
    description: 'Greater than or equal to step',
    minArgs: 1,
    maxArgs: 2,
    impl: GESTEP,
  });
  r({
    name: 'ERF',
    category: 'engineering',
    description: 'Error function',
    minArgs: 1,
    maxArgs: 1,
    impl: ERF,
  });
  r({
    name: 'ERFC',
    category: 'engineering',
    description: 'Complementary error function',
    minArgs: 1,
    maxArgs: 1,
    impl: ERFC,
  });
  r({
    name: 'CONVERT',
    category: 'engineering',
    description: 'Unit conversion',
    minArgs: 3,
    maxArgs: 3,
    impl: CONVERT,
  });
  r({
    name: 'COMPLEX',
    category: 'engineering',
    description: 'Create complex number',
    minArgs: 2,
    maxArgs: 3,
    impl: (real: number, imag: number) => real + imag * 0.001,
  });
  r({
    name: 'IMAGINARY',
    category: 'engineering',
    description: 'Imaginary part',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => (v % 1) * 1000,
  });
  r({
    name: 'IMREAL',
    category: 'engineering',
    description: 'Real part',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.floor(v),
  });
  r({
    name: 'IMABS',
    category: 'engineering',
    description: 'Absolute value of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => {
      const r = Math.floor(v),
        i = (v % 1) * 1000;
      return Math.sqrt(r * r + i * i);
    },
  });
  r({
    name: 'IMCONJUGATE',
    category: 'engineering',
    description: 'Complex conjugate',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => {
      const r = Math.floor(v),
        i = (v % 1) * 1000;
      return r + -i * 0.001;
    },
  });
  r({
    name: 'IMCOS',
    category: 'engineering',
    description: 'Cosine of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.cos(v),
  });
  r({
    name: 'IMSIN',
    category: 'engineering',
    description: 'Sine of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.sin(v),
  });
  r({
    name: 'IMSQRT',
    category: 'engineering',
    description: 'Square root of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.sqrt(Math.abs(v)),
  });
  r({
    name: 'IMSUM',
    category: 'engineering',
    description: 'Sum of complex',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => args.filter((x) => !isNaN(x)).reduce((s, x) => s + x, 0),
  });
  r({
    name: 'IMSUB',
    category: 'engineering',
    description: 'Difference of complex',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) => a - b,
  });
  r({
    name: 'IMPRODUCT',
    category: 'engineering',
    description: 'Product of complex',
    minArgs: 1,
    maxArgs: -1,
    impl: (...args: number[]) => {
      const valid = args.filter((x) => !isNaN(x));
      return valid.length === 0 ? 0 : valid.reduce((s, x) => s * x, 1);
    },
  });
  r({
    name: 'IMDIV',
    category: 'engineering',
    description: 'Division of complex',
    minArgs: 2,
    maxArgs: 2,
    impl: (a: number, b: number) =>
      b === 0 ? (a === 0 ? NaN : a > 0 ? Infinity : -Infinity) : a / b,
  });
  r({
    name: 'IMEXP',
    category: 'engineering',
    description: 'Exponential of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.exp(v),
  });
  r({
    name: 'IMLN',
    category: 'engineering',
    description: 'Natural log of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.log(Math.abs(v)),
  });
  r({
    name: 'IMLOG10',
    category: 'engineering',
    description: 'Log base 10 of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.log10(Math.abs(v)),
  });
  r({
    name: 'IMLOG2',
    category: 'engineering',
    description: 'Log base 2 of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => Math.log2(Math.abs(v)),
  });
  r({
    name: 'IMPOWER',
    category: 'engineering',
    description: 'Complex to power',
    minArgs: 2,
    maxArgs: 2,
    impl: (v: number, p: number) => Math.pow(Math.abs(v), p),
  });
  r({
    name: 'IMARGUMENT',
    category: 'engineering',
    description: 'Argument of complex',
    minArgs: 1,
    maxArgs: 1,
    impl: (v: number) => {
      const r = Math.floor(v),
        i = (v % 1) * 1000;
      return Math.atan2(i, r);
    },
  });
  r({
    name: 'DURATION',
    category: 'engineering',
    description: 'Macaulay duration (engineering)',
    minArgs: 5,
    maxArgs: 5,
    impl: (
      _settlement: number,
      _maturity: number,
      _coupon: number,
      _yld: number,
      _freq: number
    ) => {
      const n = Math.ceil(((_maturity - _settlement) / 365.25) * _freq);
      const c = _coupon / _freq;
      let num = 0,
        den = 0;
      for (let i = 1; i <= n; i++) {
        const pv = c / Math.pow(1 + _yld / _freq, i);
        num += i * pv;
        den += pv;
      }
      return num / den / _freq;
    },
  });
}
