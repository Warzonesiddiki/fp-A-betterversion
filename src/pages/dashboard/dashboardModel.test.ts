import { describe, it, expect } from 'vitest';
import {
  deriveDashboardKpis,
  deriveMonthlyTrend,
  deriveSectorKpis,
  type DashboardGLEntry,
} from './dashboardModel';

/**
 * Known-answer tests for the executive-dashboard derivation.
 *
 * Hand-computed ledger (every figure below is derived by hand, not copied from
 * a previous run of this code):
 *
 *   4000  credit 100,000            gross revenue
 *   4000  debit    5,000            customer refund (contra revenue)
 *     -> revenue            95,000  (credit − debit, NOT abs)
 *   5000  debit   60,000            COGS
 *   5000  credit  10,000            vendor rebate (contra COGS)
 *     -> COGS               50,000
 *   6000  debit   20,000            OpEx
 *   7000  debit    2,000            interest
 *   8000  debit    3,000            income tax
 *     -> total expenses     75,000
 *
 *   gross profit  = 95,000 − 50,000 = 45,000
 *   net income    = 95,000 − 75,000 = 20,000
 *   gross margin  = 45,000 / 95,000 = 47.37%
 *   net margin    = 20,000 / 95,000 = 21.05%
 *   expense ratio = 75,000 / 95,000 = 78.95%
 */
const LEDGER: DashboardGLEntry[] = [
  { accountCode: '4000', debit: 0, credit: 100000, period: '2026-01' },
  { accountCode: '4000', debit: 5000, credit: 0, period: '2026-01' },
  { accountCode: '5000', debit: 60000, credit: 0, period: '2026-01' },
  { accountCode: '5000', debit: 0, credit: 10000, period: '2026-02' },
  { accountCode: '6000', debit: 20000, credit: 0, period: '2026-02' },
  { accountCode: '7000', debit: 2000, credit: 0, period: '2026-02' },
  { accountCode: '8000', debit: 3000, credit: 0, period: '2026-02' },
];

describe('deriveDashboardKpis — known answer', () => {
  it('nets contra entries instead of Math.abs-ing them', () => {
    const kpis = deriveDashboardKpis(LEDGER, []);
    expect(kpis).not.toBeNull();
    // Math.abs per entry would give revenue 105,000 and COGS 70,000.
    expect(kpis!.totalRevenue).toBe(95000);
    expect(kpis!.totalCOGS).toBe(50000);
    expect(kpis!.totalOpex).toBe(20000);
    expect(kpis!.totalInterest).toBe(2000);
    expect(kpis!.totalIncomeTax).toBe(3000);
  });

  it('derives gross profit, total expenses and net income', () => {
    const kpis = deriveDashboardKpis(LEDGER, [])!;
    expect(kpis.grossProfit).toBe(45000);
    expect(kpis.totalExpenses).toBe(75000);
    expect(kpis.netIncome).toBe(20000);
    // Identity: revenue − expenses must equal net income exactly.
    expect(kpis.totalRevenue - kpis.totalExpenses).toBe(kpis.netIncome);
  });

  it('derives margins to two places', () => {
    const kpis = deriveDashboardKpis(LEDGER, [])!;
    expect(kpis.grossMargin).toBe(47.37);
    expect(kpis.netMargin).toBe(21.05);
    expect(kpis.expenseRatio).toBe(78.95);
  });

  it('returns null (not a zeroed P&L) when nothing is posted', () => {
    expect(deriveDashboardKpis([], [])).toBeNull();
  });

  it('emits null ratios rather than a 0 stand-in when revenue is not posted', () => {
    const costOnly: DashboardGLEntry[] = [{ accountCode: '6000', debit: 500, credit: 0 }];
    const kpis = deriveDashboardKpis(costOnly, [])!;
    expect(kpis.grossMargin).toBeNull();
    expect(kpis.netMargin).toBeNull();
    expect(kpis.expenseRatio).toBeNull();
    expect(kpis.netIncome).toBe(-500);
  });

  it('emits a null budget utilization when no budget amount exists to divide by', () => {
    const kpis = deriveDashboardKpis(LEDGER, [{ status: 'Approved', totalAmount: 0 }])!;
    expect(kpis.budgetUtilization).toBeNull();
    expect(kpis.activeBudgets).toBe(1);
  });

  it('computes budget utilization from total posted expense', () => {
    const kpis = deriveDashboardKpis(LEDGER, [
      { status: 'Approved', totalAmount: 100000 },
      { status: 'Draft', totalAmount: 50000 },
    ])!;
    // 75,000 / 150,000 = 50%
    expect(kpis.totalBudgetAmount).toBe(150000);
    expect(kpis.budgetUtilization).toBe(50);
    expect(kpis.activeBudgets).toBe(1);
  });

  it('uses decimal arithmetic — no IEEE-754 drift', () => {
    const pennies: DashboardGLEntry[] = [
      { accountCode: '4000', debit: 0, credit: 0.1 },
      { accountCode: '4000', debit: 0, credit: 0.2 },
      { accountCode: '5000', debit: 0.1, credit: 0 },
      { accountCode: '5000', debit: 0.2, credit: 0 },
    ];
    const kpis = deriveDashboardKpis(pennies, [])!;
    // 0.1 + 0.2 === 0.30000000000000004 in IEEE-754.
    expect(kpis.totalRevenue).toBe(0.3);
    expect(kpis.totalCOGS).toBe(0.3);
    expect(kpis.netIncome).toBe(0);
  });

  it('falls back to a signed amount when the row carries no debit/credit', () => {
    const amountOnly: DashboardGLEntry[] = [
      { accountCode: '4000', amount: 1000 },
      { accountCode: '6000', amount: 400 },
    ];
    const kpis = deriveDashboardKpis(amountOnly, [])!;
    expect(kpis.totalRevenue).toBe(1000);
    expect(kpis.totalOpex).toBe(400);
  });
});

describe('deriveMonthlyTrend — sign regression lock', () => {
  it('plots revenue POSITIVE for credit-balance revenue accounts', () => {
    const trend = deriveMonthlyTrend(LEDGER);
    const jan = trend.find((p) => p.month === '2026-01')!;
    // The pre-session-017 implementation accumulated `debit − credit` here and
    // produced −100,000 + 5,000 = −95,000. A negative revenue point is the bug.
    expect(jan.revenue).toBe(95000);
    expect(jan.revenue).toBeGreaterThan(0);
  });

  it('keeps the trend consistent with the KPI tiles', () => {
    const trend = deriveMonthlyTrend(LEDGER);
    const kpis = deriveDashboardKpis(LEDGER, [])!;
    const revenue = trend.reduce((a, p) => a + p.revenue, 0);
    const expenses = trend.reduce((a, p) => a + p.expenses, 0);
    expect(revenue).toBe(kpis.totalRevenue);
    expect(expenses).toBe(kpis.totalExpenses);
  });

  it('buckets by period and nets contra entries per month', () => {
    const trend = deriveMonthlyTrend(LEDGER);
    expect(trend.map((p) => p.month)).toEqual(['2026-01', '2026-02']);
    const jan = trend[0]!;
    const feb = trend[1]!;
    expect(jan.expenses).toBe(60000);
    expect(jan.netIncome).toBe(35000);
    // Feb: rebate −10,000 + opex 20,000 + interest 2,000 + tax 3,000 = 15,000
    expect(feb.revenue).toBe(0);
    expect(feb.expenses).toBe(15000);
    expect(feb.netIncome).toBe(-15000);
  });

  it('falls back to the date when no period is set, and keeps only the last N months', () => {
    const entries: DashboardGLEntry[] = Array.from({ length: 14 }, (_, i) => ({
      accountCode: '4000',
      debit: 0,
      credit: 100,
      date: `2025-${String(i + 1).padStart(2, '0')}-15`,
    })).slice(0, 14);
    const trend = deriveMonthlyTrend(entries, 12);
    expect(trend.length).toBe(12);
    expect(trend[0]!.month).toBe('2025-03');
  });

  it('returns an empty series for an empty ledger', () => {
    expect(deriveMonthlyTrend([])).toEqual([]);
  });
});

describe('deriveSectorKpis', () => {
  it('signs each KPI by natural balance instead of Math.abs', () => {
    const kpis = deriveSectorKpis(LEDGER, [
      { id: 'rev', label: 'Patient Revenue', accountCodes: ['4000'] },
      { id: 'cost', label: 'Supply Cost', accountCodes: ['5000'] },
    ]);
    expect(kpis).toEqual([
      { key: 'rev', label: 'Patient Revenue', value: 95000, format: 'currency' },
      { key: 'cost', label: 'Supply Cost', value: 50000, format: 'currency' },
    ]);
  });

  it('keeps a genuinely negative balance negative', () => {
    const refundOnly: DashboardGLEntry[] = [{ accountCode: '4000', debit: 250, credit: 0 }];
    const kpis = deriveSectorKpis(refundOnly, [
      { id: 'rev', label: 'Revenue', accountCodes: ['4000'] },
    ]);
    // Math.abs would display +250 of "revenue" for a pure refund month.
    expect(kpis[0]!.value).toBe(-250);
  });

  it('returns nothing without a sector config or without entries', () => {
    expect(deriveSectorKpis(LEDGER, undefined)).toEqual([]);
    expect(deriveSectorKpis([], [{ id: 'a', label: 'A', accountCodes: ['4000'] }])).toEqual([]);
  });
});
