/**
 * CalculationGraph — Cell dependency graph for spreadsheet-like recalculation
 *
 * Makes FormulaEngine work at scale by:
 * - Building a DAG from cell formulas
 * - Topological sort for evaluation order (Kahn's algorithm)
 * - Dirty propagation: change one cell → only affected cells recalculate
 * - Cycle detection via DFS
 * - Batched evaluation with progress reporting
 */

import { FormulaEngine } from './FormulaEngine';

export interface CellNode {
  ref: string;
  formula: string | null;
  dependents: Set<string>;
  dependencies: Set<string>;
  dirty: boolean;
  value: unknown;
  error: string | null;
  lastCalculated: number;
  calculationTime: number;
}

export interface BuildResult {
  nodeCount: number;
  formulaCount: number;
  errors: CellError[];
}

export interface CellError {
  ref: string;
  type: 'CIRCULAR_REFERENCE' | 'INVALID_FORMULA' | 'MISSING_REFERENCE';
  message: string;
}

export interface CalcProgress {
  evaluated: number;
  total: number;
  percentage: number;
  errors: number;
  elapsed: number;
}

export interface EvaluationResult {
  evaluated: number;
  errors: number;
  duration: number;
  graphStats: GraphStats;
}

export interface GraphStats {
  totalCells: number;
  formulaCells: number;
  totalDependencies: number;
  maxDependencyDepth: number;
  averageCalcTime: number;
  totalCalcTime: number;
}

export interface CycleResult {
  cycles: string[][];
  involvedCells: Set<string>;
}

export class CalculationGraph {
  private nodes: Map<string, CellNode> = new Map();
  private batchSize = 500;

  /**
   * Build dependency graph from cell definitions
   */
  buildFromCells(cells: Array<{ ref: string; formula?: string; value?: unknown }>): BuildResult {
    const errors: CellError[] = [];
    let formulaCount = 0;

    // Pass 1: Build all nodes and dependency edges
    for (const cell of cells) {
      const node: CellNode = {
        ref: cell.ref,
        formula: cell.formula ?? null,
        dependents: new Set(),
        dependencies: new Set(),
        dirty: true,
        value: cell.value ?? null,
        error: null,
        lastCalculated: 0,
        calculationTime: 0,
      };

      if (cell.formula) {
        formulaCount++;
        const refs = FormulaEngine.getDependencies(cell.formula);
        for (const ref of refs) {
          node.dependencies.add(ref);
          this.getOrCreateNode(ref).dependents.add(cell.ref);
        }
      }

      this.nodes.set(cell.ref, node);
    }

    // Pass 2: Detect cycles (all nodes now exist with full edges)
    for (const cell of cells) {
      if (cell.formula && this.hasCycle(cell.ref, new Set())) {
        const node = this.nodes.get(cell.ref)!;
        errors.push({
          ref: cell.ref,
          type: 'CIRCULAR_REFERENCE',
          message: `Circular reference detected: ${cell.formula}`,
        });
        node.error = 'CIRCULAR_REFERENCE';
      }
    }

    return { nodeCount: this.nodes.size, formulaCount, errors };
  }

  /**
   * Mark a cell dirty and cascade to all dependents
   */
  markDirty(ref: string): number {
    let dirtyCount = 0;
    const visited = new Set<string>();
    const queue = [ref];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.nodes.get(current);
      if (!node) continue;

      node.dirty = true;
      dirtyCount++;

      for (const dependent of node.dependents) {
        queue.push(dependent);
      }
    }

    return dirtyCount;
  }

  /**
   * Evaluate all dirty cells in topological order
   */
  async evaluateAll(options?: {
    onProgress?: (progress: CalcProgress) => void;
    batchSize?: number;
    getCellValue?: (ref: string) => number;
  }): Promise<EvaluationResult> {
    const startTime = performance.now();
    const dirtyCells = this.getDirtyCellsInTopoOrder();
    const total = dirtyCells.length;
    let evaluated = 0;
    let errors = 0;

    const batchSize = options?.batchSize ?? this.batchSize;
    const getCellValue =
      options?.getCellValue ??
      ((ref: string) => {
        const node = this.nodes.get(ref);
        return typeof node?.value === 'number' ? node.value : 0;
      });

    for (let i = 0; i < dirtyCells.length; i += batchSize) {
      const batch = dirtyCells.slice(i, i + batchSize);

      for (const ref of batch) {
        const node = this.nodes.get(ref)!;
        const start = performance.now();

        try {
          if (node.formula && node.error !== 'CIRCULAR_REFERENCE') {
            const { nodes } = FormulaEngine.parseFormula(node.formula);
            const result = FormulaEngine.evaluate(nodes, getCellValue);
            node.value = result.value;
            node.error = result.error ?? null;
          }
        } catch (e) {
          node.value = null;
          node.error = e instanceof Error ? e.message : 'Unknown error';
          errors++;
        }

        node.dirty = false;
        node.lastCalculated = Date.now();
        node.calculationTime = performance.now() - start;
        evaluated++;
      }

      options?.onProgress?.({
        evaluated,
        total,
        percentage: Math.round((evaluated / total) * 100),
        errors,
        elapsed: performance.now() - startTime,
      });

      if (i + batchSize < dirtyCells.length) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    return {
      evaluated,
      errors,
      duration: performance.now() - startTime,
      graphStats: this.getStats(),
    };
  }

  /**
   * Topological sort via Kahn's algorithm
   */
  getDirtyCellsInTopoOrder(): string[] {
    const dirty = new Set<string>();
    const inDegree = new Map<string, number>();

    for (const [ref, node] of this.nodes) {
      if (node.dirty) {
        dirty.add(ref);
        inDegree.set(ref, 0);
      }
    }

    for (const ref of dirty) {
      const node = this.nodes.get(ref)!;
      for (const dep of node.dependencies) {
        if (dirty.has(dep)) {
          inDegree.set(ref, (inDegree.get(ref) ?? 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [ref, deg] of inDegree) {
      if (deg === 0) queue.push(ref);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const ref = queue.shift()!;
      sorted.push(ref);

      for (const dependent of this.nodes.get(ref)!.dependents) {
        if (dirty.has(dependent)) {
          const newDeg = (inDegree.get(dependent) ?? 1) - 1;
          inDegree.set(dependent, newDeg);
          if (newDeg === 0) queue.push(dependent);
        }
      }
    }

    return sorted;
  }

  /**
   * Detect cycles via DFS
   */
  detectCycles(): CycleResult {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const cycles: string[][] = [];
    const involvedCells = new Set<string>();

    const dfs = (ref: string, path: string[]): boolean => {
      if (inStack.has(ref)) {
        const cycleStart = path.indexOf(ref);
        const cycle = path.slice(cycleStart);
        cycles.push(cycle);
        cycle.forEach((c) => involvedCells.add(c));
        return true;
      }
      if (visited.has(ref)) return false;

      visited.add(ref);
      inStack.add(ref);
      path.push(ref);

      const node = this.nodes.get(ref);
      if (node) {
        for (const dep of node.dependencies) {
          if (dfs(dep, path)) return true;
        }
      }

      path.pop();
      inStack.delete(ref);
      return false;
    };

    for (const ref of this.nodes.keys()) {
      if (!visited.has(ref)) {
        dfs(ref, []);
      }
    }

    return { cycles, involvedCells };
  }

  getDependencies(ref: string): string[] {
    const node = this.nodes.get(ref);
    return node ? Array.from(node.dependencies) : [];
  }

  getDependents(ref: string): string[] {
    const node = this.nodes.get(ref);
    return node ? Array.from(node.dependents) : [];
  }

  getNode(ref: string): CellNode | undefined {
    return this.nodes.get(ref);
  }

  setValue(ref: string, value: unknown): void {
    const node = this.nodes.get(ref);
    if (node) {
      node.value = value;
      node.dirty = false;
    }
  }

  getStats(): GraphStats {
    let totalDeps = 0;
    const maxDepth = 0;
    let formulaCells = 0;
    let totalCalcTime = 0;

    for (const node of this.nodes.values()) {
      totalDeps += node.dependencies.size;
      if (node.formula) formulaCells++;
      totalCalcTime += node.calculationTime;
    }

    return {
      totalCells: this.nodes.size,
      formulaCells,
      totalDependencies: totalDeps,
      maxDependencyDepth: maxDepth,
      averageCalcTime: this.nodes.size > 0 ? totalCalcTime / this.nodes.size : 0,
      totalCalcTime,
    };
  }

  clear(): void {
    this.nodes.clear();
  }

  private getOrCreateNode(ref: string): CellNode {
    let node = this.nodes.get(ref);
    if (!node) {
      node = {
        ref,
        formula: null,
        dependents: new Set(),
        dependencies: new Set(),
        dirty: false,
        value: null,
        error: null,
        lastCalculated: 0,
        calculationTime: 0,
      };
      this.nodes.set(ref, node);
    }
    return node;
  }

  private hasCycle(startRef: string, visited: Set<string>): boolean {
    if (visited.has(startRef)) return true;
    visited.add(startRef);

    const node = this.nodes.get(startRef);
    if (!node) return false;

    for (const dep of node.dependencies) {
      if (this.hasCycle(dep, visited)) return true;
    }

    visited.delete(startRef);
    return false;
  }
}
