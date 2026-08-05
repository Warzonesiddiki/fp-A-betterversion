/**
 * GAP-1 (F-0006) known-answer tests for CapExDashboard computeCapExTotals.
 *
 * totalBudget / totalActual were raw reduce `+`; totalVariance was a - b.
 * Routing through sumMoney/subtractMoney+roundTo keeps the dashboard
 * totals exact to the cent and prevents utilization pct drift.
 *
 * Falsification: under raw reduce `+`, 0.1+0.2 = 0.30000000000000004,
 * 0.1+0.1+0.1 ≠ 0.3; under subtractMoney, 100.10 − 99.90 = 0.2 exact.
 */

import { describe, expect, it } from 'vitest';
import {
  computeCapExTotals,
  projectVarianceLike,
  sumGLCapexMovement,
  type CapExProjectLike,
} from './CapExDashboard';

function p(budget: number, actual: number): CapExProjectLike {
  return { budget, actual };
}

describe('computeCapExTotals — money known answers (GAP-1)', () => {
  it('empty project list → all zeros (control)', () => {
    const t = computeCapExTotals([]);
    expect(t.totalBudget).toBe(0);
    expect(t.totalActual).toBe(0);
    expect(t.totalVariance).toBe(0);
    expect(t.budgetUtilization).toBe(0);
  });

  it('three 0.1-budget projects → 0.30 exact (old: 0.30000000000000004)', () => {
    const t = computeCapExTotals([p(0.1, 0), p(0.1, 0), p(0.1, 0)]);
    expect(t.totalBudget).toBe(0.3);
  });

  it('three 0.335-budget projects → 1.01 half-up (old: 1.00)', () => {
    const t = computeCapExTotals([p(0.335, 0), p(0.335, 0), p(0.335, 0)]);
    expect(t.totalBudget).toBe(1.01);
  });

  it('variance = budget − actual exact (100.10 − 99.90 = 0.20)', () => {
    const t = computeCapExTotals([p(100.1, 99.9)]);
    expect(t.totalBudget).toBe(100.1);
    expect(t.totalActual).toBe(99.9);
    expect(t.totalVariance).toBe(0.2);
  });

  it('variance on 0.1-budget, 0.05-actual = 0.05 exact', () => {
    const t = computeCapExTotals([p(0.1, 0.05)]);
    expect(t.totalVariance).toBe(0.05);
  });

  it('budgetUtilization: actual/budget × 100 on 50 of 200 = 25%', () => {
    const t = computeCapExTotals([p(200, 50)]);
    expect(t.budgetUtilization).toBe(25);
  });

  it('budgetUtilization on 0.1 actual of 0.3 budget = 33.33%', () => {
    const t = computeCapExTotals([p(0.1, 0.1), p(0.1, 0.1), p(0.1, 0.1), p(0.1, 0)]);
    expect(t.totalBudget).toBe(0.4);
    expect(t.totalActual).toBe(0.3);
    // 0.3 / 0.4 * 100 = 75
    expect(t.budgetUtilization).toBe(75);
  });
});

describe('projectVarianceLike — money known answers (GAP-1)', () => {
  it('budget 100.10 − actual 99.90 = 0.20 exact', () => {
    expect(projectVarianceLike(p(100.1, 99.9))).toBe(0.2);
  });

  it('zero budget, zero actual = 0', () => {
    expect(projectVarianceLike(p(0, 0))).toBe(0);
  });

  it('overspend: budget 100, actual 150 → −50 exact', () => {
    expect(projectVarianceLike(p(100, 150))).toBe(-50);
  });
});

describe('sumGLCapexMovement — money known answers (GAP-1)', () => {
  it('empty entries → 0 (control)', () => {
    expect(sumGLCapexMovement([])).toBe(0);
  });

  it('three 0.1-debit CapEx entries → 0.30 exact (old: 0.30000000000000004)', () => {
    const entries = [
      { accountCode: '1410', debit: 0.1, credit: 0 },
      { accountCode: '1500', debit: 0.1, credit: 0 },
      { accountCode: '1700', debit: 0.1, credit: 0 },
    ];
    expect(sumGLCapexMovement(entries)).toBe(0.3);
  });

  it('non-CapEx entries (account does not start with 1) are excluded', () => {
    const entries = [
      { accountCode: '6000', debit: 500, credit: 0 }, // opex
      { accountCode: '1410', debit: 0.1, credit: 0 }, // capex
    ];
    expect(sumGLCapexMovement(entries)).toBe(0.1);
  });

  it('uses |debit − credit| (handles credits too)', () => {
    const entries = [
      { accountCode: '1410', debit: 0, credit: 0.1 }, // credit-only line
      { accountCode: '1410', debit: 0.2, credit: 0 },
    ];
    expect(sumGLCapexMovement(entries)).toBe(0.3);
  });

  it('custom prefix filters correctly', () => {
    const entries = [
      { accountCode: '1410', debit: 1, credit: 0 },
      { accountCode: '2410', debit: 1, credit: 0 },
    ];
    expect(sumGLCapexMovement(entries, '2')).toBe(1);
    expect(sumGLCapexMovement(entries, '1')).toBe(1);
  });
});
