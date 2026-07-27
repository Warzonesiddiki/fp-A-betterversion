// =============================================================================
// WebSocket Connection Manager
// Manages WebSocket lifecycle: connect, reconnect, heartbeat, message routing
// =============================================================================

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type MessageHandler = (data: unknown) => void;

export interface WebSocketConfig {
  /** WebSocket server URL */
  url: string;
  /** Auth token passed as query param or via first message */
  token?: string;
  /** Max reconnection attempts before giving up (default: 10) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  baseRetryDelay?: number;
  /** Max retry delay in ms (default: 30000) */
  maxRetryDelay?: number;
  /** Heartbeat interval in ms (default: 15000) */
  heartbeatInterval?: number;
  /** Heartball timeout — disconnect if no pong within this ms (default: 5000) */
  heartbeatTimeout?: number;
}

const DEFAULT_CONFIG: Required<Omit<WebSocketConfig, 'url' | 'token'>> = {
  maxRetries: 10,
  baseRetryDelay: 1000,
  maxRetryDelay: 30000,
  heartbeatInterval: 15000,
  heartbeatTimeout: 5000,
};

export interface CollaborationMessage {
  type: string;
  payload: unknown;
  senderId?: string;
  timestamp?: string;
}

/**
 * Manages a single WebSocket connection with automatic reconnection,
 * heartbeat monitoring, and typed message routing.
 *
 * Usage:
 * ```ts
 * const ws = new WebSocketManager({ url: 'wss://api.example.com/ws', token: '...' });
 * ws.on('presence:update', handlePresence);
 * ws.connect();
 * ws.send({ type: 'join', payload: { resourceId: 'budget-1' } });
 * ```
 */
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private state: ConnectionState = 'disconnected';
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<string, Set<MessageHandler>>();
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private messageQueue: CollaborationMessage[] = [];
  private isIntentionalClose = false;

  constructor(config: WebSocketConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<WebSocketConfig>;
  }

  // --- Public API ---

  /** Current connection state */
  get connectionState(): ConnectionState {
    return this.state;
  }

  /** Whether the socket is currently open */
  get isConnected(): boolean {
    return this.state === 'connected';
  }

  /** Connect to the WebSocket server */
  connect(): void {
    if (this.state === 'connected' || this.state === 'connecting') return;

    this.isIntentionalClose = false;
    this.setState('connecting');

    try {
      this.connectWithAuth();
    } catch {
      this.setState('disconnected');
      this.scheduleReconnect();
    }
  }

  /** Gracefully disconnect */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.clearTimers();
    this.retryCount = 0;

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /** Send a message. Queues if not connected. */
  send(message: CollaborationMessage): void {
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  /** Register a handler for a specific message type */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  /** Remove a handler */
  off(type: string, handler: MessageHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  /** Subscribe to connection state changes */
  onStateChange(handler: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(handler);
    return () => this.stateListeners.delete(handler);
  }

  /** Remove all listeners and close */
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.stateListeners.clear();
    this.messageQueue = [];
  }

  // --- Internal ---

  private buildUrl(): string {
    // SECURITY FIX (C-05): Token must NOT be passed in URL query params
    // (leaks to proxy logs, server access logs, browser history). The
    // token is transmitted securely via the first 'auth' message after
    // the WebSocket handshake.
    return this.config.url;
  }

  private connectWithAuth(): void {
    if (!this.config.token) {
      this.connect();
      return;
    }
    this.ws = new WebSocket(this.buildUrl());
    this.ws.onopen = () => {
      this.handleOpen();
      this.ws?.send(JSON.stringify({ type: 'auth', token: this.config.token }));
    };
    this.ws.onmessage = this.handleMessage.bind(this);
    this.ws.onclose = this.handleClose.bind(this);
    this.ws.onerror = this.handleError.bind(this);
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    this.stateListeners.forEach((fn) => fn(state));
  }

  private handleOpen(): void {
    this.setState('connected');
    this.retryCount = 0;
    this.startHeartbeat();
    this.flushQueue();
  }

  private handleMessage(event: MessageEvent): void {
    // Reset heartbeat on any incoming message
    this.resetHeartbeatTimeout();

    if (event.data === 'pong') return;

    let message: CollaborationMessage;
    try {
      message = JSON.parse(event.data as string);
    } catch {
      return; // ignore malformed messages
    }

    const handlers = this.listeners.get(message.type);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(message.payload);
        } catch {
          // prevent one bad handler from breaking others
        }
      });
    }

    // Fire wildcard listeners
    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((fn) => {
        try {
          fn(message);
        } catch {
          // ignore
        }
      });
    }
  }

  private handleClose(event: CloseEvent): void {
    this.stopHeartbeat();
    this.ws = null;

    if (this.isIntentionalClose || event.code === 1000) {
      this.setState('disconnected');
      return;
    }

    this.scheduleReconnect();
  }

  private handleError(): void {
    // The close handler will fire after this, triggering reconnect
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      this.setState('disconnected');
      this.emit('connection:failed', { retries: this.retryCount });
      return;
    }

    this.setState('reconnecting');

    const delay = Math.min(
      this.config.baseRetryDelay * Math.pow(2, this.retryCount) + Math.random() * 500,
      this.config.maxRetryDelay
    );

    this.retryTimer = setTimeout(() => {
      this.retryCount++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
        this.heartbeatTimeoutTimer = setTimeout(() => {
          // No pong received — force reconnect
          this.ws?.close(4000, 'Heartbeat timeout');
        }, this.config.heartbeatTimeout);
      }
    }, this.config.heartbeatInterval);
  }

  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
      this.heartbeatTimeoutTimer = null;
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.resetHeartbeatTimeout();
  }

  private clearTimers(): void {
    this.stopHeartbeat();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private flushQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];
    queue.forEach((msg) => this.send(msg));
  }

  private emit(type: string, payload: unknown): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach((fn) => fn(payload));
    }
  }
}
