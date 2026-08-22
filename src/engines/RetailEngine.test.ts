import { describe, it, expect } from 'vitest';
import { RetailEngine } from './RetailEngine';
import type { GLEntry } from '@/types';

function gl(accountCode: string, amount: number, overrides: Partial<GLEntry> = {}): GLEntry {
  const id = `gl-${accountCode}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    id,
    accountId: id,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit: amount,
    credit: 0,
    netChange: amount,
    date: '2026-01-15',
    amount,
    description: '',
    reference: id,
    entityId: 'entity-1',
    currency: 'USD',
    ...overrides,
  };
}

describe('RetailEngine', () => {
  describe('getStoreBreakdown', () => {
    it('should calculate revenue from 4xxx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1', accountName: 'Store Alpha' }),
        gl('4002', 200000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(1);
      expect(result![0]!.revenue).toBe(700000);
    });

    it('should calculate COGS from 50xx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.cogs).toBe(200000);
    });

    it('should calculate labor from 51xx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
        gl('5102', 50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.labor).toBe(150000);
    });

    it('should calculate occupancy from 52xx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5201', 80000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.occupancy).toBe(80000);
    });

    it('should calculate gross profit as revenue minus COGS', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.grossProfit).toBe(300000);
    });

    it('should calculate net profit as revenue minus COGS minus labor minus occupancy', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
        gl('5201', 50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.netProfit).toBe(150000);
    });

    it('should calculate margin as netProfit / revenue * 100', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
        gl('5201', 50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      // netProfit = 150000, revenue = 500000 → margin = 30%
      expect(result![0]!.margin).toBe(30);
    });

    it('should calculate labor percent as labor / revenue * 100', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.laborPercent).toBe(20);
    });

    it('should return 0 margin when revenue is zero', () => {
      const entries = [gl('5001', 100000, { entityId: 'store-1' })];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(0); // filtered out because revenue = 0
    });

    it('should rank stores by net profit descending', () => {
      const entries = [
        gl('4001', 300000, { entityId: 'store-1' }),
        gl('4001', 800000, { entityId: 'store-2' }),
        gl('4001', 500000, { entityId: 'store-3' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.rank).toBe(1);
      expect(result![0]!.id).toBe('store-2');
      expect(result![1]!.rank).toBe(2);
      expect(result![1]!.id).toBe('store-3');
      expect(result![2]!.rank).toBe(3);
      expect(result![2]!.id).toBe('store-1');
    });

    it('should filter out stores with zero revenue', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 100000, { entityId: 'store-2' }), // no revenue entry
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(1);
      expect(result![0]!.id).toBe('store-1');
    });

    it('should use accountName from first entry for store name', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1', accountName: 'Downtown Flagship' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.name).toBe('Downtown Flagship');
    });

    it('should handle empty entries', () => {
      const result = RetailEngine.getStoreBreakdown([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple stores', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('4001', 300000, { entityId: 'store-2' }),
        gl('4001', 700000, { entityId: 'store-3' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(3);
    });

    // -------------------------------------------------------------------------
    // Breakdown coverage for the entityId grouping path consumed by
    // StoreDashboardPage / RetailDashboardPage (wave-3 lane R15).
    // -------------------------------------------------------------------------

    it('groups entityId-tagged rows per store without cross-contamination', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('4002', 200000, { entityId: 'store-2' }), // interleaved, other store
        gl('4001', 200000, { entityId: 'store-1' }),
        gl('5001', 50000, { entityId: 'store-2' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(2);
      const store1 = result.find((s) => s.id === 'store-1');
      const store2 = result.find((s) => s.id === 'store-2');
      expect(store1!.revenue).toBe(700000); // only store-1 postings
      expect(store1!.cogs).toBe(0);
      expect(store2!.revenue).toBe(200000);
      expect(store2!.cogs).toBe(50000);
    });

    it('excludes untagged entries from every store group', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        // No entityId at all: belongs to no store, must not inflate store-1
        // nor synthesize an extra "untagged" group.
        gl('4001', 999999, { entityId: undefined }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(1);
      expect(result![0]!.id).toBe('store-1');
      expect(result![0]!.revenue).toBe(500000);
    });

    it('treats credited COGS reversals as cost reductions (signed, no Math.abs)', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
        // A credit/reversal posting: negative amount must SUBTRACT from cost,
        // never be folded into it by magnitude.
        gl('5001', -50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.cogs).toBe(150000);
      expect(result![0]!.grossProfit).toBe(350000);
      expect(result![0]!.netProfit).toBe(350000);
    });

    it('omits zero-activity stores instead of zero-filling them', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        // Activity on accounts outside the store P&L prefixes only…
        gl('6050', 1234, { entityId: 'store-2' }),
        // …and a store whose only revenue posting nets to exactly zero.
        gl('4001', 0, { entityId: 'store-3' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result.map((s) => s.id)).toEqual(['store-1']);
      expect(result![0]!.revenue).toBeGreaterThan(0);
    });

    it('falls back to Store <id> labeling when entries carry no usable accountName', () => {
      const entries = [gl('4001', 100000, { entityId: 'store-9', accountName: '' })];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result![0]!.name).toBe('Store store-9');
    });
  });

  describe('calculateDashboardStats', () => {
    it('should calculate average revenue per store', () => {
      const entries = [
        gl('4001', 400000, { entityId: 'store-1' }),
        gl('4001', 600000, { entityId: 'store-2' }),
      ];
      const result = RetailEngine.calculateDashboardStats(entries);
      expect(result.avgRevenuePerStore).toBe(500000);
    });

    it('should calculate average net margin', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
        gl('5201', 50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.calculateDashboardStats(entries);
      // netProfit = 150000, revenue = 500000 → margin = 30%
      expect(result.avgNetMargin).toBe(30);
    });

    it('returns null operational metrics when no stores have revenue', () => {
      const result = RetailEngine.calculateDashboardStats([]);
      expect(result.avgRevenuePerStore).toBe(0);
      expect(result.avgNetMargin).toBe(0);
      // Null-unless-posted: the GL carries neither labor hours nor survey
      // scores, so both operational fields stay null, never placeholders.
      expect(result.salesPerLaborHour).toBeNull();
      expect(result.avgCustSat).toBeNull();
    });

    it('keeps salesPerLaborHour and avgCustSat null even when stores have revenue', () => {
      const entries = [gl('4001', 500000, { entityId: 'store-1' })];
      const result = RetailEngine.calculateDashboardStats(entries);
      // Labor-cost postings (51xx) must not resurrect the retired hardcoded
      // stand-ins: hours and satisfaction are not ledger-measurable.
      expect(result.salesPerLaborHour).toBeNull();
      expect(result.avgCustSat).toBeNull();
    });
  });

  describe('getPnLTrend', () => {
    it('should return monthly P&L trend for last 6 periods', () => {
      const entries = [
        gl('4001', 100000, { date: '2026-01-15' }),
        gl('4001', 120000, { date: '2026-02-15' }),
        gl('4001', 110000, { date: '2026-03-15' }),
      ];
      const result = RetailEngine.getPnLTrend(entries);
      expect(result).toHaveLength(3);
      expect(result![0]!.month).toBe('2026-01');
      expect(result![0]!.revenue).toBe(100000);
    });

    it('should calculate gross profit in trend', () => {
      const entries = [
        gl('4001', 500000, { date: '2026-01-15' }),
        gl('5001', 200000, { date: '2026-01-15' }),
      ];
      const result = RetailEngine.getPnLTrend(entries);
      expect(result![0]!.grossProfit).toBe(300000);
    });

    it('should calculate labor in trend', () => {
      const entries = [
        gl('4001', 500000, { date: '2026-01-15' }),
        gl('5101', 100000, { date: '2026-01-15' }),
      ];
      const result = RetailEngine.getPnLTrend(entries);
      expect(result![0]!.labor).toBe(100000);
    });

    it('should limit to last 6 periods', () => {
      const entries = Array.from({ length: 8 }, (_, i) =>
        gl('4001', 100000, { date: `2026-${String(i + 1).padStart(2, '0')}-15` })
      );
      const result = RetailEngine.getPnLTrend(entries);
      expect(result).toHaveLength(6);
      expect(result![0]!.month).toBe('2026-03');
    });

    it('should handle empty entries', () => {
      const result = RetailEngine.getPnLTrend([]);
      expect(result).toHaveLength(0);
    });

    it('should sort periods chronologically', () => {
      const entries = [
        gl('4001', 100000, { date: '2026-03-15' }),
        gl('4001', 200000, { date: '2026-01-15' }),
        gl('4001', 150000, { date: '2026-02-15' }),
      ];
      const result = RetailEngine.getPnLTrend(entries);
      expect(result![0]!.month).toBe('2026-01');
      expect(result![1]!.month).toBe('2026-02');
      expect(result![2]!.month).toBe('2026-03');
    });
  });
});
