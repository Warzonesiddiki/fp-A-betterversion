/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { PMT, FV, PV, NPV, IRR, XIRR, SLN, DB } from './financial';

describe('Financial Functions', () => {
  describe('PMT (Payment)', () => {
    it('calculates monthly payment for standard loan', () => {
      // $100,000 loan at 5% for 30 years
      const result = PMT(0.05 / 12, 360, 100000);
      expect(result).toBeCloseTo(-536.82, 0);
    });

    it('calculates payment for zero interest', () => {
      const result = PMT(0, 12, 12000);
      expect(result).toBeCloseTo(-1000, 0);
    });

    it('handles negative principal (savings)', () => {
      const result = PMT(0.05 / 12, 120, -50000);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('FV (Future Value)', () => {
    it('calculates future value of lump sum', () => {
      const result = FV(0.05, 10, 0, -10000);
      expect(result).toBeCloseTo(16288.95, 0);
    });

    it('calculates future value of annuity', () => {
      const result = FV(0.05 / 12, 120, -500);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('PV (Present Value)', () => {
    it('calculates present value of future sum', () => {
      const result = PV(0.05, 10, 0, 16288.95);
      expect(result).toBeCloseTo(-10000, 0);
    });
  });

  describe('NPV (Net Present Value)', () => {
    it('calculates NPV for cash flows', () => {
      const result = NPV(0.1, [-10000, 3000, 4000, 5000, 6000] as any);
      expect(result).toBeGreaterThan(0);
    });

    it('returns negative NPV for bad investment', () => {
      const result = NPV(0.1, [-10000, 1000, 1000, 1000] as any);
      expect(result).toBeLessThan(0);
    });
  });

  describe('IRR (Internal Rate of Return)', () => {
    it('calculates IRR for standard cash flows', () => {
      const result = IRR([-10000, 3000, 4000, 5000, 6000] as any);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });
  });

  describe('SLN (Straight Line Depreciation)', () => {
    it('calculates annual depreciation', () => {
      const result = SLN(10000, 2000, 5);
      expect(result).toBeCloseTo(1600, 0);
    });
  });

  describe('DB (Declining Balance)', () => {
    it('calculates declining balance depreciation', () => {
      const result = DB(10000, 1000, 5, 1);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10000);
    });
  });
});

describe('IRR / XIRR degenerate-input contract (W6-P0-16)', () => {
  it('IRR returns NaN for empty cash flows', () => {
    expect(IRR([])).toBeNaN();
  });

  it('IRR returns NaN when flows have no sign change', () => {
    expect(IRR([100, 200])).toBeNaN();
  });

  it('IRR returns NaN for a single cash flow', () => {
    expect(IRR([-100])).toBeNaN();
  });

  it('converges for standard flows: IRR([-100, 60, 60]) near the analytic root', () => {
    // Root of -100 + 60/(1+r) + 60/(1+r)^2 = 0 is r = 1/((-3+sqrt(69))/6) - 1 ≈ 0.13066.
    expect(IRR([-100, 60, 60])).toBeCloseTo(0.13066, 4);
  });

  it('falls back to bisection when Newton yields zero derivative / non-finite candidate', () => {
    // guess = -1 makes the first Newton candidate non-finite; the true root is 20%.
    expect(IRR([-100, 120], -1)).toBeCloseTo(0.2, 6);
  });

  it('XIRR returns NaN for degenerate inputs', () => {
    expect(XIRR([], [])).toBeNaN();
    expect(XIRR([100, 200], [0, 365])).toBeNaN(); // no sign change
    expect(XIRR([-100, 50], [0])).toBeNaN(); // flow/date count mismatch
  });
});
