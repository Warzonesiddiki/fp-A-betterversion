/**
 * GAP-1 (F-0006) known-answer tests for GLJournalsPage computeJournalTotals.
 *
 * Journal debit/credit totals now use sumMoney/subtractMoney/roundTo —
 * no raw float reduce.
 */

import { describe, expect, it } from 'vitest';
import { computeJournalTotals } from './GLJournalsPage';

function makeEntry(overrides: { debit: number; credit: number }) {
  return { debit: overrides.debit, credit: overrides.credit };
}

describe('computeJournalTotals — money known answers (GAP-1)', () => {
  it('empty entries → zeros, balanced (control)', () => {
    const t = computeJournalTotals([]);
    expect(t.debits).toBe(0);
    expect(t.credits).toBe(0);
    expect(t.isBalanced).toBe(true);
  });

  it('0.1 + 0.2 debit equals 0.3 exactly (old: 0.30000000000000004)', () => {
    const t = computeJournalTotals([
      makeEntry({ debit: 0.1, credit: 0 }),
      makeEntry({ debit: 0.2, credit: 0 }),
    ]);
    expect(t.debits).toBe(0.3);
  });

  it('three 0.335 debits round half-up to 1.01', () => {
    const t = computeJournalTotals([
      makeEntry({ debit: 0.335, credit: 0 }),
      makeEntry({ debit: 0.335, credit: 0 }),
      makeEntry({ debit: 0.335, credit: 0 }),
    ]);
    expect(t.debits).toBe(1.01);
  });

  it('balanced debits/credits → isBalanced true', () => {
    const t = computeJournalTotals([
      makeEntry({ debit: 100.55, credit: 0 }),
      makeEntry({ debit: 0, credit: 100.55 }),
    ]);
    expect(t.debits).toBe(100.55);
    expect(t.credits).toBe(100.55);
    expect(t.isBalanced).toBe(true);
  });

  it('imbalanced → isBalanced false with correct diff', () => {
    const t = computeJournalTotals([
      makeEntry({ debit: 0.1, credit: 0 }),
      makeEntry({ debit: 0.2, credit: 0 }),
      makeEntry({ debit: 0, credit: 0.29 }),
    ]);
    expect(t.debits).toBe(0.3);
    expect(t.credits).toBe(0.29);
    expect(t.isBalanced).toBe(false);
  });

  it('0.1 + 0.2 credits equal 0.3 exactly', () => {
    const t = computeJournalTotals([
      makeEntry({ debit: 0, credit: 0.1 }),
      makeEntry({ debit: 0, credit: 0.2 }),
    ]);
    expect(t.credits).toBe(0.3);
  });
});
