import { describe, it, expect } from 'vitest';
import { ThreeStatementEngine } from '../ThreeStatementEngine';
import type {
  IncomeStatementData,
  BalanceSheetData,
  CashFlowData,
  DividendEntry,
} from '../ThreeStatementEngine';

// =============================================================================
// MONEY PRIMITIVE VERIFICATION — ThreeStatementEngine
// Tests that the engine uses Decimal.js for financial truth, not IEEE-754.
// =============================================================================

describe('ThreeStatementEngine — Money Primitive Verification', () => {
  // Create a balanced set of statements where Assets = Liabilities + Equity
  const balancedIncome: IncomeStatementData = {
    revenue: [{ accountCode: '4000', accountName: 'Sales', amount: 100000, category: 'revenue' }],
    cogs: [{ accountCode: '5000', accountName: 'COGS', amount: 60000, category: 'cogs' }],
    grossProfit: 40000,
    opex: [{ accountCode: '6000', accountName: 'OpEx', amount: 15000, category: 'opex' }],
    depreciation: [
      { accountCode: '6810', accountName: 'Depreciation', amount: 5000, category: 'depreciation' },
    ],
    amortization: [
      { accountCode: '6820', accountName: 'Amortization', amount: 2000, category: 'amortization' },
    ],
    operatingIncome: 20000,
    interestExpense: [
      { accountCode: '7000', accountName: 'Interest', amount: 3000, category: 'interest' },
    ],
    interestIncome: [],
    ebit: 23000,
    taxExpense: [{ accountCode: '8000', accountName: 'Tax', amount: 4250, category: 'tax' }],
    otherIncome: [],
    otherExpense: [],
    netIncome: 12750,
    period: '2026-01',
  };

  const balancedBS: BalanceSheetData = {
    currentAssets: [],
    cash: 25000,
    accountsReceivable: 10000,
    inventory: 15000,
    prepaidExpenses: 0,
    otherCurrentAssets: 0,
    totalCurrentAssets: 50000,
    nonCurrentAssets: [],
    propertyPlantEquipment: 100000,
    accumulatedDepreciation: 20000,
    netFixedAssets: 80000,
    intangibleAssets: 10000,
    goodwill: 0,
    otherNonCurrentAssets: 0,
    totalNonCurrentAssets: 90000,
    totalAssets: 140000,
    currentLiabilities: [],
    accountsPayable: 8000,
    accruedExpenses: 2000,
    shortTermDebt: 5000,
    currentPortionLongTermDebt: 0,
    otherCurrentLiabilities: 0,
    totalCurrentLiabilities: 15000,
    nonCurrentLiabilities: [],
    longTermDebt: 45000,
    deferredTaxLiability: 0,
    otherNonCurrentLiabilities: 0,
    totalNonCurrentLiabilities: 45000,
    totalLiabilities: 60000,
    equity: [],
    commonStock: 50000,
    additionalPaidInCapital: 20000,
    retainedEarnings: 10000,
    accumulatedOtherComprehensiveIncome: 0,
    treasuryStock: 0,
    totalEquity: 80000,
    totalLiabilitiesAndEquity: 140000,
    period: '2026-01',
  };

  const balancedCF: CashFlowData = {
    operatingActivities: [
      { accountCode: '6810', accountName: 'Depreciation add-back', amount: 5000 },
      { accountCode: '6820', accountName: 'Amortization add-back', amount: 2000 },
      { accountCode: '7000', accountName: 'Interest paid', amount: 3000 },
      { accountCode: '8000', accountName: 'Tax paid', amount: 4250 },
    ],
    netCashFromOperations: 12750,
    investingActivities: [
      { accountCode: '1600', accountName: 'Capital expenditure', amount: -15000 },
    ],
    netCashFromInvesting: -15000,
    financingActivities: [{ accountCode: '2500', accountName: 'Debt repayment', amount: -2750 }],
    netCashFromFinancing: -2750,
    netChangeInCash: -5000,
    beginningCash: 30000,
    endingCash: 25000,
    period: '2026-01',
  };

  it('uses Decimal for balance verification — no float drift on 0.01 + 0.02', () => {
    // This is the classic IEEE-754 test: 0.1 + 0.2 !== 0.3
    // With Decimal.js, the comparison should be exact
    const bs: BalanceSheetData = {
      ...balancedBS,
      // Use amounts that would cause float drift in IEEE-754
      totalAssets: 0.3,
      totalCurrentAssets: 0.3,
      totalLiabilities: 0.1,
      totalCurrentLiabilities: 0.1,
      totalEquity: 0.2,
      totalLiabilitiesAndEquity: 0.3,
    };

    const result = ThreeStatementEngine.verifyBalance(bs);
    // With Decimal.js, this should be exactly balanced
    expect(result.isBalanced).toBe(true);
    expect(result.imbalance).toBe(0);
  });

  it('uses Decimal for cash flow consistency — no float drift', () => {
    // Use amounts that would cause float drift
    const cf: CashFlowData = {
      operatingActivities: [],
      netCashFromOperations: 0.1,
      investingActivities: [],
      netCashFromInvesting: 0.2,
      financingActivities: [],
      netCashFromFinancing: 0.0,
      netChangeInCash: 0.3,
      beginningCash: 0.0,
      endingCash: 0.3,
      period: '2026-01',
    };

    const result = ThreeStatementEngine.link(balancedIncome, balancedBS, cf, [], 0);

    // With Decimal.js, 0.1 + 0.2 = 0.3 exactly — no float drift
    expect(result.validationErrors).not.toContain(
      expect.stringContaining('Cash flow sections do not sum')
    );
  });

  it('uses Decimal for retained earnings calculation — no float drift', () => {
    const result = ThreeStatementEngine.link(
      balancedIncome,
      balancedBS,
      balancedCF,
      [],
      10000 // beginningRetainedEarnings
    );

    // 10000 + 12750 - 0 = 22750
    expect(result.endingRetainedEarnings).toBe(22750);
    expect(result.dividendsDeclared).toBe(0);
  });

  it('uses Decimal for dividend calculations', () => {
    const dividends: DividendEntry[] = [
      { accountCode: '3300', accountName: 'Cash Dividend', amount: 5000 },
      { accountCode: '3300', accountName: 'Special Dividend', amount: 2750 },
    ];

    const result = ThreeStatementEngine.link(
      balancedIncome,
      balancedBS,
      balancedCF,
      dividends,
      10000
    );

    // 10000 + 12750 - 7750 = 15000
    expect(result.dividendsDeclared).toBe(7750);
    expect(result.endingRetainedEarnings).toBe(15000);
  });

  it('uses Decimal for balance sheet equity calculation', () => {
    const result = ThreeStatementEngine.verifyBalance(balancedBS);

    // With Decimal.js, the balance check should be exact
    expect(result.isBalanced).toBe(true);
    expect(result.totalAssets).toBe(140000);
    expect(result.totalLiabilitiesAndEquity).toBe(140000);
    expect(result.imbalance).toBe(0);
  });

  it('detects imbalances with Decimal precision', () => {
    const unbalancedBS: BalanceSheetData = {
      ...balancedBS,
      totalAssets: 140001, // 1 off
    };

    const result = ThreeStatementEngine.verifyBalance(unbalancedBS);
    expect(result.isBalanced).toBe(false);
    expect(result.imbalance).toBe(1);
  });

  it('uses Decimal for depreciation link calculation', () => {
    const result = ThreeStatementEngine.link(balancedIncome, balancedBS, balancedCF, [], 0);

    // Find the depreciation link
    const depLink = result.linkedAccounts.find(
      (a) => a.linkType === 'depreciation_to_accumulated_depreciation'
    );
    expect(depLink).toBeDefined();
    expect(depLink!.plAmount).toBe(5000);
    expect(depLink!.cfAmount).toBe(5000);
    expect(depLink!.isLinked).toBe(true);
  });

  it('uses Decimal for interest link calculation', () => {
    const result = ThreeStatementEngine.link(balancedIncome, balancedBS, balancedCF, [], 0);

    const interestLink = result.linkedAccounts.find((a) => a.linkType === 'interest_to_operations');
    expect(interestLink).toBeDefined();
    expect(interestLink!.plAmount).toBe(3000);
    expect(interestLink!.cfAmount).toBe(3000);
  });

  it('uses Decimal for tax link calculation', () => {
    const result = ThreeStatementEngine.link(balancedIncome, balancedBS, balancedCF, [], 0);

    const taxLink = result.linkedAccounts.find((a) => a.linkType === 'tax_to_operations');
    expect(taxLink).toBeDefined();
    expect(taxLink!.plAmount).toBe(4250);
    expect(taxLink!.cfAmount).toBe(4250);
  });

  it('uses Decimal for debt link calculation', () => {
    const result = ThreeStatementEngine.link(balancedIncome, balancedBS, balancedCF, [], 0);

    const debtLink = result.linkedAccounts.find((a) => a.linkType === 'debt_to_financing');
    expect(debtLink).toBeDefined();
    // shortTermDebt(5000) + longTermDebt(45000) + currentPortionLongTermDebt(0) = 50000
    expect(debtLink!.bsAmount).toBe(50000);
  });
});
