/**
 * Construction exact-money metric model (Wave 9 Phase 3 — Sector Depth).
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

export interface ConstructionMetricsInput {
  contractRevenue: number;
  changeOrderRevenue: number;
  directLaborCost: number;
  materialCost: number;
  equipmentCost: number;
  subcontractorCost: number;
  overheadCost: number;
  plannedCost: number;
  earnedValue: number;
  plannedValue: number;
  equipmentCapacityHours: number;
  equipmentUsedHours: number;
}

export interface ConstructionMetrics {
  totalRevenue: number;
  totalDirectCost: number;
  grossProfit: number;
  ebitda: number;
  spi: number;
  cpi: number;
  costVariance: number;
  scheduleVariance: number;
  equipmentUtilizationPct: number;
  grossMarginPct: number;
}

/**
 * Aggregate fractional construction amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumConstructionAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleConstructionDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeConstructionRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute CPI (Cost Performance Index = Earned Value / Actual Cost).
 */
export function computeCPI(earnedValue: number, actualCost: number): number {
  if (!toDecimal(actualCost).gt(0)) return 0;
  return roundTo(divideMoney(earnedValue, actualCost), 2);
}

/**
 * Compute SPI (Schedule Performance Index = Earned Value / Planned Value).
 */
export function computeSPI(earnedValue: number, plannedValue: number): number {
  if (!toDecimal(plannedValue).gt(0)) return 0;
  return roundTo(divideMoney(earnedValue, plannedValue), 2);
}

export function computeConstructionMetrics(input: ConstructionMetricsInput): ConstructionMetrics {
  const totalRevenue = roundTo(addMoney(input.contractRevenue, input.changeOrderRevenue), 2);
  const totalDirectCost = roundTo(
    addMoney(
      input.directLaborCost,
      addMoney(input.materialCost, addMoney(input.equipmentCost, input.subcontractorCost))
    ),
    2
  );
  const grossProfit = roundTo(subtractMoney(totalRevenue, totalDirectCost), 2);
  const ebitda = roundTo(subtractMoney(grossProfit, input.overheadCost), 2);

  const spi = computeSPI(input.earnedValue, input.plannedValue);
  const cpi = computeCPI(input.earnedValue, totalDirectCost);
  const costVariance = roundTo(subtractMoney(input.earnedValue, totalDirectCost), 2);
  const scheduleVariance = roundTo(subtractMoney(input.earnedValue, input.plannedValue), 2);

  const equipmentUtilizationPct = computeConstructionRatioPct(
    input.equipmentUsedHours,
    input.equipmentCapacityHours
  );
  const grossMarginPct = computeConstructionRatioPct(grossProfit, totalRevenue);

  return {
    totalRevenue,
    totalDirectCost,
    grossProfit,
    ebitda,
    spi,
    cpi,
    costVariance,
    scheduleVariance,
    equipmentUtilizationPct,
    grossMarginPct,
  };
}
