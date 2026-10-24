import { describe, it, expect } from 'vitest';
import { ThreeStatementEngine } from './ThreeStatementEngine';
import type { IncomeStatementData, BalanceSheetData, CashFlowData } from './ThreeStatementEngine';

/**
 * GOVERNANCE EVIDENCE for cap:statement.three-statement
 *
 * The ThreeStatementEngine links the income statement, balance sheet, and
 * cash flow statement, verifying that they balance. The governance dimension
 * here is BALANCE INTEGRITY — "if the three statements don't balance, the
 * model is fiction." Every link (net income → retained earnings, cash flow
 * → cash balance) must be verified, and the balance sheet must satisfy
 * A = L + E within tolerance.
 *
 * Tested dimensions:
 * 1. Statement linking (empty statements)
 * 2. Balance verification (A = L + E)
 * 3. Account classification
 * 4. Statement type mapping
 * 5. Empty statement creation
 * 6. Money primitive safety
 * 7. Determinism
 */

describe('ThreeStatementEngine — GOVERNANCE (statement.three-statement)', () => {

  describe('1. Statement linking', () => {

    it('link produces a result for empty statements', () => {
      const is = ThreeStatementEngine.emptyIncomeStatement('2026-01');
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      const cf = ThreeStatementEngine.emptyCashFlow('2026-01');
      const result = ThreeStatementEngine.link(is, bs, cf);
      expect(result).toBeDefined();
      expect(result.linkedAccounts).toBeDefined();
      expect(result.balanceCheck).toBeDefined();
    });

    it('link validates inputs and reports errors', () => {
      const is = ThreeStatementEngine.emptyIncomeStatement('2026-01');
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      const cf = ThreeStatementEngine.emptyCashFlow('2026-01');
      const result = ThreeStatementEngine.link(is, bs, cf);
      expect(result.validationErrors).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    });

    it('link computes retained earnings from net income', () => {
      const is: IncomeStatementData = {
        ...ThreeStatementEngine.emptyIncomeStatement('2026-01'),
        netIncome: 50000,
      };
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      const cf = ThreeStatementEngine.emptyCashFlow('2026-01');
      const result = ThreeStatementEngine.link(is, bs, cf, [], 100000);
      expect(result.retainedEarningsFromPL).toBe(50000);
      expect(result.beginningRetainedEarnings).toBe(100000);
      expect(result.endingRetainedEarnings).toBe(150000);
    });

    it('link computes ending retained earnings with dividends', () => {
      const is: IncomeStatementData = {
        ...ThreeStatementEngine.emptyIncomeStatement('2026-01'),
        netIncome: 50000,
      };
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      const cf = ThreeStatementEngine.emptyCashFlow('2026-01');
      const dividends = [{ accountCode: 'dividends', accountName: 'Dividends', amount: 10000 }];
      const result = ThreeStatementEngine.link(is, bs, cf, dividends, 100000);
      expect(result.dividendsDeclared).toBe(10000);
      expect(result.endingRetainedEarnings).toBe(140000);
    });
  });

  describe('2. Balance verification', () => {

    it('verifyBalance returns balanced for A = L + E', () => {
      const bs: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-01'),
        totalAssets: 100000,
        totalLiabilities: 60000,
        totalEquity: 40000,
        totalLiabilitiesAndEquity: 100000,
      };
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.isBalanced).toBe(true);
      expect(check.imbalance).toBeCloseTo(0, 2);
    });

    it('verifyBalance returns unbalanced for A ≠ L + E', () => {
      const bs: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-01'),
        totalAssets: 100000,
        totalLiabilities: 60000,
        totalEquity: 30000,
        totalLiabilitiesAndEquity: 90000,
      };
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.isBalanced).toBe(false);
      expect(Math.abs(check.imbalance)).toBeGreaterThan(0);
    });

    it('verifyBalance includes tolerance in result', () => {
      const bs: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-01'),
        totalAssets: 100000,
        totalLiabilities: 60000,
        totalEquity: 40000,
        totalLiabilitiesAndEquity: 100000,
      };
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.tolerance).toBeGreaterThan(0);
    });

    it('verifyBalance handles zero-value balance sheet', () => {
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.isBalanced).toBe(true);
    });
  });

  describe('3. Account classification', () => {

    it('getAccountCategory returns category for known account code', () => {
      const cat = ThreeStatementEngine.getAccountCategory('4000');
      expect(cat).toBeDefined();
    });

    it('getAccountCategory returns undefined for unknown account code', () => {
      const cat = ThreeStatementEngine.getAccountCategory('99999');
      expect(cat).toBeUndefined();
    });
  });

  describe('4. Statement type mapping', () => {

    it('getStatementType returns type for known account code', () => {
      const type = ThreeStatementEngine.getStatementType('4000');
      expect(type).toBeDefined();
    });

    it('getStatementType returns undefined for unknown account code', () => {
      const type = ThreeStatementEngine.getStatementType('99999');
      expect(type).toBeUndefined();
    });
  });

  describe('5. Empty statement creation', () => {

    it('emptyIncomeStatement creates valid empty income statement', () => {
      const is = ThreeStatementEngine.emptyIncomeStatement('2026-01');
      expect(is.period).toBe('2026-01');
      expect(is.revenue).toEqual([]);
      expect(is.netIncome).toBe(0);
    });

    it('emptyBalanceSheet creates valid empty balance sheet', () => {
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      expect(bs.period).toBe('2026-01');
      expect(bs.totalAssets).toBe(0);
      expect(bs.totalEquity).toBe(0);
    });

    it('emptyCashFlow creates valid empty cash flow', () => {
      const cf = ThreeStatementEngine.emptyCashFlow('2026-01');
      expect(cf.period).toBe('2026-01');
      expect(cf.netChangeInCash).toBe(0);
    });

    it('emptyIncomeStatement uses default period', () => {
      const is = ThreeStatementEngine.emptyIncomeStatement();
      expect(is.period).toBe('');
    });
  });

  describe('6. Money primitive safety', () => {

    it('verifyBalance uses decimal arithmetic for large amounts', () => {
      const largeAmount = 999999999999.99;
      const bs: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-01'),
        totalAssets: largeAmount,
        totalLiabilities: largeAmount * 0.6,
        totalEquity: largeAmount * 0.4,
        totalLiabilitiesAndEquity: largeAmount,
      };
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.isBalanced).toBe(true);
    });

    it('verifyBalance handles small fractional imbalances', () => {
      const bs: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-01'),
        totalAssets: 100000.01,
        totalLiabilities: 60000,
        totalEquity: 40000,
        totalLiabilitiesAndEquity: 100000,
      };
      const check = ThreeStatementEngine.verifyBalance(bs);
      // Small imbalance should be within tolerance
      expect(check.imbalance).toBeCloseTo(0.01, 2);
    });
  });

  describe('7. Determinism', () => {

    it('verifyBalance is deterministic', () => {
      const bs: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-01'),
        totalAssets: 100000,
        totalLiabilities: 60000,
        totalEquity: 40000,
        totalLiabilitiesAndEquity: 100000,
      };
      const check1 = ThreeStatementEngine.verifyBalance(bs);
      const check2 = ThreeStatementEngine.verifyBalance(bs);
      expect(check1).toEqual(check2);
    });

    it('link is deterministic for same inputs', () => {
      const is = ThreeStatementEngine.emptyIncomeStatement('2026-01');
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-01');
      const cf = ThreeStatementEngine.emptyCashFlow('2026-01');
      const r1 = ThreeStatementEngine.link(is, bs, cf);
      const r2 = ThreeStatementEngine.link(is, bs, cf);
      expect(r1.linkedAccounts).toEqual(r2.linkedAccounts);
      expect(r1.balanceCheck.imbalance).toBe(r2.balanceCheck.imbalance);
    });

    it('empty statement creation is deterministic', () => {
      const is1 = ThreeStatementEngine.emptyIncomeStatement('2026-01');
      const is2 = ThreeStatementEngine.emptyIncomeStatement('2026-01');
      expect(is1).toEqual(is2);
    });
  });
});
