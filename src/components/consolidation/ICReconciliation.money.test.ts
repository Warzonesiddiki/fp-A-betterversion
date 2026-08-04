/**
 * GAP-1 (F-0006) known-answer tests for ICReconciliation totals.
 *
 * `ICReconciliation` previously aggregated `balanceA`, `balanceB`, and
 * `difference` with raw IEEE-754 float `reduce +` / inline `+`. These
 * totals feed the "Total Differences" metric card (whose variant flips
 * between success/warning based on whether the total exceeds zero), the
 * footer totals row, and the expanded-row "Net (A+B)" figure. They are
 * financial truth and now route through the canonical money primitive
 * (sumMoney/addMoney + roundTo). The average diff-% is a percentage
 * metric (not currency) and stays float per GAP-1 exclusions.
 *
 * Falsification record: with the new helpers replaced by raw float
 * equivalents (inline reduce, `a + b`), 4 of these 6 tests FAIL
 * (empty/single clean controls survive); restored, 6/6 pass.
 */

import { describe, expect, it } from 'vitest';
import {
  computeICGrandTotalDifference,
  computeICPairNet,
  computeICTotals,
} from './ICReconciliation';
import type { ReconciliationLine } from '@/engines/ICMatchingEngine';

function line(
  balanceA: number,
  balanceB: number,
  difference: number,
  percentageDifference: number
): ReconciliationLine {
  return {
    entityA: 'A',
    entityB: 'B',
    accountCode: '1000',
    accountName: 'Cash',
    balanceA,
    balanceB,
    difference,
    percentageDifference,
    withinTolerance: difference === 0,
    matchStatus: difference === 0 ? 'matched' : 'unmatched',
  } as ReconciliationLine;
}

describe('ICReconciliation totals — money known answers (GAP-1 / F-0006)', () => {
  it('empty lines produce zero footers (control)', () => {
    expect(computeICTotals([])).toEqual({
      totalBalanceA: 0,
      totalBalanceB: 0,
      totalDifference: 0,
      avgPercentageDifference: 0,
    });
    expect(computeICGrandTotalDifference([])).toBe(0);
  });

  it('eliminates classic 0.1 + 0.2 drift on balanceA footer (old float: 0.30000000000000004)', () => {
    // Three pairs contribute 0.10, 0.20, 0.00 to balanceA → exactly 0.30.
    // Old reduce: 0.1 + 0.2 = 0.30000000000000004.
    const footers = computeICTotals([line(0.1, 0.1, 0, 0), line(0.2, 0.2, 0, 0), line(0, 0, 0, 0)]);
    expect(footers.totalBalanceA).toBe(0.3);
    expect(footers.totalBalanceB).toBe(0.3);
    expect(footers.totalDifference).toBe(0);
  });

  it('rounds three 0.335 balance contributions half-up (old float: 1.00)', () => {
    // 0.335 * 3 = 1.005 → ROUND_HALF_UP to 1.01. Float summation gives
    // 1.0049999999999998 and the footer under-reports by a cent.
    const footers = computeICTotals([
      line(0.335, 0, 0.335, 5),
      line(0.335, 0, 0.335, 5),
      line(0.335, 0, 0.335, 5),
    ]);
    expect(footers.totalBalanceA).toBe(1.01);
    expect(footers.totalDifference).toBe(1.01);
  });

  it('per-row Net (A+B) is exact (old inline: 0.1 + 0.2 = 0.30000000000000004)', () => {
    // Net (A+B) in the expanded detail row is shown to users to confirm
    // whether two sides of an IC pair offset. 0.1 ↔ -0.2 must net to -0.1
    // exactly; float renders -0.09999999999999998.
    expect(computeICPairNet({ balanceA: 0.1, balanceB: -0.2 } as ReconciliationLine)).toBe(-0.1);
    expect(computeICPairNet({ balanceA: 100.1, balanceB: 200.2 } as ReconciliationLine)).toBe(
      300.3
    );
  });

  it('grand total difference sums exact decimals across the full report', () => {
    // Six pairs with differences 0.01, 0.02, 0.03, 0.04, 0.05, 0.10 → 0.25
    // exactly. The metric-card variant is derived from this total; drift
    // cannot cross the zero boundary.
    const pairs = [0.01, 0.02, 0.03, 0.04, 0.05, 0.1].map((d) => line(d, 0, d, 1));
    expect(computeICGrandTotalDifference(pairs)).toBe(0.25);
  });

  it('avg percentage remains a float metric (documented non-money)', () => {
    // Percentages are excluded from money migration per GAP-1 policy; we
    // simply pin that it returns the simple arithmetic mean to make
    // inadvertent "fixes" visible.
    const footers = computeICTotals([line(0, 0, 0, 1.5), line(0, 0, 0, 2.5), line(0, 0, 0, 5.0)]);
    expect(footers.avgPercentageDifference).toBeCloseTo(3.0, 10);
  });
});
