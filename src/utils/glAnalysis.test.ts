import { describe, expect, it } from 'vitest';
import {
  computeMonthlyTrend,
  computeRunningBalance,
  getAccountSummary,
  getEntriesForAccount,
} from './glAnalysis';
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

const mockEntries: GLEntry[] = [
  createEntry({
    id: '1',
    date: '2026-01-05',
    debit: 1000,
    credit: 0,
    netChange: 1000,
    amount: 1000,
    description: 'Opening',
  }),
  createEntry({
    id: '2',
    date: '2026-01-10',
    debit: 0,
    credit: 300,
    netChange: -300,
    amount: -300,
    description: 'Payment',
  }),
  createEntry({
    id: '3',
    period: '2026-02',
    periodName: 'Feb 2026',
    date: '2026-02-03',
    debit: 500,
    credit: 0,
    netChange: 500,
    amount: 500,
    description: 'Receipt',
  }),
  createEntry({
    id: '4',
    accountId: 'acc2',
    accountCode: '2000',
    accountName: 'Accounts Receivable',
    date: '2026-01-15',
    debit: 200,
    credit: 0,
    netChange: 200,
    amount: 200,
  }),
];

describe('glAnalysis', () => {
  it('filters entries by account id or account code', () => {
    expect(getEntriesForAccount(mockEntries, 'acc1')).toHaveLength(3);
    expect(getEntriesForAccount(mockEntries, '1000')).toHaveLength(3);
  });

  it('computes monthly trend with debit, credit, net, date span and transaction counts', () => {
    const trend = computeMonthlyTrend(mockEntries, 'acc1');

    expect(trend).toHaveLength(2);
    expect(trend[0]).toEqual({
      month: '2026-01',
      debit: 1000,
      credit: 300,
      net: 700,
      transactionCount: 2,
      firstDate: '2026-01-05',
      lastDate: '2026-01-10',
    });
    expect(trend[1]).toEqual({
      month: '2026-02',
      debit: 500,
      credit: 0,
      net: 500,
      transactionCount: 1,
      firstDate: '2026-02-03',
      lastDate: '2026-02-03',
    });
  });

  it('computes running balance', () => {
    const running = computeRunningBalance(mockEntries, 'acc1');

    expect(running).toHaveLength(2);
    expect(running[0]?.runningBalance).toBe(700);
    expect(running[1]?.runningBalance).toBe(1200);
  });

  it('returns account summary including date range and monthly average', () => {
    const summary = getAccountSummary(mockEntries, 'acc1');

    expect(summary.totalDebit).toBe(1500);
    expect(summary.totalCredit).toBe(300);
    expect(summary.netChange).toBe(1200);
    expect(summary.transactionCount).toBe(3);
    expect(summary.firstDate).toBe('2026-01-05');
    expect(summary.lastDate).toBe('2026-02-03');
    expect(summary.averageMonthlyNet).toBe(600);
  });

  it('handles unknown account', () => {
    const trend = computeMonthlyTrend(mockEntries, 'unknown');
    const summary = getAccountSummary(mockEntries, 'unknown');

    expect(trend).toHaveLength(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.firstDate).toBeNull();
    expect(summary.lastDate).toBeNull();
  });
});
