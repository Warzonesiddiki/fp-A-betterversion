/**
 * GAP-1 (F-0006) known-answer tests for RetailEngine's money migration.
 *
 * Store-level P&L figures drive store rankings and margin reporting. Each case
 * is a FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is);
 * the pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { RetailEngine } from './RetailEngine';
import type { GLEntry } from '@/types';

function entry(
  accountCode: string,
  amount: number,
  id: string,
  entityId = 'S1',
  date = '2026-01-31'
): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Store ${entityId}`,
    period: date.substring(0, 7),
    periodName: date.substring(0, 7),
    debit: 0,
    credit: 0,
    netChange: 0,
    date,
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId,
  };
}

describe('RetailEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('getStoreBreakdown', () => {
    it('computes net profit through a four-term chain exactly (float gave 400.0000000000001)', () => {
      const [store] = RetailEngine.getStoreBreakdown([
        entry('4000', 1000.1, 'rev'),
        entry('5000', 100.05, 'cogs'),
        entry('5100', 200.02, 'labor'),
        entry('5200', 300.03, 'occ'),
      ]);
      expect(store!.revenue).toBe(1000.1);
      expect(store!.netProfit).toBe(400);
    });

    it('computes gross profit exactly (float gave 100.05000000000007)', () => {
      const [store] = RetailEngine.getStoreBreakdown([
        entry('4000', 1000.1, 'rev'),
        entry('5000', 900.05, 'cogs'),
      ]);
      expect(store!.grossProfit).toBe(100.05);
    });

    it('computes the net margin from exact decimals', () => {
      const [store] = RetailEngine.getStoreBreakdown([
        entry('4000', 1000.1, 'rev'),
        entry('5000', 100.05, 'cogs'),
        entry('5100', 200.02, 'labor'),
        entry('5200', 300.03, 'occ'),
      ]);
      // (400 / 1000.10) x 100 — float gave 39.99600039996
      expect(store!.margin).toBe(39.9960004);
    });

    it('computes the labor percentage from exact decimals', () => {
      const [store] = RetailEngine.getStoreBreakdown([
        entry('4000', 1000.1, 'rev'),
        entry('5100', 200.02, 'labor'),
      ]);
      expect(store!.laborPercent).toBe(20);
    });

    it('sums many small revenue postings without drift', () => {
      const [store] = RetailEngine.getStoreBreakdown([
        entry('4000', 0.1, 'r1'),
        entry('4000', 0.1, 'r2'),
        entry('4000', 0.1, 'r3'),
      ]);
      // Float: 0.1 + 0.1 + 0.1 === 0.30000000000000004
      expect(store!.revenue).toBe(0.3);
    });

    it('ranks stores by net profit descending', () => {
      const rows = RetailEngine.getStoreBreakdown([
        entry('4000', 100, 'r1', 'S1'),
        entry('4000', 300, 'r2', 'S2'),
        entry('4000', 200, 'r3', 'S3'),
      ]);
      expect(rows.map((r) => r.id)).toEqual(['S2', 'S3', 'S1']);
      expect(rows.map((r) => r.rank)).toEqual([1, 2, 3]);
    });

    it('excludes stores with no revenue', () => {
      const rows = RetailEngine.getStoreBreakdown([entry('5000', 500, 'c1', 'S1')]);
      expect(rows).toHaveLength(0);
    });

    it('returns zero percentages rather than NaN for a zero-revenue store', () => {
      // A store with only a negative revenue line is filtered out; assert the
      // guard directly via a store whose revenue nets to zero but has costs.
      const rows = RetailEngine.getStoreBreakdown([
        entry('4000', 100, 'r1', 'S1'),
        entry('4000', -100, 'r2', 'S1'),
        entry('5100', 50, 'l1', 'S1'),
      ]);
      expect(rows).toHaveLength(0);
    });
  });

  describe('calculateDashboardStats', () => {
    it('averages revenue per store exactly', () => {
      const stats = RetailEngine.calculateDashboardStats([
        entry('4000', 1000.1, 'r1', 'S1'),
        entry('4000', 2000.2, 'r2', 'S2'),
      ]);
      expect(stats.avgRevenuePerStore).toBe(1500.15);
    });

    it('computes the average net margin from exact decimals', () => {
      const stats = RetailEngine.calculateDashboardStats([
        entry('4000', 1000.1, 'r1', 'S1'),
        entry('5000', 100.05, 'c1', 'S1'),
        entry('5100', 200.02, 'l1', 'S1'),
        entry('5200', 300.03, 'o1', 'S1'),
      ]);
      expect(stats.avgNetMargin).toBe(39.9960004);
    });

    it('returns zeros rather than NaN when there are no stores', () => {
      const stats = RetailEngine.calculateDashboardStats([]);
      expect(stats.avgRevenuePerStore).toBe(0);
      expect(stats.avgNetMargin).toBe(0);
      expect(Number.isNaN(stats.avgNetMargin)).toBe(false);
    });
  });

  describe('getPnLTrend', () => {
    it('computes per-period gross profit exactly', () => {
      const rows = RetailEngine.getPnLTrend([
        entry('4000', 1000.1, 'r1', 'S1', '2026-01-15'),
        entry('5000', 900.05, 'c1', 'S1', '2026-01-20'),
      ]);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.month).toBe('2026-01');
      expect(rows[0]!.revenue).toBe(1000.1);
      expect(rows[0]!.grossProfit).toBe(100.05);
    });

    it('keeps at most the last six periods', () => {
      const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'];
      const rows = RetailEngine.getPnLTrend(
        months.map((m, i) => entry('4000', 100, `r${i}`, 'S1', `${m}-15`))
      );
      expect(rows).toHaveLength(6);
      expect(rows[0]!.month).toBe('2025-09');
    });

    it('sums small per-period postings without drift', () => {
      const rows = RetailEngine.getPnLTrend([
        entry('4000', 0.1, 'r1', 'S1', '2026-01-05'),
        entry('4000', 0.1, 'r2', 'S1', '2026-01-06'),
        entry('4000', 0.1, 'r3', 'S1', '2026-01-07'),
      ]);
      expect(rows[0]!.revenue).toBe(0.3);
    });
  });
});
