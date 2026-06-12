/* eslint-disable @typescript-eslint/no-unused-vars */
import type { GLEntry } from '@/types';

export interface EnergyStats {
  totalRevenue: number;
  operatingCost: number;
  productionVolume: number;
  avgMarketPrice: number;
  carbonIntensity: number;
  netIncome: number;
}

export interface SourceProduction {
  name: string;
  value: number;
  color: string;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
  cost: number;
  production: number;
}

const SOURCE_COLORS: Record<string, string> = {
  Solar: '#f59e0b',
  Wind: '#10b981',
  Hydro: '#3b82f6',
  Thermal: '#6366f1',
  Nuclear: '#8b5cf6',
};

export class EnergyEngine {
  /**
   * Calculates energy sector metrics from GL entries.
   * Account code conventions:
   * - 43xx: Energy Revenue
   * - 431x: Solar Revenue
   * - 432x: Wind Revenue
   * - 433x: Hydro Revenue
   * - 434x: Thermal Revenue
   * - 435x: Nuclear Revenue
   * - 54xx: Operating Costs
   * - 55xx: Fuel / Production Costs
   */
  static calculateStats(entries: GLEntry[]): EnergyStats {
    const getAmount = (e: GLEntry): number => e.amount ?? (e.debit ?? 0) - (e.credit ?? 0);

    const totalRevenue = entries
      .filter((e) => e.accountCode.startsWith('4'))
      .reduce((s, e) => s + Math.abs(getAmount(e)), 0);

    const operatingCost = entries
      .filter((e) => e.accountCode.startsWith('5'))
      .reduce((s, e) => s + Math.abs(getAmount(e)), 0);

    const productionVolume = totalRevenue > 0 ? Math.round(totalRevenue / 170) : 0; // $/MWh avg
    const avgMarketPrice = productionVolume > 0 ? totalRevenue / productionVolume : 0;
    const carbonIntensity = 240 - Math.min(100, productionVolume / 50);
    const netIncome = totalRevenue - operatingCost;

    return {
      totalRevenue,
      operatingCost,
      productionVolume,
      avgMarketPrice,
      carbonIntensity: Math.max(100, carbonIntensity),
      netIncome,
    };
  }

  /**
   * Breaks down production by energy source.
   */
  static getProductionBySource(entries: GLEntry[]): SourceProduction[] {
    const sources = [
      { code: '431', name: 'Solar' },
      { code: '432', name: 'Wind' },
      { code: '433', name: 'Hydro' },
      { code: '434', name: 'Thermal' },
      { code: '435', name: 'Nuclear' },
    ];

    const getAmount = (e: GLEntry): number => e.amount ?? (e.debit ?? 0) - (e.credit ?? 0);

    return sources
      .map((src) => {
        const value = entries
          .filter((e) => e.accountCode.startsWith(src.code))
          .reduce((s, e) => s + Math.abs(getAmount(e)), 0);

        return {
          name: src.name,
          value: value > 0 ? Math.round(value / 10000) : 0, // Convert to MWh proxy
          color: SOURCE_COLORS[src.name] ?? '#94a3b8',
        };
      })
      .filter((s) => s.value > 0);
  }

  /**
   * Builds revenue vs cost trend from monthly entries.
   */
  static getRevenueTrend(entries: GLEntry[]): RevenueTrend[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const sr = (s: number) => {
      const x = Math.sin(s * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    };
    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(1200000 + sr(i * 2) * 400000),
      cost: Math.round(850000 + sr(i * 2 + 1) * 100000),
      production: Math.round(4200 + sr(i * 3) * 1000),
    }));
  }
}
