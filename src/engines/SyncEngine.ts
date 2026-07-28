/**
 * SyncEngine — Offline-first sync for collaboration
 * Queues local changes, syncs when online, handles conflicts
 */

interface SyncChange {
  id: string;
  entityType: 'comment' | 'task' | 'budget' | 'forecast' | 'scenario';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  userId: string;
  synced: boolean;
  retryCount: number;
}

interface SyncConflict {
  localChange: SyncChange;
  remoteChange: SyncChange;
  resolution: 'local' | 'remote' | 'manual';
}

interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
  lastSyncAt: number | null;
  isOnline: boolean;
}

export class SyncEngine {
  private static queue: SyncChange[] = [];
  private static isSyncing = false;
  private static maxRetries = 3;
  private static listeners: Array<(status: SyncStatus) => void> = [];

  /**
   * Queue a local change for sync
   */
  static enqueue(change: Omit<SyncChange, 'id' | 'timestamp' | 'synced' | 'retryCount'>): void {
    const entry: SyncChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
    };
    this.queue.push(entry);
    this.notifyListeners();
  }

  /**
   * Flush queue to remote (when online)
   */
  static async flush(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    const pending = this.queue.filter((c) => !c.synced);

    for (const change of pending) {
      try {
        // In offline-first mode, we simulate success
        // In production, this would call the Tauri IPC or API
        await this.sendToRemote(change);
        change.synced = true;
        synced++;
      } catch {
        change.retryCount++;
        if (change.retryCount >= this.maxRetries) {
          failed++;
        }
      }
    }

    this.isSyncing = false;
    this.notifyListeners();

    return { synced, failed };
  }

  /**
   * Get current sync status
   */
  static getStatus(): SyncStatus {
    const pending = this.queue.filter((c) => !c.synced).length;
    const synced = this.queue.filter((c) => c.synced).length;
    const failed = this.queue.filter((c) => c.retryCount >= this.maxRetries).length;

    return {
      pending,
      synced,
      failed,
      lastSyncAt: this.getLastSyncTime(),
      isOnline: navigator.onLine,
    };
  }

  /**
   * Detect conflicts between local and remote changes
   */
  static detectConflicts(remoteChanges: SyncChange[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];

    for (const local of this.queue) {
      if (local.synced) continue;

      const remote = remoteChanges.find(
        (r) =>
          r.entityType === local.entityType &&
          r.entityId === local.entityId &&
          r.timestamp > local.timestamp
      );

      if (remote) {
        conflicts.push({
          localChange: local,
          remoteChange: remote,
          resolution: local.timestamp > remote.timestamp ? 'local' : 'remote',
        });
      }
    }

    return conflicts;
  }

  /**
   * Subscribe to sync status changes
   */
  static subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Clear synced items older than N days
   */
  static cleanup(retentionDays: number): number {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const before = this.queue.length;
    this.queue = this.queue.filter((c) => !c.synced || c.timestamp > cutoff);
    return before - this.queue.length;
  }

  /**
   * Export queue for backup
   */
  static exportQueue(): string {
    return JSON.stringify(this.queue, null, 2);
  }

  /**
   * Import queue from backup
   */
  static importQueue(json: string): void {
    try {
      const imported = JSON.parse(json) as SyncChange[];
      this.queue = [...this.queue, ...imported];
      this.notifyListeners();
    } catch {
      throw new Error('Invalid sync queue format');
    }
  }

  private static async sendToRemote(_change: SyncChange): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10));

    // In production: Tauri IPC or fetch to API
    // For offline-first: just mark as synced
    if (!navigator.onLine) {
      throw new Error('Offline — will retry when online');
    }
  }

  private static getLastSyncTime(): number | null {
    const synced = this.queue.filter((c) => c.synced);
    if (synced.length === 0) return null;
    return Math.max(...synced.map((c) => c.timestamp));
  }

  private static notifyListeners(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}
