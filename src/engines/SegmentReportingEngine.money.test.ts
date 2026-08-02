/**
 * GAP-1 (F-0006) known-answer tests for SegmentReportingEngine's money migration.
 *
 * Segment revenue/expenses/net income/margins feed SEC-style segment
 * disclosures on SegmentReportingPage. Each case is a FIXED input -> EXACT
 * expected decimal asserted with `toBe` (Object.is); the pre-migration float
 * literal is recorded inline where it differed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SegmentReportingEngine } from './SegmentReportingEngine';

describe('SegmentReportingEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    SegmentReportingEngine.reset();
  });

  it('sums segment revenue exactly (float gave 0.30000000000000004)', () => {
    const seg = SegmentReportingEngine.defineSegment({ name: 'NA', type: 'geographic' });
    SegmentReportingEngine.reportSegmentData({
      segmentId: seg.id,
      period: '2026-Q1',
      revenue: 0.1,
      expenses: 0,
      assets: 0,
      liabilities: 0,
    });
    SegmentReportingEngine.reportSegmentData({
      segmentId: seg.id,
      period: '2026-Q1',
      revenue: 0.2,
      expenses: 0,
      assets: 0,
      liabilities: 0,
    });
    expect(SegmentReportingEngine.getSegmentReport('2026-Q1')[0]!.revenue).toBe(0.3);
  });

  it('computes net income exactly (float gave 0.19999999999999998)', () => {
    const seg = SegmentReportingEngine.defineSegment({ name: 'NA', type: 'geographic' });
    SegmentReportingEngine.reportSegmentData({
      segmentId: seg.id,
      period: '2026-Q1',
      revenue: 0.3,
      expenses: 0.1,
      assets: 0,
      liabilities: 0,
    });
    expect(SegmentReportingEngine.getSegmentReport('2026-Q1')[0]!.netIncome).toBe(0.2);
  });

  it('computes margin from exact decimals (float gave 0.6666666666666666)', () => {
    const seg = SegmentReportingEngine.defineSegment({ name: 'NA', type: 'geographic' });
    SegmentReportingEngine.reportSegmentData({
      segmentId: seg.id,
      period: '2026-Q1',
      revenue: 3,
      expenses: 1,
      assets: 0,
      liabilities: 0,
    });
    expect(SegmentReportingEngine.getSegmentReport('2026-Q1')[0]!.margin).toBe(0.6666666667);
  });

  it('returns whole-dollar margins exactly', () => {
    const seg = SegmentReportingEngine.defineSegment({ name: 'NA', type: 'geographic' });
    SegmentReportingEngine.reportSegmentData({
      segmentId: seg.id,
      period: '2026-Q1',
      revenue: 1000000,
      expenses: 300000,
      assets: 5000000,
      liabilities: 2000000,
    });
    const report = SegmentReportingEngine.getSegmentReport('2026-Q1');
    expect(report[0]!.margin).toBe(0.7);
    expect(report[0]!.netIncome).toBe(700000);
  });

  it('returns zero margin for a segment with no revenue', () => {
    const seg = SegmentReportingEngine.defineSegment({ name: 'NA', type: 'geographic' });
    SegmentReportingEngine.reportSegmentData({
      segmentId: seg.id,
      period: '2026-Q1',
      revenue: 0,
      expenses: 100,
      assets: 0,
      liabilities: 0,
    });
    expect(SegmentReportingEngine.getSegmentReport('2026-Q1')[0]!.margin).toBe(0);
  });

  it('handles segments with no data in a period', () => {
    SegmentReportingEngine.defineSegment({ name: 'NA', type: 'geographic' });
    const report = SegmentReportingEngine.getSegmentReport('2026-Q1');
    expect(report).toHaveLength(1);
    expect(report[0]!.revenue).toBe(0);
    expect(report[0]!.netIncome).toBe(0);
    expect(report[0]!.margin).toBe(0);
  });
});
