/**
 * Manufacturing exact-money metric model (Wave 9 Phase 3 — Sector Depth).
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

export interface ManufacturingMetricsInput {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  outputUnits: number;
  defectUnits: number;
  scrapCost: number;
  machineCapacityUnits: number;
  scheduledHours: number;
  actualHours: number;
}

export interface ManufacturingMetrics {
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  defectRatePct: number;
  unitCost: number;
  capacityUtilizationPct: number;
  scrapCostPct: number;
  operatingMarginPct: number;
  oeePct: number;
}

/**
 * Aggregate fractional manufacturing amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumManufacturingAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleManufacturingDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeManufacturingRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute Overall Equipment Effectiveness (OEE % = Availability * Performance * Quality).
 */
export function computeOEE(
  availabilityPct: number,
  performancePct: number,
  qualityPct: number
): number {
  const avail = divideMoney(availabilityPct, 100);
  const perf = divideMoney(performancePct, 100);
  const qual = divideMoney(qualityPct, 100);
  return roundTo(avail.times(perf).times(qual).times(100), 2);
}

export function computeManufacturingMetrics(
  input: ManufacturingMetricsInput
): ManufacturingMetrics {
  const totalExpenses = roundTo(addMoney(input.cogs, input.operatingExpenses), 2);
  const grossProfit = roundTo(subtractMoney(input.revenue, input.cogs), 2);
  const ebitda = roundTo(subtractMoney(input.revenue, totalExpenses), 2);

  const defectRatePct = computeManufacturingRatioPct(input.defectUnits, input.outputUnits);
  const unitCost = toDecimal(input.outputUnits).gt(0)
    ? roundTo(divideMoney(totalExpenses, input.outputUnits), 2)
    : 0;
  const capacityUtilizationPct = computeManufacturingRatioPct(
    input.outputUnits,
    input.machineCapacityUnits
  );
  const scrapCostPct = computeManufacturingRatioPct(input.scrapCost, input.cogs);
  const operatingMarginPct = computeManufacturingRatioPct(ebitda, input.revenue);

  const availabilityPct = computeManufacturingRatioPct(input.actualHours, input.scheduledHours);
  const performancePct = capacityUtilizationPct;
  const qualityPct = roundTo(toDecimal(100).minus(defectRatePct), 2);
  const oeePct = computeOEE(availabilityPct, performancePct, qualityPct);

  return {
    totalExpenses,
    grossProfit,
    ebitda,
    defectRatePct,
    unitCost,
    capacityUtilizationPct,
    scrapCostPct,
    operatingMarginPct,
    oeePct,
  };
}
