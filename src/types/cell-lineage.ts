/**
 * Immutable Cell Lineage Types — Complete Provenance Tracking
 *
 * Every single atomic metric adjustment is recorded immutably:
 * UserID, Timestamp, OldValue, NewValue, ModifyingEngineVersion, DataOrigin.
 *
 * Unlike the existing auditTrailStore (which tracks GDPR/SOX events),
 * this tracks the COMPLETE LINEAGE of every cell value from creation
 * to its current state, enabling "rewind to any point in time."
 */

import type { PreciseAmount } from './precision';

// ─── Cell Lineage Entry ────────────────────────────────────────────────────

/**
 * A single immutable record in a cell's lineage chain.
 * Once written, this record can NEVER be modified or deleted.
 */
export interface CellLineageEntry {
  /** Globally unique entry ID (ULID for time-ordered sorting) */
  readonly id: string;
  /** The cell this entry belongs to */
  readonly cellId: string;
  /** The value before this change */
  readonly oldValue: CellValueSnapshot;
  /** The value after this change */
  readonly newValue: CellValueSnapshot;
  /** Who made the change */
  readonly actor: CellLineageActor;
  /** When the change was made (ISO 8601) */
  readonly timestamp: string;
  /** Why the change was made */
  readonly reason: CellLineageReason;
  /** The engine/formula version that computed this value (if automated) */
  readonly engineVersion: string | null;
  /** Data origin classification */
  readonly dataOrigin: DataOrigin;
  /** Hash of the previous lineage entry (blockchain-style chain) */
  readonly previousHash: string;
  /** Hash of this entry (for integrity verification) */
  readonly entryHash: string;
  /** Metadata for debugging and traceability */
  readonly metadata: Readonly<Record<string, unknown>>;
}

/**
 * A snapshot of a cell's value at a point in time.
 * Uses precise integer arithmetic for financial values.
 */
export interface CellValueSnapshot {
  /** The raw value (PreciseAmount for numbers, string for text, etc.) */
  readonly value: unknown;
  /** The data type */
  readonly dataType: 'number' | 'string' | 'boolean' | 'date' | 'formula' | 'null';
  /** For numeric values: the precise integer representation */
  readonly preciseValue: PreciseAmount | null;
  /** For formula cells: the formula expression */
  readonly formula: string | null;
  /** For formula cells: the resolved dependencies at evaluation time */
  readonly dependencies: readonly string[] | null;
}

/**
 * Who made the change.
 */
export interface CellLineageActor {
  /** User ID (for human actors) */
  readonly userId: string | null;
  /** User display name */
  readonly userName: string | null;
  /** Engine ID (for automated actors) */
  readonly engineId: string | null;
  /** Engine version (for automated actors) */
  readonly engineVersion: string | null;
  /** Actor type */
  readonly actorType: 'user' | 'engine' | 'import' | 'api' | 'system';
}

/**
 * Why the change was made.
 */
export interface CellLineageReason {
  /** Category of the reason */
  readonly category: LineageReasonCategory;
  /** Free-text description */
  readonly description: string;
  /** Reference to a related entity (e.g., budget ID, import job ID) */
  readonly referenceId: string | null;
  /** Reference type */
  readonly referenceType: string | null;
}

export type LineageReasonCategory =
  | 'manual-edit'
  | 'formula-recalc'
  | 'data-import'
  | 'api-sync'
  | 'consolidation'
  | 'fx-translation'
  | 'allocation'
  | 'scenario-copy'
  | 'rollback'
  | 'system-init'
  | 'driver-update';

/**
 * Data origin classification — where did this value come from?
 */
export type DataOrigin =
  | 'manual-override'
  | 'automated-engine'
  | 'erp-import'
  | 'csv-upload'
  | 'api-ingestion'
  | 'formula-computed'
  | 'consolidation-elimination'
  | 'fx-revaluation'
  | 'driver-based-forecast'
  | 'scenario-interpolation';

// ─── Lineage Chain ─────────────────────────────────────────────────────────

/**
 * The complete lineage chain for a single cell.
 * Ordered chronologically from creation to current state.
 */
export interface CellLineageChain {
  /** The cell this chain belongs to */
  readonly cellId: string;
  /** All lineage entries in chronological order */
  readonly entries: readonly CellLineageEntry[];
  /** The current value (latest entry's newValue) */
  readonly currentValue: CellValueSnapshot;
  /** When the cell was created */
  readonly createdAt: string;
  /** Total number of changes */
  readonly changeCount: number;
  /** Number of unique actors */
  readonly uniqueActors: number;
  /** The hash chain is valid (no tampering) */
  readonly integrityValid: boolean;
}

// ─── Lineage Query ─────────────────────────────────────────────────────────

/**
 * Query parameters for searching lineage entries.
 */
export interface LineageQuery {
  /** Filter by cell ID(s) */
  readonly cellIds?: readonly string[];
  /** Filter by actor */
  readonly actorUserId?: string;
  /** Filter by actor type */
  readonly actorType?: CellLineageActor['actorType'];
  /** Filter by data origin */
  readonly dataOrigin?: DataOrigin;
  /** Filter by reason category */
  readonly reasonCategory?: LineageReasonCategory;
  /** Filter by time range */
  readonly from?: string;
  readonly to?: string;
  /** Pagination */
  readonly offset: number;
  readonly limit: number;
}

// ─── Lineage Store Shape ───────────────────────────────────────────────────

export interface CellLineageState {
  /** All lineage chains indexed by cellId */
  readonly chains: ReadonlyMap<string, CellLineageChain>;
  /** Pending entries not yet persisted */
  readonly pendingEntries: readonly CellLineageEntry[];
  /** Whether integrity verification has been run */
  readonly integrityVerified: boolean;
  /** Last integrity check timestamp */
  readonly lastIntegrityCheck: string | null;
}
