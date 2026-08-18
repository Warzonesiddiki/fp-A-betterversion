/**
 * Rolling forecast — posted actuals, a disclosed projection method, and a
 * backtested accuracy figure instead of an invented one.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **Actuals are P&L, signed by natural balance.** The previous page built
 *    its monthly series with `existing.actual += e.debit − e.credit` over
 *    EVERY account, so balance-sheet postings entered the trend, revenue
 *    entered it with the sign flipped, and every downstream figure (growth,
 *    projection, "accuracy") inherited the mixture.
 *
 * 2. **A projection is a model and is labelled as one.** `projectionMethod`
 *    states exactly what was done. Revenue and expenses are projected
 *    separately and net income is derived from them, so the projected margin
 *    cannot drift from its own components. A projection needs at least
 *    `MIN_MONTHS_FOR_GROWTH` posted months with a positive base; otherwise it
 *    is `null` and declared unavailable — never a flat line, never zero.
 *
 * 3. **"Forecast accuracy" must compare a forecast to an actual.** The old KPI
 *    was `variancePcts.filter((v) => Math.abs(v) < 0.1).length / length` — the
 *    share of months whose actual moved less than 10% from the prior month. It
 *    never looked at a forecast at all, and it shipped as "Forecast Accuracy
 *    87%". This module runs a walk-forward backtest: fit on months 1..k,
 *    predict month k+1, compare against what was actually posted. With too few
 *    months it is `null`.
 *
 * 4. **No invented confidence interval.** The old page returned a literal
 *    `confidenceInterval: 8.5` and rendered it as `±8.5%`. A prediction
 *    interval needs a residual distribution this data does not justify, so it
 *    is declared unavailable.
 *
 * 5. **No premature rounding.** The old average growth was
 *    `roundTo(sumMoney(growthRates), 2) / growthRates.length` — the SUM of
 *    dimensionless ratios rounded to two decimals before dividing, which
 *    quantises the growth rate to 1/(2·n) steps.
 *
 * 6. Labels must be true: posted actuals are never presented as "forecast".
 *
 * Account prefixes: 4 Revenue (credit-normal) · 5 COGS · 6 OpEx · 7 Interest ·
 * 8 Income tax (debit-normal).
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface RollingForecastGLEntry {
  readonly accountCode?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
  readonly period?: string | null;
  readonly date?: string | null;
}

export interface RollingPoint {
  readonly month: string;
  readonly kind: 'actual' | 'projected';
  readonly revenue: number;
  readonly expenses: number;
  readonly netIncome: number;
}

export interface BacktestRow {
  readonly month: string;
  readonly actual: number;
  readonly predicted: number;
  /** Absolute percentage error; `null` when the actual is zero. */
  readonly errorPercent: number | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface RollingForecast {
  readonly windowMonths: number;
  readonly actualMonths: number;
  readonly postedRevenue: number;
  readonly postedExpenses: number;
  readonly postedNetIncome: number;
  readonly projectedRevenue: number | null;
  readonly projectedExpenses: number | null;
  readonly projectedNetIncome: number | null;
  readonly series: readonly RollingPoint[];
  /** Average month-over-month growth, percent. `null` when not derivable. */
  readonly revenueGrowthPercent: number | null;
  readonly expenseGrowthPercent: number | null;
  readonly projectionMethod: string;
  readonly backtest: readonly BacktestRow[];
  /** 100 − mean absolute percentage error of the walk-forward backtest. */
  readonly backtestAccuracyPercent: number | null;
  readonly backtestSampleCount: number;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const ONE = new Decimal(1);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

/** Months of history required before any growth rate is derived. */
export const MIN_MONTHS_FOR_GROWTH = 3;
/** Fit months required before a backtest point can be produced. */
const MIN_MONTHS_FOR_BACKTEST = MIN_MONTHS_FOR_GROWTH + 1;
const MAX_PROJECTION_MONTHS = 12;

const REVENUE_PREFIX = '4';
const COST_PREFIXES = ['5', '6', '7', '8'] as const;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(entry: RollingForecastGLEntry): string {
  return entry.accountCode ?? '';
}

function hasDebitCredit(entry: RollingForecastGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function debitNormal(entry: RollingForecastGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: RollingForecastGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function isRevenue(entry: RollingForecastGLEntry): boolean {
  return code(entry).startsWith(REVENUE_PREFIX);
}

function isCost(entry: RollingForecastGLEntry): boolean {
  return COST_PREFIXES.some((p) => code(entry).startsWith(p));
}

function monthOf(entry: RollingForecastGLEntry): string | null {
  const p = entry.period;
  if (p) return p;
  const d = entry.date;
  return d ? d.slice(0, 7) : null;
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

/** `YYYY-MM` plus n months, without touching Date arithmetic edge cases. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m)) return month;
  const zeroBased = (y as number) * 12 + ((m as number) - 1) + n;
  const year = Math.floor(zeroBased / 12);
  const mon = (zeroBased % 12) + 1;
  return `${String(year).padStart(4, '0')}-${String(mon).padStart(2, '0')}`;
}

/**
 * Mean month-over-month growth of a series.
 *
 * Only steps with a strictly positive base contribute: growth off a zero or
 * negative base is not a percentage anyone can act on. No rounding happens
 * before the mean.
 */
function meanGrowth(values: readonly Decimal[]): Decimal | null {
  if (values.length < MIN_MONTHS_FOR_GROWTH) return null;
  const steps: Decimal[] = [];
  for (let i = 1; i < values.length; i += 1) {
    const prev = values[i - 1]!;
    if (!prev.greaterThan(0)) continue;
    steps.push(divideMoney(values[i]!.minus(prev), prev));
  }
  if (steps.length === 0) return null;
  return divideMoney(sumMoney(steps), steps.length);
}

function project(last: Decimal, growth: Decimal | null, step: number): Decimal | null {
  if (growth === null) return null;
  const factor = ONE.plus(growth).pow(step);
  return last.times(factor);
}

interface MonthTotals {
  revenue: Decimal;
  expenses: Decimal;
}

function monthlyTotals(entries: readonly RollingForecastGLEntry[]): Array<[string, MonthTotals]> {
  const map = new Map<string, MonthTotals>();
  for (const entry of entries) {
    const month = monthOf(entry);
    if (!month) continue;
    const revenue = isRevenue(entry);
    const cost = isCost(entry);
    if (!revenue && !cost) continue; // balance-sheet postings are not a P&L trend
    const bucket = map.get(month) ?? { revenue: ZERO, expenses: ZERO };
    if (revenue) bucket.revenue = bucket.revenue.plus(creditNormal(entry));
    else bucket.expenses = bucket.expenses.plus(debitNormal(entry));
    map.set(month, bucket);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Walk-forward backtest of the projection rule on posted revenue.
 *
 * For each month k (from `MIN_MONTHS_FOR_BACKTEST` onwards) the rule is fitted
 * on months before k and used to predict month k, which is then compared with
 * what was actually posted. This is the only accuracy figure the data can
 * support, and it is an accuracy of the METHOD, not of forecasts previously
 * shown to a user — the app does not store those yet.
 */
function backtestRevenue(months: Array<[string, MonthTotals]>): {
  rows: BacktestRow[];
  accuracy: number | null;
  sampleCount: number;
} {
  const rows: BacktestRow[] = [];
  const errors: Decimal[] = [];

  for (let k = MIN_MONTHS_FOR_BACKTEST - 1; k < months.length; k += 1) {
    const history = months.slice(0, k).map(([, t]) => t.revenue);
    const growth = meanGrowth(history);
    const predicted = project(history.at(-1)!, growth, 1);
    if (predicted === null) continue;
    const actual = months[k]![1].revenue;
    const errorPercent = actual.isZero()
      ? null
      : divideMoney(actual.minus(predicted).abs(), actual.abs())
          .times(100)
          .toDecimalPlaces(PERCENT_PLACES)
          .toNumber();
    if (errorPercent !== null) errors.push(new Decimal(errorPercent));
    rows.push({
      month: months[k]![0],
      actual: cash(actual),
      predicted: cash(predicted),
      errorPercent,
    });
  }

  if (errors.length === 0) return { rows, accuracy: null, sampleCount: 0 };
  const mape = divideMoney(sumMoney(errors), errors.length);
  const accuracy = Decimal.max(ZERO, new Decimal(100).minus(mape))
    .toDecimalPlaces(PERCENT_PLACES)
    .toNumber();
  return { rows, accuracy, sampleCount: errors.length };
}

/**
 * Derive the rolling forecast over the trailing `windowMonths` posted months.
 *
 * Returns `null` when no P&L month is posted at all.
 */
export function deriveRollingForecast(
  entries: readonly RollingForecastGLEntry[],
  windowMonths: number
): RollingForecast | null {
  const all = monthlyTotals(entries);
  if (all.length === 0) return null;

  const months = all.slice(-windowMonths);
  const revenueSeries = months.map(([, t]) => t.revenue);
  const expenseSeries = months.map(([, t]) => t.expenses);

  const postedRevenue = sumMoney(revenueSeries);
  const postedExpenses = sumMoney(expenseSeries);

  const revenueGrowth = meanGrowth(revenueSeries);
  const expenseGrowth = meanGrowth(expenseSeries);

  const series: RollingPoint[] = months.map(([month, t]) => ({
    month,
    kind: 'actual' as const,
    revenue: cash(t.revenue),
    expenses: cash(t.expenses),
    netIncome: cash(t.revenue.minus(t.expenses)),
  }));

  const horizon = Math.min(windowMonths, MAX_PROJECTION_MONTHS);
  const lastMonth = months.at(-1)![0];
  const lastRevenue = revenueSeries.at(-1)!;
  const lastExpenses = expenseSeries.at(-1)!;

  let projectedRevenue: Decimal | null = null;
  let projectedExpenses: Decimal | null = null;

  if (revenueGrowth !== null || expenseGrowth !== null) {
    const revenueParts: Decimal[] = [];
    const expenseParts: Decimal[] = [];
    for (let step = 1; step <= horizon; step += 1) {
      const r = project(lastRevenue, revenueGrowth, step);
      const e = project(lastExpenses, expenseGrowth, step);
      if (r !== null) revenueParts.push(r);
      if (e !== null) expenseParts.push(e);
      series.push({
        month: addMonths(lastMonth, step),
        kind: 'projected' as const,
        revenue: r === null ? 0 : cash(r),
        expenses: e === null ? 0 : cash(e),
        netIncome: cash((r ?? ZERO).minus(e ?? ZERO)),
      });
    }
    projectedRevenue = revenueParts.length > 0 ? sumMoney(revenueParts) : null;
    projectedExpenses = expenseParts.length > 0 ? sumMoney(expenseParts) : null;
  }

  const { rows, accuracy, sampleCount } = backtestRevenue(all);

  const unavailable: UnavailableLine[] = [];
  if (revenueGrowth === null && expenseGrowth === null) {
    unavailable.push({
      label: 'Projection',
      reason: `Needs at least ${MIN_MONTHS_FOR_GROWTH} posted months with a positive base to derive a growth rate. ${months.length} posted month${months.length === 1 ? '' : 's'} available.`,
    });
  }
  if (accuracy === null) {
    unavailable.push({
      label: 'Method accuracy',
      reason: `A walk-forward backtest needs at least ${MIN_MONTHS_FOR_BACKTEST} posted months. Accuracy of forecasts previously shown to users cannot be measured at all until the app stores them.`,
    });
  }
  unavailable.push({
    label: 'Confidence interval',
    reason:
      'A prediction interval requires a residual distribution this history does not justify. No fixed ± band is applied.',
  });

  return {
    windowMonths,
    actualMonths: months.length,
    postedRevenue: cash(postedRevenue),
    postedExpenses: cash(postedExpenses),
    postedNetIncome: cash(postedRevenue.minus(postedExpenses)),
    projectedRevenue: projectedRevenue === null ? null : cash(projectedRevenue),
    projectedExpenses: projectedExpenses === null ? null : cash(projectedExpenses),
    projectedNetIncome:
      projectedRevenue === null && projectedExpenses === null
        ? null
        : cash((projectedRevenue ?? ZERO).minus(projectedExpenses ?? ZERO)),
    series,
    revenueGrowthPercent:
      revenueGrowth === null
        ? null
        : revenueGrowth.times(100).toDecimalPlaces(PERCENT_PLACES).toNumber(),
    expenseGrowthPercent:
      expenseGrowth === null
        ? null
        : expenseGrowth.times(100).toDecimalPlaces(PERCENT_PLACES).toNumber(),
    projectionMethod: `Compound extrapolation of the mean month-over-month growth of posted revenue and expenses over ${months.length} month${months.length === 1 ? '' : 's'}, projected ${horizon} month${horizon === 1 ? '' : 's'} forward. Net income is derived from the two projections, not extrapolated.`,
    backtest: rows,
    backtestAccuracyPercent: accuracy,
    backtestSampleCount: sampleCount,
    unavailable,
  };
}
