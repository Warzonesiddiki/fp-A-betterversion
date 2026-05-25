/**
 * Tests for ManufacturingEngine
 * Covers: calculateStats, getProductionData, getEfficiencyTrend
 */
import { describe, it, expect } from 'vitest';
import { ManufacturingEngine } from './ManufacturingEngine';
import type { GLEntry } from '@/types';

function gl(
  accountCode: string,
  debit: number,
  credit: number,
  amount: number,
  description: string,
  period: string,
  overrides: Partial<GLEntry> = {}
): GLEntry {
  return {
    id: `mock-${period}-${accountCode}`,
    accountId: accountCode,
    accountCode,
    accountName: description,
    debit,
    credit,
    amount,
    netChange: debit - credit,
    description,
    date: period,
    period,
    periodName: period,
    reference: '',
    ...overrides,
  };
}

describe('ManufacturingEngine', () => {
  const mockEntries = [
    gl('4700', 0, 800000, 800000, 'Sales', '2024-01'),
    gl('5700', 200000, 0, 200000, 'Materials', '2024-01'),
    gl('5800', 150000, 0, 150000, 'Direct labor', '2024-01'),
    gl('5900', 100000, 0, 100000, 'Overhead', '2024-01'),
    gl('4700', 0, 900000, 900000, 'Sales', '2024-02'),
    gl('5700', 220000, 0, 220000, 'Materials', '2024-02'),
    gl('5800', 160000, 0, 160000, 'Direct labor', '2024-02'),
    gl('5900', 110000, 0, 110000, 'Overhead', '2024-02'),
  ];

  describe('calculateStats', () => {
    it('should calculate manufacturing statistics', () => {
      const stats = ManufacturingEngine.calculateStats(mockEntries);
      expect(stats.revenue).toBe(1700000); // 800k + 900k
      expect(stats.cogs).toBe(940000); // 200+150+100+220+160+110
      expect(stats.revenue - stats.cogs).toBe(760000);
      expect(stats.grossMargin).toBeCloseTo((760000 / 1700000) * 100);
    });

    it('should handle empty entries', () => {
      const stats = ManufacturingEngine.calculateStats([]);
      expect(stats.revenue).toBe(0);
      expect(stats.cogs).toBe(0);
    });
  });

  describe('getProductionLines', () => {
    it('should return production breakdown by account', () => {
      const data = ManufacturingEngine.getProductionLines(mockEntries);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('getOutputTrend', () => {
    it('should return monthly output trend', () => {
      const trend = ManufacturingEngine.getOutputTrend(mockEntries);
      expect(trend.length).toBeGreaterThan(0);
      expect(trend[0]).toHaveProperty('month');
      expect(trend[0]).toHaveProperty('output');
    });
  });
});
