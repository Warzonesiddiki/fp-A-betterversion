/**
 * math.ext.test.ts — additional math formula functions with known-answer
 * oracles (MISSION D coverage push, 2026-08-07).
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
