import { describe, it, expect } from 'vitest';
import { computeMonthlyTrend, computeRunningBalance, getAccountSummary } from './glAnalysis';
import type { GLEntry } from '@/types';

const mockEntries: GLEntry[] = [
  {
    id: '1',
    accountId: 'acc1',
    accountCode: '1000',
    accountName: 'Cash',
    date: '2026-01-05',
    period: '2026-01',
    debit: 1000,
    credit: 0,
    description: 'Opening',
  } as any,
  {
    id: '2',
    accountId: 'acc1',
    accountCode: '1000',
    accountName: 'Cash',
    date: '2026-01-10',
    period: '2026-01',
    debit: 0,
    credit: 300,
    description: 'Payment',
  } as any,
  {
    id: '3',
    accountId: 'acc1',
    accountCode: '1000',
    accountName: 'Cash',
    date: '2026-02-03',
    period: '2026-02',
    debit: 500,
    credit: 0,
    description: 'Receipt',
  } as any,
  {
    id: '4',
    accountId: 'acc2',
    accountCode: '2000',
    accountName: 'AR',
    date: '2026-01-15',
    period: '2026-01',
    debit: 200,
    credit: 0,
  } as any,
];

describe('glAnalysis', () => {
  it('computes monthly trend correctly', () => {
    const trend = computeMonthlyTrend(mockEntries, 'acc1');
    expect(trend).toHaveLength(2);
    expect(trend[0]).toEqual({ month: '2026-01', debit: 1000, credit: 300, net: 700 });
    expect(trend[1]).toEqual({ month: '2026-02', debit: 500, credit: 0, net: 500 });
  });

  it('computes running balance', () => {
    const running = computeRunningBalance(mockEntries, 'acc1');
    expect(running).toHaveLength(2);
    expect(running[0].runningBalance).toBe(700);
    expect(running[1].runningBalance).toBe(1200);
  });

  it('returns correct account summary', () => {
    const summary = getAccountSummary(mockEntries, 'acc1');
    expect(summary.totalDebit).toBe(1500);
    expect(summary.totalCredit).toBe(300);
    expect(summary.netChange).toBe(1200);
    expect(summary.transactionCount).toBe(3);
  });

  it('handles unknown account', () => {
    const trend = computeMonthlyTrend(mockEntries, 'unknown');
    expect(trend).toHaveLength(0);
  });
});
