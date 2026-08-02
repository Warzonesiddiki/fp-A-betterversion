/**
 * GAP-1 (F-0006) known-answer tests for BankingEngine's money migration.
 *
 * These are Basel III capital-adequacy and loan-loss figures — regulatory
 * reporting outputs where a sub-cent discrepancy is a reportable defect, not a
 * rounding nicety. Every case is a FIXED input -> EXACT expected decimal,
 * asserted with `toBe` (Object.is) because `toBeCloseTo` cannot detect the
 * drift these tests exist to prevent. Where the pre-migration float code
 * produced a different literal, that literal is recorded inline.
 */
import { describe, it, expect } from 'vitest';
import { BankingEngine } from './BankingEngine';
import type { GLEntry } from '@/types';

/** Minimal GLEntry factory — the engine reads accountCode, amount and date. */
function entry(accountCode: string, amount: number, id: string, date = '2026-01-31'): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: date.substring(0, 7),
    periodName: date.substring(0, 7),
    debit: 0,
    credit: 0,
    netChange: 0,
    date,
    amount,
    description: 'known-answer fixture',
    reference: id,
  };
}

describe('BankingEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('calculateLoanLossStats', () => {
    it('sums cent-level loan balances exactly (float gave 300.29999999999995)', () => {
      const stats = BankingEngine.calculateLoanLossStats([
        entry('1300', 100.1, 'l1'),
        entry('1300', 200.2, 'l2'),
      ]);
      // Raw float: 100.10 + 200.20 === 300.29999999999995
      expect(stats.grossLoans).toBe(300.3);
    });

    it('computes the NPL ratio from exact decimals', () => {
      const stats = BankingEngine.calculateLoanLossStats([
        entry('1300', 1000.1, 'l1'),
        entry('9200', 50.05, 'npl1'),
      ]);
      expect(stats.nplBalance).toBe(50.05);
      expect(stats.nplRatio).toBe(5.00449955);
    });

    it('computes the coverage ratio from exact decimals', () => {
      const stats = BankingEngine.calculateLoanLossStats([
        entry('2150', -0.3, 'acl1'),
        entry('9200', 0.1, 'npl1'),
      ]);
      // reserve 0.30 / npl 0.10 = 300%. Float 0.3/0.1 === 2.9999999999999996 -> 299.99999999999994
      expect(stats.reserveBalance).toBe(0.3);
      expect(stats.coverageRatio).toBe(300);
    });

    it('returns zero ratios instead of NaN or Infinity when there are no loans', () => {
      const stats = BankingEngine.calculateLoanLossStats([]);
      expect(stats.grossLoans).toBe(0);
      expect(stats.nplRatio).toBe(0);
      expect(stats.coverageRatio).toBe(0);
      expect(Number.isFinite(stats.nplRatio)).toBe(true);
    });

    it('takes the absolute value of the contra-asset allowance balance', () => {
      const stats = BankingEngine.calculateLoanLossStats([entry('2150', -1234.56, 'acl1')]);
      expect(stats.reserveBalance).toBe(1234.56);
    });

    it('sums provision expense exactly across many small postings', () => {
      const stats = BankingEngine.calculateLoanLossStats([
        entry('6500', 0.1, 'p1'),
        entry('6500', 0.1, 'p2'),
        entry('6500', 0.1, 'p3'),
      ]);
      // Float: 0.1 + 0.1 + 0.1 === 0.30000000000000004
      expect(stats.provisionExpense).toBe(0.3);
    });
  });

  describe('calculateCapitalStats', () => {
    it('adds CET1 and AT1 into Tier 1 exactly (float gave 300.29999999999995)', () => {
      const stats = BankingEngine.calculateCapitalStats([
        entry('3100', 100.1, 'cet1'),
        entry('3200', 200.2, 'at1'),
      ]);
      expect(stats.tier1Capital).toBe(300.3);
    });

    it('applies the 50% mortgage risk weight exactly', () => {
      const stats = BankingEngine.calculateCapitalStats([entry('1310', 1000.05, 'mtg')]);
      // 1000.05 * 0.5 = 500.025 -> 500.03 at cent precision (ROUND_HALF_UP)
      expect(stats.rwa).toBe(500.03);
    });

    it('applies a 0% risk weight to cash and government bonds', () => {
      const stats = BankingEngine.calculateCapitalStats([
        entry('1100', 5000.55, 'cash'),
        entry('1200', 4000.44, 'govt'),
      ]);
      expect(stats.rwa).toBe(0);
      // Assets still count toward the leverage denominator.
      expect(stats.leverageRatio).toBe(0);
    });

    it('applies the 100% default weight to corporate loans', () => {
      const stats = BankingEngine.calculateCapitalStats([entry('1320', 750.25, 'corp')]);
      expect(stats.rwa).toBe(750.25);
    });

    it('computes the Tier 1 capital ratio from exact decimals', () => {
      const stats = BankingEngine.calculateCapitalStats([
        entry('3100', 100.1, 'cet1'),
        entry('3200', 200.2, 'at1'),
        entry('1310', 1000.05, 'mtg'),
      ]);
      // tier1 300.30 / rwa 500.025 * 100
      expect(stats.tier1Ratio).toBe(60.0569971501);
    });

    it('rolls Tier 2 into total capital exactly', () => {
      const stats = BankingEngine.calculateCapitalStats([
        entry('3100', 0.1, 'cet1'),
        entry('3200', 0.1, 'at1'),
        entry('3300', 0.1, 't2'),
      ]);
      expect(stats.tier1Capital).toBe(0.2);
      expect(stats.tier2Capital).toBe(0.1);
      // Float: 0.1 + 0.1 + 0.1 === 0.30000000000000004
      expect(stats.totalCapital).toBe(0.3);
    });

    it('returns zero ratios rather than Infinity when RWA is zero', () => {
      const stats = BankingEngine.calculateCapitalStats([entry('3100', 1000, 'cet1')]);
      expect(stats.rwa).toBe(0);
      expect(stats.tier1Ratio).toBe(0);
      expect(stats.totalRatio).toBe(0);
      expect(Number.isFinite(stats.tier1Ratio)).toBe(true);
    });

    it('produces per-period trend ratios from exact decimals', () => {
      const stats = BankingEngine.calculateCapitalStats([
        entry('3100', 100.1, 'c1', '2026-01-31'),
        entry('3200', 200.2, 'a1', '2026-01-31'),
        entry('1310', 1000.05, 'm1', '2026-01-31'),
      ]);
      expect(stats.trendData).toHaveLength(1);
      expect(stats.trendData[0]!.name).toBe('2026-01');
      expect(stats.trendData[0]!.tier1).toBe(60.0569971501);
    });

    it('keeps at most the last four periods of trend data', () => {
      const months = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
      const stats = BankingEngine.calculateCapitalStats(
        months.map((m, i) => entry('3100', 100, `c${i}`, `${m}-15`))
      );
      expect(stats.trendData).toHaveLength(4);
      expect(stats.trendData[0]!.name).toBe('2025-11');
    });
  });

  describe('calculateNIMStats', () => {
    it('computes the annualised net interest margin from exact decimals', () => {
      const stats = BankingEngine.calculateNIMStats([
        entry('4100', 100.1, 'ii'),
        entry('6100', -50.05, 'ie'),
        entry('1300', 1000.1, 'ea'),
      ]);
      expect(stats.interestIncome).toBe(100.1);
      expect(stats.interestExpense).toBe(50.05);
      expect(stats.netInterestMargin).toBe(60.0539946005);
    });

    it('computes yield on assets from exact decimals', () => {
      const stats = BankingEngine.calculateNIMStats([
        entry('4100', 100.1, 'ii'),
        entry('1300', 1000.1, 'ea'),
      ]);
      expect(stats.yieldOnAssets).toBe(120.1079892011);
    });

    it('computes cost of funds against absolute liability balances', () => {
      const stats = BankingEngine.calculateNIMStats([
        entry('6100', -100.1, 'ie'),
        entry('2100', -1000.1, 'liab'),
      ]);
      expect(stats.costOfFunds).toBe(120.1079892011);
    });

    it('returns zero margins rather than Infinity when there are no earning assets', () => {
      const stats = BankingEngine.calculateNIMStats([entry('4100', 500, 'ii')]);
      expect(stats.earningAssets).toBe(0);
      expect(stats.netInterestMargin).toBe(0);
      expect(stats.yieldOnAssets).toBe(0);
      expect(Number.isFinite(stats.netInterestMargin)).toBe(true);
    });
  });
});
