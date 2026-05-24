import { describe, it, expect } from 'vitest';
import { shallowEqual, createSelector } from '../memoization';

describe('memoization', () => {
  describe('shallowEqual', () => {
    it('returns true for identical references', () => {
      const obj = { a: 1 };
      expect(shallowEqual(obj, obj)).toBe(true);
    });

    it('returns true for shallow equal objects', () => {
      expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    });

    it('returns false for different objects', () => {
      expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('returns false for different key lengths', () => {
      expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('handles null', () => {
      expect(shallowEqual(null, null)).toBe(true);
    });

    it('handles null vs object', () => {
      expect(shallowEqual(null, {})).toBe(false);
    });

    it('handles non-objects', () => {
      expect(shallowEqual(1, 2)).toBe(false);
    });
  });

  describe('createSelector', () => {
    it('memoizes based on state', () => {
      const selector = createSelector((state: { a: number }) => state.a);
      const state1 = { a: 1 };
      const state2 = { a: 2 };

      expect(selector(state1)).toBe(1);
      expect(selector(state1)).toBe(1); // cached
      expect(selector(state2)).toBe(2);
    });
  });
});
