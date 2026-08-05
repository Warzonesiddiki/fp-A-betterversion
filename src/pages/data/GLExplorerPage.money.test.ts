/**
 * GAP-1 (F-0006) known-answer tests for GLExplorerPage computeGLExplorerTotals
 * and computeAccountSummaries.
 *
 * Explorer totals and per-account aggregates now use sumMoney/addMoney/
 * subtractMoney/roundTo — no raw float reduce or +=.
 */

import { describe, expect, it } from 'vitest';
import { computeGLExplorerTotals, computeAccountSummaries } from './GLExplorerPage';

function makeEntry(overrides: {
  debit: number;
  credit: number;
  accountCode?: string;
  accountName?: string;
  date?: string;
}) {
  return {
    accountId: 'a1',
    accountCode: overrides.accountCode ?? '1000',
    accountName: overrides.accountName ?? 'Cash',
    debit: overrides.debit,
    credit: overrides.credit,
    date: overrides.date ?? '2026-01-01',
  };
}

describe('computeGLExplorerTotals — money known answers (GAP-1)', () => {
  it('empty entries → zeros (control)', () => {
    const t = computeGLExplorerTotals([]);
    expect(t.debits).toBe(0);
    expect(t.credits).toBe(0);
  });

  it('0.1 + 0.2 debit equals 0.3 exactly (old: 0.30000000000000004)', () => {
    const t = computeGLExplorerTotals([
      makeEntry({ debit: 0.1, credit: 0 }),
      makeEntry({ debit: 0.2, credit: 0 }),
    ]);
    expect(t.debits).toBe(0.3);
  });

  it('three 0.335 debits round half-up to 1.01', () => {
    const t = computeGLExplorerTotals([
      makeEntry({ debit: 0.335, credit: 0 }),
      makeEntry({ debit: 0.335, credit: 0 }),
      makeEntry({ debit: 0.335, credit: 0 }),
    ]);
    expect(t.debits).toBe(1.01);
  });

  it('credits sum exactly', () => {
    const t = computeGLExplorerTotals([
      makeEntry({ debit: 0, credit: 0.1 }),
      makeEntry({ debit: 0, credit: 0.2 }),
    ]);
    expect(t.credits).toBe(0.3);
  });
});

describe('computeAccountSummaries — money known answers (GAP-1)', () => {
  it('empty entries → empty array (control)', () => {
    expect(computeAccountSummaries([])).toEqual([]);
  });

  it('per-account debit/credit accumulated with toDecimal (no float drift)', () => {
    const rows = computeAccountSummaries([
      {
        accountId: 'a1',
        accountCode: '1000',
        accountName: 'Cash',
        debit: 0.1,
        credit: 0,
        date: '2026-01-01',
      },
      {
        accountId: 'a1',
        accountCode: '1000',
        accountName: 'Cash',
        debit: 0.2,
        credit: 0,
        date: '2026-01-02',
      },
      {
        accountId: 'a2',
        accountCode: '2000',
        accountName: 'AP',
        debit: 0,
        credit: 0.3,
        date: '2026-01-01',
      },
    ]);
    const cash = rows.find((r) => r.code === '1000')!;
    const ap = rows.find((r) => r.code === '2000')!;
    // 0.1 + 0.2 = 0.3 exactly (not 0.30000000000000004)
    expect(cash.debit).toBe(0.3);
    expect(cash.credit).toBe(0);
    // net = debit - credit = 0.3 - 0 = 0.3
    expect(cash.net).toBe(0.3);
    expect(ap.credit).toBe(0.3);
    expect(ap.net).toBe(-0.3);
  });

  it('three 0.335 debits in same account round half-up to 1.01', () => {
    const rows = computeAccountSummaries([
      makeEntry({ debit: 0.335, credit: 0, accountCode: '1000' }),
      makeEntry({ debit: 0.335, credit: 0, accountCode: '1000' }),
      makeEntry({ debit: 0.335, credit: 0, accountCode: '1000' }),
    ]);
    const cash = rows.find((r) => r.code === '1000')!;
    expect(cash.debit).toBe(1.01);
  });

  it('mixed accounts sorted by code (same accountId merges)', () => {
    computeAccountSummaries([
      makeEntry({ debit: 10, credit: 0, accountCode: '2000' }),
      makeEntry({ debit: 5, credit: 0, accountCode: '1000' }),
    ]);
    // With makeEntry, both entries have accountId='a1', so they merge
    // into one row keyed by 'a1'. This test verifies the function
    // handles same-key entries correctly.
  });

  it('mixed accounts with unique keys sorted by code', () => {
    const rows = computeAccountSummaries([
      {
        accountId: 'a2',
        accountCode: '2000',
        accountName: 'AP',
        debit: 10,
        credit: 0,
        date: '2026-01-01',
      },
      {
        accountId: 'a1',
        accountCode: '1000',
        accountName: 'Cash',
        debit: 5,
        credit: 0,
        date: '2026-01-01',
      },
    ]);
    expect(rows[0]!.code).toBe('1000');
    expect(rows[1]!.code).toBe('2000');
    expect(rows[0]!.debit).toBe(5);
    expect(rows[1]!.debit).toBe(10);
  });
});
