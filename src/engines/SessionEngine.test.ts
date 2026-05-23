import { describe, it, expect, beforeEach } from 'vitest';
import { SessionEngine, type DeviceInfo } from './SessionEngine';

const mockDevice: DeviceInfo = {
  userAgent: 'Mozilla/5.0',
  platform: 'Windows',
  deviceName: 'Desktop',
};

describe('SessionEngine', () => {
  let engine: SessionEngine;

  beforeEach(() => {
    engine = new SessionEngine();
  });

  it('should create a session', () => {
    const session = engine.createSession('user1', mockDevice);
    expect(session.id).toMatch(/^sess-/);
    expect(session.userId).toBe('user1');
    expect(session.isActive).toBe(true);
    expect(session.device).toEqual(mockDevice);
    expect(session.createdAt).toBeDefined();
    expect(session.expiresAt).toBeDefined();
  });

  it('should get a session', () => {
    const session = engine.createSession('user1', mockDevice);
    const retrieved = engine.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe(session.id);
  });

  it('should return undefined for non-existent session', () => {
    expect(engine.getSession('nonexistent')).toBeUndefined();
  });

  it('should refresh a session', () => {
    const session = engine.createSession('user1', mockDevice);
    const refreshed = engine.refreshSession(session.id);
    expect(refreshed).not.toBeNull();
    expect(refreshed!.lastActivity).toBeDefined();
  });

  it('should invalidate a session', () => {
    const session = engine.createSession('user1', mockDevice);
    expect(engine.invalidateSession(session.id)).toBe(true);
    const retrieved = engine.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved!.isActive).toBe(false);
  });

  it('should return false when invalidating non-existent session', () => {
    expect(engine.invalidateSession('nonexistent')).toBe(false);
  });

  it('should invalidate all sessions for a user', () => {
    engine.createSession('user1', mockDevice);
    engine.createSession('user1', mockDevice);
    engine.createSession('user2', mockDevice);

    const count = engine.invalidateAllForUser('user1');
    expect(count).toBe(2);
    expect(engine.getActiveSessions('user1')).toEqual([]);
    expect(engine.getActiveSessions('user2').length).toBe(1);
  });

  it('should get active sessions for a user', () => {
    engine.createSession('user1', mockDevice);
    engine.createSession('user1', mockDevice);
    engine.createSession('user2', mockDevice);

    expect(engine.getActiveSessions('user1').length).toBe(2);
    expect(engine.getActiveSessions('user2').length).toBe(1);
  });

  it('should get all active sessions', () => {
    engine.createSession('user1', mockDevice);
    engine.createSession('user2', mockDevice);
    expect(engine.getAllActiveSessions().length).toBe(2);
  });

  it('should validate a session', () => {
    const session = engine.createSession('user1', mockDevice);
    const result = engine.validateSession(session.id);
    expect(result.valid).toBe(true);
  });

  it('should return invalid for non-existent session', () => {
    const result = engine.validateSession('nonexistent');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Session not found');
  });

  it('should return invalid for invalidated session', () => {
    const session = engine.createSession('user1', mockDevice);
    engine.invalidateSession(session.id);
    const result = engine.validateSession(session.id);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Session invalidated');
  });

  it('should get session count', () => {
    engine.createSession('user1', mockDevice);
    engine.createSession('user1', mockDevice);
    engine.createSession('user2', mockDevice);

    const count = engine.getSessionCount();
    expect(count.total).toBe(3);
    expect(count.active).toBe(3);
    expect(count.expired).toBe(0);
  });

  it('should enforce session limit', () => {
    const limitedEngine = new SessionEngine({ maxConcurrentSessions: 2 });
    limitedEngine.createSession('user1', mockDevice);
    limitedEngine.createSession('user1', mockDevice);
    limitedEngine.createSession('user1', mockDevice); // Should evict oldest

    expect(limitedEngine.getActiveSessions('user1').length).toBe(2);
  });

  it('should serialize and deserialize', () => {
    engine.createSession('user1', mockDevice);
    const json = engine.serialize();
    expect(json).toContain('user1');

    const engine2 = new SessionEngine();
    engine2.deserialize(json);
    expect(engine2.getAllActiveSessions().length).toBe(1);
  });

  it('should purge expired sessions', () => {
    const shortEngine = new SessionEngine({ timeoutMinutes: -1 });
    shortEngine.createSession('user1', mockDevice);
    shortEngine.createSession('user1', mockDevice);

    const purged = shortEngine.purgeExpired();
    expect(purged).toBe(2);
    expect(shortEngine.getSessionCount().total).toBe(0);
  });
});
