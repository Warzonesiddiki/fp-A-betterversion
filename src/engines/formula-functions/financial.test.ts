/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { PMT, FV, PV, NPV, IRR, SLN, DB } from './financial';

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
      const result = NPV(0.1, [-10000, 3000, 4000, 5000, 6000]);
      expect(result).toBeGreaterThan(0);
    });

    it('returns negative NPV for bad investment', () => {
      const result = NPV(0.1, [-10000, 1000, 1000, 1000]);
      expect(result).toBeLessThan(0);
    });
  });

  describe('IRR (Internal Rate of Return)', () => {
    it('calculates IRR for standard cash flows', () => {
      const result = IRR([-10000, 3000, 4000, 5000, 6000]);
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
