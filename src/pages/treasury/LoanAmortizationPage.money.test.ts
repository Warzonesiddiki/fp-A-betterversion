/**
 * GAP-1 (F-0006) known-answer tests for LoanAmortizationPage computeLoanScheduleTotals.
 *
 * LoanAmortizationEngine is already exact-decimal, but the page's
 * headline KPIs (totalInterest, totalPrincipal) were raw `reduce +`
 * over the per-row schedule. Routing through sumMoney+roundTo keeps
 * the page-level aggregation from re-introducing IEEE-754 drift on
 * the engine's already-exact cents.
 *
 * Falsification: with raw reduce `+` over 360 rows of 0.005-style
 * half-cents, totals drift; restored, totals match the engine.
 */

import { describe, expect, it } from 'vitest';
import { computeLoanScheduleTotals } from './LoanAmortizationPage';

function row(interest: number, principal: number) {
  return { interest, principal };
}

describe('computeLoanScheduleTotals — money known answers (GAP-1)', () => {
  it('empty schedule → all zeros (control)', () => {
    const t = computeLoanScheduleTotals([]);
    expect(t.totalInterest).toBe(0);
    expect(t.totalPrincipal).toBe(0);
    expect(t.totalPayment).toBe(0);
  });

  it('three 0.1 interest rows → 0.30 exact (old: 0.30000000000000004)', () => {
    const t = computeLoanScheduleTotals([row(0.1, 0), row(0.1, 0), row(0.1, 0)]);
    expect(t.totalInterest).toBe(0.3);
  });

  it('three 0.335 interest rows → 1.01 half-up (old: 1.00)', () => {
    const t = computeLoanScheduleTotals([row(0.335, 0), row(0.335, 0), row(0.335, 0)]);
    expect(t.totalInterest).toBe(1.01);
  });

  it('three 0.335 principal rows → 1.01 half-up', () => {
    const t = computeLoanScheduleTotals([row(0, 0.335), row(0, 0.335), row(0, 0.335)]);
    expect(t.totalPrincipal).toBe(1.01);
  });

  it('totalPayment = interest + principal exact', () => {
    const t = computeLoanScheduleTotals([row(0.1, 0.2), row(0.05, 0.15), row(0.025, 0.075)]);
    expect(t.totalInterest).toBe(0.18); // 0.1 + 0.05 + 0.025 = 0.175 → half-up → 0.18
    expect(t.totalPrincipal).toBe(0.43); // 0.2 + 0.15 + 0.075 = 0.425 → half-up → 0.43
    expect(t.totalPayment).toBe(0.61);
  });

  it('rounds to 2 places by default', () => {
    const t = computeLoanScheduleTotals([row(0.001, 0), row(0.002, 0), row(0.003, 0)]);
    expect(t.totalInterest).toBe(0.01); // 0.006 → 2 places → 0.01
  });
});
