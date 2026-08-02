/**
 * GAP-1 (F-0006) known-answer tests for RealEstateEngine's money migration.
 *
 * REIT reporting metrics — NOI, cap rate, FFO/AFFO, NAV per share, LTV — are
 * figures investors act on. Each case is a FIXED input -> EXACT expected
 * decimal asserted with `toBe` (Object.is); the pre-migration float literal is
 * recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { RealEstateEngine } from './RealEstateEngine';
import type { GLEntry } from '@/types';

function entry(accountCode: string, amount: number, id: string, entityId = 'P1'): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: 'Jan 2026',
    debit: 0,
    credit: 0,
    netChange: 0,
    date: '2026-01-31',
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId,
  };
}

describe('RealEstateEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('calculatePortfolioStats', () => {
    it('computes the unrealized gain exactly (float gave 100.05000000000007)', () => {
      const stats = RealEstateEngine.calculatePortfolioStats([
        entry('1500', 900.05, 'cost'),
        entry('1600', 1000.1, 'mkt'),
      ]);
      expect(stats.costBasis).toBe(900.05);
      expect(stats.marketValue).toBe(1000.1);
      expect(stats.unrealizedGain).toBe(100.05);
    });

    it('sums many small cost entries without drift', () => {
      const stats = RealEstateEngine.calculatePortfolioStats([
        entry('1500', 0.1, 'c1'),
        entry('1500', 0.1, 'c2'),
        entry('1500', 0.1, 'c3'),
      ]);
      // Float: 0.1 + 0.1 + 0.1 === 0.30000000000000004
      expect(stats.costBasis).toBe(0.3);
    });

    it('computes loan-to-value from exact decimals', () => {
      const stats = RealEstateEngine.calculatePortfolioStats([
        entry('1600', 1000.1, 'mkt'),
        entry('2500', -500.05, 'debt'),
      ]);
      expect(stats.ltv).toBe(50);
    });

    it('returns zero LTV rather than Infinity when market value is zero', () => {
      const stats = RealEstateEngine.calculatePortfolioStats([entry('2500', -500, 'debt')]);
      expect(stats.marketValue).toBe(0);
      expect(stats.ltv).toBe(0);
      expect(Number.isFinite(stats.ltv)).toBe(true);
    });

    it('takes the absolute value of the debt liability balance', () => {
      const stats = RealEstateEngine.calculatePortfolioStats([
        entry('1600', 1000, 'mkt'),
        entry('2500', -250, 'debt'),
      ]);
      expect(stats.ltv).toBe(25);
    });
  });

  describe('calculateDashboardStats', () => {
    it('computes NOI exactly (float gave 100.05000000000007)', () => {
      const stats = RealEstateEngine.calculateDashboardStats([
        entry('4000', 1000.1, 'rent'),
        entry('5000', 900.05, 'opex'),
      ]);
      expect(stats.noi).toBe(100.05);
    });

    it('computes the cap rate from exact decimals', () => {
      const stats = RealEstateEngine.calculateDashboardStats([
        entry('4000', 100.05, 'rent'),
        entry('1600', 1000.1, 'mkt'),
      ]);
      // (100.05 / 1000.10) x 100 — float gave 10.003999600039995
      expect(stats.capRate).toBe(10.0039996);
    });

    it('returns a zero cap rate rather than Infinity with no market value', () => {
      const stats = RealEstateEngine.calculateDashboardStats([entry('4000', 500, 'rent')]);
      expect(stats.capRate).toBe(0);
      expect(Number.isFinite(stats.capRate)).toBe(true);
    });
  });

  describe('calculateREITStats', () => {
    it('computes FFO from an exact net-income chain (float gave 400.0000000000001)', () => {
      // netIncome = 1000.10 - 100.05 - 200.02 - 300.03 = 400.00
      // FFO = netIncome + depAmort = 400.00 + 200.02 = 600.02
      const stats = RealEstateEngine.calculateREITStats([
        entry('4000', 1000.1, 'rent'),
        entry('5000', 100.05, 'opex'),
        entry('6000', 200.02, 'dep'),
        entry('7000', 300.03, 'int'),
      ]);
      expect(stats.ffo).toBe(600.02);
    });

    it('computes AFFO net of the 10% maintenance CapEx assumption exactly', () => {
      // rentalIncome 500.10 -> capex 50.01; FFO = 500.10 - 0 - 0 - 0 + 0 = 500.10
      // AFFO = 500.10 - 50.01 = 450.09
      const stats = RealEstateEngine.calculateREITStats([entry('4000', 500.1, 'rent')]);
      expect(stats.ffo).toBe(500.1);
      expect(stats.affo).toBe(450.09);
    });

    it('computes NAV per share from exact decimals', () => {
      const stats = RealEstateEngine.calculateREITStats([
        entry('1600', 1000.1, 'mkt'),
        entry('2500', 0, 'debt'),
      ]);
      // 1000.10 / 1,000,000
      expect(stats.navPerShare).toBe(0.0010001);
    });

    it('nets debt out of NAV exactly', () => {
      const stats = RealEstateEngine.calculateREITStats([
        entry('1600', 1000.1, 'mkt'),
        entry('2500', -900.05, 'debt'),
      ]);
      // (1000.10 - 900.05) / 1,000,000 = 100.05 / 1e6
      expect(stats.navPerShare).toBe(0.00010005);
    });

    it('computes the payout ratio from exact decimals', () => {
      const stats = RealEstateEngine.calculateREITStats([
        entry('4000', 1000, 'rent'),
        entry('8000', -500, 'div'),
      ]);
      // FFO = 1000; dividends 500 -> 50%
      expect(stats.payoutRatio).toBe(50);
    });

    it('returns a zero payout ratio rather than Infinity when FFO is non-positive', () => {
      const stats = RealEstateEngine.calculateREITStats([
        entry('5000', 1000, 'opex'),
        entry('8000', -500, 'div'),
      ]);
      expect(stats.ffo).toBeLessThanOrEqual(0);
      expect(stats.payoutRatio).toBe(0);
      expect(Number.isFinite(stats.payoutRatio)).toBe(true);
    });
  });

  describe('getPropertyBreakdown', () => {
    it('reports per-property cost and market value at cent precision', () => {
      const rows = RealEstateEngine.getPropertyBreakdown([
        entry('1500', 0.1, 'c1', 'P1'),
        entry('1500', 0.2, 'c2', 'P1'),
        entry('1600', 0.5, 'm1', 'P1'),
      ]);
      expect(rows).toHaveLength(1);
      // Float: 0.1 + 0.2 === 0.30000000000000004
      expect(rows[0]!.purchasePrice).toBe(0.3);
      expect(rows[0]!.currentVal).toBe(0.5);
    });

    it('classifies a property above the 10M cost threshold as Core', () => {
      const rows = RealEstateEngine.getPropertyBreakdown([
        entry('1500', 10_000_000.01, 'c1', 'P1'),
      ]);
      expect(rows[0]!.status).toBe('Core');
    });

    it('excludes properties with no purchase price', () => {
      const rows = RealEstateEngine.getPropertyBreakdown([entry('1600', 500, 'm1', 'P1')]);
      expect(rows).toHaveLength(0);
    });
  });
});
