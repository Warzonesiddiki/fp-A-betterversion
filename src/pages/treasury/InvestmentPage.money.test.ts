/**
 * GAP-1 (F-0006) known-answer tests for InvestmentPage computeInvestmentTotals.
 *
 * Portfolio total value uses sumMoney/roundTo. weightedYield numerator
 * (yield × value) also uses sumMoney for exact aggregation, then divides
 * as a percentage ratio.
 */

import { describe, expect, it } from 'vitest';
import { computeInvestmentTotals } from './InvestmentPage';

describe('computeInvestmentTotals — money known answers (GAP-1)', () => {
  it('empty investments → zeros (control)', () => {
    const t = computeInvestmentTotals([]);
    expect(t.totalValue).toBe(0);
    expect(t.weightedYield).toBe(0);
  });

  it('0.1 + 0.2 value equals 0.3 exactly (old: 0.30000000000000004)', () => {
    const t = computeInvestmentTotals([
      { value: 0.1, yield: 5 },
      { value: 0.2, yield: 5 },
    ]);
    expect(t.totalValue).toBe(0.3);
  });

  it('three 0.335 values round half-up to 1.01', () => {
    const t = computeInvestmentTotals([
      { value: 0.335, yield: 3 },
      { value: 0.335, yield: 3 },
      { value: 0.335, yield: 3 },
    ]);
    expect(t.totalValue).toBe(1.01);
  });

  it('weighted yield computed exactly for even weights', () => {
    const t = computeInvestmentTotals([
      { value: 1000, yield: 4.0 },
      { value: 1000, yield: 6.0 },
    ]);
    // (4*1000 + 6*1000) / 2000 = 5
    expect(t.weightedYield).toBe(5);
  });

  it('weighted yield with float-prone inputs is exact', () => {
    const t = computeInvestmentTotals([
      { value: 0.1, yield: 10 },
      { value: 0.2, yield: 10 },
    ]);
    // numerator = 10*0.1 + 10*0.2 = 3, denominator = 0.3, yield = 10
    expect(t.weightedYield).toBe(10);
  });

  it('single investment → value and yield passthrough', () => {
    const t = computeInvestmentTotals([{ value: 5000, yield: 4.25 }]);
    expect(t.totalValue).toBe(5000);
    expect(t.weightedYield).toBe(4.25);
  });
});
