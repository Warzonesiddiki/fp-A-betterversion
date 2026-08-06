/**
 * Audit / SOX Compliance exact-money metric model (Wave 9 Phase 4 — Enterprise Governance).
 *
 * Pure, falsifiable KPIs computed exclusively through the canonical money
 * primitives (decimal.js-backed) in @/utils/money. No raw IEEE-754
 * financial arithmetic, no static placeholder cards.
 */
import { divideMoney, roundTo, subtractMoney, sumMoney, toDecimal } from '@/utils/money';

export interface AuditDelta {
  delta: number;
  pct: number;
}

export interface SOXMetricsInput {
  controlValueAtRisk: number;
  totalRevenue: number;
  passedControls: number;
  totalControls: number;
  remediationCost: number;
}

export interface SOXMetrics {
  impactPct: number;
  complianceScorePct: number;
  remediationCost: number;
}

/**
 * Aggregate fractional audit/transaction amounts exactly (0.1 + 0.2 = 0.3).
 */
export function sumAuditAmounts(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/**
 * Exact numeric delta and percentage change between two values.
 * Guards zero denominator for pct.
 */
export function computeAuditDelta(oldVal: number, newVal: number): AuditDelta {
  const delta = roundTo(subtractMoney(newVal, oldVal), 4);
  const pct =
    toDecimal(oldVal).gt(0) || toDecimal(oldVal).lt(0)
      ? roundTo(divideMoney(delta, oldVal).times(100), 2)
      : 0;
  return { delta, pct };
}

/**
 * Exact percentage share, guarding a zero denominator.
 */
export function computeAuditRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

export function computeSOXMetrics(input: SOXMetricsInput): SOXMetrics {
  const impactPct = computeAuditRatioPct(input.controlValueAtRisk, input.totalRevenue);
  const complianceScorePct = computeAuditRatioPct(input.passedControls, input.totalControls);
  const remediationCost = roundTo(input.remediationCost, 2);

  return {
    impactPct,
    complianceScorePct,
    remediationCost,
  };
}
