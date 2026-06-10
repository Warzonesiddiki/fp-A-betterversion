import { describe, it, expect } from 'vitest';
import {
  roundToCents,
  roundToDecimals,
  safeMultiply,
  safeDivide,
  areClose,
  roundToTotal,
  toFixedSafe,
  parseFinite,
} from './decimalUtils';

describe('roundToCents', () => {
  it('rounds 1.005 to 1.01 not 1.00', () => {
    expect(roundToCents(1.005)).toBe(1.01);
  });

  it('rounds 2.675 to 2.68 not 2.67', () => {
    expect(roundToCents(2.675)).toBe(2.68);
  });

  it('rounds 0.1 + 0.2 to 0.3', () => {
    expect(roundToCents(0.1 + 0.2)).toBe(0.3);
  });

  it('handles negative values', () => {
    expect(roundToCents(-1.005)).toBe(-1.01);
  });

  it('handles zero', () => {
    expect(roundToCents(0)).toBe(0);
  });
});

describe('roundToDecimals', () => {
  it('rounds to 2 decimals', () => {
    expect(roundToDecimals(1.005, 2)).toBe(1.01);
  });

  it('rounds to 0 decimals', () => {
    expect(roundToDecimals(1.5, 0)).toBe(2);
  });

  it('rounds to 4 decimals', () => {
    expect(roundToDecimals(0.12345, 4)).toBe(0.1235);
  });
});

describe('safeMultiply', () => {
  it('multiplies and rounds to cents', () => {
    expect(safeMultiply(0.1, 0.2)).toBe(0.02);
  });

  it('multiplies 100.01 * 3 = 300.03', () => {
    expect(safeMultiply(100.01, 3)).toBe(300.03);
  });

  it('handles large numbers', () => {
    expect(safeMultiply(1e15, 1e15)).toBe(1e30);
  });
});

describe('safeDivide', () => {
  it('divides and rounds to cents', () => {
    expect(safeDivide(1, 3, 2)).toBe(0.33);
  });

  it('returns 0 for zero denominator', () => {
    expect(safeDivide(1, 0)).toBe(0);
  });

  it('divides evenly', () => {
    expect(safeDivide(10, 2)).toBe(5);
  });
});

describe('areClose', () => {
  it('detects 0.1+0.2 = 0.3 within epsilon', () => {
    expect(areClose(0.1 + 0.2, 0.3)).toBe(true);
  });

  it('detects different values', () => {
    expect(areClose(0.1, 0.2)).toBe(false);
  });

  it('works with custom tolerance', () => {
    expect(areClose(1.0, 1.01, 0.1)).toBe(true);
    expect(areClose(1.0, 1.01, 0.001)).toBe(false);
  });
});

describe('roundToTotal', () => {
  it('distributes rounding to preserve total', () => {
    const amounts = [0.1, 0.1, 0.1];
    const result = roundToTotal(amounts, 0.3);
    const sum = result.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(0.3, 10);
  });

  it('handles whole cents exactly', () => {
    const amounts = [1.0, 2.0, 3.0];
    const result = roundToTotal(amounts, 6.0);
    expect(result).toEqual([1.0, 2.0, 3.0]);
  });

  it('handles rounding 0.125 + 0.125 + 0.125 to 0.38', () => {
    const result = roundToTotal([0.125, 0.125, 0.125], 0.375);
    const sum = result.reduce((s, v) => s + v, 0);
    expect(sum).toBeCloseTo(0.375, 10);
  });
});

describe('toFixedSafe', () => {
  it('formats 1.005 as "1.01" not "1.00"', () => {
    expect(toFixedSafe(1.005, 2)).toBe('1.01');
  });

  it('formats 0.1+0.2 as "0.30"', () => {
    expect(toFixedSafe(0.1 + 0.2, 2)).toBe('0.30');
  });
});

describe('parseFinite', () => {
  it('parses valid number', () => {
    expect(parseFinite('42.5')).toBe(42.5);
  });

  it('returns fallback for invalid', () => {
    expect(parseFinite('abc')).toBe(0);
  });

  it('uses custom fallback', () => {
    expect(parseFinite('', -1)).toBe(-1);
  });

  it('handles Infinity', () => {
    expect(parseFinite('Infinity')).toBe(0);
  });
});
