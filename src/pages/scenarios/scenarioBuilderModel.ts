/**
 * Scenario comparison and Monte-Carlo draw derivation.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`.
 * 2. The page must not feed this module a fabricated $48M / $28.8M / $14.4M
 *    base. Posted GL actuals are the base; an empty ledger is `null`.
 * 3. OpEx is an input. The previous function read a module-level 14.4M
 *    constant, so every caller inherited an invented operating-cost floor.
 * 4. Per-entry `Math.abs` is never used. Index arithmetic (percentile ranks)
 *    is not money and is not wrapped in money helpers.
 *
 * Account-code prefixes: 4 Revenue · 5 COGS · 6 OpEx.
 */

import Decimal from 'decimal.js';
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
  type MoneyInput,
} from '@/utils/money';
import { summarizeOutcomes, type OutcomeSummary } from '@/pages/analytics/goalSeekModel';

export type { OutcomeSummary };

export interface ScenarioGLEntry {
  readonly accountCode?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface ScenarioBase {
  readonly revenue: number;
  readonly cogs: number;
  readonly opex: number;
}

export interface ScenarioComparisonInput {
  readonly baseRevenue: MoneyInput;
  readonly cogs: MoneyInput;
  readonly opex: MoneyInput;
  readonly growthRatePct: MoneyInput;
  readonly pricingChangePct: MoneyInput;
  readonly cogsChangePct: MoneyInput;
  readonly headcountChange: MoneyInput;
  readonly avgSalary: MoneyInput;
  readonly probabilityPct: MoneyInput;
}

export interface ScenarioComparisonResult {
  readonly baseRevenue: number;
  readonly scenarioRevenue: number;
  readonly revenueVariance: number;
  readonly variancePct: number;
  readonly cogsImpact: number;
  readonly opexImpact: number;
  readonly netImpact: number;
  readonly newCogs: number;
  readonly newOpex: number;
  readonly newRevenue: number;
  readonly probabilityWeightedRevenue: number;
  readonly probabilityWeightedNet: number;
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: ScenarioGLEntry): boolean {
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

function debitNormal(entry: ScenarioGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: ScenarioGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function withPrefix(
  entries: readonly ScenarioGLEntry[],
  prefix: string
): readonly ScenarioGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

/** Posted operating actuals, or `null` when there is no ledger. */
export function deriveScenarioBase(entries: readonly ScenarioGLEntry[]): ScenarioBase | null {
  if (entries.length === 0) return null;
  return {
    revenue: roundTo(sumMoney(withPrefix(entries, '4').map(creditNormal)), 2),
    cogs: roundTo(sumMoney(withPrefix(entries, '5').map(debitNormal)), 2),
    opex: roundTo(sumMoney(withPrefix(entries, '6').map(debitNormal)), 2),
  };
}

/**
 * Apply user-stated growth / pricing / COGS / headcount shocks to a base.
 *
 *   newRevenue = base × (1 + growth%) × (1 + pricing%)  — wait, the historical
 *   identity on this page is additive: base × (1 + growth% + pricing%).
 *   That is the identity the GAP-1 suite pins (48M + 10% + 5% = 55.2M, not
 *   48M × 1.10 × 1.05 = 55.44M). Do not "upgrade" it to compound.
 */
export function simulateScenarioComparison(
  input: ScenarioComparisonInput
): ScenarioComparisonResult {
  const baseRev = toDecimal(input.baseRevenue, 'baseRevenue');
  const growth = divideMoney(input.growthRatePct, 100);
  const pricing = divideMoney(input.pricingChangePct, 100);
  const cogsPct = divideMoney(input.cogsChangePct, 100);
  const prob = divideMoney(input.probabilityPct, 100);

  const revenueGrowth = multiplyMoney(baseRev, growth);
  const pricingImpact = multiplyMoney(baseRev, pricing);
  const newRevenueDec = baseRev.plus(revenueGrowth).plus(pricingImpact);
  const newRevenue = roundTo(newRevenueDec);

  const cogsImpactDec = multiplyMoney(input.cogs, cogsPct);
  const cogsImpact = roundTo(cogsImpactDec);
  const newCogs = roundTo(addMoney(input.cogs, cogsImpactDec));

  const opexImpactDec = multiplyMoney(input.headcountChange, input.avgSalary);
  const opexImpact = roundTo(opexImpactDec);
  const newOpex = roundTo(addMoney(input.opex, opexImpactDec));

  const revenueVarianceDec = subtractMoney(newRevenue, input.baseRevenue);
  const revenueVariance = roundTo(revenueVarianceDec);
  const variancePct = toDecimal(input.baseRevenue).isZero()
    ? 0
    : roundTo(multiplyMoney(divideMoney(revenueVariance, input.baseRevenue), 100));

  const totalRevenueChange = roundTo(revenueGrowth.plus(pricingImpact));
  const totalCostChange = roundTo(cogsImpactDec.plus(opexImpactDec));
  const netImpact = roundTo(subtractMoney(totalRevenueChange, totalCostChange));

  return {
    baseRevenue: roundTo(input.baseRevenue),
    scenarioRevenue: newRevenue,
    revenueVariance,
    variancePct,
    cogsImpact,
    opexImpact,
    netImpact,
    newCogs,
    newOpex,
    newRevenue,
    probabilityWeightedRevenue: roundTo(multiplyMoney(newRevenue, prob)),
    probabilityWeightedNet: roundTo(multiplyMoney(netImpact, prob)),
  };
}

export function scenarioGrossProfit(revenue: MoneyInput, cogs: MoneyInput): number {
  return roundTo(subtractMoney(revenue, cogs), 2);
}

export function scenarioNetIncome(revenue: MoneyInput, cogs: MoneyInput, opex: MoneyInput): number {
  return roundTo(subtractMoney(subtractMoney(revenue, cogs), opex), 2);
}

/**
 * One Monte-Carlo draw: shock the *current scenario* totals (the page's
 * historical semantics), then profit = shocked revenue − shocked COGS − opex.
 */
export function profitFromScenarioDraw(input: {
  readonly revenue: MoneyInput;
  readonly cogs: MoneyInput;
  readonly opex: MoneyInput;
  readonly growthPct: MoneyInput;
  readonly pricingPct: MoneyInput;
  readonly cogsPct: MoneyInput;
}): number {
  const shockedRevenue = multiplyMoney(
    multiplyMoney(input.revenue, addMoney(1, divideMoney(input.growthPct, 100))),
    addMoney(1, divideMoney(input.pricingPct, 100))
  );
  const shockedCogs = multiplyMoney(input.cogs, addMoney(1, divideMoney(input.cogsPct, 100)));
  return roundTo(subtractMoney(subtractMoney(shockedRevenue, shockedCogs), input.opex), 2);
}

export function summarizeScenarioDraws(samples: readonly MoneyInput[]): OutcomeSummary {
  return summarizeOutcomes(samples);
}

/** Std-dev of a percent shock. Count/percent — not money. */
export function shockStdDev(meanPct: number, volFraction: number): number {
  const mag = meanPct < 0 ? -meanPct : meanPct;
  return mag > 1 ? mag * volFraction : 1;
}
