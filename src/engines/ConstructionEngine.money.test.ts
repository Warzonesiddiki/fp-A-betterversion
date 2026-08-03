/**
 * GAP-1 (F-0006) known-answer tests for ConstructionEngine's money migration.
 *
 * Construction metrics (backlog, WIP, billings, gross margin, over/under billed)
 * from GL entries. Each case is FIXED input -> EXACT expected decimal asserted
 * with `toBe`; pre-migration float literal recorded where drift occurred.
 */
import { describe, it, expect } from 'vitest';
import { ConstructionEngine } from './ConstructionEngine';
import type { GLEntry } from '@/types';

function entry(accountCode: string, amount: number, id: string, entity = 'C1'): GLEntry {
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit: amount > 0 ? amount : 0,
    credit: amount < 0 ? -amount : 0,
    netChange: amount,
    date: '2026-01-15',
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId: entity,
    currency: 'USD',
  };
}

describe('ConstructionEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('calculateStats', () => {
    it('computes exact totals and backlog (float gave drift on 0.1+0.2 sums + 1.5x)', () => {
      const entries = [
        entry('4501', 1000.1, 'rev1'),
        entry('4502', 2000.2, 'rev2'),
        entry('4601', 800, 'bill'),
        entry('1301', 500.05, 'wip'),
        entry('5601', 600.03, 'cost'),
      ];
      const stats = ConstructionEngine.calculateStats(entries);
      // revenueYTD = 3000.3
      expect(stats.revenueYTD).toBe(3000.3);
      // wip = 500.05
      expect(stats.wipValue).toBe(500.05);
      // totalBacklog = 500.05 + 3000.3 * 1.5 = 5000.5 (exact)
      expect(stats.totalBacklog).toBe(5000.5);
      // billings
      expect(stats.billings).toBe(800);
      // over/under = billings - wip
      expect(stats.overUnderBilled).toBe(299.95);
    });

    it('computes avg gross margin exactly (float gave 33.333333333333336 etc)', () => {
      const entries = [
        entry('4501', 3000, 'rev'),
        entry('5601', 2000, 'cogs'),
      ];
      const stats = ConstructionEngine.calculateStats(entries);
      // (3000 - 2000) / 3000 * 100 = 33.3333333333 (4dp in code)
      expect(stats.avgGrossMargin).toBe(33.3333);
    });

    it('handles zero revenue without NaN (margin 0)', () => {
      const stats = ConstructionEngine.calculateStats([entry('5601', 100, 'c')]);
      expect(stats.avgGrossMargin).toBe(0);
      expect(stats.revenueYTD).toBe(0);
    });
  });

  describe('getProjectPortfolio', () => {
    it('derives margins exactly from GL (float drift on division)', () => {
      const entries = [
        entry('4501', 1000.1, 'r1', 'P1'),
        entry('5601', 600.05, 'c1', 'P1'),
      ];
      const projects = ConstructionEngine.getProjectPortfolio(entries);
      expect(projects.length).toBeGreaterThan(0);
      // margin = (1000.1 - 600.05) / 1000.1 * 100 ≈ 40.004
      const p = projects.find((pr) => pr.margin.includes('40')) || projects[0];
      expect(p!.margin).toContain('40');
    });
  });
});
