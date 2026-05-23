/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { ReconciliationEngine } from './ReconciliationEngine';

describe('ReconciliationEngine', () => {
  const sourceA = [
    { id: '1', account: 'Revenue', amount: 1000 },
    { id: '2', account: 'COGS', amount: 500 },
    { id: '3', account: 'Marketing', amount: 200 },
  ];

  const sourceB = [
    { id: '1', account: 'Revenue', amount: 1000 },
    { id: '2', account: 'COGS', amount: 520 },
    { id: '4', account: 'Admin', amount: 100 },
  ];

  describe('matchRecords', () => {
    it('matches records by key', () => {
      const result = ReconciliationEngine.matchRecords(sourceA, sourceB, 'id');
      expect(result.matched.length).toBe(2);
      expect(result.unmatchedA.length).toBe(1);
      expect(result.unmatchedB.length).toBe(1);
    });

    it('returns empty for no matches', () => {
      const result = ReconciliationEngine.matchRecords(
        [{ id: 'x', account: 'A', amount: 1 }],
        [{ id: 'y', account: 'B', amount: 2 }],
        'id'
      );
      expect(result.matched.length).toBe(0);
    });
  });

  describe('findDiscrepancies', () => {
    it('finds discrepancies above tolerance', () => {
      const { matched } = ReconciliationEngine.matchRecords(sourceA, sourceB, 'id');
      const discrepancies = ReconciliationEngine.findDiscrepancies(matched, 10);
      expect(discrepancies.length).toBeGreaterThan(0);
    });

    it('ignores discrepancies within tolerance', () => {
      const { matched } = ReconciliationEngine.matchRecords(sourceA, sourceB, 'id');
      const discrepancies = ReconciliationEngine.findDiscrepancies(matched, 1000);
      expect(discrepancies.length).toBe(0);
    });
  });

  describe('reconcile', () => {
    it('produces a full reconciliation result', () => {
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'id');
      expect(result).toBeDefined();
      expect(result.matched).toBeDefined();
      expect(result.unmatchedA).toBeDefined();
      expect(result.unmatchedB).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('generates a reconciliation report', () => {
      const result = ReconciliationEngine.reconcile(sourceA, sourceB, 'id');
      const report = ReconciliationEngine.generateReport(result);
      expect(report).toBeDefined();
    });
  });
});
