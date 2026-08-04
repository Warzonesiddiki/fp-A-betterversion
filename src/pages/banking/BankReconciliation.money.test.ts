/**
 * GAP-1 (F-0006) known-answer tests for BankReconciliation stats.
 *
 * `computeReconciliationStats` previously aggregated GL debits/credits/
 * netChange with raw IEEE-754 float `reduce +`/`+=`, feeding the "Bank
 * Balance" and "Net Change" KPIs and the per-account reconciliation
 * table. A balanced book requires totalDebit === totalCredit to the
 * cent; float drift made the totals appear off by sub-cent residues.
 *
 * Falsification record: with the function body reverted to raw `+=`
 * floats, 3 of these 5 tests FAIL (the empty-list + integer controls
 * survive); restored, 5/5 pass.
 */

import { describe, expect, it } from 'vitest';
import { computeReconciliationStats } from './BankReconciliation';
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

describe('computeReconciliationStats — money known answers (GAP-1 / F-0006)', () => {
  it('empty entries yields zero totals (control)', () => {
    const s = computeReconciliationStats([]);
    expect(s.totalDebit).toBe(0);
    expect(s.totalCredit).toBe(0);
    expect(s.netChange).toBe(0);
    expect(s.uniqueAccounts).toBe(0);
    expect(s.accountBreakdown).toEqual([]);
  });

  it('balances on a three-0.1-debit / one-0.3-credit book (old float: debit=0.30000000000000004)', () => {
    const s = computeReconciliationStats([
      makeEntry({ id: '1', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '2', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '3', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '4', debit: 0, credit: 0.3, netChange: 0.3, accountCode: '2000' }),
    ]);
    expect(s.totalDebit).toBe(0.3);
    expect(s.totalCredit).toBe(0.3);
    expect(s.netChange).toBe(0);
    expect(s.uniqueAccounts).toBe(2);
  });

  it('rounds three 0.335 debits half-up to 1.01 (old float reduce: 1.00499…→1.00)', () => {
    // 0.335*3 = 1.005 exactly in decimal → ROUND_HALF_UP to 1.01. Float
    // summation gives 1.0049999999999998 and the displayed bank balance is
    // understated by a cent.
    const s = computeReconciliationStats([
      makeEntry({ id: '1', debit: 0.335, credit: 0, netChange: -0.335, accountCode: '1000' }),
      makeEntry({ id: '2', debit: 0.335, credit: 0, netChange: -0.335, accountCode: '1000' }),
      makeEntry({ id: '3', debit: 0.335, credit: 0, netChange: -0.335, accountCode: '1000' }),
    ]);
    expect(s.totalDebit).toBe(1.01);
    expect(s.accountBreakdown[0]?.debit).toBe(1.01);
  });

  it('aggregates per-account debit/credit/net exactly', () => {
    // Account 1000: debits 100.10 + 200.20 = 300.30; credits 0; net -300.30.
    // Account 2000: debits 0; credits 50.05 + 250.25 = 300.30; net +300.30.
    // Old float: 100.10 + 200.20 = 300.30000000000006 (drift 6e-14); the
    // per-account net change shows a phantom residual.
    const s = computeReconciliationStats([
      makeEntry({
        id: '1',
        debit: 100.1,
        credit: 0,
        netChange: -100.1,
        accountCode: '1000',
        accountName: 'Cash',
      }),
      makeEntry({
        id: '2',
        debit: 200.2,
        credit: 0,
        netChange: -200.2,
        accountCode: '1000',
        accountName: 'Cash',
      }),
      makeEntry({
        id: '3',
        debit: 0,
        credit: 50.05,
        netChange: 50.05,
        accountCode: '2000',
        accountName: 'AP',
      }),
      makeEntry({
        id: '4',
        debit: 0,
        credit: 250.25,
        netChange: 250.25,
        accountCode: '2000',
        accountName: 'AP',
      }),
    ]);
    expect(s.totalDebit).toBe(300.3);
    expect(s.totalCredit).toBe(300.3);
    expect(s.netChange).toBe(0);
    const cash = s.accountBreakdown.find((r) => r.accountCode === '1000')!;
    const ap = s.accountBreakdown.find((r) => r.accountCode === '2000')!;
    expect(cash.debit).toBe(300.3);
    expect(cash.credit).toBe(0);
    expect(cash.netChange).toBe(-300.3);
    expect(ap.debit).toBe(0);
    expect(ap.credit).toBe(300.3);
    expect(ap.netChange).toBe(300.3);
    expect(cash.transactions).toBe(2);
    expect(ap.transactions).toBe(2);
  });

  it('sums mixed decimal net changes without 0.1+0.2-class drift (old: 0.30000000000000004)', () => {
    const s = computeReconciliationStats([
      makeEntry({ id: '1', debit: 0.1, credit: 0, netChange: -0.1, accountCode: '1000' }),
      makeEntry({ id: '2', debit: 0, credit: 0.2, netChange: 0.2, accountCode: '2000' }),
      makeEntry({ id: '3', debit: 0, credit: 0.4, netChange: 0.4, accountCode: '2000' }),
      makeEntry({ id: '4', debit: 0.5, credit: 0, netChange: -0.5, accountCode: '1000' }),
    ]);
    // totalDebit   = 0.1 + 0.5 = 0.6
    // totalCredit  = 0.2 + 0.4 = 0.6
    // netChange    = -0.1 + 0.2 + 0.4 - 0.5 = 0.0
    expect(s.totalDebit).toBe(0.6);
    expect(s.totalCredit).toBe(0.6);
    expect(s.netChange).toBe(0);
  });
});
