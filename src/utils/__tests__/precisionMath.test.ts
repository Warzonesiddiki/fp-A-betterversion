/**
 * Precision Math Utility — Tests
 *
 * Verifies that all financial arithmetic eliminates floating-point drift.
 */

import { describe, it, expect } from 'vitest';
import {
  toPrecise,
  fromPrecise,
  formatPrecise,
  parsePrecise,
  preciseAdd,
  preciseSub,
  preciseMul,
  preciseDiv,
  precisePercent,
  preciseSum,
  preciseAvg,
  preciseMin,
  preciseMax,
  preciseCompare,
  preciseRound,
  preciseFXTranslate,
} from '../precisionMath';

describe('precisionMath', () => {
  describe('toPrecise / fromPrecise round-trip', () => {
    it('converts 1234.5678 to integer and back', () => {
      const precise = toPrecise(1234.5678);
      expect(fromPrecise(precise)).toBeCloseTo(1234.5678, 4);
    });

    it('handles zero', () => {
      expect(toPrecise(0)).toBe(0n);
      expect(fromPrecise(0n)).toBe(0);
    });

    it('handles negative values', () => {
      const precise = toPrecise(-999.99);
      expect(fromPrecise(precise)).toBeCloseTo(-999.99, 4);
    });

    it('handles very small values', () => {
      const precise = toPrecise(0.0001);
      expect(fromPrecise(precise)).toBeCloseTo(0.0001, 4);
    });

    it('handles Infinity as 0n', () => {
      expect(toPrecise(Infinity)).toBe(0n);
      expect(toPrecise(-Infinity)).toBe(0n);
      expect(toPrecise(NaN)).toBe(0n);
    });
  });

  describe('floating-point drift elimination', () => {
    it('0.1 + 0.2 === 0.3 (the classic JS problem)', () => {
      const a = toPrecise(0.1);
      const b = toPrecise(0.2);
      const c = toPrecise(0.3);
      const sum = preciseAdd(a, b);
      expect(sum.value).toBe(c);
    });

    it('1000000.01 + 0.02 === 1000000.03', () => {
      const a = toPrecise(1000000.01);
      const b = toPrecise(0.02);
      const expected = toPrecise(1000000.03);
      const sum = preciseAdd(a, b);
      expect(sum.value).toBe(expected);
    });
  });

  describe('arithmetic operations', () => {
    const a = toPrecise(100);
    const b = toPrecise(50);

    it('adds correctly', () => {
      const result = preciseAdd(a, b);
      expect(fromPrecise(result.value)).toBeCloseTo(150, 4);
      expect(result.rounded).toBe(false);
    });

    it('subtracts correctly', () => {
      const result = preciseSub(a, b);
      expect(fromPrecise(result.value)).toBeCloseTo(50, 4);
    });

    it('multiplies correctly', () => {
      // 100 * 50 = 5000, but in precise form: 1000000n * 500000n / 10000 = 50000000n
      const result = preciseMul(a, b);
      expect(fromPrecise(result.value)).toBeCloseTo(5000, 2);
    });

    it('divides correctly', () => {
      const result = preciseDiv(a, b);
      expect(fromPrecise(result.value)).toBeCloseTo(2, 4);
    });

    it('handles division by zero', () => {
      const result = preciseDiv(a, 0n);
      expect(result.value).toBe(0n);
    });
  });

  describe('percentage calculation', () => {
    it('calculates 25% of 100 correctly', () => {
      const part = toPrecise(25);
      const total = toPrecise(100);
      const result = precisePercent(part, total);
      expect(fromPrecise(result.value)).toBeCloseTo(25, 2);
    });

    it('handles zero total', () => {
      const result = precisePercent(toPrecise(50), 0n);
      expect(result.value).toBe(0n);
    });
  });

  describe('aggregation', () => {
    const values = [toPrecise(10), toPrecise(20), toPrecise(30)];

    it('sums correctly', () => {
      const sum = preciseSum(values);
      expect(fromPrecise(sum)).toBeCloseTo(60, 4);
    });

    it('averages correctly', () => {
      const avg = preciseAvg(values);
      expect(fromPrecise(avg.value)).toBeCloseTo(20, 2);
    });

    it('finds min', () => {
      expect(fromPrecise(preciseMin(values))).toBeCloseTo(10, 4);
    });

    it('finds max', () => {
      expect(fromPrecise(preciseMax(values))).toBeCloseTo(30, 4);
    });

    it('handles empty array', () => {
      expect(preciseSum([])).toBe(0n);
      expect(preciseAvg([]).value).toBe(0n);
      expect(preciseMin([])).toBe(0n);
      expect(preciseMax([])).toBe(0n);
    });
  });

  describe('comparison', () => {
    it('compares equal values', () => {
      expect(preciseCompare(toPrecise(100), toPrecise(100))).toBe(0);
    });

    it('compares less than', () => {
      expect(preciseCompare(toPrecise(50), toPrecise(100))).toBe(-1);
    });

    it('compares greater than', () => {
      expect(preciseCompare(toPrecise(100), toPrecise(50))).toBe(1);
    });
  });

  describe('FX translation', () => {
    it('translates $100 at 1.2 EUR/USD = €120', () => {
      const amount = toPrecise(100);
      const rateNum = toPrecise(1.2);
      const rateDenom = toPrecise(1);
      const result = preciseFXTranslate(amount, rateNum, rateDenom);
      expect(fromPrecise(result.value)).toBeCloseTo(120, 2);
    });
  });

  describe('formatting and parsing', () => {
    it('formats with commas', () => {
      expect(formatPrecise(toPrecise(1234.56))).toBe('1,234.56');
    });

    it('parses currency string', () => {
      const result = parsePrecise('$1,234.56');
      expect(fromPrecise(result)).toBeCloseTo(1234.56, 2);
    });
  });

  describe('rounding', () => {
    it('rounds to 2 decimal places', () => {
      const value = toPrecise(123.4567);
      const rounded = preciseRound(value, 2);
      expect(fromPrecise(rounded)).toBeCloseTo(123.46, 2);
    });

    it('uses banker rounding', () => {
      // 2.5 rounds to 2 (even) not 3
      const value = toPrecise(2.5);
      const rounded = preciseRound(value, 0);
      expect(fromPrecise(rounded)).toBeCloseTo(2, 0);
    });
  });
});
