import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PresenceService } from './PresenceService';
import { WebSocketManager } from './WebSocketManager';

// Mock WebSocketManager
function createMockWs() {
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
    handlers,
  } as unknown as WebSocketManager & { emit: (type: string, data: unknown) => void };
}

describe('PresenceService', () => {
  let ws: ReturnType<typeof createMockWs>;
  let presence: PresenceService;

  beforeEach(() => {
    vi.useFakeTimers();
    ws = createMockWs();
    presence = new PresenceService(ws);
  });

  afterEach(() => {
    presence.destroy();
    vi.useRealTimers();
  });

  it('should initialize with empty users', () => {
    expect(presence.getUsers()).toEqual([]);
  });

  it('should send join message on initialize', () => {
    presence.initialize({
      id: 'user-1',
      firstName: 'Sarah',
      lastName: 'Chen',
      avatarUrl: null,
    });

    expect(ws.send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'presence:join',
        payload: expect.objectContaining({
          userId: 'user-1',
          userName: 'Sarah Chen',
          userInitials: 'SC',
        }),
      })
    );
  });

  it('should add user on join event', () => {
    const handler = vi.fn();
    presence.onChange(handler);

    // Simulate another user joining
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:join', {
      userId: 'user-2',
      userName: 'Mike Torres',
      userInitials: 'MT',
      avatarUrl: null,
      status: 'online',
      activeResourceType: null,
      activeResourceId: null,
      activeCellId: null,
      lastSeenAt: new Date().toISOString(),
      cursorColor: '#61AFEF',
    });

    expect(presence.getUsers()).toHaveLength(1);
    expect(presence.getUsers()[0].userId).toBe('user-2');
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'join' }));
  });

  it('should remove user on leave event', () => {
    // Add user first
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:join', {
      userId: 'user-2',
      userName: 'Mike Torres',
      userInitials: 'MT',
      avatarUrl: null,
      status: 'online',
      activeResourceType: null,
      activeResourceId: null,
      activeCellId: null,
      lastSeenAt: new Date().toISOString(),
      cursorColor: '#61AFEF',
    });

    expect(presence.getUsers()).toHaveLength(1);

    // Remove user
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:leave', {
      userId: 'user-2',
    });

    expect(presence.getUsers()).toHaveLength(0);
  });

  it('should update user presence', () => {
    // Add user
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:join', {
      userId: 'user-2',
      userName: 'Mike Torres',
      userInitials: 'MT',
      avatarUrl: null,
      status: 'online',
      activeResourceType: null,
      activeResourceId: null,
      activeCellId: null,
      lastSeenAt: new Date().toISOString(),
      cursorColor: '#61AFEF',
    });

    // Update
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:update', {
      userId: 'user-2',
      activeResourceType: 'budget',
      activeResourceId: 'bgt-001',
    });

    const users = presence.getUsers();
    expect(users[0].activeResourceType).toBe('budget');
    expect(users[0].activeResourceId).toBe('bgt-001');
  });

  it('should filter users by resource', () => {
    // Add two users on different resources
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:join', {
      userId: 'user-1',
      userName: 'Sarah Chen',
      userInitials: 'SC',
      avatarUrl: null,
      status: 'online',
      activeResourceType: 'budget',
      activeResourceId: 'bgt-001',
      activeCellId: null,
      lastSeenAt: new Date().toISOString(),
      cursorColor: '#E06C75',
    });

    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:join', {
      userId: 'user-2',
      userName: 'Mike Torres',
      userInitials: 'MT',
      avatarUrl: null,
      status: 'online',
      activeResourceType: 'forecast',
      activeResourceId: 'fcst-001',
      activeCellId: null,
      lastSeenAt: new Date().toISOString(),
      cursorColor: '#61AFEF',
    });

    const budgetViewers = presence.getUsersOnResource('budget', 'bgt-001');
    expect(budgetViewers).toHaveLength(1);
    expect(budgetViewers[0].userId).toBe('user-1');
  });

  it('should detect locked cells', () => {
    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit('presence:join', {
      userId: 'user-2',
      userName: 'Mike Torres',
      userInitials: 'MT',
      avatarUrl: null,
      status: 'online',
      activeResourceType: 'budget',
      activeResourceId: 'bgt-001',
      activeCellId: 'cell-q1-revenue',
      lastSeenAt: new Date().toISOString(),
      cursorColor: '#61AFEF',
    });

    expect(presence.isCellLocked('cell-q1-revenue', 'user-1')).toBe(true);
    expect(presence.isCellLocked('cell-q2-revenue', 'user-1')).toBe(false);
    expect(presence.isCellLocked('cell-q1-revenue', 'user-2')).toBe(false);
  });

  it('should assign colors to users', () => {
    presence.initialize({ id: 'user-1', firstName: 'A', lastName: 'B', avatarUrl: null });
    const color = presence.getColorForUser('user-1');
    expect(color).toBeTruthy();
    expect(color.startsWith('#')).toBe(true);
  });

  it('should load state from bulk state event', () => {
    const users = [
      {
        userId: 'u1',
        userName: 'A',
        userInitials: 'A',
        avatarUrl: null,
        status: 'online',
        activeResourceType: null,
        activeResourceId: null,
        activeCellId: null,
        lastSeenAt: '',
        cursorColor: '#aaa',
      },
      {
        userId: 'u2',
        userName: 'B',
        userInitials: 'B',
        avatarUrl: null,
        status: 'online',
        activeResourceType: null,
        activeResourceId: null,
        activeCellId: null,
        lastSeenAt: '',
        cursorColor: '#bbb',
      },
    ];

    const stateHandler = vi.fn();
    presence.onStateChange(stateHandler);

    (ws as unknown as { emit: (type: string, data: unknown) => void }).emit(
      'presence:state',
      users
    );

    expect(presence.getUsers()).toHaveLength(2);
    expect(stateHandler).toHaveBeenCalled();
  });
});
