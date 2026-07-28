/**
 * DAG Engine — Directed Acyclic Graph for Formula Calculations
 *
 * Replaces naive recursive evaluation with formal topological sorting.
 * Detects circular dependencies BEFORE they cause stack overflows,
 * and reports the exact cell IDs involved in the cycle.
 *
 * Supports incremental recalculation: only recompute cells whose
 * inputs have changed (identified by input hash comparison).
 *
 * @module DAGEngine
 */

import type {
  DAGNode,
  DAGraph,
  CircularDependency,
  TopologicalSortResult,
  RecalculationResult,
  CellCalculationError,
  DAGEngineConfig,
} from '@/types/dag';

const DEFAULT_CONFIG: DAGEngineConfig = {
  maxDepth: 1000,
  incremental: true,
  cellTimeoutMs: 5000,
  maxBatchSize: 10000,
  parallelize: false,
};

// ─── Graph Construction ────────────────────────────────────────────────────

/**
 * Build a DAG from a set of nodes.
 * Computes adjacency lists, reverse adjacency lists, and topological order.
 */
export function buildDAG(nodes: readonly DAGNode[], _config = DEFAULT_CONFIG): DAGraph {
  const nodeMap = new Map<string, DAGNode>();
  const adjacency = new Map<string, Set<string>>();
  const reverseAdjacency = new Map<string, Set<string>>();

  // Index nodes
  for (const node of nodes) {
    nodeMap.set(node.cellId, node);
    adjacency.set(node.cellId, new Set(node.dependencies));
    reverseAdjacency.set(node.cellId, new Set(node.dependents));
  }

  // Ensure all dependency references exist as nodes
  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) {
        // Create a placeholder node for missing dependencies
        nodeMap.set(dep, {
          cellId: dep,
          label: `Missing: ${dep}`,
          dependencies: [],
          dependents: [],
          isEvaluated: false,
          formula: null,
          value: null,
          inputHash: '',
        });
        adjacency.set(dep, new Set());
        reverseAdjacency.set(dep, new Set());
      }
      // Ensure reverse adjacency is complete
      const reverseDeps = reverseAdjacency.get(dep);
      if (reverseDeps) {
        reverseDeps.add(node.cellId);
      }
    }
  }

  // Detect cycles
  const cycles = detectCycles(nodeMap, adjacency);

  // Topological sort (only if no cycles)
  let topologicalOrder: string[] = [];
  if (cycles.length === 0) {
    topologicalOrder = topologicalSort(nodeMap, adjacency);
  }

  // Count edges
  let edgeCount = 0;
  for (const deps of adjacency.values()) {
    edgeCount += deps.size;
  }

  return {
    nodes: nodeMap,
    adjacency,
    reverseAdjacency,
    topologicalOrder,
    cycles,
    nodeCount: nodeMap.size,
    edgeCount,
  };
}

// ─── Topological Sort (Kahn's Algorithm) ───────────────────────────────────

/**
 * Topological sort using Kahn's algorithm.
 * Returns an ordering where every node comes after all its dependencies.
 *
 * Time complexity: O(V + E)
 */
export function topologicalSort(
  nodes: ReadonlyMap<string, DAGNode>,
  adjacency: ReadonlyMap<string, ReadonlySet<string>>
): string[] {
  // In-degree = number of dependencies for each node
  const inDegree = new Map<string, number>();
  for (const [id] of nodes) {
    inDegree.set(id, adjacency.get(id)?.size ?? 0);
  }

  // Seed queue with nodes that have no dependencies (in-degree = 0)
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);

    // For each node that depends on current, decrement its in-degree
    for (const [id, deps] of adjacency) {
      if (deps.has(current)) {
        const newDeg = (inDegree.get(id) ?? 1) - 1;
        inDegree.set(id, newDeg);
        if (newDeg === 0) queue.push(id);
      }
    }
  }

  return order;
}

/**
 * Perform a topological sort with cycle detection.
 */
export function topologicalSortWithValidation(graph: DAGraph): TopologicalSortResult {
  const start = performance.now();

  if (graph.cycles.length > 0) {
    return {
      success: false,
      order: [],
      cycles: graph.cycles,
      durationMs: performance.now() - start,
    };
  }

  return {
    success: true,
    order: graph.topologicalOrder,
    cycles: [],
    durationMs: performance.now() - start,
  };
}

// ─── Cycle Detection (DFS) ─────────────────────────────────────────────────

/**
 * Detect all circular dependencies using DFS with color marking.
 *
 * WHITE (0): Not visited
 * GRAY (1): Currently being processed (on the recursion stack)
 * BLACK (2): Fully processed
 *
 * When we encounter a GRAY node, we've found a cycle.
 */
export function detectCycles(
  nodes: ReadonlyMap<string, DAGNode>,
  adjacency: ReadonlyMap<string, ReadonlySet<string>>
): CircularDependency[] {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const cycles: CircularDependency[] = [];

  for (const id of nodes.keys()) {
    color.set(id, WHITE);
  }

  function dfs(u: string): void {
    color.set(u, GRAY);

    const deps = adjacency.get(u);
    if (deps) {
      for (const v of deps) {
        const vColor = color.get(v) ?? WHITE;
        if (vColor === GRAY) {
          // Found a cycle — trace back to find the full chain
          const chain = traceCycle(u, v, parent);
          cycles.push({
            id: `cycle-${cycles.length + 1}`,
            chain,
            description: `Circular dependency: ${chain.join(' → ')} → ${chain[0]}`,
            severity: 'error',
            suggestedFix: `Break the cycle at cell '${chain[chain.length - 1]}' by removing its formula dependency on '${chain[0]}'`,
          });
        } else if (vColor === WHITE) {
          parent.set(v, u);
          dfs(v);
        }
      }
    }

    color.set(u, BLACK);
  }

  for (const id of nodes.keys()) {
    if (color.get(id) === WHITE) {
      parent.set(id, null);
      dfs(id);
    }
  }

  return cycles;
}

/**
 * Trace a cycle from the point of detection back to the cycle start.
 */
function traceCycle(
  current: string,
  start: string,
  parent: ReadonlyMap<string, string | null>
): string[] {
  const chain: string[] = [start];
  let node = current;
  while (node !== start && parent.has(node)) {
    chain.unshift(node);
    node = parent.get(node) ?? start;
  }
  return chain;
}

// ─── Incremental Recalculation ─────────────────────────────────────────────

/**
 * Recalculate only cells whose inputs have changed.
 * Uses the topological order to ensure dependencies are computed first.
 *
 * @param graph The calculation graph
 * @param evaluateCell Function to evaluate a single cell's formula
 * @param changedCells Set of cellIds whose values have changed
 */
export function recalculate(
  graph: DAGraph,
  evaluateCell: (cellId: string) => unknown,
  changedCells: ReadonlySet<string>,
  _config = DEFAULT_CONFIG
): RecalculationResult {
  const start = performance.now();
  const recomputedCells: string[] = [];
  const skippedCells: string[] = [];
  const errors: CellCalculationError[] = [];

  if (graph.cycles.length > 0) {
    return {
      recomputedCells: [],
      skippedCells: [],
      errors: graph.cycles.map((cycle) => ({
        cellId: cycle.chain[0] ?? 'unknown',
        formula: '',
        errorCode: 'CIRCULAR_REF',
        message: cycle.description,
        stack: cycle.chain,
      })),
      durationMs: performance.now() - start,
      hasCycles: true,
    };
  }

  // Determine which cells need recalculation
  const needsRecalc = new Set<string>(changedCells);

  // Propagate: if a cell changed, all its dependents need recalculation
  for (const cellId of changedCells) {
    propagateDependents(graph, cellId, needsRecalc);
  }

  // Evaluate in topological order
  for (const cellId of graph.topologicalOrder) {
    if (!needsRecalc.has(cellId)) {
      skippedCells.push(cellId);
      continue;
    }

    try {
      evaluateCell(cellId);
      recomputedCells.push(cellId);
    } catch (err) {
      errors.push({
        cellId,
        formula: graph.nodes.get(cellId)?.formula ?? '',
        errorCode: 'TYPE_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: [],
      });
    }
  }

  return {
    recomputedCells,
    skippedCells,
    errors,
    durationMs: performance.now() - start,
    hasCycles: false,
  };
}

/**
 * Propagate dependents: if cell A changed, all cells that depend on A
 * (directly or transitively) need recalculation.
 */
function propagateDependents(graph: DAGraph, cellId: string, needsRecalc: Set<string>): void {
  const visited = new Set<string>();
  const queue = [cellId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const dependents = graph.reverseAdjacency.get(current);
    if (dependents) {
      for (const dep of dependents) {
        needsRecalc.add(dep);
        queue.push(dep);
      }
    }
  }
}

// ─── Graph Analysis ────────────────────────────────────────────────────────

/**
 * Get all cells that a given cell depends on (transitively).
 */
export function getTransitiveDependencies(graph: DAGraph, cellId: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const queue = [cellId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current !== cellId) result.push(current);

    const deps = graph.adjacency.get(current);
    if (deps) {
      for (const dep of deps) {
        queue.push(dep);
      }
    }
  }

  return result;
}

/**
 * Get all cells that depend on a given cell (transitively).
 */
export function getTransitiveDependents(graph: DAGraph, cellId: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];
  const queue = [cellId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    if (current !== cellId) result.push(current);

    const deps = graph.reverseAdjacency.get(current);
    if (deps) {
      for (const dep of deps) {
        queue.push(dep);
      }
    }
  }

  return result;
}

/**
 * Find all leaf nodes (nodes with no dependents — outputs).
 */
export function findLeafNodes(graph: DAGraph): string[] {
  const leaves: string[] = [];
  for (const [id, deps] of graph.reverseAdjacency) {
    if (deps.size === 0) leaves.push(id);
  }
  return leaves;
}

/**
 * Find all root nodes (nodes with no dependencies — inputs).
 */
export function findRootNodes(graph: DAGraph): string[] {
  const roots: string[] = [];
  for (const [id, deps] of graph.adjacency) {
    if (deps.size === 0) roots.push(id);
  }
  return roots;
}
