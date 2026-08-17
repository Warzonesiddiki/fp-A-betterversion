/**
 * Break-even / goal-seek / Monte-Carlo summary derivation.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`. No IEEE-754
 *    `+ - * /` on currency. Index arithmetic (percentile ranks) is not money
 *    and is not wrapped in money helpers.
 * 2. Posted GL actuals use debit/credit with the account-class normal. Per-entry
 *    `Math.abs` is never used — it discards contra entries.
 * 3. A missing ledger is `null`, not a fabricated $1,000,000 revenue base.
 * 4. Volatility percentages are caller-supplied model assumptions, never
 *    hidden `* 0.1` / `* 0.08` multipliers presented as measured.
 *
 * Account-code prefixes follow the convention used across the app:
 *   4 Revenue · 5 COGS · 6 OpEx
 * Interest (7) and tax (8) are omitted from this operating model on purpose —
 * contribution analysis is revenue less operating cost, not net income.
 */

import Decimal from 'decimal.js';
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  percentOf,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
  type MoneyInput,
} from '@/utils/money';

/** Minimal shape this module needs from a posted GL entry. */
export interface GoalSeekGLEntry {
  readonly accountCode?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface GoalSeekActuals {
  readonly revenue: number;
  readonly operatingExpenses: number;
  readonly netOperatingIncome: number;
}

export interface ContributionResult {
  readonly valid: boolean;
  readonly contributionMarginPct: number;
  readonly breakEvenRevenue: number;
  readonly revenueForTarget: number;
}

export interface OutcomeSummary {
  readonly count: number;
  readonly average: number;
  readonly median: number;
  readonly p10: number;
  readonly p90: number;
  readonly positivePct: number;
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

/**
 * True when debit/credit sides carry the posting. An amount-only import
 * (debit and credit both absent or both zero, `amount` set) is not DC.
 */
function hasDebitCredit(entry: GoalSeekGLEntry): boolean {
  const debit = entry.debit;
  const credit = entry.credit;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function debitNormal(entry: GoalSeekGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: GoalSeekGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function withPrefix(
  entries: readonly GoalSeekGLEntry[],
  prefix: string
): readonly GoalSeekGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

/**
 * Operating actuals from the posted GL, or `null` when there is no ledger.
 * Revenue is credit-normal prefix 4; operating expenses are debit-normal
 * prefixes 5 and 6. Contra entries net; they are not abs'd.
 */
export function deriveGoalSeekActuals(entries: readonly GoalSeekGLEntry[]): GoalSeekActuals | null {
  if (entries.length === 0) return null;
  const revenue = sumMoney(withPrefix(entries, '4').map(creditNormal));
  const operatingExpenses = sumMoney([
    ...withPrefix(entries, '5').map(debitNormal),
    ...withPrefix(entries, '6').map(debitNormal),
  ]);
  const netOperatingIncome = revenue.minus(operatingExpenses);
  return {
    revenue: roundTo(revenue, 2),
    operatingExpenses: roundTo(operatingExpenses, 2),
    netOperatingIncome: roundTo(netOperatingIncome, 2),
  };
}

/**
 * Contribution-margin model: BE = fixed / (1 − VC%), revenue-for-target =
 * (fixed + target) / (1 − VC%). Invalid when the contribution ratio is not
 * strictly positive (would divide by zero or invert the model).
 */
export function computeContribution(input: {
  fixedCost: MoneyInput;
  variableCostPct: MoneyInput;
  targetProfit: MoneyInput;
}): ContributionResult {
  const contribution = toDecimal(100).minus(toDecimal(input.variableCostPct, 'variableCostPct'));
  if (contribution.lte(0)) {
    return {
      valid: false,
      contributionMarginPct: roundTo(contribution, 4),
      breakEvenRevenue: 0,
      revenueForTarget: 0,
    };
  }
  const ratio = contribution.div(100);
  return {
    valid: true,
    contributionMarginPct: roundTo(contribution, 4),
    breakEvenRevenue: roundTo(divideMoney(input.fixedCost, ratio), 2),
    revenueForTarget: roundTo(divideMoney(addMoney(input.fixedCost, input.targetProfit), ratio), 2),
  };
}

/**
 * Inverse: the variable-cost % of revenue that delivers `targetProfit`
 * given posted (or modelled) revenue and fixed cost.
 *
 *   profit = revenue × (1 − vc/100) − fixed
 *   vc     = 100 × (1 − (target + fixed) / revenue)
 */
export function variableCostPctForTarget(input: {
  revenue: MoneyInput;
  fixedCost: MoneyInput;
  targetProfit: MoneyInput;
}): { valid: boolean; variableCostPct: number } {
  const revenue = toDecimal(input.revenue, 'revenue');
  if (revenue.lte(0)) return { valid: false, variableCostPct: 0 };
  const covered = addMoney(input.fixedCost, input.targetProfit);
  const vc = toDecimal(100).minus(divideMoney(covered, revenue).times(100));
  return { valid: true, variableCostPct: roundTo(vc, 4) };
}

/** Modelled total cost = variable% of revenue + fixed. */
export function modeledTotalCost(
  revenue: MoneyInput,
  variableCostPct: MoneyInput,
  fixedCost: MoneyInput
): number {
  return roundTo(addMoney(percentOf(revenue, variableCostPct), fixedCost), 2);
}

/** Absolute volatility used as the normal-distribution std-dev. */
export function modeledVolatility(base: MoneyInput, volPct: MoneyInput): number {
  return roundTo(percentOf(base, volPct), 2);
}

export function profitFromDraw(
  revenue: MoneyInput | null | undefined,
  costs: MoneyInput | null | undefined
): number {
  return roundTo(subtractMoney(revenue ?? 0, costs ?? 0), 2);
}

/**
 * Pick the sample at quantile `numer/denom` (0-based, floor). This is index
 * arithmetic on a count — not money — so it does not go through money helpers.
 */
function indexAtQuantile(sampleCount: number, numer: number, denom: number): number {
  if (sampleCount <= 0) return 0;
  const raw = Math.floor((sampleCount * numer) / denom);
  return Math.min(sampleCount - 1, Math.max(0, raw));
}

/**
 * Exact average via `sumMoney`; percentiles are order-statistic picks.
 * An empty series returns zeros (no fabricated distribution).
 */
export function summarizeOutcomes(samples: readonly MoneyInput[]): OutcomeSummary {
  const sampleCount = samples.length;
  if (sampleCount === 0) {
    return { count: 0, average: 0, median: 0, p10: 0, p90: 0, positivePct: 0 };
  }
  const ordered = samples.map((s) => toDecimal(s)).sort((a, b) => a.comparedTo(b));
  const average = roundTo(divideMoney(sumMoney(ordered), sampleCount), 2);
  const pick = (numer: number, denom: number): number =>
    roundTo(ordered[indexAtQuantile(sampleCount, numer, denom)]!, 2);
  const positiveCount = ordered.filter((d) => !d.isNegative()).length;
  const positivePct = roundTo(multiplyMoney(divideMoney(positiveCount, sampleCount), 100), 1);
  return {
    count: sampleCount,
    average,
    median: pick(1, 2),
    p10: pick(1, 10),
    p90: pick(9, 10),
    positivePct,
  };
}
