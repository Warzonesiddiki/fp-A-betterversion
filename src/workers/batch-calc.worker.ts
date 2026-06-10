/// <reference lib="webworker" />
// =============================================================================
// BATCH CALCULATION WEB WORKER
// Runs batch formula recalculation off the main thread.
// Handles dependency graph traversal, topological sort, and iterative convergence.
// =============================================================================

import type {
  WorkerMessage,
  WorkerResponse,
  BatchCalcRequest,
  BatchCalcResponse,
  BatchCellIdentifier,
  BatchCalcDependency,
} from './types';

// --- Cell key helpers ---

function cellKey(cell: BatchCellIdentifier): string {
  return `${cell.sheet}!${cell.col}${cell.row}`;
}

// --- Dependency graph ---

function buildDependencyGraph(dependencies: BatchCalcDependency[]): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const dep of dependencies) {
    const key = cellKey(dep.cell);
    const depKeys = new Set(dep.dependsOn.map(cellKey));
    graph.set(key, depKeys);
  }

  return graph;
}

function buildReverseGraph(graph: Map<string, Set<string>>): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();

  for (const [key, deps] of graph) {
    for (const dep of deps) {
      if (!reverse.has(dep)) {
        reverse.set(dep, new Set());
      }
      reverse.get(dep)!.add(key);
    }
  }

  return reverse;
}

// --- Topological sort (Kahn's algorithm) ---

function topologicalSort(cells: Set<string>, graph: Map<string, Set<string>>): string[] {
  const inDegree = new Map<string, number>();
  const cellList = Array.from(cells);

  // Initialize in-degrees
  for (const key of cellList) {
    inDegree.set(key, 0);
  }

  // Calculate in-degrees
  for (const key of cellList) {
    const deps = graph.get(key);
    if (deps) {
      for (const dep of deps) {
        if (cells.has(dep)) {
          inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
        }
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [key, degree] of inDegree) {
    if (degree === 0) queue.push(key);
  }

  const result: string[] = [];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++]!;
    result.push(current);

    // Find cells that depend on current
    for (const key of cellList) {
      const deps = graph.get(key);
      if (deps && deps.has(current)) {
        const newDegree = (inDegree.get(key) ?? 1) - 1;
        inDegree.set(key, newDegree);
        if (newDegree === 0) {
          queue.push(key);
        }
      }
    }
  }

  return result;
}

// --- BFS for affected cells ---

function getAffectedCells(startCell: string, reverseGraph: Map<string, Set<string>>): string[] {
  const affected = new Set<string>();
  const queue: string[] = [startCell];
  let head = 0;

  while (head < queue.length) {
    const current = queue[head++]!;
    if (affected.has(current)) continue;
    affected.add(current);

    const dependents = reverseGraph.get(current);
    if (dependents) {
      for (const dep of dependents) {
        if (!affected.has(dep)) {
          queue.push(dep);
        }
      }
    }
  }

  return Array.from(affected).filter((k) => k !== startCell);
}

// --- Simple formula evaluator ---

function evaluateFormula(formula: string, values: Record<string, number>): number {
  // Replace cell references with values
  let expr = formula;

  // Match cell references like A1, B2, Sheet1!A1
  const cellRefPattern = /(?:[A-Za-z_]+!)?[A-Z]+\d+/g;
  expr = expr.replace(cellRefPattern, (match) => {
    const val = values[match] ?? 0;
    return String(val);
  });

  // Handle basic functions
  expr = expr.replace(/SUM\(([^)]+)\)/gi, (_, args: string) => {
    const parts = args.split(',').map((p) => parseFloat(p.trim()));
    return String(parts.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0));
  });

  expr = expr.replace(/AVERAGE\(([^)]+)\)/gi, (_, args: string) => {
    const parts = args
      .split(',')
      .map((p) => parseFloat(p.trim()))
      .filter((v) => !isNaN(v));
    return parts.length > 0 ? String(parts.reduce((s, v) => s + v, 0) / parts.length) : '0';
  });

  expr = expr.replace(/MAX\(([^)]+)\)/gi, (_, args: string) => {
    const parts = args
      .split(',')
      .map((p) => parseFloat(p.trim()))
      .filter((v) => !isNaN(v));
    return parts.length > 0 ? String(Math.max(...parts)) : '0';
  });

  expr = expr.replace(/MIN\(([^)]+)\)/gi, (_, args: string) => {
    const parts = args
      .split(',')
      .map((p) => parseFloat(p.trim()))
      .filter((v) => !isNaN(v));
    return parts.length > 0 ? String(Math.min(...parts)) : '0';
  });

  // Safely evaluate arithmetic
  try {
    // Only allow safe characters: numbers, operators, parentheses, dots, spaces
    if (/^[0-9+\-*/().%\s]+$/.test(expr)) {
      const result = Function(`"use strict"; return (${expr})`)();
      return typeof result === 'number' && isFinite(result) ? result : 0;
    }
    return parseFloat(expr) || 0;
  } catch {
    return 0;
  }
}

// --- Core batch calculation ---

function runBatchCalc(request: BatchCalcRequest): BatchCalcResponse {
  const {
    cells,
    dependencies,
    formulas,
    values: initialValues,
    maxIterations = 100,
    convergenceThreshold = 1e-10,
  } = request;

  if (cells.length === 0) {
    return {
      updatedValues: { ...initialValues },
      dirtyCells: [],
      affectedCells: [],
      iterationCount: 0,
      converged: true,
    };
  }

  // Build graphs
  const graph = buildDependencyGraph(dependencies);
  const reverseGraph = buildReverseGraph(graph);

  // Determine all affected cells plus transitive dependencies
  const allCellKeys = new Set(cells.map(cellKey));
  const expandedKeys = new Set(allCellKeys);

  // Add all transitive dependencies so chained formulas evaluate correctly
  const depQueue = Array.from(allCellKeys);
  while (depQueue.length > 0) {
    const key = depQueue.pop()!;
    const deps = graph.get(key);
    if (deps) {
      for (const dep of deps) {
        if (!expandedKeys.has(dep)) {
          expandedKeys.add(dep);
          depQueue.push(dep);
        }
      }
    }
  }

  for (const key of allCellKeys) {
    const affected = getAffectedCells(key, reverseGraph);
    for (const a of affected) {
      expandedKeys.add(a);
    }
  }

  // Topological sort
  const sortedCells = topologicalSort(expandedKeys, graph);
  const values = { ...initialValues };
  let iterationCount = 0;
  let converged = false;

  // Iterative convergence loop
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let maxChange = 0;
    iterationCount = iteration + 1;

    for (const key of sortedCells) {
      const formula = formulas[key];
      if (!formula) continue;

      const oldValue = values[key] ?? 0;
      const newValue = evaluateFormula(formula, values);
      const change = Math.abs(newValue - oldValue);

      if (change > maxChange) {
        maxChange = change;
      }

      if (change > convergenceThreshold) {
        values[key] = newValue;
      }
    }

    // Report progress
    const progressResponse: WorkerResponse = {
      id: 'batch-calc',
      type: 'progress',
      progress: {
        processed: iteration + 1,
        total: maxIterations,
        percent: Math.round(((iteration + 1) / maxIterations) * 100),
      },
    };
    self.postMessage(progressResponse);

    if (maxChange <= convergenceThreshold) {
      converged = true;
      break;
    }
  }

  return {
    updatedValues: values,
    dirtyCells: Array.from(allCellKeys),
    affectedCells: sortedCells,
    iterationCount,
    converged,
  };
}

// --- Worker message handler ---

self.onmessage = (e: MessageEvent<WorkerMessage<BatchCalcRequest>>) => {
  const { id, payload } = e.data;

  try {
    const result = runBatchCalc(payload);
    const response: WorkerResponse<BatchCalcResponse> = {
      id,
      type: 'result',
      payload: result,
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error in batch calc worker',
    };
    self.postMessage(response);
  }
};
