import { describe, it, expect } from 'vitest';
import { BankingEngine } from './BankingEngine';
import type { GLEntry } from '@/types';

function gl(accountCode: string, amount: number, overrides: Partial<GLEntry> = {}): GLEntry {
  const id = `gl-${accountCode}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    accountId: id,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit: amount,
    credit: 0,
    netChange: amount,
    date: '2026-01-15',
    amount,
    description: '',
    reference: id,
    entityId: 'entity-1',
    currency: 'USD',
    ...overrides,
  };
}

describe('BankingEngine', () => {
  describe('calculateLoanLossStats', () => {
    it('should calculate gross loans from 13xx accounts', () => {
      const entries = [gl('1301', 50000000), gl('1302', 30000000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.grossLoans).toBe(80000000);
    });

    it('should calculate reserve balance from 215x accounts (absolute value)', () => {
      const entries = [gl('2150', -2000000), gl('2151', -500000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.reserveBalance).toBe(2500000);
    });

    it('should calculate NPL balance from 92xx accounts', () => {
      const entries = [gl('9201', 1500000), gl('9202', 500000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.nplBalance).toBe(2000000);
    });

    it('should calculate provision expense from 65xx accounts', () => {
      const entries = [gl('6501', 800000), gl('6502', 200000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.provisionExpense).toBe(1000000);
    });

    it('should calculate NPL ratio as nplBalance / grossLoans * 100', () => {
      const entries = [
        gl('1301', 100000000), // gross loans
        gl('9201', 3000000), // NPL
      ];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.nplRatio).toBe(3);
    });

    it('should return 0 NPL ratio when gross loans is zero', () => {
      const entries = [gl('9201', 3000000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.nplRatio).toBe(0);
    });

    it('should calculate coverage ratio as reserveBalance / nplBalance * 100', () => {
      const entries = [
        gl('2150', -3000000), // reserve
        gl('9201', 2000000), // NPL
      ];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.coverageRatio).toBe(150);
    });

    it('should return 0 coverage ratio when NPL balance is zero', () => {
      const entries = [gl('2150', -3000000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.coverageRatio).toBe(0);
    });

    it('should return netChargeOffs as 0 (placeholder)', () => {
      const entries = [gl('1301', 100000000)];
      const result = BankingEngine.calculateLoanLossStats(entries);
      expect(result.netChargeOffs).toBe(0);
    });

    it('should handle empty entries', () => {
      const result = BankingEngine.calculateLoanLossStats([]);
      expect(result.grossLoans).toBe(0);
      expect(result.reserveBalance).toBe(0);
      expect(result.nplBalance).toBe(0);
      expect(result.nplRatio).toBe(0);
      expect(result.coverageRatio).toBe(0);
      expect(result.netChargeOffs).toBe(0);
      expect(result.provisionExpense).toBe(0);
    });
  });

  describe('calculateCapitalStats', () => {
    it('should calculate CET1 capital from 31xx accounts', () => {
      const entries = [gl('3101', 10000000), gl('3102', 5000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.tier1Capital).toBe(15000000); // CET1 + AT1 (AT1 = 0)
    });

    it('should calculate AT1 capital from 32xx accounts', () => {
      const entries = [gl('3101', 10000000), gl('3201', 3000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.tier1Capital).toBe(13000000); // CET1 + AT1
    });

    it('should calculate Tier 2 capital from 33xx accounts', () => {
      const entries = [gl('3301', 2000000), gl('3302', 1000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.tier2Capital).toBe(3000000);
    });

    it('should calculate total capital as tier1 + tier2', () => {
      const entries = [gl('3101', 10000000), gl('3201', 3000000), gl('3301', 2000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.totalCapital).toBe(15000000);
    });

    it('should calculate RWA with correct risk weights', () => {
      const entries = [
        gl('1101', 10000000), // Cash → 0% weight
        gl('1201', 20000000), // Govt bonds → 0% weight
        gl('1310', 40000000), // Mortgages → 50% weight → 20M
        gl('1320', 30000000), // Corporate → 100% weight → 30M
      ];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.rwa).toBe(50000000); // 0 + 0 + 20M + 30M
    });

    it('should calculate tier1 ratio as tier1Capital / RWA * 100', () => {
      const entries = [
        gl('3101', 10000000), // CET1
        gl('1320', 100000000), // Corporate loans → RWA = 100M
      ];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.tier1Ratio).toBe(10); // 10M / 100M * 100
    });

    it('should calculate total ratio as totalCapital / RWA * 100', () => {
      const entries = [gl('3101', 10000000), gl('3301', 5000000), gl('1320', 100000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.totalRatio).toBe(15); // 15M / 100M * 100
    });

    it('should calculate leverage ratio as tier1Capital / totalAssets * 100', () => {
      const entries = [gl('3101', 10000000), gl('1101', 50000000), gl('1320', 50000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.leverageRatio).toBe(10); // 10M / 100M * 100
    });

    it('should return 0 ratios when RWA is zero', () => {
      const entries = [gl('3101', 10000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.tier1Ratio).toBe(0);
      expect(result.totalRatio).toBe(0);
    });

    it('should return 0 leverage ratio when total assets is zero', () => {
      const entries = [gl('3101', 10000000)];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.leverageRatio).toBe(0);
    });

    it('should generate trend data from monthly entries', () => {
      const entries = [
        gl('3101', 10000000, { date: '2026-01-15' }),
        gl('1320', 100000000, { date: '2026-01-15' }),
        gl('3101', 12000000, { date: '2026-02-15' }),
        gl('1320', 100000000, { date: '2026-02-15' }),
      ];
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.trendData).toHaveLength(2);
      expect(result.trendData[0].name).toBe('2026-01');
      expect(result.trendData[0].tier1).toBe(10);
      expect(result.trendData[1].name).toBe('2026-02');
      expect(result.trendData[1].tier1).toBe(12);
    });

    it('should limit trend data to last 4 periods', () => {
      const entries = Array.from({ length: 6 }, (_, i) => [
        gl('3101', 10000000, { date: `2026-${String(i + 1).padStart(2, '0')}-15` }),
        gl('1320', 100000000, { date: `2026-${String(i + 1).padStart(2, '0')}-15` }),
      ]).flat();
      const result = BankingEngine.calculateCapitalStats(entries);
      expect(result.trendData).toHaveLength(4);
    });

    it('should handle empty entries', () => {
      const result = BankingEngine.calculateCapitalStats([]);
      expect(result.tier1Capital).toBe(0);
      expect(result.totalCapital).toBe(0);
      expect(result.rwa).toBe(0);
      expect(result.trendData).toHaveLength(0);
    });
  });

  describe('calculateNIMStats', () => {
    it('should calculate interest income from 41xx accounts', () => {
      const entries = [gl('4101', 5000000), gl('4102', 2000000)];
      const result = BankingEngine.calculateNIMStats(entries);
      expect(result.interestIncome).toBe(7000000);
    });

    it('should calculate interest expense from 61xx accounts (absolute value)', () => {
      const entries = [gl('6101', -3000000), gl('6102', -1000000)];
      const result = BankingEngine.calculateNIMStats(entries);
      expect(result.interestExpense).toBe(4000000);
    });

    it('should calculate net interest income', () => {
      const entries = [gl('4101', 7000000), gl('6101', -3000000)];
      const result = BankingEngine.calculateNIMStats(entries);
      expect(result.netInterestMargin).toBe(4000000);
    });

    it('should calculate NIM as (interestInc - interestExp) * 12 / avgEarningAssets * 100', () => {
      const entries = [
        gl('4101', 500000), // interest income
        gl('6101', -200000), // interest expense
        gl('1101', 10000000), // earning assets
      ];
      const result = BankingEngine.calculateNIMStats(entries);
      // NIM = (500000 - 200000) * 12 / 10000000 * 100 = 36%
      expect(result.netInterestMargin).toBeCloseTo(36, 0);
    });

    it('should calculate yield on assets', () => {
      const entries = [gl('4101', 500000), gl('1101', 10000000)];
      const result = BankingEngine.calculateNIMStats(entries);
      // yield = 500000 * 12 / 10000000 * 100 = 60%
      expect(result.yieldOnAssets).toBeCloseTo(60, 0);
    });

    it('should calculate cost of funds', () => {
      const entries = [
        gl('6101', -300000),
        gl('2101', -10000000), // liabilities
      ];
      const result = BankingEngine.calculateNIMStats(entries);
      // cost = 300000 * 12 / 10000000 * 100 = 36%
      expect(result.costOfFunds).toBeCloseTo(36, 0);
    });

    it('should return 0 NIM when earning assets is zero', () => {
      const entries = [gl('4101', 500000), gl('6101', -200000)];
      const result = BankingEngine.calculateNIMStats(entries);
      expect(result.netInterestMargin).toBe(0);
    });

    it('should include trend data', () => {
      const entries = [gl('4101', 500000)];
      const result = BankingEngine.calculateNIMStats(entries);
      expect(result.trend).toEqual([3.12, 3.18, 3.25, 3.31]);
    });

    it('should handle empty entries', () => {
      const result = BankingEngine.calculateNIMStats([]);
      expect(result.interestIncome).toBe(0);
      expect(result.interestExpense).toBe(0);
      expect(result.netInterestMargin).toBe(0);
      expect(result.netInterestMargin).toBe(0);
    });
  });
});
