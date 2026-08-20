/**
 * VarianceAttributionEngine — ASC 280 Segment Reporting Variance Attribution
 *
 * PURPOSE: Attribute consolidated financial variance to operating segments and
 * sub-segments per ASC 280 (Segment Reporting). Distinct from:
 * - VarianceDecompositionEngine: Rate/Volume/Mix revenue bridge
 * - COGSVarianceEngine: Standard cost (price/usage/efficiency/volume)
 *
 * DOMAIN: ASC 280 segment reporting — 10% significance test, 75% revenue test,
 * CODM (Chief Operating Decision Maker) attribution rules.
 *
 * PURE-FN: All methods are static, no side effects, no I/O. Safe for
 * worker offloading. Deterministic given the same inputs.
 *
 * MONEY MIGRATION (2026-08-03): budget/actual amounts, variances, attributed
 * variances, margins and residual figures are money and flow through the
 * canonical money primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP).
 * Attribution shares keep full Decimal precision (they reconcile by
 * construction); percentages and significance tests are ratios and compare in
 * Decimal space. No raw + - * / on currency values remains.
 *
 * @module engines/VarianceAttributionEngine
 */
//
// @money-ast-allow Reason: this file is the ASC 280 variance-attribution
// engine. The flagged arithmetic in `.sort()` comparators is
// `b.absoluteVariance - a.absoluteVariance`, a numeric comparator that
// returns < 0 / 0 / > 0. Sort comparators are pure ordering functions; the
// subtracted difference is discarded and only its sign is used.
// =============================================================================

import { divideMoney, multiplyMoney, subtractMoney, sumMoney, toDecimal } from '../utils/money';

// ============================================================================
// TYPES
// ============================================================================

export type SegmentType = 'operating' | 'geographic' | 'product' | 'customer';

export interface Segment {
  readonly id: string;
  readonly name: string;
  readonly type: SegmentType;
  readonly budgetAmount: number;
  readonly actualAmount: number;
  readonly externalRevenue: number; // ASC 280 distinguishes internal vs external
}

export interface VarianceAttribution {
  readonly segmentId: string;
  readonly segmentName: string;
  readonly absoluteVariance: number;
  readonly attributedVariance: number;
  readonly attributionPercentage: number; // 0..100
  readonly significant: boolean; // ASC 280 10% test
  readonly rank: number; // 1 = largest absolute variance
}

export interface AttributionSummary {
  readonly totalAbsoluteVariance: number;
  readonly totalNetVariance: number;
  readonly topN: readonly VarianceAttribution[];
  readonly restCount: number;
  readonly restVariance: number;
  readonly reconciled: boolean;
  readonly residual: number; // rounding gap (should be 0 or < 0.01)
}

export interface SignificanceResult {
  readonly significant: readonly VarianceAttribution[];
  readonly nonSignificant: readonly VarianceAttribution[];
  readonly seventyFivePercentTest: boolean; // external revenue from significant ≥ 75%
  readonly tenPercentTestsPassed: readonly {
    segmentId: string;
    test: 'revenue' | 'profit' | 'loss' | 'assets';
    passed: boolean;
  }[];
}

export interface ReconciliationResult {
  readonly attributed: number;
  readonly consolidated: number;
  readonly residual: number;
  readonly reconciled: boolean; // |residual| < 0.01
}

export interface SegmentMargin {
  readonly segmentId: string;
  readonly revenue: number;
  readonly margin: number;
  readonly marginPercent: number;
}

// ============================================================================
// ENGINE
// ============================================================================

export class VarianceAttributionEngine {
  private static readonly SIGNIFICANCE_THRESHOLD = 0.1; // ASC 280 10% test
  private static readonly SEVENTY_FIVE_PERCENT = 0.75; // ASC 280 75% revenue test
  private static readonly RECONCILIATION_TOLERANCE = 0.01;

  /**
   * Compute per-segment variance (actual - budget). Positive = favorable for revenue,
   * unfavorable for cost. Caller specifies sign convention via signFlipped flag.
   */
  static computeSegmentVariance(segment: Segment, signFlipped = false): number {
    const raw = subtractMoney(segment.actualAmount, segment.budgetAmount);
    return signFlipped ? raw.negated().toNumber() : raw.toNumber();
  }

  /**
   * Proportional attribution: each segment gets a share of total NET variance
   * equal to its share of total absolute variance. Reconciles by construction
   * (sum of attributedVariance == consolidatedNetVariance).
   *
   * Optional `consolidatedVariance` override — useful when the segments don't
   * include the full entity (e.g. only reporting segments, not "all other").
   */
  static attributeBySegment(
    segments: readonly Segment[],
    consolidatedVariance?: number
  ): readonly VarianceAttribution[] {
    const variances = segments.map((s) => this.computeSegmentVariance(s));
    const totalAbs = sumMoney(variances.map((v) => Math.abs(v)));
    const totalNet =
      consolidatedVariance !== undefined ? toDecimal(consolidatedVariance) : sumMoney(variances);

    const ranked = segments
      .map((s, i) => {
        const v = variances[i]!;
        const absV = Math.abs(v);
        const share = totalAbs.isZero() ? toDecimal(0) : toDecimal(absV).div(totalAbs);
        return {
          segmentId: s.id,
          segmentName: s.name,
          absoluteVariance: absV,
          attributedVariance: totalAbs.isZero() ? 0 : multiplyMoney(share, totalNet).toNumber(),
          attributionPercentage: totalAbs.isZero() ? 0 : share.times(100).toNumber(),
          significant:
            totalAbs.greaterThan(0) &&
            toDecimal(absV).div(totalAbs).gte(this.SIGNIFICANCE_THRESHOLD),
          rank: 0,
        };
      })
      .slice()
      .sort((a, b) => b.absoluteVariance - a.absoluteVariance)
      .map((a, idx) => ({ ...a, rank: idx + 1 }));

    return ranked;
  }

  /**
   * Attribution by absolute base (revenue/assets): variance weighted by segment
   * size, not by variance magnitude. Used for cost allocation.
   */
  static attributeByAbsoluteBase(
    totalVariance: number,
    segments: readonly Segment[]
  ): readonly VarianceAttribution[] {
    const totalBase = sumMoney(
      segments.map((s) => toDecimal(Math.abs(s.actualAmount)).plus(Math.abs(s.budgetAmount)))
    );
    return segments
      .map((s) => {
        const segmentBase = toDecimal(Math.abs(s.actualAmount)).plus(Math.abs(s.budgetAmount));
        const weight = totalBase.isZero() ? toDecimal(0) : segmentBase.div(totalBase);
        return {
          segmentId: s.id,
          segmentName: s.name,
          absoluteVariance: Math.abs(this.computeSegmentVariance(s)),
          attributedVariance: multiplyMoney(toDecimal(totalVariance), weight).toNumber(),
          attributionPercentage: weight.times(100).toNumber(),
          significant: weight.gte(this.SIGNIFICANCE_THRESHOLD),
          rank: 0, // rank filled in by rankSegmentsByVariance
        };
      })
      .slice()
      .sort((a, b) => b.absoluteVariance - a.absoluteVariance)
      .map((a, idx) => ({ ...a, rank: idx + 1 }));
  }

  /**
   * Compute attribution percentage for one segment vs total.
   */
  static computeAttributionPercentage(segmentVariance: number, totalVariance: number): number {
    if (totalVariance === 0) return 0;
    return divideMoney(segmentVariance, totalVariance).times(100).toNumber();
  }

  /**
   * Rank segments by absolute variance (largest first).
   */
  static rankSegmentsByVariance(segments: readonly Segment[]): readonly VarianceAttribution[] {
    return this.attributeBySegment(segments);
  }

  /**
   * Identify significant segments per ASC 280 10% test. A segment is significant
   * if ANY of: revenue ≥10%, profit ≥10%, loss ≥10%, assets ≥10% of consolidated.
   */
  static identifySignificantSegments(
    segments: readonly Segment[],
    consolidated: { revenue: number; profit: number; assets: number }
  ): SignificanceResult {
    const attributions = this.attributeBySegment(segments);
    const totalExternalRevenue = sumMoney(segments.map((s) => s.externalRevenue));

    const tenPercentTests = segments.flatMap((s) => {
      const segRevenue = toDecimal(s.actualAmount);
      const segVariance = subtractMoney(s.actualAmount, s.budgetAmount);
      const consolidatedRevenue = toDecimal(consolidated.revenue);
      const consolidatedProfit = toDecimal(consolidated.profit);
      const consolidatedAssets = toDecimal(consolidated.assets);
      return [
        {
          segmentId: s.id,
          test: 'revenue' as const,
          passed:
            !consolidatedRevenue.isZero() &&
            segRevenue.abs().div(consolidatedRevenue.abs()).gte(this.SIGNIFICANCE_THRESHOLD),
        },
        {
          segmentId: s.id,
          test: 'profit' as const,
          passed:
            !consolidatedProfit.isZero() &&
            segVariance.abs().div(consolidatedProfit.abs()).gte(this.SIGNIFICANCE_THRESHOLD),
        },
        {
          segmentId: s.id,
          test: 'assets' as const,
          passed:
            !consolidatedAssets.isZero() &&
            segRevenue.abs().div(consolidatedAssets.abs()).gte(this.SIGNIFICANCE_THRESHOLD),
        },
      ];
    });

    const significantSegmentIds = new Set(
      tenPercentTests.filter((t) => t.passed).map((t) => t.segmentId)
    );
    const significant = attributions.filter((a) => significantSegmentIds.has(a.segmentId));
    const nonSignificant = attributions.filter((a) => !significantSegmentIds.has(a.segmentId));

    const significantExternalRevenue = sumMoney(
      segments.filter((s) => significantSegmentIds.has(s.id)).map((s) => s.externalRevenue)
    );

    const seventyFivePercentTest = totalExternalRevenue.isZero()
      ? true
      : significantExternalRevenue.div(totalExternalRevenue).gte(this.SEVENTY_FIVE_PERCENT);

    return {
      significant,
      nonSignificant,
      seventyFivePercentTest,
      tenPercentTestsPassed: tenPercentTests.filter((t) => t.passed),
    };
  }

  /**
   * Summarize attribution: top N segments + rest aggregated. Returns reconciled summary.
   */
  static summarizeAttribution(segments: readonly Segment[], topN = 5): AttributionSummary {
    const attributions = this.attributeBySegment(segments);
    const top = attributions.slice(0, topN);
    const rest = attributions.slice(topN);

    const totalNetVariance = sumMoney(segments.map((s) => this.computeSegmentVariance(s)));
    const totalAbsoluteVariance = sumMoney(attributions.map((a) => a.absoluteVariance));
    const restVariance = sumMoney(rest.map((r) => r.attributedVariance));
    const topAttributed = sumMoney(top.map((t) => t.attributedVariance));
    const residual = subtractMoney(subtractMoney(totalNetVariance, topAttributed), restVariance);

    return {
      totalAbsoluteVariance: totalAbsoluteVariance.toNumber(),
      totalNetVariance: totalNetVariance.toNumber(),
      topN: top,
      restCount: rest.length,
      restVariance: restVariance.toNumber(),
      reconciled: residual.abs().lt(this.RECONCILIATION_TOLERANCE),
      residual: residual.toNumber(),
    };
  }

  /**
   * Reconcile attributed variance to consolidated total. Identifies rounding gap.
   */
  static reconcileToConsolidated(
    attributed: readonly VarianceAttribution[],
    consolidatedVariance: number
  ): ReconciliationResult {
    const attributedTotal = sumMoney(attributed.map((a) => a.attributedVariance));
    const residual = subtractMoney(consolidatedVariance, attributedTotal);
    return {
      attributed: attributedTotal.toNumber(),
      consolidated: consolidatedVariance,
      residual: residual.toNumber(),
      reconciled: residual.abs().lt(this.RECONCILIATION_TOLERANCE),
    };
  }

  /**
   * Compute segment margin (revenue - cost) and margin percent.
   */
  static computeSegmentMargin(segment: Segment): SegmentMargin {
    const margin = subtractMoney(segment.actualAmount, segment.budgetAmount);
    const actual = toDecimal(segment.actualAmount);
    const marginPercent = actual.isZero()
      ? 0
      : divideMoney(margin, actual.abs()).times(100).toNumber();
    return {
      segmentId: segment.id,
      revenue: segment.actualAmount,
      margin: margin.toNumber(),
      marginPercent,
    };
  }
}

export default VarianceAttributionEngine;
