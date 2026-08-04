/**
 * GAP-1 (F-0006) known-answer tests for DepreciationForecastPage totals.
 */

import { describe, expect, it } from 'vitest';
import {
  computeDeprForecastTotals,
  sumGLFixedAssetMovement,
  type DeprAssetLike,
} from './DepreciationForecastPage';

function asset(cost: number, nbv: number, annualDep: number): DeprAssetLike {
  return { cost, nbv, annualDep };
}

describe('DepreciationForecastPage totals — money known answers (GAP-1)', () => {
  it('empty asset list → zeros (control)', () => {
    const t = computeDeprForecastTotals([]);
    expect(t).toEqual({ totalCost: 0, totalNBV: 0, totalAnnualDep: 0, avgAge: 0 });
  });

  it('three 0.1-cost tiny assets → 0.30 totalCost exactly (old: 0.30000000000000004)', () => {
    const t = computeDeprForecastTotals([
      asset(0.1, 0.05, 0.01),
      asset(0.1, 0.05, 0.01),
      asset(0.1, 0.05, 0.01),
    ]);
    expect(t.totalCost).toBe(0.3);
    expect(t.totalNBV).toBe(0.15);
    expect(t.totalAnnualDep).toBe(0.03);
  });

  it('three 0.335 annual-depreciation charges → 1.01 half-up (old: 1.00)', () => {
    const t = computeDeprForecastTotals([
      asset(3.35, 3.015, 0.335),
      asset(3.35, 3.015, 0.335),
      asset(3.35, 3.015, 0.335),
    ]);
    expect(t.totalAnnualDep).toBe(1.01);
    expect(t.totalCost).toBe(10.05);
    expect(t.totalNBV).toBe(9.05); // 3*3.015 = 9.045 half-up → 9.05
  });

  it('avgAge computes correctly on simple 1-year-old assets (cost-nbv)/annualDep = 1 each → 1.0 yr average', () => {
    const t = computeDeprForecastTotals([
      asset(1000, 900, 100), // age 1
      asset(2000, 1800, 200), // age 1
    ]);
    expect(t.avgAge).toBe(1);
  });

  it('sumGLFixedAssetMovement sums |debit-credit| across 14xx/15xx exactly', () => {
    const entries = [
      { accountCode: '141', debit: 0.1, credit: 0 },
      { accountCode: '141', debit: 0.1, credit: 0 },
      { accountCode: '141', debit: 0.1, credit: 0 },
      { accountCode: '600', debit: 500, credit: 0 }, // excluded (not 14/15 prefix)
    ];
    expect(sumGLFixedAssetMovement(entries)).toBe(0.3);
  });
});
