import { describe, it, expect } from 'vitest';
import {
  ThreeStatementEngine,
  type IncomeStatementData,
  type BalanceSheetData,
  type CashFlowData,
  type DividendEntry,
} from './ThreeStatementEngine';

// =============================================================================
// TEST HELPERS — Build realistic financial data
// =============================================================================

function buildIncomeStatement(overrides: Partial<IncomeStatementData> = {}): IncomeStatementData {
  return {
    revenue: [
      { accountCode: '4000', accountName: 'Product Revenue', amount: 1000000, category: 'revenue' },
    ],
    cogs: [
      { accountCode: '5000', accountName: 'Cost of Goods Sold', amount: -400000, category: 'cogs' },
    ],
    grossProfit: 600000,
    opex: [
      { accountCode: '6000', accountName: 'Salaries', amount: -200000, category: 'opex' },
      { accountCode: '6100', accountName: 'Rent', amount: -50000, category: 'opex' },
      { accountCode: '6200', accountName: 'Marketing', amount: -30000, category: 'opex' },
    ],
    depreciation: [
      {
        accountCode: '6810',
        accountName: 'Depreciation Expense',
        amount: -50000,
        category: 'depreciation',
      },
    ],
    amortization: [
      {
        accountCode: '6820',
        accountName: 'Amortization Expense',
        amount: -10000,
        category: 'amortization',
      },
    ],
    operatingIncome: 310000,
    interestExpense: [
      {
        accountCode: '7000',
        accountName: 'Interest Expense',
        amount: -20000,
        category: 'interest',
      },
    ],
    interestIncome: [
      { accountCode: '7100', accountName: 'Interest Income', amount: 2000, category: 'interest' },
    ],
    ebit: 292000,
    taxExpense: [
      { accountCode: '8000', accountName: 'Income Tax Expense', amount: -73000, category: 'tax' },
    ],
    otherIncome: [],
    otherExpense: [],
    netIncome: 219000,
    period: '2026-Q1',
    ...overrides,
  };
}

function buildBalanceSheet(overrides: Partial<BalanceSheetData> = {}): BalanceSheetData {
  return {
    currentAssets: [],
    cash: 250000,
    accountsReceivable: 150000,
    inventory: 100000,
    prepaidExpenses: 20000,
    otherCurrentAssets: 10000,
    totalCurrentAssets: 530000,
    nonCurrentAssets: [],
    propertyPlantEquipment: 500000,
    accumulatedDepreciation: -150000,
    netFixedAssets: 350000,
    intangibleAssets: 80000,
    goodwill: 100000,
    otherNonCurrentAssets: 40000,
    totalNonCurrentAssets: 570000,
    totalAssets: 1100000,
    currentLiabilities: [],
    accountsPayable: 80000,
    accruedExpenses: 40000,
    shortTermDebt: 50000,
    currentPortionLongTermDebt: 20000,
    otherCurrentLiabilities: 10000,
    totalCurrentLiabilities: 200000,
    nonCurrentLiabilities: [],
    longTermDebt: 300000,
    deferredTaxLiability: 30000,
    otherNonCurrentLiabilities: 20000,
    totalNonCurrentLiabilities: 350000,
    totalLiabilities: 550000,
    equity: [],
    commonStock: 100000,
    additionalPaidInCapital: 200000,
    retainedEarnings: 219000,
    accumulatedOtherComprehensiveIncome: 20000,
    treasuryStock: -10000,
    totalEquity: 520000,
    totalLiabilitiesAndEquity: 1070000,
    period: '2026-Q1',
    ...overrides,
  };
}

function buildCashFlow(overrides: Partial<CashFlowData> = {}): CashFlowData {
  return {
    operatingActivities: [
      { accountCode: 'NETINC', accountName: 'Net Income', amount: 219000 },
      { accountCode: '6810', accountName: 'Depreciation', amount: 50000 },
      { accountCode: '6820', accountName: 'Amortization', amount: 10000 },
      { accountCode: '1100', accountName: 'Accounts Receivable', amount: -20000 },
      { accountCode: '1200', accountName: 'Inventory', amount: -10000 },
      { accountCode: '2100', accountName: 'Accounts Payable', amount: 15000 },
      { accountCode: '2200', accountName: 'Accrued Expenses', amount: 5000 },
    ],
    netCashFromOperations: 269000,
    investingActivities: [
      { accountCode: '1600', accountName: 'Capital Expenditures', amount: -100000 },
      { accountCode: '1700', accountName: 'Purchase of Investments', amount: -50000 },
    ],
    netCashFromInvesting: -150000,
    financingActivities: [
      { accountCode: '2500', accountName: 'Debt Repayment', amount: -30000 },
      { accountCode: '3000', accountName: 'Stock Issuance', amount: 20000 },
      { accountCode: '3300', accountName: 'Dividends Paid', amount: -50000 },
    ],
    netCashFromFinancing: -60000,
    netChangeInCash: 59000,
    beginningCash: 191000,
    endingCash: 250000,
    period: '2026-Q1',
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('ThreeStatementEngine', () => {
  // ---------------------------------------------------------------------------
  // Link 1: Net Income → Retained Earnings
  // ---------------------------------------------------------------------------
  describe('Net Income to Retained Earnings', () => {
    it('should link net income to retained earnings correctly', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement({ netIncome: 219000 }),
        buildBalanceSheet({ retainedEarnings: 219000 }),
        buildCashFlow(),
        [],
        0 // beginning RE
      );

      const reLink = result.linkedAccounts.find(
        (a) => a.linkType === 'net_income_to_retained_earnings'
      );
      expect(reLink).toBeDefined();
      expect(reLink!.plAmount).toBe(219000);
      expect(reLink!.bsAmount).toBe(219000);
      expect(reLink!.isLinked).toBe(true);
      expect(result.endingRetainedEarnings).toBe(219000);
    });

    it('should detect retained earnings discrepancy', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement({ netIncome: 219000 }),
        buildBalanceSheet({ retainedEarnings: 250000 }), // wrong: should be 219000
        buildCashFlow(),
        [],
        0
      );

      expect(result.discrepancies.length).toBeGreaterThan(0);
      const reDiscrepancy = result.discrepancies.find(
        (d) => d.linkType === 'net_income_to_retained_earnings'
      );
      expect(reDiscrepancy).toBeDefined();
      expect(reDiscrepancy!.severity).toBe('error');
    });

    it('should account for beginning retained earnings and dividends', () => {
      const dividends: DividendEntry[] = [
        { accountCode: '3300', accountName: 'Common Dividends', amount: 50000 },
      ];
      // Expected: Beg RE (100000) + Net Income (219000) - Dividends (50000) = 269000
      const result = ThreeStatementEngine.link(
        buildIncomeStatement({ netIncome: 219000 }),
        buildBalanceSheet({ retainedEarnings: 269000 }),
        buildCashFlow(),
        dividends,
        100000 // beginning RE
      );

      const reLink = result.linkedAccounts.find(
        (a) => a.linkType === 'net_income_to_retained_earnings'
      );
      expect(reLink!.isLinked).toBe(true);
      expect(result.endingRetainedEarnings).toBe(269000);
      expect(result.beginningRetainedEarnings).toBe(100000);
      expect(result.dividendsDeclared).toBe(50000);
    });
  });

  // ---------------------------------------------------------------------------
  // Link 2: Depreciation → Accumulated Depreciation → CF Operating
  // ---------------------------------------------------------------------------
  describe('Depreciation Link', () => {
    it('should link depreciation across all three statements', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement({
          depreciation: [
            {
              accountCode: '6810',
              accountName: 'Depreciation',
              amount: -50000,
              category: 'depreciation',
            },
          ],
        }),
        buildBalanceSheet({ accumulatedDepreciation: -150000 }),
        buildCashFlow({
          operatingActivities: [
            { accountCode: '6810', accountName: 'Depreciation', amount: 50000 },
          ],
        })
      );

      const depLink = result.linkedAccounts.find(
        (a) => a.linkType === 'depreciation_to_accumulated_depreciation'
      );
      expect(depLink).toBeDefined();
      expect(depLink!.plAmount).toBe(-50000);
      expect(depLink!.cfAmount).toBe(50000);
      expect(depLink!.bsAmount).toBe(-150000);
    });

    it('should warn when depreciation amounts differ', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement({
          depreciation: [
            {
              accountCode: '6810',
              accountName: 'Depreciation',
              amount: -50000,
              category: 'depreciation',
            },
          ],
        }),
        buildBalanceSheet(),
        buildCashFlow({
          operatingActivities: [
            { accountCode: '6810', accountName: 'Depreciation', amount: 40000 }, // mismatch
          ],
        })
      );

      const depDiscrepancy = result.discrepancies.find(
        (d) => d.linkType === 'depreciation_to_accumulated_depreciation'
      );
      expect(depDiscrepancy).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Link 3: CapEx → Fixed Assets
  // ---------------------------------------------------------------------------
  describe('CapEx Link', () => {
    it('should link capex from CF investing to BS fixed assets', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({ propertyPlantEquipment: 500000 }),
        buildCashFlow({
          investingActivities: [
            { accountCode: '1600', accountName: 'Capital Expenditures', amount: -100000 },
          ],
        })
      );

      const capexLink = result.linkedAccounts.find((a) => a.linkType === 'capex_to_fixed_assets');
      expect(capexLink).toBeDefined();
      expect(capexLink!.cfAmount).toBe(-100000);
      expect(capexLink!.bsAmount).toBe(500000);
    });
  });

  // ---------------------------------------------------------------------------
  // Link 4: Working Capital → CF Operating
  // ---------------------------------------------------------------------------
  describe('Working Capital Link', () => {
    it('should link working capital items to cash flow operating', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          accountsReceivable: 150000,
          inventory: 100000,
          accountsPayable: 80000,
          accruedExpenses: 40000,
        }),
        buildCashFlow({
          operatingActivities: [
            { accountCode: '1100', accountName: 'Accounts Receivable', amount: -20000 },
            { accountCode: '1200', accountName: 'Inventory', amount: -10000 },
            { accountCode: '2100', accountName: 'Accounts Payable', amount: 15000 },
            { accountCode: '2200', accountName: 'Accrued Expenses', amount: 5000 },
          ],
        })
      );

      const wcLinks = result.linkedAccounts.filter(
        (a) => a.linkType === 'working_capital_to_operations'
      );
      expect(wcLinks).toHaveLength(4);

      const arLink = wcLinks.find((a) => a.accountCode === '1100');
      expect(arLink!.cfAmount).toBe(-20000);
      expect(arLink!.bsAmount).toBe(150000);
      expect(arLink!.isLinked).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Link 5: Debt → CF Financing
  // ---------------------------------------------------------------------------
  describe('Debt Link', () => {
    it('should link debt from CF financing to BS debt balances', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          shortTermDebt: 50000,
          longTermDebt: 300000,
          currentPortionLongTermDebt: 20000,
        }),
        buildCashFlow({
          financingActivities: [
            { accountCode: '2500', accountName: 'Debt Repayment', amount: -30000 },
            { accountCode: '2510', accountName: 'New Borrowings', amount: 50000 },
          ],
        })
      );

      const debtLink = result.linkedAccounts.find((a) => a.linkType === 'debt_to_financing');
      expect(debtLink).toBeDefined();
      expect(debtLink!.bsAmount).toBe(370000); // 50000 + 300000 + 20000
      expect(debtLink!.cfAmount).toBe(20000); // -30000 + 50000
    });
  });

  // ---------------------------------------------------------------------------
  // Link 6: Equity → CF Financing
  // ---------------------------------------------------------------------------
  describe('Equity Link', () => {
    it('should link equity from CF financing to BS equity accounts', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          commonStock: 100000,
          additionalPaidInCapital: 200000,
          treasuryStock: -10000,
        }),
        buildCashFlow({
          financingActivities: [
            { accountCode: '3000', accountName: 'Stock Issuance', amount: 20000 },
            { accountCode: '3100', accountName: 'Share Buyback', amount: -15000 },
          ],
        })
      );

      const equityLink = result.linkedAccounts.find((a) => a.linkType === 'equity_to_financing');
      expect(equityLink).toBeDefined();
      expect(equityLink!.bsAmount).toBe(310000); // 100000 + 200000 - (-10000)
    });
  });

  // ---------------------------------------------------------------------------
  // Balance Check: Assets = Liabilities + Equity
  // ---------------------------------------------------------------------------
  describe('Balance Check', () => {
    it('should pass when assets equal liabilities plus equity', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          totalAssets: 1100000,
          totalLiabilities: 550000,
          totalEquity: 550000,
          totalLiabilitiesAndEquity: 1100000,
        }),
        buildCashFlow()
      );

      expect(result.balanceCheck.isBalanced).toBe(true);
      expect(result.balanceCheck.imbalance).toBeCloseTo(0, 1);
    });

    it('should fail when balance sheet does not balance', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          totalAssets: 1100000,
          totalLiabilities: 550000,
          totalEquity: 500000, // off by 50000
          totalLiabilitiesAndEquity: 1050000,
        }),
        buildCashFlow()
      );

      expect(result.balanceCheck.isBalanced).toBe(false);
      expect(result.balanceCheck.imbalance).toBe(50000);
      expect(result.isValid).toBe(false);
    });

    it('should accept small rounding differences within tolerance', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          totalAssets: 1100000,
          totalLiabilities: 550000,
          totalEquity: 549999.995,
          totalLiabilitiesAndEquity: 1099999.995,
        }),
        buildCashFlow()
      );

      expect(result.balanceCheck.isBalanced).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Cash Flow Consistency
  // ---------------------------------------------------------------------------
  describe('Cash Flow Consistency', () => {
    it('should validate that O + I + F = Net Change in Cash', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({
          totalAssets: 1100000,
          totalLiabilities: 550000,
          totalEquity: 550000,
          totalLiabilitiesAndEquity: 1100000,
          cash: 250000,
        }),
        buildCashFlow({
          netCashFromOperations: 269000,
          netCashFromInvesting: -150000,
          netCashFromFinancing: -60000,
          netChangeInCash: 59000,
          beginningCash: 191000,
          endingCash: 250000,
        })
      );

      expect(result.validationErrors.length).toBe(0);
    });

    it('should detect cash flow section mismatch', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({ cash: 250000 }),
        buildCashFlow({
          netCashFromOperations: 269000,
          netCashFromInvesting: -150000,
          netCashFromFinancing: -60000,
          netChangeInCash: 100000, // wrong: should be 59000
          beginningCash: 191000,
          endingCash: 291000,
        })
      );

      expect(result.validationErrors.length).toBeGreaterThan(0);
      expect(result.validationErrors.some((e) => e.includes('sections do not sum'))).toBe(true);
    });

    it('should detect beginning + net change != ending cash', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({ cash: 300000 }),
        buildCashFlow({
          netCashFromOperations: 100000,
          netCashFromInvesting: -50000,
          netCashFromFinancing: -30000,
          netChangeInCash: 20000,
          beginningCash: 100000,
          endingCash: 300000, // wrong: should be 120000
        })
      );

      expect(result.validationErrors.some((e) => e.includes('Beginning cash'))).toBe(true);
    });

    it('should detect CF ending cash != BS cash', () => {
      const result = ThreeStatementEngine.link(
        buildIncomeStatement(),
        buildBalanceSheet({ cash: 300000 }),
        buildCashFlow({
          endingCash: 250000, // mismatch with BS
          beginningCash: 191000,
          netChangeInCash: 59000,
        })
      );

      expect(result.validationErrors.some((e) => e.includes('Cash flow ending cash'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Input Validation
  // ---------------------------------------------------------------------------
  describe('Input Validation', () => {
    it('should throw when income statement is null', () => {
      expect(() =>
        ThreeStatementEngine.link(
          null as unknown as IncomeStatementData,
          buildBalanceSheet(),
          buildCashFlow()
        )
      ).toThrow('Income statement data is required');
    });

    it('should throw when balance sheet is null', () => {
      expect(() =>
        ThreeStatementEngine.link(
          buildIncomeStatement(),
          null as unknown as BalanceSheetData,
          buildCashFlow()
        )
      ).toThrow('Balance sheet data is required');
    });

    it('should throw when cash flow is null', () => {
      expect(() =>
        ThreeStatementEngine.link(
          buildIncomeStatement(),
          buildBalanceSheet(),
          null as unknown as CashFlowData
        )
      ).toThrow('Cash flow data is required');
    });

    it('should throw when net income is NaN', () => {
      expect(() =>
        ThreeStatementEngine.link(
          buildIncomeStatement({ netIncome: NaN }),
          buildBalanceSheet(),
          buildCashFlow()
        )
      ).toThrow('Net income must be a finite number');
    });

    it('should throw when total assets is Infinity', () => {
      expect(() =>
        ThreeStatementEngine.link(
          buildIncomeStatement(),
          buildBalanceSheet({ totalAssets: Infinity }),
          buildCashFlow()
        )
      ).toThrow('Total assets must be a finite number');
    });
  });

  // ---------------------------------------------------------------------------
  // verifyBalance (static)
  // ---------------------------------------------------------------------------
  describe('verifyBalance', () => {
    it('should return balanced for equal assets and L+E', () => {
      const bs = buildBalanceSheet({
        totalAssets: 1000000,
        totalLiabilities: 600000,
        totalEquity: 400000,
      });
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.isBalanced).toBe(true);
      expect(check.imbalance).toBe(0);
    });

    it('should return imbalanced when assets != L+E', () => {
      const bs = buildBalanceSheet({
        totalAssets: 1000000,
        totalLiabilities: 600000,
        totalEquity: 350000,
      });
      const check = ThreeStatementEngine.verifyBalance(bs);
      expect(check.isBalanced).toBe(false);
      expect(check.imbalance).toBe(50000);
    });
  });

  // ---------------------------------------------------------------------------
  // Account Code Helpers
  // ---------------------------------------------------------------------------
  describe('Account Code Helpers', () => {
    it('should return correct category for known codes', () => {
      expect(ThreeStatementEngine.getAccountCategory('4000')).toBe('revenue');
      expect(ThreeStatementEngine.getAccountCategory('5000')).toBe('cogs');
      expect(ThreeStatementEngine.getAccountCategory('6000')).toBe('opex');
      expect(ThreeStatementEngine.getAccountCategory('1000')).toBe('current_asset');
      expect(ThreeStatementEngine.getAccountCategory('2500')).toBe('non_current_liability');
      expect(ThreeStatementEngine.getAccountCategory('3300')).toBe('retained_earnings');
    });

    it('should return undefined for unknown codes', () => {
      expect(ThreeStatementEngine.getAccountCategory('9999')).toBeUndefined();
    });

    it('should return correct statement type', () => {
      expect(ThreeStatementEngine.getStatementType('4000')).toBe('income');
      expect(ThreeStatementEngine.getStatementType('1000')).toBe('balance_sheet');
      expect(ThreeStatementEngine.getStatementType('3300')).toBe('balance_sheet');
    });
  });

  // ---------------------------------------------------------------------------
  // Empty Data Factories
  // ---------------------------------------------------------------------------
  describe('Empty Data Factories', () => {
    it('should create empty income statement with period', () => {
      const is = ThreeStatementEngine.emptyIncomeStatement('2026-Q1');
      expect(is.netIncome).toBe(0);
      expect(is.period).toBe('2026-Q1');
      expect(is.revenue).toEqual([]);
    });

    it('should create empty balance sheet', () => {
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-Q1');
      expect(bs.totalAssets).toBe(0);
      expect(bs.totalLiabilities).toBe(0);
      expect(bs.totalEquity).toBe(0);
      expect(bs.period).toBe('2026-Q1');
    });

    it('should create empty cash flow', () => {
      const cf = ThreeStatementEngine.emptyCashFlow('2026-Q1');
      expect(cf.netChangeInCash).toBe(0);
      expect(cf.operatingActivities).toEqual([]);
      expect(cf.period).toBe('2026-Q1');
    });
  });

  // ---------------------------------------------------------------------------
  // Full Integration: Balanced Model
  // ---------------------------------------------------------------------------
  describe('Full Integration', () => {
    it('should produce a valid result for a well-formed model', () => {
      const income = buildIncomeStatement();
      const bs = buildBalanceSheet({
        totalAssets: 1100000,
        totalLiabilities: 550000,
        totalEquity: 550000,
        totalLiabilitiesAndEquity: 1100000,
        retainedEarnings: 219000,
      });
      const cf = buildCashFlow();

      const result = ThreeStatementEngine.link(income, bs, cf, [], 0);

      expect(result.netIncome).toBe(219000);
      expect(result.endingRetainedEarnings).toBe(219000);
      expect(result.cashFromOperations).toBe(269000);
      expect(result.cashFromInvesting).toBe(-150000);
      expect(result.cashFromFinancing).toBe(-60000);
      expect(result.netChangeInCash).toBe(59000);
      expect(result.balanceCheck.isBalanced).toBe(true);
      expect(result.linkedAccounts.length).toBeGreaterThan(0);
    });

    it('should flag all discrepancies in an inconsistent model', () => {
      const income = buildIncomeStatement({ netIncome: 219000 });
      const bs = buildBalanceSheet({
        retainedEarnings: 300000, // wrong
        totalAssets: 1100000,
        totalLiabilities: 550000,
        totalEquity: 500000, // doesn't match assets - liabilities
        totalLiabilitiesAndEquity: 1050000,
        cash: 999000, // doesn't match CF ending cash
      });
      const cf = buildCashFlow({
        endingCash: 250000,
        netChangeInCash: 59000,
        beginningCash: 191000,
      });

      const result = ThreeStatementEngine.link(income, bs, cf, [], 0);

      expect(result.isValid).toBe(false);
      expect(result.discrepancies.length).toBeGreaterThan(0);
      expect(result.balanceCheck.isBalanced).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it('should handle zero-value statements gracefully', () => {
      const income = ThreeStatementEngine.emptyIncomeStatement('2026-Q1');
      const bs = ThreeStatementEngine.emptyBalanceSheet('2026-Q1');
      const cf = ThreeStatementEngine.emptyCashFlow('2026-Q1');

      const result = ThreeStatementEngine.link(income, bs, cf);

      expect(result.netIncome).toBe(0);
      expect(result.balanceCheck.isBalanced).toBe(true); // 0 = 0 + 0
      expect(result.linkedAccounts.length).toBeGreaterThan(0);
    });
  });
});
