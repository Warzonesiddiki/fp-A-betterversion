import type { GLEntry } from '@/types/sector-types';

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
    const entityIds = Array.from(new Set(entries.map((e) => e.entityId)));

    const stats = entityIds
      .map((id) => {
        const eEntries = entries.filter((e) => e.entityId === id);
        const name = eEntries[0]?.accountName || `Store ${id}`;

        const revenue = eEntries
          .filter((e) => e.accountCode.startsWith('4'))
          .reduce((acc, e) => acc + e.amount, 0);
        const cogs = eEntries
          .filter((e) => e.accountCode.startsWith('50'))
          .reduce((acc, e) => acc + e.amount, 0);
        const labor = eEntries
          .filter((e) => e.accountCode.startsWith('51'))
          .reduce((acc, e) => acc + e.amount, 0);
        const occupancy = eEntries
          .filter((e) => e.accountCode.startsWith('52'))
          .reduce((acc, e) => acc + e.amount, 0);

        const grossProfit = revenue - cogs;
        const netProfit = revenue - cogs - labor - occupancy;
        const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
        const laborPercent = revenue > 0 ? (labor / revenue) * 100 : 0;

        return {
          id,
          name,
          revenue,
          labor,
          cogs,
          occupancy,
          grossProfit,
          netProfit,
          margin,
          laborPercent,
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

    const totalRevenue = stores.reduce((acc, s) => acc + s.revenue, 0);
    const totalProfit = stores.reduce((acc, s) => acc + s.netProfit, 0);

    return {
      avgRevenuePerStore: totalRevenue / stores.length,
      avgNetMargin: (totalProfit / totalRevenue) * 100,
      salesPerLaborHour: 254, // Needs operational data
      avgCustSat: 92.8,
    };
  }

  static getPnLTrend(entries: GLEntry[]): Array<{
    period: string;
    revenue: number;
    cogs: number;
    grossMargin: number;
    opex: number;
    ebitda: number;
  }> {
    const periods = Array.from(new Set(entries.map((e) => e.date.substring(0, 7)))).sort();
    return periods.slice(-6).map((period) => {
      const pEntries = entries.filter((e) => e.date.startsWith(period));
      const revenue = pEntries
        .filter((e) => e.accountCode.startsWith('4'))
        .reduce((acc, e) => acc + e.amount, 0);
      const cogs = pEntries
        .filter((e) => e.accountCode.startsWith('50'))
        .reduce((acc, e) => acc + e.amount, 0);
      const labor = pEntries
        .filter((e) => e.accountCode.startsWith('51'))
        .reduce((acc, e) => acc + e.amount, 0);

      return {
        month: period,
        revenue,
        grossProfit: revenue - cogs,
        labor,
      };
    });
  }
}
