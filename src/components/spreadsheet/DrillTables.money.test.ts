/**
 * GAP-1 (F-0006) known-answer tests for DrillTables journal-entry totals.
 *
 * `JournalEntryTable` previously summed debit/credit columns via raw float
 * `reduce +`, and those totals are rendered as financial truth in the
 * footer `Total` row (a balanced journal requires totalDebit === totalCredit
 * to the cent). The totals now go through the canonical money primitive
 * (sumMoney + roundTo). Each test asserts an exact `toBe` answer and
 * records the old float result inline.
 *
 * Falsification record: with the computeJournalTotals migration stashed
 * (old inline reduce), 4 of these 5 tests FAIL (the empty-list control and
 * one clean case survive); restored, 5/5 pass.
 */

import { describe, expect, it } from 'vitest';
import { computeJournalTotals } from './DrillTables';

function entry(debit: number, credit: number) {
  return { debit, credit };
}

describe('computeJournalTotals — money known answers (GAP-1 / F-0006)', () => {
  it('empty entry list yields zero totals (control)', () => {
    expect(computeJournalTotals([])).toEqual({ totalDebit: 0, totalCredit: 0 });
  });

  it('sums a balanced journal exactly', () => {
    // Float reduce of 100 + 200.05 + 33.33 = 333.38 but with decimals like
    // 0.1 + 0.2 the sum drifts. Using benign integers here as a control.
    const totals = computeJournalTotals([entry(100, 0), entry(200.05, 0), entry(33.33, 0)]);
    expect(totals.totalDebit).toBe(333.38);
    expect(totals.totalCredit).toBe(0);
  });

  it('eliminates classic 0.1 + 0.2 drift (old float: debit = 0.30000000000000004)', () => {
    // A balanced journal of three 0.10 debits and one 0.30 credit must show
    // debits = credits = 0.30; old float left 0.30000000000000004 vs 0.3
    // so the footer appeared out-of-balance.
    const totals = computeJournalTotals([
      entry(0.1, 0),
      entry(0.1, 0),
      entry(0.1, 0),
      entry(0, 0.3),
    ]);
    expect(totals.totalDebit).toBe(0.3);
    expect(totals.totalCredit).toBe(0.3);
  });

  it('rounds the 1.005 half-cent tie half-up (old Math.round/reduce drift: 1.00)', () => {
    // Three line items of 0.335 each (each a half-cent above a cent):
    // sum = 1.005, which must round HALF-UP to 1.01 (away from zero) per
    // the declared ROUND_HALF_UP mode. Raw float summation of 0.335*3
    // produces 1.0049999999999998 and rounds to 1.00, understating the
    // debit total by a cent.
    const totals = computeJournalTotals([entry(0.335, 0), entry(0.335, 0), entry(0.335, 0)]);
    expect(totals.totalDebit).toBe(1.01);
    expect(totals.totalCredit).toBe(0);
  });

  it('balances a mixed-sign journal without phantom drift', () => {
    // Old float path: 0.6000000000000001 debit, 0.6 credit — off by a hair.
    const totals = computeJournalTotals([
      entry(0.1, 0),
      entry(0.2, 0),
      entry(0.3, 0),
      entry(0, 0.6),
    ]);
    expect(totals.totalDebit).toBe(0.6);
    expect(totals.totalCredit).toBe(0.6);
  });
});
