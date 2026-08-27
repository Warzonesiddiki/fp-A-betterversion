/**
 * Tests for ManufacturingEngine
 * Covers: calculateStats, parameter-driven getProductionLines,
 * GL-bucketed getMonthlyTrend, and the no-demo-literal source contract.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ManufacturingEngine } from './ManufacturingEngine';
import type { GLEntry } from '@/types';

function gl(
  accountCode: string,
  debit: number,
  credit: number,
  amount: number,
  description: string,
  period: string,
  overrides: Partial<GLEntry> = {}
): GLEntry {
  return {
    id: `mock-${period}-${accountCode}`,
    accountId: accountCode,
    accountCode,
    accountName: description,
    debit,
    credit,
    amount,
    netChange: debit - credit,
    description,
    date: period,
    period,
    periodName: period,
    reference: '',
    ...overrides,
  };
}

describe('ManufacturingEngine', () => {
  const mockEntries = [
    gl('4700', 0, 800000, 800000, 'Sales', '2024-01'),
    gl('5700', 200000, 0, 200000, 'Materials', '2024-01'),
    gl('5800', 150000, 0, 150000, 'Direct labor', '2024-01'),
    gl('5900', 100000, 0, 100000, 'Overhead', '2024-01'),
    gl('4700', 0, 900000, 900000, 'Sales', '2024-02'),
    gl('5700', 220000, 0, 220000, 'Materials', '2024-02'),
    gl('5800', 160000, 0, 160000, 'Direct labor', '2024-02'),
    gl('5900', 110000, 0, 110000, 'Overhead', '2024-02'),
  ];

  describe('calculateStats', () => {
    it('should calculate manufacturing statistics', () => {
      const stats = ManufacturingEngine.calculateStats(mockEntries);
      expect(stats.revenue).toBe(1700000); // 800k + 900k
      expect(stats.cogs).toBe(940000); // 200+150+100+220+160+110
      expect(stats.revenue - stats.cogs).toBe(760000);
      expect(stats.grossMargin).toBeCloseTo((760000 / 1700000) * 100);
    });

    it('should handle empty entries', () => {
      const stats = ManufacturingEngine.calculateStats([]);
      expect(stats.revenue).toBe(0);
      expect(stats.cogs).toBe(0);
    });
  });

  describe('source purity (no demo literals)', () => {
    const source = readFileSync(resolve('src/engines/ManufacturingEngine.ts'), 'utf8');

    it('never embeds demo production-line names', () => {
      expect(source).not.toContain('Line A');
      expect(source).not.toContain('Line B');
      expect(source).not.toContain('Packaging');
      expect(source).not.toContain('Welding');
      expect(source).not.toContain('Painting');
    });

    it('contains no pseudo-random fabrication helper', () => {
      expect(source).not.toMatch(/9301/);
      expect(source).not.toMatch(/Math\.sin/);
    });
  });

  describe('getProductionLines', () => {
    it('returns an honest empty state without configured lines', () => {
      expect(ManufacturingEngine.getProductionLines(mockEntries)).toEqual([]);
      expect(ManufacturingEngine.getProductionLines(mockEntries, [])).toEqual([]);
    });

    it('allocates measured production cost evenly across configured lines', () => {
      const lines = ManufacturingEngine.getProductionLines(mockEntries, [
        { name: 'Press' },
        { name: 'Finishing' },
      ]);
      expect(lines.map((l) => l.line)).toEqual(['Press', 'Finishing']);
      const total = lines.reduce((s, l) => s + l.costShare, 0);
      expect(total).toBe(940000);
      expect(lines[0]!.costShare).toBe(470000);
      expect(lines[1]!.costShare).toBe(470000);
    });
  });

  describe('getMonthlyTrend', () => {
    it('buckets measured revenue and production cost by posting month', () => {
      const trend = ManufacturingEngine.getMonthlyTrend(mockEntries);
      expect(trend).toHaveLength(2);
      expect(trend[0]).toEqual({ month: '2024-01', revenue: 800000, productionCost: 450000 });
      expect(trend[1]).toEqual({ month: '2024-02', revenue: 900000, productionCost: 490000 });
    });

    it('returns an empty trend when there are no entries', () => {
      expect(ManufacturingEngine.getMonthlyTrend([])).toEqual([]);
    });
  });
});
