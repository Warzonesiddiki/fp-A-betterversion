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
      expect(stats.lossExpense).toBe(250000);
      expect(stats.expenseTotal).toBe(80000);
      expect(stats.lossRatio).toBeCloseTo((250000 / 350000) * 100, 2);
      // Decimal addition of the two ratios: 71.43 + 6.40 = 77.83. Adding them
      // as JS floats in this assertion gives 77.83000000000001 — which is the
      // whole point of routing the engine through decimal.js.
      expect(stats.combinedRatio).toBe(77.83);
      expect(stats.lossRatio! + stats.expenseRatio!).not.toBe(stats.combinedRatio);
      expect(stats.underwritingIncome).toBe(350000 - 250000 - 80000);
    });

    it('reports net written premium only when a cession is posted', () => {
      // The previous assertion here was `netWrittenPremium === 1250000 * 0.85`
      // — a green test pinning an invented 15% reinsurance cession applied to
      // every book. Net written now requires posted 43xx activity.
      const stats = InsuranceEngine.calculateStats(mockEntries);
      expect(stats.netWrittenPremium).toBeNull();
      expect(stats.cededPremium).toBeNull();

      const withCession = [
        ...mockEntries,
        gl('4300', 250000, 0, 250000, 'Reinsurance ceded', '2024-01'),
      ];
      const ceded = InsuranceEngine.calculateStats(withCession);
      expect(ceded.cededPremium).toBe(250000);
      expect(ceded.netWrittenPremium).toBe(1000000);
    });

    it('never derives a policy count from an average premium', () => {
      // Was Math.round(grossWrittenPremium / 360), commented "Industry average".
      expect(InsuranceEngine.calculateStats(mockEntries).policyCount).toBeNull();
    });

    it('nets contra entries instead of absolute-valuing them', () => {
      const withRefund = [
        ...mockEntries,
        gl('4100', 100000, 0, -100000, 'Premium refund', '2024-02'),
      ];
      // Math.abs per entry gave 1,350,000; netting gives 1,150,000.
      expect(InsuranceEngine.calculateStats(withRefund).grossWrittenPremium).toBe(1150000);
    });

    it('should handle empty entries safely without divide-by-zero crashes', () => {
      const stats = InsuranceEngine.calculateStats([]);
      expect(stats.grossWrittenPremium).toBe(0);
      expect(stats.lossExpense).toBe(0);
      // A ratio with no denominator is unavailable, not zero.
      expect(stats.lossRatio).toBeNull();
      expect(stats.expenseRatio).toBeNull();
      expect(stats.combinedRatio).toBeNull();
      expect(stats.policyCount).toBeNull();
      expect(stats.netWrittenPremium).toBeNull();
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
    it('derives the trend from posted periods, not from seeded noise', () => {
      // This previously asserted six months of Jan–Jun, which the engine
      // produced by ignoring its argument entirely and returning
      // `58 + sin(i * 9301 + 49297) * 8` loss ratios.
      const trend = InsuranceEngine.getCombinedRatioTrend(mockEntries);
      expect(trend.map((t) => t.month)).toEqual(['2024-01']);
      // 2024-01: loss 150,000 over earned 350,000 = 42.86%
      expect(trend[0]!.lossRatio).toBeCloseTo(42.86, 1);
      // expenses 80,000 over written 800,000 = 10.00%
      expect(trend[0]!.expenseRatio).toBeCloseTo(10, 1);
      expect(trend[0]!.combined).toBeCloseTo(52.86, 1);
    });

    it('drops a period with no earned premium rather than inventing a point', () => {
      // 2024-02 in the fixture posts written premium and a claim but no earned
      // premium, so it has no loss ratio to plot.
      const trend = InsuranceEngine.getCombinedRatioTrend(mockEntries);
      expect(trend.find((t) => t.month === '2024-02')).toBeUndefined();
    });

    it('returns nothing for an empty ledger', () => {
      expect(InsuranceEngine.getCombinedRatioTrend([])).toEqual([]);
    });
  });
});
