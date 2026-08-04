/**
 * GAP-1 (F-0006) known-answer tests for BreakEvenEngine's residual money
 * drift.
 *
 * `calculate`/`targetProfit` were already migrated; `multiProduct` still
 * runs raw `-`, `+`, `*`, `/` over IEEE-754 doubles on currency
 * (contribution margins, weighted sums, break-even revenue, per-product
 * revenue). Sales mixes are ratios; units are counts. Each fixed input
 * asserts the exact result with `toBe`; the pre-migration float output is
 * recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { BreakEvenEngine } from './BreakEvenEngine';

describe('BreakEvenEngine — money known answers (GAP-1 / F-0006)', () => {
  it('computes multi-product contribution margins exactly (old float: 0.19999999999999996)', () => {
    const result = BreakEvenEngine.multiProduct(
      [
        { name: 'A', price: 0.1, variableCost: 0.03, salesMix: 0.6 },
        { name: 'B', price: 0.7, variableCost: 0.5, salesMix: 0.4 },
      ],
      0.6
    );

    expect(result.products[0]?.contributionMargin).toBe(0.07);
    expect(result.products[1]?.contributionMargin).toBe(0.2);
    // Old float: 0.07 × 0.6 + 0.19999999999999996 × 0.4 = 0.122.
    expect(result.weightedContributionMargin).toBe(0.12);
  });

  it('computes break-even revenue exactly (old float: 1.6721311475409835)', () => {
    const result = BreakEvenEngine.multiProduct(
      [
        { name: 'A', price: 0.1, variableCost: 0.03, salesMix: 0.6 },
        { name: 'B', price: 0.7, variableCost: 0.5, salesMix: 0.4 },
      ],
      0.6
    );

    // 0.6 / (0.12 / 0.34) = 1.7 exactly.
    expect(result.breakEvenRevenue).toBe(1.7);
    expect(result.breakEvenByProduct[0]?.revenue).toBe(1.02);
    expect(result.breakEvenByProduct[0]?.units).toBe(10.2);
    expect(result.breakEvenByProduct[1]?.revenue).toBe(0.68);
  });

  it('returns an empty invalid result when weighted contribution is zero (control)', () => {
    const result = BreakEvenEngine.multiProduct(
      [{ name: 'A', price: 0.1, variableCost: 0.1, salesMix: 1 }],
      0.6
    );

    expect(result.valid).toBe(false);
    expect(result.weightedContributionMargin).toBe(0);
    expect(result.breakEvenByProduct).toEqual([]);
  });
});
