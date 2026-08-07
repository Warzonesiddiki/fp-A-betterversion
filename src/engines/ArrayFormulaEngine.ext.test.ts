/**
 * ArrayFormulaEngine.ext.test.ts — array-formula dispatch with known answers
 * (MISSION D wave 2, 2026-08-07).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ArrayFormulaEngine } from './ArrayFormulaEngine';

describe('ArrayFormulaEngine — dispatch', () => {
  beforeEach(() => ArrayFormulaEngine.reset());

  it('MMULT multiplies matrices', () => {
    const r = ArrayFormulaEngine.evaluate(
      'MMULT(A1:B2,C1:D2)',
      [
        [1, 2],
        [3, 4],
      ],
      2,
      2
    );
    // [1 2; 3 4] × [1 2; 3 4] = [7 10; 15 22]
    expect(r.values).toEqual([
      [7, 10],
      [15, 22],
    ]);
    expect(r.rows).toBe(2);
    expect(r.cols).toBe(2);
  });

  it('TRANSPOSE swaps rows/columns', () => {
    const r = ArrayFormulaEngine.evaluate(
      'TRANSPOSE(A1:C2)',
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      3,
      2
    );
    expect(r.values).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
    expect(r.rows).toBe(3);
    expect(r.cols).toBe(2);
  });

  it('SUMPRODUCT sums pairwise products', () => {
    const r = ArrayFormulaEngine.evaluate(
      'SUMPRODUCT(A1:C1,A2:C2)',
      [
        [1, 2, 3],
        [4, 5, 6],
      ],
      1,
      1
    );
    expect(r.values).toEqual([[32]]);
    // fewer than 2 rows → 0
    const r2 = ArrayFormulaEngine.evaluate('SUMPRODUCT(A1:B1)', [[1, 2]], 1, 1);
    expect(r2.values).toEqual([[0]]);
  });

  it('FILTER returns the array (condition parsing deferred)', () => {
    const data = [
      [1, 2],
      [3, 4],
    ];
    const r = ArrayFormulaEngine.evaluate('FILTER(a>1)', data, 2, 2);
    expect(r.values).toEqual(data);
    expect(r.rows).toBe(2);
    expect(r.cols).toBe(2);
  });

  it('SORT sorts rows by first column', () => {
    const r = ArrayFormulaEngine.evaluate(
      'SORT(A1:B3)',
      [
        [3, 30],
        [1, 10],
        [2, 20],
      ],
      3,
      2
    );
    expect(r.values).toEqual([
      [1, 10],
      [2, 20],
      [3, 30],
    ]);
  });

  it('UNIQUE dedupes identical rows', () => {
    const r = ArrayFormulaEngine.evaluate(
      'UNIQUE(A1:B3)',
      [
        [1, 2],
        [3, 4],
        [1, 2],
      ],
      3,
      2
    );
    expect(r.values).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(r.rows).toBe(2);
  });

  it('default path copies the window cell-by-cell with null padding', () => {
    const r = ArrayFormulaEngine.evaluate(
      'SUM',
      [
        [1, 2],
        [3, 4],
      ],
      3,
      2
    );
    expect(r.values).toEqual([
      [1, 2],
      [3, 4],
      [null, null],
    ]);
    expect(r.rows).toBe(3);
    expect(r.cols).toBe(2);
  });
});

describe('ArrayFormulaEngine — registration lifecycle', () => {
  beforeEach(() => ArrayFormulaEngine.reset());

  it('register stores and getFormulas lists', () => {
    const id = ArrayFormulaEngine.register({
      formula: 'MMULT(A1:B2, C1:D2)',
      outputRange: { startRow: 0, startCol: 0, endRow: 1, endCol: 1 },
      inputRange: { startRow: 0, startCol: 0, endRow: 1, endCol: 1 },
      spill: true,
    });
    expect(id).toMatch(/^arr_/);
    const formulas = ArrayFormulaEngine.getFormulas();
    expect(formulas).toHaveLength(1);
    expect(formulas[0]!.id).toBe(id);
    expect(formulas[0]!.spill).toBe(true);
  });

  it('reset clears formulas', () => {
    ArrayFormulaEngine.register({
      formula: 'SORT(A1:B3)',
      outputRange: { startRow: 0, startCol: 0, endRow: 2, endCol: 1 },
      inputRange: { startRow: 0, startCol: 0, endRow: 2, endCol: 1 },
      spill: false,
    });
    expect(ArrayFormulaEngine.getFormulas()).toHaveLength(1);
    ArrayFormulaEngine.reset();
    expect(ArrayFormulaEngine.getFormulas()).toHaveLength(0);
  });
});
