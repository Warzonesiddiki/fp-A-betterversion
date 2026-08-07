/**
 * financial.oracle.test.ts — financial formula functions with known-answer
 * oracles (MISSION D wave 2, 2026-08-07).
 *
 * Known answers are Excel-verified values (PMT/IPMT/PPMT/CUMIPMT/CUMPRINC for a
 * 5%/10-period/100k loan; Macaulay duration of a par bond; F distribution
 * tables). These tests exposed three real defects fixed in the same commit:
 *  - IPMT/PPMT used PV for the prior-period balance, dropping the principal
 *    term (IPMT₁ was 0 instead of -5,000; period-2 sign/magnitude also wrong).
 *  - DB double-counted depreciation (period 2 was 1,361.92 instead of 2,328.x).
 *  - DURATION omitted the redemption cash flow (4.87y vs true 7.25y for a par
 *    8%/10y bond) and YIELD's Newton step had a zero derivative.
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOCATE,
  CAGR,
  CONVERT_CURRENCY,
  CUMIPMT,
  CUMPRINC,
  DB,
  DDB,
  DISTRIBUTE,
  DPO,
  DSI,
  DSO,
  DURATION,
  EBITDA,
  EBIT,
  EFFECT,
  ELIMINATE,
  FCFF,
  FCFE,
  FV,
  FX_GAIN_LOSS,
  GROWTH_RATE,
  HYPERINFLATION_ADJUST,
  IPMT,
  IRR,
  MDURATION,
  MOM,
  MOVING_AVERAGE,
  NOMINAL,
  NOPAT,
  NPER,
  NPV,
  PAYBACK,
  PERCENTILE,
  PMT,
  PPMT,
  PRO_RATA,
  PV,
  QTD,
  RATE,
  ROLLING,
  SLN,
  SPLIT,
  SPREAD,
  SYD,
  TREND,
  TRANSLATE,
  VDB,
  WACC,
  WEIGHTED_AVERAGE,
  XIRR,
  XNPV,
  YIELD,
  YOY,
  YTD,
} from './financial';

describe('valuation building blocks', () => {
  it('EBITDA / EBIT / NOPAT / FCFF / FCFE / WACC', () => {
    expect(EBITDA(1000, 400, 200)).toBe(400);
    expect(EBIT(400, 100)).toBe(300);
    expect(NOPAT(300, 0.2)).toBe(240);
    expect(FCFF(300, 50, 80, 30)).toBe(240);
    expect(FCFE(240, 20)).toBe(260);
    expect(WACC(0.6, 0.1, 0.4, 0.05, 0.3)).toBeCloseTo(0.074, 10);
  });
});

describe('time value of money', () => {
  it('NPV discounts cash flows', () => {
    expect(NPV(0.1, [-1000, 500, 400, 300])).toBeCloseTo(10.52, 1);
    expect(NPV(0.1, [])).toBe(0);
    // single cash flow at t=0
    expect(NPV(0.1, [1000])).toBe(1000);
  });
  it('IRR converges to the discount rate that zeroes NPV', () => {
    expect(IRR([-1000, 300, 400, 500])).toBeCloseTo(0.08896, 4);
    // different profile, its own root
    expect(IRR([-1000, 500, 400, 300])).toBeCloseTo(0.1065, 3);
  });
  it('PV matches Excel PV(5%,10,1000) = -7,721.73 and PV(10%,10,1000) = -6,144.57', () => {
    expect(PV(0.05, 10, 1000)).toBeCloseTo(-7721.73, 1);
    expect(PV(0.1, 10, 1000)).toBeCloseTo(-6144.57, 1);
    // zero rate: -pmt*n
    expect(PV(0, 10, 1000)).toBe(-10000);
  });
  it('FV matches Excel FV(5%,10,1000) = -12,577.89 and FV(10%,10,1000) = -15,937.42', () => {
    expect(FV(0.05, 10, 1000)).toBeCloseTo(-12577.89, 1);
    expect(FV(0.1, 10, 1000)).toBeCloseTo(-15937.42, 1);
    expect(FV(0, 10, 1000)).toBe(-10000);
  });
  it('PMT matches Excel PMT(5%,10,100000) = -12,950.46', () => {
    expect(PMT(0.05, 10, 100000)).toBeCloseTo(-12950.46, 1);
    expect(PMT(0, 10, 100000)).toBe(-10000);
  });
  it('NPER matches Excel NPER(5%,-1000,10000) = 14.2067', () => {
    expect(NPER(0.05, -1000, 10000)).toBeCloseTo(14.2067, 3);
    expect(NPER(0, -1000, 10000)).toBeCloseTo(10, 6);
  });
  it('RATE recovers the loan rate (round-trip with PMT)', () => {
    expect(RATE(10, PMT(0.06, 10, 50000), 50000)).toBeCloseTo(0.06, 6);
    // 10 payments of 1000 exactly repay 10000 → 0%
    expect(Math.abs(RATE(10, -1000, 10000))).toBeLessThan(1e-6);
  });
});

describe('loan amortization (Excel-verified)', () => {
  it('IPMT matches Excel per-period interest', () => {
    expect(IPMT(0.05, 1, 10, 100000)).toBeCloseTo(-5000, 1);
    expect(IPMT(0.05, 2, 10, 100000)).toBeCloseTo(-4602.48, 1);
    expect(IPMT(0.05, 10, 10, 100000)).toBeCloseTo(-616.69, 1);
  });
  it('PPMT matches Excel per-period principal', () => {
    expect(PPMT(0.05, 1, 10, 100000)).toBeCloseTo(-7950.46, 1);
    expect(PPMT(0.05, 2, 10, 100000)).toBeCloseTo(-8347.98, 1);
  });
  it('IPMT + PPMT = PMT every period', () => {
    for (let per = 1; per <= 10; per++) {
      expect(IPMT(0.05, per, 10, 100000) + PPMT(0.05, per, 10, 100000)).toBeCloseTo(
        PMT(0.05, 10, 100000),
        1
      );
    }
  });
  it('CUMIPMT / CUMPRINC match Excel', () => {
    expect(CUMIPMT(0.05, 10, 100000, 1, 2)).toBeCloseTo(-9602.48, 1);
    expect(CUMPRINC(0.05, 10, 100000, 1, 2)).toBeCloseTo(-16298.39, 0);
    // full term: cumulative principal repays the loan, cumulative interest +
    // principal equals total paid (PMT × n)
    expect(CUMPRINC(0.05, 10, 100000, 1, 10)).toBeCloseTo(-100000, 0);
    expect(CUMIPMT(0.05, 10, 100000, 1, 10) + CUMPRINC(0.05, 10, 100000, 1, 10)).toBeCloseTo(
      PMT(0.05, 10, 100000) * 10,
      0
    );
  });
});

describe('growth & working-capital metrics', () => {
  it('CAGR / GROWTH_RATE / YOY / MOM', () => {
    expect(CAGR(100, 200, 2)).toBeCloseTo(Math.SQRT2 - 1, 6);
    expect(CAGR(0, 100, 2)).toBe(0);
    expect(GROWTH_RATE(120, 100)).toBeCloseTo(0.2, 10);
    expect(YOY(120, 100)).toBeCloseTo(0.2, 10);
    expect(MOM(12, 10)).toBeCloseTo(0.2, 10);
    // negative base uses |base|
    expect(GROWTH_RATE(150, -50)).toBe(4);
    expect(GROWTH_RATE(100, 0)).toBe(0);
  });
  it('PAYBACK returns the recovery period index', () => {
    expect(PAYBACK([-1000, 300, 400, 500, 600])).toBe(3);
    expect(PAYBACK([1000])).toBe(0);
    expect(PAYBACK([-1000, -100])).toBe(-1);
  });
  it('DPO / DSI / DSO convert turnover to days', () => {
    expect(DPO(365000, 50000)).toBeCloseTo(50, 6);
    expect(DSI(100000, 365000)).toBeCloseTo(100, 6);
    expect(DSO(730000, 100000)).toBeCloseTo(50, 6);
    expect(DPO(0, 50000)).toBe(0);
  });
});

describe('XIRR / XNPV with actual dates', () => {
  it('XNPV discounts on 365.25-day years', () => {
    expect(XNPV(0.1, [-1000, 500, 400, 300], [0, 365, 730, 1095])).toBeCloseTo(10.64, 1);
  });
  it('XIRR matches IRR for annual cash flows', () => {
    expect(XIRR([-1000, 300, 400, 500], [0, 365, 730, 1095])).toBeCloseTo(
      IRR([-1000, 300, 400, 500]),
      3
    );
  });
});

describe('depreciation (Excel-verified)', () => {
  it('SLN straight line', () => {
    expect(SLN(10000, 1000, 5)).toBe(1800);
  });
  it('DB fixed-rate declining balance', () => {
    expect(DB(10000, 1000, 5, 1)).toBeCloseTo(3690.43, 1);
    expect(DB(10000, 1000, 5, 2)).toBeCloseTo(2328.4, 0);
    expect(DB(10000, 1000, 5, 5)).toBeLessThan(1000); // converges toward salvage
  });
  it('SYD sum-of-years-digits', () => {
    expect(SYD(10000, 1000, 5, 1)).toBe(3000);
    expect(SYD(10000, 1000, 5, 2)).toBe(2400);
    expect(SYD(10000, 1000, 5, 5)).toBe(600);
  });
  it('DDB double-declining with salvage clamp', () => {
    expect(DDB(10000, 1000, 5, 1)).toBe(4000);
    expect(DDB(10000, 1000, 5, 2)).toBe(2400);
    expect(DDB(10000, 1000, 5, 3)).toBe(1440);
    expect(DDB(10000, 1000, 5, 5)).toBe(296); // clamped at salvage
  });
  it('VDB sums DDB over the period window', () => {
    expect(VDB(10000, 1000, 5, 2, 4)).toBe(4704);
  });
});

describe('bond math (Macaulay duration)', () => {
  it('DURATION of a par 8%/10y bond is ~7.247 years', () => {
    expect(DURATION(0, 3652.5, 0.08, 0.08, 1)).toBeCloseTo(7.2469, 2);
    // zero-coupon: duration = term
    expect(DURATION(0, 3652.5, 0, 0.08, 1)).toBeCloseTo(10, 1);
  });
  it('MDURATION = DURATION / (1 + yld/freq)', () => {
    expect(MDURATION(0, 3652.5, 0.08, 0.08, 1)).toBeCloseTo(7.2469 / 1.08, 2);
  });
  it('YIELD returns par rate for a par bond and recovers a discount yield', () => {
    expect(YIELD(0, 3652.5, 0.08, 1, 1, 1)).toBeCloseTo(0.08, 4);
    // 8% 10y bond priced at 90 → YTM ≈ 9.6%
    expect(YIELD(0, 3652.5, 0.08, 0.9, 1, 1)).toBeCloseTo(0.095996, 3);
  });
  it('EFFECT / NOMINAL invert each other', () => {
    expect(EFFECT(0.12, 12)).toBeCloseTo(0.126825, 5);
    expect(NOMINAL(0.126825, 12)).toBeCloseTo(0.12, 4);
  });
});

describe('growth aggregation', () => {
  it('YTD sums months up to m', () => {
    expect(YTD([10, 20, 30, 40], 2)).toBe(60);
    expect(YTD([10, 20, 30], 5)).toBe(60);
    expect(YTD([10, 20, 30], 0)).toBe(10);
  });
  it('QTD sums the quarter window', () => {
    expect(QTD([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 1)).toBe(150);
    expect(QTD([10, 20, 30, 40], 0)).toBe(60);
    expect(QTD([10, 20, 30], 5)).toBe(0); // beyond data
  });
  it('ROLLING / MOVING_AVERAGE window averages', () => {
    expect(ROLLING([1, 2, 3, 4, 5], 3)).toEqual([2, 3, 4]);
    expect(ROLLING([1, 2, 3], 4)).toEqual([]);
    expect(ROLLING([1, 2, 3], 0)).toEqual([]);
    expect(MOVING_AVERAGE([1, 2, 3, 4, 5], 3)).toEqual([2, 3, 4]);
  });
  it('TREND least-squares fit', () => {
    expect(TREND([1, 2, 3, 4, 5])).toEqual([1, 2, 3, 4, 5]);
    expect(TREND([1, 2, 3, 5]).map((x) => Math.round(x * 10) / 10)).toEqual([0.8, 2.1, 3.4, 4.7]);
    expect(TREND([5])).toEqual([5]); // single point
  });
  it('WEIGHTED_AVERAGE', () => {
    expect(WEIGHTED_AVERAGE([10, 20, 30], [1, 2, 3])).toBeCloseTo(140 / 6, 6);
    expect(WEIGHTED_AVERAGE([10, 20], [0, 0])).toBe(0);
    expect(() => WEIGHTED_AVERAGE([1, 2], [1])).toThrow();
  });
  it('PERCENTILE with linear interpolation', () => {
    expect(PERCENTILE([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(PERCENTILE([1, 2, 3, 4, 5], 0)).toBe(1);
    expect(PERCENTILE([1, 2, 3, 4, 5], 100)).toBe(5);
    expect(PERCENTILE([1, 2, 3, 4], 25)).toBeCloseTo(1.75, 6);
    expect(PERCENTILE([], 50)).toBe(0);
  });
});

describe('allocation & currency', () => {
  it('ALLOCATE / DISTRIBUTE / SPLIT by weights', () => {
    expect(ALLOCATE(100, [1, 2, 1])).toEqual([25, 50, 25]);
    expect(ALLOCATE(100, [0, 0])).toEqual([0, 0]);
    expect(DISTRIBUTE(100, [1, 3])).toEqual([25, 75]);
    expect(SPLIT(100, [1, 1])).toEqual([50, 50]);
  });
  it('SPREAD equal parts', () => {
    expect(SPREAD(100, 4)).toEqual([25, 25, 25, 25]);
    expect(SPREAD(100, 0)).toEqual([]);
    expect(SPREAD(100, 3)).toEqual([33.33, 33.33, 33.33].map((x) => expect.closeTo(x, 1)));
  });
  it('PRO_RATA share of a total', () => {
    expect(PRO_RATA(100, 30, 120)).toBeCloseTo(25, 6);
    expect(PRO_RATA(100, 30, 0)).toBe(0);
  });
  it('currency conversion / translation / elimination / FX', () => {
    expect(CONVERT_CURRENCY(100, 1.2)).toBe(120);
    expect(TRANSLATE(100, 1.2)).toBe(120);
    expect(ELIMINATE(100, 0.5)).toBe(50);
    expect(FX_GAIN_LOSS(100, 1.0, 1.1)).toBe(10);
    expect(HYPERINFLATION_ADJUST(100, 120, 100)).toBe(120);
    expect(HYPERINFLATION_ADJUST(100, 120, 0)).toBe(0);
  });
});
