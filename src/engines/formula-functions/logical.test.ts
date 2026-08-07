/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
  IFS,
  AND,
  OR,
  NOT,
  XOR,
  IFERROR,
  IFNA,
  SWITCH,
  CHOOSE,
  BETWEEN,
  CLAMP,
  COALESCE,
  ISBLANK,
  ISERR,
  ISERROR,
  ISEVEN,
  ISODD,
  ISLOGICAL,
  ISNA,
  ISNONTEXT,
  ISNUMBER,
  ISTEXT,
  ISREF,
  TYPE,
  NA,
  ERROR_TYPE,
  SHEET,
  SHEETS,
  registerLogicalFunctions,
} from './logical';

describe('Logical Functions', () => {
  describe('IFS', () => {
    it('returns true branch when non-zero, false branch when zero', () => {
      expect(IFS(1, 100, 200)).toBe(100);
      expect(IFS(0, 100, 200)).toBe(200);
    });
  });

  describe('AND', () => {
    it('returns 1 when all true', () => {
      expect(AND(1, 1, 1)).toBe(1);
    });

    it('returns 0 when any false', () => {
      expect(AND(1, 0, 1)).toBe(0);
    });
  });

  describe('OR', () => {
    it('returns 1 when any true', () => {
      expect(OR(0, 1, 0)).toBe(1);
    });

    it('returns 0 when all false', () => {
      expect(OR(0, 0, 0)).toBe(0);
    });
  });

  describe('NOT', () => {
    it('inverts value', () => {
      expect(NOT(1)).toBe(0);
      expect(NOT(0)).toBe(1);
    });
  });

  describe('XOR', () => {
    it('returns 1 when odd number of true', () => {
      expect(XOR(1, 0, 0)).toBe(1);
      expect(XOR(1, 1, 0)).toBe(0);
    });
  });

  describe('IFERROR', () => {
    it('returns value when no error', () => {
      expect(IFERROR(42, 0)).toBe(42);
    });

    it('returns alt when error or non-finite', () => {
      expect(IFERROR(NaN, 0)).toBe(0);
      expect(IFERROR(Infinity, 99)).toBe(99);
    });
  });

  describe('IFNA', () => {
    it('returns value when not NA', () => {
      expect(IFNA(42, 0)).toBe(42);
    });

    it('returns alt when NA', () => {
      expect(IFNA(NaN, 0)).toBe(0);
    });
  });

  describe('SWITCH', () => {
    it('returns matching value', () => {
      expect(SWITCH(2, 1, 10, 2, 20, 3, 30)).toBe(20);
    });

    it('returns default when no match', () => {
      expect(SWITCH(5, 1, 10, 2, 20, 99)).toBe(99);
      expect(SWITCH(5, 1, 10)).toBe(0);
    });
  });

  describe('CHOOSE', () => {
    it('returns selected value by index and handles boundary', () => {
      expect(CHOOSE(1, 10, 20, 30)).toBe(20);
      expect(CHOOSE(-1, 10, 20)).toBe(0);
      expect(CHOOSE(10, 10, 20)).toBe(0);
    });
  });

  describe('BETWEEN', () => {
    it('returns 1 when in range', () => {
      expect(BETWEEN(5, 1, 10)).toBe(1);
    });

    it('returns 0 when out of range', () => {
      expect(BETWEEN(15, 1, 10)).toBe(0);
    });
  });

  describe('CLAMP', () => {
    it('clamps to range', () => {
      expect(CLAMP(5, 1, 10)).toBe(5);
      expect(CLAMP(-5, 1, 10)).toBe(1);
      expect(CLAMP(15, 1, 10)).toBe(10);
    });
  });

  describe('COALESCE', () => {
    it('returns first non-zero value', () => {
      expect(COALESCE(0, 0, 5, 10)).toBe(5);
    });

    it('returns last when all zero', () => {
      expect(COALESCE(0, 0, 0)).toBe(0);
    });
  });

  describe('Information Functions: ISBLANK, ISERR, ISERROR, ISEVEN, ISODD, ISLOGICAL, ISNA, ISNONTEXT, ISNUMBER, ISTEXT, ISREF, TYPE, NA, ERROR_TYPE, SHEET, SHEETS', () => {
    it('evaluates type and error checkers accurately', () => {
      expect(ISBLANK(0)).toBe(1);
      expect(ISBLANK(5)).toBe(0);

      expect(ISERR(42)).toBe(1);
      expect(ISERR(NaN)).toBe(0);

      expect(ISERROR(NaN)).toBe(1);
      expect(ISERROR(Infinity)).toBe(1);
      expect(ISERROR(42)).toBe(0);

      expect(ISEVEN(4)).toBe(1);
      expect(ISEVEN(5)).toBe(0);
      expect(ISODD(5)).toBe(1);
      expect(ISODD(4)).toBe(0);

      expect(ISLOGICAL(1)).toBe(1);
      expect(ISLOGICAL(0)).toBe(1);
      expect(ISLOGICAL(5)).toBe(0);

      expect(ISNA(NaN)).toBe(1);
      expect(ISNA(42)).toBe(0);

      expect(ISNONTEXT(100)).toBe(1);
      expect(ISNUMBER(100)).toBe(1);
      expect(ISNUMBER(NaN)).toBe(0);
      expect(ISTEXT(100)).toBe(0);
      expect(ISREF(100)).toBe(1);

      expect(TYPE([1, 2])).toBe(64);
      expect(TYPE(NaN)).toBe(16);
      expect(TYPE(42)).toBe(1);

      expect(NA()).toBeNaN();
      expect(ERROR_TYPE(NaN)).toBe(7);
      expect(ERROR_TYPE(Infinity)).toBe(2);
      expect(ERROR_TYPE(0)).toBe(0);

      expect(SHEET()).toBe(1);
      expect(SHEETS()).toBe(1);
    });
  });

  describe('registerLogicalFunctions', () => {
    it('registers all logical and information functions with registry', () => {
      const registered: Record<string, any> = {};
      registerLogicalFunctions((fn) => {
        registered[fn.name] = fn;
      });

      expect(registered['IF'].impl(1, 10, 20)).toBe(10);
      expect(registered['IF'].impl(0, 10, 20)).toBe(20);
      expect(registered['TRUE'].impl()).toBe(1);
      expect(registered['FALSE'].impl()).toBe(0);
      expect(registered['LET'].impl(1, 2, 3)).toBe(3);
    });
  });
});
