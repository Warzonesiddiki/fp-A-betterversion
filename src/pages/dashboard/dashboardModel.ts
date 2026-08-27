/**
 * Executive-dashboard figures the posted General Ledger can actually support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`. No IEEE-754
 *    `+ - * /` on a currency value, and no raw float crosses into a
 *    formatter.
 * 2. Natural balance decides the sign, never `Math.abs`:
 *      revenue (prefix 4)                  = credit − debit
 *      cost    (prefixes 5 · 6 · 7 · 8)    = debit − credit
 *    `Math.abs` per entry turns a contra entry (a rebate, a credit memo, a
 *    reversal) into MORE cost and MORE revenue. Netting is the whole point
 *    of a ledger.
 * 3. The monthly trend uses the SAME convention as the KPI tiles. The prior
 *    implementation accumulated `debit − credit` into `revenue` for prefix 4,
 *    so every revenue point on the trend chart, on the Total Revenue
 *    sparkline, on the sector sparklines and in the anomaly scan was rendered
 *    with the wrong sign (revenue plotted negative), and monthly net income
 *    was `−revenue − expenses`.
 * 4. A ratio is emitted ONLY when its denominator is genuinely positive on
 *    the posted GL; otherwise `null`. Never a 0 stand-in and never an
 *    invented fallback.
 * 5. Account-code prefixes follow the app-wide convention:
 *      1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx
 *      7 Interest · 8 Income tax
 *    No jurisdiction, D&A or cash-flow-activity split is inferred — the GL
 *    does not carry those.
 *
 * `totalExpenses` therefore means every posted cost (5 + 6 + 7 + 8) and
 * `netIncome = revenue − totalExpenses` is a true net income, not an
 * operating subtotal wearing a net-income label.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface DashboardGLEntry {
  readonly accountCode?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
  readonly period?: string | null;
  readonly date?: string | null;
}

export interface DashboardBudget {
  readonly status?: string;
  readonly totalAmount?: number | null;
}

export interface DashboardKpis {
  readonly totalRevenue: number;
  readonly totalCOGS: number;
  readonly totalOpex: number;
  readonly totalInterest: number;
  readonly totalIncomeTax: number;
  /** COGS + OpEx + interest + income tax. */
  readonly totalExpenses: number;
  readonly grossProfit: number;
  readonly netIncome: number;
  /** Percent. `null` when posted revenue is not positive. */
  readonly grossMargin: number | null;
  readonly netMargin: number | null;
  readonly expenseRatio: number | null;
  readonly activeBudgets: number;
  readonly totalBudgetAmount: number;
  /** Percent. `null` when no positive budget exists to divide by. */
  readonly budgetUtilization: number | null;
}

export interface DashboardTrendPoint {
  readonly month: string;
  readonly revenue: number;
  readonly expenses: number;
  readonly netIncome: number;
}

export interface DashboardSectorKpi {
  readonly key: string;
  readonly label: string;
  /**
   * `null` = this tile cannot be honestly computed from the posted ledger:
   * the sector pack maps no account codes for it, none of the mapped codes
   * is posted, or the declared unit is not derivable by a flat money sum.
   * The UI must render an explicit empty state — never a fabricated $0.
   */
  readonly value: number | null;
  /** Display unit declared by the sector KPI spec (`'currency'` if omitted). */
  readonly format: 'currency' | 'percent' | 'number';
}

interface SectorKpiSpec {
  readonly id: string;
  readonly label: string;
  readonly format?: 'currency' | 'percent' | 'number';
  readonly accountCodes?: readonly string[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;
const TREND_MONTHS = 12;

/** Revenue-natured prefixes. Everything charged to P&L below is cost. */
const REVENUE_PREFIX = '4';
const COST_PREFIXES = ['5', '6', '7', '8'] as const;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

/**
 * Some import paths populate `amount` only. Prefer debit/credit when the row
 * genuinely carries them; fall back to the signed `amount` otherwise.
 */
function hasDebitCredit(entry: DashboardGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

/** Debit-normal accounts: assets and every expense. */
export function debitNormal(entry: DashboardGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

/** Credit-normal accounts: liabilities, equity and revenue. */
export function creditNormal(entry: DashboardGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function code(entry: DashboardGLEntry): string {
  return entry.accountCode ?? '';
}

function withPrefix(
  entries: readonly DashboardGLEntry[],
  prefix: string
): readonly DashboardGLEntry[] {
  return entries.filter((e) => code(e).startsWith(prefix));
}

function isRevenue(entry: DashboardGLEntry): boolean {
  return code(entry).startsWith(REVENUE_PREFIX);
}

function isCost(entry: DashboardGLEntry): boolean {
  return COST_PREFIXES.some((p) => code(entry).startsWith(p));
}

/** Percent, or `null` when the denominator is not positive. */
function percentOf(numer: Decimal, denom: Decimal): number | null {
  if (!denom.greaterThan(0)) return null;
  return divideMoney(numer, denom).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber();
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

/**
 * Derive the KPI tiles, key ratios and budget status from posted entries.
 *
 * Returns `null` when there are no posted entries — the dashboard must
 * empty-state rather than render a zeroed P&L that looks like a real one.
 */
export function deriveDashboardKpis(
  entries: readonly DashboardGLEntry[],
  budgets: readonly DashboardBudget[]
): DashboardKpis | null {
  if (entries.length === 0) return null;

  const revenue = sumMoney(withPrefix(entries, REVENUE_PREFIX).map(creditNormal));
  const cogs = sumMoney(withPrefix(entries, '5').map(debitNormal));
  const opex = sumMoney(withPrefix(entries, '6').map(debitNormal));
  const interest = sumMoney(withPrefix(entries, '7').map(debitNormal));
  const incomeTax = sumMoney(withPrefix(entries, '8').map(debitNormal));

  const expenses = sumMoney([cogs, opex, interest, incomeTax]);
  const grossProfit = revenue.minus(cogs);
  const netIncome = revenue.minus(expenses);

  const activeBudgets = budgets.filter(
    (b) => b.status === 'Approved' || b.status === 'InReview'
  ).length;
  const budgetTotal = sumMoney(budgets.map((b) => money(b.totalAmount)));

  return {
    totalRevenue: cash(revenue),
    totalCOGS: cash(cogs),
    totalOpex: cash(opex),
    totalInterest: cash(interest),
    totalIncomeTax: cash(incomeTax),
    totalExpenses: cash(expenses),
    grossProfit: cash(grossProfit),
    netIncome: cash(netIncome),
    grossMargin: percentOf(grossProfit, revenue),
    netMargin: percentOf(netIncome, revenue),
    expenseRatio: percentOf(expenses, revenue),
    activeBudgets,
    totalBudgetAmount: cash(budgetTotal),
    budgetUtilization: percentOf(expenses, budgetTotal),
  };
}

/**
 * Last 12 posted months of revenue / expenses / net income.
 *
 * Revenue is credit-normal here exactly as it is on the KPI tile, so the
 * chart and the tile can never disagree about the sign of a dollar.
 */
export function deriveMonthlyTrend(
  entries: readonly DashboardGLEntry[],
  months = TREND_MONTHS
): DashboardTrendPoint[] {
  if (entries.length === 0) return [];

  const buckets = new Map<string, { revenue: Decimal; expenses: Decimal }>();

  for (const entry of entries) {
    const month = entry.period || entry.date?.slice(0, 7);
    if (!month) continue;
    const bucket = buckets.get(month) ?? { revenue: ZERO, expenses: ZERO };
    if (isRevenue(entry)) {
      buckets.set(month, { ...bucket, revenue: bucket.revenue.plus(creditNormal(entry)) });
    } else if (isCost(entry)) {
      buckets.set(month, { ...bucket, expenses: bucket.expenses.plus(debitNormal(entry)) });
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([month, d]) => ({
      month,
      revenue: cash(d.revenue),
      expenses: cash(d.expenses),
      netIncome: cash(d.revenue.minus(d.expenses)),
    }));
}

/**
 * Sector KPI tiles, summed over the account codes the sector pack names.
 *
 * Signed by natural balance — a revenue-coded sector KPI is credit-normal.
 * The previous implementation summed `debit − credit` for every code and then
 * `Math.abs`-ed the result, so a revenue KPI displayed the right magnitude by
 * accident and a genuinely negative balance displayed positive.
 *
 * HONESTY GATES (W6-P0-06): every shipped sector pack declares `defaultKPIs`
 * without `accountCodes`, so most tiles are simply not computable. Each such
 * KPI is emitted with `value: null` — the UI renders an explicit empty state,
 * never a false $0. Percent- and number-unit specs stay uncomputed even when
 * codes ARE mapped: a flat account-code sum is a money magnitude, and dressing
 * it up as "42%" or a bare ratio would be fabrication; those units need
 * numerator/denominator (or count) semantics the SectorKPI spec does not carry.
 */
export function deriveSectorKpis(
  entries: readonly DashboardGLEntry[],
  kpis: readonly SectorKpiSpec[] | undefined
): DashboardSectorKpi[] {
  if (!kpis || entries.length === 0) return [];

  return kpis.map((kpi) => {
    const format = kpi.format ?? 'currency';
    const unmapped = !kpi.accountCodes || kpi.accountCodes.length === 0;
    if (unmapped || format !== 'currency') {
      return { key: kpi.id, label: kpi.label, value: null, format };
    }
    const mapped = kpi.accountCodes;
    const matching = entries.filter((e) => mapped.includes(code(e)));
    if (matching.length === 0) {
      return { key: kpi.id, label: kpi.label, value: null, format };
    }
    const value = sumMoney(matching.map((e) => (isRevenue(e) ? creditNormal(e) : debitNormal(e))));
    return { key: kpi.id, label: kpi.label, value: cash(value), format };
  });
}
