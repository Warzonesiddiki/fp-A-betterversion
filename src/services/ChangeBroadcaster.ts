// =============================================================================
// Change Broadcaster
// Broadcasts data changes to connected clients and handles incoming changes
// =============================================================================

import type { WebSocketManager } from './WebSocketManager';
import { createLogger } from '@/utils/logger';

const changeBroadcasterLogger = createLogger('ChangeBroadcaster');

export type ChangeType = 'create' | 'update' | 'delete';
export type ResourceType =
  | 'budget'
  | 'forecast'
  | 'scenario'
  | 'comment'
  | 'task'
  | 'approval'
  | 'variance'
  | 'entity';

export interface DataChange {
  readonly id: string;
  readonly type: ChangeType;
  readonly resourceType: ResourceType;
  readonly resourceId: string;
  readonly field?: string;
  readonly oldValue?: unknown;
  readonly newValue?: unknown;
  readonly userId: string;
  readonly userName: string;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ConflictInfo {
  readonly incomingChange: DataChange;
  readonly localValue: unknown;
  readonly resolution: 'accept-remote' | 'keep-local' | 'merged';
  readonly mergedValue?: unknown;
}

export type ChangeHandler = (change: DataChange) => void;
export type ConflictHandler = (conflict: ConflictInfo) => void;

/**
 * Broadcasts data changes over WebSocket and processes incoming changes
 * from other users. Provides conflict detection for concurrent edits.
 */
export class ChangeBroadcaster {
  private changeHandlers = new Set<ChangeHandler>();
  private conflictHandlers = new Set<ConflictHandler>();
  private recentChanges = new Map<string, DataChange>();
  private currentUserId: string | null = null;
  private sequenceNumber = 0;
  private readonly maxRecentChanges = 500;

  constructor(private readonly ws: WebSocketManager) {
    this.ws.on('change:broadcast', this.handleIncomingChange.bind(this));
    this.ws.on('change:ack', this.handleAck.bind(this));
    this.ws.on('change:conflict', this.handleConflict.bind(this));
  }

  // --- Public API ---

  /** Set the current user for attribution */
  setUser(userId: string): void {
    this.currentUserId = userId;
  }

  /** Broadcast a data change to all connected clients */
  async broadcast(change: Omit<DataChange, 'id' | 'userId' | 'timestamp'>): Promise<string | null> {
    const id = `chg-${Date.now()}-${++this.sequenceNumber}`;

    // Validate permissions before proceeding
    const isPermitted = await this.validateUserPermission(change);
    if (!isPermitted) return null;

    const fullChange: DataChange = {
      ...change,
      id,
      userId: this.currentUserId ?? 'unknown',
      timestamp: new Date().toISOString(),
    };

    // Track locally for dedup
    this.recentChanges.set(id, fullChange);
    this.pruneRecentChanges();

    // Send to server
    this.ws.send({
      type: 'change:broadcast',
      payload: fullChange,
    });

    return id;
  }

  /** Convenience: broadcast a cell value change in a budget/forecast grid */
  async broadcastCellChange(
    resourceType: ResourceType,
    resourceId: string,
    field: string,
    oldValue: unknown,
    newValue: unknown,
    userName: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.broadcast({
      type: oldValue === undefined ? 'create' : 'update',
      resourceType,
      resourceId,
      field,
      oldValue,
      newValue,
      userName,
      metadata,
    });
  }

  /** Convenience: broadcast a record creation */
  async broadcastCreate(
    resourceType: ResourceType,
    resourceId: string,
    userName: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.broadcast({
      type: 'create',
      resourceType,
      resourceId,
      userName,
      metadata,
    });
  }

  /** Convenience: broadcast a record deletion */
  async broadcastDelete(
    resourceType: ResourceType,
    resourceId: string,
    userName: string
  ): Promise<string | null> {
    return this.broadcast({
      type: 'delete',
      resourceType,
      resourceId,
      userName,
    });
  }

  /** Subscribe to incoming changes from other users */
  onChange(handler: ChangeHandler): () => void {
    this.changeHandlers.add(handler);
    return () => this.changeHandlers.delete(handler);
  }

  /** Subscribe to conflict notifications */
  onConflict(handler: ConflictHandler): () => void {
    this.conflictHandlers.add(handler);
    return () => this.conflictHandlers.delete(handler);
  }

  /** Check if a resource has recent remote changes */
  hasRecentChanges(resourceType: ResourceType, resourceId: string): boolean {
    for (const change of this.recentChanges.values()) {
      if (
        change.resourceType === resourceType &&
        change.resourceId === resourceId &&
        change.userId !== this.currentUserId
      ) {
        return true;
      }
    }
    return false;
  }

  /** Get recent changes for a resource */
  getRecentChanges(resourceType: ResourceType, resourceId: string): DataChange[] {
    return Array.from(this.recentChanges.values())
      .filter((c) => c.resourceType === resourceType && c.resourceId === resourceId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /** Clean up */
  destroy(): void {
    this.changeHandlers.clear();
    this.conflictHandlers.clear();
    this.recentChanges.clear();
  }

  private pruneRecentChanges(): void {
    if (this.recentChanges.size > this.maxRecentChanges) {
      const entries = Array.from(this.recentChanges.entries());
      const toDelete = entries.slice(0, entries.length - this.maxRecentChanges);
      for (const [key] of toDelete) {
        this.recentChanges.delete(key);
      }
    }
  }

  // --- Internal ---

  private handleIncomingChange(data: unknown): void {
    const change = data as DataChange;

    // Ignore our own changes echoed back
    if (change.userId === this.currentUserId) return;

    // Dedup
    if (this.recentChanges.has(change.id)) return;

    this.recentChanges.set(change.id, change);
    this.pruneRecentChanges();

    // Notify handlers
    this.changeHandlers.forEach((fn) => fn(change));
  }

  private handleAck(data: unknown): void {
    // Server acknowledged our change — could track delivery status here
    void data;
  }

  private handleConflict(data: unknown): void {
    const conflict = data as ConflictInfo;
    this.conflictHandlers.forEach((fn) => fn(conflict));
  }

  private async validateUserPermission(
    change: Omit<DataChange, 'id' | 'userId' | 'timestamp'>
  ): Promise<boolean> {
    if (!this.currentUserId) throw new Error('User not authenticated');
    // Simulate server permission check (replace with actual API call in production)
    const hasPermission = await this.checkServerPermission(
      this.currentUserId,
      change.resourceType,
      change.resourceId
    );
    if (!hasPermission) {
      changeBroadcasterLogger.warn('Permission denied', {
        userId: this.currentUserId,
        resourceType: change.resourceType,
        resourceId: change.resourceId,
      });
      return false;
    }
    return true;
  }

  private async checkServerPermission(
    _userId: string,
    _resourceType: ResourceType,
    _resourceId: string
  ): Promise<boolean> {
    // In production: call auth service or check local capabilities
    return true;
  }
}
