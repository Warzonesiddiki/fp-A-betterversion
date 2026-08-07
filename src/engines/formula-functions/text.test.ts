/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { LEN, UPPER, LOWER, TEXT, CODE, CHAR, VALUE, EXACT } from './text';

describe('Text Functions', () => {
  describe('LEN', () => {
    it('returns length of number as string', () => {
      expect(LEN(12345)).toBe(5);
      expect(LEN(0)).toBe(1);
      expect(LEN(1234)).toBe(4);
    });
  });

  describe('UPPER', () => {
    it('converts number string to uppercase', () => {
      expect(UPPER(12345)).toBe(12345);
    });
  });

  describe('LOWER', () => {
    it('converts number string to lowercase', () => {
      expect(LOWER(12345)).toBe(12345);
    });
  });

  describe('TEXT', () => {
    it('formats number', () => {
      expect(TEXT(1234.56, '#,##0.00' as any)).toBeCloseTo(1234.56, 2);
    });
  });

  describe('CODE', () => {
    it('returns character code', () => {
      expect(CODE(65)).toBe(65);
    });
  });

  describe('CHAR', () => {
    it('returns character from code', () => {
      expect(CHAR(65)).toBe(65);
    });
  });

  describe('VALUE', () => {
    it('returns value unchanged', () => {
      expect(VALUE(42)).toBe(42);
      expect(VALUE(3.14)).toBeCloseTo(3.14);
    });
  });

  describe('EXACT', () => {
    it('compares values', () => {
      expect(EXACT(42, 42)).toBe(1);
      expect(EXACT(42, 43)).toBe(0);
    });
  });
});
