export interface CellIdentifier {
  sheet: string;
  col: string;
  row: number;
}

export interface CellDependency {
  cell: CellIdentifier;
  dependsOn: CellIdentifier[];
}

export interface DirtyCellResult {
  dirtyCells: CellIdentifier[];
  affectedCells: CellIdentifier[];
  iterationCount: number;
}

export interface IncrementalCalcConfig {
  maxIterations: number;
  convergenceThreshold: number;
  enableBatching: boolean;
  batchSize: number;
}

const DEFAULT_CONFIG: IncrementalCalcConfig = {
  maxIterations: 100,
  convergenceThreshold: 1e-10,
  enableBatching: true,
  batchSize: 1000,
};

export class IncrementalCalcEngine {
  private dirtyCells = new Set<string>();
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencyGraph = new Map<string, Set<string>>();
  private cellDependencies = new Map<string, CellDependency>();
  private config: IncrementalCalcConfig;
  private isCalculating = false;
  private batchQueue: CellIdentifier[] = [];

  constructor(config: Partial<IncrementalCalcConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private cellKey(cell: CellIdentifier): string {
    return `${cell.sheet}!${cell.col}${cell.row}`;
  }

  private parseCellKey(key: string): CellIdentifier {
    const match = key.match(/^(.+)!(.+?)(\d+)$/);
    if (!match) throw new Error(`Invalid cell key: ${key}`);
    return { sheet: match[1], col: match[2], row: parseInt(match[3], 10) };
  }

  markDirty(cell: CellIdentifier): void {
    const key = this.cellKey(cell);
    this.dirtyCells.add(key);

    if (this.config.enableBatching) {
      this.batchQueue.push(cell);
      if (this.batchQueue.length >= this.config.batchSize) {
        this.processBatch();
      }
    }
  }

  markRangeDirty(cells: CellIdentifier[]): void {
    for (const cell of cells) {
      this.markDirty(cell);
    }
  }

  setDependencies(cell: CellIdentifier, dependencies: CellIdentifier[]): void {
    const key = this.cellKey(cell);
    const depKeys = dependencies.map((d) => this.cellKey(d));

    this.cellDependencies.set(key, { cell, dependsOn: dependencies });
    this.dependencyGraph.set(key, new Set(depKeys));

    for (const depKey of depKeys) {
      if (!this.reverseDependencyGraph.has(depKey)) {
        this.reverseDependencyGraph.set(depKey, new Set());
      }
      this.reverseDependencyGraph.get(depKey)!.add(key);
    }
  }

  getAffectedCells(dirtyCell: CellIdentifier): CellIdentifier[] {
    const affected = new Set<string>();
    const queue = [this.cellKey(dirtyCell)];
    let queueHead = 0;

    while (queueHead < queue.length) {
      const current = queue[queueHead++];
      if (affected.has(current)) continue;
      affected.add(current);

      const dependents = this.reverseDependencyGraph.get(current);
      if (dependents) {
        for (const dependent of Array.from(dependents)) {
          if (!affected.has(dependent)) {
            queue.push(dependent);
          }
        }
      }
    }

    return Array.from(affected)
      .filter((key) => key !== this.cellKey(dirtyCell))
      .map((key) => this.parseCellKey(key));
  }

  calculateIncremental(
    getCellValue: (cell: CellIdentifier) => number,
    setCellValue: (cell: CellIdentifier, value: number) => void,
    evaluateFormula: (cell: CellIdentifier) => number,
    onProgress?: (processed: number, total: number) => void
  ): DirtyCellResult {
    if (this.isCalculating) {
      throw new Error('Calculation already in progress');
    }

    this.isCalculating = true;
    const processedCells = new Set<string>();
    let iterationCount = 0;

    try {
      if (this.config.enableBatching && this.batchQueue.length > 0) {
        this.processBatch();
      }

      const allDirtyKeys = new Set(this.dirtyCells);

      for (const dirtyKey of Array.from(allDirtyKeys)) {
        const dependents = this.getAffectedCells(this.parseCellKey(dirtyKey));
        for (const dep of dependents) {
          allDirtyKeys.add(this.cellKey(dep));
        }
      }

      const sortedCells = this.topologicalSort(allDirtyKeys);
      const totalCells = sortedCells.length;

      for (let iteration = 0; iteration < this.config.maxIterations; iteration++) {
        let maxChange = 0;
        iterationCount = iteration + 1;

        for (const cellKey of sortedCells) {
          const cell = this.parseCellKey(cellKey);
          const oldValue = getCellValue(cell);
          const newValue = evaluateFormula(cell);
          const change = Math.abs(newValue - oldValue);

          if (change > maxChange) {
            maxChange = change;
          }

          if (change > this.config.convergenceThreshold) {
            setCellValue(cell, newValue);
            processedCells.add(cellKey);
          }

          if (onProgress) {
            onProgress(processedCells.size, totalCells);
          }
        }

        if (maxChange <= this.config.convergenceThreshold) {
          break;
        }
      }

      this.dirtyCells.clear();

      return {
        dirtyCells: Array.from(allDirtyKeys).map((k) => this.parseCellKey(k)),
        affectedCells: Array.from(processedCells).map((k) => this.parseCellKey(k)),
        iterationCount,
      };
    } finally {
      this.isCalculating = false;
    }
  }

  private topologicalSort(cells: Set<string>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    const visiting = new Set<string>();

    const visit = (key: string) => {
      if (visited.has(key)) return;
      if (visiting.has(key)) return;

      visiting.add(key);

      const deps = this.dependencyGraph.get(key);
      if (deps) {
        for (const dep of Array.from(deps)) {
          if (cells.has(dep)) {
            visit(dep);
          }
        }
      }

      visiting.delete(key);
      visited.add(key);
      result.push(key);
    };

    for (const cell of Array.from(cells)) {
      visit(cell);
    }

    return result;
  }

  private processBatch(): void {
    this.batchQueue = [];
  }

  getDirtyCellCount(): number {
    return this.dirtyCells.size;
  }

  hasDirtyCells(): boolean {
    return this.dirtyCells.size > 0;
  }

  clearDirty(): void {
    this.dirtyCells.clear();
    this.batchQueue = [];
  }

  getDependencyCount(): number {
    return this.cellDependencies.size;
  }

  getDependents(cell: CellIdentifier): CellIdentifier[] {
    const key = this.cellKey(cell);
    const dependents = this.reverseDependencyGraph.get(key);
    if (!dependents) return [];
    return Array.from(dependents).map((k) => this.parseCellKey(k));
  }

  getDependencies(cell: CellIdentifier): CellIdentifier[] {
    const key = this.cellKey(cell);
    const deps = this.dependencyGraph.get(key);
    if (!deps) return [];
    return Array.from(deps).map((k) => this.parseCellKey(k));
  }

  removeCell(cell: CellIdentifier): void {
    const key = this.cellKey(cell);
    this.dirtyCells.delete(key);
    this.cellDependencies.delete(key);

    const deps = this.dependencyGraph.get(key);
    if (deps) {
      for (const dep of Array.from(deps)) {
        const reverseDeps = this.reverseDependencyGraph.get(dep);
        if (reverseDeps) {
          reverseDeps.delete(key);
        }
      }
    }
    this.dependencyGraph.delete(key);
    this.reverseDependencyGraph.delete(key);
  }

  reset(): void {
    this.dirtyCells.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.cellDependencies.clear();
    this.batchQueue = [];
    this.isCalculating = false;
  }
}
