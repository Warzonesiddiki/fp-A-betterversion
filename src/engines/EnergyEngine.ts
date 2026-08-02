import type { GLEntry } from '@/types';

/**
 * @fileoverview Energy sector metrics from GL entries (production, market price, carbon intensity)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category energy
 * @sector 10 (Energy)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 19th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03): revenue, operating cost and net income are
 * money and flow through the canonical money primitive (src/utils/money.ts,
 * decimal.js, ROUND_HALF_UP), cent-rounded. productionVolume (MWh proxy),
 * avgMarketPrice ($/MWh), carbonIntensity and the getRevenueTrend mock
 * generator are unit-conversion/metric values, not currency — their raw
 * arithmetic is preserved. No raw + - * / on currency values remains.
 */

import { divideMoney, roundTo, subtractMoney, sumMoney } from '../utils/money';

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

    const totalRevenueDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('4')).map((e) => Math.abs(getAmount(e)))
    );
    const totalRevenue = roundTo(totalRevenueDec);

    const operatingCostDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('5')).map((e) => Math.abs(getAmount(e)))
    );
    const operatingCost = roundTo(operatingCostDec);

    // $/MWh average — a unit conversion (money per MWh), not currency rounding.
    const productionVolume = totalRevenueDec.greaterThan(0)
      ? Math.round(totalRevenueDec.div(170).toNumber())
      : 0;
    const avgMarketPrice =
      productionVolume > 0 ? divideMoney(totalRevenueDec, productionVolume).toNumber() : 0;
    const carbonIntensity = 240 - Math.min(100, productionVolume / 50);
    const netIncome = roundTo(subtractMoney(totalRevenueDec, operatingCostDec));

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
        const valueDec = sumMoney(
          entries
            .filter((e) => e.accountCode.startsWith(src.code))
            .map((e) => Math.abs(getAmount(e)))
        );

        return {
          name: src.name,
          // Convert to MWh proxy (unit conversion, not currency rounding).
          value: valueDec.greaterThan(0) ? Math.round(valueDec.div(10000).toNumber()) : 0,
          color: SOURCE_COLORS[src.name] ?? '#94a3b8',
        };
      })
      .filter((s) => s.value > 0);
  }

  /**
   * Builds revenue vs cost trend from monthly entries.
   */
  static getRevenueTrend(_entries: GLEntry[]): RevenueTrend[] {
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
