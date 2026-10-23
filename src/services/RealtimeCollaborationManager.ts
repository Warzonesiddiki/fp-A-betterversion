// =============================================================================
// Real-time Collaboration Manager
// Singleton orchestrator: WebSocket + Presence + Change Broadcasting
// =============================================================================

import { WebSocketManager, type ConnectionState } from './WebSocketManager';
import { PresenceService, type UserPresence, type PresenceChange } from './PresenceService';
import {
  ChangeBroadcaster,
  type DataChange,
  type ConflictInfo,
  type ResourceType,
} from './ChangeBroadcaster';

export interface CollaborationConfig {
  /** WebSocket URL (e.g., wss://api.example.com/ws) */
  wsUrl: string;
  /** Auth token for the WS connection */
  token?: string;
  /** Whether to auto-connect on init (default: false) */
  autoConnect?: boolean;
}

/**
 * Central entry point for real-time collaboration.
 * Creates and manages the WebSocket, Presence, and ChangeBroadcasting services.
 *
 * Usage:
 * ```ts
 * const collab = RealtimeCollaborationManager.getInstance();
 * collab.initialize({ wsUrl: 'wss://api.example.com/ws', token: '...' });
 * collab.connect();
 *
 * // Presence
 * collab.presence.onChange((change) => { ... });
 *
 * // Changes
 * collab.changes.onChange((change) => { ... });
 * collab.changes.broadcastCellChange('budget', 'bgt-001', 'q1Amount', 100, 150, 'Sarah');
 * ```
 */
export class RealtimeCollaborationManager {
  private static instance: RealtimeCollaborationManager | null = null;

  private wsManager: WebSocketManager | null = null;
  private presenceSvc: PresenceService | null = null;
  private changeBroadcaster: ChangeBroadcaster | null = null;
  private initialized = false;

  private constructor() {}

  /** Get the singleton instance */
  static getInstance(): RealtimeCollaborationManager {
    if (!RealtimeCollaborationManager.instance) {
      RealtimeCollaborationManager.instance = new RealtimeCollaborationManager();
    }
    return RealtimeCollaborationManager.instance;
  }

  /** Reset the singleton (for testing) */
  static resetInstance(): void {
    if (RealtimeCollaborationManager.instance) {
      RealtimeCollaborationManager.instance.destroy();
      RealtimeCollaborationManager.instance = null;
    }
  }

  // --- Public API ---

  /** Initialize all services */
  initialize(config: CollaborationConfig): void {
    if (this.initialized) this.destroy();

    this.wsManager = new WebSocketManager({
      url: config.wsUrl,
      token: config.token,
    });

    this.presenceSvc = new PresenceService(this.wsManager);
    this.changeBroadcaster = new ChangeBroadcaster(this.wsManager);
    this.initialized = true;

    if (config.autoConnect) {
      this.connect();
    }
  }

  /** Connect the WebSocket */
  connect(): void {
    this.ensureInitialized();
    this.wsManager!.connect();
  }

  /** Disconnect */
  disconnect(): void {
    this.wsManager?.disconnect();
  }

  /** Current connection state */
  get connectionState(): ConnectionState {
    return this.wsManager?.connectionState ?? 'disconnected';
  }

  /** Whether connected */
  get isConnected(): boolean {
    return this.wsManager?.isConnected ?? false;
  }

  /** Access the Presence service */
  get presence(): PresenceService {
    this.ensureInitialized();
    return this.presenceSvc!;
  }

  /** Access the ChangeBroadcaster service */
  get changes(): ChangeBroadcaster {
    this.ensureInitialized();
    return this.changeBroadcaster!;
  }

  /** Subscribe to connection state changes */
  onConnectionStateChange(handler: (state: ConnectionState) => void): () => void {
    this.ensureInitialized();
    return this.wsManager!.onStateChange(handler);
  }

  /** Set the current user for presence and change attribution */
  setUser(user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }): void {
    this.ensureInitialized();
    this.presenceSvc!.initialize(user);
    this.changeBroadcaster!.setUser(user.id);
  }

  /** Destroy all services and clean up */
  destroy(): void {
    this.presenceSvc?.destroy();
    this.changeBroadcaster?.destroy();
    this.wsManager?.destroy();
    this.presenceSvc = null;
    this.changeBroadcaster = null;
    this.wsManager = null;
    this.initialized = false;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('RealtimeCollaborationManager not initialized. Call initialize() first.');
    }
  }
}

// Re-export types for convenience
export type {
  ConnectionState,
  UserPresence,
  PresenceChange,
  DataChange,
  ConflictInfo,
  ResourceType,
};
