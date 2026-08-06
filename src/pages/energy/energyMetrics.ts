/**
 * Energy/ESG exact-money metric model (Wave 9 Phase 3 — Sector Depth).
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

export interface EnergyMetricsInput {
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  productionMWh: number;
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  renewableMWh: number;
  liftingCost: number;
  totalCapacityMWh: number;
}

export interface EnergyMetrics {
  totalExpenses: number;
  grossProfit: number;
  ebitda: number;
  totalEmissions: number;
  carbonIntensity: number;
  renewableMixPct: number;
  liftingCostPerMWh: number;
  capacityUtilizationPct: number;
  operatingMarginPct: number;
}

/**
 * Aggregate fractional energy amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumEnergyAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleEnergyDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeEnergyRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute Carbon Intensity (Total Emissions / Production MWh).
 */
export function computeCarbonIntensity(totalEmissions: number, productionMWh: number): number {
  if (!toDecimal(productionMWh).gt(0)) return 0;
  return roundTo(divideMoney(totalEmissions, productionMWh), 4);
}

export function computeEnergyMetrics(input: EnergyMetricsInput): EnergyMetrics {
  const totalExpenses = roundTo(addMoney(input.cogs, input.operatingExpenses), 2);
  const grossProfit = roundTo(subtractMoney(input.revenue, input.cogs), 2);
  const ebitda = roundTo(subtractMoney(input.revenue, totalExpenses), 2);

  const totalEmissions = roundTo(
    addMoney(input.scope1Emissions, addMoney(input.scope2Emissions, input.scope3Emissions)),
    2
  );
  const carbonIntensity = computeCarbonIntensity(totalEmissions, input.productionMWh);
  const renewableMixPct = computeEnergyRatioPct(input.renewableMWh, input.productionMWh);
  const liftingCostPerMWh = toDecimal(input.productionMWh).gt(0)
    ? roundTo(divideMoney(input.liftingCost, input.productionMWh), 2)
    : 0;
  const capacityUtilizationPct = computeEnergyRatioPct(input.productionMWh, input.totalCapacityMWh);
  const operatingMarginPct = computeEnergyRatioPct(ebitda, input.revenue);

  return {
    totalExpenses,
    grossProfit,
    ebitda,
    totalEmissions,
    carbonIntensity,
    renewableMixPct,
    liftingCostPerMWh,
    capacityUtilizationPct,
    operatingMarginPct,
  };
}
