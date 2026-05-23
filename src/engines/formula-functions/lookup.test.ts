/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  UNIQUE,
  SORT,
  SORTBY,
  SEQUENCE,
  RANDARRAY,
  TRANSPOSE,
  MMULT,
  MDETERM,
  FILTER,
} from './lookup';

describe('Lookup & Array Functions', () => {
  describe('UNIQUE', () => {
    it('returns unique values from array', () => {
      expect(UNIQUE([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    it('handles single value', () => {
      expect(UNIQUE(42)).toEqual([42]);
    });

    it('returns empty for empty input', () => {
      expect(UNIQUE([])).toEqual([]);
    });
  });

  describe('SORT', () => {
    it('sorts numbers ascending', () => {
      expect(SORT([3, 1, 2])).toEqual([1, 2, 3]);
    });

    it('handles single value', () => {
      expect(SORT(42)).toEqual([42]);
    });
  });

  describe('SORTBY', () => {
    it('sorts values by another array', () => {
      expect(SORTBY([10, 20, 30], [3, 1, 2])).toEqual([20, 30, 10]);
    });
  });

  describe('SEQUENCE', () => {
    it('generates sequence of numbers', () => {
      expect(SEQUENCE(5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('generates with custom start and step', () => {
      expect(SEQUENCE(4, 1, 10, 5)).toEqual([10, 15, 20, 25]);
    });

    it('generates 2D sequence', () => {
      expect(SEQUENCE(2, 3)).toEqual([1, 2, 3, 4, 5, 6]);
    });
  });

  describe('RANDARRAY', () => {
    it('generates array of correct length', () => {
      const result = RANDARRAY(10);
      expect(result.length).toBe(10);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      });
    });
  });

  describe('TRANSPOSE', () => {
    it('handles non-array input', () => {
      expect(TRANSPOSE(42)).toEqual([42]);
    });
  });

  describe('MMULT', () => {
    it('multiplies scalars', () => {
      expect(MMULT(3, 4)).toEqual([12]);
    });
  });

  describe('MDETERM', () => {
    it('calculates determinant of scalar', () => {
      expect(MDETERM(5)).toBe(5);
    });
  });

  describe('FILTER', () => {
    it('filters values by condition', () => {
      expect(FILTER(1, 1)).toEqual([1]);
      expect(FILTER(1, 0)).toEqual([]);
    });
  });
});
