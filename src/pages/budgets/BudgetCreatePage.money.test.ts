/**
 * GAP-1 (F-0006) known-answer tests for BudgetCreatePage sumMonthlyAmounts.
 *
 * The BudgetCreate wizard sums 12 monthly cells into a per-account
 * annual total. The original implementation was raw `reduce +` over
 * the monthly cells, which drifts on 0.1+0.2-style inputs.
 *
 * Falsification: under raw reduce `+`, 0.1+0.2 = 0.30000000000000004.
 * Restored to sumMoney+roundTo, the 12-month sum is exact to 2 places.
 */

import { describe, expect, it } from 'vitest';
import { sumMonthlyAmounts } from './BudgetCreatePage';

describe('sumMonthlyAmounts — money known answers (GAP-1)', () => {
  it('empty months → 0 (control)', () => {
    expect(sumMonthlyAmounts([])).toBe(0);
  });

  it('all-undefined months → 0 (control)', () => {
    expect(sumMonthlyAmounts([undefined, undefined, undefined])).toBe(0);
  });

  it('twelve 0.1 cells → 1.20 exact (old: 1.2000000000000002)', () => {
    const months = Array.from({ length: 12 }, () => 0.1);
    expect(sumMonthlyAmounts(months)).toBe(1.2);
  });

  it('12 cells of 0.05/0.10 mixed → exact sum', () => {
    const months = [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6];
    // 0.05+0.1+0.15+...+0.6 = 3.9
    expect(sumMonthlyAmounts(months)).toBe(3.9);
  });

  it('three 0.335 cells round half-up to 1.01 (old: 1.00)', () => {
    expect(sumMonthlyAmounts([0.335, 0.335, 0.335])).toBe(1.01);
  });

  it('12 cells of 0.335 each → 4.02 half-up', () => {
    const months = Array.from({ length: 12 }, () => 0.335);
    expect(sumMonthlyAmounts(months)).toBe(4.02);
  });

  it('partial fill: 6 filled + 6 undefined = sum of filled only', () => {
    const months = [
      100,
      200,
      300,
      400,
      500,
      600,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ];
    expect(sumMonthlyAmounts(months)).toBe(2100);
  });
});
