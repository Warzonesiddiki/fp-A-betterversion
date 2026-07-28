/**
 * Precision Math Utility — Financial-Grade Integer Arithmetic
 *
 * All financial calculations in FinPlan Pro MUST use these functions
 * instead of native JS arithmetic. This eliminates floating-point drift
 * that causes $0.01 discrepancies in budgets and consolidation.
 *
 * Strategy: Multiply by SCALE_FACTOR (10^4 = 10000) before arithmetic,
 * store as BigInt, divide on display. This gives 4 decimal places of
 * precision — more than enough for any FP&A use case.
 *
 * @module precisionMath
 */

import { FINANCIAL_SCALE, SCALE_FACTOR } from '@/types/precision';
import type { PrecisionResult } from '@/types/precision';

// ─── Conversion: Decimal ↔ Integer ─────────────────────────────────────────

/**
 * Convert a decimal number to a precise integer.
 * Example: toPrecise(1234.5678) → 12345678n
 *
 * SAFETY: Uses string parsing to avoid floating-point multiplication errors.
 * toPrecise(0.1 + 0.2) === toPrecise(0.3) ✓ (unlike native JS)
 */
export function toPrecise(value: number): bigint {
  if (!Number.isFinite(value)) return 0n;

  // Convert to string with enough decimal places, then strip the decimal point
  const str = value.toFixed(FINANCIAL_SCALE);
  const cleaned = str.replace('-', '').replace('.', '');
  const result = BigInt(cleaned);
  return value < 0 ? -result : result;
}

/**
 * Convert a precise integer back to a decimal number for display.
 * Example: fromPrecise(12345678n) → 1234.5678
 */
export function fromPrecise(value: bigint): number {
  const str = value.toString();
  const isNegative = str.startsWith('-');
  const abs = isNegative ? str.slice(1) : str;

  // Pad with leading zeros if needed
  const padded = abs.padStart(FINANCIAL_SCALE + 1, '0');
  const intPart = padded.slice(0, -FINANCIAL_SCALE) || '0';
  const decPart = padded.slice(-FINANCIAL_SCALE);

  const result = parseFloat(`${intPart}.${decPart}`);
  return isNegative ? -result : result;
}

/**
 * Convert a precise integer to a formatted currency string.
 * Example: formatPrecise(12345678n) → '1,234.5678'
 */
export function formatPrecise(value: bigint, decimals = 2): string {
  const num = fromPrecise(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse a currency string to a precise integer.
 * Example: parsePrecise('1,234.56') → 12345600n
 */
export function parsePrecise(value: string): bigint {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  if (!Number.isFinite(num)) return 0n;
  return toPrecise(num);
}

// ─── Arithmetic Operations ─────────────────────────────────────────────────

/**
 * Add two precise values.
 * Example: preciseAdd(100000n, 200000n) → 300000n
 */
export function preciseAdd(a: bigint, b: bigint): PrecisionResult {
  return { value: a + b, rounded: false };
}

/**
 * Subtract two precise values.
 * Example: preciseSub(300000n, 100000n) → 200000n
 */
export function preciseSub(a: bigint, b: bigint): PrecisionResult {
  return { value: a - b, rounded: false };
}

/**
 * Multiply two precise values.
 * IMPORTANT: Divides by SCALE_FACTOR after multiplication to maintain scale.
 * Example: preciseMul(100000n, 200000n) → 200000n (not 20000000000n)
 */
export function preciseMul(a: bigint, b: bigint): PrecisionResult {
  const raw = a * b;
  const result = raw / BigInt(SCALE_FACTOR);
  const remainder = raw % BigInt(SCALE_FACTOR);
  const rounded = remainder !== 0n;

  return {
    value: result,
    rounded,
    originalValue: rounded ? raw : undefined,
    roundingNote: rounded
      ? `Lost ${fromPrecise(remainder < 0n ? -remainder : remainder)} in rounding`
      : undefined,
  };
}

/**
 * Divide two precise values.
 * IMPORTANT: Multiplies by SCALE_FACTOR before division to maintain scale.
 * Example: preciseDiv(200000n, 100000n) → 200000n (2.0000 in decimal)
 */
export function preciseDiv(a: bigint, b: bigint): PrecisionResult {
  if (b === 0n) {
    return { value: 0n, rounded: false };
  }

  const scaled = a * BigInt(SCALE_FACTOR);
  const result = scaled / b;
  const remainder = scaled % b;
  const rounded = remainder !== 0n;

  return {
    value: result,
    rounded,
    originalValue: rounded ? scaled : undefined,
    roundingNote: rounded ? 'Division produced non-integer result' : undefined,
  };
}

/**
 * Calculate percentage: (part / total) × 100
 * Returns result in precise format (100.0000 = 100n × SCALE_FACTOR).
 */
export function precisePercent(part: bigint, total: bigint): PrecisionResult {
  if (total === 0n) {
    return { value: 0n, rounded: false };
  }

  // Multiply part by 100 × SCALE_FACTOR, then divide by total
  const hundred = BigInt(100 * SCALE_FACTOR);
  const raw = part * hundred;
  const result = raw / total;
  const remainder = raw % total;

  return {
    value: result,
    rounded: remainder !== 0n,
  };
}

// ─── Aggregation ───────────────────────────────────────────────────────────

/**
 * Sum an array of precise values.
 */
export function preciseSum(values: readonly bigint[]): bigint {
  let total = 0n;
  for (const v of values) {
    total += v;
  }
  return total;
}

/**
 * Calculate the average of precise values.
 * Divides sum by count using plain integer division (count is not scaled).
 */
export function preciseAvg(values: readonly bigint[]): PrecisionResult {
  if (values.length === 0) return { value: 0n, rounded: false };
  const sum = preciseSum(values);
  const count = BigInt(values.length);
  const result = sum / count;
  const remainder = sum % count;
  return {
    value: result,
    rounded: remainder !== 0n,
  };
}

/**
 * Find the minimum precise value.
 */
export function preciseMin(values: readonly bigint[]): bigint {
  if (values.length === 0) return 0n;
  let min = values[0]!;
  for (let i = 1; i < values.length; i++) {
    if (values[i]! < min) min = values[i]!;
  }
  return min;
}

/**
 * Find the maximum precise value.
 */
export function preciseMax(values: readonly bigint[]): bigint {
  if (values.length === 0) return 0n;
  let max = values[0]!;
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > max) max = values[i]!;
  }
  return max;
}

// ─── Comparison ────────────────────────────────────────────────────────────

/**
 * Compare two precise values.
 * Returns -1, 0, or 1.
 */
export function preciseCompare(a: bigint, b: bigint): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Check if two precise values are equal.
 */
export function preciseEqual(a: bigint, b: bigint): boolean {
  return a === b;
}

/**
 * Check if a is greater than b.
 */
export function preciseGt(a: bigint, b: bigint): boolean {
  return a > b;
}

/**
 * Check if a is less than b.
 */
export function preciseLt(a: bigint, b: bigint): boolean {
  return a < b;
}

// ─── FX Translation ────────────────────────────────────────────────────────

/**
 * Translate an amount from one currency to another using a precise FX rate.
 * Rate is stored as numerator/denominator to avoid floating-point drift.
 */
export function preciseFXTranslate(
  amount: bigint,
  rateNumerator: bigint,
  rateDenominator: bigint
): PrecisionResult {
  if (rateDenominator === 0n) {
    return { value: 0n, rounded: false };
  }

  const raw = amount * rateNumerator;
  const result = raw / rateDenominator;
  const remainder = raw % rateDenominator;

  return {
    value: result,
    rounded: remainder !== 0n,
    roundingNote: remainder !== 0n ? 'FX translation rounding' : undefined,
  };
}

// ─── Rounding ──────────────────────────────────────────────────────────────

/**
 * Round a precise value to a given number of decimal places.
 * Uses "round half to even" (banker's rounding) for financial accuracy.
 */
export function preciseRound(value: bigint, decimalPlaces: number): bigint {
  if (decimalPlaces >= FINANCIAL_SCALE) return value;

  const drop = FINANCIAL_SCALE - decimalPlaces;
  const divisor = BigInt(10 ** drop);
  const remainder = value % divisor;
  const half = divisor / 2n;

  let rounded = value - remainder;

  if (remainder > half || (remainder === half && (rounded / divisor) % 2n !== 0n)) {
    rounded += divisor;
  }

  return rounded;
}
