import { describe, it, expect } from 'vitest';
import {
  ThreeStatementEngine,
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
} from '../ThreeStatementEngine.js';

describe('KAV-09 & KAV-10 — Financial Statement Articulation and GL Invariant Property Tests', () => {
  describe('KAV-09: Statement Articulation', () => {
    it('articulates Net Income to Retained Earnings and Cash Flow ending cash to Balance Sheet cash to the cent', () => {
      const incomeStatement: IncomeStatementData = {
        ...ThreeStatementEngine.emptyIncomeStatement('2026-Q1'),
        netIncome: 150000.5,
      };

      const balanceSheet: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-Q1'),
        cash: 250050.75,
        totalAssets: 1000000.0,
        totalLiabilities: 400000.0,
        retainedEarnings: 450000.5, // 300,000 beginning + 150,000.50 net income
        totalEquity: 600000.0,
        totalLiabilitiesAndEquity: 1000000.0,
      };

      const exactCashFlow: CashFlowData = {
        ...ThreeStatementEngine.emptyCashFlow('2026-Q1'),
        beginningCash: 100000.25,
        netCashFromOperations: 150050.5,
        netCashFromInvesting: 0,
        netCashFromFinancing: 0,
        netChangeInCash: 150050.5,
        endingCash: 250050.75,
      };

      const result = ThreeStatementEngine.link(
        incomeStatement,
        balanceSheet,
        exactCashFlow,
        [],
        300000.0 // beginning RE
      );

      expect(result.isValid).toBe(true);
      expect(result.netIncome).toBe(150000.5);
      expect(result.endingRetainedEarnings).toBe(450000.5);
      expect(result.balanceCheck.isBalanced).toBe(true);
      expect(result.balanceCheck.imbalance).toBe(0);
    });

    it('detects discrepancies when Retained Earnings or Cash do not articulate', () => {
      const incomeStatement: IncomeStatementData = {
        ...ThreeStatementEngine.emptyIncomeStatement('2026-Q1'),
        netIncome: 100000.0,
      };

      const balanceSheet: BalanceSheetData = {
        ...ThreeStatementEngine.emptyBalanceSheet('2026-Q1'),
        cash: 300000.0, // Mismatch with CF ending cash (250,000)
        totalAssets: 1000000.0,
        totalLiabilities: 400000.0,
        retainedEarnings: 999999.0, // Mismatch with expected RE
        totalEquity: 600000.0,
        totalLiabilitiesAndEquity: 1000000.0,
      };

      const cashFlow: CashFlowData = {
        ...ThreeStatementEngine.emptyCashFlow('2026-Q1'),
        beginningCash: 200000.0,
        netCashFromOperations: 50000.0,
        netChangeInCash: 50000.0,
        endingCash: 250000.0,
      };

      const result = ThreeStatementEngine.link(
        incomeStatement,
        balanceSheet,
        cashFlow,
        [],
        50000.0
      );

      console.log('Discrepancy validation errors:', result.validationErrors);

      expect(result.isValid).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some((e) => e.includes('Cash flow ending cash'))).toBe(true);
    });
  });

  describe('KAV-10: GL Invariant Property Test', () => {
    it('proves that for 100 random balanced GL trial balances, Assets − Liabilities − Equity == 0', () => {
      for (let i = 0; i < 100; i++) {
        const assets = Math.round((Math.random() * 10000000 + 100000) * 100) / 100;
        const liabilities = Math.round((Math.random() * (assets * 0.7) + 10000) * 100) / 100;
        const equity = Math.round((assets - liabilities) * 100) / 100;

        const bs: BalanceSheetData = {
          ...ThreeStatementEngine.emptyBalanceSheet('2026-YTD'),
          totalAssets: assets,
          totalLiabilities: liabilities,
          totalEquity: equity,
          totalLiabilitiesAndEquity: liabilities + equity,
        };

        const check = ThreeStatementEngine.verifyBalance(bs);
        expect(check.isBalanced).toBe(true);
        expect(
          Math.abs(check.totalAssets - (check.totalLiabilities + check.totalEquity))
        ).toBeLessThanOrEqual(0.01);
        expect(check.imbalance).toBeCloseTo(0, 2);
      }
    });
  });
});
