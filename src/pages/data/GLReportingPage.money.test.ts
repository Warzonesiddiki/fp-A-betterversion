/**
 * GAP-1 (F-0006) known-answer tests for GLReportingPage computeGLReportingSummary.
 *
 * Account-type totals (debit/credit) now use addMoney/sumMoney/subtractMoney/
 * roundTo — no raw float reduce. typeBreakdown counts remain raw number (not money).
 * trialBalanceBalanced uses exact decimal diff.
 */

import { describe, expect, it } from 'vitest';
import { computeGLReportingSummary } from './GLReportingPage';

function makeEntry(overrides: {
  debit: number;
  credit: number;
  accountCode?: string;
  accountId?: string;
  date?: string;
}) {
  return {
    date: overrides.date ?? '2026-01-01',
    accountId: overrides.accountId ?? 'a1',
    accountCode: overrides.accountCode ?? '1000',
    debit: overrides.debit,
    credit: overrides.credit,
  };
}

describe('computeGLReportingSummary — money known answers (GAP-1)', () => {
  it('empty entries → null', () => {
    expect(computeGLReportingSummary([], [], [])).toBeNull();
  });

  it('account-type totals debit/credit are exact (no float drift)', () => {
    const accounts = [
      { id: 'a1', code: '1000', type: 'Asset' },
      { id: 'a2', code: '2000', type: 'Liability' },
    ];
    const entries = [
      makeEntry({ debit: 0.1, credit: 0, accountId: 'a1', accountCode: '1000' }),
      makeEntry({ debit: 0.2, credit: 0, accountId: 'a1', accountCode: '1000' }),
      makeEntry({ debit: 0, credit: 0.3, accountId: 'a2', accountCode: '2000' }),
    ];
    const s = computeGLReportingSummary(entries, accounts, [])!;
    // 0.1 + 0.2 = 0.3 exactly (not 0.30000000000000004)
    expect(s.accountTypeTotals['Asset']!.debit).toBe(0.3);
    expect(s.accountTypeTotals['Liability']!.credit).toBe(0.3);
  });

  it('three 0.335 debits in same type round half-up to 1.01', () => {
    const accounts = [{ id: 'a1', code: '1000', type: 'Asset' }];
    const entries = [
      makeEntry({ debit: 0.335, credit: 0, accountId: 'a1', accountCode: '1000' }),
      makeEntry({ debit: 0.335, credit: 0, accountId: 'a1', accountCode: '1000' }),
      makeEntry({ debit: 0.335, credit: 0, accountId: 'a1', accountCode: '1000' }),
    ];
    const s = computeGLReportingSummary(entries, accounts, [])!;
    expect(s.accountTypeTotals['Asset']!.debit).toBe(1.01);
  });

  it('trialBalanceBalanced uses exact decimal comparison', () => {
    const entries = [makeEntry({ debit: 100, credit: 0 })];
    const accounts = [{ id: 'a1', code: '1000', type: 'Asset' }];
    // Balanced: debit = credit
    const s1 = computeGLReportingSummary(entries, accounts, [{ debit: 50, credit: 50 }])!;
    expect(s1.trialBalanceBalanced).toBe(true);
    // Imbalanced
    const s2 = computeGLReportingSummary(entries, accounts, [{ debit: 50, credit: 49.99 }])!;
    expect(s2.trialBalanceBalanced).toBe(false);
  });

  it('trialBalanceBalanced with 0.1+0.2 vs 0.3 (old: false due to drift)', () => {
    const entries = [makeEntry({ debit: 1, credit: 0 })];
    const accounts = [{ id: 'a1', code: '1000', type: 'Asset' }];
    // 0.1 + 0.2 = 0.3 debit, 0.3 credit → balanced (old float: 0.30000000000000004 ≠ 0.3)
    const s = computeGLReportingSummary(entries, accounts, [
      { debit: 0.1, credit: 0 },
      { debit: 0.2, credit: 0 },
      { debit: 0, credit: 0.3 },
    ])!;
    expect(s.trialBalanceBalanced).toBe(true);
  });

  it('typeBreakdown is a count (not money)', () => {
    const accounts = [
      { id: 'a1', code: '1000', type: 'Asset' },
      { id: 'a2', code: '1100', type: 'Asset' },
      { id: 'a3', code: '2000', type: 'Liability' },
    ];
    const entries = [makeEntry({ debit: 10, credit: 0, accountId: 'a1', accountCode: '1000' })];
    const s = computeGLReportingSummary(entries, accounts, [])!;
    expect(s.typeBreakdown['Asset']).toBe(2);
    expect(s.typeBreakdown['Liability']).toBe(1);
  });

  it('count field in accountTypeTotals is a plain count', () => {
    const accounts = [{ id: 'a1', code: '1000', type: 'Asset' }];
    const entries = [
      makeEntry({ debit: 10, credit: 0, accountId: 'a1', accountCode: '1000' }),
      makeEntry({ debit: 5, credit: 0, accountId: 'a1', accountCode: '1000' }),
    ];
    const s = computeGLReportingSummary(entries, accounts, [])!;
    expect(s.accountTypeTotals['Asset']!.count).toBe(2);
  });
});
