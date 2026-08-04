/**
 * GAP-1 (F-0006) known-answer tests for ICReconciliationReport totals.
 *
 * Near-duplicate surface to ICReconciliation.tsx but the report variant
 * lives in src/components/ui. Same raw-float reduce on balanceA/balanceB/
 * difference migrated to sumMoney+roundTo. Percentages stay float.
 *
 * Falsification: with helper bodies reverted to raw reduce, 3 of 5 tests
 * FAIL; restored, 5/5 pass.
 */

import { describe, expect, it } from 'vitest';
import {
  computeICReportGrandTotalDifference,
  computeICReportTotals,
} from './ICReconciliationReport';
import type { ReconciliationLine } from '@/engines/ICMatchingEngine';

function line(
  balanceA: number,
  balanceB: number,
  difference: number,
  percentageDifference = 0
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

describe('ICReconciliationReport totals — money known answers (GAP-1)', () => {
  it('empty returns zeros (control)', () => {
    expect(computeICReportTotals([])).toEqual({
      totalBalanceA: 0,
      totalBalanceB: 0,
      totalDifference: 0,
      avgPercentageDifference: 0,
    });
    expect(computeICReportGrandTotalDifference([])).toBe(0);
  });

  it('footer totals are exact (old float: 0.1 + 0.2 = 0.30000000000000004)', () => {
    const rows = [line(0.1, 0.1, 0), line(0.2, 0.2, 0), line(0, 0, 0)];
    const t = computeICReportTotals(rows);
    expect(t.totalBalanceA).toBe(0.3);
    expect(t.totalBalanceB).toBe(0.3);
    expect(t.totalDifference).toBe(0);
  });

  it('grand total differences sum exactly across the report', () => {
    // Six 0.01..0.10 differences = 0.25 total.
    const diffs = [0.01, 0.02, 0.03, 0.04, 0.05, 0.1];
    expect(computeICReportGrandTotalDifference(diffs.map((d) => line(0, 0, d)))).toBe(0.25);
  });

  it('three 0.335 differences round half-up to 1.01 (old float: 1.00)', () => {
    const t = computeICReportTotals([
      line(0.335, 0, 0.335),
      line(0.335, 0, 0.335),
      line(0.335, 0, 0.335),
    ]);
    expect(t.totalBalanceA).toBe(1.01);
    expect(t.totalDifference).toBe(1.01);
  });

  it('avg percentage is arithmetic mean (documented non-money, control)', () => {
    const t = computeICReportTotals([line(0, 0, 0, 1.5), line(0, 0, 0, 2.5), line(0, 0, 0, 5.0)]);
    expect(t.avgPercentageDifference).toBeCloseTo(3.0, 10);
  });
});
