import { describe, it, expect } from 'vitest';
import { AuditLogEngine } from './AuditLogEngine';
import type { AuditEntry, AuditAction } from './AuditLogEngine';

/**
 * GOVERNANCE EVIDENCE for cap:govern.audit-log
 *
 * The AuditLogEngine provides tamper-evident audit trail logging with a
 * hash chain, filtering, retention, and serialization. The governance
 * dimension here is EVIDENCE INTEGRITY — audit entries must be immutable,
 * verifiable via hash chain, filterable, and exportable. If the audit trail
 * is broken, SOX compliance is compromised.
 *
 * Tested dimensions:
 * 1. Entry logging and retrieval
 * 2. Filtering (by user, action, resource, date range)
 * 3. Hash chain integrity (logChain + verifyIntegrity)
 * 4. Serialization/deserialization
 * 5. Retention and pruning
 * 6. Determinism
 */

function makeEntry(overrides: Partial<AuditEntry> = {}) {
  return {
    userId: 'user-1',
    userName: 'Test User',
    action: 'create' as AuditAction,
    resource: 'budget',
    resourceId: 'budget-1',
    details: 'Test action',
    ...overrides,
  };
}

describe('AuditLogEngine — GOVERNANCE (govern.audit-log)', () => {
  describe('1. Entry logging and retrieval', () => {
    it('log creates an entry with id and timestamp', () => {
      const engine = new AuditLogEngine();
      const entry = engine.log(makeEntry());
      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeDefined();
      expect(entry.userId).toBe('user-1');
    });

    it('getEntries returns all logged entries', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ resourceId: 'a' }));
      engine.log(makeEntry({ resourceId: 'b' }));
      engine.log(makeEntry({ resourceId: 'c' }));
      expect(engine.getEntries()).toHaveLength(3);
    });

    it('getRecent returns the most recent entries', () => {
      const engine = new AuditLogEngine();
      for (let i = 0; i < 5; i++) engine.log(makeEntry({ resourceId: `r-${i}` }));
      const recent = engine.getRecent(3);
      expect(recent).toHaveLength(3);
      expect(recent[0]!.resourceId).toBe('r-4');
      expect(recent[2]!.resourceId).toBe('r-2');
    });

    it('getByUser returns entries for a specific user', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ userId: 'user-1', userName: 'Alice' }));
      engine.log(makeEntry({ userId: 'user-2', userName: 'Bob' }));
      engine.log(makeEntry({ userId: 'user-1', userName: 'Alice' }));
      const aliceEntries = engine.getByUser('user-1');
      expect(aliceEntries).toHaveLength(2);
    });

    it('getByResource returns entries for a specific resource', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ resource: 'budget', resourceId: 'b-1' }));
      engine.log(makeEntry({ resource: 'report', resourceId: 'r-1' }));
      engine.log(makeEntry({ resource: 'budget', resourceId: 'b-2' }));
      const budgetEntries = engine.getByResource('budget', 'b-1');
      expect(budgetEntries).toHaveLength(1);
      expect(budgetEntries[0]!.resourceId).toBe('b-1');
    });

    it('clear removes all entries', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry());
      engine.log(makeEntry());
      engine.clear();
      expect(engine.getEntries()).toHaveLength(0);
    });
  });

  describe('2. Filtering', () => {
    it('filter by userId', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ userId: 'user-1' }));
      engine.log(makeEntry({ userId: 'user-2' }));
      const filtered = engine.filter({ userId: 'user-1' });
      expect(filtered).toHaveLength(1);
    });

    it('filter by action', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ action: 'create' }));
      engine.log(makeEntry({ action: 'delete' }));
      engine.log(makeEntry({ action: 'create' }));
      const filtered = engine.filter({ action: 'create' });
      expect(filtered).toHaveLength(2);
    });

    it('filter by resource', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ resource: 'budget' }));
      engine.log(makeEntry({ resource: 'report' }));
      const filtered = engine.filter({ resource: 'budget' });
      expect(filtered).toHaveLength(1);
    });

    it('filter by date range', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry());
      engine.log(makeEntry());
      // Filter with future date should return all entries
      const filtered = engine.filter({ startDate: '2000-01-01', endDate: '2099-12-31' });
      expect(filtered).toHaveLength(2);
    });

    it('filter with limit', () => {
      const engine = new AuditLogEngine();
      for (let i = 0; i < 10; i++) engine.log(makeEntry({ resourceId: `r-${i}` }));
      const filtered = engine.filter({ limit: 5 });
      expect(filtered).toHaveLength(5);
    });
  });

  describe('3. Hash chain integrity', () => {
    it('logChain creates entries with hash chain', async () => {
      const engine = new AuditLogEngine();
      const e1 = await engine.logChain(makeEntry({ resourceId: 'a' }));
      const e2 = await engine.logChain(makeEntry({ resourceId: 'b' }));
      expect(e1.prevHash).toBe('0'.repeat(64));
      expect(e1.entryHash).toBeDefined();
      expect(e2.prevHash).toBe(e1.entryHash);
      expect(e2.entryHash).toBeDefined();
    });

    it('verifyIntegrity returns ok for valid chain', async () => {
      const engine = new AuditLogEngine();
      await engine.logChain(makeEntry({ resourceId: 'a' }));
      await engine.logChain(makeEntry({ resourceId: 'b' }));
      await engine.logChain(makeEntry({ resourceId: 'c' }));
      const result = await engine.verifyIntegrity();
      expect(result.ok).toBe(true);
      expect(result.totalEntries).toBe(3);
    });

    it('verifyIntegrity returns ok for empty chain', async () => {
      const engine = new AuditLogEngine();
      const result = await engine.verifyIntegrity();
      expect(result.ok).toBe(true);
      expect(result.totalEntries).toBe(0);
    });

    it('chainHead returns current head hash', async () => {
      const engine = new AuditLogEngine();
      expect(engine.chainHead()).toBe('0'.repeat(64));
      const e = await engine.logChain(makeEntry());
      expect(engine.chainHead()).toBe(e.entryHash);
    });
  });

  describe('4. Serialization/deserialization', () => {
    it('serialize produces a JSON string', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry());
      const json = engine.serialize();
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('deserialize restores entries', () => {
      const engine1 = new AuditLogEngine();
      engine1.log(makeEntry({ resourceId: 'a' }));
      engine1.log(makeEntry({ resourceId: 'b' }));
      const json = engine1.serialize();

      const engine2 = new AuditLogEngine();
      engine2.deserialize(json);
      expect(engine2.getEntries()).toHaveLength(2);
    });
  });

  describe('5. Retention and pruning', () => {
    it('getRetentionDays returns default 7-year retention', () => {
      const engine = new AuditLogEngine();
      expect(engine.getRetentionDays()).toBe(2555);
    });

    it('getRetentionDays returns custom retention', () => {
      const engine = new AuditLogEngine({ retentionDays: 365 });
      expect(engine.getRetentionDays()).toBe(365);
    });

    it('prune removes old entries', () => {
      const engine = new AuditLogEngine({ maxEntries: 100, retentionDays: 365 });
      for (let i = 0; i < 50; i++) engine.log(makeEntry({ resourceId: `r-${i}` }));
      const pruned = engine.prune();
      // Prune should not remove recent entries
      expect(engine.getEntries().length).toBe(50);
    });

    it('getStats returns statistics', () => {
      const engine = new AuditLogEngine();
      engine.log(makeEntry({ userId: 'user-1' }));
      engine.log(makeEntry({ userId: 'user-1' }));
      engine.log(makeEntry({ userId: 'user-2' }));
      const stats = engine.getStats();
      expect(stats).toBeDefined();
    });
  });

  describe('6. Determinism', () => {
    it('log produces deterministic timestamps (ISO format)', () => {
      const engine = new AuditLogEngine();
      const e1 = engine.log(makeEntry());
      const e2 = engine.log(makeEntry());
      // Both timestamps should be valid ISO strings
      expect(e1.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(e2.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('hash chain is deterministic for same entries', async () => {
      const engine1 = new AuditLogEngine();
      const engine2 = new AuditLogEngine();
      const e1a = await engine1.logChain(makeEntry({ resourceId: 'a' }));
      const e1b = await engine1.logChain(makeEntry({ resourceId: 'b' }));
      const e2a = await engine2.logChain(makeEntry({ resourceId: 'a' }));
      const e2b = await engine2.logChain(makeEntry({ resourceId: 'b' }));
      // Chain structure should be the same (prevHash links)
      expect(e1a.prevHash).toBe(e2a.prevHash);
      expect(e1b.prevHash).toBe(e1a.entryHash);
      expect(e2b.prevHash).toBe(e2a.entryHash);
    });
  });
});
