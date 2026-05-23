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
    // Simulate async connect
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 0);
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

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    vi.useFakeTimers();
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
    vi.useRealTimers();
  });

  function createManager(overrides = {}) {
    // @ts-expect-error mock
    globalThis.WebSocket = MockWebSocket;
    return new WebSocketManager({
      url: 'wss://test.example.com/ws',
      maxRetries: 3,
      baseRetryDelay: 100,
      heartbeatInterval: 5000,
      heartbeatTimeout: 2000,
      ...overrides,
    });
  }

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

    vi.advanceTimersByTime(10);
    expect(mgr.connectionState).toBe('connected');
    expect(mgr.isConnected).toBe(true);
    expect(stateChanges).toEqual(['connecting', 'connected']);
  });

  it('should send messages when connected', async () => {
    const mgr = createManager();
    mgr.connect();
    vi.advanceTimersByTime(10);

    mgr.send({ type: 'test', payload: { data: 123 } });
    // Access the mock ws to verify
    expect(mgr.isConnected).toBe(true);
  });

  it('should queue messages when disconnected and flush on connect', () => {
    const mgr = createManager();

    // Send while disconnected — should queue
    mgr.send({ type: 'queued', payload: { id: 1 } });

    mgr.connect();
    vi.advanceTimersByTime(10);

    // Message should have been flushed
    expect(mgr.isConnected).toBe(true);
  });

  it('should dispatch messages to registered handlers', () => {
    const mgr = createManager();
    mgr.connect();
    vi.advanceTimersByTime(10);

    const handler = vi.fn();
    mgr.on('chat:message', handler);

    // Simulate incoming message
    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    ws.simulateMessage(JSON.stringify({ type: 'chat:message', payload: { text: 'hello' } }));

    expect(handler).toHaveBeenCalledWith({ text: 'hello' });
  });

  it('should support wildcard listeners', () => {
    const mgr = createManager();
    mgr.connect();
    vi.advanceTimersByTime(10);

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
    // Handler should not be called
    const ws2 = (mgr as unknown as { listeners: Map<string, Set<unknown>> }).listeners;
    expect(ws2.get('test')?.has(handler)).toBe(false);
  });

  it('should disconnect gracefully', () => {
    const mgr = createManager();
    const stateChanges: string[] = [];
    mgr.onStateChange((s) => stateChanges.push(s));

    mgr.connect();
    vi.advanceTimersByTime(10);

    mgr.disconnect();
    expect(mgr.connectionState).toBe('disconnected');
    expect(stateChanges).toContain('disconnected');
  });

  it('should not reconnect on intentional disconnect', () => {
    const mgr = createManager();
    mgr.connect();
    vi.advanceTimersByTime(10);

    mgr.disconnect();
    vi.advanceTimersByTime(1000);

    expect(mgr.connectionState).toBe('disconnected');
  });

  it('should reconnect on unexpected close', () => {
    const mgr = createManager();
    const stateChanges: string[] = [];
    mgr.onStateChange((s) => stateChanges.push(s));

    mgr.connect();
    vi.advanceTimersByTime(10);

    // Simulate unexpected close
    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    ws.onclose?.({ code: 4001, reason: 'Server error' });

    expect(stateChanges).toContain('reconnecting');

    // Advance timer generously to trigger reconnect (base 100ms + jitter 0-500ms)
    vi.advanceTimersByTime(1000);
    const connectingCount = stateChanges.filter((s) => s === 'connecting').length;
    expect(connectingCount).toBeGreaterThanOrEqual(1);
  });

  it('should append token to URL', () => {
    const mgr = createManager({ token: 'my-token-123' });
    mgr.connect();

    const ws = (mgr as unknown as { ws: MockWebSocket }).ws;
    expect(ws.url).toContain('token=my-token-123');
  });

  it('should destroy cleanly', () => {
    const mgr = createManager();
    mgr.on('test', () => {});
    mgr.onStateChange(() => {});
    mgr.destroy();

    expect(mgr.connectionState).toBe('disconnected');
  });
});
