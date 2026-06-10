import { describe, it, expect, beforeEach } from 'vitest';
import { CellAuditTrailEngine } from './CellAuditTrailEngine';
import type { CellAuditEntry } from '@/types';

describe('CellAuditTrailEngine', () => {
  let engine: CellAuditTrailEngine;

  beforeEach(() => {
    engine = new CellAuditTrailEngine();
  });

  const makeEntry = (overrides: Partial<CellAuditEntry> = {}): CellAuditEntry => ({
    id: 'entry-1',
    cellId: 'A1',
    accountId: 'acc-1',
    accountName: 'Revenue',
    month: 1,
    oldValue: 0,
    newValue: 1000,
    userId: 'user-1',
    userName: 'Alice',
    timestamp: '2024-01-15T10:00:00Z',
    reason: 'manual_edit',
    ...overrides,
  });

  describe('recordChange', () => {
    it('should record a change entry', () => {
      engine.recordChange(makeEntry());
      expect(engine.getAllEntries()).toHaveLength(1);
    });

    it('should generate ID if missing', () => {
      engine.recordChange(makeEntry({ id: '' }));
      const entries = engine.getAllEntries();
      expect(entries![0]!.id).toBeTruthy();
    });
  });

  describe('getHistory', () => {
    it('should return history for a specific cell sorted by timestamp desc', () => {
      engine.recordChange(makeEntry({ cellId: 'A1', timestamp: '2024-01-16T10:00:00Z' }));
      engine.recordChange(makeEntry({ cellId: 'A1', timestamp: '2024-01-15T10:00:00Z' }));
      engine.recordChange(makeEntry({ cellId: 'B1', timestamp: '2024-01-15T10:00:00Z' }));

      const history = engine.getHistory('A1');
      expect(history).toHaveLength(2);
      expect(history![0]!.timestamp).toBe('2024-01-16T10:00:00Z');
    });

    it('should return empty for cell with no changes', () => {
      expect(engine.getHistory('X99')).toEqual([]);
    });
  });

  describe('getChangesByUser', () => {
    it('should filter by user', () => {
      engine.recordChange(makeEntry({ userId: 'user-1' }));
      engine.recordChange(makeEntry({ userId: 'user-1', id: 'e2' }));
      engine.recordChange(makeEntry({ userId: 'user-2', id: 'e3' }));

      expect(engine.getChangesByUser('user-1')).toHaveLength(2);
      expect(engine.getChangesByUser('user-3')).toEqual([]);
    });
  });

  describe('getChangesByDateRange', () => {
    it('should filter by date range', () => {
      engine.recordChange(makeEntry({ timestamp: '2024-01-10T10:00:00Z' }));
      engine.recordChange(makeEntry({ timestamp: '2024-01-20T10:00:00Z' }));
      engine.recordChange(makeEntry({ timestamp: '2024-02-01T10:00:00Z' }));

      const result = engine.getChangesByDateRange('2024-01-01', '2024-02-01');
      expect(result).toHaveLength(2);
    });

    it('should return empty for range with no matches', () => {
      engine.recordChange(makeEntry({ timestamp: '2024-01-15T10:00:00Z' }));
      expect(engine.getChangesByDateRange('2024-02-01', '2024-03-01')).toEqual([]);
    });
  });

  describe('getAuditReport', () => {
    it('should generate audit report', () => {
      engine.recordChange(makeEntry({ cellId: 'A1', userId: 'u1', reason: 'manual_edit' }));
      engine.recordChange(
        makeEntry({ cellId: 'A1', userId: 'u2', reason: 'formula_update', id: 'e2' })
      );
      engine.recordChange(
        makeEntry({ cellId: 'B1', userId: 'u1', reason: 'manual_edit', id: 'e3' })
      );

      const report = engine.getAuditReport();
      expect(report.totalChanges).toBe(3);
      expect(report.uniqueUsers).toEqual(expect.arrayContaining(['u1', 'u2']));
      expect(report.uniqueCells).toEqual(expect.arrayContaining(['A1', 'B1']));
      expect(report.changesByType.manual_edit).toBe(2);
      expect(report.changesByType.formula_update).toBe(1);
    });

    it('should handle empty history', () => {
      const report = engine.getAuditReport();
      expect(report.totalChanges).toBe(0);
      expect(report.uniqueUsers).toEqual([]);
      expect(report.dateRange.earliest).toBe('');
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      engine.recordChange(makeEntry());
      engine.clear();
      expect(engine.getAllEntries()).toHaveLength(0);
    });
  });
});
