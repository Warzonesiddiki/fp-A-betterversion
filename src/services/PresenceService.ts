// =============================================================================
// Presence Service
// Tracks which users are online, what they're viewing/editing, and their cursors
// =============================================================================

import type { WebSocketManager } from './WebSocketManager';

export type PresenceStatus = 'online' | 'idle' | 'away';

export interface UserPresence {
  readonly userId: string;
  readonly userName: string;
  readonly userInitials: string;
  readonly avatarUrl: string | null;
  readonly status: PresenceStatus;
  readonly activeResourceType: string | null;
  readonly activeResourceId: string | null;
  readonly activeCellId: string | null;
  readonly lastSeenAt: string;
  readonly cursorColor: string;
}

export interface PresenceChange {
  readonly type: 'join' | 'leave' | 'update';
  readonly user: UserPresence;
}

export type PresenceHandler = (change: PresenceChange) => void;

/** Cursor colors assigned to collaborators in order of join */
const CURSOR_COLORS = [
  '#E06C75',
  '#61AFEF',
  '#98C379',
  '#E5C07B',
  '#C678DD',
  '#56B6C2',
  '#BE5046',
  '#D19A66',
  '#7EC8E3',
  '#FF6B6B',
];

/**
 * Manages presence awareness for real-time collaboration.
 * Integrates with WebSocketManager to broadcast and receive presence updates.
 */
export class PresenceService {
  private presences = new Map<string, UserPresence>();
  private handlers = new Set<PresenceHandler>();
  private stateHandlers = new Set<(users: UserPresence[]) => void>();
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private currentUserId: string | null = null;
  private colorIndex = 0;
  private colorMap = new Map<string, string>();

  constructor(private readonly ws: WebSocketManager) {
    this.ws.on('presence:join', this.handleJoin.bind(this));
    this.ws.on('presence:leave', this.handleLeave.bind(this));
    this.ws.on('presence:update', this.handleUpdate.bind(this));
    this.ws.on('presence:state', this.handleState.bind(this));
  }

  // --- Public API ---

  /** Initialize presence for the current user */
  initialize(user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  }): void {
    this.currentUserId = user.id;
    this.assignColor(user.id);

    this.ws.send({
      type: 'presence:join',
      payload: {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        userInitials: `${user.firstName[0]}${user.lastName[0]}`,
        avatarUrl: user.avatarUrl,
      },
    });

    this.startIdleDetection();
  }

  /** Announce what the user is currently looking at */
  setActiveResource(resourceType: string, resourceId: string, cellId?: string): void {
    if (!this.currentUserId) return;

    this.ws.send({
      type: 'presence:update',
      payload: {
        userId: this.currentUserId,
        activeResourceType: resourceType,
        activeResourceId: resourceId,
        activeCellId: cellId ?? null,
      },
    });
  }

  /** Clear the user's active resource */
  clearActiveResource(): void {
    if (!this.currentUserId) return;

    this.ws.send({
      type: 'presence:update',
      payload: {
        userId: this.currentUserId,
        activeResourceType: null,
        activeResourceId: null,
        activeCellId: null,
      },
    });
  }

  /** Get all currently present users */
  getUsers(): UserPresence[] {
    return Array.from(this.presences.values());
  }

  /** Get users viewing a specific resource */
  getUsersOnResource(resourceType: string, resourceId: string): UserPresence[] {
    return this.getUsers().filter(
      (u) => u.activeResourceType === resourceType && u.activeResourceId === resourceId
    );
  }

  /** Get users editing a specific cell */
  getUsersOnCell(cellId: string): UserPresence[] {
    return this.getUsers().filter((u) => u.activeCellId === cellId);
  }

  /** Check if a specific cell is being edited by another user */
  isCellLocked(cellId: string, excludeUserId?: string): boolean {
    return this.getUsersOnCell(cellId).some(
      (u) => u.userId !== (excludeUserId ?? this.currentUserId)
    );
  }

  /** Get the cursor color for a user */
  getColorForUser(userId: string): string {
    return this.colorMap.get(userId) ?? CURSOR_COLORS[0];
  }

  /** Subscribe to presence changes */
  onChange(handler: PresenceHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Subscribe to the full user list changes */
  onStateChange(handler: (users: UserPresence[]) => void): () => void {
    this.stateHandlers.add(handler);
    return () => this.stateHandlers.delete(handler);
  }

  /** Clean up */
  destroy(): void {
    if (this.currentUserId) {
      this.ws.send({
        type: 'presence:leave',
        payload: { userId: this.currentUserId },
      });
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.presences.clear();
    this.handlers.clear();
    this.stateHandlers.clear();
    this.colorMap.clear();
  }

  // --- Internal ---

  private handleJoin(data: unknown): void {
    const presence = data as UserPresence;
    this.assignColor(presence.userId);
    this.presences.set(presence.userId, presence);
    this.emitChange({ type: 'join', user: presence });
    this.emitState();
  }

  private handleLeave(data: unknown): void {
    const { userId } = data as { userId: string };
    const user = this.presences.get(userId);
    if (user) {
      this.presences.delete(userId);
      this.emitChange({ type: 'leave', user });
      this.emitState();
    }
  }

  private handleUpdate(data: unknown): void {
    const update = data as Partial<UserPresence> & { userId: string };
    const existing = this.presences.get(update.userId);
    if (existing) {
      const merged: UserPresence = { ...existing, ...update, lastSeenAt: new Date().toISOString() };
      this.presences.set(update.userId, merged);
      this.emitChange({ type: 'update', user: merged });
      this.emitState();
    }
  }

  private handleState(data: unknown): void {
    const users = data as UserPresence[];
    this.presences.clear();
    users.forEach((u) => {
      this.assignColor(u.userId);
      this.presences.set(u.userId, u);
    });
    this.emitState();
  }

  private assignColor(userId: string): void {
    if (!this.colorMap.has(userId)) {
      this.colorMap.set(userId, CURSOR_COLORS[this.colorIndex % CURSOR_COLORS.length]);
      this.colorIndex++;
    }
  }

  private emitChange(change: PresenceChange): void {
    this.handlers.forEach((fn) => fn(change));
  }

  private emitState(): void {
    const users = this.getUsers();
    this.stateHandlers.forEach((fn) => fn(users));
  }

  private startIdleDetection(): void {
    const resetIdle = () => {
      if (this.idleTimer) clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(
        () => {
          if (this.currentUserId) {
            this.ws.send({
              type: 'presence:update',
              payload: { userId: this.currentUserId, status: 'idle' },
            });
          }
        },
        5 * 60 * 1000 // 5 minutes
      );
    };

    // Reset idle timer on user activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => resetIdle();
    events.forEach((evt) => document.addEventListener(evt, handler, { passive: true }));
    resetIdle();
  }
}
