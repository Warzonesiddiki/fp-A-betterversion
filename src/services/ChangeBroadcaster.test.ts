import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeBroadcaster } from './ChangeBroadcaster';
import type { WebSocketManager } from './WebSocketManager';

interface MockWebSocket {
  on: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  emit: (type: string, data: unknown) => void;
}

function createMockWs(): MockWebSocket {
  const handlers = new Map<string, Set<(data: unknown) => void>>();
  return {
    on: vi.fn((type: string, handler: (data: unknown) => void) => {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)!.add(handler);
      return () => handlers.get(type)?.delete(handler);
    }),
    send: vi.fn(),
    emit: (type: string, data: unknown) => {
      handlers.get(type)?.forEach((fn) => fn(data));
    },
  } as MockWebSocket;
}

describe('ChangeBroadcaster', () => {
  let ws: MockWebSocket;
  let broadcaster: ChangeBroadcaster;

  beforeEach(() => {
    ws = createMockWs();
    broadcaster = new ChangeBroadcaster(ws as unknown as WebSocketManager);
    broadcaster.setUser('user-1');
  });

  it('should broadcast changes with generated id and timestamp', () => {
    const id = broadcaster.broadcast({
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      field: 'q1Amount',
      oldValue: 100,
      newValue: 150,
      userName: 'Sarah Chen',
    });

    expect(id).toMatch(/^chg-/);
    expect(ws.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'change:broadcast',
        payload: expect.objectContaining({
          type: 'update',
          resourceType: 'budget',
          resourceId: 'bgt-001',
          userId: 'user-1',
        }),
      })
    );
  });

  it('should broadcast cell changes via convenience method', () => {
    broadcaster.broadcastCellChange('budget', 'bgt-001', 'q1Amount', 100, 150, 'Sarah Chen');

    expect(ws.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'change:broadcast',
        payload: expect.objectContaining({
          type: 'update',
          field: 'q1Amount',
          oldValue: 100,
          newValue: 150,
        }),
      })
    );
  });

  it('should broadcast create events', () => {
    broadcaster.broadcastCreate('budget', 'bgt-new', 'Sarah Chen');

    expect(ws.send).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ type: 'create' }),
      })
    );
  });

  it('should broadcast delete events', () => {
    broadcaster.broadcastDelete('budget', 'bgt-old', 'Sarah Chen');

    expect(ws.send).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({ type: 'delete' }),
      })
    );
  });

  it('should notify handlers on incoming changes from other users', () => {
    const handler = vi.fn();
    broadcaster.onChange(handler);

    // Simulate incoming change from another user
    ws.emit('change:broadcast', {
      id: 'chg-other-1',
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      field: 'q1Amount',
      oldValue: 100,
      newValue: 200,
      userId: 'user-2',
      userName: 'Mike Torres',
      timestamp: new Date().toISOString(),
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-2', resourceId: 'bgt-001' })
    );
  });

  it('should ignore own changes echoed back', () => {
    const handler = vi.fn();
    broadcaster.onChange(handler);

    ws.emit('change:broadcast', {
      id: 'chg-self-1',
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      userId: 'user-1',
      userName: 'Sarah Chen',
      timestamp: new Date().toISOString(),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should detect recent changes for a resource', () => {
    // Simulate incoming change
    ws.emit('change:broadcast', {
      id: 'chg-1',
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      userId: 'user-2',
      userName: 'Mike',
      timestamp: new Date().toISOString(),
    });

    expect(broadcaster.hasRecentChanges('budget', 'bgt-001')).toBe(true);
    expect(broadcaster.hasRecentChanges('budget', 'bgt-002')).toBe(false);
  });

  it('should return recent changes for a resource', () => {
    ws.emit('change:broadcast', {
      id: 'chg-1',
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      userId: 'user-2',
      userName: 'Mike',
      timestamp: '2024-01-01T10:00:00Z',
    });

    ws.emit('change:broadcast', {
      id: 'chg-2',
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      userId: 'user-3',
      userName: 'Alex',
      timestamp: '2024-01-01T11:00:00Z',
    });

    const changes = broadcaster.getRecentChanges('budget', 'bgt-001');
    expect(changes).toHaveLength(2);
    // Should be sorted newest first
    expect(changes![0]!.userId).toBe('user-3');
  });

  it('should notify conflict handlers', () => {
    const conflictHandler = vi.fn();
    broadcaster.onConflict(conflictHandler);

    ws.emit('change:conflict', {
      incomingChange: { id: 'chg-1' },
      localValue: 100,
      resolution: 'accept-remote',
    });

    expect(conflictHandler).toHaveBeenCalled();
  });

  it('should dedup incoming changes', () => {
    const handler = vi.fn();
    broadcaster.onChange(handler);

    const change = {
      id: 'chg-dedup-1',
      type: 'update',
      resourceType: 'budget',
      resourceId: 'bgt-001',
      userId: 'user-2',
      userName: 'Mike',
      timestamp: new Date().toISOString(),
    };

    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit(
      'change:broadcast',
      change
    );
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit(
      'change:broadcast',
      change
    );

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should clean up on destroy', () => {
    broadcaster.onChange(() => {});
    broadcaster.onConflict(() => {});
    broadcaster.destroy();

    // Should not throw
    expect(broadcaster.hasRecentChanges('budget', 'bgt-001')).toBe(false);
  });
});
