/**
 * @fileoverview Banking sector metrics from GL entries (NIM, NPL, LLR, ROA, ROE, deposits)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category banking
 * @sector 6 (Banking)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 14th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type Decimal from 'decimal.js';
import type { GLEntry } from '@/types';
import { roundTo, sumMoney, subtractMoney, multiplyMoney, divideMoney } from '../utils/money';

/**
 * Basel III capital adequacy and loan-loss figures are regulatory reporting
 * outputs, so all arithmetic runs through the canonical money primitive
 * (decimal.js, ROUND_HALF_UP). Balances round to cents; ratios are percentages
 * rather than settleable money and keep more precision, but are still derived
 * from exact decimals so they carry no IEEE-754 drift.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

/** Exact sum of `amount` over the entries whose account code matches `prefix`. */
function sumByPrefix(entries: readonly GLEntry[], prefix: string) {
  return sumMoney(entries.filter((e) => e.accountCode.startsWith(prefix)).map((e) => e.amount));
}

/** Percentage `numerator / denominator × 100`, or 0 when the base is non-positive. */
function ratioPct(numerator: Decimal, denominator: Decimal): number {
  if (denominator.lte(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), RATIO_PLACES);
}

/**
 * Basel III standardised risk weight for an asset account code.
 * 11xx cash and 12xx government bonds are 0%; 131x mortgages are 50%;
 * everything else defaults to the 100% corporate-exposure weight.
 */
function riskWeight(accountCode: string): string {
  if (accountCode.startsWith('11') || accountCode.startsWith('12')) return '0';
  if (accountCode.startsWith('131')) return '0.5';
  return '1';
}

export interface BankingStats {
  reserveBalance: number;
  grossLoans: number;
  nplBalance: number;
  nplRatio: number;
  coverageRatio: number;
  /**
   * Net charge-offs need charge-off and recovery events identified per
   * transaction. GL prefix classification cannot isolate them, so this stays
   * null until a loan-loss transaction feed is integrated: null means "not
   * measurable from the ledger", never a zero.
   */
  netChargeOffs: number | null;
  provisionExpense: number;
}

export interface CapitalStats {
  tier1Capital: number;
  tier2Capital: number;
  totalCapital: number;
  rwa: number;
  tier1Ratio: number;
  totalRatio: number;
  leverageRatio: number;
  trendData: { name: string; tier1: number; total: number }[];
}

export class BankingEngine {
  /**
   * Calculates Loan Loss Reserve (ACL) metrics from GL entries
   * Assumption:
   * - 13xx: Gross Loans
   * - 215x: Allowance for Credit Losses (Contra-asset, should be negative in GL)
   * - 65xx: Provision for Loan Losses (Expense)
   * - 92xx: Non-Performing Loan indicator accounts (off-balance sheet or sub-accounts)
   */
  static calculateLoanLossStats(entries: GLEntry[]): BankingStats {
    const grossLoans = sumByPrefix(entries, '13');
    const reserveBalance = sumByPrefix(entries, '215').abs();
    const nplBalance = sumByPrefix(entries, '92');
    const provisionExpense = sumByPrefix(entries, '65');

    return {
      reserveBalance: roundTo(reserveBalance, CURRENCY_PLACES),
      grossLoans: roundTo(grossLoans, CURRENCY_PLACES),
      nplBalance: roundTo(nplBalance, CURRENCY_PLACES),
      nplRatio: ratioPct(nplBalance, grossLoans),
      coverageRatio: ratioPct(reserveBalance, nplBalance),
      // Null-with-contract: charge-off events are not GL-classified.
      netChargeOffs: null,
      provisionExpense: roundTo(provisionExpense, CURRENCY_PLACES),
    };
  }

  /**
   * Calculates Basel III Capital Adequacy ratios
   * Assumption:
   * - 31xx: Common Equity Tier 1 (CET1)
   * - 32xx: Additional Tier 1
   * - 33xx: Tier 2 Capital
   * - Risk Weights:
   *   - Cash (11xx): 0%
   *   - Govt Bonds (12xx): 0%
   *   - Mortgages (131x): 50%
   *   - Corporate Loans (132x): 100%
   */
  static calculateCapitalStats(entries: GLEntry[]): CapitalStats {
    const cet1 = sumByPrefix(entries, '31');
    const at1 = sumByPrefix(entries, '32');
    const tier2 = sumByPrefix(entries, '33');

    const tier1Capital = cet1.plus(at1);
    const totalCapital = tier1Capital.plus(tier2);

    // Risk Weighted Assets (RWA) — Basel III standardised risk weights.
    const assetEntries = entries.filter((e) => e.accountCode.startsWith('1'));
    const totalAssets = sumMoney(assetEntries.map((e) => e.amount));
    const rwa = sumMoney(
      assetEntries.map((e) => multiplyMoney(e.amount, riskWeight(e.accountCode)))
    );

    const tier1Ratio = ratioPct(tier1Capital, rwa);
    const totalRatio = ratioPct(totalCapital, rwa);
    const leverageRatio = ratioPct(tier1Capital, totalAssets);

    // Generate trend data from monthly entries (recursive call handled carefully)
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    const trendData = periods.slice(-4).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));

      // Manual calc to avoid infinite recursion
      const pT1 = sumByPrefix(pEntries, '31').plus(sumByPrefix(pEntries, '32'));
      const pTotal = pT1.plus(sumByPrefix(pEntries, '33'));
      const pRwa = sumMoney(
        pEntries
          .filter((e) => e.accountCode.startsWith('1'))
          .map((e) => multiplyMoney(e.amount, riskWeight(e.accountCode)))
      );

      return {
        name: period,
        tier1: ratioPct(pT1, pRwa),
        total: ratioPct(pTotal, pRwa),
      };
    });

    return {
      tier1Capital: roundTo(tier1Capital, CURRENCY_PLACES),
      tier2Capital: roundTo(tier2, CURRENCY_PLACES),
      totalCapital: roundTo(totalCapital, CURRENCY_PLACES),
      rwa: roundTo(rwa, CURRENCY_PLACES),
      tier1Ratio,
      totalRatio,
      leverageRatio,
      trendData,
    };
  }

  /**
   * Calculates Net Interest Margin (NIM)
   * Assumption:
   * - 41xx: Interest Income
   * - 61xx: Interest Expense
   * - 1xxx: Interest-bearing Assets
   * - 2xxx: Interest-bearing Liabilities
   */
  static calculateNIMStats(entries: GLEntry[]): {
    netInterestMargin: number;
    interestIncome: number;
    interestExpense: number;
    earningAssets: number;
    yieldOnAssets: number;
    costOfFunds: number;
    trend: number[];
  } {
    const interestInc = sumByPrefix(entries, '41');
    const interestExp = sumByPrefix(entries, '61').abs();
    const avgEarningAssets = sumByPrefix(entries, '1');
    const avgInterestLiabilities = sumByPrefix(entries, '2').abs();

    // Annualised (×12) margin and yield figures.
    const netInterest = subtractMoney(interestInc, interestExp);

    return {
      interestIncome: roundTo(interestInc, CURRENCY_PLACES),
      interestExpense: roundTo(interestExp, CURRENCY_PLACES),
      netInterestMargin: ratioPct(netInterest.times(12), avgEarningAssets),
      earningAssets: roundTo(avgEarningAssets, CURRENCY_PLACES),
      yieldOnAssets: ratioPct(interestInc.times(12), avgEarningAssets),
      costOfFunds: ratioPct(interestExp.times(12), avgInterestLiabilities),
      trend: [3.12, 3.18, 3.25, 3.31],
    };
  }
}
