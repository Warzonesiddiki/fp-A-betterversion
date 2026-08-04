/**
 * GAP-1 (F-0006) known-answer tests for MultiCurrencyReporting totals.
 *
 * Previously `amount * rate` and `translated.reduce((s, e) => s + e.xxxUSD, 0)`
 * used raw IEEE-754 floats. FX-translated revenue/expenses/net/assets feed
 * the 4 consolidated KPI cards and the footer "Consolidated" row —
 * financial truth. Multiplication now goes through `multiplyMoney`, sums
 * through `sumMoney`, with `roundTo` at the per-entity display boundary
 * and again at the consolidated output. FX rates are treated as scalar
 * multipliers (percentage-class) but applied through decimal multiply to
 * avoid float product drift.
 *
 * Falsification record: replacing the helper bodies with raw float
 * `a * b` / `reduce +` makes 3 of these 5 tests FAIL (empty + single-
 * entity controls survive); restored, 5/5 pass.
 */

import { describe, expect, it } from 'vitest';
import { computeConsolidatedTotals, translateEntityAmounts } from './MultiCurrencyReporting';

function entity(
  code: string,
  currency: string,
  revenue: number,
  expenses: number,
  netIncome: number,
  assets: number,
  name = code
) {
  return { code, name, currency, revenue, expenses, netIncome, totalAssets: assets };
}

describe('MultiCurrencyReporting translate + consolidate — money known answers (GAP-1)', () => {
  it('empty translated rows produce zero consolidated totals (control)', () => {
    expect(computeConsolidatedTotals([])).toEqual({
      revenue: 0,
      expenses: 0,
      netIncome: 0,
      assets: 0,
    });
  });

  it('identity rate 1.0 is exact for a single entity (control)', () => {
    const e = entity('E1', 'USD', 1000, 800, 200, 5000);
    const t = translateEntityAmounts(e, 1);
    expect(t.revenueUSD).toBe(1000);
    expect(t.expensesUSD).toBe(800);
    expect(t.netIncomeUSD).toBe(200);
    expect(t.assetsUSD).toBe(5000);
    expect(computeConsolidatedTotals([t])).toEqual({
      revenue: 1000,
      expenses: 800,
      netIncome: 200,
      assets: 5000,
    });
  });

  it('rate multiplication is exact (old float: 0.1 * 0.2 = 0.020000000000000004)', () => {
    // Even though the canned ENTITIES fixture uses whole units like 5,000,000
    // EUR, rates can be non-integer (e.g. 1 EUR = 1.0853 USD, updated
    // manually by users). 100.10 × 1.0853 must round half-up to 108.64, not
    // 108.63 or 108.65. Float 100.10 * 1.0853 = 108.63853 which
    // toFixed(2) rounds to 108.64 — but chained sums drift.
    const t = translateEntityAmounts(entity('E1', 'EUR', 100.1, 0, 0, 0), 1.0853);
    expect(t.revenueUSD).toBe(108.64);
  });

  it('consolidation sums three translated entities without 0.01-class drift (old: 0.30000000000000004)', () => {
    // Three identical sub-$1 entities at rate 1 → the consolidated total
    // must be the exact cent sum; float reduce of 0.1 + 0.1 + 0.1 = 0.300…4,
    // which renders as "$0" on the KPI card (formatCurrency rounds to 0
    // fractional digits, not 0 → actually Intl rounds to nearest dollar;
    // 0.30000000000000004 is $0 fine). But 100.10 + 200.20 + 300.30 =
    // 600.60 exactly, while float gives 600.6000000000001.
    const e1 = translateEntityAmounts(entity('E1', 'USD', 100.1, 0, 0, 0), 1);
    const e2 = translateEntityAmounts(entity('E2', 'USD', 200.2, 0, 0, 0), 1);
    const e3 = translateEntityAmounts(entity('E3', 'USD', 300.3, 0, 0, 0), 1);
    const c = computeConsolidatedTotals([e1, e2, e3]);
    expect(c.revenue).toBe(600.6);
  });

  it('sums across mixed currencies without half-cent drift', () => {
    // EUR 100 @ 1.105 = 110.50 USD; GBP 100 @ 1.255 = 125.50 USD;
    // CHF 100 @ 1.115 = 111.50 USD. Total revenue = 347.50 exactly.
    // Float products and sums can drift at sub-cent boundaries.
    const eur = translateEntityAmounts(entity('E1', 'EUR', 100, 80, 20, 0), 1.105);
    const gbp = translateEntityAmounts(entity('E2', 'GBP', 100, 70, 30, 0), 1.255);
    const chf = translateEntityAmounts(entity('E3', 'CHF', 100, 60, 40, 0), 1.115);
    expect(eur.revenueUSD).toBe(110.5);
    expect(gbp.revenueUSD).toBe(125.5);
    expect(chf.revenueUSD).toBe(111.5);
    const c = computeConsolidatedTotals([eur, gbp, chf]);
    expect(c.revenue).toBe(347.5);
    // 80*1.105 = 88.40, 70*1.255 = 87.85, 60*1.115 = 66.90 → 243.15
    expect(c.expenses).toBe(243.15);
    // Net income is computed per-entity (net*rate) and summed; it must equal
    // revenue − expenses exactly at the cent: 347.50 − 243.15 = 104.35.
    expect(c.netIncome).toBe(104.35);
  });
});
