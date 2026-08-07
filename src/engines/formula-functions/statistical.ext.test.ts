/**
 * statistical.ext.test.ts — additional statistical functions, known-answer
 * oracles (MISSION D wave 2, 2026-08-07). Values verified by hand/standard
 * statistical definitions.
 */
import { describe, expect, it } from 'vitest';
import {
  AVEDEV,
  CORREL,
  COVAR,
  DEVSQ,
  FORECAST,
  GEOMEAN,
  HARMEAN,
  INTERCEPT,
  KURT,
  MODE,
  PEARSON,
  PERCENTRANK,
  QUARTILE,
  RSQ,
  SKEW,
  SLOPE,
  STDEVP,
  TRIMMEAN,
  VARP,
} from './statistical';

describe('correlation & covariance', () => {
  it('CORREL of perfectly correlated series is ±1', () => {
    expect(CORREL([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
    expect(CORREL([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1, 6);
    expect(CORREL([1, 2], [1, 2])).toBeCloseTo(1, 6);
    expect(CORREL([1], [1])).toBe(0); // fewer than 2 pairs
    expect(CORREL([1, 2, 3], [1, 2, NaN])).toBeCloseTo(1, 6);
  });
  it('COVAR is the population covariance', () => {
    // x=[1,2,3] y=[2,4,6]: means 2,4; Σdx·dy = 2+0+2 = 4; /3
    expect(COVAR([1, 2, 3], [2, 4, 6])).toBeCloseTo(4 / 3, 6);
    expect(COVAR([1, 2, 3], [1, 2, 3])).toBeCloseTo(2 / 3, 6);
  });
});

describe('descriptive statistics', () => {
  it('MODE returns the most frequent value', () => {
    expect(MODE([1, 2, 2, 3])).toBe(2);
    expect(MODE([])).toBe(0);
  });
  it('PERCENTRANK counts strictly-less values over n-1', () => {
    expect(PERCENTRANK([1, 2, 3, 4], 3)).toBeCloseTo(2 / 3, 6);
    expect(PERCENTRANK([1, 2, 3, 4], 0)).toBe(0);
    expect(PERCENTRANK([1, 2, 3, 4], 4)).toBeCloseTo(1, 6);
    expect(PERCENTRANK([5], 5)).toBe(0); // fewer than 2 values
  });
  it('QUARTILE maps to PERCENTILE(25·q)', () => {
    expect(QUARTILE([1, 2, 3, 4], 1)).toBeCloseTo(1.75, 6);
    expect(QUARTILE([1, 2, 3, 4], 2)).toBeCloseTo(2.5, 6);
  });
  it('STDEVP / VARP are population statistics', () => {
    // μ=5; Σ(x-μ)²=32; /8 = 4 → σ=2
    expect(STDEVP([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2, 6);
    expect(VARP([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(4, 6);
    expect(STDEVP([])).toBe(0);
    expect(VARP([])).toBe(0);
  });
  it('GEOMEAN / HARMEAN', () => {
    expect(GEOMEAN([1, 4, 16])).toBeCloseTo(4, 6);
    expect(GEOMEAN([1, 2, 4])).toBeCloseTo(2, 6);
    expect(GEOMEAN([1, -4])).toBe(0); // non-positive input
    expect(HARMEAN([1, 2, 4])).toBeCloseTo(3 / 1.75, 6);
    expect(HARMEAN([1, 0])).toBe(0);
  });
  it('TRIMMEAN trims pct/2 from each end', () => {
    expect(TRIMMEAN([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.2)).toBeCloseTo(5.5, 6);
    expect(TRIMMEAN([1, 2, 3, 4], 1)).toBe(0); // everything trimmed
  });
  it('AVEDEV / DEVSQ', () => {
    expect(AVEDEV([1, 2, 3, 4, 5])).toBeCloseTo(1.2, 6);
    expect(DEVSQ([1, 2, 3])).toBe(2);
    expect(DEVSQ([])).toBe(0);
  });
  it('KURT of a symmetric small sample', () => {
    // [1,2,3,4,5]: excess kurtosis = -1.2 (platykurtic, uniform-like)
    expect(KURT([1, 2, 3, 4, 5])).toBeCloseTo(-1.2, 1);
    expect(KURT([1, 2, 3])).toBe(0); // n < 4
  });
  it('SKEW of a symmetric sample is 0, skewed is non-zero', () => {
    expect(SKEW([1, 2, 3, 4, 5])).toBeCloseTo(0, 6);
    expect(SKEW([1, 2, 3])).toBe(0); // n < 3
    const s = SKEW([1, 1, 1, 10, 10, 100]);
    expect(Math.abs(s)).toBeGreaterThan(0.5); // right-skewed
  });
});

describe('regression', () => {
  it('FORECAST evaluates the least-squares line', () => {
    expect(FORECAST(5, [1, 2, 3], [1, 2, 3])).toBeCloseTo(5, 6);
    expect(FORECAST(0, [1, 2, 3], [1, 2, 3])).toBeCloseTo(0, 6);
    // y = 2x+1
    expect(FORECAST(4, [3, 5, 7], [1, 2, 3])).toBeCloseTo(9, 6);
    expect(FORECAST(5, [1], [1])).toBe(0); // < 2 pairs
  });
  it('SLOPE / INTERCEPT fit the line', () => {
    expect(SLOPE([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
    expect(INTERCEPT([1, 2, 3], [1, 2, 3])).toBeCloseTo(0, 6);
    // y = 2x+1 through (1,3),(2,5),(3,7)
    expect(SLOPE([3, 5, 7], [1, 2, 3])).toBeCloseTo(2, 6);
    expect(INTERCEPT([3, 5, 7], [1, 2, 3])).toBeCloseTo(1, 6);
  });
  it('RSQ / PEARSON are R² / correlation', () => {
    expect(RSQ([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
    expect(PEARSON([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
  });
});
