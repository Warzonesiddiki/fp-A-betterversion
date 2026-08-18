import { describe, it, expect } from 'vitest';
import {
  deriveGovernmentDashboard,
  type GovernmentBudgetLine,
  type GovernmentGLEntry,
} from './governmentDashboardData';

/**
 * Known-answer tests for the government dashboard derivation.
 *
 * Seeded ledger (hand-computed):
 *   FY2025  4100 Income Tax   credit 600,000       6100 Education debit 300,000
 *   FY2026  4100 Income Tax   credit 800,000       6100 Education debit 400,000
 *           4200 Grants       credit 200,000       6200 Public Safety debit 100,000
 *   posted revenue 1,600,000 · expenditure 800,000 · surplus 800,000
 *   FY2026 revenue 1,000,000 vs FY2025 600,000 -> +66.67%
 */
function line(
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number,
  period: string
): GovernmentGLEntry {
  return { accountCode, accountName, debit, credit, period };
}

const LEDGER: GovernmentGLEntry[] = [
  line('4100', 'Income Tax', 0, 600000, '2025-06'),
  line('6100', 'Education', 300000, 0, '2025-06'),
  line('4100', 'Income Tax', 0, 800000, '2026-03'),
  line('4200', 'Grants', 0, 200000, '2026-03'),
  line('6100', 'Education', 400000, 0, '2026-03'),
  line('6200', 'Public Safety', 100000, 0, '2026-03'),
];

const BUDGET: GovernmentBudgetLine[] = [
  { category: 'Education', budgeted: 800000, actual: 700000 },
  { category: 'Public Safety', budgeted: 200000, actual: 100000 },
  { category: 'Unfunded Programme', budgeted: 0, actual: 0 },
];

describe('deriveGovernmentDashboard — no demo fallback', () => {
  it('returns null when neither ledger nor budget carries anything', () => {
    expect(deriveGovernmentDashboard([], [])).toBeNull();
  });

  it('never emits the old demo categories', () => {
    const d = deriveGovernmentDashboard(LEDGER, BUDGET)!;
    const json = JSON.stringify(d);
    for (const demo of ['Infrastructure', 'Social Services', 'Administration', 'Sales Tax']) {
      expect(json).not.toContain(demo);
    }
    expect(json).not.toContain('93.2');
    expect(json).not.toContain('11.8');
  });
});

describe('deriveGovernmentDashboard — posted figures', () => {
  it('sums revenue and expenditure by natural balance', () => {
    const d = deriveGovernmentDashboard(LEDGER)!;
    expect(d.postedRevenue).toBe(1600000);
    expect(d.postedExpenditure).toBe(800000);
    expect(d.surplus).toBe(800000);
  });

  it('separates revenue categories from spending categories', () => {
    const d = deriveGovernmentDashboard(LEDGER)!;
    // The old page fed budget lines into both charts.
    expect(d.revenueByCategory).toEqual([
      { name: 'Income Tax', value: 1400000 },
      { name: 'Grants', value: 200000 },
    ]);
    expect(d.spendingDistribution).toEqual([
      { name: 'Education', value: 700000 },
      { name: 'Public Safety', value: 100000 },
    ]);
  });
});

describe('deriveGovernmentDashboard — budget execution', () => {
  it('computes execution per department from posted appropriations', () => {
    const d = deriveGovernmentDashboard(LEDGER, BUDGET)!;
    expect(d.departmentExecution[0]).toEqual({
      department: 'Education',
      allocated: 800000,
      spent: 700000,
      executionPercent: 87.5,
    });
    expect(d.totalAllocated).toBe(1000000);
    expect(d.overallExecutionPercent).toBe(80);
  });

  it('emits a null execution rather than dividing by a zero allocation', () => {
    const d = deriveGovernmentDashboard(LEDGER, BUDGET)!;
    const unfunded = d.departmentExecution.find((r) => r.department === 'Unfunded Programme')!;
    expect(unfunded.executionPercent).toBeNull();
  });

  it('declares budget execution unavailable with no appropriation lines', () => {
    const d = deriveGovernmentDashboard(LEDGER)!;
    expect(d.totalAllocated).toBeNull();
    expect(d.overallExecutionPercent).toBeNull();
    expect(d.unavailable.map((u) => u.label)).toContain('Budget execution by department');
  });
});

describe('deriveGovernmentDashboard — fiscal years', () => {
  it('derives the comparison from the years actually posted', () => {
    const d = deriveGovernmentDashboard(LEDGER)!;
    expect(d.priorFiscalYear).toBe('2025');
    expect(d.currentFiscalYear).toBe('2026');
    expect(d.fiscalYears[0]).toEqual({
      metric: 'Total Revenue',
      prior: 600000,
      current: 1000000,
      changePercent: 66.67,
    });
    expect(d.fiscalYears[2]).toMatchObject({
      metric: 'Surplus / (Deficit)',
      prior: 300000,
      current: 500000,
    });
  });

  it('emits a null change when there is no prior year', () => {
    const oneYear = LEDGER.filter((e) => e.period!.startsWith('2026'));
    const d = deriveGovernmentDashboard(oneYear)!;
    expect(d.priorFiscalYear).toBeNull();
    expect(d.fiscalYears[0]!.prior).toBeNull();
    expect(d.fiscalYears[0]!.changePercent).toBeNull();
  });
});

describe('deriveGovernmentDashboard — disclosures', () => {
  it('declares debt service, capex and per-citizen metrics unavailable', () => {
    const labels = deriveGovernmentDashboard(LEDGER, BUDGET)!.unavailable.map((u) => u.label);
    expect(labels).toContain('Debt service ratio');
    expect(labels).toContain('Capital expenditure');
    expect(labels).toContain('Programme effectiveness and cost per citizen');
  });

  it('uses decimal arithmetic — no IEEE-754 drift', () => {
    const pennies: GovernmentGLEntry[] = [
      line('4100', 'Tax', 0, 0.1, '2026-01'),
      line('4100', 'Tax', 0, 0.2, '2026-01'),
      line('6100', 'Programme', 0.3, 0, '2026-01'),
    ];
    const d = deriveGovernmentDashboard(pennies)!;
    expect(d.postedRevenue).toBe(0.3);
    expect(d.surplus).toBe(0);
  });
});
