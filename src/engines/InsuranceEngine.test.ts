/**
 * Tests for InsuranceEngine
 * Covers: calculateStats, getPremiumByLine, getCombinedRatioTrend
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
    gl('4101', 0, 500000, 500000, 'Auto Premium income', '2024-01'),
    gl('4201', 0, 200000, 200000, 'Auto Earned premium', '2024-01'),
    gl('4102', 0, 300000, 300000, 'Homeowners Premium', '2024-01'),
    gl('4202', 0, 150000, 150000, 'Homeowners Earned', '2024-01'),
    gl('5100', 150000, 0, 150000, 'Claims paid', '2024-01'),
    gl('5200', 50000, 0, 50000, 'Commissions', '2024-01'),
    gl('5300', 30000, 0, 30000, 'Underwriting expenses', '2024-01'),
    gl('4100', 0, 450000, 450000, 'Premium income', '2024-02'),
    gl('5100', 100000, 0, 100000, 'Claims paid', '2024-02'),
  ];

  describe('calculateStats', () => {
    it('should calculate insurance statistics and ratios accurately', () => {
      const stats = InsuranceEngine.calculateStats(mockEntries);
      expect(stats.grossWrittenPremium).toBe(1250000);
      expect(stats.netWrittenPremium).toBe(1250000 * 0.85);
      expect(stats.lossExpense).toBe(250000);
      expect(stats.expenseTotal).toBe(80000);
      expect(stats.lossRatio).toBeCloseTo((250000 / 350000) * 100, 2);
      expect(stats.combinedRatio).toBe(stats.lossRatio + stats.expenseRatio);
      expect(stats.policyCount).toBeGreaterThan(0);
      expect(stats.underwritingIncome).toBe(350000 - 250000 - 80000);
    });

    it('should handle empty entries safely without divide-by-zero crashes', () => {
      const stats = InsuranceEngine.calculateStats([]);
      expect(stats.grossWrittenPremium).toBe(0);
      expect(stats.lossExpense).toBe(0);
      expect(stats.lossRatio).toBe(0);
      expect(stats.expenseRatio).toBe(0);
      expect(stats.combinedRatio).toBe(0);
      expect(stats.policyCount).toBe(0);
    });
  });

  describe('getPremiumByLine', () => {
    it('breaks down premium by insurance line suffix (Auto, Homeowners, Life, etc.)', () => {
      const lines = InsuranceEngine.getPremiumByLine(mockEntries);
      expect(lines.length).toBeGreaterThanOrEqual(2);

      const auto = lines.find((l) => l.name === 'Auto');
      expect(auto).toBeDefined();
      expect(auto?.written).toBe(500000);
      expect(auto?.earned).toBe(200000);
      expect(auto?.color).toBeDefined();

      const home = lines.find((l) => l.name === 'Homeowners');
      expect(home?.written).toBe(300000);
      expect(home?.earned).toBe(150000);
    });
  });

  describe('getCombinedRatioTrend', () => {
    it('generates a 6-month deterministic combined ratio trend', () => {
      const trend = InsuranceEngine.getCombinedRatioTrend(mockEntries);
      expect(trend).toHaveLength(6);
      expect(trend[0]!.month).toBe('Jan');
      expect(trend[0]!.combined).toBeGreaterThan(0);
      expect(trend[5]!.month).toBe('Jun');
    });
  });
});
