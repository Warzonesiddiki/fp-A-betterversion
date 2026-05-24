/**
 * Tests for ConstructionEngine
 * Covers: calculateStats, getProjectData, getBacklogTrend
 */
import { describe, it, expect } from 'vitest';
import { ConstructionEngine } from './ConstructionEngine';
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

describe('ConstructionEngine', () => {
  const mockEntries = [
    gl('4500', 0, 500000, 500000, 'Contract revenue', '2024-01'),
    gl('4500', 0, 300000, 300000, 'Contract revenue', '2024-02'),
    gl('4510', 0, 200000, 200000, 'Change order', '2024-01'),
    gl('5600', 200000, 0, 200000, 'Materials', '2024-01'),
    gl('5610', 150000, 0, 150000, 'Subcontractor', '2024-01'),
    gl('5620', 100000, 0, 100000, 'Labor', '2024-01'),
    gl('1300', 600000, 0, 600000, 'CIP', '2024-01'),
  ];

  describe('calculateStats', () => {
    it('should calculate construction statistics', () => {
      const stats = ConstructionEngine.calculateStats(mockEntries);
      expect(stats.revenueYTD).toBe(1000000); // 500k + 300k + 200k
      expect(stats.avgGrossMargin).toBeGreaterThan(0);
    });

    it('should handle empty entries', () => {
      const stats = ConstructionEngine.calculateStats([]);
      expect(stats.revenueYTD).toBe(0);
    });
  });

  describe('getProjectPortfolio', () => {
    it('should return project breakdown', () => {
      const projects = ConstructionEngine.getProjectPortfolio(mockEntries);
      expect(Array.isArray(projects)).toBe(true);
    });
  });

  describe('getBacklogTrend', () => {
    it('should return backlog trend data', () => {
      const trend = ConstructionEngine.getBacklogTrend(mockEntries);
      expect(Array.isArray(trend)).toBe(true);
    });
  });
});
