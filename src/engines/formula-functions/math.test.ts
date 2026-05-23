/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { ROUND, ROUNDUP, ROUNDDOWN, MOD, POWER, SQRT, CEILING, FLOOR, GCD, LCM } from './math';
import { ABS } from './statistical';

describe('Math Functions', () => {
  describe('ROUND', () => {
    it('rounds to nearest integer', () => {
      expect(ROUND(3.5)).toBe(4);
      expect(ROUND(3.4)).toBe(3);
      expect(ROUND(-3.5)).toBe(-3);
    });

    it('rounds to specified decimals', () => {
      expect(ROUND(3.456, 2)).toBeCloseTo(3.46, 2);
      expect(ROUND(3.456, 1)).toBeCloseTo(3.5, 1);
    });
  });

  describe('ROUNDUP', () => {
    it('always rounds up', () => {
      expect(ROUNDUP(3.1)).toBe(4);
      expect(ROUNDUP(3.9)).toBe(4);
      expect(ROUNDUP(-3.1)).toBe(-3);
    });
  });

  describe('ROUNDDOWN', () => {
    it('always rounds down', () => {
      expect(ROUNDDOWN(3.9)).toBe(3);
      expect(ROUNDDOWN(3.1)).toBe(3);
      expect(ROUNDDOWN(-3.9)).toBe(-4);
    });
  });

  describe('MOD', () => {
    it('calculates modulo', () => {
      expect(MOD(10, 3)).toBe(1);
      expect(MOD(10, 2)).toBe(0);
      expect(MOD(7, 4)).toBe(3);
    });
  });

  describe('POWER', () => {
    it('calculates power', () => {
      expect(POWER(2, 3)).toBe(8);
      expect(POWER(10, 2)).toBe(100);
      expect(POWER(5, 0)).toBe(1);
    });
  });

  describe('SQRT', () => {
    it('calculates square root', () => {
      expect(SQRT(9)).toBe(3);
      expect(SQRT(16)).toBe(4);
      expect(SQRT(2)).toBeCloseTo(1.414, 2);
    });
  });

  describe('ABS', () => {
    it('calculates absolute value', () => {
      expect(ABS(5)).toBe(5);
      expect(ABS(-5)).toBe(5);
      expect(ABS(0)).toBe(0);
    });
  });

  describe('CEILING', () => {
    it('rounds up to significance', () => {
      expect(CEILING(3.2, 1)).toBe(4);
      expect(CEILING(3.2, 0.5)).toBeCloseTo(3.5, 1);
    });
  });

  describe('FLOOR', () => {
    it('rounds down to significance', () => {
      expect(FLOOR(3.8, 1)).toBe(3);
      expect(FLOOR(3.8, 0.5)).toBeCloseTo(3.5, 1);
    });
  });

  describe('GCD', () => {
    it('calculates greatest common divisor', () => {
      expect(GCD(12, 8)).toBe(4);
      expect(GCD(15, 10)).toBe(5);
      expect(GCD(7, 3)).toBe(1);
    });
  });

  describe('LCM', () => {
    it('calculates least common multiple', () => {
      expect(LCM(4, 6)).toBe(12);
      expect(LCM(3, 5)).toBe(15);
    });
  });
});
