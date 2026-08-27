/**
 * @fileoverview Construction sector metrics from GL entries (backlog, WIP, over/under billed)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category construction
 * @sector 14 (Construction)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 18th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */
import type { GLEntry } from '@/types';
import {
  addMoney,
  divideMoney,
  subtractMoney,
  sumMoney,
  roundTo,
  toDecimal,
  formatMoney,
} from '../utils/money';

export interface ConstructionStats {
  totalBacklog: number;
  revenueYTD: number;
  avgGrossMargin: number;
  wipValue: number;
  billings: number;
  overUnderBilled: number;
}

export interface ProjectData {
  id: string;
  name: string;
  client: string;
  status: string;
  budget: string;
  percentComplete: string;
  margin: string;
}

export interface BacklogTrend {
  month: string;
  backlog: number;
  new_orders: number;
  revenue: number;
}

export class ConstructionEngine {
  /**
   * Calculates construction metrics from GL entries.
   * Account code conventions:
   * - 45xx: Contract Revenue
   * - 46xx: Progress Billings
   * - 56xx: Construction Costs (COGS)
   * - 13xx: WIP / Costs in Excess
   * - 21xx: Billings in Excess
   */
  static calculateStats(entries: GLEntry[]): ConstructionStats {
    // Per-entry net amount: prefer e.amount; fall back to decimal-arithmetic
    // debit − credit. Wrapping in roundTo converts the Decimal to a number
    // for downstream `sumMoney` calls.
    const getAmount = (e: GLEntry): number =>
      e.amount ?? roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));
    // Sum each account class with exact decimal arithmetic so many GL lines do
    // not accumulate IEEE-754 drift. `sumMoney` over absolute amounts.
    const sumAbs = (prefix: string): number =>
      roundTo(
        sumMoney(
          entries
            .filter((e) => e.accountCode.startsWith(prefix))
            .map((e) => toDecimal(getAmount(e)).abs())
        )
      );

    const revenueYTD = sumAbs('45');
    const billings = sumAbs('46');
    const constructionCosts = sumAbs('56');
    const wipValue = sumAbs('13');

    // totalBacklog = wipValue + revenueYTD * 1.5 (WIP-based backlog estimate).
    const totalBacklog = roundTo(addMoney(wipValue, toDecimal(revenueYTD).times(1.5)));
    const avgGrossMargin =
      revenueYTD > 0
        ? roundTo(subtractMoney(revenueYTD, constructionCosts).div(revenueYTD).times(100), 4)
        : 0;
    const overUnderBilled = roundTo(subtractMoney(billings, wipValue));

    return {
      totalBacklog,
      revenueYTD,
      avgGrossMargin,
      wipValue,
      billings,
      overUnderBilled,
    };
  }

  /**
   * Returns active project portfolio from GL entries.
   */
  static getProjectPortfolio(entries: GLEntry[]): ProjectData[] {
    // Derive projects from unique entity/department combos
    const projectMap = new Map<string, { revenue: number; costs: number }>();

    const getAmount = (e: GLEntry): number =>
      e.amount ?? roundTo(subtractMoney(e.debit ?? 0, e.credit ?? 0));

    for (const e of entries) {
      if (!e.accountCode.startsWith('45') && !e.accountCode.startsWith('56')) continue;
      const key = e.departmentId ?? e.entityId ?? 'default';
      const existing = projectMap.get(key) ?? { revenue: 0, costs: 0 };
      const amt = toDecimal(getAmount(e)).abs();
      if (e.accountCode.startsWith('45')) {
        existing.revenue = addMoney(existing.revenue, amt).toNumber();
      } else {
        existing.costs = addMoney(existing.costs, amt).toNumber();
      }
      projectMap.set(key, existing);
    }

    const defaultProjects = [
      { id: 'P-01', name: 'General Project', client: 'Imported Data' },
      { id: 'P-02', name: 'Active Contract', client: 'GL Import' },
    ];

    const projects: ProjectData[] = [];
    let idx = 0;
    for (const [, data] of projectMap) {
      const def = defaultProjects[idx] ?? {
        id: `P-${idx + 1}`,
        name: `Project ${idx + 1}`,
        client: 'Imported',
      };
      const margin =
        data.revenue > 0
          ? roundTo(subtractMoney(data.revenue, data.costs).div(data.revenue).times(100), 1)
          : 0;
      const pct =
        data.revenue > 0
          ? Math.min(100, Math.round(toDecimal(data.costs).div(data.revenue).times(100).toNumber()))
          : 0;
      projects.push({
        id: def.id,
        name: def.name,
        client: def.client,
        status: pct >= 100 ? 'Completed' : pct >= 50 ? 'In Progress' : 'In Progress',
        budget: `$${formatMoney(divideMoney(toDecimal(data.revenue), toDecimal(1_000_000)), { places: 1 })}M`,
        percentComplete: `${pct}%`,
        margin: `${formatMoney(margin, { places: 1 })}%`,
      });
      idx++;
    }

    return projects;
  }

  /**
   * Buckets measured construction revenue by posting period (YYYY-MM).
   * Backlog and new order metrics require operational project-management feeds;
   * where those feeds are absent, they remain 0 rather than fabricated noise.
   */
  static getBacklogTrend(entries: GLEntry[]): BacklogTrend[] {
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
      const revenue = sumMoney(
        revEntries.map((e) =>
          Math.abs(e.amount ?? subtractMoney(e.debit ?? 0, e.credit ?? 0).toNumber())
        )
      ).toNumber();
      return {
        month,
        backlog: 0,
        new_orders: 0,
        revenue: roundTo(revenue, 2),
      };
    });
  }
}
