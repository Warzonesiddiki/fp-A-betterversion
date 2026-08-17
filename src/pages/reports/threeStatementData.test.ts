import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { deriveThreeStatement } from './threeStatementData';
import { ThreeStatementEngine } from '@/engines/ThreeStatementEngine';
import type { GLEntry } from '@/types';

/**
 * Regression suite for the three-statement derivation.
 *
 * Context: the page this module replaced rendered materially wrong statements on a
 * clean balanced ledger (Revenue -$1,150 instead of $1,000; COGS $0 instead of $400;
 * Net Income -$1,650 instead of $350). Three stacked defects caused it:
 *   1. revenue computed as `debit - credit` (credit-normal accounts came out negative),
 *      the exact inverse of the sign contract ThreeStatementEngine expects;
 *   2. `Math.abs()` applied per entry, silently discarding contra/reversing entries;
 *   3. the view back-solving Revenue and COGS out of grossProfit/netIncome.
 * Every test below pins one of those open.
 */

let seq = 0;
function entry(accountCode: string, debit: number, credit: number, period = '2026-01'): GLEntry {
  seq += 1;
  return {
    id: `e${seq}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    debit,
    credit,
    netChange: debit - credit,
    amount: debit - credit,
    period,
    date: `${period}-15`,
    description: 'test entry',
  } as GLEntry;
}

/**
 * A genuinely balanced double-entry ledger (total debits === total credits):
 *   owner contributes 500 cash; sells 1,000 for cash; pays 400 COGS; pays 250 opex.
 * Expected: Revenue 1,000 · COGS 400 · GP 600 · Opex 250 · NI 350 · Cash 850 · Equity 850.
 */
function balancedLedger(): GLEntry[] {
  return [
    entry('1000', 500, 0),
    entry('3000', 0, 500),
    entry('1000', 1000, 0),
    entry('4000', 0, 1000),
    entry('5000', 400, 0),
    entry('1000', 0, 400),
    entry('6000', 250, 0),
    entry('1000', 0, 250),
  ];
}

describe('deriveThreeStatement — the exact figures the old page got wrong', () => {
  it('produces the correct income statement on a clean balanced ledger', () => {
    const { totals } = deriveThreeStatement(balancedLedger(), '2026-12');

    // The four values the previous implementation rendered incorrectly.
    expect(totals.revenue.toNumber()).toBe(1000); // was -1150
    expect(totals.cogs.toNumber()).toBe(400); // was 0
    expect(totals.grossProfit.toNumber()).toBe(600); // was -1400
    expect(totals.netIncome.toNumber()).toBe(350); // was -1650

    expect(totals.opex.toNumber()).toBe(250);
    expect(totals.operatingIncome.toNumber()).toBe(350);
  });

  it('keeps the fixture itself honest: debits equal credits', () => {
    const rows = balancedLedger();
    const debits = rows.reduce((s, r) => s + r.debit, 0);
    const credits = rows.reduce((s, r) => s + r.credit, 0);
    expect(debits).toBe(credits);
  });
});

describe('sign contract conformance with ThreeStatementEngine', () => {
  /**
   * ThreeStatementEngine.test.ts pins the convention: revenue is POSITIVE and every
   * cost line is NEGATIVE. The old page passed the exact inverse on every line.
   */
  it('emits revenue positive and all cost categories negative', () => {
    const { incomeStatement } = deriveThreeStatement(balancedLedger(), '2026-12');

    const sum = (rows: { amount: number }[]) => rows.reduce((s, r) => s + r.amount, 0);

    expect(sum(incomeStatement.revenue)).toBeGreaterThan(0);
    expect(sum(incomeStatement.cogs)).toBeLessThan(0);
    expect(sum(incomeStatement.opex)).toBeLessThan(0);
  });

  it('links through the engine and balances exactly', () => {
    const derived = deriveThreeStatement(balancedLedger(), '2026-12');
    const result = ThreeStatementEngine.link(
      derived.incomeStatement,
      derived.balanceSheet,
      derived.cashFlow,
      [],
      0
    );

    expect(result.balanceCheck.isBalanced).toBe(true);
    expect(result.balanceCheck.imbalance).toBe(0);
  });

  it('agrees with the engine on net income', () => {
    const derived = deriveThreeStatement(balancedLedger(), '2026-12');
    expect(derived.incomeStatement.netIncome).toBe(derived.totals.netIncome.toNumber());
  });
});

describe('balance sheet integrity', () => {
  it('satisfies A = L + E with a non-zero net income', () => {
    const { balanceSheet, totals } = deriveThreeStatement(balancedLedger(), '2026-12');

    expect(totals.netIncome.toNumber()).not.toBe(0);
    expect(balanceSheet.totalAssets).toBe(
      balanceSheet.totalLiabilities + balanceSheet.totalEquity
    );
  });

  it('rolls current-period earnings into equity', () => {
    // Posted equity is 500; net income is 350; equity must therefore be 850.
    const { balanceSheet } = deriveThreeStatement(balancedLedger(), '2026-12');
    expect(balanceSheet.totalEquity).toBe(850);
  });

  it('balances when liabilities are present', () => {
    // Buy 300 of inventory on account, then sell it for 500 cash.
    const rows = [
      entry('1000', 500, 0),
      entry('3000', 0, 500),
      entry('1300', 300, 0),
      entry('2100', 0, 300),
      entry('1000', 500, 0),
      entry('4000', 0, 500),
      entry('5000', 300, 0),
      entry('1300', 0, 300),
    ];

    const { balanceSheet, totals } = deriveThreeStatement(rows, '2026-12');

    expect(totals.revenue.toNumber()).toBe(500);
    expect(totals.netIncome.toNumber()).toBe(200);
    expect(balanceSheet.totalLiabilities).toBe(300);
    expect(balanceSheet.totalAssets).toBe(
      balanceSheet.totalLiabilities + balanceSheet.totalEquity
    );
  });
});

describe('contra and reversing entries', () => {
  /**
   * The old code applied Math.abs() per entry, so a reversal added to the total
   * instead of cancelling it. These pin the netting behaviour.
   */
  it('nets a credit memo against revenue instead of adding to it', () => {
    const rows = [
      entry('1000', 1000, 0),
      entry('4000', 0, 1000),
      entry('4000', 150, 0), // credit memo / sales return
      entry('1000', 0, 150),
    ];

    const { totals } = deriveThreeStatement(rows, '2026-12');
    // Math.abs() per entry would give 1150 here.
    expect(totals.revenue.toNumber()).toBe(850);
  });

  it('nets a reversing entry against COGS instead of doubling it', () => {
    const rows = [
      entry('5000', 400, 0),
      entry('1000', 0, 400),
      entry('5000', 0, 400), // full reversal
      entry('1000', 400, 0),
    ];

    const { totals } = deriveThreeStatement(rows, '2026-12');
    // Math.abs() per entry would give 800 here.
    expect(totals.cogs.toNumber()).toBe(0);
  });

  it('allows a contra account to drive a category negative rather than clamping it', () => {
    const rows = [
      entry('4000', 0, 100),
      entry('4000', 250, 0), // returns exceed sales in the period
    ];

    const { totals } = deriveThreeStatement(rows, '2026-12');
    expect(totals.revenue.toNumber()).toBe(-150);
  });
});

describe('period handling', () => {
  it('accumulates cumulatively up to and including the cutoff period', () => {
    const rows = [
      entry('4000', 0, 100, '2026-01'),
      entry('4000', 0, 200, '2026-02'),
      entry('4000', 0, 400, '2026-03'),
    ];

    expect(deriveThreeStatement(rows, '2026-01').totals.revenue.toNumber()).toBe(100);
    expect(deriveThreeStatement(rows, '2026-02').totals.revenue.toNumber()).toBe(300);
    expect(deriveThreeStatement(rows, '2026-03').totals.revenue.toNumber()).toBe(700);
  });

  it('excludes periods after the cutoff', () => {
    const rows = [
      entry('4000', 0, 100, '2026-01'),
      entry('4000', 0, 900, '2026-11'),
    ];
    expect(deriveThreeStatement(rows, '2026-02').totals.revenue.toNumber()).toBe(100);
  });

  it('orders periods lexicographically across a year boundary', () => {
    const rows = [
      entry('4000', 0, 100, '2025-12'),
      entry('4000', 0, 250, '2026-01'),
    ];
    expect(deriveThreeStatement(rows, '2026-01').totals.revenue.toNumber()).toBe(350);
  });

  it('returns zeroed statements for an empty ledger', () => {
    const { totals, balanceSheet } = deriveThreeStatement([], '2026-12');
    expect(totals.revenue.toNumber()).toBe(0);
    expect(totals.netIncome.toNumber()).toBe(0);
    expect(balanceSheet.totalAssets).toBe(0);
  });
});

describe('decimal exactness', () => {
  it('sums repeating cents without float drift', () => {
    // 0.1 + 0.2 in IEEE-754 is 0.30000000000000004.
    const rows = [
      entry('4000', 0, 0.1),
      entry('4000', 0, 0.2),
    ];
    expect(deriveThreeStatement(rows, '2026-12').totals.revenue.toString()).toBe('0.3');
  });

  it('holds exactness across many small entries', () => {
    const rows = Array.from({ length: 1000 }, () => entry('4000', 0, 0.01));
    expect(deriveThreeStatement(rows, '2026-12').totals.revenue.toNumber()).toBe(10);
  });

  it('does not round intermediate subtotals away from the true net income', () => {
    const rows = [
      entry('4000', 0, 1000.555),
      entry('5000', 400.333, 0),
    ];
    const { totals } = deriveThreeStatement(rows, '2026-12');
    expect(totals.netIncome.toString()).toBe('600.222');
  });
});

/** Strip comments so prose describing a defect never satisfies a guard against it. */
function codeOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

describe('source-level guards against reintroduced defects', () => {
  const source = codeOnly(readFileSync('src/pages/reports/threeStatementData.ts', 'utf-8'));

  it('contains no Math.abs (it discards contra entries)', () => {
    expect(source).not.toMatch(/Math\.abs/);
  });

  it('contains no hardcoded ratio multipliers', () => {
    // e.g. `assets * 0.15` or `.times(0.15)` — the fabrication pattern found elsewhere.
    expect(source).not.toMatch(/[*]\s*0\.\d+/);
    expect(source).not.toMatch(/\.times\(\s*0\.\d+\s*\)/);
  });

  it('does not back-solve line items from grossProfit or netIncome', () => {
    expect(source).not.toMatch(/grossProfit\s*-\s*netIncome/);
  });
});

describe('the page consumes the derivation instead of recomputing it', () => {
  const raw = readFileSync('src/pages/reports/ThreeStatementDashboardPage.tsx', 'utf-8');
  const page = codeOnly(raw);

  it('imports the shared derivation module', () => {
    expect(raw).toMatch(/deriveThreeStatement/);
  });

  it('no longer back-solves revenue or COGS in the view or the export', () => {
    expect(page).not.toMatch(/grossProfit\s*-\s*incomeStatement\.netIncome/);
    expect(page).not.toMatch(/incomeStatement\.grossProfit\s*\+/);
  });

  it('does not apply Math.abs to ledger amounts', () => {
    expect(page).not.toMatch(/Math\.abs/);
  });
});
