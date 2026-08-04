/**
 * GAP-1 (F-0006) known-answer tests for SpreadEngine's money migration.
 *
 * Annual budget amounts distributed across periods (even / front-loaded /
 * back-loaded / seasonal / driver-based / custom), the applied line-item
 * total, and roundToTotal's cent quantization all operate on currency
 * amounts — previously raw `*`, `/`, `+`, and `Math.round` over IEEE-754
 * doubles. Period counts, weights, driver values, and percentages are
 * unitless ratios/counts, not money. Each fixed input asserts the exact
 * result with `toBe`; the pre-migration IEEE-754 output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { SpreadEngine } from './SpreadEngine';

describe('SpreadEngine — money known answers (GAP-1 / F-0006)', () => {
  it('spreads seasonal amounts exactly (old float: 0.30000000000000004)', () => {
    const result = SpreadEngine.seasonal(0.9, [0.3, 0.3, 0.3]);

    expect(result[0]).toBe(0.3);
    expect(result[1]).toBe(0.3);
    expect(result[2]).toBe(0.3);
  });

  it('normalizes seasonal weights exactly (old float: 0.049999999999999996 / 0.09999999999999999 / 0.14999999999999997)', () => {
    const result = SpreadEngine.seasonal(0.3, [0.1, 0.2, 0.3]);

    expect(result[0]).toBe(0.05);
    expect(result[1]).toBe(0.1);
    expect(result[2]).toBe(0.15);
  });

  it('front-loads amounts with exact decimal products (old float: 0.034999999999999996 / 0.022000000000000002)', () => {
    const result = SpreadEngine.frontLoaded(0.1, 4);

    expect(result[0]).toBe(0.035);
    expect(result[1]).toBe(0.025);
    expect(result[2]).toBe(0.022);
    expect(result[3]).toBe(0.018);
  });

  it('distributes custom percentages exactly (old float: 0.010000000000000002 / 0.020000000000000004 / 0.04000000000000001)', () => {
    const result = SpreadEngine.custom(0.1, [0.1, 0.2, 0.3, 0.4]);

    expect(result[0]).toBe(0.01);
    expect(result[1]).toBe(0.02);
    expect(result[2]).toBe(0.03);
    expect(result[3]).toBe(0.04);
  });

  it('sums the applied line-item total exactly (old float: 0.9000000000000001)', () => {
    const applied = SpreadEngine.applyToLineItem(
      { id: 'b1', annualAmount: 0.9 },
      { method: 'seasonal', periods: 3, weights: [0.3, 0.3, 0.3] }
    );

    expect(applied.amounts).toEqual([0.3, 0.3, 0.3]);
    expect(applied.total).toBe(0.9);
  });

  it('divides even spreads with decimal precision (control: 0.03333333333333333)', () => {
    const result = SpreadEngine.even(0.1, 3);

    expect(result[0]).toBe(0.03333333333333333);
    expect(result[1]).toBe(0.03333333333333333);
    expect(result[2]).toBe(0.03333333333333333);
  });

  it('cent-rounds positive amounts preserving the total (control: 33.33/33.33/33.34)', () => {
    const result = SpreadEngine.roundToTotal([33.333, 33.333, 33.334], 100);

    expect(result).toEqual([33.33, 33.33, 33.34]);
    expect(result.reduce((s, a) => s + a, 0)).toBe(100);
  });

  it('cent-rounds negative amounts with declared half-up, not Math.round (old float: [-0.05, -0.060000000000000005])', () => {
    // -0.055 half-up to cents is -0.06 (half away from zero); the old
    // Math.round path rounded half toward +∞ to -0.05 and mis-distributed
    // the residual across the parts.
    const result = SpreadEngine.roundToTotal([-0.055, -0.055], -0.11);

    expect(result).toEqual([-0.06, -0.05]);
    expect(result.reduce((s, a) => s + a, 0)).toBe(-0.11);
  });
});
