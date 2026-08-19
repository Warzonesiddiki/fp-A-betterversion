/**
 * Layout-only scaling for bar and sparkline widths.
 *
 * NOT a money helper. These values are percentages of the widest element in a
 * chart — pure presentation geometry that never reaches a financial figure or
 * a formatter. Keeping it here stops layout arithmetic from being written
 * inline over money-named expressions, where it is indistinguishable (to a
 * reader and to the AST detector) from real financial arithmetic.
 *
 * Financial arithmetic belongs in `@/utils/money` (decimal.js). Never route a
 * currency value through this module.
 */

/** Percentage of `max` that `value` occupies, clamped to 0..100. */
export function scaleToPercent(value: number, max: number, minimum = 0): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return minimum;
  const pct = (value / max) * 100;
  if (!Number.isFinite(pct)) return minimum;
  return Math.min(100, Math.max(minimum, pct));
}
