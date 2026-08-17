import type { GLEntry } from '@/types';
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
} from '../utils/money';

/**
 * REIT and property-portfolio figures (NOI, cap rate, FFO/AFFO, NAV, LTV) are
 * reported metrics, so all arithmetic runs through the canonical money
 * primitive (decimal.js, ROUND_HALF_UP). Amounts round to cents; percentages
 * and per-share figures keep more precision but derive from exact decimals.
 *
 * MONEY MIGRATION (2026-08-02): Fully migrated — all currency paths now use
 * src/utils/money.ts with cent rounding. No raw + - * / on amounts.
 */
const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

/** Exact sum of `amount` over entries whose account code matches `prefix`. */
function sumByPrefix(entries: readonly GLEntry[], prefix: string) {
  return sumMoney(entries.filter((e) => e.accountCode.startsWith(prefix)).map((e) => e.amount));
}

export interface PropertyStats {
  costBasis: number;
  marketValue: number;
  unrealizedGain: number;
  ltv: number;
  totalProperties: number;
  avgHoldingPeriod: number;
}

export interface PropertyItem {
  id: string;
  name: string;
  location: string;
  status: string;
  purchasePrice: number;
  currentVal: number;
  yield: number;
  renovation: string;
}

export interface REITStats {
  ffo: number;
  /**
   * AFFO, NAV/share and dividend yield require maintenance capex, a share
   * count and a share price. The posted GL does not carry those, so these
   * are `null` rather than estimated (K18).
   */
  affo: number | null;
  navPerShare: number | null;
  payoutRatio: number | null;
  dividendYield: number | null;
  /** FFO / |dividends| when dividends are posted; otherwise null. */
  dividendCoverage: number | null;
  dividends: number;
}

export interface RealEstateDashboardStats {
  fairValue: number;
  noi: number;
  occupancy: number;
  capRate: number;
}

export class RealEstateEngine {
  /**
   * Calculates Property Portfolio metrics from GL entries
   * Assumption:
   * - 15xx: Property Acquisition Cost (Asset)
   * - 16xx: Property Market Valuation (Asset)
   * - 25xx: Real Estate Debt (Liability)
   */
  static calculatePortfolioStats(entries: GLEntry[]): PropertyStats {
    const costBasis = sumByPrefix(entries, '15');
    const marketValue = sumByPrefix(entries, '16');
    const totalDebt = sumByPrefix(entries, '25').abs();

    // Count unique entities as properties
    const totalProperties = new Set(entries.map((e) => e.entityId)).size;

    return {
      costBasis: roundTo(costBasis, CURRENCY_PLACES),
      marketValue: roundTo(marketValue, CURRENCY_PLACES),
      unrealizedGain: roundTo(subtractMoney(marketValue, costBasis), CURRENCY_PLACES),
      ltv: marketValue.lte(0)
        ? 0
        : roundTo(multiplyMoney(divideMoney(totalDebt, marketValue), 100), RATIO_PLACES),
      totalProperties,
      avgHoldingPeriod: 4.2, // Mocked for now
    };
  }

  static calculateDashboardStats(entries: GLEntry[]): RealEstateDashboardStats {
    const noi = subtractMoney(sumByPrefix(entries, '40'), sumByPrefix(entries, '50'));
    const portfolio = this.calculatePortfolioStats(entries);

    return {
      fairValue: portfolio.marketValue,
      noi: roundTo(noi, CURRENCY_PLACES),
      occupancy: 94.8, // Mocked
      capRate:
        portfolio.marketValue > 0
          ? roundTo(multiplyMoney(divideMoney(noi, portfolio.marketValue), 100), RATIO_PLACES)
          : 0,
    };
  }

  /**
   * Calculates REIT specific metrics
   * Assumption:
   * - 40xx: Rental Income
   * - 50xx: Property Operating Expenses
   * - 60xx: Depreciation & Amortization
   * - 70xx: Interest Expense
   * - 80xx: Dividends Paid
   */
  static calculateREITStats(entries: GLEntry[]): REITStats {
    const rentalIncome = sumByPrefix(entries, '40');
    const opex = sumByPrefix(entries, '50');
    const depAmort = sumByPrefix(entries, '60');
    const interest = sumByPrefix(entries, '70');
    const dividends = sumByPrefix(entries, '80').abs();

    const netIncome = subtractMoney(
      subtractMoney(subtractMoney(rentalIncome, opex), depAmort),
      interest
    );

    // FFO = Net Income + Depreciation + Amortization (NAREIT definition).
    const ffo = addMoney(netIncome, depAmort);

    // AFFO needs posted maintenance capex. Inventing it as 10% of rental
    // income was a Severity-0 fabrication. NAV/share needs a share count;
    // dividend yield needs a share price. All three are omitted.
    const payoutRatio = ffo.lte(0)
      ? null
      : roundTo(multiplyMoney(divideMoney(dividends, ffo), 100), RATIO_PLACES);
    const dividendCoverage = dividends.lte(0)
      ? null
      : roundTo(divideMoney(ffo, dividends), RATIO_PLACES);

    return {
      ffo: roundTo(ffo, CURRENCY_PLACES),
      affo: null,
      navPerShare: null,
      payoutRatio,
      dividendYield: null,
      dividendCoverage,
      dividends: roundTo(dividends, CURRENCY_PLACES),
    };
  }

  static getPropertyBreakdown(entries: GLEntry[]): PropertyItem[] {
    // Group by entityId
    const entityIds = Array.from(new Set(entries.map((e) => e.entityId))).filter(
      (id): id is string => id !== undefined
    );

    return entityIds
      .map((id) => {
        const eEntries = entries.filter((e) => e.entityId === id);
        const name = eEntries[0]?.accountName || 'Unknown Property';

        const cost = roundTo(sumByPrefix(eEntries, '15'), CURRENCY_PLACES);
        const market = roundTo(sumByPrefix(eEntries, '16'), CURRENCY_PLACES);

        return {
          id,
          name,
          location: 'TBD', // Needs metadata
          status: cost > 10000000 ? 'Core' : 'Value-Add',
          purchasePrice: cost,
          currentVal: market,
          yield: 6.2, // Mocked
          renovation: 'None',
        };
      })
      .filter((p) => p.purchasePrice > 0);
  }
}
