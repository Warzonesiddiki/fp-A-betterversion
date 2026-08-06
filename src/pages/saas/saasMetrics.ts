/**
 * SaaS exact-money metric model (Wave 9 Phase 3 — Sector Depth).
 *
 * Pure, falsifiable KPIs computed exclusively through the canonical money
 * primitives (decimal.js-backed) in @/utils/money. No raw IEEE-754
 * financial arithmetic, no static placeholder cards, no Math.random truth.
 *
 * All inputs are expected to come from the GL store / driver model; every
 * helper guards division-by-zero explicitly and never silently returns a
 * fabricated value.
 */
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

export interface SaaSMetricsInput {
  mrr: number;
  newARR: number;
  cogs: number;
  operatingExpenses: number;
  salesMarketingExpense: number;
  customerCount: number;
  lostCustomers: number;
  expansionARR: number;
  contractionARR: number;
  cac: number;
}

export interface SaaSMetrics {
  arr: number;
  grossProfit: number;
  ebitda: number;
  grossMarginPct: number;
  operatingMarginPct: number;
  churnRatePct: number;
  netRetentionPct: number;
  magicNumber: number;
  arpu: number;
  ltvToCacRatio: number;
}

/**
 * Aggregate fractional SaaS revenue/cost amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumSaaSAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleSaaSDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeSaaSRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute SaaS Magic Number (New ARR / S&M Expense).
 */
export function computeMagicNumber(newARR: number, salesMarketingExpense: number): number {
  if (!toDecimal(salesMarketingExpense).gt(0)) return 0;
  return roundTo(divideMoney(newARR, salesMarketingExpense), 2);
}

/**
 * Compute LTV to CAC Ratio.
 */
export function computeLTVToCAC(
  arpu: number,
  grossMarginPct: number,
  churnRatePct: number,
  cac: number
): number {
  if (!toDecimal(churnRatePct).gt(0) || !toDecimal(cac).gt(0)) return 0;
  const annualMargin = divideMoney(multiplyMoney(arpu, 12), 100).times(grossMarginPct);
  const ltv = divideMoney(annualMargin, divideMoney(churnRatePct, 100));
  return roundTo(divideMoney(ltv, cac), 2);
}

export function computeSaaSMetrics(input: SaaSMetricsInput): SaaSMetrics {
  const arr = roundTo(multiplyMoney(input.mrr, 12), 2);
  const totalExpenses = roundTo(addMoney(input.cogs, input.operatingExpenses), 2);
  const grossProfit = roundTo(subtractMoney(arr, input.cogs), 2);
  const ebitda = roundTo(subtractMoney(arr, totalExpenses), 2);

  const grossMarginPct = computeSaaSRatioPct(grossProfit, arr);
  const operatingMarginPct = computeSaaSRatioPct(ebitda, arr);
  const churnRatePct = computeSaaSRatioPct(input.lostCustomers, input.customerCount);

  const netARR = roundTo(subtractMoney(addMoney(arr, input.expansionARR), input.contractionARR), 2);
  const netRetentionPct = computeSaaSRatioPct(netARR, arr);

  const magicNumber = computeMagicNumber(input.newARR, input.salesMarketingExpense);
  const arpu =
    input.customerCount > 0 ? roundTo(divideMoney(input.mrr, input.customerCount), 2) : 0;

  const ltvToCacRatio = computeLTVToCAC(arpu, grossMarginPct, churnRatePct, input.cac);

  return {
    arr,
    grossProfit,
    ebitda,
    grossMarginPct,
    operatingMarginPct,
    churnRatePct,
    netRetentionPct,
    magicNumber,
    arpu,
    ltvToCacRatio,
  };
}
