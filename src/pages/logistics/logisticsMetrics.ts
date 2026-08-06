/**
 * Logistics exact-money metric model (Wave 9 Phase 3 — Sector Depth).
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
  percentOf,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

export interface LogisticsMetricsInput {
  /** Recognized revenue (netChange, absolute) derived from the GL. */
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  /** Total miles driven across the fleet. */
  totalMiles: number;
  /** Miles driven with cargo (used to derive empty-miles %). */
  loadedMiles: number;
  /** Deliveries completed on time. */
  onTimeDeliveries: number;
  /** Total deliveries scheduled. */
  totalDeliveries: number;
  /** Capacity-adjusted miles the fleet could run at full utilization. */
  fleetCapacityMiles: number;
  /** Warehousing & distribution cost for the period. */
  warehouseCost: number;
}

export interface LogisticsMetrics {
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  costPerMile: number;
  onTimeDeliveryPct: number;
  emptyMilesPct: number;
  fleetUtilizationPct: number;
  warehouseCostPct: number;
  operatingMarginPct: number;
}

/**
 * Aggregate fractional freight amounts exactly (0.1 + 0.2 = 0.3).
 * Exposed as a pure helper so callers can sum driver/leg amounts without
 * IEEE-754 drift.
 */
export function sumFreightAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Exact cost-per-mile. Returns 0 when no miles were driven (undefined
 * ratio) rather than throwing or fabricating a value.
 */
export function computeCostPerMile(totalExpenses: number, totalMiles: number): number {
  if (!toDecimal(totalMiles).gt(0)) return 0;
  return roundTo(divideMoney(totalExpenses, totalMiles), 4);
}

/** Exact percentage share, guarding a zero denominator. */
export function computeRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

export function computeLogisticsMetrics(input: LogisticsMetricsInput): LogisticsMetrics {
  const totalExpenses = roundTo(addMoney(input.cogs, input.operatingExpenses), 2);
  const grossProfit = roundTo(subtractMoney(input.revenue, input.cogs), 2);
  const ebitda = roundTo(subtractMoney(input.revenue, totalExpenses), 2);

  const costPerMile = computeCostPerMile(totalExpenses, input.totalMiles);
  const onTimeDeliveryPct = computeRatioPct(input.onTimeDeliveries, input.totalDeliveries);
  const emptyMilesPct = computeRatioPct(
    roundTo(subtractMoney(input.totalMiles, input.loadedMiles), 2),
    input.totalMiles
  );
  const fleetUtilizationPct = computeRatioPct(input.totalMiles, input.fleetCapacityMiles);
  const warehouseCostPct = computeRatioPct(input.warehouseCost, input.revenue);
  const operatingMarginPct = computeRatioPct(ebitda, input.revenue);

  return {
    totalExpenses,
    grossProfit,
    ebitda,
    costPerMile,
    onTimeDeliveryPct,
    emptyMilesPct,
    fleetUtilizationPct,
    warehouseCostPct,
    operatingMarginPct,
  };
}

/**
 * Apply a capacity driver (0–100%) to a baseline amount exactly, e.g.
 * model fleet fuel cost under a utilization scenario: baseline × (1 + pct/100).
 */
export function scaleByDriver(base: number, pct: number): number {
  return roundTo(multiplyMoney(base, toDecimal(1).plus(toDecimal(pct).div(100))), 2);
}

/** Model warehouse cost as a percentage share of revenue (exact). */
export function warehouseCostModel(revenue: number, costPct: number): number {
  return roundTo(percentOf(revenue, costPct), 2);
}
