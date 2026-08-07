/**
 * IncrementalCalcEngine.ext.test.ts — dependency graph, dirty propagation,
 * convergence, batching (MISSION D wave 2, 2026-08-07).
 */
import { describe, expect, it } from 'vitest';
import { IncrementalCalcEngine, type CellIdentifier } from './IncrementalCalcEngine';

const A1: CellIdentifier = { sheet: 'S', col: 'A', row: 1 };
const B1: CellIdentifier = { sheet: 'S', col: 'B', row: 1 };
const C1: CellIdentifier = { sheet: 'S', col: 'C', row: 1 };

describe('IncrementalCalcEngine — dirty tracking', () => {
  it('markDirty / markRangeDirty / getDirtyCellCount / hasDirtyCells / clearDirty', () => {
    const e = new IncrementalCalcEngine({ enableBatching: false });
    expect(e.hasDirtyCells()).toBe(false);
    e.markDirty(A1);
    e.markDirty(A1); // dedupe
    expect(e.getDirtyCellCount()).toBe(1);
    e.markRangeDirty([B1, C1]);
    expect(e.getDirtyCellCount()).toBe(3);
    e.clearDirty();
    expect(e.hasDirtyCells()).toBe(false);
  });

  it('batch mode auto-flushes the queue at batchSize', () => {
    const e = new IncrementalCalcEngine({ enableBatching: true, batchSize: 2 });
    e.markDirty(A1);
    e.markDirty(B1);
    // queue processed at size 2 — dirty set still holds both
    expect(e.getDirtyCellCount()).toBe(2);
    e.markDirty(C1);
    expect(e.getDirtyCellCount()).toBe(3);
  });
});

describe('IncrementalCalcEngine — dependency propagation', () => {
  it('getAffectedCells walks the reverse graph transitively', () => {
    const e = new IncrementalCalcEngine();
    e.setDependencies(A1, []); // A1 is an input
    e.setDependencies(B1, [A1]); // B1 = f(A1)
    e.setDependencies(C1, [B1]); // C1 = f(B1)
    const affected = e.getAffectedCells(A1);
    expect(affected.map((c) => c.col).sort()).toEqual(['B', 'C']);
  });

  it('getAffectedCells excludes the dirty cell itself', () => {
    const e = new IncrementalCalcEngine();
    e.setDependencies(B1, [A1]);
    expect(e.getAffectedCells(A1).map((c) => c.col)).toEqual(['B']);
    expect(e.getAffectedCells(C1)).toEqual([]); // no dependents
  });
});

describe('IncrementalCalcEngine — calculateIncremental', () => {
  it('recalculates dirty cells and their dependents until convergence', () => {
    const e = new IncrementalCalcEngine({ enableBatching: false });
    e.setDependencies(A1, []);
    e.setDependencies(B1, [A1]);

    const values = new Map<string, number>([
      ['S!A1', 2],
      ['S!B1', 4],
    ]);
    const key = (c: CellIdentifier): string => `${c.sheet}!${c.col}${c.row}`;
    const get = (c: CellIdentifier): number => values.get(key(c)) ?? 0;
    const set = (c: CellIdentifier, v: number): void => {
      values.set(key(c), v);
    };
    // B1 = A1 * 3
    const evaluate = (c: CellIdentifier): number => {
      if (c.row === 1 && c.col === 'B') return values.get(key(A1))! * 3;
      return values.get(key(c)) ?? 0;
    };

    e.markDirty(A1);
    const result = e.calculateIncremental(get, set, evaluate);
    expect(values.get('S!B1')).toBe(6); // dependent recalculated
    // dirtyCells = input + transitively-affected cells; affectedCells = the
    // ones whose value actually changed (A unchanged, B recomputed)
    expect(result.dirtyCells.map((c) => c.col).sort()).toEqual(['A', 'B']);
    expect(result.affectedCells.map((c) => c.col).sort()).toEqual(['B']);
    // second pass confirms stability (maxChange ≤ threshold) before breaking
    expect(result.iterationCount).toBe(2);
    expect(e.hasDirtyCells()).toBe(false); // cleared after calc
  });

  it('throws when a calculation is already in progress', () => {
    const e = new IncrementalCalcEngine({ enableBatching: false });
    e.setDependencies(A1, []);
    // simulate in-progress via a re-entrant evaluate
    let entered = false;
    const evaluate = (_c: CellIdentifier): number => {
      if (!entered) {
        entered = true;
        e.markDirty(B1);
        // nested calculation attempt → throws
        e.calculateIncremental(
          () => 0,
          () => undefined,
          () => 0
        );
      }
      return 1;
    };
    e.markDirty(A1);
    expect(() =>
      e.calculateIncremental(
        () => 0,
        () => undefined,
        evaluate
      )
    ).toThrow('Calculation already in progress');
  });

  it('propagates progress callbacks', () => {
    const e = new IncrementalCalcEngine({ enableBatching: false });
    e.setDependencies(A1, []);
    e.setDependencies(B1, [A1]);
    e.markDirty(A1);
    const progress: [number, number][] = [];
    e.calculateIncremental(
      () => 0,
      () => undefined,
      () => 0,
      (p, t) => progress.push([p, t])
    );
    expect(progress.length).toBeGreaterThan(0);
    expect(progress[progress.length - 1]![1]).toBe(2); // total = sorted cells
  });
});
