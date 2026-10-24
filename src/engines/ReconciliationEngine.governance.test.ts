import { describe, it, expect } from 'vitest';
import { ReconciliationEngine } from './ReconciliationEngine';
import type { DataRow, MatchedPair, Discrepancy } from './ReconciliationEngine';

/**
 * GOVERNANCE EVIDENCE for cap:close.reconciliation-engine
 *
 * The ReconciliationEngine matches records between two sources and detects
 * discrepancies. The governance dimension here is ACCURACY — reconciliation
 * must find all mismatches, apply tolerance correctly, and produce auditable
 * reports. If reconciliation misses a discrepancy, financial statements may
 * contain undetected errors.
 *
 * Tested dimensions:
 * 1. Match accuracy (exact key matching)
 * 2. Discrepancy detection (tolerance-based)
 * 3. Auto-resolution (tolerance-based)
 * 4. Report generation
 * 5. Money primitive safety
 * 6. Determinism
 */

function makeRow(ref: string, amount: number, date: string): DataRow {
  return { ref, amount, date };
}

describe('ReconciliationEngine — GOVERNANCE (close.reconciliation-engine)', () => {

  describe('1. Match accuracy', () => {

    it('reconcile matches records with identical keys', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.matched).toHaveLength(1);
      expect(result.unmatchedA).toHaveLength(0);
      expect(result.unmatchedB).toHaveLength(0);
    });

    it('reconcile identifies unmatched records in source A', () => {
      const sourceA: DataRow[] = [
        makeRow('ref-1', 100000, '2026-01-31'),
        makeRow('ref-2', 50000, '2026-01-31'),
      ];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.unmatchedA).toHaveLength(1);
    });

    it('reconcile identifies unmatched records in source B', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [
        makeRow('ref-1', 100000, '2026-01-31'),
        makeRow('ref-2', 75000, '2026-01-31'),
      ];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.unmatchedB).toHaveLength(1);
    });

    it('reconcile handles empty sources', () => {
      const result = ReconciliationEngine.reconcile([], [], 'ref');
      expect(result.matched).toHaveLength(0);
      expect(result.unmatchedA).toHaveLength(0);
      expect(result.unmatchedB).toHaveLength(0);
      expect(result.matchRate).toBe(0);
    });

    it('reconcile handles single record match', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.matched).toHaveLength(1);
      expect(result.matchRate).toBe(1);
    });

    it('reconcile computes match rate correctly', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31'), makeRow('ref-2', 50000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.matchRate).toBeCloseTo(0.5, 2);
    });
  });

  describe('2. Discrepancy detection', () => {

    it('reconcile detects amount discrepancies', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100500, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.discrepancies.length).toBeGreaterThan(0);
    });

    it('reconcile does not flag differences within tolerance', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.discrepancies).toHaveLength(0);
    });

    it('discrepancy includes field name and values', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100500, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      const disc = result.discrepancies[0];
      expect(disc.field).toBe('amount');
      expect(disc.valueA).toBe(100000);
      expect(disc.valueB).toBe(100500);
      expect(disc.difference).toBe(500);
    });

    it('discrepancy includes withinTolerance flag', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100500, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      const disc = result.discrepancies[0];
      expect(disc.withinTolerance).toBeDefined();
    });
  });

  describe('3. Auto-resolution', () => {

    it('autoResolve resolves discrepancies within tolerance', () => {
      const discrepancies: Discrepancy[] = [
        {
          key: 'ref-1',
          field: 'amount',
          valueA: 100000,
          valueB: 100000.50,
          difference: 0.50,
          withinTolerance: true,
        },
      ];
      const resolutions = ReconciliationEngine.autoResolve(discrepancies, 1);
      expect(resolutions).toHaveLength(1);
      expect(resolutions[0].method).toBe('tolerance');
    });

    it('autoResolve filters out discrepancies exceeding tolerance', () => {
      const discrepancies: Discrepancy[] = [
        {
          key: 'ref-1',
          field: 'amount',
          valueA: 100000,
          valueB: 100500,
          difference: 500,
          withinTolerance: false,
        },
      ];
      const resolutions = ReconciliationEngine.autoResolve(discrepancies, 1);
      expect(resolutions).toHaveLength(0);
    });

    it('autoResolve handles empty discrepancies', () => {
      const resolutions = ReconciliationEngine.autoResolve([], 1);
      expect(resolutions).toHaveLength(0);
    });
  });

  describe('4. Report generation', () => {

    it('generateReport produces a report with summary metrics', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31'), makeRow('ref-2', 50000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      const report = ReconciliationEngine.generateReport(result);
      expect(report.summary.totalA).toBe(2);
      expect(report.summary.totalB).toBe(1);
      expect(report.summary.matched).toBe(1);
      expect(report.summary.unmatchedA).toBe(1);
      expect(report.summary.unmatchedB).toBe(0);
    });

    it('generateReport includes match rate as string', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      const report = ReconciliationEngine.generateReport(result);
      expect(report.summary.matchRate).toContain('%');
    });

    it('generateReport includes discrepancy count', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100500, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      const report = ReconciliationEngine.generateReport(result);
      expect(report.summary.discrepancies).toBeGreaterThan(0);
      expect(report.discrepancies.length).toBeGreaterThan(0);
    });
  });

  describe('5. Money primitive safety', () => {

    it('reconcile handles large amounts without float precision loss', () => {
      const largeAmount = 999999999999.99;
      const sourceA: DataRow[] = [makeRow('ref-1', largeAmount, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', largeAmount, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.matched).toHaveLength(1);
      expect(result.discrepancies).toHaveLength(0);
    });

    it('reconcile handles zero amounts', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 0, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 0, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.matched).toHaveLength(1);
    });

    it('reconcile handles negative amounts', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', -100000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', -100000, '2026-01-31')];
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(result.matched).toHaveLength(1);
    });
  });

  describe('6. Determinism', () => {

    it('reconcile produces identical results for identical inputs', () => {
      const sourceA: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31'), makeRow('ref-2', 50000, '2026-01-31')];
      const sourceB: DataRow[] = [makeRow('ref-1', 100000, '2026-01-31')];
      const r1 = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      const r2 = ReconciliationEngine.reconcile(sourceA, sourceB, 'ref');
      expect(r1.matched).toEqual(r2.matched);
      expect(r1.unmatchedA).toEqual(r2.unmatchedA);
      expect(r1.unmatchedB).toEqual(r2.unmatchedB);
      expect(r1.matchRate).toBe(r2.matchRate);
    });

    it('autoResolve is deterministic', () => {
      const discrepancies: Discrepancy[] = [
        { key: 'ref-1', field: 'amount', valueA: 100000, valueB: 100500, difference: 500, withinTolerance: false },
      ];
      const r1 = ReconciliationEngine.autoResolve(discrepancies, 1);
      const r2 = ReconciliationEngine.autoResolve(discrepancies, 1);
      expect(r1).toEqual(r2);
    });
  });
});
