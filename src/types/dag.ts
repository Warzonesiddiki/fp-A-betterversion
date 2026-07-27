/**
 * Directed Acyclic Graph (DAG) Engine Types
 *
 * Formalizes cell dependency relationships as a DAG for:
 * 1. Topological sort (correct calculation order)
 * 2. Circular dependency detection (precise cell index reporting)
 * 3. Incremental recalculation (only recompute affected subgraph)
 *
 * Used by formula.worker.ts to replace naive recursive evaluation.
 */

// ─── DAG Node ──────────────────────────────────────────────────────────────

/**
 * A node in the calculation DAG.
 * Each node represents a cell/formula that depends on other cells.
 */
export interface DAGNode {
  /** Unique cell identifier (e.g., 'budget:revenue:2026-Q1:jan') */
  readonly cellId: string;
  /** Human-readable label (e.g., 'Revenue — January 2026') */
  readonly label: string;
  /** IDs of cells this node depends on (inputs) */
  readonly dependencies: readonly string[];
  /** IDs of cells that depend on this node (dependents) */
  readonly dependents: readonly string[];
  /** Whether this node's value has been computed */
  readonly isEvaluated: boolean;
  /** The formula expression (if this is a formula cell) */
  readonly formula: string | null;
  /** Current computed value */
  readonly value: unknown;
  /** Hash of the node's inputs for change detection */
  readonly inputHash: string;
}

// ─── DAG Graph ─────────────────────────────────────────────────────────────

/**
 * The complete calculation graph.
 * Maintains adjacency lists for both forward (dependency) and backward (dependent) traversal.
 */
export interface DAGraph {
  /** All nodes indexed by cellId */
  readonly nodes: ReadonlyMap<string, DAGNode>;
  /** Adjacency list: cellId → set of dependency cellIds */
  readonly adjacency: ReadonlyMap<string, ReadonlySet<string>>;
  /** Reverse adjacency: cellId → set of dependent cellIds */
  readonly reverseAdjacency: ReadonlyMap<string, ReadonlySet<string>>;
  /** Topological sort order (empty if cycle detected) */
  readonly topologicalOrder: readonly string[];
  /** Detected circular dependency chains (empty if no cycles) */
  readonly cycles: readonly CircularDependency[];
  /** Number of nodes in the graph */
  readonly nodeCount: number;
  /** Number of edges in the graph */
  readonly edgeCount: number;
}

// ─── Circular Dependency ───────────────────────────────────────────────────

/**
 * A detected circular dependency chain.
 * Contains the exact cell IDs involved so the UI can highlight them.
 */
export interface CircularDependency {
  /** Unique ID for this cycle */
  readonly id: string;
  /** Ordered list of cellIds forming the cycle */
  readonly chain: readonly string[];
  /** Human-readable description */
  readonly description: string;
  /** Severity: error blocks computation, warning allows with fallback */
  readonly severity: 'error' | 'warning';
  /** Suggested fix (e.g., 'Break cycle at cell X by removing formula Y') */
  readonly suggestedFix: string | null;
}

// ─── DAG Operation Results ─────────────────────────────────────────────────

/**
 * Result of a topological sort operation.
 */
export interface TopologicalSortResult {
  /** Whether the sort succeeded (false if cycles detected) */
  readonly success: boolean;
  /** Ordered cellIds (empty if cycles detected) */
  readonly order: readonly string[];
  /** Cycles found (empty if success=true) */
  readonly cycles: readonly CircularDependency[];
  /** Execution time in milliseconds */
  readonly durationMs: number;
}

/**
 * Result of an incremental recalculation.
 */
export interface RecalculationResult {
  /** Cells that were recomputed */
  readonly recomputedCells: readonly string[];
  /** Cells that were skipped (unchanged inputs) */
  readonly skippedCells: readonly string[];
  /** Errors encountered during computation */
  readonly errors: readonly CellCalculationError[];
  /** Total execution time in milliseconds */
  readonly durationMs: number;
  /** Whether any cycles were encountered */
  readonly hasCycles: boolean;
}

/**
 * Error during a single cell's calculation.
 */
export interface CellCalculationError {
  readonly cellId: string;
  readonly formula: string;
  readonly errorCode: 'CIRCULAR_REF' | 'DIV_ZERO' | 'TYPE_ERROR' | 'MISSING_REF' | 'OVERFLOW';
  readonly message: string;
  readonly stack: readonly string[]; // cellIds in the calculation path
}

// ─── DAG Engine Configuration ──────────────────────────────────────────────

export interface DAGEngineConfig {
  /** Maximum depth of recursive evaluation before assuming cycle */
  readonly maxDepth: number;
  /** Whether to use incremental recalculation (true) or full rebuild (false) */
  readonly incremental: boolean;
  /** Timeout for a single cell evaluation (milliseconds) */
  readonly cellTimeoutMs: number;
  /** Maximum number of cells to evaluate in one batch */
  readonly maxBatchSize: number;
  /** Whether to parallelize independent subgraphs */
  readonly parallelize: boolean;
}
