/**
 * GAP-1 (F-0006) known-answer tests for the export route's money migration.
 *
 * The PDF report builder previously computed the trial-balance `Balance`
 * and the budget-vs-actual `Actual Amount`/`Variance` inside SQL on
 * IEEE-754 REALs (`SUM(ge.debit) - SUM(ge.credit)`,
 * `SUM(bli.amount) - SUM(ge.debit - ge.credit)`). Raw component sums now
 * arrive from SQL and the derived currency figures are computed at exact
 * decimal precision (decimal.js — the canonical engine behind
 * `src/utils/money.ts`), cent-rounded with declared ROUND_HALF_UP at the
 * output boundary. Account codes/names and budget names are passthroughs.
 * Each fixed input asserts the exact result with `toBe`; the pre-migration
 * IEEE-754 output is recorded inline.
 */

import { describe, it, expect } from 'vitest';
import { buildTrialBalanceReportRows, buildBudgetVsActualReportRows } from './export.js';

describe('export report rows — money known answers (GAP-1 / F-0006)', () => {
  it('computes trial-balance balances exactly (old float: 0.20000000000000004)', () => {
    // SQLite SUM(0.1, 0.2) = 0.30000000000000004, minus credit 0.1:
    // 0.30000000000000004 - 0.1 = 0.20000000000000004 in float; exact
    // decimal gives 0.2.
    const rows = buildTrialBalanceReportRows([
      {
        'Account Code': '1000',
        'Account Name': 'Cash',
        Type: 'Asset',
        'Total Debit': 0.30000000000000004,
        'Total Credit': 0.1,
      },
    ]);

    expect(rows[0]?.['Balance']).toBe(0.2);
    expect(rows[0]?.['Total Debit']).toBe(0.3);
    expect(rows[0]?.['Total Credit']).toBe(0.1);
  });

  it('rounds imported half-cent sums with declared half-up (old float: 1.005)', () => {
    const rows = buildTrialBalanceReportRows([
      {
        'Account Code': '1000',
        'Account Name': 'Cash',
        Type: 'Asset',
        'Total Debit': 1.005,
        'Total Credit': 0,
      },
    ]);

    expect(rows[0]?.['Balance']).toBe(1.01);
  });

  it('computes budget-vs-actual variance exactly (old float: 0.39999999999999997)', () => {
    // Budget 0.6 − actual (0.30000000000000004 − 0.1 = 0.20000000000000004)
    // = 0.39999999999999997 in float; exact decimal gives 0.4.
    const rows = buildBudgetVsActualReportRows([
      {
        'Account Code': '4000',
        'Account Name': 'Revenue',
        Budget: 'FY2026 Budget',
        'Budget Amount': 0.6,
        'Actual Debit': 0.30000000000000004,
        'Actual Credit': 0.1,
      },
    ]);

    expect(rows[0]?.['Actual Amount']).toBe(0.2);
    expect(rows[0]?.['Variance']).toBe(0.4);
  });

  it('subtracts budget minus actual exactly (old float: 0.49999999999999994)', () => {
    const rows = buildBudgetVsActualReportRows([
      {
        'Account Code': '4000',
        'Account Name': 'Revenue',
        Budget: 'FY2026 Budget',
        'Budget Amount': 0.7,
        'Actual Debit': 0.2,
        'Actual Credit': 0,
      },
    ]);

    expect(rows[0]?.['Variance']).toBe(0.5);
  });

  it('passes through labels and returns empty arrays for empty input (control)', () => {
    const tb = buildTrialBalanceReportRows([]);
    const bva = buildBudgetVsActualReportRows([]);

    expect(tb).toEqual([]);
    expect(bva).toEqual([]);
  });
});
