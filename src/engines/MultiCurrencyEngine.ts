// @money-ast-allow Reason: String identity check: fromCurrency === toCurrency compares ISO-4217 codes, not amounts
/**
 * @fileoverview Multi-currency translation + FX gain/loss calculation (input validation + math only)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category fx-translation
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 26th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type { ExchangeRate } from '@/types';
import { roundTo, sumMoney, subtractMoney, multiplyMoney, divideMoney } from '../utils/money';

/**
 * ASC 830 translation and remeasurement produce reported balance-sheet and P&L
 * figures, so all arithmetic runs through the canonical money primitive
 * (decimal.js, ROUND_HALF_UP) and rounds to cents. Exchange RATES are not
 * currency and keep full precision.
 */
const CURRENCY_PLACES = 2;
const RATE_PLACES = 10;

export interface TranslationResult {
  translatedAmount: number;
  fxGainLoss: number;
  effectiveRate: number;
}

export class MultiCurrencyEngine {
  static translate(amount: number, fromCurrency: string, toCurrency: string, rate: number): number {
    // Input validation
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('amount must be a finite number');
    }
    if (typeof fromCurrency !== 'string' || !/^[A-Z]{3}$/.test(fromCurrency)) {
      throw new Error('fromCurrency must be a valid 3-letter currency code');
    }
    if (typeof toCurrency !== 'string' || !/^[A-Z]{3}$/.test(toCurrency)) {
      throw new Error('toCurrency must be a valid 3-letter currency code');
    }
    if (typeof rate !== 'number' || !Number.isFinite(rate)) {
      throw new Error('rate must be a finite number');
    }
    if (rate < 0) {
      throw new Error('rate cannot be negative');
    }
    if (fromCurrency === toCurrency) return amount;
    if (rate === 0) return 0;
    // Deliberately NOT rounded to cents. `translate` is a general-purpose
    // conversion primitive that also feeds further computation, and not every
    // currency has 2 minor units (JPY has 0, KWD has 3). Premature rounding
    // here would bake a USD assumption into every downstream figure. The
    // multiplication is exact, so callers round once at their own reporting
    // boundary (see convertIncomeStatement / translateBalanceSheet, which do).
    return roundTo(multiplyMoney(amount, rate), RATE_PLACES);
  }

  static calculateTranslationGainLoss(amount: number, oldRate: number, newRate: number): number {
    // Input validation
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new Error('amount must be a finite number');
    }
    if (typeof oldRate !== 'number' || !Number.isFinite(oldRate)) {
      throw new Error('oldRate must be a finite number');
    }
    if (typeof newRate !== 'number' || !Number.isFinite(newRate)) {
      throw new Error('newRate must be a finite number');
    }
    if (oldRate < 0 || newRate < 0) {
      throw new Error('rates cannot be negative');
    }
    if (oldRate === 0) return 0;
    // The rate DELTA is taken in exact decimals first: in floats
    // 1000 * (1.15 - 1.10) === 49.99999999999982 rather than 50.
    return roundTo(multiplyMoney(amount, subtractMoney(newRate, oldRate)), CURRENCY_PLACES);
  }

  static getWeightedAverageRate(rates: ExchangeRate[]): number {
    // Input validation
    if (!Array.isArray(rates)) {
      throw new Error('rates must be an array');
    }
    if (rates.length === 0) return 0;
    for (const rate of rates) {
      if (typeof rate.rate !== 'number' || !Number.isFinite(rate.rate)) {
        throw new Error('Each rate must have a finite rate value');
      }
      if (rate.rate < 0) {
        throw new Error('Exchange rates cannot be negative');
      }
    }
    const total = sumMoney(rates.map((r) => r.rate));
    return roundTo(divideMoney(total, rates.length), RATE_PLACES);
  }

  static convertIncomeStatement(
    revenue: number,
    expenses: number,
    avgRate: number,
    closeRate: number
  ): { revenueUSD: number; expensesUSD: number; translationGainLoss: number } {
    // Input validation
    if (typeof revenue !== 'number' || !Number.isFinite(revenue)) {
      throw new Error('revenue must be a finite number');
    }
    if (typeof expenses !== 'number' || !Number.isFinite(expenses)) {
      throw new Error('expenses must be a finite number');
    }
    if (typeof avgRate !== 'number' || !Number.isFinite(avgRate)) {
      throw new Error('avgRate must be a finite number');
    }
    if (typeof closeRate !== 'number' || !Number.isFinite(closeRate)) {
      throw new Error('closeRate must be a finite number');
    }
    if (avgRate < 0 || closeRate < 0) {
      throw new Error('rates cannot be negative');
    }
    const netIncomeLocal = subtractMoney(revenue, expenses);

    return {
      revenueUSD: roundTo(multiplyMoney(revenue, avgRate), CURRENCY_PLACES),
      expensesUSD: roundTo(multiplyMoney(expenses, avgRate), CURRENCY_PLACES),
      translationGainLoss: roundTo(
        netIncomeLocal.times(subtractMoney(closeRate, avgRate)),
        CURRENCY_PLACES
      ),
    };
  }

  /**
   * ASC 830 — Translate a balance sheet using the current rate method.
   * Assets and liabilities at closing rate, equity at historical,
   * income/expense at average. CTA goes to OCI.
   */
  static translateBalanceSheet(
    items: Array<{
      name: string;
      type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
      localAmount: number;
    }>,
    closingRate: number,
    averageRate: number,
    historicalRate: number
  ): Array<{
    name: string;
    type: string;
    localAmount: number;
    translatedAmount: number;
    ctaAdjustment: number;
  }> {
    if (!Array.isArray(items)) throw new Error('items must be an array');
    if (!Number.isFinite(closingRate) || closingRate < 0) throw new Error('closingRate invalid');
    if (!Number.isFinite(averageRate) || averageRate < 0) throw new Error('averageRate invalid');
    if (!Number.isFinite(historicalRate) || historicalRate < 0)
      throw new Error('historicalRate invalid');

    return items.map((item) => {
      let rate: number;
      switch (item.type) {
        case 'asset':
        case 'liability':
          rate = closingRate;
          break;
        case 'equity':
          rate = historicalRate;
          break;
        case 'revenue':
        case 'expense':
          rate = averageRate;
          break;
        default:
          rate = closingRate;
      }
      const translatedAmount = multiplyMoney(item.localAmount, rate);
      const atHistorical = multiplyMoney(item.localAmount, historicalRate);
      // CTA is derived from the SAME exact decimals as the translated amount,
      // so the adjustment reconciles instead of carrying a float residue.
      const ctaAdjustment =
        item.type === 'equity' ? 0 : roundTo(translatedAmount.minus(atHistorical), CURRENCY_PLACES);
      return {
        name: item.name,
        type: item.type,
        localAmount: item.localAmount,
        translatedAmount: roundTo(translatedAmount, CURRENCY_PLACES),
        ctaAdjustment,
      };
    });
  }

  /**
   * Calculate total CTA (Cumulative Translation Adjustment) for OCI reporting.
   */
  static calculateTotalCTA(translatedItems: Array<{ ctaAdjustment: number }>): number {
    if (!Array.isArray(translatedItems)) return 0;
    return roundTo(sumMoney(translatedItems.map((i) => i.ctaAdjustment)), CURRENCY_PLACES);
  }

  /**
   * Remeasure a set of monetary/non-monetary items per ASC 830.
   * Monetary items at closing rate, non-monetary at historical.
   * Remeasurement gain/loss goes to income statement.
   */
  static remeasure(
    items: Array<{
      name: string;
      monetary: boolean;
      localAmount: number;
    }>,
    closingRate: number,
    historicalRate: number
  ): Array<{
    name: string;
    localAmount: number;
    functionalAmount: number;
    gainLoss: number;
  }> {
    if (!Array.isArray(items)) throw new Error('items must be an array');

    return items.map((item) => {
      const rate = item.monetary ? closingRate : historicalRate;
      const gainLoss = item.monetary
        ? this.calculateTranslationGainLoss(item.localAmount, historicalRate, closingRate)
        : 0;
      return {
        name: item.name,
        localAmount: item.localAmount,
        functionalAmount: roundTo(multiplyMoney(item.localAmount, rate), CURRENCY_PLACES),
        gainLoss,
      };
    });
  }
}
