import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RealtimeCollaborationManager } from './RealtimeCollaborationManager';

describe('RealtimeCollaborationManager', () => {
  beforeEach(() => {
    RealtimeCollaborationManager.resetInstance();
  });

  afterEach(() => {
    RealtimeCollaborationManager.resetInstance();
  });

  it('should return a singleton instance', () => {
    const a = RealtimeCollaborationManager.getInstance();
    const b = RealtimeCollaborationManager.getInstance();
    expect(a).toBe(b);
  });

  it('should throw when accessing services before initialization', () => {
    const mgr = RealtimeCollaborationManager.getInstance();
    expect(() => mgr.presence).toThrow('not initialized');
    expect(() => mgr.changes).toThrow('not initialized');
  });

  it('should initialize with config', () => {
    const mgr = RealtimeCollaborationManager.getInstance();
    mgr.initialize({ wsUrl: 'wss://test.example.com/ws' });

    // Should not throw after init
    expect(mgr.presence).toBeDefined();
    expect(mgr.changes).toBeDefined();
  });

  it('should report disconnected state before connecting', () => {
    const mgr = RealtimeCollaborationManager.getInstance();
    mgr.initialize({ wsUrl: 'wss://test.example.com/ws' });

    expect(mgr.connectionState).toBe('disconnected');
    expect(mgr.isConnected).toBe(false);
  });

  it('should reset instance cleanly', () => {
    const mgr = RealtimeCollaborationManager.getInstance();
    mgr.initialize({ wsUrl: 'wss://test.example.com/ws' });

    RealtimeCollaborationManager.resetInstance();

    const mgr2 = RealtimeCollaborationManager.getInstance();
    expect(() => mgr2.presence).toThrow('not initialized');
  });

  it('should re-initialize when called twice', () => {
    const mgr = RealtimeCollaborationManager.getInstance();
    mgr.initialize({ wsUrl: 'wss://first.example.com/ws' });
    const firstPresence = mgr.presence;

    mgr.initialize({ wsUrl: 'wss://second.example.com/ws' });
    const secondPresence = mgr.presence;

    // Should be different instances after re-init
    expect(firstPresence).not.toBe(secondPresence);
  });

  it('should accept connection state change callbacks', () => {
    const mgr = RealtimeCollaborationManager.getInstance();
    mgr.initialize({ wsUrl: 'wss://test.example.com/ws' });

    const handler = vi.fn();
    const unsub = mgr.onConnectionStateChange(handler);

    // State should be disconnected
    expect(mgr.connectionState).toBe('disconnected');

    unsub();
  });
});
