/**
 * GAP-1 (F-0006) known-answer tests for BankStatements computeStatementStats.
 *
 * This mirrors BankReconciliation migration (same shape). Float reduce
 * replaced with sumMoney/addMoney+roundTo.
 */

import { describe, expect, it } from 'vitest';
import { computeStatementStats } from './BankStatements';
import type { GLEntry } from '@/types';

function makeEntry(
  overrides: Partial<GLEntry> & Pick<GLEntry, 'debit' | 'credit' | 'netChange'>
): GLEntry {
  return {
    id: 'e1',
    accountId: 'a1',
    accountCode: '1000',
    accountName: 'Cash',
    period: '2026-01',
    periodName: 'Jan 2026',
    date: '2026-01-01',
    amount: 0,
    description: '',
    reference: '',
    postDate: '2026-01-01',
    departmentId: 'D1',
    ...overrides,
  } as GLEntry;
}

describe('BankStatements totals — money known answers (GAP-1)', () => {
  it('empty entries → zeros (control)', () => {
    const s = computeStatementStats([]);
    expect(s.totalDebit).toBe(0);
    expect(s.totalCredit).toBe(0);
    expect(s.netChange).toBe(0);
    expect(s.accountBreakdown).toEqual([]);
  });

  it('three 0.1 debits / one 0.3 credit balance exactly (old: 0.30000000000000004)', () => {
    const s = computeStatementStats([
      makeEntry({ id: '1', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '2', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '3', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '4', debit: 0, credit: 0.3, netChange: 0.3, accountCode: '2000' }),
    ]);
    expect(s.totalDebit).toBe(0.3);
    expect(s.totalCredit).toBe(0.3);
    expect(s.netChange).toBe(0);
  });

  it('per-account aggregates are exact', () => {
    const s = computeStatementStats([
      makeEntry({ id: '1', debit: 100.1, credit: 0, netChange: -100.1, accountCode: '1000' }),
      makeEntry({ id: '2', debit: 200.2, credit: 0, netChange: -200.2, accountCode: '1000' }),
      makeEntry({ id: '3', debit: 0, credit: 50.05, netChange: 50.05, accountCode: '2000' }),
      makeEntry({ id: '4', debit: 0, credit: 250.25, netChange: 250.25, accountCode: '2000' }),
    ]);
    const cash = s.accountBreakdown.find((r) => r.accountCode === '1000')!;
    const ap = s.accountBreakdown.find((r) => r.accountCode === '2000')!;
    expect(cash.debit).toBe(300.3);
    expect(cash.netChange).toBe(-300.3);
    expect(ap.credit).toBe(300.3);
    expect(ap.netChange).toBe(300.3);
  });

  it('three 0.335 debits round half-up to 1.01', () => {
    const s = computeStatementStats([
      makeEntry({ id: '1', debit: 0.335, credit: 0, netChange: -0.335 }),
      makeEntry({ id: '2', debit: 0.335, credit: 0, netChange: -0.335 }),
      makeEntry({ id: '3', debit: 0.335, credit: 0, netChange: -0.335 }),
    ]);
    expect(s.totalDebit).toBe(1.01);
  });
});
