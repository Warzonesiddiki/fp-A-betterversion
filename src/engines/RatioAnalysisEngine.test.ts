import { describe, it, expect } from 'vitest';
import {
  RatioAnalysisEngine,
  type BalanceSheet,
  type IncomeStatement,
  type CashFlow,
} from './RatioAnalysisEngine';

function makeBS(overrides: Partial<BalanceSheet> = {}): BalanceSheet {
  return {
    cash: 100,
    receivables: 200,
    inventory: 300,
    currentAssets: 800,
    totalAssets: 2000,
    currentLiabilities: 400,
    totalLiabilities: 1000,
    totalEquity: 1000,
    ...overrides,
  };
}
function makeIS(overrides: Partial<IncomeStatement> = {}): IncomeStatement {
  return {
    revenue: 5000,
    grossProfit: 2000,
    operatingIncome: 800,
    netIncome: 500,
    interestExpense: 100,
    ...overrides,
  };
}
function makeCF(overrides: Partial<CashFlow> = {}): CashFlow {
  return { operatingCashFlow: 600, capitalExpenditures: 200, ...overrides };
}

describe('RatioAnalysisEngine', () => {
  it('1. currentRatio = currentAssets / currentLiabilities', () => {
    const r = RatioAnalysisEngine.currentRatio(
      makeBS({ currentAssets: 600, currentLiabilities: 400 })
    );
    expect(r.value).toBe(1.5);
    expect(r.healthy).toBe(true);
  });

  it('2. currentRatio handles zero liabilities', () => {
    const r = RatioAnalysisEngine.currentRatio(makeBS({ currentLiabilities: 0 }));
    expect(r.value).toBe(0);
  });

  it('3. quickRatio excludes inventory', () => {
    const r = RatioAnalysisEngine.quickRatio(
      makeBS({ currentAssets: 600, inventory: 200, currentLiabilities: 400 })
    );
    expect(r.value).toBe(1); // (600-200)/400
  });

  it('4. cashRatio = cash / currentLiabilities', () => {
    const r = RatioAnalysisEngine.cashRatio(makeBS({ cash: 200, currentLiabilities: 400 }));
    expect(r.value).toBe(0.5);
    expect(r.healthy).toBe(true);
  });

  it('5. debtToEquity = totalLiabilities / totalEquity', () => {
    const r = RatioAnalysisEngine.debtToEquity(
      makeBS({ totalLiabilities: 1000, totalEquity: 1000 })
    );
    expect(r.value).toBe(1);
    expect(r.healthy).toBe(true);
  });

  it('6. grossMargin = grossProfit / revenue * 100', () => {
    const r = RatioAnalysisEngine.grossMargin(makeIS({ grossProfit: 1500, revenue: 5000 }));
    expect(r.value).toBe(30);
    expect(r.healthy).toBe(true);
  });

  it('7. operatingMargin returns percentage', () => {
    const r = RatioAnalysisEngine.operatingMargin(makeIS({ operatingIncome: 500, revenue: 5000 }));
    expect(r.value).toBe(10);
  });

  it('8. netMargin returns percentage', () => {
    const r = RatioAnalysisEngine.netMargin(makeIS({ netIncome: 250, revenue: 5000 }));
    expect(r.value).toBe(5);
  });

  it('9. ROE = netIncome / totalEquity * 100', () => {
    const r = RatioAnalysisEngine.returnOnEquity(
      makeBS({ totalEquity: 1000 }),
      makeIS({ netIncome: 150 })
    );
    expect(r.value).toBe(15);
    expect(r.healthy).toBe(true);
  });

  it('10. ROA = netIncome / totalAssets * 100', () => {
    const r = RatioAnalysisEngine.returnOnAssets(
      makeBS({ totalAssets: 2000 }),
      makeIS({ netIncome: 100 })
    );
    expect(r.value).toBe(5);
  });

  it('11. assetTurnover = revenue / totalAssets', () => {
    const r = RatioAnalysisEngine.assetTurnover(
      makeBS({ totalAssets: 5000 }),
      makeIS({ revenue: 5000 })
    );
    expect(r.value).toBe(1);
  });

  it('12. freeCashFlow = OCF - capex', () => {
    expect(
      RatioAnalysisEngine.freeCashFlow(makeCF({ operatingCashFlow: 600, capitalExpenditures: 200 }))
    ).toBe(400);
  });

  it('13. interestCoverage = operatingIncome / interestExpense', () => {
    const r = RatioAnalysisEngine.interestCoverage(
      makeIS({ operatingIncome: 300, interestExpense: 100 })
    );
    expect(r.value).toBe(3);
    expect(r.healthy).toBe(true);
  });

  it('14. interestCoverage returns 0 when no interest expense', () => {
    const r = RatioAnalysisEngine.interestCoverage(
      makeIS({ operatingIncome: 500, interestExpense: 0 })
    );
    expect(r.value).toBe(0);
  });

  it('15. computeSuite returns 5 categories + overallScore', () => {
    const suite = RatioAnalysisEngine.computeSuite(makeBS(), makeIS(), makeCF());
    expect(suite.liquidity.length).toBe(3);
    expect(suite.leverage.length).toBe(3);
    expect(suite.profitability.length).toBe(5);
    expect(suite.efficiency.length).toBe(1);
    expect(suite.coverage.length).toBe(1);
    expect(suite.overallScore).toBeGreaterThan(0);
    expect(suite.overallScore).toBeLessThanOrEqual(100);
  });
});
