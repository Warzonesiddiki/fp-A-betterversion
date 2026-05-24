/**
 * Tests for InsuranceEngine
 * Covers: calculateStats
 */
import { describe, it, expect } from 'vitest';
import { InsuranceEngine } from './InsuranceEngine';
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

describe('InsuranceEngine', () => {
  const mockEntries = [
    gl('4100', 0, 500000, 500000, 'Premium income', '2024-01'),
    gl('4200', 0, 200000, 200000, 'Earned premium', '2024-01'),
    gl('5100', 150000, 0, 150000, 'Claims paid', '2024-01'),
    gl('5200', 50000, 0, 50000, 'Commissions', '2024-01'),
    gl('4100', 0, 450000, 450000, 'Premium income', '2024-02'),
    gl('5100', 100000, 0, 100000, 'Claims paid', '2024-02'),
  ];

  describe('calculateStats', () => {
    it('should calculate insurance statistics', () => {
      const stats = InsuranceEngine.calculateStats(mockEntries);
      expect(stats.grossWrittenPremium).toBe(950000); // 500k + 450k
      expect(stats.lossExpense).toBe(250000); // 150k + 100k
      expect(stats.expenseTotal).toBe(50000);
      expect(stats.lossRatio).toBeCloseTo(250000 / 950000);
    });

    it('should handle empty entries', () => {
      const stats = InsuranceEngine.calculateStats([]);
      expect(stats.grossWrittenPremium).toBe(0);
      expect(stats.lossExpense).toBe(0);
    });

    it('should include combined ratio', () => {
      const stats = InsuranceEngine.calculateStats(mockEntries);
      expect(stats.combinedRatio).toBeDefined();
    });
  });
});
