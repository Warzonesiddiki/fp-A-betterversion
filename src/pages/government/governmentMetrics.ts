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

// W-FAB (fleet wave 2, lane N4): inputs are `number | null` — `null` means the
// quantity was never posted to the GL (no tagged account). The pages that feed
// this model previously back-filled missing budgets/citizens with invented
// constants ($10,000,000 budget, 1,250,000 citizens…), which fabricated
// measured-looking KPIs. A KPI whose input was never posted is now `null`.
export interface GovernmentMetricsInput {
  /** Total appropriated budget for the period; `null` when not posted. */
  budgetAppropriated: number | null;
  /** Actual spend executed against the budget; `null` when not posted. */
  actualSpend: number | null;
  /** Total grant funding allocated; `null` when not posted. */
  grantAllocated: number | null;
  /** Grant funding actually disbursed; `null` when not posted. */
  grantDisbursed: number | null;
  /** Number of citizens served; `null` when not posted. */
  citizensServed: number | null;
  /** Total operating / service delivery expense; `null` when not posted. */
  totalExpenses: number | null;
  /** Revenue actually collected; `null` when not posted. */
  revenueCollected: number | null;
  /** Forecast/expected revenue for the period; `null` when not posted. */
  revenueForecast: number | null;
}

export interface GovernmentMetrics {
  /** `null` unless appropriation and spend are both posted. */
  budgetUtilizationPct: number | null;
  /** `null` unless allocation and disbursement are both posted. */
  grantDisbursementRatePct: number | null;
  /** `null` unless expense and citizen counts are both posted. */
  costPerCitizen: number | null;
  /** `null` unless forecast and collected revenue are both posted. */
  revenueCollectionGapPct: number | null;
  /** Appropriated − spend; `null` unless both are posted. */
  unutilizedBudget: number | null;
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
  const budgetUtilizationPct =
    input.actualSpend !== null &&
    input.budgetAppropriated !== null &&
    toDecimal(input.budgetAppropriated).gt(0)
      ? computeRatioPct(input.actualSpend, input.budgetAppropriated)
      : null;
  const grantDisbursementRatePct =
    input.grantDisbursed !== null &&
    input.grantAllocated !== null &&
    toDecimal(input.grantAllocated).gt(0)
      ? computeRatioPct(input.grantDisbursed, input.grantAllocated)
      : null;
  const costPerCitizen =
    input.totalExpenses !== null &&
    input.citizensServed !== null &&
    toDecimal(input.citizensServed).gt(0)
      ? computeCostPerCitizen(input.totalExpenses, input.citizensServed)
      : null;
  const revenueCollectionGapPct =
    input.revenueForecast !== null &&
    toDecimal(input.revenueForecast).gt(0) &&
    input.revenueCollected !== null
      ? computeRatioPct(
          roundTo(subtractMoney(input.revenueForecast, input.revenueCollected), 2),
          input.revenueForecast
        )
      : null;
  const unutilizedBudget =
    input.budgetAppropriated !== null && input.actualSpend !== null
      ? roundTo(subtractMoney(input.budgetAppropriated, input.actualSpend), 2)
      : null;

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
  /** Total value of contracts awarded in the period; `null` when not posted. */
  contractValue: number | null;
  /** Value awarded through competitive tender; `null` when not posted. */
  competitivelyTenderedValue: number | null;
  /** Count of compliant/clean audits; `null` when not posted. */
  compliantAudits: number | null;
  /** Total audits; `null` when not posted. */
  totalAudits: number | null;
  /** Sum of procurement cycle times (days); `null` when not posted. */
  cycleDaysSum: number | null;
  /** Contract count; `null` when not posted. */
  contractCount: number | null;
  /** Baseline spend before negotiated savings; `null` when not posted. */
  baselineSpend: number | null;
  /** Spend value after negotiated savings; `null` when not posted. */
  realizedSpend: number | null;
}

export interface ProcurementMetrics {
  /** `null` unless tendered and total contract values are both posted. */
  competitiveTenderPct: number | null;
  /** `null` unless compliant and total audit counts are both posted. */
  complianceScorePct: number | null;
  /** `null` unless cycle days and contract count are both posted. */
  avgCycleDays: number | null;
  /** Baseline − realized spend; `null` unless both are posted. */
  negotiatedSavings: number | null;
  /** `null` unless savings are derivable from a positive baseline. */
  savingsRatePct: number | null;
}

/** Average procurement cycle days; 0 when no contracts. */
export function computeAvgCycleDays(cycleDaysSum: number, contractCount: number): number {
  if (!toDecimal(contractCount).gt(0)) return 0;
  return roundTo(divideMoney(cycleDaysSum, contractCount), 1);
}

export function computeProcurementMetrics(input: ProcurementMetricsInput): ProcurementMetrics {
  const competitiveTenderPct =
    input.competitivelyTenderedValue !== null &&
    input.contractValue !== null &&
    toDecimal(input.contractValue).gt(0)
      ? computeRatioPct(input.competitivelyTenderedValue, input.contractValue)
      : null;
  const complianceScorePct =
    input.compliantAudits !== null &&
    input.totalAudits !== null &&
    toDecimal(input.totalAudits).gt(0)
      ? computeRatioPct(input.compliantAudits, input.totalAudits)
      : null;
  const avgCycleDays =
    input.cycleDaysSum !== null &&
    input.contractCount !== null &&
    toDecimal(input.contractCount).gt(0)
      ? computeAvgCycleDays(input.cycleDaysSum, input.contractCount)
      : null;
  const negotiatedSavings =
    input.baselineSpend !== null && input.realizedSpend !== null
      ? roundTo(subtractMoney(input.baselineSpend, input.realizedSpend), 2)
      : null;
  const savingsRatePct =
    negotiatedSavings !== null &&
    input.baselineSpend !== null &&
    toDecimal(input.baselineSpend).gt(0)
      ? computeRatioPct(negotiatedSavings, input.baselineSpend)
      : null;
  return {
    competitiveTenderPct,
    complianceScorePct,
    avgCycleDays,
    negotiatedSavings,
    savingsRatePct,
  };
}
