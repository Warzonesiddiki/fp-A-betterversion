/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { SUM, COUNT, AVERAGE, MEDIAN, STDEV, VARIANCE, MIN, MAX, MODE } from './statistical';

describe('Statistical Functions', () => {
  describe('SUM', () => {
    it('sums numbers', () => {
      expect(SUM(1, 2, 3, 4, 5)).toBe(15);
      expect(SUM(10, 20, 30)).toBe(60);
    });

    it('handles single value', () => {
      expect(SUM(42)).toBe(42);
    });

    it('handles empty input', () => {
      expect(SUM()).toBe(0);
    });
  });

  describe('COUNT', () => {
    it('counts numbers', () => {
      expect(COUNT(1, 2, 3, 4, 5)).toBe(5);
      expect(COUNT(10, 20)).toBe(2);
    });

    it('ignores non-numbers', () => {
      expect(COUNT(1, 'text', 3, null, 5)).toBe(3);
    });
  });

  describe('AVERAGE', () => {
    it('calculates average', () => {
      expect(AVERAGE(10, 20, 30)).toBe(20);
      expect(AVERAGE(1, 2, 3, 4, 5)).toBe(3);
    });

    it('handles single value', () => {
      expect(AVERAGE(42)).toBe(42);
    });
  });

  describe('MEDIAN', () => {
    it('finds median of odd count', () => {
      expect(MEDIAN(1, 3, 5)).toBe(3);
      expect(MEDIAN(1, 2, 3, 4, 5)).toBe(3);
    });

    it('finds median of even count', () => {
      expect(MEDIAN(1, 2, 3, 4)).toBeCloseTo(2.5, 1);
    });
  });

  describe('STDEV', () => {
    it('calculates standard deviation', () => {
      const result = STDEV(2, 4, 4, 4, 5, 5, 7, 9);
      expect(result).toBeCloseTo(2.0, 0);
    });

    it('returns 0 for identical values', () => {
      expect(STDEV(5, 5, 5, 5)).toBe(0);
    });
  });

  describe('VARIANCE', () => {
    it('calculates variance', () => {
      const result = VARIANCE(2, 4, 4, 4, 5, 5, 7, 9);
      expect(result).toBeCloseTo(4.57, 0);
    });
  });

  describe('MIN', () => {
    it('finds minimum', () => {
      expect(MIN(5, 3, 8, 1, 9)).toBe(1);
      expect(MIN(-5, 0, 5)).toBe(-5);
    });
  });

  describe('MAX', () => {
    it('finds maximum', () => {
      expect(MAX(5, 3, 8, 1, 9)).toBe(9);
      expect(MAX(-5, 0, 5)).toBe(5);
    });
  });

  describe('MODE', () => {
    it('finds mode', () => {
      expect(MODE(1, 2, 2, 3, 3, 3)).toBe(3);
      expect(MODE(1, 1, 2, 3)).toBe(1);
    });
  });
});
