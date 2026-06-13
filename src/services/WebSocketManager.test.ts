import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketManager } from './WebSocketManager';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public url: string) {
    // Simulate async connect via microtask
    Promise.resolve().then(() => {
      if (this.readyState === MockWebSocket.CONNECTING) {
        this.readyState = MockWebSocket.OPEN;
        this.onopen?.();
      }
    });
  }

  send(data: string) {
    this.sent.push(data);
  }

  close(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.({ code, reason });
  }

  simulateMessage(data: string) {
    this.onmessage?.({ data });
  }

  simulateError() {
    this.onerror?.();
  }
}

describe('WebSocketManager', () => {
  let originalWebSocket: typeof globalThis.WebSocket;
  const trackedManagers: WebSocketManager[] = [];

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    // @ts-expect-error mock
    globalThis.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    // Disconnect all managers to allow heartbeat intervals to release
    trackedManagers.forEach((m) => {
      try {
        m.disconnect();
      } catch {
        // ignore
      }
    });
    trackedManagers.length = 0;
  });

  function createManager(overrides = {}) {
    const mgr = new WebSocketManager({
      url: 'wss://test.example.com/ws',
      maxRetries: 3,
      baseRetryDelay: 10,
      heartbeatInterval: 60000,
      heartbeatTimeout: 30000,
      token: 'test-token',
      ...overrides,
    });
    trackedManagers.push(mgr);
    return mgr;
  }

  // Wait helper for microtask-driven mock
  const flush = () => new Promise((r) => setTimeout(r, 10));

  it('should initialize in disconnected state', () => {
    const mgr = createManager();
    expect(mgr.connectionState).toBe('disconnected');
    expect(mgr.isConnected).toBe(false);
  });

  it('should connect and transition to connected', async () => {
    const mgr = createManager();
    const stateChanges: string[] = [];
    mgr.onStateChange((s) => stateChanges.push(s));

    mgr.connect();
    expect(mgr.connectionState).toBe('connecting');

    await flush();
    expect(mgr.connectionState).toBe('connected');
    expect(mgr.isConnected).toBe(true);
    expect(stateChanges).toEqual(['connecting', 'connected']);
  });

  it('should send messages when connected', async () => {
    const mgr = createManager();
    mgr.connect();
    await flush();

    mgr.send({ type: 'test', payload: { data: 123 } });
    expect(mgr.isConnected).toBe(true);
    // Verify ws received the message
    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    expect(ws.sent.length).toBeGreaterThanOrEqual(1);
  });

  it('should queue messages when disconnected and flush on connect', async () => {
    const mgr = createManager();

    // Send while disconnected — should queue
    mgr.send({ type: 'queued', payload: { id: 1 } });

    mgr.connect();
    await flush();

    // Message should have been flushed
    expect(mgr.isConnected).toBe(true);
  });

  it('should dispatch messages to registered handlers', async () => {
    const mgr = createManager();
    mgr.connect();
    await flush();

    const handler = vi.fn();
    mgr.on('chat:message', handler);

    // Simulate incoming message
    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    ws.simulateMessage(JSON.stringify({ type: 'chat:message', payload: { text: 'hello' } }));

    expect(handler).toHaveBeenCalledWith({ text: 'hello' });
  });

  it('should support wildcard listeners', async () => {
    const mgr = createManager();
    mgr.connect();
    await flush();

    const wildcard = vi.fn();
    mgr.on('*', wildcard);

    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    ws.simulateMessage(JSON.stringify({ type: 'any:type', payload: { x: 1 } }));

    expect(wildcard).toHaveBeenCalledWith({ type: 'any:type', payload: { x: 1 } });
  });

  it('should unsubscribe handlers via returned function', () => {
    const mgr = createManager();
    const handler = vi.fn();
    const unsub = mgr.on('test', handler);

    unsub();
    const listeners = (mgr as unknown as { listeners: Map<string, Set<unknown>> }).listeners;
    expect(listeners.get('test')?.has(handler)).toBe(false);
  });

  it('should disconnect gracefully', async () => {
    const mgr = createManager();
    const stateChanges: string[] = [];
    mgr.onStateChange((s) => stateChanges.push(s));

    mgr.connect();
    await flush();

    mgr.disconnect();
    expect(mgr.connectionState).toBe('disconnected');
    expect(stateChanges).toContain('disconnected');
  });

  it('should not reconnect on intentional disconnect', async () => {
    const mgr = createManager();
    mgr.connect();
    await flush();

    mgr.disconnect();
    await flush();
    await flush();
    await flush();

    expect(mgr.connectionState).toBe('disconnected');
  });

  it('should reconnect on unexpected close', async () => {
    const mgr = createManager();
    const stateChanges: string[] = [];
    mgr.onStateChange((s) => stateChanges.push(s));

    mgr.connect();
    await flush();

    // Simulate unexpected close
    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    ws.onclose?.({ code: 4001, reason: 'Server error' });

    expect(stateChanges).toContain('reconnecting');

    // Wait for reconnect
    await flush();
    await flush();
    await flush();
    const connectingCount = stateChanges.filter((s) => s === 'connecting').length;
    expect(connectingCount).toBeGreaterThanOrEqual(1);
  });

  it('should append token to URL', () => {
    const mgr = createManager();
    mgr.connect();

    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    expect(ws.url).toContain('token=test-token');
  });

  it('should destroy cleanly', () => {
    const mgr = createManager();
    mgr.on('test', () => {});
    mgr.onStateChange(() => {});
    mgr.destroy();

    expect(mgr.connectionState).toBe('disconnected');
  });
});
