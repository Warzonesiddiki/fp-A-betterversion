/**
 * Cell lineage data contracts — local-draft provenance, not a compliance log.
 *
 * Entries carry values, actor, time, reason and origin for per-cell history.
 * The current store is not wired to a production producer or general audit
 * surface. Hashes are unkeyed consistency checks without an external anchor;
 * they do not make the records immutable or regulatory evidence.
 */

import type { PreciseAmount } from './precision';

// ─── Cell Lineage Entry ────────────────────────────────────────────────────

/**
 * One entry in a cell's local lineage sequence.
 * Append-only is a store convention, not an enforced or externally anchored guarantee.
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
  /** Unkeyed SHA-256 of the prior entry payload; not an external anchor. */
  readonly previousHash: string;
  /** Unkeyed SHA-256 payload digest; recomputation checks internal consistency only. */
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
  /** Whether the last local consistency check passed; not proof against a full rewrite. */
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
  /** Append-ordered entry copy retained for v1 persistence reconstruction and replay. */
  readonly pendingEntries: readonly CellLineageEntry[];
  /** Whether integrity verification has been run */
  readonly integrityVerified: boolean;
  /** Last integrity check timestamp */
  readonly lastIntegrityCheck: string | null;
}
