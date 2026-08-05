/**
 * GAP-1 (F-0006) known-answer tests for DataImportPage computeDataImportSummary
 * and computeReconciliation.
 *
 * Import summary totals use sumMoney/roundTo. Reconciliation uses toDecimal
 * accumulation with subtractMoney for exact diff computation.
 */

import { describe, expect, it } from 'vitest';
import { computeDataImportSummary, computeReconciliation } from './DataImportPage';

describe('computeDataImportSummary — money known answers (GAP-1)', () => {
  it('empty entries → null', () => {
    expect(computeDataImportSummary([], [], [])).toBeNull();
  });

  it('0.1 + 0.2 debit equals 0.3 exactly (old: 0.30000000000000004)', () => {
    const s = computeDataImportSummary(
      [
        { debit: 0.1, credit: 0 },
        { debit: 0.2, credit: 0 },
      ],
      [],
      []
    )!;
    expect(s.totalDebit).toBe(0.3);
    expect(s.totalCredit).toBe(0);
  });

  it('three 0.335 debits round half-up to 1.01', () => {
    const s = computeDataImportSummary(
      [
        { debit: 0.335, credit: 0 },
        { debit: 0.335, credit: 0 },
        { debit: 0.335, credit: 0 },
      ],
      [],
      []
    )!;
    expect(s.totalDebit).toBe(1.01);
  });

  it('credits sum exactly', () => {
    const s = computeDataImportSummary(
      [
        { debit: 0, credit: 0.1 },
        { debit: 0, credit: 0.2 },
      ],
      [],
      []
    )!;
    expect(s.totalCredit).toBe(0.3);
  });
});

describe('computeReconciliation — money known answers (GAP-1)', () => {
  it('empty recData → all zeros', () => {
    const r = computeReconciliation([], [], '', '', 0.01);
    expect(r.matching).toBe(0);
    expect(r.mismatches).toBe(0);
    expect(r.missing).toBe(0);
    expect(r.details).toEqual([]);
  });

  it('exact match with 0.1+0.2=0.3 GL balance (old: false mismatch due to float drift)', () => {
    const entries = [
      { accountId: 'a1', accountCode: '1000', debit: 0.1, credit: 0 },
      { accountId: 'a1', accountCode: '1000', debit: 0.2, credit: 0 },
    ];
    // GL balance for 1000 = 0.3; external file also says 0.3
    const recData = [{ Account: '1000', Balance: '0.3' }];
    const r = computeReconciliation(entries, recData, 'Account', 'Balance', 0.01);
    expect(r.matching).toBe(1);
    expect(r.details[0]!.diff).toBe(0);
  });

  it('mismatch detected correctly', () => {
    const entries = [{ accountId: 'a1', accountCode: '1000', debit: 100, credit: 0 }];
    const recData = [{ Account: '1000', Balance: '95' }];
    const r = computeReconciliation(entries, recData, 'Account', 'Balance', 0.01);
    expect(r.mismatches).toBe(1);
    // diff = actual - expected = 95 - 100 = -5
    expect(r.details[0]!.diff).toBe(-5);
  });

  it('missing account detected', () => {
    const entries: {
      accountId: string;
      accountCode: string;
      debit: number;
      credit: number;
    }[] = [];
    const recData = [{ Account: '9999', Balance: '50' }];
    const r = computeReconciliation(entries, recData, 'Account', 'Balance', 0.01);
    expect(r.missing).toBe(1);
  });
});
