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

// W-FAB (fleet wave 2, lane N4): fleet-volume inputs are `null` when no
// tagged GL account posts them. The previous contract pushed callers toward
// invented fallbacks (400,000 total miles, 9,500/10,000 deliveries,
// 470,000 capacity miles) that silently produced measured-looking
// cost-per-mile / utilization / on-time KPIs from thin air. A ratio whose
// input was never posted is now `null` — never estimated.
export interface LogisticsMetricsInput {
  /** Recognized revenue (netChange, absolute) derived from the GL. */
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  /** Total miles driven across the fleet; `null` when not posted to the GL. */
  totalMiles: number | null;
  /** Miles driven with cargo; `null` when not posted to the GL. */
  loadedMiles: number | null;
  /** Deliveries completed on time; `null` when not posted to the GL. */
  onTimeDeliveries: number | null;
  /** Total deliveries scheduled; `null` when not posted to the GL. */
  totalDeliveries: number | null;
  /** Capacity-adjusted miles at full utilization; `null` when not posted. */
  fleetCapacityMiles: number | null;
  /** Warehousing & distribution cost for the period. */
  warehouseCost: number;
}

export interface LogisticsMetrics {
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  /** `null` when no miles were posted — not a $0/mile estimate. */
  costPerMile: number | null;
  /** `null` unless both delivery counters are posted. */
  onTimeDeliveryPct: number | null;
  /** `null` unless total and loaded miles are both posted. */
  emptyMilesPct: number | null;
  /** `null` unless capacity and total miles are both posted. */
  fleetUtilizationPct: number | null;
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

  // Volume-derived ratios stay `null` unless their inputs were actually
  // posted. A posted-but-zero denominator is also "undefined ratio".
  const totalMiles =
    input.totalMiles !== null && toDecimal(input.totalMiles).gt(0) ? input.totalMiles : null;
  const costPerMile = totalMiles !== null ? computeCostPerMile(totalExpenses, totalMiles) : null;
  const onTimeDeliveryPct =
    input.totalDeliveries !== null &&
    toDecimal(input.totalDeliveries).gt(0) &&
    input.onTimeDeliveries !== null
      ? computeRatioPct(input.onTimeDeliveries, input.totalDeliveries)
      : null;
  const emptyMilesPct =
    totalMiles !== null && input.loadedMiles !== null
      ? computeRatioPct(roundTo(subtractMoney(totalMiles, input.loadedMiles), 2), totalMiles)
      : null;
  const fleetUtilizationPct =
    totalMiles !== null &&
    input.fleetCapacityMiles !== null &&
    toDecimal(input.fleetCapacityMiles).gt(0)
      ? computeRatioPct(totalMiles, input.fleetCapacityMiles)
      : null;
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
