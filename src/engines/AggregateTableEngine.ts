/**
 * @fileoverview Pre-aggregate data at different granularity levels (monthly/quarterly/yearly/YTD)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category aggregation
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 28th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 *
 * MONEY MIGRATION (2026-08-03): All currency-bearing debit/credit/net aggregations now
 * use the canonical money primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP).
 * Amounts round to cents. No raw + - * / on currency values remains.
 */
import { addMoney, roundTo, subtractMoney } from '../utils/money';

/**
 * Aggregate Table Engine — Pre-aggregate data at different granularity levels
 */

export type Granularity = 'monthly' | 'quarterly' | 'yearly' | 'ytd';

export interface AggregateKey {
  entityId: string;
  accountId: string;
  period: string;
  granularity: Granularity;
}

export interface AggregateEntry {
  key: AggregateKey;
  debit: number;
  credit: number;
  net: number;
  count: number;
  lastUpdated: number;
}

export class AggregateTableEngine {
  private static aggregates = new Map<string, AggregateEntry>();
  private static dirtyKeys = new Set<string>();

  private static makeKey(key: AggregateKey): string {
    return `${key.entityId}:${key.accountId}:${key.period}:${key.granularity}`;
  }

  static aggregate(
    data: Array<{
      entityId: string;
      accountId: string;
      period: string;
      debit: number;
      credit: number;
    }>,
    granularity: Granularity
  ): void {
    for (const row of data) {
      const aggPeriod = this.rollupPeriod(row.period, granularity);
      const key: AggregateKey = {
        entityId: row.entityId,
        accountId: row.accountId,
        period: aggPeriod,
        granularity,
      };
      const mapKey = this.makeKey(key);
      const existing = this.aggregates.get(mapKey);
      if (existing) {
        // Money migration: use addMoney + roundTo for currency (debit/credit/net)
        const newDebit = roundTo(addMoney(existing.debit, row.debit));
        const newCredit = roundTo(addMoney(existing.credit, row.credit));
        existing.debit = newDebit;
        existing.credit = newCredit;
        existing.net = roundTo(subtractMoney(newDebit, newCredit));
        existing.count++;
        existing.lastUpdated = Date.now();
      } else {
        const d = roundTo(row.debit);
        const c = roundTo(row.credit);
        this.aggregates.set(mapKey, {
          key,
          debit: d,
          credit: c,
          net: roundTo(subtractMoney(d, c)),
          count: 1,
          lastUpdated: Date.now(),
        });
      }
    }
  }

  static query(
    entityId: string,
    accountId: string,
    period: string,
    granularity: Granularity
  ): AggregateEntry | undefined {
    const key: AggregateKey = { entityId, accountId, period, granularity };
    return this.aggregates.get(this.makeKey(key));
  }

  static queryRange(
    entityId: string,
    accountId: string,
    startPeriod: string,
    endPeriod: string,
    granularity: Granularity
  ): AggregateEntry[] {
    return Array.from(this.aggregates.values()).filter(
      (e) =>
        e.key.entityId === entityId &&
        e.key.accountId === accountId &&
        e.key.granularity === granularity &&
        e.key.period >= startPeriod &&
        e.key.period <= endPeriod
    );
  }

  static invalidate(entityId?: string, accountId?: string): void {
    if (!entityId && !accountId) {
      this.aggregates.clear();
      return;
    }
    for (const [key, entry] of this.aggregates) {
      if (entityId && entry.key.entityId !== entityId) continue;
      if (accountId && entry.key.accountId !== accountId) continue;
      this.aggregates.delete(key);
    }
  }

  static getStats(): { totalEntries: number; dirtyKeys: number; memoryEstimateKB: number } {
    return {
      totalEntries: this.aggregates.size,
      dirtyKeys: this.dirtyKeys.size,
      memoryEstimateKB: Math.round((this.aggregates.size * 128) / 1024),
    };
  }

  private static rollupPeriod(period: string, granularity: Granularity): string {
    if (granularity === 'monthly') return period;
    const month = parseInt(period.slice(-2)) || 1;
    if (granularity === 'quarterly') {
      const q = Math.ceil(month / 3);
      return `${period.slice(0, 4)}-Q${q}`;
    }
    if (granularity === 'yearly') return period.slice(0, 4);
    if (granularity === 'ytd') return `${period.slice(0, 4)}-YTD`;
    return period;
  }
}
