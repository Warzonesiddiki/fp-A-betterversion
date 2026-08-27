/**
 * W-FAB-001 — known-answer tests for the sector insurance dashboard.
 *
 * The page under test (`src/pages/sector/InsuranceDashboardPage.tsx`) no
 * longer computes anything of its own: it renders
 * `buildInsuranceDashboardModel` (@/pages/insurance/insuranceDashboardData),
 * the same derivation the insurance twin page consumes, which wraps the real
 * `InsuranceEngine`. Nothing here is `vi.mock`ed — every expectation below is
 * hand-computed from a seeded GL with real chart-of-accounts codes and
 * natural balances.
 *
 * The previous version of this file pinned `computeSectorDriverModel`
 * outputs: `retention_ratio` 100 and `solvency_ratio` 180 were fixture
 * formulas, "expenses" swept balance-sheet debits (cash / debt repayment)
 * and counted ceded premium 43xx as an expense. Those assertions were
 * deleted together with the tiles they fed; the traps that used to expose
 * the old sweeps (rent, loan repayment, investment income) are kept in the
 * ledger so a regression re-fails loudly.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GLEntry } from '@/types';
import { buildInsuranceDashboardModel } from '@/pages/insurance/insuranceDashboardData';

function entry(
  accountCode: string,
  debit: number,
  credit: number,
  period: string,
  accountName = 'Account'
): GLEntry {
  return {
    id: `${accountCode}-${period}-${String(debit)}-${String(credit)}`,
    accountId: accountCode,
    accountCode,
    accountName,
    period,
    periodName: period,
    debit,
    credit,
    netChange: debit - credit,
    date: `${period}-15`,
    amount: debit - credit,
    description: accountName,
    reference: 'TEST',
  };
}

/**
 * Hand-checkable book across two posting periods, with deliberate traps:
 *   4101 written premium     800k (Jan) + 400k (Feb) → 1,200,000
 *   4201 earned premium      500k (Jan) + 300k (Feb) →   800,000
 *   4301 ceded premium        —           100k (Feb) →   100,000
 *   4401 investment income    —            15k (Feb) → excluded from underwriting
 *   5100 loss & LAE         200k (Jan) + 250k (Feb) →   450,000
 *   5200 commission           —             30k (Feb) →    30,000
 *   5300 underwriting exp     —             20k (Feb) →    20,000
 *   6000 office rent          5k (Jan)  —           → NOT an underwriting expense
 *   2100 loan repayment      40k (Jan)  —           → NOT an underwriting expense
 */
function ledger(): GLEntry[] {
  return [
    entry('4101', 0, 800_000, '2026-01', 'Written premium'),
    entry('4201', 0, 500_000, '2026-01', 'Earned premium'),
    entry('5100', 200_000, 0, '2026-01', 'Loss and LAE'),
    entry('6000', 5_000, 0, '2026-01', 'Office rent'),
    entry('2100', 40_000, 0, '2026-01', 'Loan repayment'),
    entry('4101', 0, 400_000, '2026-02', 'Written premium'),
    entry('4201', 0, 300_000, '2026-02', 'Earned premium'),
    entry('4301', 100_000, 0, '2026-02', 'Reinsurance ceded'),
    entry('4401', 0, 15_000, '2026-02', 'Investment income'),
    entry('5100', 250_000, 0, '2026-02', 'Loss and LAE'),
    entry('5200', 30_000, 0, '2026-02', 'Commission expense'),
    entry('5300', 20_000, 0, '2026-02', 'Underwriting expense'),
  ];
}

describe('sector insurance dashboard — known answers through the shared derivation', () => {
  it('premium comes from 41xx/42xx credits only — no fallback sweep', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    // The 15k 4401 credit is investment income. The deleted page-local layer
    // swept any credit-side entry into revenue, which produced 1,215,000.
    expect(stats.grossWrittenPremium).toBe(1_200_000);
    expect(stats.earnedPremium).toBe(800_000);
  });

  it('ceded premium is reported separately and netted against written only', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    expect(stats.cededPremium).toBe(100_000);
    expect(stats.netWrittenPremium).toBe(1_100_000);
  });

  it('expenses are 52xx + 53xx only — balance-sheet and 43xx debits stay out', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    // Commission 30k + underwriting expense 20k. The deleted page-local layer
    // swept the 40k loan repayment and 5k rent debits into this figure and
    // also counted ceded 43xx as expense, producing 95,000 / 195,000.
    expect(stats.expenseTotal).toBe(50_000);
  });

  it('ratios divide the right pairs and round exactly', () => {
    const { stats } = buildInsuranceDashboardModel(ledger());
    // Loss & LAE 450,000 / earned 800,000.
    expect(stats.lossRatio).toBe(56.25);
    // Expense 50,000 / gross written 1,200,000 = 4.1666… → half-up 4.17.
    expect(stats.expenseRatio).toBe(4.17);
    expect(stats.combinedRatio).toBe(60.42);
    // Earned − loss − commission − underwriting expense.
    expect(stats.underwritingIncome).toBe(300_000);
    // Engine contract: a policy count is never invented from amounts.
    expect(stats.policyCount).toBeNull();
  });

  it('fractional premium sums exactly (0.1 + 0.2 = 0.3)', () => {
    const { stats } = buildInsuranceDashboardModel([
      entry('4101', 0, 0.1, '2026-01', 'Written premium'),
      entry('4101', 0, 0.2, '2026-01', 'Written premium'),
    ]);
    expect(stats.grossWrittenPremium).toBe(0.3);
  });

  it('zero premium yields null ratios — no fabricated 0 stand-ins', () => {
    const m = buildInsuranceDashboardModel([
      entry('5100', 25_000, 0, '2026-01', 'Loss and LAE'),
      entry('6000', 1_000, 0, '2026-01', 'Office rent'),
    ]);
    expect(m.hasData).toBe(true);
    expect(m.stats.grossWrittenPremium).toBe(0);
    expect(m.stats.earnedPremium).toBe(0);
    expect(m.stats.lossRatio).toBeNull();
    expect(m.stats.expenseRatio).toBeNull();
    expect(m.stats.combinedRatio).toBeNull();
    expect(m.stats.netWrittenPremium).toBeNull();
    // No earned premium anywhere means no plottable ratio series either.
    expect(m.trend).toHaveLength(0);
  });

  it('a ledger without any insurance prefix has no data at all', () => {
    const m = buildInsuranceDashboardModel([entry('6000', 1_000, 0, '2026-01', 'Rent')]);
    expect(m.hasData).toBe(false);
  });
});

describe('sector InsuranceDashboardPage — source guards (W-FAB-001)', () => {
  const codeOnly = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const page = codeOnly(readFileSync('src/pages/sector/InsuranceDashboardPage.tsx', 'utf-8'));

  it('derives through the shared insurance dashboard model', () => {
    expect(page).toMatch(/useGLStore/);
    expect(page).toMatch(/from '@\/pages\/insurance\/insuranceDashboardData'/);
    expect(page).toMatch(/buildInsuranceDashboardModel\(entries\)/);
  });

  it('holds no page-local stats layer or driver-model fallback', () => {
    expect(page).not.toMatch(/SectorDriverDashboard|computeSectorDriverModel|metricById/);
    expect(page).not.toMatch(/e\.credit\s*>\s*e\.debit|e\.debit\s*>\s*e\.credit/);
  });

  it('carries no fixture retention/solvency constants or variance arrows', () => {
    expect(page).not.toMatch(/\?\?\s*(90|180)/);
    expect(page).not.toMatch(/retention_ratio|solvency_ratio|claimCount|avgClaim/);
    expect(page).not.toMatch(/varianceToTargetPct/);
    expect(page).not.toMatch(/change=\{/);
  });

  it('discloses what the ledger cannot support instead of rendering it', () => {
    expect(page).toMatch(/Not derivable from this ledger/);
    expect(page).toMatch(/Retention rate/);
    expect(page).toMatch(/Solvency II ratio/);
    expect(page).toMatch(/[Pp]olicy count/);
    expect(page).toMatch(/[Aa]verage claim\s+size/);
  });
});
