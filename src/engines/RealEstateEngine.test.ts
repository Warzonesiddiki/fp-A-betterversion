import { describe, it, expect } from 'vitest';
import { RealEstateEngine } from './RealEstateEngine';
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

describe('RealEstateEngine', () => {
  describe('calculatePortfolioStats', () => {
    it('should calculate cost basis from 15xx accounts', () => {
      const entries = [gl('1501', 10000000), gl('1502', 5000000)];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.costBasis).toBe(15000000);
    });

    it('should calculate market value from 16xx accounts', () => {
      const entries = [gl('1601', 12000000), gl('1602', 6000000)];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.marketValue).toBe(18000000);
    });

    it('should calculate unrealized gain as market value minus cost basis', () => {
      const entries = [gl('1501', 10000000), gl('1601', 12000000)];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.unrealizedGain).toBe(2000000);
    });

    it('should calculate LTV ratio from debt (25xx) / market value', () => {
      const entries = [
        gl('1601', 20000000), // market value
        gl('2501', -10000000), // debt (negative)
      ];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.ltv).toBe(50);
    });

    it('should return 0 LTV when market value is zero', () => {
      const entries = [gl('2501', -10000000)];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.ltv).toBe(0);
    });

    it('should count unique entities as total properties', () => {
      const entries = [
        gl('1501', 10000000, { entityId: 'prop-1' }),
        gl('1501', 8000000, { entityId: 'prop-2' }),
        gl('1501', 5000000, { entityId: 'prop-3' }),
      ];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.totalProperties).toBe(3);
    });

    it('should handle empty entries', () => {
      const result = RealEstateEngine.calculatePortfolioStats([]);
      expect(result.costBasis).toBe(0);
      expect(result.marketValue).toBe(0);
      expect(result.unrealizedGain).toBe(0);
      expect(result.ltv).toBe(0);
      expect(result.totalProperties).toBe(0);
    });

    it('should handle negative unrealized gain (market below cost)', () => {
      const entries = [gl('1501', 10000000), gl('1601', 8000000)];
      const result = RealEstateEngine.calculatePortfolioStats(entries);
      expect(result.unrealizedGain).toBe(-2000000);
    });
  });

  describe('calculateDashboardStats', () => {
    it('should calculate NOI as rental income minus operating expenses', () => {
      const entries = [
        gl('4001', 1200000), // rental income
        gl('5001', 400000), // opex
      ];
      const result = RealEstateEngine.calculateDashboardStats(entries);
      expect(result.noi).toBe(800000);
    });

    it('should calculate cap rate as NOI / market value', () => {
      const entries = [
        gl('4001', 1200000), // rental income
        gl('5001', 400000), // opex → NOI = 800000
        gl('1601', 10000000), // market value
      ];
      const result = RealEstateEngine.calculateDashboardStats(entries);
      expect(result.capRate).toBeCloseTo(8, 1);
    });

    it('should return fair value from portfolio market value', () => {
      const entries = [gl('1601', 15000000)];
      const result = RealEstateEngine.calculateDashboardStats(entries);
      expect(result.fairValue).toBe(15000000);
    });

    it('should return 0 cap rate when market value is zero', () => {
      const entries = [gl('4001', 1200000), gl('5001', 400000)];
      const result = RealEstateEngine.calculateDashboardStats(entries);
      expect(result.capRate).toBe(0);
    });

    it('should handle empty entries', () => {
      const result = RealEstateEngine.calculateDashboardStats([]);
      expect(result.fairValue).toBe(0);
      expect(result.noi).toBe(0);
      expect(result.capRate).toBe(0);
    });
  });

  describe('calculateREITStats', () => {
    it('should calculate FFO as net income plus depreciation', () => {
      const entries = [
        gl('4001', 2000000), // rental income
        gl('5001', 600000), // opex
        gl('6001', 300000), // dep/amort
        gl('7001', 100000), // interest
      ];
      // netIncome = 2000000 - 600000 - 300000 - 100000 = 1000000
      // FFO = 1000000 + 300000 = 1300000
      const result = RealEstateEngine.calculateREITStats(entries);
      expect(result.ffo).toBe(1300000);
    });

    it('should calculate AFFO as FFO minus maintenance CapEx (10% of revenue)', () => {
      const entries = [
        gl('4001', 2000000), // rental income
        gl('5001', 600000), // opex
        gl('6001', 300000), // dep/amort
        gl('7001', 100000), // interest
      ];
      // FFO = 1300000, maintenanceCapEx = 2000000 * 0.1 = 200000
      // AFFO = 1300000 - 200000 = 1100000
      const result = RealEstateEngine.calculateREITStats(entries);
      expect(result.affo).toBe(1100000);
    });

    it('should calculate payout ratio as dividends / FFO', () => {
      const entries = [
        gl('4001', 2000000),
        gl('5001', 600000),
        gl('6001', 300000),
        gl('7001', 100000),
        gl('8001', -500000), // dividends (negative)
      ];
      // FFO = 1300000, dividends = 500000
      // payoutRatio = (500000 / 1300000) * 100 ≈ 38.46
      const result = RealEstateEngine.calculateREITStats(entries);
      expect(result.payoutRatio).toBeCloseTo(38.46, 1);
    });

    it('should return 0 payout ratio when FFO is zero', () => {
      const entries = [gl('8001', -500000)];
      const result = RealEstateEngine.calculateREITStats(entries);
      expect(result.payoutRatio).toBe(0);
    });

    it('should calculate NAV per share assuming 1M shares', () => {
      const entries = [
        gl('1601', 20000000), // market value
        gl('2501', -8000000), // debt
      ];
      // NAV = 20000000 - 8000000 = 12000000
      // navPerShare = 12000000 / 1000000 = 12
      const result = RealEstateEngine.calculateREITStats(entries);
      expect(result.navPerShare).toBe(12);
    });

    it('should handle empty entries', () => {
      const result = RealEstateEngine.calculateREITStats([]);
      expect(result.ffo).toBe(0);
      expect(result.affo).toBe(0);
      expect(result.payoutRatio).toBe(0);
    });
  });

  describe('getPropertyBreakdown', () => {
    it('should group entries by entityId and calculate cost/market', () => {
      const entries = [
        gl('1501', 10000000, { entityId: 'prop-1', accountName: 'Tower A' }),
        gl('1601', 12000000, { entityId: 'prop-1' }),
        gl('1501', 8000000, { entityId: 'prop-2', accountName: 'Tower B' }),
        gl('1601', 9000000, { entityId: 'prop-2' }),
      ];
      const result = RealEstateEngine.getPropertyBreakdown(entries);
      expect(result).toHaveLength(2);
      expect(result[0].purchasePrice).toBe(10000000);
      expect(result[0].currentVal).toBe(12000000);
      expect(result[0].name).toBe('Tower A');
    });

    it('should assign status based on cost basis threshold', () => {
      const entries = [
        gl('1501', 15000000, { entityId: 'prop-1' }), // > 10M → Core
        gl('1501', 5000000, { entityId: 'prop-2' }), // < 10M → Value-Add
      ];
      const result = RealEstateEngine.getPropertyBreakdown(entries);
      expect(result.find((p) => p.id === 'prop-1')?.status).toBe('Core');
      expect(result.find((p) => p.id === 'prop-2')?.status).toBe('Value-Add');
    });

    it('should filter out properties with zero purchase price', () => {
      const entries = [
        gl('1501', 10000000, { entityId: 'prop-1' }),
        gl('9999', 5000000, { entityId: 'prop-2' }), // no 15xx entry
      ];
      const result = RealEstateEngine.getPropertyBreakdown(entries);
      expect(result).toHaveLength(1);
    });

    it('should handle empty entries', () => {
      const result = RealEstateEngine.getPropertyBreakdown([]);
      expect(result).toHaveLength(0);
    });

    it('should use accountName from first entry for property name', () => {
      const entries = [gl('1501', 10000000, { entityId: 'prop-1', accountName: 'Skyline Tower' })];
      const result = RealEstateEngine.getPropertyBreakdown(entries);
      expect(result[0].name).toBe('Skyline Tower');
    });
  });
});
