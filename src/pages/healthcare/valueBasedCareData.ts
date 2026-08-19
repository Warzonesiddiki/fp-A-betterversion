/**
 * Value-based-care figures derivable from the recorded healthcare workspace
 * (`healthcareStore`).
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money totals route through decimal.js via `@/utils/money`.
 * 2. Episode savings is DERIVED as target − actual for every recorded
 *    bundle. The stored `savings` field on an entry is never summed, because
 *    a hand-entered field that disagrees with target and actual would let an
 *    inconsistent row launder a wrong total into the KPI.
 * 3. The aggregate quality score is the ratio of sums — Σ scores ÷ Σ full
 *    marks — not a mean of per-dimension percentages. It is `null` when no
 *    full mark is recorded, never a fabricated constant.
 * 4. When the workspace has recorded nothing, the derivation returns `null`
 *    and the page empty-states. Sessions ≤023 shipped seeded "quality
 *    metrics", "savings data" and "programs" for every tenant; those seeds
 *    were removed in session 024 (persist bump v2 → v3).
 */

import { divideMoney, subtractMoney, sumMoney, toDecimal } from '@/utils/money';

export interface QualityMetricInput {
  readonly subject: string;
  /** Recorded score. */
  readonly A: number;
  /** Recorded benchmark. */
  readonly B: number;
  readonly fullMark: number;
}

export interface SavingsEntryInput {
  readonly category: string;
  readonly target: number;
  readonly actual: number;
}

export interface ProgramInput {
  readonly id: string;
  readonly program: string;
  readonly population: string;
  readonly qualityScore: string;
  readonly sharedSavings: string;
  readonly status: 'High' | 'Watch' | 'Medium';
}

export interface SavingsRow {
  readonly category: string;
  readonly target: number;
  readonly actual: number;
  /** Derived: target − actual. Positive means the episode came in under target. */
  readonly savings: number;
}

export interface ValueBasedCareData {
  /** Percent = Σ scores ÷ Σ full marks. `null` when no full mark exists. */
  readonly aggregateQualityScore: number | null;
  /** Σ (target − actual) over recorded bundles. `null` when none recorded. */
  readonly netSharedSavings: number | null;
  readonly savingsRows: readonly SavingsRow[];
  readonly qualityMetrics: readonly QualityMetricInput[];
  readonly programs: readonly ProgramInput[];
}

const PERCENT_PLACES = 2;
const CURRENCY_PLACES = 2;

/**
 * Returns `null` when the workspace has recorded nothing — the page must
 * empty-state instead of rendering a fictional ACO.
 */
export function deriveValueBasedCare(
  qualityMetrics: readonly QualityMetricInput[],
  savingsData: readonly SavingsEntryInput[],
  programs: readonly ProgramInput[]
): ValueBasedCareData | null {
  if (qualityMetrics.length === 0 && savingsData.length === 0 && programs.length === 0) {
    return null;
  }

  const totalScore = sumMoney(qualityMetrics.map((m) => m.A));
  const totalFullMark = sumMoney(qualityMetrics.map((m) => m.fullMark));
  const aggregateQualityScore = totalFullMark.greaterThan(0)
    ? divideMoney(totalScore, totalFullMark).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber()
    : null;

  const savingsRows: SavingsRow[] = savingsData.map((entry) => {
    const savings = subtractMoney(entry.target, entry.actual);
    return {
      category: entry.category,
      target: toDecimal(entry.target).toDecimalPlaces(CURRENCY_PLACES).toNumber(),
      actual: toDecimal(entry.actual).toDecimalPlaces(CURRENCY_PLACES).toNumber(),
      savings: savings.toDecimalPlaces(CURRENCY_PLACES).toNumber(),
    };
  });

  const netSharedSavings =
    savingsRows.length > 0
      ? sumMoney(savingsRows.map((r) => r.savings))
          .toDecimalPlaces(CURRENCY_PLACES)
          .toNumber()
      : null;

  return {
    aggregateQualityScore,
    netSharedSavings,
    savingsRows,
    qualityMetrics,
    programs,
  };
}
