/**
 * statistical.dist.test.ts — distribution functions with exact known-answer
 * oracles (MISSION D, 2026-08-07).
 *
 * Oracles:
 *  - chi-square survival for EVEN df: Q(x;ν) = e^{-x/2} Σ_{k=0}^{ν/2-1} (x/2)^k/k!
 *  - Gamma CDF for integer alpha: F(x) = 1 - e^{-x/β} Σ_{k=0}^{α-1} (x/β)^k/k!
 *  - F/t distributions: standard table percentiles.
 *
 * These tests exposed two real defects that were fixed in the same commit:
 *  - CHIDIST/GAMMADIST(cum) used an invalid beta parametrization (wrong tail
 *    probabilities; CHIINV bisected to its 100 ceiling).
 *  - tDistCDF ignored the sign of t (F(-t) = 1 - F(t) violated).
 */
import { describe, expect, it } from 'vitest';
import {
  BINOMDIST,
  CHIDIST,
  CHIINV,
  CONFIDENCE,
  EXPONDIST,
  FDIST,
  FINV,
  FISHER,
  FISHERINV,
  GAMMADIST,
  LOGINV,
  LOGNORMDIST,
  NORMINV,
  NORMDIST,
  NORMSDIST,
  NORMSINV,
  POISSON,
  TDIST,
  TINV,
  WEIBULL,
} from './statistical';

const fact = (n: number): number => {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
};

/** Exact chi-square survival for even df. */
const chi2Survival = (x: number, df: number): number => {
  let s = 0;
  for (let k = 0; k < df / 2; k++) s += Math.pow(x / 2, k) / fact(k);
  return Math.exp(-x / 2) * s;
};

/** Exact Gamma CDF for integer alpha. */
const gammaCdf = (x: number, a: number, b: number): number => {
  let s = 0;
  for (let k = 0; k < a; k++) s += Math.pow(x / b, k) / fact(k);
  return 1 - Math.exp(-x / b) * s;
};

describe('NORMDIST / NORMINV / NORMSDIST / NORMSINV', () => {
  it('NORMDIST pdf and cdf', () => {
    expect(NORMDIST(1, 0, 1, true)).toBeCloseTo(0.8413447, 4);
    expect(NORMDIST(0, 0, 1, true)).toBeCloseTo(0.5, 6);
    // pdf at 0 = 1/sqrt(2π)
    expect(NORMDIST(0, 0, 1, false)).toBeCloseTo(0.3989423, 5);
    // pdf at x=1 = e^{-1/2}/sqrt(2π)
    expect(NORMDIST(1, 0, 1, false)).toBeCloseTo(0.2419707, 5);
  });
  it('NORMINV shifts and scales', () => {
    expect(NORMINV(0.975, 100, 10)).toBeCloseTo(119.5996, 2);
    expect(NORMINV(0.5, 5, 2)).toBeCloseTo(5, 5);
  });
  it('NORMSDIST / NORMSINV match the standard normal', () => {
    expect(NORMSDIST(1.96)).toBeCloseTo(0.9750021, 4);
    expect(NORMSINV(0.975)).toBeCloseTo(1.959964, 3);
    expect(NORMSINV(NORMSDIST(0.5))).toBeCloseTo(0.5, 4);
  });
});

describe('TDIST / TINV', () => {
  it('TDIST is the right tail for positive t', () => {
    expect(TDIST(1.812, 10)).toBeCloseTo(0.05, 3);
    expect(TDIST(2.228, 10)).toBeCloseTo(0.025, 3);
    expect(TDIST(1.725, 20)).toBeCloseTo(0.05, 3);
  });
  it('TINV returns two-tailed quantiles', () => {
    expect(TINV(0.05, 10)).toBeCloseTo(2.228, 2);
    expect(TINV(0.1, 20)).toBeCloseTo(1.725, 2);
  });
});

describe('EXPONDIST', () => {
  it('matches the exponential CDF/density', () => {
    expect(EXPONDIST(2, 1, true)).toBeCloseTo(1 - Math.exp(-2), 5);
    expect(EXPONDIST(2, 1, false)).toBeCloseTo(Math.exp(-2), 5);
    expect(EXPONDIST(1.5, 0.5, true)).toBeCloseTo(1 - Math.exp(-0.75), 5);
  });
});

describe('GAMMADIST', () => {
  it('cumulative matches the exact Gamma CDF for integer alpha', () => {
    expect(GAMMADIST(1, 2, 1, 1)).toBeCloseTo(gammaCdf(1, 2, 1), 5);
    expect(GAMMADIST(2, 2, 1, 1)).toBeCloseTo(gammaCdf(2, 2, 1), 5);
    expect(GAMMADIST(3, 3, 2, 1)).toBeCloseTo(gammaCdf(3, 3, 2), 5);
    expect(GAMMADIST(0, 2, 1, 1)).toBe(0);
  });
  it('density matches the Gamma(alpha,beta) density', () => {
    expect(GAMMADIST(2, 2, 1, 0)).toBeCloseTo(2 * Math.exp(-2), 4);
    expect(GAMMADIST(3, 1, 2, 0)).toBeCloseTo(0.5 * Math.exp(-1.5), 4);
  });
});

describe('CHIDIST / CHIINV', () => {
  it('CHIDIST matches exact chi-square survival for even df', () => {
    expect(CHIDIST(2, 2)).toBeCloseTo(chi2Survival(2, 2), 5);
    expect(CHIDIST(10, 10)).toBeCloseTo(chi2Survival(10, 10), 5);
    expect(CHIDIST(18.307, 10)).toBeCloseTo(0.05, 3);
    expect(CHIDIST(20.483, 10)).toBeCloseTo(0.025, 3);
  });
  it('CHIDIST matches table values for odd df', () => {
    expect(CHIDIST(3.841, 1)).toBeCloseTo(0.05, 3);
    expect(CHIDIST(5.991, 2)).toBeCloseTo(0.05, 3);
    expect(CHIDIST(7.815, 3)).toBeCloseTo(0.05, 3);
  });
  it('CHIINV inverts CHIDIST (right-tail convention)', () => {
    expect(CHIINV(0.95, 10)).toBeCloseTo(3.9403, 2);
    expect(CHIINV(0.05, 10)).toBeCloseTo(18.307, 2);
    expect(CHIDIST(CHIINV(0.2, 6), 6)).toBeCloseTo(0.2, 3);
  });
});

describe('FDIST / FINV', () => {
  it('FDIST is the right tail of the F distribution', () => {
    expect(FDIST(3.33, 5, 10)).toBeCloseTo(0.05, 2);
    expect(FDIST(2.52, 5, 10)).toBeCloseTo(0.1, 2);
    expect(FDIST(4.74, 5, 10)).toBeCloseTo(0.02, 2);
  });
  it('FINV inverts FDIST', () => {
    expect(FINV(0.05, 5, 10)).toBeCloseTo(3.33, 2);
    expect(FINV(0.01, 5, 10)).toBeCloseTo(5.64, 2);
    expect(FDIST(FINV(0.1, 8, 6), 8, 6)).toBeCloseTo(0.1, 3);
  });
});

describe('WEIBULL / LOGNORMDIST / LOGINV', () => {
  it('WEIBULL cumulative and density', () => {
    // alpha=1 reduces to exponential(1/beta)
    expect(WEIBULL(2, 1, 2, true)).toBeCloseTo(1 - Math.exp(-1), 5);
    expect(WEIBULL(2, 1, 2, false)).toBeCloseTo(0.5 * Math.exp(-1), 5);
    expect(WEIBULL(1, 2, 1, true)).toBeCloseTo(1 - Math.exp(-1), 5);
  });
  it('LOGNORMDIST / LOGINV round-trip', () => {
    // lognormal with mu=0, sigma=1 at x=1 → P(ln X <= 0) = 0.5
    expect(LOGNORMDIST(1, 0, 1)).toBeCloseTo(0.5, 5);
    expect(LOGNORMDIST(Math.E, 0, 1)).toBeCloseTo(0.8413447, 4);
    expect(LOGINV(0.5, 0, 1)).toBeCloseTo(1, 4);
    expect(LOGINV(0.975, 0, 1)).toBeCloseTo(Math.exp(1.959964), 3);
  });
});

describe('BINOMDIST / POISSON', () => {
  it('BINOMDIST pmf and cdf', () => {
    // P(X=2) with n=10, p=0.5 = C(10,2)/1024 = 45/1024
    expect(BINOMDIST(2, 10, 0.5, false)).toBeCloseTo(45 / 1024, 6);
    // P(X<=1) = (1+10)/1024
    expect(BINOMDIST(1, 10, 0.5, true)).toBeCloseTo(11 / 1024, 6);
    // P(X<=2) = (1+10+45)/1024
    expect(BINOMDIST(2, 10, 0.5, true)).toBeCloseTo(56 / 1024, 6);
  });
  it('POISSON pmf and cdf', () => {
    // P(X=2) with mean=2 = e^-2 * 4/2
    expect(POISSON(2, 2, false)).toBeCloseTo((Math.exp(-2) * 4) / 2, 6);
    // P(X<=1) = e^-2(1+2)
    expect(POISSON(1, 2, true)).toBeCloseTo(3 * Math.exp(-2), 6);
    // P(X=0) = e^-mean
    expect(POISSON(0, 5, false)).toBeCloseTo(Math.exp(-5), 6);
  });
});

describe('CONFIDENCE / FISHER / FISHERINV', () => {
  it('CONFIDENCE uses the normal quantile', () => {
    // alpha=0.05, sd=1, n=100 → 1.96/sqrt(100)
    expect(CONFIDENCE(0.05, 1, 100)).toBeCloseTo(1.959964 / 10, 4);
    expect(CONFIDENCE(0.05, 2, 25)).toBeCloseTo((1.959964 * 2) / 5, 4);
  });
  it('FISHER and FISHERINV invert each other', () => {
    expect(FISHER(0)).toBe(0);
    expect(FISHER(0.5)).toBeCloseTo(0.5 * Math.log(3), 5);
    expect(FISHERINV(FISHER(0.3))).toBeCloseTo(0.3, 5);
    expect(FISHERINV(0)).toBe(0);
  });
});
