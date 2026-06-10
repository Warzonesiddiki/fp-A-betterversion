import { describe, it, expect, beforeEach } from 'vitest';
import { AuditEngine } from './AuditEngine';

describe('AuditEngine', () => {
  beforeEach(() => {
    AuditEngine.reset();
  });

  describe('log', () => {
    it('creates audit entry with required fields', () => {
      const entry = AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'Q1 Budget',
      });
      expect(entry.id).toMatch(/^audit-/);
      expect(entry.userId).toBe('u1');
      expect(entry.userName).toBe('Alice');
      expect(entry.action).toBe('update');
      expect(entry.severity).toBe('INFO');
      expect(entry.oldValue).toBeNull();
      expect(entry.newValue).toBeNull();
    });

    it('captures old and new values', () => {
      const entry = AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'Q1 Budget',
        oldValue: 1000,
        newValue: 1500,
        severity: 'WARNING',
      });
      expect(entry.oldValue).toBe(1000);
      expect(entry.newValue).toBe(1500);
      expect(entry.severity).toBe('WARNING');
    });

    it('appends to entries list', () => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'A',
        action: 'a',
        resourceType: 't',
        resourceId: 'r1',
        resourceName: 'R',
      });
      AuditEngine.log({
        userId: 'u2',
        userName: 'B',
        action: 'b',
        resourceType: 't',
        resourceId: 'r2',
        resourceName: 'R2',
      });
      expect(AuditEngine.getAll()).toHaveLength(2);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'B1',
        severity: 'INFO',
      });
      AuditEngine.log({
        userId: 'u2',
        userName: 'Bob',
        action: 'delete',
        resourceType: 'forecast',
        resourceId: 'f1',
        resourceName: 'F1',
        severity: 'CRITICAL',
      });
      AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'update',
        resourceType: 'budget',
        resourceId: 'b2',
        resourceName: 'B2',
        severity: 'WARNING',
      });
    });

    it('returns all when no filters', () => {
      expect(AuditEngine.query()).toHaveLength(3);
    });

    it('filters by userId', () => {
      expect(AuditEngine.query({ userId: 'u1' })).toHaveLength(2);
    });

    it('filters by resourceType', () => {
      expect(AuditEngine.query({ resourceType: 'budget' })).toHaveLength(2);
    });

    it('filters by severity', () => {
      expect(AuditEngine.query({ severity: 'CRITICAL' })).toHaveLength(1);
    });

    it('applies limit', () => {
      expect(AuditEngine.query({ limit: 1 })).toHaveLength(1);
    });

    it('sorts by timestamp descending', () => {
      AuditEngine.reset();
      AuditEngine.log({
        userId: 'u1',
        userName: 'A',
        action: 'first',
        resourceType: 't',
        resourceId: 'r1',
        resourceName: 'R1',
      });
      AuditEngine.log({
        userId: 'u2',
        userName: 'B',
        action: 'second',
        resourceType: 't',
        resourceId: 'r2',
        resourceName: 'R2',
      });
      const results = AuditEngine.query();
      expect(results).toHaveLength(2);
      // Entries have nearly identical timestamps — just verify descending order property
      for (let i = 0; i < results.length - 1; i++) {
        expect(results![i]!.timestamp >= results![i + 1]!.timestamp).toBe(true);
      }
    });
  });

  describe('exportCSV', () => {
    it('generates CSV with headers and rows', () => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'B1',
      });
      const csv = AuditEngine.exportCSV();
      const lines = csv.split('\n');
      expect(lines).toHaveLength(2);
      expect(lines[0]!).toContain('ID');
      expect(lines[0]!).toContain('User');
      expect(lines[1]!).toContain('Alice');
    });

    it('respects filters', () => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'B1',
      });
      AuditEngine.log({
        userId: 'u2',
        userName: 'Bob',
        action: 'delete',
        resourceType: 'forecast',
        resourceId: 'f1',
        resourceName: 'F1',
      });
      const csv = AuditEngine.exportCSV({ userId: 'u1' });
      expect(csv.split('\n')).toHaveLength(2);
    });
  });

  describe('exportJSON', () => {
    it('returns valid JSON', () => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'Alice',
        action: 'create',
        resourceType: 'budget',
        resourceId: 'b1',
        resourceName: 'B1',
      });
      const json = AuditEngine.exportJSON();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('counts by severity and resource type', () => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'A',
        action: 'a',
        resourceType: 'budget',
        resourceId: 'r1',
        resourceName: 'R1',
        severity: 'INFO',
      });
      AuditEngine.log({
        userId: 'u1',
        userName: 'A',
        action: 'a',
        resourceType: 'budget',
        resourceId: 'r2',
        resourceName: 'R2',
        severity: 'WARNING',
      });
      AuditEngine.log({
        userId: 'u2',
        userName: 'B',
        action: 'b',
        resourceType: 'forecast',
        resourceId: 'r3',
        resourceName: 'R3',
        severity: 'CRITICAL',
      });
      const stats = AuditEngine.getStats();
      expect(stats.total).toBe(3);
      expect(stats.bySeverity.INFO).toBe(1);
      expect(stats.bySeverity.WARNING).toBe(1);
      expect(stats.bySeverity.CRITICAL).toBe(1);
      expect(stats.byResourceType.budget).toBe(2);
      expect(stats.byResourceType.forecast).toBe(1);
      expect(stats.recentActions).toHaveLength(3);
    });

    it('returns empty stats when no entries', () => {
      const stats = AuditEngine.getStats();
      expect(stats.total).toBe(0);
      expect(stats.bySeverity.INFO).toBe(0);
    });
  });

  describe('archive', () => {
    it('removes entries older than retention', () => {
      // Log with old timestamp by manipulating Date
      const entry = AuditEngine.log({
        userId: 'u1',
        userName: 'A',
        action: 'a',
        resourceType: 't',
        resourceId: 'r',
        resourceName: 'R',
      });
      // Manually backdate
      (entry as { timestamp: string }).timestamp = '2020-01-01T00:00:00.000Z';
      AuditEngine.log({
        userId: 'u2',
        userName: 'B',
        action: 'b',
        resourceType: 't',
        resourceId: 'r2',
        resourceName: 'R2',
      });
      const removed = AuditEngine.archive(365);
      expect(removed).toBe(1);
      expect(AuditEngine.getAll()).toHaveLength(1);
    });
  });

  describe('reset', () => {
    it('clears all entries', () => {
      AuditEngine.log({
        userId: 'u1',
        userName: 'A',
        action: 'a',
        resourceType: 't',
        resourceId: 'r',
        resourceName: 'R',
      });
      AuditEngine.reset();
      expect(AuditEngine.getAll()).toHaveLength(0);
    });
  });
});
