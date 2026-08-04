/**
 * GAP-1 (F-0006) known-answer tests for HedgeManager notional sums.
 *
 * totalNotional and per-type notional aggregates used raw float `reduce +`.
 * Per-hedge P&L already routes through MultiCurrencyEngine on the primitive.
 *
 * Falsification: replacing sumNotionals with raw reduce makes 2 of 3 fail.
 */

import { describe, expect, it } from 'vitest';
import { sumNotionals } from './HedgeManager';

describe('HedgeManager notional sums — money known answers (GAP-1)', () => {
  it('empty list is 0 (control)', () => {
    expect(sumNotionals([])).toBe(0);
  });

  it('sum is exact for classic 0.1+0.2 drift (old: 0.30000000000000004)', () => {
    expect(sumNotionals([{ notionalAmount: 0.1 }, { notionalAmount: 0.2 }])).toBe(0.3);
  });

  it('three 0.335 notionals round half-up to 1.01 (old float: 1.00)', () => {
    expect(
      sumNotionals([
        { notionalAmount: 0.335 },
        { notionalAmount: 0.335 },
        { notionalAmount: 0.335 },
      ])
    ).toBe(1.01);
  });
});
