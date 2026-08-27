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

    it('computes each account-class total and derived metrics exactly', () => {
      const stats = ConstructionEngine.calculateStats(mockEntries);
      // costs 56xx: 200k + 150k + 100k = 450k; wip 13xx: 600k; billings 46xx: 0.
      // avgGrossMargin = (1,000,000 - 450,000) / 1,000,000 * 100 = 55.
      expect(stats.avgGrossMargin).toBe(55);
      expect(stats.wipValue).toBe(600000);
      expect(stats.billings).toBe(0);
      // overUnderBilled = billings - wipValue = -600,000.
      expect(stats.overUnderBilled).toBe(-600000);
      // totalBacklog = wip + revenue*1.5 = 600,000 + 1,500,000 = 2,100,000.
      expect(stats.totalBacklog).toBe(2100000);
    });

    it('sums fractional GL amounts without IEEE-754 drift', () => {
      const centEntries = [
        gl('4500', 0, 0.1, 0.1, 'rev a', '2024-01'),
        gl('4500', 0, 0.2, 0.2, 'rev b', '2024-01'),
        gl('5600', 0.3, 0, 0.3, 'cost', '2024-01'),
      ];
      const stats = ConstructionEngine.calculateStats(centEntries);
      // 0.1 + 0.2 must be exactly 0.30, and margin (0.30-0.30)/0.30 = 0%.
      expect(stats.revenueYTD).toBe(0.3);
      expect(stats.avgGrossMargin).toBe(0);
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

    it('known-answer: formats budget (millions, 1dp) and margin via the money primitive', () => {
      // mockEntries: revenue 1,000,000 (45xx), costs 450,000 (56xx) under 'default'.
      // budget = $1.0M; margin = (1,000,000 - 450,000)/1,000,000*100 = 55.0%.
      const [project] = ConstructionEngine.getProjectPortfolio(mockEntries);
      expect(project.budget).toBe('$1.0M');
      expect(project.margin).toBe('55.0%');
    });
  });

  describe('getBacklogTrend', () => {
    it('should return backlog trend data computed from entries', () => {
      const trend = ConstructionEngine.getBacklogTrend(mockEntries);
      expect(Array.isArray(trend)).toBe(true);
      expect(trend.length).toBe(2);
      expect(trend[0]!.month).toBe('2024-01');
      expect(trend[0]!.revenue).toBe(700000);
      expect(trend[1]!.month).toBe('2024-02');
      expect(trend[1]!.revenue).toBe(300000);
    });

    it('returns empty array when entries are empty', () => {
      expect(ConstructionEngine.getBacklogTrend([])).toEqual([]);
    });
  });
});
