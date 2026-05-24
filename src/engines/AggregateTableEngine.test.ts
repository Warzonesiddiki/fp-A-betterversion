/**
 * Tests for AggregateTableEngine
 * Covers: aggregate, query, queryRange, invalidate, getStats, rollupPeriod
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AggregateTableEngine } from './AggregateTableEngine';

describe('AggregateTableEngine', () => {
  beforeEach(() => {
    AggregateTableEngine.invalidate(); // clear all
  });

  const sampleData = [
    { entityId: 'E1', accountId: 'A1', period: '2024-01', debit: 1000, credit: 200 },
    { entityId: 'E1', accountId: 'A1', period: '2024-02', debit: 1500, credit: 300 },
    { entityId: 'E1', accountId: 'A2', period: '2024-01', debit: 500, credit: 100 },
    { entityId: 'E2', accountId: 'A1', period: '2024-01', debit: 800, credit: 150 },
  ];

  describe('aggregate', () => {
    it('should aggregate monthly data', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      const entry = AggregateTableEngine.query('E1', 'A1', '2024-01', 'monthly');
      expect(entry).toBeDefined();
      expect(entry?.debit).toBe(1000);
      expect(entry?.credit).toBe(200);
      expect(entry?.net).toBe(800);
    });

    it('should aggregate quarterly data', () => {
      AggregateTableEngine.aggregate(sampleData, 'quarterly');
      const entry = AggregateTableEngine.query('E1', 'A1', '2024-Q1', 'quarterly');
      expect(entry).toBeDefined();
      expect(entry?.debit).toBe(2500); // 1000 + 1500
      expect(entry?.count).toBe(2);
    });

    it('should aggregate yearly data', () => {
      AggregateTableEngine.aggregate(sampleData, 'yearly');
      const entry = AggregateTableEngine.query('E1', 'A1', '2024', 'yearly');
      expect(entry).toBeDefined();
      expect(entry?.debit).toBe(2500);
    });

    it('should aggregate YTD data', () => {
      AggregateTableEngine.aggregate(sampleData, 'ytd');
      const entry = AggregateTableEngine.query('E1', 'A1', '2024-YTD', 'ytd');
      expect(entry).toBeDefined();
    });
  });

  describe('query', () => {
    it('should return undefined for missing key', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      const entry = AggregateTableEngine.query('E1', 'A1', '2024-03', 'monthly');
      expect(entry).toBeUndefined();
    });

    it('should query aggregated entries', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      const entry = AggregateTableEngine.query('E2', 'A1', '2024-01', 'monthly');
      expect(entry).toBeDefined();
      expect(entry?.debit).toBe(800);
    });
  });

  describe('queryRange', () => {
    it('should query entries in date range', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      const entries = AggregateTableEngine.queryRange('E1', 'A1', '2024-01', '2024-02', 'monthly');
      expect(entries).toHaveLength(2);
    });
  });

  describe('invalidate', () => {
    it('should clear all entries when no args', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      AggregateTableEngine.invalidate();
      const entry = AggregateTableEngine.query('E1', 'A1', '2024-01', 'monthly');
      expect(entry).toBeUndefined();
    });

    it('should invalidate by entityId', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      AggregateTableEngine.invalidate('E2');
      expect(AggregateTableEngine.query('E2', 'A1', '2024-01', 'monthly')).toBeUndefined();
      expect(AggregateTableEngine.query('E1', 'A1', '2024-01', 'monthly')).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return stats', () => {
      AggregateTableEngine.aggregate(sampleData, 'monthly');
      const stats = AggregateTableEngine.getStats();
      expect(stats.totalEntries).toBe(4);
      expect(stats.dirtyKeys).toBe(0);
      expect(stats.memoryEstimateKB).toBeGreaterThanOrEqual(0);
    });
  });
});
