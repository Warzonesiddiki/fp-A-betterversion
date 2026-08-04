/**
 * GAP-1 (F-0006) known-answer tests for BudgetApproval stats. Same pattern
 * as BankReconciliation/BankStatements.
 */

import { describe, expect, it } from 'vitest';
import { computeApprovalStats } from './BudgetApproval';
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

describe('BudgetApproval totals — money known answers (GAP-1)', () => {
  it('empty → zeros (control)', () => {
    const s = computeApprovalStats([]);
    expect(s.totalDebit).toBe(0);
    expect(s.totalCredit).toBe(0);
    expect(s.accountBreakdown).toEqual([]);
  });

  it('balanced 0.1+0.1+0.1 = 0.3 (old: 0.30000000000000004)', () => {
    const s = computeApprovalStats([
      makeEntry({ id: '1', debit: 0.1, credit: 0, netChange: -0.1 }),
      makeEntry({ id: '2', debit: 0.1, credit: 0, netChange: -0.1 }),
      makeEntry({ id: '3', debit: 0.1, credit: 0, netChange: -0.1 }),
      makeEntry({ id: '4', debit: 0, credit: 0.3, netChange: 0.3 }),
    ]);
    expect(s.totalDebit).toBe(0.3);
    expect(s.totalCredit).toBe(0.3);
    expect(s.netChange).toBe(0);
  });

  it('three 0.335 debits round half-up to 1.01', () => {
    const s = computeApprovalStats([
      makeEntry({ id: '1', debit: 0.335, credit: 0, netChange: -0.335 }),
      makeEntry({ id: '2', debit: 0.335, credit: 0, netChange: -0.335 }),
      makeEntry({ id: '3', debit: 0.335, credit: 0, netChange: -0.335 }),
    ]);
    expect(s.totalDebit).toBe(1.01);
  });

  it('per-account aggregates are exact', () => {
    const s = computeApprovalStats([
      makeEntry({ id: '1', debit: 100.1, credit: 0, netChange: -100.1, accountCode: '1000' }),
      makeEntry({ id: '2', debit: 200.2, credit: 0, netChange: -200.2, accountCode: '1000' }),
      makeEntry({ id: '3', debit: 0, credit: 300.3, netChange: 300.3, accountCode: '2000' }),
    ]);
    const cash = s.accountBreakdown.find((r) => r.accountCode === '1000')!;
    expect(cash.debit).toBe(300.3);
    expect(cash.netChange).toBe(-300.3);
  });
});
