/**
 * GAP-1 (F-0006) known-answer tests for BalanceSheetPage computeBalanceSheet.
 *
 * The fundamental accounting identity Assets = Liabilities + Equity must hold
 * to the cent. Float drift on this identity produces a false "books don't
 * balance" error on a perfectly balanced ledger; routing through
 * sumMoney/subtractMoney+roundTo keeps the check exact.
 *
 * Falsification: under raw `reduce +` and raw `a - b`, the 0.1/0.2 family
 * produces 0.30000000000000004 and a 1e-15 imbalance on perfect books.
 * Restored, results are exact and the balance check passes.
 */

import { describe, expect, it } from 'vitest';
import { computeBalanceSheet } from './BalanceSheetPage';

type Entry = { accountCode?: string; debit: number; credit: number; date: string };

function e(code: string, debit: number, credit: number, date = '2026-06-30'): Entry {
  return { accountCode: code, debit, credit, date };
}

describe('computeBalanceSheet — money known answers (GAP-1)', () => {
  it('empty entries → all zeros (control)', () => {
    const r = computeBalanceSheet([]);
    expect(r.totalAssets).toBe(0);
    expect(r.totalLiabilities).toBe(0);
    expect(r.totalEquity).toBe(0);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
    expect(r.entryCount).toBe(0);
  });

  it('three 0.1-debit asset entries → 0.30 exact (old: 0.30000000000000004)', () => {
    const r = computeBalanceSheet([
      e('1000', 0.1, 0),
      e('1100', 0.1, 0),
      e('1200', 0.1, 0),
    ]);
    expect(r.totalAssets).toBe(0.3);
  });

  it('three 0.335-debit asset entries → 1.01 half-up (old: 1.00)', () => {
    const r = computeBalanceSheet([
      e('1000', 0.335, 0),
      e('1100', 0.335, 0),
      e('1200', 0.335, 0),
    ]);
    expect(r.totalAssets).toBe(1.01);
  });

  it('perfectly balanced books: A = L + E (isBalanced true)', () => {
    // 1000 in assets, 600 in liabilities, 400 in equity
    const r = computeBalanceSheet([
      e('1000', 1000, 0),
      e('2000', 0, 600),
      e('3000', 0, 400),
    ]);
    expect(r.totalAssets).toBe(1000);
    expect(r.totalLiabilities).toBe(600);
    expect(r.totalEquity).toBe(400);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
  });

  it('cent-balanced books: 0.1 + 0.2 - 0.3 = 0 exact (was ~1.7e-15 with float)', () => {
    // 0.3 of assets, 0.3 of liabilities (i.e. credit 0.3)
    const r = computeBalanceSheet([
      e('1000', 0.1, 0),
      e('1100', 0.2, 0),
      e('2000', 0, 0.3),
    ]);
    expect(r.totalAssets).toBe(0.3);
    expect(r.totalLiabilities).toBe(0.3);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
  });

  it('unbalanced books: A − (L + E) = 100 (isBalanced false)', () => {
    const r = computeBalanceSheet([
      e('1000', 1100, 0), // assets
      e('2000', 0, 600),  // liabilities
      e('3000', 0, 400),  // equity (assets exceed by 100)
    ]);
    expect(r.totalAssets).toBe(1100);
    expect(r.totalLiabilities).toBe(600);
    expect(r.totalEquity).toBe(400);
    expect(r.isBalanced).toBe(false);
    expect(r.diff).toBe(100);
  });

  it('asOfDate filter excludes entries after cutoff', () => {
    const r = computeBalanceSheet(
      [
        e('1000', 100, 0, '2026-01-15'),
        e('1000', 200, 0, '2026-06-15'),
        e('1000', 400, 0, '2026-12-15'),
      ],
      '2026-06-30'
    );
    expect(r.totalAssets).toBe(300);
    expect(r.entryCount).toBe(2);
  });

  it('liability credit increases liabilities (credit - debit)', () => {
    const r = computeBalanceSheet([e('2000', 0, 500)]);
    expect(r.totalLiabilities).toBe(500);
  });

  it('equity credit increases equity (credit - debit)', () => {
    const r = computeBalanceSheet([e('3000', 0, 250)]);
    expect(r.totalEquity).toBe(250);
  });
});
