/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import {
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
} from './logical';

describe('Logical Functions', () => {
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

    it('returns alt when error', () => {
      expect(IFERROR(NaN, 0)).toBe(0);
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
    });
  });

  describe('CHOOSE', () => {
    it('returns selected value', () => {
      expect(CHOOSE(1, 10, 20, 30)).toBe(20);
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
});
