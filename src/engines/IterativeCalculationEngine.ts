// =============================================================================
// ITERATIVE CALCULATION ENGINE — Circular Reference Detection & Resolution
// Supports debt schedules, working capital loops, interest-on-interest
// =============================================================================

export interface IterativeConfig {
  maxIterations: number;
  maxChange: number; // tolerance for convergence
  enableIterativeCalc: boolean;
}

export const DEFAULT_ITERATIVE_CONFIG: IterativeConfig = {
  maxIterations: 100,
  maxChange: 0.001,
  enableIterativeCalc: false,
};

export type ConvergenceStatus = 'converged' | 'diverged' | 'max-iterations' | 'not-started';

export interface ConvergenceResult {
  status: ConvergenceStatus;
  iterations: number;
  maxChange: number;
  history: number[]; // max change per iteration
  involvedCells: string[];
}

export interface CircularGroup {
  cells: string[];
  description: string;
}

// --- Dependency Graph ---

export interface DependencyGraph {
  /** Map of cellRef -> set of cellRefs it depends on */
  dependencies: Map<string, Set<string>>;
}

export function buildDependencyGraph(
  cellFormulas: Map<string, string>,
  getDeps: (formula: string) => string[]
): DependencyGraph {
  const dependencies = new Map<string, Set<string>>();
  for (const [cell, formula] of Array.from(cellFormulas)) {
    const deps = getDeps(formula);
    dependencies.set(cell, new Set(deps));
  }
  return { dependencies };
}

// --- Circular Reference Detection (DFS) ---

export function detectCircularReferences(graph: DependencyGraph): CircularGroup[] {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const cycles: CircularGroup[] = [];

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      // Found a cycle — extract it
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) {
        const cycleCells = path.slice(cycleStart);
        cycles.push({
          cells: cycleCells,
          description: `Circular reference: ${cycleCells.join(' → ')} → ${node}`,
        });
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    path.push(node);

    const deps = graph.dependencies.get(node);
    if (deps) {
      for (const dep of Array.from(deps)) {
        if (graph.dependencies.has(dep)) {
          dfs(dep, path);
        }
      }
    }

    path.pop();
    inStack.delete(node);
  }

  for (const node of Array.from(graph.dependencies.keys())) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

// --- Get all cells involved in circular references ---

export function getCircularCells(cycles: CircularGroup[]): Set<string> {
  const cells = new Set<string>();
  for (const cycle of cycles) {
    for (const cell of cycle.cells) {
      cells.add(cell);
    }
  }
  return cells;
}

// --- Iterative Solver ---

export interface CellValueAccessor {
  getCellValue: (ref: string) => number;
  setCellValue: (ref: string, value: number) => void;
  recalcCell: (ref: string) => number;
}

export function solveIteratively(
  circularCells: Set<string>,
  accessor: CellValueAccessor,
  config: IterativeConfig = DEFAULT_ITERATIVE_CONFIG
): ConvergenceResult {
  const involvedCells = Array.from(circularCells).sort();
  const history: number[] = [];
  let maxChange = 0;

  if (!config.enableIterativeCalc || circularCells.size === 0) {
    return {
      status: 'not-started',
      iterations: 0,
      maxChange: 0,
      history: [],
      involvedCells,
    };
  }

  // Save initial values
  const previousValues = new Map<string, number>();
  for (const cell of Array.from(circularCells)) {
    previousValues.set(cell, accessor.getCellValue(cell));
  }

  for (let iter = 0; iter < config.maxIterations; iter++) {
    // Recalculate all circular cells
    for (const cell of Array.from(circularCells)) {
      accessor.recalcCell(cell);
    }

    // Check max change
    maxChange = 0;
    for (const cell of Array.from(circularCells)) {
      const prev = previousValues.get(cell) ?? 0;
      const curr = accessor.getCellValue(cell);
      const change = Math.abs(curr - prev);
      if (change > maxChange) maxChange = change;
      previousValues.set(cell, curr);
    }

    history.push(maxChange);

    // Check convergence
    if (maxChange <= config.maxChange) {
      return {
        status: 'converged',
        iterations: iter + 1,
        maxChange,
        history,
        involvedCells,
      };
    }

    // Check for divergence (change growing unbounded)
    if (iter > 5 && history.length > 5) {
      const recent = history.slice(-5);
      const isGrowing = recent.every((v, i) => i === 0 || v >= recent[i - 1]);
      if (isGrowing && maxChange > 1e12) {
        return {
          status: 'diverged',
          iterations: iter + 1,
          maxChange,
          history,
          involvedCells,
        };
      }
    }
  }

  return {
    status: 'max-iterations',
    iterations: config.maxIterations,
    maxChange,
    history,
    involvedCells,
  };
}

// --- Convenience: Full analysis pipeline ---

export interface IterativeAnalysis {
  cycles: CircularGroup[];
  circularCells: Set<string>;
  hasCircular: boolean;
}

export function analyzeFormulas(
  cellFormulas: Map<string, string>,
  getDeps: (formula: string) => string[]
): IterativeAnalysis {
  const graph = buildDependencyGraph(cellFormulas, getDeps);
  const cycles = detectCircularReferences(graph);
  const circularCells = getCircularCells(cycles);

  return {
    cycles,
    circularCells,
    hasCircular: circularCells.size > 0,
  };
}
