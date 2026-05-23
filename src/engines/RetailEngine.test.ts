import { describe, it, expect } from 'vitest';
import { RetailEngine, type GLEntry } from './RetailEngine';

function gl(accountCode: string, amount: number, overrides: Partial<GLEntry> = {}): GLEntry {
  return {
    id: `gl-${accountCode}-${Math.random().toString(36).slice(2, 6)}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    amount,
    currency: 'USD',
    date: '2026-01-15',
    entityId: 'entity-1',
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
      expect(result[0].revenue).toBe(700000);
    });

    it('should calculate COGS from 50xx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].cogs).toBe(200000);
    });

    it('should calculate labor from 51xx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
        gl('5102', 50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].labor).toBe(150000);
    });

    it('should calculate occupancy from 52xx accounts', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5201', 80000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].occupancy).toBe(80000);
    });

    it('should calculate gross profit as revenue minus COGS', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].grossProfit).toBe(300000);
    });

    it('should calculate net profit as revenue minus COGS minus labor minus occupancy', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 200000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
        gl('5201', 50000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].netProfit).toBe(150000);
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
      expect(result[0].margin).toBe(30);
    });

    it('should calculate labor percent as labor / revenue * 100', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5101', 100000, { entityId: 'store-1' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].laborPercent).toBe(20);
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
      expect(result[0].rank).toBe(1);
      expect(result[0].id).toBe('store-2');
      expect(result[1].rank).toBe(2);
      expect(result[1].id).toBe('store-3');
      expect(result[2].rank).toBe(3);
      expect(result[2].id).toBe('store-1');
    });

    it('should filter out stores with zero revenue', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1' }),
        gl('5001', 100000, { entityId: 'store-2' }), // no revenue entry
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('store-1');
    });

    it('should use accountName from first entry for store name', () => {
      const entries = [
        gl('4001', 500000, { entityId: 'store-1', accountName: 'Downtown Flagship' }),
      ];
      const result = RetailEngine.getStoreBreakdown(entries);
      expect(result[0].name).toBe('Downtown Flagship');
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

    it('should return default values when no stores have revenue', () => {
      const result = RetailEngine.calculateDashboardStats([]);
      expect(result.avgRevenuePerStore).toBe(0);
      expect(result.avgNetMargin).toBe(0);
      expect(result.avgCustSat).toBe(92.8);
    });

    it('should return salesPerLaborHour as placeholder 254', () => {
      const entries = [gl('4001', 500000, { entityId: 'store-1' })];
      const result = RetailEngine.calculateDashboardStats(entries);
      expect(result.salesPerLaborHour).toBe(254);
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
      expect(result[0].period).toBe('2026-01');
      expect(result[0].revenue).toBe(100000);
    });

    it('should calculate gross profit in trend', () => {
      const entries = [
        gl('4001', 500000, { date: '2026-01-15' }),
        gl('5001', 200000, { date: '2026-01-15' }),
      ];
      const result = RetailEngine.getPnLTrend(entries);
      expect(result[0].grossProfit).toBe(300000);
    });

    it('should calculate labor in trend', () => {
      const entries = [
        gl('4001', 500000, { date: '2026-01-15' }),
        gl('5101', 100000, { date: '2026-01-15' }),
      ];
      const result = RetailEngine.getPnLTrend(entries);
      expect(result[0].labor).toBe(100000);
    });

    it('should limit to last 6 periods', () => {
      const entries = Array.from({ length: 8 }, (_, i) =>
        gl('4001', 100000, { date: `2026-${String(i + 1).padStart(2, '0')}-15` })
      );
      const result = RetailEngine.getPnLTrend(entries);
      expect(result).toHaveLength(6);
      expect(result[0].period).toBe('2026-03');
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
      expect(result[0].period).toBe('2026-01');
      expect(result[1].period).toBe('2026-02');
      expect(result[2].period).toBe('2026-03');
    });
  });
});
