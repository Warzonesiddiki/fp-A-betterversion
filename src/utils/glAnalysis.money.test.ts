/**
 * GAP-1 (F-0006) known-answer tests for glAnalysis's money migration.
 *
 * Monthly GL debit/credit aggregation, running balances, and account
 * summaries operate on GLEntry debit/credit amounts (currency imported into
 * the general ledger) — previously raw `+=`, `-`, and `/` over IEEE-754
 * doubles. Transaction counts and date strings are not money. Each fixed
 * input asserts the exact cent result with `toBe`; the pre-migration
 * IEEE-754 output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { computeMonthlyTrend, computeRunningBalance, getAccountSummary } from './glAnalysis';
import type { GLEntry } from '@/types';

function createEntry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: 'entry-id',
    accountId: 'acc1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-01',
    amount: 0,
    description: '',
    reference: '',
    ...overrides,
  };
}

describe('glAnalysis — money known answers (GAP-1 / F-0006)', () => {
  it('sums monthly debits exactly (old float: 0.30000000000000004)', () => {
    const trend = computeMonthlyTrend(
      [
        createEntry({ id: '1', date: '2026-01-05', debit: 0.1, credit: 0 }),
        createEntry({ id: '2', date: '2026-01-10', debit: 0.2, credit: 0 }),
      ],
      'acc1'
    );

    expect(trend[0]?.debit).toBe(0.3);
    expect(trend[0]?.credit).toBe(0);
    expect(trend[0]?.net).toBe(0.3);
  });

  it('subtracts monthly credits exactly (old float: 0.19999999999999998)', () => {
    const trend = computeMonthlyTrend(
      [
        createEntry({ id: '1', date: '2026-01-05', debit: 0.3, credit: 0 }),
        createEntry({ id: '2', date: '2026-01-10', debit: 0, credit: 0.1 }),
      ],
      'acc1'
    );

    expect(trend[0]?.net).toBe(0.2);
  });

  it('accumulates running balances exactly (old float: 0.6000000000000001)', () => {
    const running = computeRunningBalance(
      [
        createEntry({ id: '1', period: '2026-01', date: '2026-01-05', debit: 0.1, credit: 0 }),
        createEntry({ id: '2', period: '2026-01', date: '2026-01-10', debit: 0.2, credit: 0 }),
        createEntry({ id: '3', period: '2026-02', date: '2026-02-03', debit: 0.3, credit: 0 }),
      ],
      'acc1'
    );

    expect(running[0]?.runningBalance).toBe(0.3);
    expect(running[1]?.runningBalance).toBe(0.6);
  });

  it('aggregates the account summary exactly (old float: 0.6000000000000001 / 0.5000000000000001 / 0.25000000000000006)', () => {
    const summary = getAccountSummary(
      [
        createEntry({ id: '1', period: '2026-01', date: '2026-01-05', debit: 0.1, credit: 0 }),
        createEntry({ id: '2', period: '2026-01', date: '2026-01-10', debit: 0.2, credit: 0 }),
        createEntry({ id: '3', period: '2026-02', date: '2026-02-03', debit: 0.3, credit: 0.1 }),
      ],
      'acc1'
    );

    expect(summary.totalDebit).toBe(0.6);
    expect(summary.totalCredit).toBe(0.1);
    expect(summary.netChange).toBe(0.5);
    expect(summary.averageMonthlyNet).toBe(0.25);
  });

  it('rounds imported half-cent debits with declared half-up (old float: 1.005)', () => {
    const trend = computeMonthlyTrend(
      [createEntry({ id: '1', date: '2026-01-05', debit: 1.005, credit: 0 })],
      'acc1'
    );

    expect(trend[0]?.debit).toBe(1.01);
  });

  it('returns exact zero aggregates for an empty account', () => {
    const trend = computeMonthlyTrend([], 'unknown');
    const summary = getAccountSummary([], 'unknown');

    expect(trend).toEqual([]);
    expect(summary.totalDebit).toBe(0);
    expect(summary.totalCredit).toBe(0);
    expect(summary.netChange).toBe(0);
    expect(summary.averageMonthlyNet).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });
});
