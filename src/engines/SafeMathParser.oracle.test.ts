/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { safeMathParser, DivisionByZeroError } from './SafeMathParser';

describe('SafeMathParser Comprehensive Oracles (MISSION E)', () => {
  const parser = safeMathParser;

  describe('Financial Functions Deep Matrix', () => {
    it('evaluates NPV, CAGR, IRR', () => {
      expect(parser.evaluate('NPV(0.1, 100, 200, 300)')).toBeCloseTo(481.592787, 4);
      expect(parser.evaluate('CAGR(200, 100, 3)')).toBeCloseTo(0.259921, 4);
      expect(parser.evaluate('IRR(-100, 60, 60)')).toBeCloseTo(0.130662, 4);
      expect(parser.evaluate('IRR(-100)')).toBeNaN(); // less than 2 cashflows ⇒ #NUM!
      expect(parser.evaluate('CAGR(0, 0, 0)')).toBe(0);
    });

    it('evaluates PMT, PV, FV, NPER, RATE, PDURATION, RRI', () => {
      // PMT(rate, nper, pv)
      expect(parser.evaluate('PMT(0.08 / 12, 10 * 12, 10000)')).toBeCloseTo(-121.32759, 3);
      expect(parser.evaluate('PMT(0, 10, 1000)')).toBe(-100);

      // PV(rate, nper, pmt, fv)
      expect(parser.evaluate('PV(0.08 / 12, 120, 121.32759)')).toBeCloseTo(-10000, 0);
      expect(parser.evaluate('PV(0, 10, 100, 0)')).toBe(-1000);

      // FV(rate, nper, pmt, pv)
      expect(parser.evaluate('FV(0, 10, -100, -1000)')).toBe(2000);
      expect(parser.evaluate('FV(0.05, 5, -100, -1000)')).toBeCloseTo(-723.72, 1);

      // NPER(rate, pmt, pv, fv)
      expect(parser.evaluate('NPER(0.06/12, -200, 10000)')).toBeCloseTo(57.68, 1);
      expect(parser.evaluate('NPER(0, -200, 1000)')).toBe(5);

      // RATE(nper, pmt, pv, fv)
      expect(parser.evaluate('RATE(120, -121.33, 10000)')).toBeCloseTo(0.00667, 3);

      // PDURATION(rate, pv, fv)
      expect(parser.evaluate('PDURATION(0.05, 1000, 2000)')).toBeCloseTo(14.206699, 4);

      // RRI(nper, pv, fv)
      expect(parser.evaluate('RRI(8, 10000, 15000)')).toBeCloseTo(0.05199, 4);
    });

    it('evaluates MIRR, XNPV, XIRR', () => {
      // MIRR(values..., financeRate, reinvestRate) — Excel convention:
      // negatives discount back to t0 at the finance rate, positives compound
      // forward to t(n-1) at the reinvest rate.
      expect(parser.evaluate('MIRR(-1000, 300, 400, 400, 300, 0.1, 0.12)')).toBeCloseTo(0.13697, 4);
      expect(parser.evaluate('MIRR(100, 200, 0.1, 0.12)')).toBeNaN(); // no negative cashflow
      expect(parser.evaluate('MIRR(-100, -50, 0.1, 0.12)')).toBeNaN(); // no positive cashflow
      expect(parser.evaluate('MIRR(-100, 0.1, 0.12)')).toBeNaN(); // fewer than 2 flows

      // XNPV(rate, v1, v2, d1, d2)
      const d1 = new Date('2026-01-01').getTime();
      const d2 = new Date('2027-01-01').getTime();
      const xnpv = parser.evaluate(`XNPV(0.1, -1000, 1100, ${d1}, ${d2})`);
      expect(xnpv).toBeCloseTo(0, 0);

      // XIRR(v1, v2, d1, d2)
      const xirr = parser.evaluate(`XIRR(-1000, 1100, ${d1}, ${d2})`);
      expect(xirr).toBeCloseTo(0.1, 2);
    });

    it('evaluates Depreciation: SLN, SYD, DDB, VDB', () => {
      expect(parser.evaluate('SLN(10000, 1000, 5)')).toBe(1800);
      expect(parser.evaluate('SYD(10000, 1000, 5, 1)')).toBe(3000);
      expect(parser.evaluate('SYD(10000, 1000, 5, 2)')).toBe(2400);
      expect(parser.evaluate('DDB(10000, 1000, 5, 1)')).toBeGreaterThanOrEqual(0);
      expect(parser.evaluate('VDB(10000, 1000, 5, 0, 1)')).toBeGreaterThanOrEqual(0);
    });

    it('evaluates Working Capital and Ratio Metrics', () => {
      expect(parser.evaluate('DPO(5000, 20000, 365)')).toBeCloseTo(1460, 1);
      expect(parser.evaluate('DPO(0, 20000)')).toBe(0);
      expect(parser.evaluate('DSO(36500, 6000, 365)')).toBe(60);
      expect(parser.evaluate('DSO(0, 6000)')).toBe(0);
      expect(parser.evaluate('DSI(4000, 24000, 365)')).toBeCloseTo(60.83, 2);
      expect(parser.evaluate('DSI(4000, 0)')).toBe(0);

      expect(parser.evaluate('CURRENT_RATIO(150000, 100000)')).toBe(1.5);
      expect(parser.evaluate('CURRENT_RATIO(150000, 0)')).toBe(0);
      expect(parser.evaluate('QUICK_RATIO(150000, 30000, 100000)')).toBe(1.2);
      expect(parser.evaluate('QUICK_RATIO(150000, 30000, 0)')).toBe(0);
      expect(parser.evaluate('DEBT_TO_EQUITY(80000, 100000)')).toBe(0.8);
      expect(parser.evaluate('DEBT_TO_EQUITY(80000, 0)')).toBe(0);
      expect(parser.evaluate('INTEREST_COVERAGE(25000, 5000)')).toBe(5);
      expect(parser.evaluate('INTEREST_COVERAGE(25000, 0)')).toBe(0);

      expect(parser.evaluate('ROE(20000, 100000)')).toBe(0.2);
      expect(parser.evaluate('ROE(20000, 0)')).toBe(0);
      expect(parser.evaluate('ROA(20000, 200000)')).toBe(0.1);
      expect(parser.evaluate('ROA(20000, 0)')).toBe(0);
      expect(parser.evaluate('ROIC(15000, 100000)')).toBe(0.15);
      expect(parser.evaluate('ROIC(15000, 0)')).toBe(0);

      expect(parser.evaluate('GROSS_MARGIN(60000, 100000)')).toBe(0.6);
      expect(parser.evaluate('GROSS_MARGIN(60000, 0)')).toBe(0);
      expect(parser.evaluate('NET_MARGIN(15000, 100000)')).toBe(0.15);
      expect(parser.evaluate('NET_MARGIN(15000, 0)')).toBe(0);
      expect(parser.evaluate('EBITDA_MARGIN(25000, 100000)')).toBe(0.25);
      expect(parser.evaluate('EBITDA_MARGIN(25000, 0)')).toBe(0);
      expect(parser.evaluate('OPERATING_MARGIN(20000, 100000)')).toBe(0.2);
      expect(parser.evaluate('OPERATING_MARGIN(20000, 0)')).toBe(0);

      expect(parser.evaluate('EBITDA(100, 40, 20)')).toBe(40);
      expect(parser.evaluate('EBIT(100, 70)')).toBe(30);
      expect(parser.evaluate('NOPAT(100, 0.25)')).toBe(75);
      expect(parser.evaluate('FCFF(100, 20, 15, 10)')).toBe(95);
      expect(parser.evaluate('FCFE(80, 15)')).toBe(95);
      expect(parser.evaluate('WACC(100, 0.1, 50, 0.06, 0.25)')).toBeCloseTo(12.25, 2);
    });

    it('evaluates Period Variance and Aggregation: YOY, MOM, YTD, QTD, ROLLING', () => {
      expect(parser.evaluate('YOY(120, 100)')).toBe(0.2);
      expect(parser.evaluate('YOY(120, 0)')).toBe(0);
      expect(parser.evaluate('MOM(105, 100)')).toBe(0.05);
      expect(parser.evaluate('MOM(105, 0)')).toBe(0);
      expect(parser.evaluate('YTD(10, 20, 30, 40)')).toBe(100);
      expect(parser.evaluate('QTD(15, 25, 35)')).toBe(75);
      expect(parser.evaluate('ROLLING(10, 20, 30, 40, 50, 3)')).toBe(40); // avg of last 3
      expect(parser.evaluate('ROLLING(10, 20, 5)')).toBe(0); // window larger than array
      expect(parser.evaluate('SPREAD(100, 200)')).toBe(0.5);
      expect(parser.evaluate('ALLOCATE(1000, 4, 6)')).toBe(400);
      expect(parser.evaluate('ALLOCATE(1000, 0, 0)')).toBe(0);
    });

    it('evaluates FX and Intercompany: CONVERT_CURRENCY, ELIMINATE, TRANSLATE, FX_GAIN_LOSS', () => {
      expect(parser.evaluate('CONVERT_CURRENCY(100, 1.25)')).toBe(125);
      expect(parser.evaluate('ELIMINATE(1000, 0.3)')).toBe(700);
      expect(parser.evaluate('TRANSLATE(500, 1.1)')).toBe(550);
      expect(parser.evaluate('FX_GAIN_LOSS(1000, 1.1, 1.2)')).toBeCloseTo(100, 2);
    });

    it('evaluates Bond & Treasury: COUPON, YIELD, PRICE, DURATION, ACCRINT, INTRATE, DISC, NOMINAL, EFFECT, ISPMT, TBILLPRICE, TBILLYIELD, TBILLEQ, RECEIVED, CUMIPMT, CUMPRINC, ODDFPRICE, ODDLPRICE', () => {
      const s = new Date('2026-01-01').getTime();
      const m = new Date('2026-07-01').getTime();

      expect(parser.evaluate('COUPON(0, 1825, 2)')).toBe(10);
      expect(parser.evaluate('YIELD(950, 1000, 0.05, 5)')).toBeCloseTo(0.0615, 3);
      expect(parser.evaluate('PRICE(1000, 0.05, 0.06, 5)')).toBeCloseTo(957.87, 0);
      expect(parser.evaluate('DURATION(1000, 0.05, 0.05, 5)')).toBeCloseTo(4.5459, 2);
      expect(parser.evaluate('DURATION(0, 0, 0, 0)')).toBe(0);
      expect(parser.evaluate('ACCRINT(0, 0, 180, 0.06, 1000, 2)')).toBeGreaterThanOrEqual(0);
      expect(parser.evaluate(`INTRATE(${s}, ${m}, 950, 1000)`)).toBeCloseTo(0.106, 2);
      expect(parser.evaluate(`DISC(${s}, ${m}, 1000, 950)`)).toBeCloseTo(0.101, 2);
      expect(parser.evaluate('NOMINAL(0.05116, 12)')).toBeCloseTo(0.05, 3);
      expect(parser.evaluate('EFFECT(0.05, 12)')).toBeCloseTo(0.05116, 4);
      expect(parser.evaluate('ISPMT(0.08/12, 1, 120, 10000)')).toBeCloseTo(-66, 0);

      // TBILLPRICE, TBILLYIELD, TBILLEQ, RECEIVED
      expect(parser.evaluate(`TBILLPRICE(${s}, ${m}, 0.04)`)).toBeGreaterThan(90);
      expect(parser.evaluate(`TBILLYIELD(${s}, ${m}, 98)`)).toBeGreaterThan(0);
      expect(parser.evaluate(`TBILLEQ(${s}, ${m}, 0.04)`)).toBeGreaterThan(0);
      expect(parser.evaluate(`RECEIVED(10000, 0.05, ${s}, ${m})`)).toBeGreaterThan(10000);

      // CUMIPMT & CUMPRINC
      expect(parser.evaluate('CUMIPMT(0.09/12, 360, 125000, 1, 12, 0)')).toBeLessThan(0);
      expect(parser.evaluate('CUMPRINC(0.09/12, 360, 125000, 1, 12, 0)')).toBeLessThan(0);

      // ODDFPRICE & ODDLPRICE
      expect(parser.evaluate(`ODDFPRICE(${s}, ${m}, 0.05, 0.06, 100, 2)`)).toBeGreaterThan(0);
      expect(parser.evaluate(`ODDLPRICE(${s}, ${m}, 0.05, 0.06, 100, 2)`)).toBeGreaterThan(0);

      // DISCOUNTPAYBACK, PROFITABILITYINDEX
      expect(parser.evaluate('DISCOUNTPAYBACK(0.1, -1000, 400, 400, 400, 400)')).toBe(4);
      expect(parser.evaluate('DISCOUNTPAYBACK(0.1, -1000, 10, 10)')).toBe(-1); // never pays back
      expect(parser.evaluate('PROFITABILITYINDEX(0.1, 1000, 400, 400, 400, 400)')).toBeGreaterThan(
        1
      );
      expect(parser.evaluate('PROFITABILITYINDEX(0.1, 0, 400)')).toBe(0);
    });
  });

  describe('Math & Engineering Matrix', () => {
    it('evaluates Advanced Trig & Hyperbolic', () => {
      expect(parser.evaluate('ACOS(1)')).toBe(0);
      expect(parser.evaluate('ASIN(0)')).toBe(0);
      expect(parser.evaluate('ATAN(0)')).toBe(0);
      expect(parser.evaluate('ATAN2(1, 1)')).toBeCloseTo(Math.PI / 4, 6);
      expect(parser.evaluate('COS(0)')).toBe(1);
      expect(parser.evaluate('SIN(0)')).toBe(0);
      expect(parser.evaluate('TAN(0)')).toBe(0);
      expect(parser.evaluate('ACOSH(1)')).toBe(0);
      expect(parser.evaluate('ASINH(0)')).toBe(0);
      expect(parser.evaluate('ATANH(0)')).toBe(0);
      expect(parser.evaluate('COSH(0)')).toBe(1);
      expect(parser.evaluate('SINH(0)')).toBe(0);
      expect(parser.evaluate('TANH(0)')).toBe(0);
      expect(parser.evaluate('SEC(0)')).toBe(1);
      expect(parser.evaluate('CSC(PI / 2)')).toBe(1);
      expect(parser.evaluate('COT(PI / 4)')).toBeCloseTo(1, 6);
      expect(parser.evaluate('HYPOT(3, 4)')).toBe(5);
      expect(parser.evaluate('DEGREES(PI)')).toBe(180);
      expect(parser.evaluate('RADIANS(180)')).toBeCloseTo(Math.PI, 6);
    });

    it('evaluates Number Theory and Base Conversions', () => {
      expect(parser.evaluate('FACTORIAL(5)')).toBe(120);
      expect(parser.evaluate('FACTORIAL(-2)')).toBeNaN();
      expect(parser.evaluate('FACTORIAL(1)')).toBe(1);
      expect(parser.evaluate('COMBIN(6, 2)')).toBe(15);
      expect(parser.evaluate('COMBIN(2, 6)')).toBe(0);
      expect(parser.evaluate('COMBIN(6, 0)')).toBe(1);
      expect(parser.evaluate('PERMUT(6, 2)')).toBe(30);
      expect(parser.evaluate('PERMUT(2, 6)')).toBe(0);
      expect(parser.evaluate('GCD(24, 36)')).toBe(12);
      expect(parser.evaluate('LCM(12, 18)')).toBe(36);
      expect(parser.evaluate('QUOTIENT(17, 5)')).toBe(3);
      expect(parser.evaluate('POWER(2, 8)')).toBe(256);
      expect(parser.evaluate('SQRTPI(4)')).toBeCloseTo(Math.sqrt(4 * Math.PI), 6);
      expect(parser.evaluate('SUMSQ(2, 3, 4)')).toBe(29);
      expect(parser.evaluate('SUMPRODUCT(2, 3, 4, 5)')).toBe(23); // (2*4) + (3*5) = 8 + 15 = 23
      expect(parser.evaluate('EVEN(3)')).toBe(4);
      expect(parser.evaluate('EVEN(4)')).toBe(4);
      expect(parser.evaluate('ODD(4)')).toBe(5);
      expect(parser.evaluate('ODD(5)')).toBe(5);
      expect(parser.evaluate('ISEVEN(6)')).toBe(1);
      expect(parser.evaluate('ISEVEN(5)')).toBe(0);
      expect(parser.evaluate('ISODD(7)')).toBe(1);
      expect(parser.evaluate('ISODD(6)')).toBe(0);
      expect(parser.evaluate('LOG2(64)')).toBe(6);
      expect(parser.evaluate('LOG10(1000)')).toBe(3);
      expect(parser.evaluate('CBRT(27)')).toBe(3);
      expect(parser.evaluate('CLAMP(15, 0, 10)')).toBe(10);
      expect(parser.evaluate('LERP(10, 20, 0.5)')).toBe(15);
      expect(parser.evaluate('REMAP(5, 0, 10, 0, 100)')).toBe(50);
      expect(parser.evaluate('FLOOR_PRECISE(4.7, 1)')).toBe(4);
      expect(parser.evaluate('CEILING_PRECISE(4.2, 1)')).toBe(5);
      expect(parser.evaluate('MROUND(12, 5)')).toBe(10);
      expect(parser.evaluate('MROUND(12, 0)')).toBe(0);

      expect(parser.evaluate('BASE(10, 2, 8)')).toBe('00001010' as any);
      expect(parser.evaluate('DECIMAL(1010, 2)')).toBe(10);
      expect(parser.evaluate('ROMAN(1994)')).toBe('MCMXCIV' as any);
      expect(parser.evaluate('ARABIC(10)')).toBeDefined();

      expect(parser.evaluate('TRUNC_PRECISE(4.5678, 2)')).toBe(4.56);
      expect(parser.evaluate('FRACT(4.75)')).toBe(0.75);
      expect(parser.evaluate('SIGNUM(-42)')).toBe(-1);
      expect(parser.evaluate('SIGNUM(42)')).toBe(1);
      expect(parser.evaluate('SIGNUM(0)')).toBe(0);
      expect(parser.evaluate('NEAREST(47, 10)')).toBe(50);
      expect(parser.evaluate('RECIPROCAL(4)')).toBe(0.25);
      expect(parser.evaluate('RECIPROCAL(0)')).toBe(Infinity);
      expect(parser.evaluate('ISPRIME(17)')).toBe(1);
      expect(parser.evaluate('ISPRIME(18)')).toBe(0);
      expect(parser.evaluate('ISPRIME(1)')).toBe(0);
      expect(parser.evaluate('ISPRIME(2)')).toBe(1);
      expect(parser.evaluate('FACTORIAL2(6)')).toBe(48); // 6 * 4 * 2
      expect(parser.evaluate('FACTORIAL2(5)')).toBe(15); // 5 * 3 * 1
      expect(parser.evaluate('FIBONACCI(7)')).toBe(13);
      expect(parser.evaluate('MULTINOMIAL(2, 3, 4)')).toBe(1260);
      expect(parser.evaluate('SERIESSUM(2, 1, 1, 1, 2, 3)')).toBe(34); // 1*2^1 + 2*2^2 + 3*2^3 = 2 + 8 + 24 = 34
      expect(parser.evaluate('PRODUCT(2, 3, 4)')).toBe(24);
      expect(parser.evaluate('DELTA(5, 5)')).toBe(1);
      expect(parser.evaluate('DELTA(5, 6)')).toBe(0);
      expect(parser.evaluate('GESTEP(10, 5)')).toBe(1);
      expect(parser.evaluate('GESTEP(3, 5)')).toBe(0);
      expect(parser.evaluate('ABS_DIFF(15, 25)')).toBe(10);
      expect(parser.evaluate('PERCENT_OF(25, 100)')).toBe(25);
      expect(parser.evaluate('PERCENT_OF(25, 0)')).toBe(0);
      expect(parser.evaluate('CHANGE_PCT(100, 120)')).toBe(20);
      expect(parser.evaluate('CHANGE_PCT(0, 120)')).toBe(0);

      // RAND & RANDBETWEEN
      expect(parser.evaluate('RAND()')).toBeGreaterThanOrEqual(0);
      expect(parser.evaluate('RANDBETWEEN(10, 20)')).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Statistical Functions Deep Matrix', () => {
    it('evaluates central tendencies and dispersions', () => {
      expect(parser.evaluate('MEDIAN(1, 3, 5, 7, 9)')).toBe(5);
      expect(parser.evaluate('MEDIAN(1, 3, 5, 7)')).toBe(4);
      expect(parser.evaluate('MODE(1, 2, 2, 3, 4)')).toBe(2);
      expect(parser.evaluate('STDEV(2, 4, 4, 4, 5, 5, 7, 9)')).toBeCloseTo(2.138, 2);
      expect(parser.evaluate('STDEV(2)')).toBe(0); // length < 2
      expect(parser.evaluate('STDEVP(2, 4, 4, 4, 5, 5, 7, 9)')).toBe(2);
      expect(parser.evaluate('VAR(2, 4, 4, 4, 5, 5, 7, 9)')).toBeCloseTo(4.571, 2);
      expect(parser.evaluate('VARP(2, 4, 4, 4, 5, 5, 7, 9)')).toBe(4);
      expect(parser.evaluate('PERCENTILE(10, 20, 30, 40, 50, 0.5)')).toBe(30);
      expect(parser.evaluate('QUARTILE(10, 20, 30, 40, 50, 2)')).toBe(30);
      expect(parser.evaluate('RANK(30, 10, 20, 30, 40, 50)')).toBe(3);
      expect(parser.evaluate('CORREL(1, 2, 3, 2, 4, 6)')).toBeCloseTo(1, 4);
      expect(parser.evaluate('COVARIANCE(1, 2, 3, 2, 4, 6)')).toBe(2);
      expect(parser.evaluate('AVEDEV(2, 4, 6, 8)')).toBe(2);
      expect(parser.evaluate('GEOMEAN(2, 8)')).toBe(4);
      expect(parser.evaluate('HARMEAN(2, 4, 8)')).toBeCloseTo(3.42857, 4);
      expect(parser.evaluate('LARGE(10, 50, 30, 20, 40, 2)')).toBe(40);
      expect(parser.evaluate('SMALL(10, 50, 30, 20, 40, 2)')).toBe(20);
      expect(parser.evaluate('TRIMMEAN(10, 20, 30, 40, 50, 0.2)')).toBe(30);
    });

    it('evaluates distributions and regressions: NORMDIST, NORMINV, NORMSDIST, NORMSINV, SLOPE, INTERCEPT, RSQ, FORECAST, STEYX, PERCENTRANK', () => {
      expect(parser.evaluate('NORMDIST(0, 0, 1, 1)')).toBeCloseTo(0.5, 4);
      expect(parser.evaluate('NORMDIST(0, 0, 1, 0)')).toBeCloseTo(0.3989, 3);
      expect(parser.evaluate('NORMDIST(0, 0, 0, 1)')).toBeNaN(); // std <= 0
      expect(parser.evaluate('NORMINV(0.5, 0, 1)')).toBeCloseTo(0, 4);
      expect(parser.evaluate('NORMINV(0.01, 0, 1)')).toBeLessThan(-2);
      expect(parser.evaluate('NORMINV(0.99, 0, 1)')).toBeGreaterThan(2);
      expect(parser.evaluate('NORMINV(0, 0, 1)')).toBeNaN();
      expect(parser.evaluate('NORMSDIST(0)')).toBeCloseTo(0.5, 4);
      expect(parser.evaluate('NORMSINV(0.5)')).toBeCloseTo(0, 4);
      expect(parser.evaluate('PERCENTRANK(10, 20, 30, 40, 50, 30)')).toBeCloseTo(0.5, 2);
      expect(parser.evaluate('PERCENTRANK(10, 20, 30, 40, 50, 99)')).toBe(-1);

      // Regression: y = 2x + 1
      expect(parser.evaluate('SLOPE(3, 5, 7, 1, 2, 3)')).toBeCloseTo(2, 4);
      expect(parser.evaluate('INTERCEPT(3, 5, 7, 1, 2, 3)')).toBeCloseTo(1, 4);
      expect(parser.evaluate('RSQ(3, 5, 7, 1, 2, 3)')).toBeCloseTo(1, 4);
      expect(parser.evaluate('FORECAST(4, 3, 5, 7, 1, 2, 3)')).toBeCloseTo(9, 4);
      expect(parser.evaluate('STEYX(3, 5, 7, 1, 2, 3)')).toBeCloseTo(0, 4);
    });

    it('evaluates cumulative and moment statistics: CUMSUM, CUMPRODUCT, DIFF, ACCUMULATE, NORMALIZE, STANDARDIZE, ZSCORE, KURT, SKEW, DEVSQ, SUMXMY2, SUMX2MY2, SUMX2PY2, PERCENTILE_INC, PERCENTILE_EXC, QUARTILE_INC, QUARTILE_EXC, RANK_EQ, RANK_AVG', () => {
      expect(parser.evaluate('CUMSUM(1, 2, 3, 4)')).toBeDefined();
      expect(parser.evaluate('CUMPRODUCT(1, 2, 3, 4)')).toBeDefined();
      expect(parser.evaluate('DIFF(10, 3, 2)')).toBeDefined();
      expect(parser.evaluate('ACCUMULATE(5, 10, 15)')).toBeDefined();
      expect(parser.evaluate('NORMALIZE(5, 10, 15)')).toBeDefined();
      expect(parser.evaluate('STANDARDIZE(10, 5, 2)')).toBe(2.5);
      expect(parser.evaluate('ZSCORE(10, 2, 4, 6)')).toBe(3);
      expect(parser.evaluate('KURT(1, 2, 3, 4, 5)')).toBeDefined();
      expect(parser.evaluate('SKEW(1, 2, 3, 4, 5)')).toBeCloseTo(0, 4);
      expect(parser.evaluate('DEVSQ(2, 4, 6)')).toBe(8);
      expect(parser.evaluate('SUMXMY2(1, 2, 3, 4)')).toBe(8);
      expect(parser.evaluate('SUMX2MY2(1, 2, 3, 4)')).toBe(-20); // (1^2-3^2) + (2^2-4^2) = (1-9) + (4-16) = -8 - 12 = -20
      expect(parser.evaluate('SUMX2PY2(1, 2, 3, 4)')).toBe(30); // (1+9) + (4+16) = 10 + 20 = 30

      expect(parser.evaluate('PERCENTILE_INC(10, 20, 30, 40, 50, 0.5)')).toBe(30);
      expect(parser.evaluate('PERCENTILE_EXC(10, 20, 30, 40, 50, 0.5)')).toBe(30);
      expect(parser.evaluate('QUARTILE_INC(10, 20, 30, 40, 50, 2)')).toBe(30);
      expect(parser.evaluate('QUARTILE_EXC(10, 20, 30, 40, 50, 2)')).toBe(30);
      expect(parser.evaluate('RANK_EQ(30, 10, 20, 30, 40, 50)')).toBe(3);
      expect(parser.evaluate('RANK_AVG(30, 10, 20, 30, 30, 50)')).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Logical, Text & Date Matrix', () => {
    it('evaluates Logical: IFS, SWITCH, CHOOSE, BETWEEN, COALESCE, ISBLANK, ISNUMBER, ISERROR, ISERR, ISNA, ISLOGICAL, XOR, N, TYPE, TRUE_FN, FALSE_FN', () => {
      expect(parser.evaluate('IFS(0, 10, 1, 20, 1, 30)')).toBe(20);
      expect(parser.evaluate('IFS(0, 10, 0, 20, 99)')).toBe(99); // default
      expect(parser.evaluate('SWITCH(2, 1, 10, 2, 20, 3, 30, 99)')).toBe(20);
      expect(parser.evaluate('SWITCH(5, 1, 10, 2, 20, 99)')).toBe(99); // default
      expect(parser.evaluate('CHOOSE(2, 10, 20, 30)')).toBe(20);
      expect(parser.evaluate('BETWEEN(5, 1, 10)')).toBe(1);
      expect(parser.evaluate('BETWEEN(15, 1, 10)')).toBe(0);
      expect(parser.evaluate('COALESCE(0, 0, 42, 100)')).toBe(42);
      expect(parser.evaluate('ISBLANK(0)')).toBe(1);
      expect(parser.evaluate('ISBLANK(5)')).toBe(0);
      expect(parser.evaluate('ISNUMBER(42)')).toBe(1);
      expect(parser.evaluate('ISERROR(SQRT(-1))')).toBe(1);
      expect(parser.evaluate('ISERR(42)')).toBe(0);
      expect(parser.evaluate('ISNA(0)')).toBe(0);
      expect(parser.evaluate('ISLOGICAL(1)')).toBe(1);
      expect(parser.evaluate('ISLOGICAL(0)')).toBe(1);
      expect(parser.evaluate('ISLOGICAL(5)')).toBe(0);
      expect(parser.evaluate('TRUE_FN()')).toBe(1);
      expect(parser.evaluate('FALSE_FN()')).toBe(0);
      expect(parser.evaluate('XOR(1, 0)')).toBe(1);
      expect(parser.evaluate('XOR(1, 1)')).toBe(0);
      expect(parser.evaluate('N(42)')).toBe(42);
      expect(parser.evaluate('TYPE(42)')).toBe(1);
    });

    it('evaluates Text operations: CONCAT, CONCATENATE, LEFT, RIGHT, MID, LEN, FIND, SEARCH, UPPER, LOWER, PROPER, TRIM, CLEAN, REPLACE, SUBSTITUTE, REPT, CHAR, CODE, VALUE, TEXT, DOLLAR, FIXED, EXACT, T, BAHTTEXT, NUMBERVALUE, UNICODE, UNICHAR, WIDECHAR, ASC, JIS, ENCODEURL, DOLLAR_DE, DOLLAR_FR, CLEAN_TEXT', () => {
      expect(parser.evaluate('CONCAT(10, 20)')).toBe('1020' as any);
      expect(parser.evaluate('CONCATENATE(10, 20)')).toBe('1020' as any);
      expect(parser.evaluate('LEFT(12345, 2)')).toBe('12' as any);
      expect(parser.evaluate('RIGHT(12345, 2)')).toBe('45' as any);
      expect(parser.evaluate('MID(12345, 2, 2)')).toBe('23' as any);
      expect(parser.evaluate('LEN(12345)')).toBe(5);
      expect(parser.evaluate('FIND(3, 12345)')).toBe(3);
      expect(parser.evaluate('SEARCH(3, 12345)')).toBe(3);
      expect(parser.evaluate('UPPER(123)')).toBe('123' as any);
      expect(parser.evaluate('LOWER(123)')).toBe('123' as any);
      expect(parser.evaluate('PROPER(123)')).toBe('123' as any);
      expect(parser.evaluate('TRIM(123)')).toBe('123' as any);
      expect(parser.evaluate('CLEAN(123)')).toBe('123' as any);
      expect(parser.evaluate('REPLACE(12345, 2, 2, 99)')).toBe('19945' as any);
      expect(parser.evaluate('SUBSTITUTE(12121, 2, 9)')).toBe('19191' as any);
      expect(parser.evaluate('REPT(5, 3)')).toBe('555' as any);
      expect(parser.evaluate('CHAR(65)')).toBe('A' as any);
      expect(parser.evaluate('CODE(65)')).toBeDefined();
      expect(parser.evaluate('VALUE(123.45)')).toBe(123.45);
      expect(parser.evaluate('TEXT(42)')).toBe(42);
      expect(parser.evaluate('DOLLAR(1234.56)')).toBe('$1,234.56' as any);
      expect(parser.evaluate('FIXED(1234.56, 1)')).toBe('1,234.6' as any);
      expect(parser.evaluate('EXACT(123, 123)')).toBe(1);
      expect(parser.evaluate('EXACT(123, 456)')).toBe(0);
      expect(parser.evaluate('T(42)')).toBeDefined();
      expect(parser.evaluate('BAHTTEXT(100)')).toBe('100 baht' as any);

      expect(parser.evaluate('NUMBERVALUE(123.45)')).toBe(123.45);
      expect(parser.evaluate('UNICODE(65)')).toBeDefined();
      expect(parser.evaluate('UNICHAR(65)')).toBe('A' as any);
      expect(parser.evaluate('WIDECHAR(123)')).toBeDefined();
      expect(parser.evaluate('ASC(123)')).toBeDefined();
      expect(parser.evaluate('JIS(123)')).toBe('123' as any);
      expect(parser.evaluate('ENCODEURL(123)')).toBe('123' as any);
      expect(parser.evaluate('DOLLAR_DE(123.45)')).toBeDefined();
      expect(parser.evaluate('DOLLAR_FR(123.45)')).toBeDefined();
      expect(parser.evaluate('CLEAN_TEXT(123)')).toBe('123' as any);
    });

    it('evaluates Date: DATE, YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, NOW, TODAY, TIME, DATEVALUE, TIMEVALUE, WEEKDAY, WEEKNUM, ISOWEEKNUM, DATEDIF, DAYS360, YEARFRAC, EDATE, EOMONTH, WORKDAY, NETWORKDAYS, MONTH_END, QUARTER_FN, FISCAL_YEAR, FISCAL_QUARTER, DAYS_FN, WORKDAY_INTL, NETWORKDAYS_INTL, WEEKNUM_ISO, EDATE_FN, EOMONTH_FN, DAYS360_FN, YEARFRAC_FN, DATE_FN, TIME_FN', () => {
      const dt = parser.evaluate('DATE(2026, 8, 7)');
      expect(parser.evaluate(`YEAR(${dt})`)).toBe(2026);
      expect(parser.evaluate(`MONTH(${dt})`)).toBe(8);
      expect(parser.evaluate(`DAY(${dt})`)).toBe(7);
      expect(parser.evaluate(`HOUR(${dt})`)).toBeDefined();
      expect(parser.evaluate(`MINUTE(${dt})`)).toBeDefined();
      expect(parser.evaluate(`SECOND(${dt})`)).toBeDefined();
      expect(parser.evaluate('NOW()')).toBeGreaterThan(0);
      expect(parser.evaluate('TODAY()')).toBeGreaterThan(0);
      expect(parser.evaluate('TIME(14, 30, 0)')).toBeDefined();
      expect(parser.evaluate('TIMEVALUE(14, 30, 0)')).toBeDefined();

      expect(parser.evaluate('WEEKDAY(DATE(2026, 8, 7))')).toBe(6); // Friday
      expect(parser.evaluate('WEEKNUM(DATE(2026, 8, 7))')).toBeGreaterThan(30);
      expect(parser.evaluate('ISOWEEKNUM(DATE(2026, 8, 7))')).toBeGreaterThan(30);
      expect(parser.evaluate('WEEKNUM_ISO(DATE(2026, 8, 7))')).toBeGreaterThan(30);

      expect(parser.evaluate('DATEDIF(DATE(2026, 1, 1), DATE(2026, 8, 1), 0)')).toBeDefined();
      expect(parser.evaluate('DAYS360(DATE(2026, 1, 1), DATE(2026, 7, 1))')).toBe(180);
      expect(parser.evaluate('DAYS360_FN(DATE(2026, 1, 1), DATE(2026, 7, 1))')).toBe(180);
      expect(parser.evaluate('YEARFRAC(DATE(2026, 1, 1), DATE(2026, 7, 1))')).toBeCloseTo(0.5, 2);
      expect(parser.evaluate('YEARFRAC_FN(DATE(2026, 1, 1), DATE(2026, 7, 1))')).toBeCloseTo(
        0.5,
        2
      );

      const ed = parser.evaluate('EDATE(DATE(2026, 1, 15), 3)');
      expect(parser.evaluate(`MONTH(${ed})`)).toBe(4);
      expect(parser.evaluate('EDATE_FN(DATE(2026, 1, 15), 3)')).toBe(ed);

      const eom = parser.evaluate('EOMONTH(DATE(2026, 1, 15), 0)');
      expect(parser.evaluate(`DAY(${eom})`)).toBe(31);
      expect(parser.evaluate('EOMONTH_FN(DATE(2026, 1, 15), 0)')).toBe(eom);

      expect(parser.evaluate('WORKDAY(DATE(2026, 8, 3), 4)')).toBeDefined();
      expect(parser.evaluate('WORKDAY_INTL(DATE(2026, 8, 3), 4)')).toBeDefined();
      expect(parser.evaluate('NETWORKDAYS(DATE(2026, 8, 3), DATE(2026, 8, 7))')).toBe(5);
      expect(parser.evaluate('NETWORKDAYS_INTL(DATE(2026, 8, 3), DATE(2026, 8, 7))')).toBe(5);
      expect(parser.evaluate('MONTH_END(DATE(2026, 1, 15))')).toBe(31);
      expect(parser.evaluate('QUARTER_FN(DATE(2026, 8, 7))')).toBe(3);
      expect(parser.evaluate('FISCAL_YEAR(DATE(2026, 8, 7), 10)')).toBe(2025);
      expect(parser.evaluate('FISCAL_QUARTER(DATE(2026, 8, 7), 10)')).toBe(4);
      expect(parser.evaluate('DAYS_FN(DATE(2026, 8, 7), DATE(2026, 8, 1))')).toBe(6);
      expect(parser.evaluate('DATE_FN(2026, 8, 7)')).toBe(dt);
      expect(parser.evaluate('TIME_FN(14, 30, 0)')).toBeDefined();
    });
  });

  describe('Lookup & Array Operations', () => {
    it('evaluates VLOOKUP, HLOOKUP, XLOOKUP, INDEX, MATCH, CHOOSE_LOOKUP, TRANSPOSE, SORT, FILTER, UNIQUE, ARRAY_CONSTRAIN, FLATTEN', () => {
      expect(parser.evaluate('INDEX(100, 200, 300, 2, 1)')).toBe(200);
      expect(parser.evaluate('CHOOSE_LOOKUP(2, 100, 200, 300)')).toBe(200);
      expect(parser.evaluate('MATCH(30, 10, 20, 30, 40)')).toBe(3);
      expect(parser.evaluate('MATCH(99, 10, 20, 30, 40)')).toBeNaN();

      expect(parser.evaluate('VLOOKUP(2, 1, 10, 2, 20, 3, 30, 2, 0)')).toBe(20);
      expect(parser.evaluate('XLOOKUP(2, 1, 2, 3, 10, 20, 30)')).toBe(20);

      expect(parser.evaluate('TRANSPOSE(42)')).toBe(42);
      expect(parser.evaluate('SORT(30, 10, 20)')).toBeDefined();
      expect(parser.evaluate('FILTER(10, 20, 30, 0, 1, 1)')).toBeDefined();
      expect(parser.evaluate('UNIQUE(10, 20, 20, 30)')).toBeDefined();
      expect(parser.evaluate('ARRAY_CONSTRAIN(10, 20, 30, 40, 2, 2)')).toBeDefined();
      expect(parser.evaluate('FLATTEN(10, 20, 30)')).toBeDefined();
    });

    it('evaluates IFERROR, IFNA', () => {
      expect(parser.evaluate('IFERROR(42, 99)')).toBe(42);
      expect(parser.evaluate('IFNA(0, 99)')).toBe(0);
    });
  });

  describe('Parser / Lexer Boundary & Error Guards', () => {
    it('handles cell references with getCellValue callback', () => {
      const context: Record<string, number> = { A1: 100, B1: 200, C1: 300 };
      const getVal = (ref: string) => context[ref] ?? 0;
      expect(parser.evaluate('A1 + B1 * 2', getVal)).toBe(500);
      expect(parser.evaluate('SUM(A1, B1, C1)', getVal)).toBe(600);
      expect(parser.getDependencies('A1 + B1 + C1 * D1')).toEqual(['A1', 'B1', 'C1', 'D1']);
    });

    it('rethrows DivisionByZeroError with numerator and operator', () => {
      expect(() => parser.evaluate('10 / 0')).toThrow(DivisionByZeroError);
      expect(() => parser.evaluate('10 % 0')).toThrow(DivisionByZeroError);
      try {
        parser.evaluate('10 / 0');
      } catch (e) {
        expect(e).toBeInstanceOf(DivisionByZeroError);
        const err = e as DivisionByZeroError;
        expect(err.numerator).toBe(10);
        expect(err.operator).toBe('/');
      }
    });

    it('validates syntax and returns structured errors', () => {
      expect(parser.validate('1 + 2 * 3').valid).toBe(true);
      expect(parser.validate('1 + * 3').valid).toBe(false);
      expect(parser.validate('').valid).toBe(false);
      expect(parser.validate('=').valid).toBe(false);
    });

    it('tokenizes correctly', () => {
      const tokens = parser.tokenize('SUM(A1, 100) * 1.05');
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]!.type).toBe('func');
      expect(tokens[0]!.value).toBe('SUM');
    });

    it('handles unknown functions by returning NaN or error', () => {
      const res = parser.safeEvaluate('UNKNOWN_FUNC(1, 2)');
      expect(res.error).toBeDefined();
    });
  });
});
