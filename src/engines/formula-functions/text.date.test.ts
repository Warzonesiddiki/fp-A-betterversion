/**
 * text.date.test.ts — date/time formula functions with known-answer oracles
 * (MISSION D, 2026-08-07). Serial numbers use the Excel 1900 date system
 * (serial 1 = 1900-01-01; the engines use the 1899-12-30 epoch offset).
 */
import { describe, expect, it } from 'vitest';
import {
  CODE,
  CHAR,
  DATEDIF,
  DATE,
  DAY,
  DAYS,
  DAYS360,
  EDATE,
  EOMONTH,
  EXACT,
  HOUR,
  ISOWEEKNUM,
  LEN,
  MINUTE,
  MONTH,
  N,
  NETWORKDAYS,
  SECOND,
  T,
  TEXT,
  TIME,
  VALUE,
  WEEKDAY,
  WEEKNUM,
  WORKDAY,
  YEAR,
  YEARFRAC,
} from './text';

// serial(2024-01-15) = days between 1899-12-30 and 2024-01-15
const serial = (y: number, m: number, d: number): number =>
  Math.floor((new Date(y, m - 1, d).getTime() - new Date(1899, 11, 30).getTime()) / 86400000);

describe('basic text helpers', () => {
  it('LEN counts digits', () => {
    expect(LEN(12345)).toBe(5);
    expect(LEN(0)).toBe(1);
  });
  it('CODE / CHAR round-trip', () => {
    expect(CODE(65)).toBe(65);
    expect(CHAR(65)).toBe(65);
    expect(CODE(CHAR(90))).toBe(90);
  });
  it('EXACT compares', () => {
    expect(EXACT(1, 1)).toBe(1);
    expect(EXACT(1, 2)).toBe(0);
  });
  it('T / N / VALUE are identity pass-throughs', () => {
    expect(T(42)).toBe(42);
    expect(N(-7)).toBe(-7);
    expect(VALUE(3.14)).toBeCloseTo(3.14);
  });
  it('TEXT formats per format string', () => {
    expect(TEXT(1234.56, '#,##0.00' as never)).toBeCloseTo(1234.56, 2);
    expect(TEXT(3.456, '0.00' as never)).toBeCloseTo(3.46, 2);
    expect(TEXT(2.5, '0.000' as never)).toBeCloseTo(2.5, 3);
  });
});

describe('DATE serial conversions', () => {
  it('DATE converts y/m/d to a serial number', () => {
    expect(DATE(2024, 1, 15)).toBe(serial(2024, 1, 15));
    expect(DATE(1900, 1, 1)).toBe(2); // Excel serial 2 (serial 1 is the phantom 1900-01-00)
    expect(DATE(2020, 2, 29)).toBe(serial(2020, 2, 29)); // leap day
  });
  it('YEAR / MONTH / DAY round-trip', () => {
    const s = serial(2024, 5, 17);
    expect(YEAR(s)).toBe(2024);
    expect(MONTH(s)).toBe(5);
    expect(DAY(s)).toBe(17);
    expect(YEAR(DATE(1999, 12, 31))).toBe(1999);
  });
  it('HOUR / MINUTE / SECOND split the fractional day', () => {
    expect(HOUR(TIME(13, 30, 45))).toBe(13);
    expect(MINUTE(TIME(13, 30, 45))).toBe(30);
    expect(SECOND(TIME(13, 30, 45))).toBe(45);
    expect(HOUR(TIME(23, 59, 59))).toBe(23);
  });
  it('TIME is a fraction of 24h', () => {
    expect(TIME(12, 0, 0)).toBeCloseTo(0.5, 6);
    expect(TIME(6, 0, 0)).toBeCloseTo(0.25, 6);
  });
});

describe('EOMONTH / EDATE', () => {
  it('EOMONTH returns the last day of the target month', () => {
    const jan15 = serial(2024, 1, 15);
    expect(YEAR(EOMONTH(jan15, 0))).toBe(2024);
    expect(MONTH(EOMONTH(jan15, 0))).toBe(1);
    expect(DAY(EOMONTH(jan15, 0))).toBe(31);
    // February of a leap year
    expect(DAY(EOMONTH(serial(2024, 1, 15), 1))).toBe(29);
    // across year boundary (Nov + 2 months = January)
    expect(MONTH(EOMONTH(serial(2024, 11, 10), 2))).toBe(1);
    expect(YEAR(EOMONTH(serial(2024, 11, 10), 2))).toBe(2025);
  });
  it('EDATE adds whole months keeping the day', () => {
    expect(EDATE(serial(2024, 1, 15), 3)).toBe(serial(2024, 4, 15));
    expect(EDATE(serial(2024, 1, 15), -1)).toBe(serial(2023, 12, 15));
    expect(EDATE(serial(2024, 1, 31), 1)).toBe(serial(2024, 2, 29));
  });
});

describe('DATEDIF / DAYS / DAYS360 / YEARFRAC', () => {
  const s1 = serial(2024, 1, 1);
  const s2 = serial(2024, 4, 10);
  it('DATEDIF in days / months / years', () => {
    expect(DATEDIF(s1, s2, 1)).toBe(100);
    expect(DATEDIF(s1, s2, 2)).toBe(3);
    expect(DATEDIF(serial(2020, 1, 1), serial(2024, 1, 1), 3)).toBe(4);
  });
  it('DAYS is the raw difference', () => {
    expect(DAYS(s1, s2)).toBe(100);
  });
  it('DAYS360 uses 30-day months', () => {
    expect(DAYS360(serial(2024, 1, 15), serial(2024, 3, 15))).toBe(60);
    expect(DAYS360(serial(2024, 1, 31), serial(2024, 2, 28))).toBe(28);
  });
  it('YEARFRAC is DAYS360/360', () => {
    expect(YEARFRAC(serial(2024, 1, 15), serial(2024, 7, 15))).toBeCloseTo(0.5, 4);
  });
});

describe('WEEKNUM / ISOWEEKNUM / WEEKDAY / NETWORKDAYS / WORKDAY', () => {
  it('WEEKDAY with default return type (1 = Sunday)', () => {
    // 2024-01-01 is a Monday
    expect(WEEKDAY(serial(2024, 1, 1))).toBe(2);
    // 2024-01-07 is a Sunday
    expect(WEEKDAY(serial(2024, 1, 7))).toBe(1);
    expect(WEEKDAY(serial(2024, 1, 5))).toBe(6); // Friday
  });
  it('WEEKDAY returnType 2 (1 = Monday)', () => {
    expect(WEEKDAY(serial(2024, 1, 1), 2)).toBe(1);
    expect(WEEKDAY(serial(2024, 1, 7), 2)).toBe(7);
  });
  it('WEEKDAY returnType 3 (0 = Monday)', () => {
    expect(WEEKDAY(serial(2024, 1, 1), 3)).toBe(0);
    expect(WEEKDAY(serial(2024, 1, 7), 3)).toBe(6);
  });
  it('WEEKNUM starts the year at 1', () => {
    expect(WEEKNUM(serial(2024, 1, 1))).toBe(1);
    expect(WEEKNUM(serial(2024, 12, 31))).toBeGreaterThan(50);
  });
  it('ISOWEEKNUM for known ISO weeks', () => {
    // 2024-01-01 is ISO week 1 (Monday)
    expect(ISOWEEKNUM(serial(2024, 1, 1))).toBe(1);
    // 2024-12-30 is ISO week 1 of 2025
    expect(ISOWEEKNUM(serial(2024, 12, 30))).toBe(1);
  });
  it('NETWORKDAYS excludes weekends', () => {
    // 2024-01-01 (Mon) .. 2024-01-07 (Sun) = 5 weekdays
    expect(NETWORKDAYS(serial(2024, 1, 1), serial(2024, 1, 7))).toBe(5);
    // A single Saturday → 0
    expect(NETWORKDAYS(serial(2024, 1, 6), serial(2024, 1, 6))).toBe(0);
  });
  it('WORKDAY adds business days', () => {
    // 2024-01-01 (Mon) + 1 business day = Tue 2024-01-02
    expect(WORKDAY(serial(2024, 1, 1), 1)).toBe(serial(2024, 1, 2));
    // + 5 business days from Monday lands on the next Monday
    expect(WORKDAY(serial(2024, 1, 1), 5)).toBe(serial(2024, 1, 8));
    // negative days go backwards
    expect(WORKDAY(serial(2024, 1, 8), -1)).toBe(serial(2024, 1, 5));
  });
});
