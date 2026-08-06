/**
 * Healthcare exact-money metric model (Wave 9 Phase 3 — Sector Depth).
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

export interface HealthcareMetricsInput {
  patientRevenue: number;
  grantRevenue: number;
  clinicalLaborCost: number;
  medicalSuppliesCost: number;
  researchCost: number;
  facilityCost: number;
  adminCost: number;
  patientCount: number;
  availableBeds: number;
  occupiedBeds: number;
  totalAdmissions: number;
  readmissions: number;
}

export interface HealthcareMetrics {
  totalRevenue: number;
  totalDirectCost: number;
  grossProfit: number;
  ebitda: number;
  revenuePerPatient: number;
  costPerPatient: number;
  bedOccupancyRatePct: number;
  readmissionRatePct: number;
  clinicalCostRatioPct: number;
  operatingMarginPct: number;
}

/**
 * Aggregate fractional healthcare amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumHealthcareAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Scale driver amount half-up (0.335 * 3 = 1.01).
 */
export function scaleHealthcareDriver(amount: number, factor: number): number {
  return roundTo(multiplyMoney(amount, factor), 2);
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeHealthcareRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/**
 * Compute per-patient amount, guarding zero denominator.
 */
export function computePerPatient(amount: number, patientCount: number): number {
  if (!toDecimal(patientCount).gt(0)) return 0;
  return roundTo(divideMoney(amount, patientCount), 2);
}

export function computeHealthcareMetrics(input: HealthcareMetricsInput): HealthcareMetrics {
  const totalRevenue = roundTo(addMoney(input.patientRevenue, input.grantRevenue), 2);
  const totalDirectCost = roundTo(
    addMoney(input.clinicalLaborCost, addMoney(input.medicalSuppliesCost, input.researchCost)),
    2
  );
  const grossProfit = roundTo(subtractMoney(totalRevenue, totalDirectCost), 2);
  const totalExpenses = roundTo(
    addMoney(totalDirectCost, addMoney(input.facilityCost, input.adminCost)),
    2
  );
  const ebitda = roundTo(subtractMoney(totalRevenue, totalExpenses), 2);

  const revenuePerPatient = computePerPatient(totalRevenue, input.patientCount);
  const costPerPatient = computePerPatient(totalExpenses, input.patientCount);
  const bedOccupancyRatePct = computeHealthcareRatioPct(input.occupiedBeds, input.availableBeds);
  const readmissionRatePct = computeHealthcareRatioPct(input.readmissions, input.totalAdmissions);
  const clinicalCostRatioPct = computeHealthcareRatioPct(input.clinicalLaborCost, totalExpenses);
  const operatingMarginPct = computeHealthcareRatioPct(ebitda, totalRevenue);

  return {
    totalRevenue,
    totalDirectCost,
    grossProfit,
    ebitda,
    revenuePerPatient,
    costPerPatient,
    bedOccupancyRatePct,
    readmissionRatePct,
    clinicalCostRatioPct,
    operatingMarginPct,
  };
}
