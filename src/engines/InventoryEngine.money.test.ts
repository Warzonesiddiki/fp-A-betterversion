/**
 * GAP-1 (F-0006) known-answer tests for InventoryEngine's money migration.
 *
 * Inventory valuation is a balance-sheet figure. Every case is a FIXED input ->
 * EXACT expected decimal asserted with `toBe` (Object.is); the pre-migration
 * float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { InventoryEngine } from './InventoryEngine';
import type { GLEntry } from '@/types';

function entry(accountCode: string, amount: number, id: string): GLEntry {
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
  };
}

describe('InventoryEngine — money primitive known answers (GAP-1 / F-0006)', () => {
  describe('calculateGLInventoryStats', () => {
    it('sums inventory value exactly across many small postings', () => {
      const stats = InventoryEngine.calculateGLInventoryStats([
        entry('1210', 0.1, 'i1'),
        entry('1210', 0.1, 'i2'),
        entry('1210', 0.1, 'i3'),
      ]);
      // Float: 0.1 + 0.1 + 0.1 === 0.30000000000000004
      expect(stats.totalValue).toBe(0.3);
    });

    it('computes annualised turnover from exact decimals', () => {
      const stats = InventoryEngine.calculateGLInventoryStats([
        entry('1210', 1000.1, 'i1'),
        entry('5000', -100.1, 'c1'),
      ]);
      // (100.10 * 12) / 1000.10 — float gave 1.2010798920107988
      expect(stats.turnover).toBe(1.201079892);
    });

    it('computes days on hand from exact decimals', () => {
      const stats = InventoryEngine.calculateGLInventoryStats([
        entry('1210', 1000.1, 'i1'),
        entry('5000', -100.1, 'c1'),
      ]);
      // 1000.10 / (100.10 / 30) — float gave 299.73026973026975
      expect(stats.daysOnHand).toBe(299.7302697303);
    });

    it('returns zero ratios rather than Infinity when inventory is empty', () => {
      const stats = InventoryEngine.calculateGLInventoryStats([entry('5000', -500, 'c1')]);
      expect(stats.totalValue).toBe(0);
      expect(stats.turnover).toBe(0);
      expect(Number.isFinite(stats.turnover)).toBe(true);
    });

    it('returns zero days on hand rather than Infinity when COGS is zero', () => {
      const stats = InventoryEngine.calculateGLInventoryStats([entry('1210', 1000, 'i1')]);
      expect(stats.daysOnHand).toBe(0);
      expect(Number.isFinite(stats.daysOnHand)).toBe(true);
    });
  });

  describe('calculateTurnover', () => {
    it('divides exactly (float gave 3.0000000000000004)', () => {
      expect(InventoryEngine.calculateTurnover(300.3, 100.1)).toBe(3);
    });

    it('returns 0 for non-positive average inventory instead of Infinity', () => {
      expect(InventoryEngine.calculateTurnover(1000, 0)).toBe(0);
      expect(InventoryEngine.calculateTurnover(1000, -5)).toBe(0);
    });
  });

  describe('calculateDSI', () => {
    it('computes days sales of inventory from exact decimals', () => {
      // (100.10 / 300.30) * 365 — float gave 121.66666666666666
      expect(InventoryEngine.calculateDSI(100.1, 300.3, 365)).toBe(121.6666666667);
    });

    it('returns 0 when COGS is non-positive', () => {
      expect(InventoryEngine.calculateDSI(100, 0, 365)).toBe(0);
    });
  });

  describe('calculateGMROI', () => {
    it('computes gross-margin return on inventory exactly', () => {
      // 300.30 / 100.10 = 3 (float gave 3.0000000000000004)
      expect(InventoryEngine.calculateGMROI(300.3, 100.1)).toBe(3);
    });

    it('returns 0 for non-positive inventory cost', () => {
      expect(InventoryEngine.calculateGMROI(500, 0)).toBe(0);
    });
  });

  describe('calculateEOQ', () => {
    it('computes the economic order quantity for a known square', () => {
      // sqrt(2 * 400 * 100 / 2) = sqrt(40000) = 200
      expect(InventoryEngine.calculateEOQ(400, 100, 2, 1)).toBe(200);
    });

    it('falls back to a flat holding cost when unit cost is zero', () => {
      // holdingCost 2, unitCost 0 -> h = 2 -> sqrt(2*400*100/2) = 200
      expect(InventoryEngine.calculateEOQ(400, 100, 2, 0)).toBe(200);
    });

    it('returns 0 when the holding cost is non-positive', () => {
      expect(InventoryEngine.calculateEOQ(400, 100, 0, 0)).toBe(0);
    });
  });
});
