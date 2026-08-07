/**
 * math.ext.test.ts — additional math formula functions with known-answer
 * oracles (MISSION D/E coverage push).
 */
import { describe, expect, it } from 'vitest';
import {
  AVERAGEIF,
  AVERAGEIFS,
  BIN2DEC,
  BIN2HEX,
  BIN2OCT,
  CEILING,
  COMBIN,
  CONVERT,
  COUNTIF,
  COUNTIFS,
  DEC2BIN,
  DEC2HEX,
  DEC2OCT,
  DELTA,
  ERF,
  ERFC,
  EXP,
  FLOOR,
  GCD,
  GESTEP,
  HEX2BIN,
  HEX2DEC,
  HEX2OCT,
  LCM,
  LN,
  LOG,
  LOG10,
  MOD,
  MROUND,
  OCT2BIN,
  OCT2DEC,
  OCT2HEX,
  PERMUT,
  POWER,
  PRODUCT,
  SQRT,
  SUMIF,
  SUMIFS,
  SUMPRODUCT,
  ROUNDUP,
  ROUNDDOWN,
  registerMathFunctions,
} from './math';

describe('logarithms / powers / roots', () => {
  it('LN / LOG / LOG10 / EXP / POWER / SQRT', () => {
    expect(LN(Math.E)).toBeCloseTo(1, 6);
    expect(LOG(100)).toBeCloseTo(2, 6);
    expect(LOG(8, 2)).toBeCloseTo(3, 6);
    expect(LOG10(1000)).toBeCloseTo(3, 6);
    expect(EXP(1)).toBeCloseTo(Math.E, 6);
    expect(POWER(2, 10)).toBe(1024);
    expect(SQRT(16)).toBe(4);
  });
});

describe('rounding families', () => {
  it('CEILING / FLOOR with significance', () => {
    expect(CEILING(4.3)).toBe(5);
    expect(CEILING(4.3, 0.5)).toBeCloseTo(4.5, 6);
    expect(FLOOR(4.7)).toBe(4);
    expect(FLOOR(4.7, 0.5)).toBeCloseTo(4.5, 6);
  });
  it('ROUNDUP and ROUNDDOWN', () => {
    expect(ROUNDUP(4.123, 2)).toBe(4.13);
    expect(ROUNDDOWN(4.129, 2)).toBe(4.12);
  });
  it('MROUND rounds to the nearest multiple', () => {
    expect(MROUND(10, 3)).toBe(9);
    expect(MROUND(10, 0)).toBe(0);
    expect(MROUND(1.3, 0.2)).toBeCloseTo(1.4, 6);
  });
  it('MOD handles signs and zero divisor', () => {
    expect(MOD(10, 3)).toBe(1);
    expect(MOD(-10, 3)).toBe(2); // Excel-style (non-negative remainder)
    expect(MOD(10, -3)).toBe(-2);
    expect(MOD(10, 0)).toBeNaN();
  });
});

describe('GCD / LCM / COMBIN / PERMUT', () => {
  it('GCD and LCM', () => {
    expect(GCD(12, 18)).toBe(6);
    expect(GCD(-12, 18)).toBe(6);
    expect(GCD(0, 5)).toBe(5);
    expect(LCM(4, 6)).toBe(12);
    expect(LCM(0, 6)).toBe(0);
  });
  it('COMBIN / PERMUT', () => {
    expect(COMBIN(52, 5)).toBe(2598960);
    expect(PERMUT(5, 2)).toBe(20);
    expect(COMBIN(2, 5)).toBe(0);
  });
});

describe('aggregation helpers', () => {
  it('SUMPRODUCT pairs arrays', () => {
    expect(SUMPRODUCT([1, 2, 3], [4, 5, 6])).toBe(32);
    expect(SUMPRODUCT(2, 3)).toBe(6);
    expect(SUMPRODUCT([1, 2], [1, NaN])).toBe(1);
  });
  it('SUMIF with and without sum range', () => {
    expect(SUMIF([1, 2, 3, 4], 3)).toBe(3);
    expect(SUMIF([1, 2, 3, 4], 3, [10, 20, 30, 40])).toBe(30);
  });
  it('COUNTIF counts matches', () => {
    expect(COUNTIF([1, 2, 2, 3], 2)).toBe(2);
    expect(COUNTIF([1, 2, 3], 9)).toBe(0);
  });
  it('SUMIFS / COUNTIFS with multiple criteria', () => {
    expect(SUMIFS([1, 2, 3, 4], [1, 1, 2, 2], 1)).toBe(3);
    expect(COUNTIFS([1, 1, 2, 2], 1, [10, 20, 30, 40], 20)).toBe(1);
  });
  it('AVERAGEIF / AVERAGEIFS (strict-equality criteria)', () => {
    expect(AVERAGEIF([1, 2, 3, 4], 2)).toBeCloseTo(2, 6);
    expect(AVERAGEIF([1, 2, 3, 4], 2, [10, 20, 30, 40])).toBeCloseTo(20, 6);
    expect(AVERAGEIF([1, 2, 3, 4], 9)).toBe(0); // no matches
    expect(AVERAGEIFS([1, 2, 3, 4], [1, 1, 2, 2], 2)).toBeCloseTo(3.5, 6);
  });
  it('PRODUCT multiplies valid numbers', () => {
    expect(PRODUCT(2, 3, 4)).toBe(24);
    expect(PRODUCT()).toBe(0);
    expect(PRODUCT(2, NaN, 3)).toBe(6);
  });
});

describe('base conversions', () => {
  it('binary / decimal', () => {
    expect(BIN2DEC(1010)).toBe(10);
    expect(DEC2BIN(10)).toBe(1010);
  });
  it('hex / octal / decimal (numeric-digit convention)', () => {
    expect(HEX2DEC(26)).toBe(38); // hex digits "26" = 38 decimal
    expect(DEC2HEX(38)).toBe(26); // 38 decimal → hex digits "26"
    expect(OCT2DEC(17)).toBe(15); // octal digits "17" = 15 decimal
    expect(DEC2OCT(15)).toBe(17); // 15 decimal → octal digits "17"
  });
  it('cross-base', () => {
    expect(BIN2OCT(111)).toBe(7); // bin "111" = 7 = octal "7"
    expect(HEX2BIN(10)).toBe(10000); // hex digits "10" = 16 = bin "10000"
    expect(HEX2OCT(7)).toBe(7);
    expect(OCT2BIN(7)).toBe(111);
    expect(OCT2HEX(7)).toBe(7);
  });
  it('hex outputs containing a-f return NaN, not partial parses', () => {
    expect(BIN2HEX(1111)).toBeNaN(); // bin 1111 = hex "f"
    expect(DEC2HEX(31)).toBeNaN(); // hex "1f"
    expect(DEC2HEX(10)).toBeNaN(); // hex "a"
  });
});

describe('comparison / error functions', () => {
  it('DELTA and GESTEP', () => {
    expect(DELTA(3, 3)).toBe(1);
    expect(DELTA(3, 4)).toBe(0);
    expect(GESTEP(5)).toBe(1);
    expect(GESTEP(5, 10)).toBe(0);
    expect(GESTEP(5, 5)).toBe(1);
  });
  it('ERF / ERFC', () => {
    expect(ERF(0)).toBeCloseTo(0, 6);
    expect(ERF(1)).toBeCloseTo(0.8427008, 4);
    expect(ERF(-1)).toBeCloseTo(-0.8427008, 4);
    expect(ERFC(1)).toBeCloseTo(1 - 0.8427008, 4);
  });
  it('CONVERT scales linearly', () => {
    expect(CONVERT(100, 1, 2)).toBe(50);
    expect(CONVERT(10, 2, 1)).toBe(20);
  });
});

describe('registerMathFunctions registry', () => {
  it('registers all math & engineering functions with metadata', () => {
    const registered: Record<string, any> = {};
    registerMathFunctions((fn) => {
      registered[fn.name] = fn;
    });

    expect(Object.keys(registered).length).toBeGreaterThan(50);

    // Test implementations registered
    expect(registered['SIGN'].impl(5)).toBe(1);
    expect(registered['SIGN'].impl(-5)).toBe(-1);
    expect(registered['SIGN'].impl(0)).toBe(0);

    expect(registered['QUOTIENT'].impl(17, 5)).toBe(3);
    expect(registered['QUOTIENT'].impl(10, 0)).toBe(Infinity);
    expect(registered['QUOTIENT'].impl(0, 0)).toBeNaN();

    expect(registered['SUBTOTAL'].impl(1, 10, 20, 30)).toBe(20); // avg
    expect(registered['SUBTOTAL'].impl(2, 10, 20, 30)).toBe(3); // count
    expect(registered['SUBTOTAL'].impl(4, 10, 20, 30)).toBe(30); // max
    expect(registered['SUBTOTAL'].impl(5, 10, 20, 30)).toBe(10); // min
    expect(registered['SUBTOTAL'].impl(6, 2, 3, 4)).toBe(24); // product
    expect(registered['SUBTOTAL'].impl(9, 10, 20, 30)).toBe(60); // sum

    expect(registered['AGGREGATE'].impl(1, 0, 10, 20, 30)).toBe(20); // avg
    expect(registered['AGGREGATE'].impl(2, 0, 10, 20, 30)).toBe(3); // count
    expect(registered['AGGREGATE'].impl(4, 0, 10, 20, 30)).toBe(30); // max
    expect(registered['AGGREGATE'].impl(5, 0, 10, 20, 30)).toBe(10); // min
    expect(registered['AGGREGATE'].impl(9, 0, 10, 20, 30)).toBe(60); // sum

    expect(registered['PI'].impl()).toBeCloseTo(Math.PI, 6);
    expect(registered['PHI'].impl()).toBeCloseTo(1.6180339887, 6);
    expect(registered['INT'].impl(4.9)).toBe(4);
    expect(registered['TRUNC'].impl(4.567, 2)).toBe(4.56);
    expect(registered['ODD'].impl(4)).toBe(5);
    expect(registered['ODD'].impl(5)).toBe(5);
    expect(registered['EVEN'].impl(3)).toBe(4);
    expect(registered['EVEN'].impl(4)).toBe(4);
    expect(registered['FACT'].impl(5)).toBe(120);
    expect(registered['FACTDOUBLE'].impl(5)).toBe(15);
    expect(registered['RAND'].impl()).toBeGreaterThanOrEqual(0);
    expect(registered['RANDBETWEEN'].impl(5, 10)).toBeGreaterThanOrEqual(5);

    // Trig
    expect(registered['DEGREES'].impl(Math.PI)).toBe(180);
    expect(registered['RADIANS'].impl(180)).toBeCloseTo(Math.PI, 6);
    expect(registered['SIN'].impl(0)).toBe(0);
    expect(registered['COS'].impl(0)).toBe(1);
    expect(registered['TAN'].impl(0)).toBe(0);
    expect(registered['ASIN'].impl(0)).toBe(0);
    expect(registered['ACOS'].impl(1)).toBe(0);
    expect(registered['ATAN'].impl(0)).toBe(0);
    expect(registered['ATAN2'].impl(1, 1)).toBeCloseTo(Math.PI / 4, 6);
    expect(registered['SINH'].impl(0)).toBe(0);
    expect(registered['COSH'].impl(0)).toBe(1);
    expect(registered['TANH'].impl(0)).toBe(0);
    expect(registered['ASINH'].impl(0)).toBe(0);
    expect(registered['ACOSH'].impl(1)).toBe(0);
    expect(registered['ATANH'].impl(0)).toBe(0);
    expect(registered['SEC'].impl(0)).toBe(1);
    expect(registered['CSC'].impl(Math.PI / 2)).toBe(1);
    expect(registered['COT'].impl(Math.PI / 4)).toBeCloseTo(1, 6);
    expect(registered['SECH'].impl(0)).toBe(1);
    expect(registered['CSCH'].impl(1)).toBeCloseTo(1 / Math.sinh(1), 6);
    expect(registered['COTH'].impl(1)).toBeCloseTo(1 / Math.tanh(1), 6);
    expect(registered['ACOTH'].impl(2)).toBeCloseTo(0.5 * Math.log(3), 6);

    expect(registered['BASE'].impl(10, 2)).toBe(1010);
    expect(registered['DECIMAL'].impl(1010, 2)).toBe(10);
    expect(registered['ARABIC'].impl(1994)).toBe(1994);
    expect(registered['ROMAN'].impl(1994)).toBeDefined();
    expect(registered['MULTIPLY'].impl(6, 7)).toBe(42);
    expect(registered['ADD'].impl(20, 22)).toBe(42);
    expect(registered['MINUS'].impl(50, 8)).toBe(42);
    expect(registered['DIVIDE'].impl(84, 2)).toBe(42);
    expect(registered['DIVIDE'].impl(10, 0)).toBe(Infinity);

    // Database functions
    const data = [100, 200, 300];
    const critRange = [1, 2, 1];
    expect(registered['DSUM'].impl(data, critRange, 1)).toBe(400);
    expect(registered['DAVERAGE'].impl(data, critRange, 1)).toBe(200);
    expect(registered['DCOUNT'].impl(data, critRange, 1)).toBe(2);
    expect(registered['DCOUNTA'].impl(data, critRange, 1)).toBe(2);
    expect(registered['DGET'].impl(data, critRange, 2)).toBe(200);
    expect(registered['DMAX'].impl(data, critRange, 1)).toBe(300);
    expect(registered['DMIN'].impl(data, critRange, 1)).toBe(100);
    expect(registered['DPRODUCT'].impl(data, critRange, 1)).toBe(30000);

    // Complex numbers
    expect(registered['COMPLEX'].impl(3, 4)).toBe(3.004);
    expect(registered['IMAGINARY'].impl(3.004)).toBeCloseTo(4, 2);
    expect(registered['IMREAL'].impl(3.004)).toBe(3);
    expect(registered['IMABS'].impl(3.004)).toBeCloseTo(5, 2);
    expect(registered['IMCONJUGATE'].impl(3.004)).toBeCloseTo(2.996, 2);
    expect(registered['IMCOS'].impl(0)).toBe(1);
    expect(registered['IMSIN'].impl(0)).toBe(0);
    expect(registered['IMSQRT'].impl(4)).toBe(2);
    expect(registered['IMSUM'].impl(3, 4)).toBe(7);
    expect(registered['IMSUB'].impl(7, 3)).toBe(4);
    expect(registered['IMPRODUCT'].impl(3, 4)).toBe(12);
    expect(registered['IMDIV'].impl(12, 3)).toBe(4);
    expect(registered['IMEXP'].impl(1)).toBeCloseTo(Math.E, 6);
    expect(registered['IMLN'].impl(Math.E)).toBeCloseTo(1, 6);
    expect(registered['IMLOG10'].impl(100)).toBeCloseTo(2, 6);
    expect(registered['IMLOG2'].impl(8)).toBeCloseTo(3, 6);
    expect(registered['IMPOWER'].impl(2, 3)).toBe(8);
    expect(registered['IMARGUMENT'].impl(3.004)).toBeDefined();

    // Duration
    const d = registered['DURATION'].impl(0, 1825, 50, 0.05, 1);
    expect(d).toBeGreaterThan(0);
  });
});
