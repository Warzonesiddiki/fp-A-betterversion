/**
 * GAP-1 (F-0006) known-answer tests for SectorPage money patterns.
 *
 * Verifies computeSectorKPIDefaults calculates gross_margin, revenue,
 * and net_income using exact money primitives without IEEE-754 drift.
 */

import { describe, expect, it } from 'vitest';
import { computeSectorKPIDefaults } from '@/pages/sector/SectorPage';
import type { GLEntry } from '@/types';

function makeEntry(overrides: Partial<GLEntry>): GLEntry {
  return {
    id: '1',
    accountCode: '4000',
    accountName: 'Revenue',
    debit: 0,
    credit: 0,
    netChange: 0,
    ...overrides,
  } as GLEntry;
}

describe('computeSectorKPIDefaults — known answers (GAP-1)', () => {
  it('returns zeroes for empty entries', () => {
    const result = computeSectorKPIDefaults([]);
    expect(result).toEqual({
      gross_margin: 0,
      revenue: 0,
      net_income: 0,
    });
  });

  it('computes revenue from credit-dominant entries', () => {
    const entries = [makeEntry({ credit: 1000, debit: 0 }), makeEntry({ credit: 500, debit: 0 })];
    const result = computeSectorKPIDefaults(entries);
    expect(result.revenue).toBe(1500);
  });

  it('computes expenses from debit-dominant entries', () => {
    const entries = [
      makeEntry({ credit: 1000, debit: 0 }),
      makeEntry({ debit: 400, credit: 0 }),
      makeEntry({ debit: 200, credit: 0 }),
    ];
    const result = computeSectorKPIDefaults(entries);
    expect(result.net_income).toBe(400); // 1000 - 600
  });

  it('computes net_income as revenue minus expenses', () => {
    const entries = [makeEntry({ credit: 5000, debit: 0 }), makeEntry({ debit: 1250, credit: 0 })];
    const result = computeSectorKPIDefaults(entries);
    expect(result.net_income).toBe(3750);
  });

  it('computes gross_margin percentage accurately using divideMoney', () => {
    const entries = [makeEntry({ credit: 1000, debit: 0 }), makeEntry({ debit: 250, credit: 0 })];
    const result = computeSectorKPIDefaults(entries);
    // (1000 - 250) / 1000 * 100 = 75%
    expect(result.gross_margin).toBe(75);
  });

  it('avoids IEEE-754 precision issues on decimal amounts', () => {
    const entries = [
      makeEntry({ credit: 0.1, debit: 0 }),
      makeEntry({ credit: 0.2, debit: 0 }),
      makeEntry({ debit: 0.05, credit: 0 }),
    ];
    const result = computeSectorKPIDefaults(entries);
    expect(result.revenue).toBe(0.3);
    expect(result.net_income).toBe(0.25);
    // (0.3 - 0.05) / 0.3 * 100 = 83.333... -> 83.33
    expect(result.gross_margin).toBe(83.33);
  });

  it('handles negative net income and negative gross margin when expenses exceed revenue', () => {
    const entries = [makeEntry({ credit: 100, debit: 0 }), makeEntry({ debit: 150, credit: 0 })];
    const result = computeSectorKPIDefaults(entries);
    expect(result.revenue).toBe(100);
    expect(result.net_income).toBe(-50);
    expect(result.gross_margin).toBe(-50);
  });

  it('computes default KPIs accurately for multi-account realistic sector entries', () => {
    const entries = [
      makeEntry({ accountCode: '4000', credit: 2000, debit: 0 }),
      makeEntry({ accountCode: '4100', credit: 500, debit: 0 }),
      makeEntry({ accountCode: '5000', debit: 800, credit: 0 }),
      makeEntry({ accountCode: '6000', debit: 200, credit: 0 }),
    ];
    const result = computeSectorKPIDefaults(entries);
    expect(result.revenue).toBe(2500);
    expect(result.net_income).toBe(1500);
    expect(result.gross_margin).toBe(60); // 1500 / 2500 * 100 = 60%
  });
});
