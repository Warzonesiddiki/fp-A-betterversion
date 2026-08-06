/**
 * Government exact-money metric model (Wave 9 Phase 3 — Sector Depth).
 *
 * Pure KPIs for budget execution, grant disbursement and public-service
 * delivery, computed exclusively through the canonical money primitives.
 * Division-by-zero is guarded and never fabricated.
 */
import {
  divideMoney,
  multiplyMoney,
  percentOf,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

export interface GovernmentMetricsInput {
  /** Total appropriated budget for the period. */
  budgetAppropriated: number;
  /** Actual spend executed against the budget. */
  actualSpend: number;
  /** Total grant funding allocated. */
  grantAllocated: number;
  /** Grant funding actually disbursed. */
  grantDisbursed: number;
  /** Number of citizens served. */
  citizensServed: number;
  /** Total operating / service delivery expense. */
  totalExpenses: number;
  /** Revenue actually collected. */
  revenueCollected: number;
  /** Forecast/expected revenue for the period. */
  revenueForecast: number;
}

export interface GovernmentMetrics {
  budgetUtilizationPct: number;
  grantDisbursementRatePct: number;
  costPerCitizen: number;
  revenueCollectionGapPct: number;
  /** Unutilized budget (appropriated − spend), signed exactly. */
  unutilizedBudget: number;
}

export function sumDisbursements(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/** Exact cost per citizen served; 0 when no citizens. */
export function computeCostPerCitizen(totalExpenses: number, citizensServed: number): number {
  if (!toDecimal(citizensServed).gt(0)) return 0;
  return roundTo(divideMoney(totalExpenses, citizensServed), 2);
}

/** Exact percentage share, guarding zero denominator. */
export function computeRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

export function computeGovernmentMetrics(input: GovernmentMetricsInput): GovernmentMetrics {
  const budgetUtilizationPct = computeRatioPct(input.actualSpend, input.budgetAppropriated);
  const grantDisbursementRatePct = computeRatioPct(input.grantDisbursed, input.grantAllocated);
  const costPerCitizen = computeCostPerCitizen(input.totalExpenses, input.citizensServed);
  const revenueCollectionGapPct = computeRatioPct(
    roundTo(subtractMoney(input.revenueForecast, input.revenueCollected), 2),
    input.revenueForecast
  );
  const unutilizedBudget = roundTo(subtractMoney(input.budgetAppropriated, input.actualSpend), 2);

  return {
    budgetUtilizationPct,
    grantDisbursementRatePct,
    costPerCitizen,
    revenueCollectionGapPct,
    unutilizedBudget,
  };
}

/** Model disbursed grant amount from an allocation and a rate (%) exactly. */
export function modelGrantDisbursement(allocation: number, disbursementRatePct: number): number {
  return roundTo(percentOf(allocation, disbursementRatePct), 2);
}

/** Scale a budget line by a driver percentage (exact, half-up). */
export function scaleByDriver(base: number, pct: number): number {
  return roundTo(multiplyMoney(base, toDecimal(1).plus(toDecimal(pct).div(100))), 2);
}

export interface ProcurementMetricsInput {
  /** Total value of contracts awarded in the period. */
  contractValue: number;
  /** Value of contracts awarded through competitive tender. */
  competitivelyTenderedValue: number;
  /** Count of compliant/clean audits against total audits. */
  compliantAudits: number;
  totalAudits: number;
  /** Sum of procurement cycle times (days) across contracts. */
  cycleDaysSum: number;
  contractCount: number;
  /** Baseline spend before negotiated savings. */
  baselineSpend: number;
  /** Spend value after negotiated savings. */
  realizedSpend: number;
}

export interface ProcurementMetrics {
  competitiveTenderPct: number;
  complianceScorePct: number;
  avgCycleDays: number;
  negotiatedSavings: number;
  savingsRatePct: number;
}

/** Average procurement cycle days; 0 when no contracts. */
export function computeAvgCycleDays(cycleDaysSum: number, contractCount: number): number {
  if (!toDecimal(contractCount).gt(0)) return 0;
  return roundTo(divideMoney(cycleDaysSum, contractCount), 1);
}

export function computeProcurementMetrics(input: ProcurementMetricsInput): ProcurementMetrics {
  const competitiveTenderPct = computeRatioPct(
    input.competitivelyTenderedValue,
    input.contractValue
  );
  const complianceScorePct = computeRatioPct(input.compliantAudits, input.totalAudits);
  const avgCycleDays = computeAvgCycleDays(input.cycleDaysSum, input.contractCount);
  const negotiatedSavings = roundTo(subtractMoney(input.baselineSpend, input.realizedSpend), 2);
  const savingsRatePct = computeRatioPct(negotiatedSavings, input.baselineSpend);
  return {
    competitiveTenderPct,
    complianceScorePct,
    avgCycleDays,
    negotiatedSavings,
    savingsRatePct,
  };
}
