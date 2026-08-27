/**
 * Tests for EnergyEngine
 * Covers: calculateStats, getSourceProduction, getRevenueTrend
 */
import { describe, it, expect } from 'vitest';
import { EnergyEngine } from './EnergyEngine';
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

describe('EnergyEngine', () => {
  const mockEntries = [
    gl('4300', 0, 500000, 500000, 'Electricity sales', '2024-01'),
    gl('4310', 0, 200000, 200000, 'Gas sales', '2024-01'),
    gl('4320', 0, 100000, 100000, 'Renewable energy credits', '2024-01'),
    gl('5400', 150000, 0, 150000, 'Fuel costs', '2024-01'),
    gl('5510', 100000, 0, 100000, 'Maintenance', '2024-01'),
    gl('4300', 0, 550000, 550000, 'Electricity sales', '2024-02'),
    gl('4310', 0, 180000, 180000, 'Gas sales', '2024-02'),
  ];

  describe('calculateStats', () => {
    it('should calculate energy statistics', () => {
      const stats = EnergyEngine.calculateStats(mockEntries);
      expect(stats.totalRevenue).toBe(1530000); // 500k+200k+100k+550k+180k
      expect(stats.operatingCost).toBe(250000); // 150k+100k
    });

    it('should handle empty entries', () => {
      const stats = EnergyEngine.calculateStats([]);
      expect(stats.totalRevenue).toBe(0);
      expect(stats.operatingCost).toBe(0);
    });
  });

  describe('getProductionBySource', () => {
    it('should break down by energy source', () => {
      const sources = EnergyEngine.getProductionBySource(mockEntries);
      expect(Array.isArray(sources)).toBe(true);
    });
  });

  describe('getRevenueTrend', () => {
    it('should return monthly revenue trend computed from entries', () => {
      const trend = EnergyEngine.getRevenueTrend(mockEntries);
      expect(trend.length).toBe(2);
      expect(trend[0]!.month).toBe('2024-01');
      expect(trend[0]!.revenue).toBe(800000);
      expect(trend[0]!.cost).toBe(250000);
      expect(trend[1]!.month).toBe('2024-02');
      expect(trend[1]!.revenue).toBe(730000);
      expect(trend[1]!.cost).toBe(0);
    });

    it('returns empty array when entries are empty', () => {
      expect(EnergyEngine.getRevenueTrend([])).toEqual([]);
    });
  });
});
