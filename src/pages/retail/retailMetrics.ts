/**
 * Retail exact-money metric model (Wave 9 Phase 3 — Sector Depth).
 *
 * Pure, falsifiable KPIs computed exclusively through the canonical money
 * primitives (decimal.js-backed) in @/utils/money. No raw IEEE-754
 * financial arithmetic, no static placeholder cards, no Math.random truth.
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

export interface RetailMetricsInput {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  priorYearRevenue: number;
  totalSqFt: number;
  averageInventory: number;
  storeCount: number;
  shrinkageAmount: number;
  promoCost: number;
}

export interface RetailMetrics {
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  sameStoreSalesGrowthPct: number;
  salesPerSqFt: number;
  inventoryTurnover: number;
  gmroi: number;
  shrinkageRatePct: number;
  operatingMarginPct: number;
}

/**
 * Aggregate fractional retail amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumRetailAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleRetailDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeRetailRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute GMROI (Gross Margin Return on Inventory Investment = Gross Profit / Average Inventory).
 */
export function computeGMROI(grossProfit: number, averageInventory: number): number {
  if (!toDecimal(averageInventory).gt(0)) return 0;
  return roundTo(divideMoney(grossProfit, averageInventory), 2);
}

export function computeRetailMetrics(input: RetailMetricsInput): RetailMetrics {
  const totalExpenses = roundTo(addMoney(input.cogs, input.operatingExpenses), 2);
  const grossProfit = roundTo(subtractMoney(input.revenue, input.cogs), 2);
  const ebitda = roundTo(subtractMoney(input.revenue, totalExpenses), 2);

  const salesGrowth = roundTo(subtractMoney(input.revenue, input.priorYearRevenue), 2);
  const sameStoreSalesGrowthPct = computeRetailRatioPct(salesGrowth, input.priorYearRevenue);
  const salesPerSqFt = toDecimal(input.totalSqFt).gt(0)
    ? roundTo(divideMoney(input.revenue, input.totalSqFt), 2)
    : 0;
  const inventoryTurnover = toDecimal(input.averageInventory).gt(0)
    ? roundTo(divideMoney(input.cogs, input.averageInventory), 2)
    : 0;
  const gmroi = computeGMROI(grossProfit, input.averageInventory);
  const shrinkageRatePct = computeRetailRatioPct(input.shrinkageAmount, input.revenue);
  const operatingMarginPct = computeRetailRatioPct(ebitda, input.revenue);

  return {
    totalExpenses,
    grossProfit,
    ebitda,
    sameStoreSalesGrowthPct,
    salesPerSqFt,
    inventoryTurnover,
    gmroi,
    shrinkageRatePct,
    operatingMarginPct,
  };
}
