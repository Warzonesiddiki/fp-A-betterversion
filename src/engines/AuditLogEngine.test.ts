import { describe, it, expect, beforeEach } from 'vitest';
import { AuditLogEngine, type AuditAction } from './AuditLogEngine';

describe('AuditLogEngine', () => {
  let engine: AuditLogEngine;

  beforeEach(() => {
    engine = new AuditLogEngine();
  });

  it('should initialize with default config', () => {
    expect(engine.getStats().total).toBe(0);
  });

  it('should log an entry', () => {
    const entry = engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'budget-1',
    });
    expect(entry.id).toMatch(/^audit-/);
    expect(entry.timestamp).toBeDefined();
    expect(entry.userId).toBe('user1');
    expect(entry.action).toBe('create');
  });

  it('should get recent entries', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user2',
      userName: 'Bob',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'delete',
      resource: 'budget',
      resourceId: 'b3',
    });

    const recent = engine.getRecent(2);
    expect(recent.length).toBe(2);
    expect(recent[0].resourceId).toBe('b3');
    expect(recent[1].resourceId).toBe('b2');
  });

  it('should filter by userId', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user2',
      userName: 'Bob',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });

    const filtered = engine.filter({ userId: 'user1' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].userId).toBe('user1');
  });

  it('should filter by action', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });

    const filtered = engine.filter({ action: 'create' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].action).toBe('create');
  });

  it('should filter by resource', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'report',
      resourceId: 'r1',
    });

    const filtered = engine.filter({ resource: 'budget' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].resource).toBe('budget');
  });

  it('should get by resource', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user2',
      userName: 'Bob',
      action: 'update',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b2',
    });

    const entries = engine.getByResource('budget', 'b1');
    expect(entries.length).toBe(2);
  });

  it('should get by user', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });
    engine.log({
      userId: 'user2',
      userName: 'Bob',
      action: 'create',
      resource: 'budget',
      resourceId: 'b3',
    });

    const entries = engine.getByUser('user1');
    expect(entries.length).toBe(2);
  });

  it('should get by user with limit', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'delete',
      resource: 'budget',
      resourceId: 'b3',
    });

    const entries = engine.getByUser('user1', 2);
    expect(entries.length).toBe(2);
  });

  it('should get stats', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });
    engine.log({
      userId: 'user2',
      userName: 'Bob',
      action: 'create',
      resource: 'report',
      resourceId: 'r1',
    });

    const stats = engine.getStats();
    expect(stats.total).toBe(3);
    expect(stats.byAction['create']).toBe(2);
    expect(stats.byAction['update']).toBe(1);
    expect(stats.byResource['budget']).toBe(2);
    expect(stats.byResource['report']).toBe(1);
    expect(stats.byUser['user1']).toBe(2);
    expect(stats.byUser['user2']).toBe(1);
  });

  it('should export to CSV', () => {
    engine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    const csv = engine.exportCSV();
    expect(csv).toContain('id,timestamp,userId');
    expect(csv).toContain('user1');
    expect(csv).toContain('create');
  });

  it('should enforce max entries', () => {
    const smallEngine = new AuditLogEngine({ maxEntries: 3 });
    smallEngine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'create',
      resource: 'budget',
      resourceId: 'b1',
    });
    smallEngine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'update',
      resource: 'budget',
      resourceId: 'b2',
    });
    smallEngine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'delete',
      resource: 'budget',
      resourceId: 'b3',
    });
    smallEngine.log({
      userId: 'user1',
      userName: 'Alice',
      action: 'approve',
      resource: 'budget',
      resourceId: 'b4',
    });

    expect(smallEngine.getStats().total).toBe(3);
  });

  it('should handle all audit actions', () => {
    const actions: AuditAction[] = [
      'create',
      'update',
      'delete',
      'approve',
      'reject',
      'login',
      'logout',
      'export',
      'import',
      'view',
      'comment',
    ];
    for (const action of actions) {
      engine.log({
        userId: 'user1',
        userName: 'Alice',
        action,
        resource: 'test',
        resourceId: 't1',
      });
    }
    expect(engine.getStats().total).toBe(actions.length);
  });
});
