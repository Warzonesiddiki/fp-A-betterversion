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
    const getAmount = (e: GLEntry): number => {
      if (e.amount !== undefined) return e.amount;
      return roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));
    };

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

    const getAmount = (e: GLEntry): number => {
      if (e.amount !== undefined) return e.amount;
      return roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));
    };

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
   * Buckets measured energy revenue (4xxx) and generation costs (5xxx/6xxx) by posting month.
   */
  static getRevenueTrend(entries: GLEntry[]): RevenueTrend[] {
    const buckets = new Map<string, GLEntry[]>();
    for (const e of entries) {
      const month = e.period || (typeof e.date === 'string' ? e.date.slice(0, 7) : '');
      if (!month) continue;
      const bucket = buckets.get(month);
      if (bucket) bucket.push(e);
      else buckets.set(month, [e]);
    }

    return [...buckets.keys()].sort().map((month) => {
      const monthEntries = buckets.get(month)!;
      const revEntries = monthEntries.filter((e) => e.accountCode.startsWith('4'));
      const costEntries = monthEntries.filter(
        (e) => e.accountCode.startsWith('5') || e.accountCode.startsWith('6')
      );
      const revenue = sumMoney(
        revEntries.map((e) =>
          Math.abs(e.amount ?? subtractMoney(e.debit ?? 0, e.credit ?? 0).toNumber())
        )
      ).toNumber();
      const cost = sumMoney(
        costEntries.map((e) =>
          Math.abs(e.amount ?? subtractMoney(e.debit ?? 0, e.credit ?? 0).toNumber())
        )
      ).toNumber();
      return {
        month,
        revenue: roundTo(revenue, 2),
        cost: roundTo(cost, 2),
        production: 0,
      };
    });
  }
}
