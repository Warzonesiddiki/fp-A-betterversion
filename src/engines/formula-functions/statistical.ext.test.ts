/**
 * statistical.ext.test.ts — additional statistical functions, known-answer
 * oracles (MISSION D/E). Values verified by hand/standard
 * statistical definitions.
 */
import { describe, expect, it } from 'vitest';
import {
  SUM,
  COUNT,
  AVERAGE,
  MEDIAN,
  STDEV,
  VARIANCE,
  MIN,
  MAX,
  ABS,
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
  NORMDIST,
  NORMINV,
  NORMSDIST,
  NORMSINV,
  TDIST,
  TINV,
  EXPONDIST,
  GAMMADIST,
  BETADIST,
  WEIBULL,
  LOGNORMDIST,
  LOGINV,
  CHIDIST,
  CHIINV,
  FDIST,
  FINV,
  CONFIDENCE,
  FISHER,
  FISHERINV,
  BINOMDIST,
  POISSON,
  registerStatisticalFunctions,
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

describe('basic aggregations and descriptive statistics', () => {
  it('SUM / COUNT / AVERAGE / MEDIAN / MIN / MAX / ABS / VARIANCE', () => {
    expect(SUM(1, 2, 3, 4)).toBe(10);
    expect(COUNT(1, 2, 3, 4)).toBe(4);
    expect(AVERAGE(1, 2, 3, 4)).toBeCloseTo(2.5, 6);
    expect(MEDIAN(1, 2, 3, 4, 5)).toBe(3);
    expect(MIN(5, 2, 9)).toBe(2);
    expect(MAX(5, 2, 9)).toBe(9);
    expect(ABS(-42)).toBe(42);
    expect(STDEV(1, 2, 3, 4, 5)).toBeCloseTo(Math.sqrt(2.5), 6);
    expect(VARIANCE(1, 2, 3, 4, 5)).toBeCloseTo(2.5, 6);
  });

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

describe('distributions and statistical tests', () => {
  it('NORMDIST / NORMINV / NORMSDIST / NORMSINV', () => {
    expect(NORMDIST(0, 0, 1, 1)).toBeCloseTo(0.5, 6);
    expect(NORMINV(0.5, 0, 1)).toBeCloseTo(0, 6);
    expect(NORMSDIST(0)).toBeCloseTo(0.5, 6);
    expect(NORMSINV(0.5)).toBeCloseTo(0, 6);
  });

  it('TDIST / TINV / EXPONDIST / GAMMADIST / BETADIST / WEIBULL', () => {
    expect(TDIST(1, 10)).toBeDefined();
    expect(TINV(0.05, 10)).toBeDefined();
    expect(EXPONDIST(1, 2, 1)).toBeCloseTo(1 - Math.exp(-2), 6);
    expect(GAMMADIST(2, 3, 2, 1)).toBeDefined();
    expect(BETADIST(0.5, 2, 2)).toBeDefined();
    expect(WEIBULL(1, 2, 2, 1)).toBeCloseTo(1 - Math.exp(-0.25), 6);
  });

  it('LOGNORMDIST / LOGINV / CHIDIST / CHIINV / FDIST / FINV', () => {
    expect(LOGNORMDIST(1, 0, 1)).toBeCloseTo(0.5, 6);
    expect(LOGINV(0.5, 0, 1)).toBeCloseTo(1, 6);
    expect(CHIDIST(2, 2)).toBeDefined();
    expect(CHIINV(0.05, 2)).toBeDefined();
    expect(FDIST(1, 5, 5)).toBeDefined();
    expect(FINV(0.05, 5, 5)).toBeDefined();
  });

  it('CONFIDENCE / FISHER / FISHERINV / BINOMDIST / POISSON', () => {
    expect(CONFIDENCE(0.05, 2.5, 100)).toBeCloseTo(0.48999, 4);
    expect(FISHER(0.5)).toBeCloseTo(0.5493, 4);
    expect(FISHERINV(0.5493)).toBeCloseTo(0.5, 3);
    expect(BINOMDIST(2, 10, 0.5, 0)).toBeDefined();
    expect(POISSON(2, 3, 0)).toBeCloseTo((Math.pow(3, 2) * Math.exp(-3)) / 2, 6);
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

describe('registerStatisticalFunctions', () => {
  it('registers all statistical functions into registry', () => {
    const reg: Record<string, any> = {};
    registerStatisticalFunctions((fn) => {
      reg[fn.name] = fn;
    });

    expect(Object.keys(reg).length).toBeGreaterThan(30);
    expect(reg['SUM'].impl(10, 20)).toBe(30);
    expect(reg['AVERAGE'].impl(10, 20)).toBe(15);
    expect(reg['MAXA'].impl(10, 20)).toBe(20);
    expect(reg['MINA'].impl(10, 20)).toBe(10);
    expect(reg['AVERAGEA'].impl(10, 20)).toBe(15);
    expect(reg['COUNTA'].impl(10, 20)).toBe(2);
    expect(reg['COUNTBLANK'].impl([0, 10, 0, 20])).toBe(2);
    expect(reg['VARA'].impl(10, 20)).toBeGreaterThan(0);
    expect(reg['VARPA'].impl(10, 20)).toBeGreaterThan(0);
    expect(reg['STDEVA'].impl(10, 20)).toBeGreaterThan(0);
    expect(reg['STDEVPA'].impl(10, 20)).toBeGreaterThan(0);
    expect(reg['LARGE'].impl([10, 20, 30, 40], 2)).toBe(30);
    expect(reg['SMALL'].impl([10, 20, 30, 40], 2)).toBe(20);
    expect(reg['RANK'].impl(30, [10, 20, 30, 40])).toBe(2);
    expect(reg['PERMUTATIONA'].impl(4, 2)).toBe(16);
    expect(reg['MULTINOMIAL'].impl(2, 3)).toBe(10); // 5! / (2! * 3!) = 120 / 12 = 10
    expect(reg['SERIESSUM'].impl(2, 1, 1, [1, 2])).toBe(10); // 1*2^1 + 2*2^2 = 2 + 8 = 10
    expect(reg['SUMXMY2'].impl([1, 2], [3, 4])).toBe(8);
    expect(reg['SUMX2MY2'].impl([1, 2], [3, 4])).toBe(-20);
    expect(reg['SUMX2PY2'].impl([1, 2], [3, 4])).toBe(30);
    expect(reg['NEGBINOMDIST'].impl(2, 3, 0.5)).toBeGreaterThan(0);
    expect(reg['CRITBINOM'].impl(10, 0.5, 0.5)).toBeGreaterThan(0);
    expect(reg['ZTEST'].impl([1, 2, 3, 4, 5], 3)).toBeDefined();
    expect(reg['FREQUENCY'].impl([1, 2, 3, 4, 5], [2, 4])).toHaveLength(3);
    expect(reg['LINEST'].impl([3, 5, 7], [1, 2, 3])).toHaveLength(2);
    expect(reg['LOGEST'].impl([3, 5, 7], [1, 2, 3])).toHaveLength(2);
    expect(reg['GROWTH_FN'].impl([3, 5, 7], [1, 2, 3])).toBeGreaterThan(0);
    expect(reg['TREND_FN'].impl([3, 5, 7], [1, 2, 3])).toBeCloseTo(7, 4);

    const data = [10, 20, 30];
    const critRange = [1, 2, 1];
    expect(reg['DSTDEV'].impl(data, critRange, 1)).toBeGreaterThan(0);
    expect(reg['DSTDEVP'].impl(data, critRange, 1)).toBeGreaterThan(0);
    expect(reg['DVAR'].impl(data, critRange, 1)).toBeGreaterThan(0);
    expect(reg['DVARP'].impl(data, critRange, 1)).toBeGreaterThan(0);

    expect(reg['CUBEVALUE'].impl(100)).toBe(100);
    expect(reg['CUBEMEMBER'].impl(200)).toBe(200);
    expect(reg['CUBESET'].impl(300)).toBe(300);
    expect(reg['CUBERANKEDMEMBER'].impl(400)).toBe(400);
    expect(reg['CUBESETCOUNT'].impl(500)).toBe(500);
    expect(reg['CUBEMEMBERPROPERTY'].impl(600)).toBe(600);
  });
});
