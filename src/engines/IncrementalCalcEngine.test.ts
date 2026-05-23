import { describe, it, expect, beforeEach } from 'vitest';
import { IncrementalCalcEngine, type CellIdentifier } from './IncrementalCalcEngine';

describe('IncrementalCalcEngine', () => {
  let engine: IncrementalCalcEngine;

  beforeEach(() => {
    engine = new IncrementalCalcEngine();
  });

  it('should initialize with default config', () => {
    expect(engine).toBeDefined();
    expect(engine.getDirtyCellCount()).toBe(0);
    expect(engine.hasDirtyCells()).toBe(false);
  });

  it('should initialize with custom config', () => {
    const custom = new IncrementalCalcEngine({ maxIterations: 50, batchSize: 500 });
    expect(custom).toBeDefined();
  });

  it('should mark cells dirty', () => {
    const cell: CellIdentifier = { sheet: 'Sheet1', col: 'A', row: 1 };
    engine.markDirty(cell);
    expect(engine.getDirtyCellCount()).toBe(1);
    expect(engine.hasDirtyCells()).toBe(true);
  });

  it('should mark range dirty', () => {
    const cells: CellIdentifier[] = [
      { sheet: 'Sheet1', col: 'A', row: 1 },
      { sheet: 'Sheet1', col: 'A', row: 2 },
      { sheet: 'Sheet1', col: 'B', row: 1 },
    ];
    engine.markRangeDirty(cells);
    expect(engine.getDirtyCellCount()).toBe(3);
  });

  it('should set dependencies', () => {
    const cell: CellIdentifier = { sheet: 'Sheet1', col: 'C', row: 1 };
    const deps: CellIdentifier[] = [
      { sheet: 'Sheet1', col: 'A', row: 1 },
      { sheet: 'Sheet1', col: 'B', row: 1 },
    ];
    engine.setDependencies(cell, deps);
    expect(engine.getDependencyCount()).toBe(1);
  });

  it('should get affected cells', () => {
    const cellA: CellIdentifier = { sheet: 'Sheet1', col: 'A', row: 1 };
    const cellB: CellIdentifier = { sheet: 'Sheet1', col: 'B', row: 1 };
    const cellC: CellIdentifier = { sheet: 'Sheet1', col: 'C', row: 1 };

    engine.setDependencies(cellC, [cellA, cellB]);
    const affected = engine.getAffectedCells(cellA);
    expect(affected).toContainEqual(cellC);
  });

  it('should clear dirty cells', () => {
    engine.markDirty({ sheet: 'Sheet1', col: 'A', row: 1 });
    engine.markDirty({ sheet: 'Sheet1', col: 'B', row: 1 });
    engine.clearDirty();
    expect(engine.getDirtyCellCount()).toBe(0);
    expect(engine.hasDirtyCells()).toBe(false);
  });

  it('should get dependents', () => {
    const cellA: CellIdentifier = { sheet: 'Sheet1', col: 'A', row: 1 };
    const cellB: CellIdentifier = { sheet: 'Sheet1', col: 'B', row: 1 };
    engine.setDependencies(cellB, [cellA]);
    const dependents = engine.getDependents(cellA);
    expect(dependents).toContainEqual(cellB);
  });

  it('should get dependencies', () => {
    const cellA: CellIdentifier = { sheet: 'Sheet1', col: 'A', row: 1 };
    const cellB: CellIdentifier = { sheet: 'Sheet1', col: 'B', row: 1 };
    engine.setDependencies(cellB, [cellA]);
    const deps = engine.getDependencies(cellB);
    expect(deps).toContainEqual(cellA);
  });

  it('should reset engine state', () => {
    engine.markDirty({ sheet: 'Sheet1', col: 'A', row: 1 });
    engine.setDependencies({ sheet: 'Sheet1', col: 'B', row: 1 }, [
      { sheet: 'Sheet1', col: 'A', row: 1 },
    ]);
    engine.reset();
    expect(engine.getDirtyCellCount()).toBe(0);
    expect(engine.getDependencyCount()).toBe(0);
  });
});
