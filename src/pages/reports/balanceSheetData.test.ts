/**
 * GAP-1 (F-0006) known-answer tests for the balance-sheet derivation.
 *
 * Two independent contracts are pinned here.
 *
 * A. **The accounting identity.** `Assets = Liabilities + Equity` must hold on
 *    any balanced ledger, not only on one with no trading activity. Before this
 *    module, closing equity was prefix-3 postings alone, so on double-entry
 *    books the reported imbalance was exactly net income — the page told a user
 *    with a perfectly balanced ledger that their books were off. Several cases
 *    below fail against that implementation.
 *
 * B. **Decimal money.** Under raw `reduce +` / `a - b` the 0.1/0.2 family
 *    produces 0.30000000000000004 and a 1e-15 imbalance on perfect books.
 *
 * Falsification: reverting `balanceSheetData.ts` to the prefix-1/2/3-only
 * float implementation fails the identity cases; dropping the decimal helpers
 * fails the cent cases.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { computeBalanceSheet } from './balanceSheetData';

type Entry = { accountCode?: string; debit: number; credit: number; date: string };

function e(code: string, debit: number, credit: number, date = '2026-06-30'): Entry {
  return { accountCode: code, debit, credit, date };
}

describe('computeBalanceSheet — money known answers (GAP-1)', () => {
  it('empty entries → all zeros (control)', () => {
    const r = computeBalanceSheet([]);
    expect(r.totalAssets).toBe(0);
    expect(r.totalLiabilities).toBe(0);
    expect(r.postedEquity).toBe(0);
    expect(r.currentPeriodEarnings).toBe(0);
    expect(r.totalEquity).toBe(0);
    expect(r.totalLiabilitiesAndEquity).toBe(0);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
    expect(r.entryCount).toBe(0);
    expect(r.unclassifiedCount).toBe(0);
  });

  it('three 0.1-debit asset entries → 0.30 exact (old: 0.30000000000000004)', () => {
    const r = computeBalanceSheet([e('1000', 0.1, 0), e('1100', 0.1, 0), e('1200', 0.1, 0)]);
    expect(r.totalAssets).toBe(0.3);
  });

  it('three 0.335-debit asset entries → 1.01 half-up (old: 1.00)', () => {
    const r = computeBalanceSheet([e('1000', 0.335, 0), e('1100', 0.335, 0), e('1200', 0.335, 0)]);
    expect(r.totalAssets).toBe(1.01);
  });

  it('perfectly balanced books with no trading: A = L + E', () => {
    const r = computeBalanceSheet([e('1000', 1000, 0), e('2000', 0, 600), e('3000', 0, 400)]);
    expect(r.totalAssets).toBe(1000);
    expect(r.totalLiabilities).toBe(600);
    expect(r.postedEquity).toBe(400);
    expect(r.currentPeriodEarnings).toBe(0);
    expect(r.totalEquity).toBe(400);
    expect(r.totalLiabilitiesAndEquity).toBe(1000);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
  });

  it('cent-balanced books: 0.1 + 0.2 − 0.3 = 0 exact (was ~1.7e-15 with float)', () => {
    const r = computeBalanceSheet([e('1000', 0.1, 0), e('1100', 0.2, 0), e('2000', 0, 0.3)]);
    expect(r.totalAssets).toBe(0.3);
    expect(r.totalLiabilities).toBe(0.3);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
  });

  it('genuinely unbalanced books: A − (L + E) = 100', () => {
    const r = computeBalanceSheet([e('1000', 1100, 0), e('2000', 0, 600), e('3000', 0, 400)]);
    expect(r.diff).toBe(100);
    expect(r.isBalanced).toBe(false);
  });

  it('asOfDate filter excludes entries after the cutoff', () => {
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

  it('asOfDate keeps a same-day entry written as an ISO timestamp', () => {
    // '2026-06-30T09:15:00Z' <= '2026-06-30' is false as a string compare, so
    // the entry used to be silently dropped from its own as-of report.
    const r = computeBalanceSheet([e('1000', 250, 0, '2026-06-30T09:15:00Z')], '2026-06-30');
    expect(r.entryCount).toBe(1);
    expect(r.totalAssets).toBe(250);
  });

  it('liability and equity postings are credit-normal', () => {
    const r = computeBalanceSheet([e('2000', 0, 500), e('3000', 0, 250)]);
    expect(r.totalLiabilities).toBe(500);
    expect(r.postedEquity).toBe(250);
  });

  it('a contra posting reduces the balance it offsets (no Math.abs)', () => {
    const r = computeBalanceSheet([e('2000', 0, 500), e('2000', 200, 0)]);
    expect(r.totalLiabilities).toBe(300);
  });
});

describe('computeBalanceSheet — the identity holds once the books have traded', () => {
  /**
   * Sum of debits equals sum of credits in double entry, therefore
   * Assets − Liabilities − PostedEquity ≡ Revenue − Expenses. Every case here
   * reports a false imbalance equal to net income under a prefix-1/2/3-only
   * equity roll-up.
   */

  it('revenue only: cash sale of 1,000 balances', () => {
    const r = computeBalanceSheet([e('1000', 1000, 0), e('4000', 0, 1000)]);
    expect(r.totalAssets).toBe(1000);
    expect(r.postedEquity).toBe(0);
    expect(r.currentPeriodEarnings).toBe(1000);
    expect(r.totalEquity).toBe(1000);
    expect(r.isBalanced).toBe(true);
    expect(r.diff).toBe(0);
  });

  it('revenue less COGS: earnings are 3,000 and the sheet balances', () => {
    const r = computeBalanceSheet([
      e('1000', 5000, 0), // cash in
      e('4000', 0, 5000), // revenue
      e('5000', 2000, 0), // cogs
      e('1000', 0, 2000), // cash out
    ]);
    expect(r.totalAssets).toBe(3000);
    expect(r.currentPeriodEarnings).toBe(3000);
    expect(r.totalEquity).toBe(3000);
    expect(r.totalLiabilitiesAndEquity).toBe(3000);
    expect(r.isBalanced).toBe(true);
  });

  it('every expense class reduces earnings: 4 − 5 − 6 − 7 − 8', () => {
    const r = computeBalanceSheet([
      e('4000', 0, 10000), // revenue
      e('5000', 3000, 0), // cogs
      e('6000', 2000, 0), // opex
      e('7000', 500, 0), // interest
      e('8000', 400, 0), // income tax
      e('1000', 4100, 0), // net cash
    ]);
    expect(r.currentPeriodEarnings).toBe(4100);
    expect(r.isBalanced).toBe(true);
  });

  it('a loss reduces closing equity below contributed capital', () => {
    const r = computeBalanceSheet([
      e('1000', 1000, 0), // capital in
      e('3000', 0, 1000), // contributed capital
      e('6000', 400, 0), // opex
      e('1000', 0, 400), // cash out
    ]);
    expect(r.postedEquity).toBe(1000);
    expect(r.currentPeriodEarnings).toBe(-400);
    expect(r.totalEquity).toBe(600);
    expect(r.totalAssets).toBe(600);
    expect(r.isBalanced).toBe(true);
  });

  it('a sales return is credit-normal and reduces revenue', () => {
    const r = computeBalanceSheet([e('4000', 0, 1000), e('4000', 250, 0), e('1000', 750, 0)]);
    expect(r.currentPeriodEarnings).toBe(750);
    expect(r.isBalanced).toBe(true);
  });

  it('earnings respect the as-of cutoff', () => {
    const r = computeBalanceSheet(
      [
        e('1000', 100, 0, '2026-01-31'),
        e('4000', 0, 100, '2026-01-31'),
        e('1000', 900, 0, '2026-12-31'),
        e('4000', 0, 900, '2026-12-31'),
      ],
      '2026-06-30'
    );
    expect(r.currentPeriodEarnings).toBe(100);
    expect(r.totalAssets).toBe(100);
    expect(r.isBalanced).toBe(true);
  });
});

describe('computeBalanceSheet — nothing is silently dropped', () => {
  it('counts entries whose account code has no 1–8 class prefix', () => {
    const r = computeBalanceSheet([e('1000', 100, 0), e('9500', 40, 0), e('', 0, 10)]);
    expect(r.unclassifiedCount).toBe(2);
    expect(r.unclassifiedMovement).toBe(30);
    expect(r.totalAssets).toBe(100);
    // The unmapped movement is exactly why the sheet does not balance, and the
    // report now carries the evidence instead of losing it.
    expect(r.isBalanced).toBe(false);
  });

  it('a missing account code does not land in any class total', () => {
    const r = computeBalanceSheet([{ debit: 500, credit: 0, date: '2026-06-30' }]);
    expect(r.totalAssets).toBe(0);
    expect(r.totalLiabilities).toBe(0);
    expect(r.postedEquity).toBe(0);
    expect(r.unclassifiedCount).toBe(1);
  });
});

describe('computeBalanceSheet — the balance test has no tolerance window', () => {
  it('a one-cent imbalance is reported, not swallowed', () => {
    // `Math.abs(diff) < 0.01` passed anything inside a cent in either
    // direction; a cent is a real difference on a balance sheet.
    const r = computeBalanceSheet([e('1000', 100.01, 0), e('2000', 0, 100)]);
    expect(r.diff).toBe(0.01);
    expect(r.isBalanced).toBe(false);
  });

  it('sub-cent noise on both sides rounds to a single exact zero', () => {
    const r = computeBalanceSheet([
      e('1000', 0.005, 0),
      e('1100', 0.005, 0),
      e('2000', 0, 0.01),
    ]);
    expect(r.diff).toBe(0);
    expect(r.isBalanced).toBe(true);
  });
});

describe('balanceSheetData — source guards', () => {
  const source = readFileSync('src/pages/reports/balanceSheetData.ts', 'utf-8');
  const pageSource = readFileSync('src/pages/reports/BalanceSheetPage.tsx', 'utf-8');
  // Comments deliberately name the defects; guards must read code, not prose.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const pageCode = pageSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('derives money through @/utils/money, never decimalUtils', () => {
    expect(code).toMatch(/from '@\/utils\/money'/);
    expect(code).not.toMatch(/decimalUtils/);
  });

  it('closing equity adds current-period earnings to posted equity', () => {
    expect(code).toMatch(/postedEquity\.plus\(currentPeriodEarnings\)/);
  });

  it('has no tolerance window on the balance test', () => {
    expect(code).not.toMatch(/Math\.abs\([^)]*diff[^)]*\)\s*<\s*0/);
    expect(code).toMatch(/isBalanced:\s*diff === 0/);
  });

  it('never takes the absolute value of an entry amount', () => {
    expect(code).not.toMatch(/Math\.abs\(\s*(e|entry)\./);
  });

  it('the page re-adds no total of its own', () => {
    expect(pageCode).not.toMatch(/totalLiabilities\s*\+\s*/);
    expect(pageCode).toMatch(/report\.totalLiabilitiesAndEquity/);
  });

  it('the page empty state heading is an h1 (UI-07)', () => {
    expect(pageCode).toMatch(/<h1[^>]*>\s*No Data\s*<\/h1>/);
    expect(pageCode).not.toMatch(/<h2/);
  });
});
