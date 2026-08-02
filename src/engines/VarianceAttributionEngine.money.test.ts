/**
 * GAP-1 (F-0006) known-answer tests for VarianceAttributionEngine's money
 * migration.
 *
 * ASC 280 segment variance attribution reconciles consolidated variance to
 * segments; money drift in variances/attribution is user-visible in segment
 * reporting. Each case is a FIXED input -> EXACT expected decimal asserted
 * with `toBe` (Object.is); the pre-migration float literal is recorded inline
 * where it differed.
 */
import { describe, it, expect } from 'vitest';
import { VarianceAttributionEngine } from './VarianceAttributionEngine';

const seg = (id: string, actualAmount: number, budgetAmount: number) => ({
  id,
  name: id,
  type: 'operating' as const,
  actualAmount,
  budgetAmount,
  externalRevenue: 0,
});

describe('VarianceAttributionEngine — money known answers (GAP-1 / F-0006)', () => {
  it('computes segment variance exactly (float gave 0.19999999999999998)', () => {
    expect(VarianceAttributionEngine.computeSegmentVariance(seg('A', 0.3, 0.1))).toBe(0.2);
  });

  it('computes negative variance exactly', () => {
    expect(VarianceAttributionEngine.computeSegmentVariance(seg('A', 0.3, 0.1), true)).toBe(-0.2);
  });

  it('attributes variance exactly (float gave 0.19999999999999998)', () => {
    const attributed = VarianceAttributionEngine.attributeBySegment([
      seg('A', 0.3, 0.1), // var 0.2
      seg('B', 0.1, 0), // var 0.1
    ]);
    // (0.2 / 0.3) * 0.3 = 0.2 exactly in decimal
    expect(attributed.find((a) => a.segmentId === 'A')!.attributedVariance).toBe(0.2);
    expect(attributed.find((a) => a.segmentId === 'B')!.attributedVariance).toBe(0.1);
  });

  it('attribution sums reconcile to the consolidated total exactly', () => {
    const attributed = VarianceAttributionEngine.attributeBySegment([
      seg('A', 0.3, 0.1),
      seg('B', 0.1, 0),
      seg('C', 0.5, 0.4),
    ]);
    const sum = attributed.reduce((acc, a) => acc + a.attributedVariance, 0);
    // totalNet = 0.2 + 0.1 + 0.1 = 0.4 exactly in decimal
    expect(sum).toBe(0.4);
  });

  it('respects a consolidated variance override in exact decimals', () => {
    const attributed = VarianceAttributionEngine.attributeBySegment([seg('A', 0.3, 0.1)], 1);
    expect(attributed[0]!.attributedVariance).toBe(1);
  });

  it('returns zero attribution when all variances are zero', () => {
    const attributed = VarianceAttributionEngine.attributeBySegment([seg('A', 0, 0)]);
    expect(attributed[0]!.attributedVariance).toBe(0);
    expect(attributed[0]!.attributionPercentage).toBe(0);
  });

  it('computes margin exactly (float gave 0.19999999999999998)', () => {
    const margin = VarianceAttributionEngine.computeSegmentMargin(seg('A', 0.3, 0.1));
    expect(margin.margin).toBe(0.2);
  });

  it('summarizes with an exact residual of zero', () => {
    const summary = VarianceAttributionEngine.summarizeAttribution([
      seg('A', 0.3, 0.1),
      seg('B', 0.1, 0),
    ]);
    expect(summary.totalNetVariance).toBe(0.3);
    expect(summary.residual).toBe(0);
    expect(summary.reconciled).toBe(true);
  });

  it('reconciles to consolidated with exact residual (float gave 0.20000000000000018)', () => {
    // attributed sum 0.3 (decimal-exact) vs consolidated 0.5 -> residual 0.2
    const attributed = VarianceAttributionEngine.attributeBySegment([
      seg('A', 0.3, 0.1),
      seg('B', 0.1, 0),
      seg('C', 0.5, 0.4),
    ]);
    const result = VarianceAttributionEngine.reconcileToConsolidated(attributed, 0.5);
    expect(result.residual).toBe(0.1);
    expect(result.reconciled).toBe(false);
  });

  it('flags non-reconciliation loudly when residual exceeds tolerance', () => {
    const result = VarianceAttributionEngine.reconcileToConsolidated(
      [
        {
          segmentId: 'x',
          segmentName: 'x',
          absoluteVariance: 100,
          attributedVariance: 100,
          attributionPercentage: 100,
          significant: true,
          rank: 1,
        },
      ],
      500
    );
    expect(result.residual).toBe(400);
    expect(result.reconciled).toBe(false);
  });
});
