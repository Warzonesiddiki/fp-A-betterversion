/**
 * GridOfflineEngine — Offline data grid operations
 * Handles grid state persistence and sync when offline
 */

interface GridState {
  columnWidths: Record<string, number>;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>;
  filterModel: Record<string, unknown>;
  pinnedColumns: Record<string, 'left' | 'right'>;
  rowHeights: Record<string, number>;
}

interface OfflineChange {
  id: string;
  tableId: string;
  rowId: string;
  columnId: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  userId: string;
  synced: boolean;
}

export class GridOfflineEngine {
  private static stateCache = new Map<string, GridState>();
  private static changes: OfflineChange[] = [];

  /**
   * Save grid state to localStorage
   */
  static saveGridState(gridId: string, state: GridState): void {
    this.stateCache.set(gridId, state);
    try {
      localStorage.setItem(`grid-state-${gridId}`, JSON.stringify(state));
    } catch {
      // Storage full — evict oldest
      this.evictOldStates();
    }
  }

  /**
   * Load grid state from localStorage
   */
  static loadGridState(gridId: string): GridState | null {
    const cached = this.stateCache.get(gridId);
    if (cached) return cached;

    try {
      const stored = localStorage.getItem(`grid-state-${gridId}`);
      if (!stored) return null;
      const state = JSON.parse(stored) as GridState;
      this.stateCache.set(gridId, state);
      return state;
    } catch {
      return null;
    }
  }

  /**
   * Track a cell change for offline sync
   */
  static trackChange(change: Omit<OfflineChange, 'id' | 'timestamp' | 'synced'>): void {
    this.changes.push({
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      synced: false,
    });
  }

  /**
   * Get all pending (unsynced) changes
   */
  static getPendingChanges(): OfflineChange[] {
    return this.changes.filter((c) => !c.synced);
  }

  /**
   * Mark changes as synced
   */
  static markSynced(changeIds: string[]): void {
    const idSet = new Set(changeIds);
    for (const change of this.changes) {
      if (idSet.has(change.id)) {
        change.synced = true;
      }
    }
  }

  /**
   * Get conflict resolution data
   */
  static getConflicts(serverChanges: OfflineChange[]): Array<{
    local: OfflineChange;
    server: OfflineChange;
    resolution: 'local' | 'server' | 'manual';
  }> {
    const conflicts: Array<{
      local: OfflineChange;
      server: OfflineChange;
      resolution: 'local' | 'server' | 'manual';
    }> = [];
    const localChanges = this.getPendingChanges();

    for (const local of localChanges) {
      const server = serverChanges.find(
        (s) =>
          s.tableId === local.tableId && s.rowId === local.rowId && s.columnId === local.columnId
      );
      if (server) {
        // Last-write-wins
        const resolution = local.timestamp > server.timestamp ? 'local' : 'server';
        conflicts.push({ local, server, resolution });
      }
    }

    return conflicts;
  }

  /**
   * Clear synced changes older than N days
   */
  static cleanup(retentionDays: number): number {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const before = this.changes.length;
    this.changes = this.changes.filter((c) => !c.synced || c.timestamp > cutoff);
    return before - this.changes.length;
  }

  private static evictOldStates(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('grid-state-')) keys.push(key);
    }
    // Remove oldest half
    for (const key of keys.slice(0, Math.ceil(keys.length / 2))) {
      localStorage.removeItem(key);
      this.stateCache.delete(key.replace('grid-state-', ''));
    }
  }
}
