import { describe, it, expect, beforeEach } from 'vitest';
import { SyncEngine } from './SyncEngine';

describe('SyncEngine', () => {
  beforeEach(() => {
    SyncEngine.cleanup(0);
  });

  it('enqueues a change', () => {
    SyncEngine.enqueue({
      entityType: 'comment',
      entityId: 'c1',
      action: 'create',
      data: { text: 'hello' },
      userId: 'user1',
    });
    const status = SyncEngine.getStatus();
    expect(status.pending).toBeGreaterThan(0);
  });

  it('gets status', () => {
    const status = SyncEngine.getStatus();
    expect(status).toBeDefined();
    expect(status.pending).toBeDefined();
    expect(status.synced).toBeDefined();
  });

  it('exports queue', () => {
    const exported = SyncEngine.exportQueue();
    expect(typeof exported).toBe('string');
  });

  it('imports queue', () => {
    const data = JSON.stringify([
      {
        id: 'test',
        entityType: 'comment',
        entityId: 'c1',
        action: 'create',
        data: {},
        timestamp: Date.now(),
        userId: 'u1',
        synced: false,
        retryCount: 0,
      },
    ]);
    SyncEngine.importQueue(data);
    const status = SyncEngine.getStatus();
    expect(status.pending).toBeGreaterThan(0);
  });

  it('cleans up old items', () => {
    const cleaned = SyncEngine.cleanup(0);
    expect(typeof cleaned).toBe('number');
  });
});
