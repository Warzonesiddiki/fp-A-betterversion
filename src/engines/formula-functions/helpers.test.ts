/**
 * helpers.test.ts — formula-function shared helpers (MISSION D coverage push).
 *
 * Known-answer tests against standard statistical tables (Normal, Student's t,
 * gamma) and combinatorial identities. Tolerances are generous (3-4 dp) because
 * the implementations are single-precision Numerical Recipes-style series.
 */
import { describe, expect, it } from 'vitest';
import {
  betacf,
  betai,
  comb,
  fact,
  flattenNums,
  gammln,
  gammDist,
  normCDF,
  normInv,
  perm,
  safeNum,
  toNum,
  tDistCDF,
  tDistInv,
} from './helpers';

describe('toNum', () => {
  it('passes numbers through', () => {
    expect(toNum(42)).toBe(42);
    expect(toNum(-1.5)).toBe(-1.5);
  });
  it('parses numeric strings', () => {
    expect(toNum('3.14')).toBe(3.14);
    expect(toNum('  -7 ')).toBe(-7);
  });
  it('returns NaN for non-numeric input', () => {
    expect(toNum('abc')).toBeNaN();
    expect(toNum(null)).toBeNaN();
    expect(toNum(undefined)).toBeNaN();
    expect(toNum({})).toBeNaN();
  });
});

describe('flattenNums', () => {
  it('flattens nested arrays', () => {
    expect(flattenNums([1, [2, [3, [4]]], 5])).toEqual([1, 2, 3, 4, 5]);
  });
  it('drops NaN, null and undefined entries', () => {
    expect(flattenNums([1, NaN, null, undefined, '2', 'x', [3]])).toEqual([1, 2, 3]);
  });
  it('returns empty array for no valid numbers', () => {
    expect(flattenNums([])).toEqual([]);
    expect(flattenNums([['nope'], null])).toEqual([]);
  });
});

describe('safeNum', () => {
  it('is the identity', () => {
    expect(safeNum(0)).toBe(0);
    expect(safeNum(-99.99)).toBe(-99.99);
  });
});

describe('factorial / comb / perm', () => {
  it('computes factorials', () => {
    expect(fact(0)).toBe(1);
    expect(fact(1)).toBe(1);
    expect(fact(5)).toBe(120);
    expect(fact(10)).toBe(3628800);
  });
  it('computes combinations', () => {
    expect(comb(5, 2)).toBe(10);
    expect(comb(52, 5)).toBe(2598960); // poker hands
    expect(comb(5, 0)).toBe(1);
    expect(comb(2, 5)).toBe(0); // k > n
  });
  it('computes permutations', () => {
    expect(perm(5, 2)).toBe(20);
    expect(perm(5, 0)).toBe(1);
    expect(perm(2, 5)).toBe(0); // k > n
  });
});

describe('gammln', () => {
  it('matches known log-gamma values', () => {
    // ln(1!) = 0, ln(2!) = ln 2, ln(5!) = ln 120
    expect(gammln(1)).toBeCloseTo(0, 6);
    expect(gammln(2)).toBeCloseTo(Math.log(1), 5); // gamma(2)=1
    expect(gammln(3)).toBeCloseTo(Math.log(2), 5);
    expect(gammln(6)).toBeCloseTo(Math.log(120), 4);
    // gamma(0.5) = sqrt(pi)
    expect(gammln(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 4);
  });
});

describe('betai / betacf', () => {
  it('betai(1,1,x) is the identity CDF', () => {
    expect(betai(1, 1, 0.5)).toBeCloseTo(0.5, 6);
    expect(betai(1, 1, 0.25)).toBeCloseTo(0.25, 6);
  });
  it('handles boundary x', () => {
    expect(betai(2, 3, 0)).toBe(0);
    expect(betai(2, 3, 1)).toBe(1);
    expect(betai(2, 3, -1)).toBe(0); // out of range
    expect(betai(2, 3, 2)).toBe(0); // out of range
  });
  it('matches a t-distribution table value via betai', () => {
    // For df=10, t=1.812 → x = df/(df+t²) = 0.75283…
    const x = 10 / (10 + 1.812 * 1.812);
    // P(T<=1.812) = 1 - 0.5 * I_x(5, 0.5) = 0.95
    const cdf = 1 - 0.5 * betai(5, 0.5, x);
    expect(cdf).toBeCloseTo(0.95, 3);
  });
  it('betacf converges to finite value', () => {
    expect(betacf(2, 3, 0.5)).toBeGreaterThan(0);
    expect(betacf(2, 3, 0.5)).toBeLessThan(10);
  });
});

describe('gammDist', () => {
  it('returns 0 for non-positive x', () => {
    expect(gammDist(0, 2, 1)).toBe(0);
    expect(gammDist(-1, 2, 1)).toBe(0);
  });
  it('matches the Gamma(alpha,beta) density', () => {
    // Gamma(alpha=2, beta=1) density at x=2: 2*e^-2
    expect(gammDist(2, 2, 1)).toBeCloseTo(2 * Math.exp(-2), 4);
    // Gamma(alpha=1, beta=2) density at x=3: 0.5*e^(-1.5)
    expect(gammDist(3, 1, 2)).toBeCloseTo(0.5 * Math.exp(-1.5), 4);
  });
});

describe('normCDF', () => {
  it('symmetric around 0', () => {
    expect(normCDF(0)).toBeCloseTo(0.5, 6);
    expect(normCDF(1.96) + normCDF(-1.96)).toBeCloseTo(1, 4);
  });
  it('matches table values', () => {
    expect(normCDF(1.96)).toBeCloseTo(0.9750021, 4);
    expect(normCDF(0.5)).toBeCloseTo(0.6914625, 4);
    expect(normCDF(-1)).toBeCloseTo(0.1586553, 4);
    expect(normCDF(2.576)).toBeCloseTo(0.995, 3);
  });
  it('is monotonic increasing', () => {
    const xs = [-3, -1, 0, 1, 3];
    for (let i = 1; i < xs.length; i++) {
      expect(normCDF(xs[i]!)).toBeGreaterThan(normCDF(xs[i - 1]!));
    }
  });
});

describe('normInv', () => {
  it('inverts normCDF', () => {
    expect(normInv(0.5)).toBeCloseTo(0, 5);
    expect(normInv(0.975)).toBeCloseTo(1.959964, 3);
    expect(normInv(0.025)).toBeCloseTo(-1.959964, 3);
    expect(normInv(0.8413447)).toBeCloseTo(1, 2);
  });
  it('handles invalid p', () => {
    expect(normInv(0)).toBe(0);
    expect(normInv(1)).toBe(0);
  });
  it('round-trips through normCDF', () => {
    for (const p of [0.1, 0.3, 0.7, 0.9, 0.99]) {
      expect(normCDF(normInv(p))).toBeCloseTo(p, 3);
    }
  });
});

describe('tDistCDF', () => {
  it('is 0.5 at t=0 for any df', () => {
    expect(tDistCDF(0, 5)).toBeCloseTo(0.5, 6);
    expect(tDistCDF(0, 30)).toBeCloseTo(0.5, 6);
  });
  it('matches table values (df=10)', () => {
    expect(tDistCDF(1.812, 10)).toBeCloseTo(0.95, 2);
    expect(tDistCDF(2.228, 10)).toBeCloseTo(0.975, 2);
    expect(tDistCDF(-1.812, 10)).toBeCloseTo(0.05, 2);
  });
  it('matches table values (df=20)', () => {
    expect(tDistCDF(1.725, 20)).toBeCloseTo(0.95, 2);
    expect(tDistCDF(2.086, 20)).toBeCloseTo(0.975, 2);
  });
  it('approaches normCDF for large df', () => {
    expect(tDistCDF(1.96, 100)).toBeCloseTo(normCDF(1.96), 2);
  });
});

describe('tDistInv', () => {
  it('matches table quantiles for small df', () => {
    expect(tDistInv(0.95, 10)).toBeCloseTo(1.812, 1);
    expect(tDistInv(0.975, 10)).toBeCloseTo(2.228, 1);
  });
  it('uses normInv approximation for df > 30', () => {
    expect(tDistInv(0.975, 40)).toBeCloseTo(normInv(0.975), 5);
    expect(tDistInv(0.95, 100)).toBeCloseTo(normInv(0.95), 5);
  });
  it('round-trips through tDistCDF', () => {
    expect(tDistCDF(tDistInv(0.9, 8), 8)).toBeCloseTo(0.9, 2);
    expect(tDistCDF(tDistInv(0.99, 12), 12)).toBeCloseTo(0.99, 2);
  });
});
