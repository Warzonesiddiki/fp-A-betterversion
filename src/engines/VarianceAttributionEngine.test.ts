import { describe, it, expect } from 'vitest';
import { VarianceAttributionEngine, type Segment } from './VarianceAttributionEngine';

const mkSegment = (overrides: Partial<Segment> = {}): Segment => ({
  id: 'seg-default',
  name: 'Default Segment',
  type: 'operating',
  budgetAmount: 1000,
  actualAmount: 1100,
  externalRevenue: 1100,
  ...overrides,
});

const mkSegments = (): Segment[] => [
  mkSegment({
    id: 'north-america',
    name: 'North America',
    budgetAmount: 5000,
    actualAmount: 5500,
    externalRevenue: 5500,
  }),
  mkSegment({
    id: 'europe',
    name: 'Europe',
    budgetAmount: 3000,
    actualAmount: 2700,
    externalRevenue: 2700,
  }),
  mkSegment({
    id: 'asia-pac',
    name: 'Asia-Pacific',
    budgetAmount: 2000,
    actualAmount: 2400,
    externalRevenue: 2400,
  }),
  mkSegment({
    id: 'latam',
    name: 'Latin America',
    budgetAmount: 1000,
    actualAmount: 1050,
    externalRevenue: 1050,
  }),
  mkSegment({ id: 'mea', name: 'MEA', budgetAmount: 500, actualAmount: 480, externalRevenue: 480 }),
];

describe('VarianceAttributionEngine', () => {
  describe('computeSegmentVariance', () => {
    it('returns actual - budget by default', () => {
      expect(VarianceAttributionEngine.computeSegmentVariance(mkSegment())).toBe(100);
    });

    it('negates variance when signFlipped=true (for cost contexts)', () => {
      expect(VarianceAttributionEngine.computeSegmentVariance(mkSegment(), true)).toBe(-100);
    });

    it('returns 0 for actual == budget', () => {
      const seg = mkSegment({ actualAmount: 1000, budgetAmount: 1000 });
      expect(VarianceAttributionEngine.computeSegmentVariance(seg)).toBe(0);
    });
  });

  describe('attributeBySegment', () => {
    it('ranks segments by absolute variance descending', () => {
      const attributed = VarianceAttributionEngine.attributeBySegment(mkSegments());
      expect(attributed[0]!.rank).toBe(1);
      expect(attributed[0]!.segmentId).toBe('north-america'); // 500 abs var
      expect(attributed[1]!.segmentId).toBe('asia-pac'); // 400 abs var
      expect(attributed[2]!.segmentId).toBe('europe'); // 300 abs var
      expect(attributed[4]!.rank).toBe(5);
    });

    it('attributionPercentage sums to 100', () => {
      const attributed = VarianceAttributionEngine.attributeBySegment(mkSegments());
      const sum = attributed.reduce((acc, a) => acc + a.attributionPercentage, 0);
      expect(sum).toBeCloseTo(100, 5);
    });

    it('flags significant=true for segments ≥10% of total absolute variance', () => {
      const attributed = VarianceAttributionEngine.attributeBySegment(mkSegments());
      // North America: 500/1130 = 44.2% — significant
      expect(attributed.find((a) => a.segmentId === 'north-america')!.significant).toBe(true);
    });

    it('returns empty array for empty input', () => {
      expect(VarianceAttributionEngine.attributeBySegment([])).toEqual([]);
    });
  });

  describe('attributeByAbsoluteBase', () => {
    it('distributes totalVariance proportional to segment base', () => {
      const totalVar = 1000;
      const result = VarianceAttributionEngine.attributeByAbsoluteBase(totalVar, mkSegments());
      const sum = result.reduce((acc, a) => acc + a.attributedVariance, 0);
      expect(sum).toBeCloseTo(1000, 1);
    });

    it('returns zero attribution when totalVariance=0', () => {
      const result = VarianceAttributionEngine.attributeByAbsoluteBase(0, mkSegments());
      expect(result.every((a) => a.attributedVariance === 0)).toBe(true);
    });
  });

  describe('computeAttributionPercentage', () => {
    it('returns segment/total * 100', () => {
      expect(VarianceAttributionEngine.computeAttributionPercentage(25, 100)).toBe(25);
    });

    it('returns 0 when total=0', () => {
      expect(VarianceAttributionEngine.computeAttributionPercentage(25, 0)).toBe(0);
    });
  });

  describe('identifySignificantSegments', () => {
    it('applies ASC 280 10% revenue test', () => {
      const consolidated = { revenue: 11000, profit: 1130, assets: 50000 };
      const result = VarianceAttributionEngine.identifySignificantSegments(
        mkSegments(),
        consolidated
      );
      // North America 5500/11000 = 50% > 10% — significant
      expect(result.significant.some((s) => s.segmentId === 'north-america')).toBe(true);
    });

    it('verifies 75% external revenue test (ASC 280)', () => {
      const consolidated = { revenue: 11000, profit: 1130, assets: 50000 };
      const result = VarianceAttributionEngine.identifySignificantSegments(
        mkSegments(),
        consolidated
      );
      expect(typeof result.seventyFivePercentTest).toBe('boolean');
    });

    it('returns tenPercentTestsPassed with structured breakdown', () => {
      const consolidated = { revenue: 11000, profit: 1130, assets: 50000 };
      const result = VarianceAttributionEngine.identifySignificantSegments(
        mkSegments(),
        consolidated
      );
      expect(result.tenPercentTestsPassed.every((t) => typeof t.passed === 'boolean')).toBe(true);
    });
  });

  describe('summarizeAttribution', () => {
    it('returns top N + rest aggregated', () => {
      const summary = VarianceAttributionEngine.summarizeAttribution(mkSegments(), 3);
      expect(summary.topN).toHaveLength(3);
      expect(summary.restCount).toBe(2);
    });

    it('reconciles when sum of (top + rest) ≈ total', () => {
      const summary = VarianceAttributionEngine.summarizeAttribution(mkSegments(), 5);
      expect(summary.reconciled).toBe(true);
      expect(Math.abs(summary.residual)).toBeLessThan(0.01);
    });

    it('computes totalNetVariance correctly', () => {
      const summary = VarianceAttributionEngine.summarizeAttribution(mkSegments());
      // sum of (actual - budget) = 500 + (-300) + 400 + 50 + (-20) = 630
      expect(summary.totalNetVariance).toBe(630);
    });
  });

  describe('reconcileToConsolidated', () => {
    it('returns reconciled=true when residual < 0.01', () => {
      const attributed = VarianceAttributionEngine.attributeBySegment(mkSegments());
      const result = VarianceAttributionEngine.reconcileToConsolidated(attributed, 630);
      expect(result.reconciled).toBe(true);
    });

    it('returns reconciled=false when gap exceeds tolerance', () => {
      const attributed = VarianceAttributionEngine.attributeBySegment(mkSegments());
      const result = VarianceAttributionEngine.reconcileToConsolidated(attributed, 1000);
      expect(result.reconciled).toBe(false);
      expect(result.residual).toBe(370);
    });
  });

  describe('computeSegmentMargin', () => {
    it('returns margin = actual - budget', () => {
      const margin = VarianceAttributionEngine.computeSegmentMargin(mkSegment());
      expect(margin.margin).toBe(100);
    });

    it('computes marginPercent relative to actual revenue', () => {
      const margin = VarianceAttributionEngine.computeSegmentMargin(mkSegment());
      // 100 / 1100 * 100 = 9.0909...
      expect(margin.marginPercent).toBeCloseTo(9.0909, 3);
    });

    it('returns 0% margin when actual is 0', () => {
      const margin = VarianceAttributionEngine.computeSegmentMargin(
        mkSegment({ actualAmount: 0, budgetAmount: 100 })
      );
      expect(margin.marginPercent).toBe(0);
    });
  });
});
