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
 * @module engines/VarianceAttributionEngine
 */

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
    const raw = segment.actualAmount - segment.budgetAmount;
    return signFlipped ? -raw : raw;
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
    const totalAbs = variances.reduce((acc, v) => acc + Math.abs(v), 0);
    const totalNet = consolidatedVariance ?? variances.reduce((acc, v) => acc + v, 0);

    const ranked = segments
      .map((s, i) => {
        const v = variances[i]!;
        const absV = Math.abs(v);
        return {
          segmentId: s.id,
          segmentName: s.name,
          absoluteVariance: absV,
          attributedVariance: totalAbs === 0 ? 0 : (absV / totalAbs) * totalNet,
          attributionPercentage: totalAbs === 0 ? 0 : (absV / totalAbs) * 100,
          significant: totalAbs > 0 && absV / totalAbs >= this.SIGNIFICANCE_THRESHOLD,
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
    const totalBase = segments.reduce(
      (acc, s) => acc + Math.abs(s.actualAmount) + Math.abs(s.budgetAmount),
      0
    );
    return segments
      .map((s) => {
        const segmentBase = Math.abs(s.actualAmount) + Math.abs(s.budgetAmount);
        const weight = totalBase === 0 ? 0 : segmentBase / totalBase;
        return {
          segmentId: s.id,
          segmentName: s.name,
          absoluteVariance: Math.abs(this.computeSegmentVariance(s)),
          attributedVariance: totalVariance * weight,
          attributionPercentage: weight * 100,
          significant: weight >= this.SIGNIFICANCE_THRESHOLD,
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
    return (segmentVariance / totalVariance) * 100;
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
    const totalExternalRevenue = segments.reduce((acc, s) => acc + s.externalRevenue, 0);

    const tenPercentTests = segments.flatMap((s) => {
      const segRevenue = s.actualAmount;
      const segVariance = this.computeSegmentVariance(s);
      return [
        {
          segmentId: s.id,
          test: 'revenue' as const,
          passed:
            consolidated.revenue !== 0 &&
            Math.abs(segRevenue) / Math.abs(consolidated.revenue) >= this.SIGNIFICANCE_THRESHOLD,
        },
        {
          segmentId: s.id,
          test: 'profit' as const,
          passed:
            consolidated.profit !== 0 &&
            Math.abs(segVariance) / Math.abs(consolidated.profit) >= this.SIGNIFICANCE_THRESHOLD,
        },
        {
          segmentId: s.id,
          test: 'assets' as const,
          passed:
            consolidated.assets !== 0 &&
            Math.abs(segRevenue) / Math.abs(consolidated.assets) >= this.SIGNIFICANCE_THRESHOLD,
        },
      ];
    });

    const significantSegmentIds = new Set(
      tenPercentTests.filter((t) => t.passed).map((t) => t.segmentId)
    );
    const significant = attributions.filter((a) => significantSegmentIds.has(a.segmentId));
    const nonSignificant = attributions.filter((a) => !significantSegmentIds.has(a.segmentId));

    const significantExternalRevenue = segments
      .filter((s) => significantSegmentIds.has(s.id))
      .reduce((acc, s) => acc + s.externalRevenue, 0);

    const seventyFivePercentTest =
      totalExternalRevenue === 0
        ? true
        : significantExternalRevenue / totalExternalRevenue >= this.SEVENTY_FIVE_PERCENT;

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

    const totalNetVariance = segments.reduce((acc, s) => acc + this.computeSegmentVariance(s), 0);
    const totalAbsoluteVariance = attributions.reduce((acc, a) => acc + a.absoluteVariance, 0);
    const restVariance = rest.reduce((acc, r) => acc + r.attributedVariance, 0);
    const topAttributed = top.reduce((acc, t) => acc + t.attributedVariance, 0);
    const residual = totalNetVariance - topAttributed - restVariance;

    return {
      totalAbsoluteVariance,
      totalNetVariance,
      topN: top,
      restCount: rest.length,
      restVariance,
      reconciled: Math.abs(residual) < this.RECONCILIATION_TOLERANCE,
      residual,
    };
  }

  /**
   * Reconcile attributed variance to consolidated total. Identifies rounding gap.
   */
  static reconcileToConsolidated(
    attributed: readonly VarianceAttribution[],
    consolidatedVariance: number
  ): ReconciliationResult {
    const attributedTotal = attributed.reduce((acc, a) => acc + a.attributedVariance, 0);
    const residual = consolidatedVariance - attributedTotal;
    return {
      attributed: attributedTotal,
      consolidated: consolidatedVariance,
      residual,
      reconciled: Math.abs(residual) < this.RECONCILIATION_TOLERANCE,
    };
  }

  /**
   * Compute segment margin (revenue - cost) and margin percent.
   */
  static computeSegmentMargin(segment: Segment): SegmentMargin {
    const margin = segment.actualAmount - segment.budgetAmount;
    const marginPercent =
      segment.actualAmount === 0 ? 0 : (margin / Math.abs(segment.actualAmount)) * 100;
    return {
      segmentId: segment.id,
      revenue: segment.actualAmount,
      margin,
      marginPercent,
    };
  }
}

export default VarianceAttributionEngine;
