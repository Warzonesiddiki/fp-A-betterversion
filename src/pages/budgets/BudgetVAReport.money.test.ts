/**
 * GAP-1 (F-0006) known-answer tests for BudgetVAReport money arithmetic.
 *
 * BudgetVAReport doesn't export a standalone compute function (it's tightly
 * coupled to React state via budgetStore/glStore). Instead we verify the
 * money primitive helpers produce exact results for the patterns used:
 * toDecimal accumulation for actuals, subtractMoney for variance,
 * sumMoney for totals, toDecimal for pie-chart favorable/unfavorable.
 */

import { describe, expect, it } from 'vitest';
import { sumMoney, subtractMoney, roundTo, toDecimal } from '@/utils/money';

describe('BudgetVAReport money patterns — known answers (GAP-1)', () => {
  it('actuals accumulation: credit - debit with 0.1+0.2 = 0.3 exact', () => {
    let acc = toDecimal(0);
    acc = acc.plus(toDecimal(0.1).minus(toDecimal(0)));
    acc = acc.plus(toDecimal(0.2).minus(toDecimal(0)));
    expect(roundTo(acc, 2)).toBe(0.3);
  });

  it('expense actuals: debit - credit exact', () => {
    let acc = toDecimal(0);
    acc = acc.plus(toDecimal(100).minus(toDecimal(0)));
    acc = acc.plus(toDecimal(0.1).minus(toDecimal(0)));
    acc = acc.plus(toDecimal(0.2).minus(toDecimal(0)));
    expect(roundTo(acc, 2)).toBe(100.3);
  });

  it('variance = actual - budget exact', () => {
    const actual = 100.3;
    const budget = 100;
    const variance = roundTo(subtractMoney(actual, budget), 2);
    expect(variance).toBe(0.3);
  });

  it('totals: sumMoney on budget/actual/variance arrays', () => {
    expect(roundTo(sumMoney([0.1, 0.2]), 2)).toBe(0.3);
    expect(roundTo(sumMoney([100.55, 200.45]), 2)).toBe(301);
  });

  it('otherVariance: sumMoney on sliced variance array exact', () => {
    const variances = [0.1, 0.2, -0.05, 0.15, 0.3, -0.1, 0.05];
    const otherVariance = roundTo(sumMoney(variances.slice(5)), 2);
    expect(otherVariance).toBe(-0.05);
  });

  it('pie chart: favorable/unfavorable via toDecimal accumulation', () => {
    const items = [
      { budget: 100, actual: 90 }, // favorable: 10
      { budget: 50, actual: 60 }, // unfavorable: 10
      { budget: 0.1, actual: 0 }, // favorable: 0.1
      { budget: 0, actual: 0.2 }, // unfavorable: 0.2
    ];
    let favorable = toDecimal(0);
    let unfavorable = toDecimal(0);
    for (const d of items) {
      const variance = toDecimal(d.budget).minus(toDecimal(d.actual));
      if (variance.greaterThanOrEqualTo(0)) {
        favorable = favorable.plus(variance);
      } else {
        unfavorable = unfavorable.plus(variance.abs());
      }
    }
    expect(roundTo(favorable, 2)).toBe(10.1);
    expect(roundTo(unfavorable, 2)).toBe(10.2);
  });

  it('three 0.335 actuals accumulate to 1.01 (half-up)', () => {
    let acc = toDecimal(0);
    for (let i = 0; i < 3; i++) acc = acc.plus(toDecimal(0.335));
    expect(roundTo(acc, 2)).toBe(1.01);
  });
});
