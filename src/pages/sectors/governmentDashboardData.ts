/**
 * Government-sector dashboard figures the posted GL and posted budget support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **No demo fallback.** The page previously rendered `mockDepartmentBudget`,
 *    `mockRevenueByCategory` and `mockSpendingDistribution` whenever the
 *    government store was empty — which is the state of every new workspace —
 *    so a brand-new tenant saw Education allocated 3,100 / 93.2% executed and
 *    Income Tax of 4,200 as if they were their own numbers. A missing input
 *    produces an empty state, never a demonstration.
 * 2. **No hardcoded KPI strip.** `$11.8B` allocation, `$8.95B` tax revenue,
 *    `$800M` surplus, `1.48x` debt service, `$1.9B` capex, `87.3%` programme
 *    effectiveness and `$342` per citizen were literals that never touched a
 *    store. Each is now derived, or declared unavailable with the reason.
 * 3. **Revenue is revenue.** The page mapped budget lines' `budgeted` amount
 *    into a chart labelled "Revenue by Category" and the same lines' `actual`
 *    into "Spending Distribution" — one dataset shown as two different things,
 *    neither of which it was. Revenue (prefix 4) and expenditure (5–8) now
 *    come from the posted ledger; budget execution comes from budget lines.
 * 4. **Fiscal-year comparison is computed**, not typed: posted revenue and
 *    expenditure grouped by the year of each period, with the change between
 *    the two most recent years. `null` change when there is no prior year.
 * 5. All money arithmetic is decimal.js via `@/utils/money`; natural balance
 *    decides sign; no `Math.abs` on an entry.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface GovernmentGLEntry {
  readonly accountCode?: string | null;
  readonly accountName?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
  readonly period?: string | null;
  readonly date?: string | null;
}

export interface GovernmentBudgetLine {
  readonly category: string;
  readonly budgeted: number;
  readonly actual: number;
}

export interface DepartmentExecutionRow {
  readonly department: string;
  readonly allocated: number;
  readonly spent: number;
  /** Execution percentage; `null` when nothing was allocated to divide by. */
  readonly executionPercent: number | null;
}

export interface CategoryAmountRow {
  readonly name: string;
  readonly value: number;
}

export interface FiscalYearRow {
  readonly metric: string;
  readonly prior: number | null;
  readonly current: number;
  /** Percentage change against the prior year; `null` without one. */
  readonly changePercent: number | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface GovernmentDashboard {
  readonly postedRevenue: number;
  readonly postedExpenditure: number;
  readonly surplus: number;
  readonly totalAllocated: number | null;
  readonly totalSpentAgainstBudget: number | null;
  readonly overallExecutionPercent: number | null;
  readonly departmentExecution: readonly DepartmentExecutionRow[];
  readonly revenueByCategory: readonly CategoryAmountRow[];
  readonly spendingDistribution: readonly CategoryAmountRow[];
  readonly fiscalYears: readonly FiscalYearRow[];
  readonly currentFiscalYear: string | null;
  readonly priorFiscalYear: string | null;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

const REVENUE_PREFIX = '4';
const COST_PREFIXES = ['5', '6', '7', '8'] as const;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(entry: GovernmentGLEntry): string {
  return entry.accountCode ?? '';
}

function hasDebitCredit(entry: GovernmentGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function debitNormal(entry: GovernmentGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: GovernmentGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function isRevenue(entry: GovernmentGLEntry): boolean {
  return code(entry).startsWith(REVENUE_PREFIX);
}

function isCost(entry: GovernmentGLEntry): boolean {
  return COST_PREFIXES.some((p) => code(entry).startsWith(p));
}

function yearOf(entry: GovernmentGLEntry): string | null {
  const key = entry.period || entry.date;
  if (!key) return null;
  const year = key.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

function percent(numer: Decimal, denom: Decimal): number | null {
  if (denom.isZero()) return null;
  return divideMoney(numer, denom).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber();
}

function groupByAccount(
  entries: readonly GovernmentGLEntry[],
  sign: (e: GovernmentGLEntry) => Decimal
): CategoryAmountRow[] {
  const map = new Map<string, { name: string; value: Decimal }>();
  for (const entry of entries) {
    const key = code(entry);
    const existing = map.get(key) ?? { name: entry.accountName || key, value: ZERO };
    existing.value = existing.value.plus(sign(entry));
    map.set(key, existing);
  }
  return [...map.values()]
    .map((v) => ({ name: v.name, value: cash(v.value) }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/**
 * Derive the government dashboard.
 *
 * Returns `null` when neither the ledger nor the budget carries anything —
 * the page must then ask for data instead of demonstrating a fictional
 * jurisdiction.
 */
export function deriveGovernmentDashboard(
  entries: readonly GovernmentGLEntry[],
  budgetLines: readonly GovernmentBudgetLine[] = []
): GovernmentDashboard | null {
  const revenueEntries = entries.filter(isRevenue);
  const costEntries = entries.filter(isCost);
  if (revenueEntries.length === 0 && costEntries.length === 0 && budgetLines.length === 0) {
    return null;
  }

  const postedRevenue = sumMoney(revenueEntries.map(creditNormal));
  const postedExpenditure = sumMoney(costEntries.map(debitNormal));

  const allocated = sumMoney(budgetLines.map((l) => money(l.budgeted)));
  const spent = sumMoney(budgetLines.map((l) => money(l.actual)));

  const departmentExecution: DepartmentExecutionRow[] = budgetLines.map((l) => ({
    department: l.category,
    allocated: cash(money(l.budgeted)),
    spent: cash(money(l.actual)),
    executionPercent: percent(money(l.actual), money(l.budgeted)),
  }));

  // Fiscal-year comparison from the years actually posted.
  const byYear = new Map<string, { revenue: Decimal; expenditure: Decimal }>();
  for (const entry of entries) {
    const year = yearOf(entry);
    if (!year) continue;
    const revenue = isRevenue(entry);
    const cost = isCost(entry);
    if (!revenue && !cost) continue;
    const bucket = byYear.get(year) ?? { revenue: ZERO, expenditure: ZERO };
    if (revenue) bucket.revenue = bucket.revenue.plus(creditNormal(entry));
    else bucket.expenditure = bucket.expenditure.plus(debitNormal(entry));
    byYear.set(year, bucket);
  }

  const years = [...byYear.keys()].sort();
  const currentFiscalYear = years.at(-1) ?? null;
  const priorFiscalYear = years.length > 1 ? years.at(-2)! : null;
  const current = currentFiscalYear ? byYear.get(currentFiscalYear)! : null;
  const prior = priorFiscalYear ? byYear.get(priorFiscalYear)! : null;

  const fiscalYears: FiscalYearRow[] = current
    ? [
        {
          metric: 'Total Revenue',
          prior: prior ? cash(prior.revenue) : null,
          current: cash(current.revenue),
          changePercent: prior
            ? percent(current.revenue.minus(prior.revenue), prior.revenue)
            : null,
        },
        {
          metric: 'Total Expenditure',
          prior: prior ? cash(prior.expenditure) : null,
          current: cash(current.expenditure),
          changePercent: prior
            ? percent(current.expenditure.minus(prior.expenditure), prior.expenditure)
            : null,
        },
        {
          metric: 'Surplus / (Deficit)',
          prior: prior ? cash(prior.revenue.minus(prior.expenditure)) : null,
          current: cash(current.revenue.minus(current.expenditure)),
          changePercent: null,
        },
      ]
    : [];

  const unavailable: UnavailableLine[] = [];
  if (budgetLines.length === 0) {
    unavailable.push({
      label: 'Budget execution by department',
      reason: 'No appropriation lines have been loaded into the government workspace.',
    });
  }
  unavailable.push(
    {
      label: 'Debt service ratio',
      reason:
        'Requires a debt-service schedule (principal and interest due by period). Posted interest alone does not give the ratio.',
    },
    {
      label: 'Capital expenditure',
      reason:
        'Capital versus operating classification is not carried on the chart of accounts in this workspace.',
    },
    {
      label: 'Programme effectiveness and cost per citizen',
      reason:
        'Programme outcomes and population are not ledger facts. They need service-delivery and census inputs.',
    }
  );

  return {
    postedRevenue: cash(postedRevenue),
    postedExpenditure: cash(postedExpenditure),
    surplus: cash(postedRevenue.minus(postedExpenditure)),
    totalAllocated: budgetLines.length > 0 ? cash(allocated) : null,
    totalSpentAgainstBudget: budgetLines.length > 0 ? cash(spent) : null,
    overallExecutionPercent: budgetLines.length > 0 ? percent(spent, allocated) : null,
    departmentExecution,
    revenueByCategory: groupByAccount(revenueEntries, creditNormal),
    spendingDistribution: groupByAccount(costEntries, debitNormal),
    fiscalYears,
    currentFiscalYear,
    priorFiscalYear,
    unavailable,
  };
}
