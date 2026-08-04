/**
 * GAP-1 (F-0006) known-answer tests for CashForecastPage cash totals.
 */

import { describe, expect, it } from 'vitest';
import {
  buildCashCategorySplit,
  burnRateMonthly,
  computeCashTotals,
  type CashNetEntry,
} from './CashForecastPage';

function e(d: number, c: number): CashNetEntry {
  return { debit: d, credit: c };
}

describe('CashForecastPage totals — money known answers (GAP-1)', () => {
  it('empty entries → zero summary (control)', () => {
    expect(computeCashTotals([])).toEqual({ inflows: 0, outflows: 0, net: 0 });
  });

  it('three 0.1 inflows / one 0.3 outflow balance exactly (old: 0.30000000000000004 drift)', () => {
    const s = computeCashTotals([e(0.1, 0), e(0.1, 0), e(0.1, 0), e(0, 0.3)]);
    expect(s.inflows).toBe(0.3);
    expect(s.outflows).toBe(0.3);
    expect(s.net).toBe(0);
  });

  it('category splits allocate to the cent and sum back to inflows/outflows exactly', () => {
    const s = computeCashTotals([e(100, 0), e(200.2, 0), e(0, 120.12)]);
    expect(s.inflows).toBe(300.2);
    expect(s.outflows).toBe(120.12);
    expect(s.net).toBe(180.08);
    const cats = buildCashCategorySplit(s);
    // inflow splits: rev + otherInc should == inflows (we used residual for otherInc)
    const inSum = cats.reduce((a, c) => a + c.inflows, 0);
    const outSum = cats.reduce((a, c) => a + c.outflows, 0);
    const netSum = cats.reduce((a, c) => a + c.net, 0);
    expect(inSum).toBeCloseTo(s.inflows, 10);
    expect(outSum).toBeCloseTo(s.outflows, 10);
    expect(netSum).toBeCloseTo(s.net, 10);
    // Use exact toBe where cent-precise:
    expect(cats[0]!.inflows).toBe(210.14); // 300.20 * 0.7 = 210.14
    expect(cats[1]!.inflows).toBe(90.06); // residual: 300.20 - 210.14 = 90.06
  });

  it('three 0.335 inflows round half-up to 1.01 (old: 1.00)', () => {
    const s = computeCashTotals([e(0.335, 0), e(0.335, 0), e(0.335, 0)]);
    expect(s.inflows).toBe(1.01);
  });

  it('burnRateMonthly divides by 4 exactly: 1200 → 300; 0.3 → 0.08 (rounds 0.075 half-up)', () => {
    expect(burnRateMonthly(1200)).toBe(300);
    // 0.30 / 4 = 0.075 → half-up → 0.08 (banker's rounding of Number.toFixed is NOT used; Decimal half-up rounds 0.075 to 0.08)
    expect(burnRateMonthly(0.3)).toBe(0.08);
  });
});
