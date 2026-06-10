/**
 * Tests for SegmentReportingEngine
 * Covers: defineSegment, getSegments, reportSegmentData, getSegmentReport
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SegmentReportingEngine } from './SegmentReportingEngine';

describe('SegmentReportingEngine', () => {
  beforeEach(() => {
    SegmentReportingEngine.reset();
  });

  const revenueSegment: Parameters<typeof SegmentReportingEngine.defineSegment>[0] = {
    name: 'North America',
    type: 'geographic',
  };

  const europeSegment: Parameters<typeof SegmentReportingEngine.defineSegment>[0] = {
    name: 'Europe',
    type: 'geographic',
  };

  describe('defineSegment', () => {
    it('should define a reporting segment', () => {
      const segment = SegmentReportingEngine.defineSegment(revenueSegment);
      expect(segment.id).toBeDefined();
      expect(segment.name).toBe('North America');
      expect(segment.type).toBe('geographic');
    });

    it('should define multiple segments', () => {
      SegmentReportingEngine.defineSegment(revenueSegment);
      SegmentReportingEngine.defineSegment(europeSegment);
      expect(SegmentReportingEngine.getSegments()).toHaveLength(2);
    });
  });

  describe('getSegments', () => {
    it('should return all segments', () => {
      SegmentReportingEngine.defineSegment(revenueSegment);
      SegmentReportingEngine.defineSegment(europeSegment);
      const segments = SegmentReportingEngine.getSegments();
      expect(segments).toHaveLength(2);
    });

    it('should filter by type', () => {
      SegmentReportingEngine.defineSegment(revenueSegment);
      SegmentReportingEngine.defineSegment(europeSegment);
      SegmentReportingEngine.defineSegment({ name: 'Product A', type: 'product' });
      const geographic = SegmentReportingEngine.getSegments('geographic');
      expect(geographic).toHaveLength(2);
    });
  });

  describe('reportSegmentData', () => {
    it('should report segment data', () => {
      const seg1 = SegmentReportingEngine.defineSegment(revenueSegment);
      SegmentReportingEngine.reportSegmentData({
        segmentId: seg1.id,
        period: '2024-Q1',
        revenue: 1200000,
        expenses: 800000,
        assets: 5000000,
        liabilities: 2000000,
      });
      const report = SegmentReportingEngine.getSegmentReport('2024-Q1');
      expect(report).toHaveLength(1);
      expect(report![0]!.segment.name).toBe('North America');
      expect(report![0]!.revenue).toBe(1200000);
    });
  });

  describe('getSegmentReport', () => {
    it('should generate segment report for a period', () => {
      const seg1 = SegmentReportingEngine.defineSegment(revenueSegment);
      const seg2 = SegmentReportingEngine.defineSegment(europeSegment);

      SegmentReportingEngine.reportSegmentData({
        segmentId: seg1.id,
        period: '2024-Q1',
        revenue: 5000000,
        expenses: 3500000,
        assets: 10000000,
        liabilities: 4000000,
      });
      SegmentReportingEngine.reportSegmentData({
        segmentId: seg2.id,
        period: '2024-Q1',
        revenue: 3000000,
        expenses: 2200000,
        assets: 6000000,
        liabilities: 2500000,
      });

      const report = SegmentReportingEngine.getSegmentReport('2024-Q1');
      expect(report).toHaveLength(2);
      expect(report![0]!.netIncome).toBe(1500000);
      expect(report![1]!.netIncome).toBe(800000);
    });

    it('should include profit margins', () => {
      const seg = SegmentReportingEngine.defineSegment(revenueSegment);
      SegmentReportingEngine.reportSegmentData({
        segmentId: seg.id,
        period: '2024-Q1',
        revenue: 1000000,
        expenses: 300000,
        assets: 5000000,
        liabilities: 2000000,
      });
      const report = SegmentReportingEngine.getSegmentReport('2024-Q1');
      expect(report![0]!.margin).toBeCloseTo(0.7);
    });
  });

  describe('reset', () => {
    it('should clear all segments and data', () => {
      SegmentReportingEngine.defineSegment(revenueSegment);
      SegmentReportingEngine.reset();
      expect(SegmentReportingEngine.getSegments()).toHaveLength(0);
    });
  });
});
