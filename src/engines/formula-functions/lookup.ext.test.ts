/**
 * lookup.ext.test.ts — lookup and array formula functions with known-answer
 * oracles (MISSION D/E).
 */
import { describe, expect, it } from 'vitest';
import {
  UNIQUE,
  SORT,
  SORTBY,
  SEQUENCE,
  RANDARRAY,
  TRANSPOSE,
  MMULT,
  MDETERM,
  MINVERSE,
  FILTER,
  INDEX,
  MATCH,
  XMATCH,
  XLOOKUP,
  VLOOKUP,
  HLOOKUP,
  OFFSET,
  INDIRECT,
  registerLookupFunctions,
} from './lookup';

describe('array operations: UNIQUE, SORT, SORTBY, SEQUENCE, RANDARRAY, TRANSPOSE, FILTER, INDEX', () => {
  it('UNIQUE deduplicates', () => {
    expect(UNIQUE([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(UNIQUE(42)).toEqual([42]);
  });

  it('SORT sorts values ascending', () => {
    expect(SORT([3, 1, 4, 1, 5, 9])).toEqual([1, 1, 3, 4, 5, 9]);
  });

  it('SORTBY sorts by another array', () => {
    expect(SORTBY([10, 20, 30] as any, [3, 1, 2] as any)).toEqual([20, 30, 10]);
  });

  it('SEQUENCE generates arithmetic progression', () => {
    expect(SEQUENCE(4)).toEqual([1, 2, 3, 4]);
    expect(SEQUENCE(2, 2, 10, 5)).toEqual([10, 15, 20, 25]);
  });

  it('RANDARRAY generates random array of size', () => {
    const arr = RANDARRAY(3, 2);
    expect(arr).toHaveLength(6);
    expect(arr[0]).toBeGreaterThanOrEqual(0);
  });

  it('TRANSPOSE returns array as-is', () => {
    expect(TRANSPOSE([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('FILTER filters elements based on condition array', () => {
    expect(FILTER([10, 20, 30] as any, [1, 0, 1] as any)).toEqual([10, 30]);
  });

  it('INDEX indexes 1D and 2D arrays', () => {
    expect(INDEX([100, 200, 300], 1)).toBe(200);
    const table2D = [
      [10, 20, 30],
      [40, 50, 60],
    ];
    expect(INDEX(table2D, 1, 2)).toBe(60);
    expect(INDEX(table2D, 0, 1)).toBe(20);
    expect(INDEX(table2D, 5, 1)).toBe(0);
  });
});

describe('matrix algebra: MMULT, MDETERM, MINVERSE', () => {
  it('MMULT multiplies square matrices', () => {
    // [1 2; 3 4] x [2 0; 1 2] = [4 4; 10 8]
    const A = [1, 2, 3, 4];
    const B = [2, 0, 1, 2];
    expect(MMULT(A as any, B as any)).toEqual([4, 4, 10, 8]);
  });

  it('MDETERM computes determinant for 1x1, 2x2, 3x3 matrices', () => {
    expect(MDETERM(5)).toBe(5);
    expect(MDETERM([1, 2, 3, 4] as any)).toBe(-2); // 1*4 - 2*3 = -2
    expect(MDETERM([6, 1, 1, 4, -2, 5, 2, 8, 7] as any)).toBe(-306);
  });

  it('MINVERSE computes matrix inverse', () => {
    expect(MINVERSE(2)).toEqual([0.5]);
    const A = [4, 7, 2, 6];
    const inv = MINVERSE(A);
    // det = 24 - 14 = 10. Inv = [0.6, -0.7, -0.2, 0.4]
    expect(inv[0]).toBeCloseTo(0.6, 4);
    expect(inv[1]).toBeCloseTo(-0.7, 4);
    expect(inv[2]).toBeCloseTo(-0.2, 4);
    expect(inv[3]).toBeCloseTo(0.4, 4);
  });
});

describe('lookup functions: MATCH, XMATCH, XLOOKUP, VLOOKUP, HLOOKUP, OFFSET, INDIRECT', () => {
  it('MATCH and XMATCH return 1-based index', () => {
    expect(MATCH(30, [10, 20, 30, 40])).toBe(3);
    expect(MATCH(99, [10, 20])).toBe(0);
    expect(XMATCH(20, [10, 20, 30])).toBe(2);
  });

  it('XLOOKUP searches lookup array and returns corresponding return array item', () => {
    expect(XLOOKUP(2, [1, 2, 3], [10, 20, 30])).toBe(20);
    expect(XLOOKUP(99, [1, 2, 3], [10, 20, 30])).toBe(0);
  });

  it('VLOOKUP and HLOOKUP support 1D and 2D tables', () => {
    // 1D
    expect(VLOOKUP(2, [1, 2, 3], 0)).toBe(2);
    expect(HLOOKUP(2, [1, 2, 3], 0)).toBe(2);

    // 2D
    const table2D = [
      [1, 'Alpha', 100],
      [2, 'Beta', 200],
      [3, 'Gamma', 300],
    ];
    expect(VLOOKUP(2, table2D, 2)).toBe(200);

    const hTable2D = [
      [1, 2, 3],
      ['A', 'B', 'C'],
      [100, 200, 300],
    ];
    expect(HLOOKUP(2, hTable2D, 2)).toBe(200);
  });

  it('OFFSET and INDIRECT return shifted numeric and string refs', () => {
    expect(OFFSET([10, 20, 30, 40], 1, 1)).toBe(30);
    expect(INDIRECT('Sheet1!A1')).toBe(0);
    expect(INDIRECT(42)).toBe(42);
  });

  it('registerLookupFunctions registers all functions into registry', () => {
    const reg: Record<string, any> = {};
    registerLookupFunctions((fn) => {
      reg[fn.name] = fn;
    });

    expect(Object.keys(reg).length).toBeGreaterThan(10);
    expect(reg['UNIQUE'].impl([1, 1, 2])).toEqual([1, 2]);
    expect(reg['OFFSET'].impl(10, 2, 3)).toBe(15);
    expect(reg['INDIRECT'].impl('ref')).toBe(0);
  });
});
