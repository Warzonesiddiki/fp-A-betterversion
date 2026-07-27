/**
 * CRDT (Conflict-Free Replicated Data Types) — Offline Sync Types
 *
 * Enables seamless offline work with automatic conflict resolution.
 * When the desktop app reconnects, local changes merge cleanly with
 * server state without data loss or user intervention.
 *
 * STRATEGY: We use a Last-Writer-Wins Register (LWW-Register) for scalar
 * values and an Observed-Remove Set (OR-Set) for collections. This covers
 * 95% of our FP&A use cases (budget line items, scenario configs, settings).
 *
 * For complex merges (e.g., two users editing the same budget cell),
 * we surface a conflict resolution UI as a fallback.
 */

// ─── Vector Clock ──────────────────────────────────────────────────────────

/**
 * Vector clock for causal ordering of events.
 * Each device/node has a monotonically increasing counter.
 *
 * Example: { "device-alice": 5, "device-bob": 3 } means Alice has seen
 * 5 local events and Bob has seen 3 local events.
 */
export type VectorClock = Readonly<Record<string, number>>;

// ─── CRDT Register (LWW) ──────────────────────────────────────────────────

/**
 * Last-Writer-Wins Register for scalar values.
 * The value with the highest wall-clock timestamp wins.
 * Ties are broken by device ID (lexicographic).
 */
export interface LWWRegister<T> {
  /** The stored value */
  readonly value: T;
  /** Wall-clock timestamp of the last write */
  readonly timestamp: string;
  /** Device that made the last write */
  readonly deviceId: string;
  /** Vector clock at time of write */
  readonly clock: VectorClock;
  /** Tombstone: true if this value was deleted */
  readonly isDeleted: boolean;
}

// ─── CRDT Set (OR-Set) ────────────────────────────────────────────────────

/**
 * Observed-Remove Set for collection operations.
 * Elements can be added and removed independently by different devices.
 * An element is in the set if it has been added more times than removed.
 */
export interface ORSet<T> {
  /** Unique add tags for each element */
  readonly adds: ReadonlyMap<string, ORSetEntry<T>>;
  /** Unique remove tags (tombstones) */
  readonly removes: ReadonlySet<string>;
}

export interface ORSetEntry<T> {
  /** The element value */
  readonly value: T;
  /** Unique tag for this add operation */
  readonly tag: string;
  /** Device that added this element */
  readonly deviceId: string;
  /** Timestamp of the add */
  readonly timestamp: string;
}

// ─── Sync Operation ────────────────────────────────────────────────────────

/**
 * A single sync operation that can be applied to remote state.
 * Operations are idempotent and can be replayed safely.
 */
export interface SyncOperation {
  /** Unique operation ID */
  readonly id: string;
  /** Type of CRDT operation */
  readonly type: 'set' | 'delete' | 'add' | 'remove';
  /** The path in the state tree (e.g., 'budgets.bgt-001.lineItems.li-003.amount') */
  readonly path: string;
  /** The value (for set/add operations) */
  readonly value: unknown;
  /** Device that originated this operation */
  readonly deviceId: string;
  /** Wall-clock timestamp */
  readonly timestamp: string;
  /** Vector clock at time of operation */
  readonly clock: VectorClock;
  /** Whether this operation has been acknowledged by the server */
  readonly acknowledged: boolean;
}

// ─── Sync State ────────────────────────────────────────────────────────────

/**
 * The synchronization state for a single data domain (e.g., budgets, scenarios).
 */
export interface SyncState {
  /** Domain identifier (e.g., 'budgets', 'scenarios', 'settings') */
  readonly domain: string;
  /** Local vector clock */
  readonly localClock: VectorClock;
  /** Last known server vector clock */
  readonly serverClock: VectorClock;
  /** Pending operations not yet sent to server */
  readonly pendingOps: readonly SyncOperation[];
  /** Operations received from server not yet applied locally */
  readonly incomingOps: readonly SyncOperation[];
  /** Last successful sync timestamp */
  readonly lastSyncAt: string | null;
  /** Sync status */
  readonly status: SyncStatus;
  /** Detected conflicts requiring user resolution */
  readonly conflicts: readonly SyncConflict[];
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'conflict' | 'error';

// ─── Conflict Resolution ───────────────────────────────────────────────────

/**
 * A detected conflict between local and remote changes.
 */
export interface SyncConflict {
  /** Unique conflict ID */
  readonly id: string;
  /** The state path where the conflict occurred */
  readonly path: string;
  /** The local value */
  readonly localValue: unknown;
  /** The remote value */
  readonly remoteValue: unknown;
  /** The local operation that caused the conflict */
  readonly localOp: SyncOperation;
  /** The remote operation that caused the conflict */
  readonly remoteOp: SyncOperation;
  /** Suggested resolution strategy */
  readonly suggestedStrategy: ConflictResolutionStrategy;
  /** Whether the conflict has been resolved */
  readonly isResolved: boolean;
  /** The resolved value (if manually resolved) */
  readonly resolvedValue: unknown;
}

export type ConflictResolutionStrategy =
  | 'local-wins'
  | 'remote-wins'
  | 'latest-wins'
  | 'manual'
  | 'merge';

// ─── Sync Engine Configuration ─────────────────────────────────────────────

export interface SyncEngineConfig {
  /** How often to poll for remote changes (milliseconds) */
  readonly pollIntervalMs: number;
  /** Maximum batch size for pending operations */
  readonly maxBatchSize: number;
  /** Whether to auto-merge when possible */
  readonly autoMerge: boolean;
  /** Conflict resolution strategy for auto-merge */
  readonly defaultConflictStrategy: ConflictResolutionStrategy;
  /** Offline detection threshold (ms since last successful sync) */
  readonly offlineThresholdMs: number;
}
