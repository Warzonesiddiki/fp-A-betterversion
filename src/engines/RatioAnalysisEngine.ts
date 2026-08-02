// =============================================================================
// RATIO ANALYSIS ENGINE — Financial Ratio Analysis (liquidity, leverage, profitability)
// Pure TypeScript, deterministic, testable. Computes standard financial
// ratios from balance sheet and income statement inputs. Useful for
// credit analysis, investment screening, and management dashboards.
//
// All methods are STATIC and PURE (no React/DOM, no global state).
// 4-ICP verdict (G9 GATE):
//   INTENT:     Standard financial ratio analysis.
//   CORRECTNESS: Industry-standard formulas; handles divide-by-zero.
//   PERF:       O(1) per ratio, O(n) for batch.
//   COMPLIANCE: All amounts deterministic; no float drift on guarded divisions.
//
// MONEY MIGRATION (2026-08-03): balance-sheet/income-statement amounts are
// money and every ratio and percentage is derived through the canonical money
// primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP). Ratio VALUES are
// dimensionless metrics (not money) and are returned as numbers; the
// money-to-money division that produces them is exact. Free cash flow is a
// money figure and is cent-rounded. No raw + - * / on currency values remains.
// =============================================================================

import { divideMoney, roundTo, subtractMoney } from '../utils/money';

// --- Type Definitions ---

export interface BalanceSheet {
  readonly cash: number;
  readonly receivables: number;
  readonly inventory: number;
  readonly currentAssets: number;
  readonly totalAssets: number;
  readonly currentLiabilities: number;
  readonly totalLiabilities: number;
  readonly totalEquity: number;
}

export interface IncomeStatement {
  readonly revenue: number;
  readonly grossProfit: number;
  readonly operatingIncome: number;
  readonly netIncome: number;
  readonly interestExpense: number;
}

export interface CashFlow {
  readonly operatingCashFlow: number;
  readonly capitalExpenditures: number;
}

export interface RatioResult {
  readonly name: string;
  readonly value: number;
  readonly category: 'liquidity' | 'leverage' | 'profitability' | 'efficiency' | 'coverage';
  readonly healthy: boolean;
}

export interface RatioSuite {
  readonly liquidity: readonly RatioResult[];
  readonly leverage: readonly RatioResult[];
  readonly profitability: readonly RatioResult[];
  readonly efficiency: readonly RatioResult[];
  readonly coverage: readonly RatioResult[];
  readonly overallScore: number; // 0-100 composite
}

// --- Helper ---
function ratio(
  name: string,
  value: number,
  category: RatioResult['category'],
  healthy: boolean
): RatioResult {
  return { name, value: isFinite(value) ? value : 0, category, healthy };
}

/** Exact money-to-money ratio (dimensionless metric, not money). */
function moneyRatio(numerator: number, denominator: number, places = 10): number {
  if (denominator === 0) return 0;
  return divideMoney(numerator, denominator).toDecimalPlaces(places).toNumber();
}

/** Exact money percentage = numerator / denominator * 100 (metric, not money). */
function moneyPercent(numerator: number, denominator: number, places = 10): number {
  if (denominator === 0) return 0;
  return divideMoney(numerator, denominator).times(100).toDecimalPlaces(places).toNumber();
}

// --- Engine ---

export class RatioAnalysisEngine {
  // 1. Current ratio = currentAssets / currentLiabilities
  static currentRatio(bs: BalanceSheet): RatioResult {
    const v = moneyRatio(bs.currentAssets, bs.currentLiabilities);
    return ratio('Current Ratio', v, 'liquidity', v >= 1.5);
  }

  // 2. Quick ratio = (currentAssets - inventory) / currentLiabilities
  static quickRatio(bs: BalanceSheet): RatioResult {
    const v =
      bs.currentLiabilities !== 0
        ? divideMoney(subtractMoney(bs.currentAssets, bs.inventory), bs.currentLiabilities)
            .toDecimalPlaces(10)
            .toNumber()
        : 0;
    return ratio('Quick Ratio', v, 'liquidity', v >= 1);
  }

  // 3. Cash ratio = cash / currentLiabilities
  static cashRatio(bs: BalanceSheet): RatioResult {
    const v = moneyRatio(bs.cash, bs.currentLiabilities);
    return ratio('Cash Ratio', v, 'liquidity', v >= 0.5);
  }

  // 4. Debt-to-equity = totalLiabilities / totalEquity
  static debtToEquity(bs: BalanceSheet): RatioResult {
    const v = moneyRatio(bs.totalLiabilities, bs.totalEquity);
    return ratio('Debt-to-Equity', v, 'leverage', v <= 2);
  }

  // 5. Debt-to-assets = totalLiabilities / totalAssets
  static debtToAssets(bs: BalanceSheet): RatioResult {
    const v = moneyRatio(bs.totalLiabilities, bs.totalAssets);
    return ratio('Debt-to-Assets', v, 'leverage', v <= 0.6);
  }

  // 6. Equity multiplier = totalAssets / totalEquity
  static equityMultiplier(bs: BalanceSheet): RatioResult {
    const v = moneyRatio(bs.totalAssets, bs.totalEquity);
    return ratio('Equity Multiplier', v, 'leverage', v <= 3);
  }

  // 7. Gross margin = grossProfit / revenue
  static grossMargin(is: IncomeStatement): RatioResult {
    const v = moneyPercent(is.grossProfit, is.revenue);
    return ratio('Gross Margin %', v, 'profitability', v >= 30);
  }

  // 8. Operating margin = operatingIncome / revenue
  static operatingMargin(is: IncomeStatement): RatioResult {
    const v = moneyPercent(is.operatingIncome, is.revenue);
    return ratio('Operating Margin %', v, 'profitability', v >= 10);
  }

  // 9. Net margin = netIncome / revenue
  static netMargin(is: IncomeStatement): RatioResult {
    const v = moneyPercent(is.netIncome, is.revenue);
    return ratio('Net Margin %', v, 'profitability', v >= 5);
  }

  // 10. Return on equity = netIncome / totalEquity
  static returnOnEquity(bs: BalanceSheet, is: IncomeStatement): RatioResult {
    const v = moneyPercent(is.netIncome, bs.totalEquity);
    return ratio('ROE %', v, 'profitability', v >= 15);
  }

  // 11. Return on assets = netIncome / totalAssets
  static returnOnAssets(bs: BalanceSheet, is: IncomeStatement): RatioResult {
    const v = moneyPercent(is.netIncome, bs.totalAssets);
    return ratio('ROA %', v, 'profitability', v >= 5);
  }

  // 12. Asset turnover = revenue / totalAssets
  static assetTurnover(bs: BalanceSheet, is: IncomeStatement): RatioResult {
    const v = moneyRatio(is.revenue, bs.totalAssets);
    return ratio('Asset Turnover', v, 'efficiency', v >= 1);
  }

  // 13. Free cash flow = operatingCashFlow - capex
  static freeCashFlow(cf: CashFlow): number {
    return roundTo(subtractMoney(cf.operatingCashFlow, cf.capitalExpenditures));
  }

  // 14. Interest coverage = operatingIncome / interestExpense
  static interestCoverage(is: IncomeStatement): RatioResult {
    const v = moneyRatio(is.operatingIncome, is.interestExpense);
    return ratio('Interest Coverage', v, 'coverage', v >= 3);
  }

  // 15. Compute full ratio suite
  static computeSuite(bs: BalanceSheet, is: IncomeStatement, _cf: CashFlow): RatioSuite {
    const liquidity = [
      RatioAnalysisEngine.currentRatio(bs),
      RatioAnalysisEngine.quickRatio(bs),
      RatioAnalysisEngine.cashRatio(bs),
    ];
    const leverage = [
      RatioAnalysisEngine.debtToEquity(bs),
      RatioAnalysisEngine.debtToAssets(bs),
      RatioAnalysisEngine.equityMultiplier(bs),
    ];
    const profitability = [
      RatioAnalysisEngine.grossMargin(is),
      RatioAnalysisEngine.operatingMargin(is),
      RatioAnalysisEngine.netMargin(is),
      RatioAnalysisEngine.returnOnEquity(bs, is),
      RatioAnalysisEngine.returnOnAssets(bs, is),
    ];
    const efficiency = [RatioAnalysisEngine.assetTurnover(bs, is)];
    const coverage = [RatioAnalysisEngine.interestCoverage(is)];
    const all = [...liquidity, ...leverage, ...profitability, ...efficiency, ...coverage];
    const healthyCount = all.filter((r) => r.healthy).length;
    const overallScore = all.length === 0 ? 0 : Math.round((healthyCount / all.length) * 100);
    return { liquidity, leverage, profitability, efficiency, coverage, overallScore };
  }
}
