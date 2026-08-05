/**
 * GAP-1 (F-0006) known-answer tests for GLTrialBalancePage computeTrialBalanceTotals.
 *
 * Every trial-balance total (debits, credits, beginning, net change, ending)
 * is now computed through sumMoney/subtractMoney/roundTo — no raw float reduce.
 */

import { describe, expect, it } from 'vitest';
import { computeTrialBalanceTotals } from './GLTrialBalancePage';
import type { TrialBalanceRow } from '@/types';

function makeRow(
  overrides: Partial<TrialBalanceRow> &
    Pick<TrialBalanceRow, 'debit' | 'credit' | 'beginningBalance' | 'netChange' | 'endingBalance'>
): TrialBalanceRow {
  return {
    accountId: 'a1',
    accountCode: '1000',
    accountName: 'Cash',
    accountType: 'Asset',
    beginningBalance: 0,
    debit: 0,
    credit: 0,
    netChange: 0,
    endingBalance: 0,
    ...overrides,
  };
}

describe('computeTrialBalanceTotals — money known answers (GAP-1)', () => {
  it('empty rows → all zeros (control)', () => {
    const t = computeTrialBalanceTotals([]);
    expect(t.totalDebits).toBe(0);
    expect(t.totalCredits).toBe(0);
    expect(t.diff).toBe(0);
    expect(t.isBalanced).toBe(true);
    expect(t.totalBeginningBalance).toBe(0);
    expect(t.totalNetChange).toBe(0);
    expect(t.totalEndingBalance).toBe(0);
  });

  it('0.1 + 0.2 debit equals 0.3 exactly (old: 0.30000000000000004)', () => {
    const t = computeTrialBalanceTotals([
      makeRow({ debit: 0.1, credit: 0, beginningBalance: 0, netChange: 0.1, endingBalance: 0.1 }),
      makeRow({ debit: 0.2, credit: 0, beginningBalance: 0, netChange: 0.2, endingBalance: 0.2 }),
    ]);
    expect(t.totalDebits).toBe(0.3);
    expect(t.diff).toBe(0.3);
  });

  it('balanced debits and credits → isBalanced true', () => {
    const t = computeTrialBalanceTotals([
      makeRow({ debit: 100, credit: 0, beginningBalance: 50, netChange: 100, endingBalance: 150 }),
      makeRow({
        debit: 0,
        credit: 100,
        beginningBalance: -50,
        netChange: -100,
        endingBalance: -150,
      }),
    ]);
    expect(t.totalDebits).toBe(100);
    expect(t.totalCredits).toBe(100);
    expect(t.diff).toBe(0);
    expect(t.isBalanced).toBe(true);
    expect(t.totalBeginningBalance).toBe(0);
    expect(t.totalNetChange).toBe(0);
    expect(t.totalEndingBalance).toBe(0);
  });

  it('three 0.335 debits round half-up to 1.01', () => {
    const t = computeTrialBalanceTotals([
      makeRow({
        debit: 0.335,
        credit: 0,
        beginningBalance: 0,
        netChange: 0.335,
        endingBalance: 0.335,
      }),
      makeRow({
        debit: 0.335,
        credit: 0,
        beginningBalance: 0,
        netChange: 0.335,
        endingBalance: 0.335,
      }),
      makeRow({
        debit: 0.335,
        credit: 0,
        beginningBalance: 0,
        netChange: 0.335,
        endingBalance: 0.335,
      }),
    ]);
    expect(t.totalDebits).toBe(1.01);
  });

  it('imbalanced → diff and isBalanced false', () => {
    const t = computeTrialBalanceTotals([
      makeRow({
        debit: 100.55,
        credit: 0,
        beginningBalance: 0,
        netChange: 100.55,
        endingBalance: 100.55,
      }),
      makeRow({ debit: 0, credit: 50, beginningBalance: 0, netChange: -50, endingBalance: -50 }),
    ]);
    expect(t.totalDebits).toBe(100.55);
    expect(t.totalCredits).toBe(50);
    expect(t.diff).toBe(50.55);
    expect(t.isBalanced).toBe(false);
  });

  it('beginningBalance / netChange / endingBalance sums are exact', () => {
    const t = computeTrialBalanceTotals([
      makeRow({
        debit: 10,
        credit: 0,
        beginningBalance: 0.1,
        netChange: 0.2,
        endingBalance: 0.3,
      }),
      makeRow({
        debit: 0,
        credit: 10,
        beginningBalance: 0.2,
        netChange: -0.1,
        endingBalance: 0.1,
      }),
    ]);
    // 0.1 + 0.2 = 0.3 exactly (not 0.30000000000000004)
    expect(t.totalBeginningBalance).toBe(0.3);
    // 0.2 + (-0.1) = 0.1 exactly
    expect(t.totalNetChange).toBe(0.1);
    // 0.3 + 0.1 = 0.4 exactly
    expect(t.totalEndingBalance).toBe(0.4);
  });
});
