/**
 * RealtimeChannel — typed wrapper around the internal `WebSocketManager`.
 *
 * Mirrors the 10-event taxonomy from `API_REFERENCE.md` §3.3 and the
 * §6 SDK quick-start in `API_EXAMPLES.md`. The wrapper:
 *
 * 1. Translates the internal `ConnectionState` ('connecting' | 'connected' |
 *    'disconnected' | 'reconnecting') into the public SDK states.
 * 2. Validates incoming `CollaborationMessage.type` against `RealtimeEvent['type']`
 *    before invoking handlers — invalid payloads are dropped with a warning.
 * 3. Re-uses `WebSocketManager` for reconnect / heartbeat / message queueing,
 *    so the SDK inherits the same hardening without duplicating logic.
 *
 * @module sdk/realtime/RealtimeChannel
 */

import { WebSocketManager } from '../../../services/WebSocketManager';
import type {
  ConnectionState,
  ConnectionStateListener,
  RealtimeEvent,
  RealtimeEventHandler,
} from '../types';

// ─── Internal state mapping ──────────────────────────────────────────────────

/** Map of valid realtime event types — derived from the discriminated union. */
const VALID_EVENT_TYPES: ReadonlySet<RealtimeEvent['type']> = new Set<RealtimeEvent['type']>([
  'cell:edit',
  'sheet:created',
  'cell:formatted',
  'cursor:moved',
  'comment:added',
  'selection:changed',
  'presence:joined',
  'presence:left',
  'data:imported',
  'formula:recalculated',
]);

/**
 * Translate internal `WebSocketManager` state to public SDK state.
 * The internal manager exposes 'disconnected' on idle, which we surface
 * as 'closed' to match the SDK's "intentionally closed" semantic.
 */
function translateState(internal: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'): ConnectionState {
  switch (internal) {
    case 'connecting':
      return 'connecting';
    case 'connected':
      return 'connected';
    case 'reconnecting':
      return 'reconnecting';
    case 'disconnected':
      return 'closed';
  }
}

// ─── Constructor options ─────────────────────────────────────────────────────

/** Public construction config for `RealtimeChannel`. */
export interface RealtimeChannelConfig {
  /** Full WebSocket URL (e.g. `wss://api.finplanpro.dev/realtime`). */
  readonly url: string;
  /** Auth token (OAuth2 access token or API key). */
  readonly token: string;
  /** Max reconnection attempts before giving up. Defaults to 10. */
  readonly maxRetries?: number;
  /** Base delay for exponential backoff in ms. Defaults to 1000. */
  readonly baseRetryDelay?: number;
  /** Heartbeat interval in ms. Defaults to 15000. */
  readonly heartbeatInterval?: number;
}

// ─── RealtimeChannel ─────────────────────────────────────────────────────────

/**
 * Typed realtime channel. Construct via `FpaClient.realtime.connect()` rather
 * than directly so the URL + token are derived from the client config.
 *
 * Lifecycle:
 * 1. `connect()` — opens the WebSocket and starts the heartbeat.
 * 2. `subscribe(type, handler)` — registers a typed handler.
 * 3. `disconnect()` — closes the connection. Can be reopened via `connect()`.
 */
export class RealtimeChannel {
  private readonly manager: WebSocketManager;
  private readonly handlerByType: Map<RealtimeEvent['type'], Set<RealtimeEventHandler>> = new Map();
  private readonly stateListeners: Set<ConnectionStateListener> = new Set();
  private _state: ConnectionState = 'idle';

  constructor(config: RealtimeChannelConfig) {
    this.manager = new WebSocketManager({
      url: config.url,
      token: config.token,
      ...(config.maxRetries !== undefined ? { maxRetries: config.maxRetries } : {}),
      ...(config.baseRetryDelay !== undefined ? { baseRetryDelay: config.baseRetryDelay } : {}),
      ...(config.heartbeatInterval !== undefined ? { heartbeatInterval: config.heartbeatInterval } : {}),
    });

    // Forward every message to the typed dispatcher.
    this.manager.on('*', (raw) => {
      this.dispatch(raw);
    });

    // Translate internal state to public state.
    this.manager.onStateChange((internal) => {
      this._state = translateState(internal);
      for (const listener of this.stateListeners) {
        try {
          listener(this._state);
        } catch (err) {
          console.warn('[RealtimeChannel] state listener threw', err);
        }
      }
    });
  }

  // ── Connection lifecycle ─────────────────────────────────────────────────

  /** Open the WebSocket. Safe to call multiple times — no-op when already connected. */
  public connect(): void {
    if (this._state === 'connected' || this._state === 'connecting') return;
    this._state = 'connecting';
    this.manager.connect();
  }

  /** Close the WebSocket. Drops all subscriptions. */
  public disconnect(): void {
    this.manager.disconnect();
    this._state = 'closed';
  }

  /** Current public connection state. */
  public get state(): ConnectionState {
    return this._state;
  }

  // ── Event subscription ───────────────────────────────────────────────────

  /**
   * Subscribe to a typed realtime event.
   * @returns An unsubscribe function. Idempotent.
   */
  public subscribe(type: RealtimeEvent['type'], handler: RealtimeEventHandler): () => void {
    if (!VALID_EVENT_TYPES.has(type)) {
      console.warn(`[RealtimeChannel] subscribe: unknown event type "${type}"`);
      return () => undefined;
    }
    let bucket = this.handlerByType.get(type);
    if (!bucket) {
      bucket = new Set();
      this.handlerByType.set(type, bucket);
    }
    bucket.add(handler);
    return () => {
      const set = this.handlerByType.get(type);
      if (set) set.delete(handler);
    };
  }

  /** Register a state-change observer. */
  public onState(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    // Emit current state immediately for late subscribers.
    try {
      listener(this._state);
    } catch (err) {
      console.warn('[RealtimeChannel] state listener threw', err);
    }
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // ── Outbound messages ────────────────────────────────────────────────────

  /**
   * Send a `cell:edit` (or other write event) to the server.
   * The server is responsible for broadcasting it to other clients.
   */
  public send(event: RealtimeEvent): void {
    this.manager.send({
      type: event.type,
      payload: event.payload,
      timestamp: new Date().toISOString(),
    });
  }

  // ── Internal dispatch ───────────────────────────────────────────────────

  /**
   * Validate the inbound payload against the `RealtimeEvent` shape for `type`
   * before invoking handlers. Invalid payloads are dropped with a warning —
   * we never throw, since a malformed event from one client must not
   * disconnect everyone else.
   */
  private dispatch(raw: unknown): void {
    if (raw === null || typeof raw !== 'object') return;
    const candidate = raw as { type?: unknown; payload?: unknown };
    if (typeof candidate.type !== 'string') return;
    if (!VALID_EVENT_TYPES.has(candidate.type as RealtimeEvent['type'])) {
      // Could be an internal message ('heartbeat', 'join', 'leave', etc.).
      // Those are not part of the public surface and are ignored.
      return;
    }
    const type = candidate.type as RealtimeEvent['type'];
    const event: RealtimeEvent = { type, payload: candidate.payload as never };
    const bucket = this.handlerByType.get(type);
    if (!bucket || bucket.size === 0) return;
    for (const handler of bucket) {
      try {
        void Promise.resolve(handler(event)).catch((err) => {
          console.warn(`[RealtimeChannel] handler for "${type}" threw`, err);
        });
      } catch (err) {
        console.warn(`[RealtimeChannel] handler for "${type}" threw synchronously`, err);
      }
    }
  }
}
