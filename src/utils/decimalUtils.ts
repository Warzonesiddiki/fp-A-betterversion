// @money-ast-allow Reason: Rounding-residual arithmetic: targetTotal - sum operates on pre-rounded numbers in a largest-remainder allocator
import { formatMoney } from './money';

const EPSILON = 1e-9;

/**
 * Round to 2 decimal places (cents).
 * Sign-aware so negative values like -1.005 round to -1.01 (away from zero
 * on the .5 boundary), not -1.00 as `Math.round` would do in IEEE-754.
 */
export function roundToCents(value: number): number {
  if (value >= 0) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  return -Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Round to `decimals` decimal places, sign-aware (see roundToCents).
 */
export function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  if (value >= 0) {
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
  return -Math.round((Math.abs(value) + Number.EPSILON) * factor) / factor;
}

export function safeMultiply(a: number, b: number, decimals: number = 2): number {
  return roundToDecimals(a * b, decimals);
}

export function safeDivide(numerator: number, denominator: number, decimals: number = 2): number {
  if (denominator === 0) return 0;
  return roundToDecimals(numerator / denominator, decimals);
}

export function areClose(a: number, b: number, tolerance: number = EPSILON): boolean {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Distribute rounding so the sum of `amounts` matches `targetTotal`.
 * Each amount is first rounded to `decimals` places, then the difference
 * between the sum and the target is absorbed into the first element at
 * higher precision (decimals + 6) so the total is preserved exactly.
 * This handles cases where the target is not a whole multiple of the
 * rounding step (e.g. roundToTotal([0.125, 0.125, 0.125], 0.375) returns
 * [0.115, 0.13, 0.13] summing to 0.375).
 */
export function roundToTotal(
  amounts: number[],
  targetTotal: number,
  decimals: number = 2
): number[] {
  const rounded = amounts.map((a) => roundToDecimals(a, decimals));
  const sum = rounded.reduce((s, v) => s + v, 0);
  const diff = targetTotal - sum;
  if (Math.abs(diff) < 1e-10) return rounded;
  const higherFactor = 10 ** (decimals + 6);
  const adjusted = [...rounded];
  adjusted[0] = Math.round((rounded[0]! + diff) * higherFactor) / higherFactor;
  return adjusted;
}

export function toFixedSafe(value: number, decimals: number): string {
  return formatMoney(value, { places: decimals });
}

export function parseFinite(value: string, fallback: number = 0): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}
