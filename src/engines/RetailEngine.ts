// @money-ast-allow Reason: Sort comparator: b.netProfit - a.netProfit returns sign for Array.sort(), not a money result
import type { GLEntry } from '@/types';
import { divideMoney, roundTo, subtractMoney, sumMoney } from '../utils/money';

/**
 * Store-level P&L figures (revenue, COGS, gross/net profit) are reported
 * amounts, so all arithmetic runs through the canonical money primitive
 * (decimal.js, ROUND_HALF_UP) and rounds to cents. Margin percentages keep more
 * precision but derive from exact decimals.
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

export interface StoreStats {
  id: string;
  name: string;
  revenue: number;
  labor: number;
  cogs: number;
  occupancy: number;
  grossProfit: number;
  netProfit: number;
  margin: number;
  laborPercent: number;
  rank: number;
}

export interface RetailDashboardStats {
  avgRevenuePerStore: number;
  avgNetMargin: number;
  salesPerLaborHour: number;
  avgCustSat: number;
}

export class RetailEngine {
  /**
   * Calculates Store Performance metrics from GL entries
   * Assumption:
   * - 4xxx: Revenue
   * - 50xx: COGS
   * - 51xx: Labor Cost
   * - 52xx: Occupancy Cost
   */
  static getStoreBreakdown(entries: GLEntry[]): StoreStats[] {
    const entityIds = Array.from(new Set(entries.map((e) => e.entityId))).filter(
      (id): id is string => id != null
    );

    const stats = entityIds
      .map((id) => {
        const eEntries = entries.filter((e) => e.entityId === id);
        const name = eEntries[0]?.accountName || `Store ${id}`;

        const revenue = sumByPrefix(eEntries, '4');
        const cogs = sumByPrefix(eEntries, '50');
        const labor = sumByPrefix(eEntries, '51');
        const occupancy = sumByPrefix(eEntries, '52');

        const netProfit = revenue.minus(cogs).minus(labor).minus(occupancy);
        const hasRevenue = revenue.gt(0);

        return {
          id,
          name,
          revenue: roundTo(revenue, CURRENCY_PLACES),
          labor: roundTo(labor, CURRENCY_PLACES),
          cogs: roundTo(cogs, CURRENCY_PLACES),
          occupancy: roundTo(occupancy, CURRENCY_PLACES),
          grossProfit: roundTo(revenue.minus(cogs), CURRENCY_PLACES),
          netProfit: roundTo(netProfit, CURRENCY_PLACES),
          margin: hasRevenue
            ? roundTo(divideMoney(netProfit, revenue).times(100), RATIO_PLACES)
            : 0,
          laborPercent: hasRevenue
            ? roundTo(divideMoney(labor, revenue).times(100), RATIO_PLACES)
            : 0,
          rank: 0,
        };
      })
      .filter((s) => s.revenue > 0);

    // Rank by Net Profit
    return stats.sort((a, b) => b.netProfit - a.netProfit).map((s, i) => ({ ...s, rank: i + 1 }));
  }

  static calculateDashboardStats(entries: GLEntry[]): RetailDashboardStats {
    const stores = this.getStoreBreakdown(entries);
    if (stores.length === 0)
      return { avgRevenuePerStore: 0, avgNetMargin: 0, salesPerLaborHour: 0, avgCustSat: 92.8 };

    const totalRevenue = sumMoney(stores.map((s) => s.revenue));
    const totalProfit = sumMoney(stores.map((s) => s.netProfit));

    return {
      avgRevenuePerStore: roundTo(divideMoney(totalRevenue, stores.length), CURRENCY_PLACES),
      // getStoreBreakdown only keeps stores with revenue > 0, so totalRevenue
      // cannot be zero here; the guard is kept so the invariant is explicit
      // rather than assumed.
      avgNetMargin: totalRevenue.isZero()
        ? 0
        : roundTo(divideMoney(totalProfit, totalRevenue).times(100), RATIO_PLACES),
      salesPerLaborHour: 254, // Needs operational data
      avgCustSat: 92.8,
    };
  }

  static getPnLTrend(entries: GLEntry[]): Array<{
    month: string;
    revenue: number;
    grossProfit: number;
    labor: number;
  }> {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const revenue = sumByPrefix(pEntries, '4');
      const cogs = sumByPrefix(pEntries, '50');

      return {
        month: period,
        revenue: roundTo(revenue, CURRENCY_PLACES),
        grossProfit: roundTo(subtractMoney(revenue, cogs), CURRENCY_PLACES),
        labor: roundTo(sumByPrefix(pEntries, '51'), CURRENCY_PLACES),
      };
    });
  }
}
