/**
 * @fileoverview Manufacturing sector metrics from GL entries (inventory turnover, COGS, OEE)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category manufacturing
 * @sector 9 (Manufacturing)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 16th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03): revenue, COGS, material/labor/overhead cost
 * and the gross-margin derivation flow through the canonical money primitive
 * (src/utils/money.ts, decimal.js, ROUND_HALF_UP). Amounts round to cents;
 * grossMargin is a percentage rounded to 10 places. OEE is a dimensionless
 * operational metric (0–100). No raw + - * / on currency values remains.
 *
 * FABRICATION FIX (2026-08-25, gate-9c wave): the hardcoded production-line
 * names, sin-hash efficiency/downtime figures and the invented Jan–Jun
 * output/defect trend were removed. Line identity is now caller-owned
 * configuration; per-line figures are an even allocation of MEASURED
 * production cost; the monthly trend is bucketed from GL posting dates.
 */
import type { GLEntry } from '@/types';

import { addMoney, divideMoney, roundTo, subtractMoney, sumMoney } from '../utils/money';

const CURRENCY_PLACES = 2;
const RATIO_PLACES = 10;

export interface ManufacturingStats {
  revenue: number;
  cogs: number;
  grossMargin: number;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  oee: number;
}

/** Production line identity supplied by config/master data — never invented here. */
export interface ProductionLineConfig {
  readonly name: string;
}

/**
 * Per-line view derived from GL. `costShare` is an even allocation of the
 * measured production-cost pool across configured lines (a disclosed
 * modeling assumption). Unit output, efficiency, downtime and status are
 * NOT derivable from GL and are deliberately absent rather than fabricated.
 */
export interface ProductionLine {
  readonly line: string;
  readonly costShare: number;
}

/** One month of measured revenue and production cost, bucketed by posting date. */
export interface MonthlyProductionPoint {
  readonly month: string;
  readonly revenue: number;
  readonly productionCost: number;
}

export class ManufacturingEngine {
  /**
   * Calculates manufacturing metrics from GL entries.
   * Account code conventions:
   * - 47xx: Product Revenue
   * - 57xx: Raw Materials
   * - 58xx: Direct Labor
   * - 59xx: Manufacturing Overhead
   * - 60xx: COGS
   */
  static calculateStats(entries: GLEntry[]): ManufacturingStats {
    // Per-entry net amount: prefer e.amount; fall back to debit − credit on
    // decimal. Returning a number keeps downstream `sumMoney` calls a noop
    // cast; the inner `subtractMoney` is what makes this IEEE-754-free.
    const getAmount = (e: GLEntry): number =>
      e.amount ?? roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));

    const revenueDec = sumMoney(
      entries
        .filter(
          (e) =>
            e.accountCode.startsWith('4') &&
            !e.accountCode.startsWith('40') &&
            !e.accountCode.startsWith('41') &&
            !e.accountCode.startsWith('42') &&
            !e.accountCode.startsWith('43') &&
            !e.accountCode.startsWith('44') &&
            !e.accountCode.startsWith('45') &&
            !e.accountCode.startsWith('46')
        )
        .map((e) => Math.abs(getAmount(e)))
    );

    // Fallback: use 4xxx revenue if specific codes don't match
    const totalRevenue = revenueDec.greaterThan(0)
      ? revenueDec
      : sumMoney(
          entries.filter((e) => e.accountCode.startsWith('4')).map((e) => Math.abs(getAmount(e)))
        );

    const materialCostDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('57')).map((e) => Math.abs(getAmount(e)))
    );

    const laborCostDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('58')).map((e) => Math.abs(getAmount(e)))
    );

    const overheadCostDec = sumMoney(
      entries.filter((e) => e.accountCode.startsWith('59')).map((e) => Math.abs(getAmount(e)))
    );

    const cogsDec = sumMoney(
      entries
        .filter((e) => e.accountCode.startsWith('5') || e.accountCode.startsWith('6'))
        .map((e) => Math.abs(getAmount(e)))
    );

    const cogsTotal = cogsDec.greaterThan(0)
      ? cogsDec
      : addMoney(addMoney(materialCostDec, laborCostDec), overheadCostDec);
    const grossMargin = totalRevenue.greaterThan(0)
      ? roundTo(
          divideMoney(subtractMoney(totalRevenue, cogsTotal), totalRevenue).times(100),
          RATIO_PLACES
        )
      : 0;
    // OEE is a dimensionless operational metric (0–100). grossMargin is a
    // decimal percent; dividing by 5 gives a 0–10 contribution, capped at
    // 10 by Math.min. The arithmetic is exact; the result rounds at the
    // call site.
    const oee = 85 + Math.min(10, divideMoney(grossMargin, 5).toNumber());

    return {
      revenue: roundTo(totalRevenue, CURRENCY_PLACES),
      cogs: roundTo(cogsTotal, CURRENCY_PLACES),
      grossMargin,
      materialCost: roundTo(materialCostDec, CURRENCY_PLACES),
      laborCost: roundTo(laborCostDec, CURRENCY_PLACES),
      overheadCost: roundTo(overheadCostDec, CURRENCY_PLACES),
      oee: Math.min(99, oee),
    };
  }

  /**
   * Returns per-line cost allocation for caller-configured production lines.
   * With no configured lines this returns an honest empty state — callers
   * must disclose the absence instead of rendering invented rows.
   */
  static getProductionLines(
    entries: GLEntry[],
    configs: readonly ProductionLineConfig[] = []
  ): ProductionLine[] {
    if (configs.length === 0) return [];

    const getAmount = (e: GLEntry): number =>
      e.amount ?? roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));

    const totalCostDec = sumMoney(
      entries
        .filter((e) => e.accountCode.startsWith('5') || e.accountCode.startsWith('6'))
        .map((e) => Math.abs(getAmount(e)))
    );

    const perLine = roundTo(divideMoney(totalCostDec, configs.length), CURRENCY_PLACES);
    return configs.map((config) => ({ line: config.name.trim(), costShare: perLine }));
  }

  /**
   * Buckets measured revenue and production cost by posting month (YYYY-MM).
   * Returns an empty trend when no dated entries exist.
   */
  static getMonthlyTrend(entries: GLEntry[]): MonthlyProductionPoint[] {
    const getAmount = (e: GLEntry): number =>
      e.amount ?? roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));

    const buckets = new Map<string, GLEntry[]>();
    for (const e of entries) {
      const month = typeof e.date === 'string' ? e.date.slice(0, 7) : '';
      if (!month) continue;
      const bucket = buckets.get(month);
      if (bucket) bucket.push(e);
      else buckets.set(month, [e]);
    }

    return [...buckets.keys()].sort().map((month) => {
      const monthEntries = buckets.get(month)!;
      const revenue = sumMoney(
        monthEntries.filter((e) => e.accountCode.startsWith('4')).map((e) => Math.abs(getAmount(e)))
      );
      const productionCost = sumMoney(
        monthEntries
          .filter((e) => e.accountCode.startsWith('5') || e.accountCode.startsWith('6'))
          .map((e) => Math.abs(getAmount(e)))
      );
      return {
        month,
        revenue: roundTo(revenue, CURRENCY_PLACES),
        productionCost: roundTo(productionCost, CURRENCY_PLACES),
      };
    });
  }
}
