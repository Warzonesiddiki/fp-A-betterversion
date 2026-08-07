/**
 * lookup.ext.test.ts — array/lookup formula functions, known-answer oracles
 * (MISSION D wave 2, 2026-08-07). Matrix algebra verified by hand.
 */
import { describe, expect, it } from 'vitest';
import {
  FILTER,
  HLOOKUP,
  INDEX,
  INDIRECT,
  MATCH,
  MDETERM,
  MINVERSE,
  MMULT,
  OFFSET,
  RANDARRAY,
  SEQUENCE,
  SORT,
  SORTBY,
  TRANSPOSE,
  UNIQUE,
  VLOOKUP,
  XLOOKUP,
  XMATCH,
} from './lookup';

describe('array helpers', () => {
  it('UNIQUE dedupes preserving first-seen order', () => {
    expect(UNIQUE([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
    expect(UNIQUE(5)).toEqual([5]);
  });
  it('SORT ascending', () => {
    expect(SORT([3, 1, 2])).toEqual([1, 2, 3]);
    expect(SORT(7)).toEqual([7]);
  });
  it('SORTBY sorts values by the by-array', () => {
    expect(SORTBY([3, 1, 2], [1, 3, 2])).toEqual([3, 2, 1]);
    expect(SORTBY([10, 20], [2, 1])).toEqual([20, 10]);
  });
  it('SEQUENCE arithmetic progression', () => {
    expect(SEQUENCE(3)).toEqual([1, 2, 3]);
    expect(SEQUENCE(2, 2, 5, 2)).toEqual([5, 7, 9, 11]);
    expect(SEQUENCE(2, 1, 10, -2)).toEqual([10, 8]);
  });
  it('RANDARRAY produces the right shape in [0,1)', () => {
    const r = RANDARRAY(2, 3);
    expect(r).toHaveLength(6);
    for (const x of r) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
  it('TRANSPOSE is identity for 1-D arrays', () => {
    expect(TRANSPOSE([1, 2, 3])).toEqual([1, 2, 3]);
  });
  it('FILTER keeps entries where include != 0', () => {
    expect(FILTER([10, 20, 30], [1, 0, 1])).toEqual([10, 30]);
    expect(FILTER([10, 20, 30], [0, 0, 0])).toEqual([]);
  });
});

describe('matrix algebra', () => {
  it('MMULT multiplies square matrices (flat row-major)', () => {
    // [1 2; 3 4] × [5 6; 7 8] = [19 22; 43 50]
    expect(MMULT([1, 2, 3, 4], [5, 6, 7, 8])).toEqual([19, 22, 43, 50]);
    // identity × vector
    expect(MMULT([1, 0, 0, 1], [4, 5, 6, 7])).toEqual([4, 5, 6, 7]);
  });
  it('MDETERM computes determinants', () => {
    expect(MDETERM([5])).toBe(5);
    expect(MDETERM([1, 2, 3, 4])).toBe(-2);
    // |2 -1 0; -1 2 -1; 0 -1 2| = 4
    expect(MDETERM([2, -1, 0, -1, 2, -1, 0, -1, 2])).toBe(4);
    // singular
    expect(MDETERM([1, 2, 2, 4])).toBe(0);
  });
  it('MINVERSE inverts 2x2 and 1x1', () => {
    // [4 7; 2 6]^-1 = 1/10 [6 -7; -2 4]
    const inv = MINVERSE([4, 7, 2, 6]);
    expect(inv[0]).toBeCloseTo(0.6, 6);
    expect(inv[1]).toBeCloseTo(-0.7, 6);
    expect(inv[2]).toBeCloseTo(-0.2, 6);
    expect(inv[3]).toBeCloseTo(0.4, 6);
    expect(MINVERSE([4])).toEqual([0.25]);
    // singular → zeros
    expect(MINVERSE([1, 2, 2, 4])).toEqual([0, 0, 0, 0]);
  });
  it('MINVERSE round-trips with MMULT to identity', () => {
    const m = [4, 7, 2, 6];
    const inv = MINVERSE(m);
    const prod = MMULT(m, inv);
    expect(prod[0]).toBeCloseTo(1, 6);
    expect(prod[1]).toBeCloseTo(0, 6);
    expect(prod[2]).toBeCloseTo(0, 6);
    expect(prod[3]).toBeCloseTo(1, 6);
  });
});

describe('index / lookup', () => {
  const table2d = [
    [1, 100, 1000],
    [2, 200, 2000],
    [3, 300, 3000],
  ];
  it('INDEX 2-D and 1-D', () => {
    expect(INDEX(table2d, 1, 2)).toBe(2000);
    expect(INDEX(table2d, 0)).toBe(1); // row 0, col 0
    expect(INDEX(table2d, 5, 0)).toBe(0); // out of range
    expect(INDEX([10, 20, 30], 2)).toBe(30);
    expect(INDEX([10, 20, 30], 9)).toBe(0);
  });
  it('MATCH / XMATCH return 1-based positions', () => {
    expect(MATCH(2, [1, 2, 3])).toBe(2);
    expect(MATCH(9, [1, 2, 3])).toBe(0);
    expect(XMATCH(3, [1, 2, 3])).toBe(3);
  });
  it('XLOOKUP returns the aligned return value', () => {
    expect(XLOOKUP(2, [1, 2, 3], [10, 20, 30])).toBe(20);
    expect(XLOOKUP(9, [1, 2, 3], [10, 20, 30])).toBe(0);
  });
  it('VLOOKUP searches the first column', () => {
    expect(VLOOKUP(2, table2d, 2)).toBe(2000);
    expect(VLOOKUP(2, table2d, 1)).toBe(200);
    expect(VLOOKUP(9, table2d, 1)).toBe(0);
    // 1-D fallback returns the matched element itself
    expect(VLOOKUP(2, [1, 2, 3], 0)).toBe(2);
  });
  it('HLOOKUP searches the first row', () => {
    // keys must live in row 0: [[1,2,3],[100,200,300],[1000,2000,3000]]
    const t = [
      [1, 2, 3],
      [100, 200, 300],
      [1000, 2000, 3000],
    ];
    expect(HLOOKUP(2, t, 2)).toBe(2000);
    expect(HLOOKUP(2, t, 1)).toBe(200);
    expect(HLOOKUP(9, t, 1)).toBe(0);
    expect(HLOOKUP(3, [1, 2, 3], 0)).toBe(3);
  });
  it('OFFSET indexes rows+cols into a flat base', () => {
    expect(OFFSET([10, 20, 30, 40], 1, 1)).toBe(30);
    expect(OFFSET([10, 20, 30, 40], 5, 0)).toBe(0);
    expect(OFFSET([10, 20, 30, 40], 0, -1)).toBe(0);
  });
  it('INDIRECT passes numbers through and rejects strings', () => {
    expect(INDIRECT(42)).toBe(42);
    expect(INDIRECT('A1')).toBe(0);
  });
});
