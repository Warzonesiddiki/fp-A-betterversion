/**
 * CRDT Sync Engine — Offline Conflict-Free Replication
 *
 * Enables seamless offline work with automatic conflict resolution.
 * Uses Last-Writer-Wins Registers (LWW) for scalar values and
 * vector clocks for causal ordering.
 *
 * When the desktop app reconnects, local changes merge cleanly.
 *
 * @module crdtSync
 */

import type {
  VectorClock,
  SyncOperation,
  SyncState,
  SyncStatus,
  SyncConflict,
  ConflictResolutionStrategy,
  SyncEngineConfig,
} from '@/types/crdt';

const DEFAULT_CONFIG: SyncEngineConfig = {
  pollIntervalMs: 30000,
  maxBatchSize: 100,
  autoMerge: true,
  defaultConflictStrategy: 'latest-wins',
  offlineThresholdMs: 60000,
};

// ─── Vector Clock Operations ───────────────────────────────────────────────

/**
 * Increment the local device's counter in the vector clock.
 */
export function incrementClock(clock: VectorClock, deviceId: string): VectorClock {
  return {
    ...clock,
    [deviceId]: (clock[deviceId] ?? 0) + 1,
  };
}

/**
 * Merge two vector clocks (take the max of each entry).
 */
export function mergeClocks(a: VectorClock, b: VectorClock): VectorClock {
  const merged: Record<string, number> = { ...a };
  for (const [device, count] of Object.entries(b)) {
    merged[device] = Math.max(merged[device] ?? 0, count);
  }
  return merged;
}

/**
 * Compare two vector clocks.
 * Returns 'before' if a happened before b, 'after' if a happened after b,
 * 'concurrent' if they are concurrent (conflict), or 'equal' if identical.
 */
export function compareClocks(
  a: VectorClock,
  b: VectorClock
): 'before' | 'after' | 'concurrent' | 'equal' {
  const allDevices = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aBeforeB = false;
  let bBeforeA = false;

  for (const device of allDevices) {
    const aCount = a[device] ?? 0;
    const bCount = b[device] ?? 0;

    if (aCount < bCount) aBeforeB = true;
    if (bCount < aCount) bBeforeA = true;
  }

  if (aBeforeB && bBeforeA) return 'concurrent';
  if (aBeforeB) return 'before';
  if (bBeforeA) return 'after';
  return 'equal';
}

// ─── Sync State Management ─────────────────────────────────────────────────

/**
 * Create initial sync state for a domain.
 */
export function createSyncState(domain: string, deviceId: string): SyncState {
  return {
    domain,
    localClock: { [deviceId]: 0 },
    serverClock: {},
    pendingOps: [],
    incomingOps: [],
    lastSyncAt: null,
    status: 'idle',
    conflicts: [],
  };
}

/**
 * Record a local operation (increments local clock).
 */
export function recordLocalOperation(
  state: SyncState,
  operation: Omit<SyncOperation, 'id' | 'clock' | 'acknowledged'>,
  deviceId: string
): SyncState {
  const newClock = incrementClock(state.localClock, deviceId);

  const op: SyncOperation = {
    ...operation,
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clock: newClock,
    acknowledged: false,
  };

  return {
    ...state,
    localClock: newClock,
    pendingOps: [...state.pendingOps, op],
  };
}

/**
 * Detect conflicts between pending local ops and incoming server ops.
 */
export function detectConflicts(state: SyncState): SyncConflict[] {
  const conflicts: SyncConflict[] = [];

  for (const localOp of state.pendingOps) {
    for (const serverOp of state.incomingOps) {
      if (localOp.path === serverOp.path) {
        const order = compareClocks(localOp.clock, serverOp.clock);

        if (order === 'concurrent') {
          conflicts.push({
            id: `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            path: localOp.path,
            localValue: localOp.value,
            remoteValue: serverOp.value,
            localOp,
            remoteOp: serverOp,
            suggestedStrategy: 'latest-wins',
            isResolved: false,
            resolvedValue: null,
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Resolve a conflict using the specified strategy.
 */
export function resolveConflict(
  conflict: SyncConflict,
  strategy: ConflictResolutionStrategy
): { resolvedValue: unknown; resolvedOp: SyncOperation } {
  let resolvedValue: unknown;
  const ops = [conflict.localOp, conflict.remoteOp];

  switch (strategy) {
    case 'local-wins':
      resolvedValue = conflict.localValue;
      break;
    case 'remote-wins':
      resolvedValue = conflict.remoteValue;
      break;
    case 'latest-wins': {
      const latest = ops.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      resolvedValue = latest?.value;
      break;
    }
    case 'merge':
      // For objects, shallow merge; for primitives, latest wins
      if (
        typeof conflict.localValue === 'object' &&
        typeof conflict.remoteValue === 'object' &&
        conflict.localValue !== null &&
        conflict.remoteValue !== null
      ) {
        resolvedValue = {
          ...(conflict.remoteValue as Record<string, unknown>),
          ...(conflict.localValue as Record<string, unknown>),
        };
      } else {
        resolvedValue = conflict.localValue;
      }
      break;
    case 'manual':
    default:
      resolvedValue = conflict.localValue;
      break;
  }

  return {
    resolvedValue,
    resolvedOp: conflict.localOp,
  };
}

/**
 * Apply incoming server operations to the local state.
 * Returns the merged state and any detected conflicts.
 */
export function applyIncomingOperations(
  state: SyncState,
  incomingOps: readonly SyncOperation[],
  deviceId: string
): { state: SyncState; conflicts: SyncConflict[] } {
  const newState: SyncState = {
    ...state,
    incomingOps: incomingOps as SyncOperation[],
    serverClock: mergeClocks(
      state.serverClock,
      incomingOps.reduce(
        (clock, op) => mergeClocks(clock, op.clock),
        {} as VectorClock
      )
    ),
  };

  const conflicts = detectConflicts(newState);

  if (conflicts.length === 0) {
    return {
      state: {
        ...newState,
        status: 'idle',
        lastSyncAt: new Date().toISOString(),
        pendingOps: [], // All ops acknowledged
        incomingOps: [],
      },
      conflicts: [],
    };
  }

  return {
    state: {
      ...newState,
      status: 'conflict',
      conflicts,
    },
    conflicts,
  };
}

/**
 * Get the current sync status summary.
 */
export function getSyncSummary(state: SyncState): {
  status: SyncStatus;
  pendingCount: number;
  incomingCount: number;
  conflictCount: number;
  lastSyncAt: string | null;
} {
  return {
    status: state.status,
    pendingCount: state.pendingOps.length,
    incomingCount: state.incomingOps.length,
    conflictCount: state.conflicts.length,
    lastSyncAt: state.lastSyncAt,
  };
}
