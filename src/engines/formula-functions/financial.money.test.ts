/**
 * GAP-1 (F-0006) known-answer tests for the formula financial functions.
 *
 * These functions back the spreadsheet formula engine (registered via
 * FormulaFunctionRegistry, consumed by FormulaEngine). Money-producing
 * functions (P&L lines, NPV/PV/FV/PMT, depreciation, allocations, currency
 * conversion) now run through the canonical money primitive (decimal.js,
 * ROUND_HALF_UP) and round to cents; rate/metric functions (IRR, CAGR, YIELD,
 * duration, DPO/DSI/DSO days) are not money and keep float math. Each case is
 * a FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is);
 * the pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import {
  EBITDA,
  EBIT,
  NOPAT,
  FCFF,
  FCFE,
  NPV,
  PV,
  FV,
  PMT,
  SLN,
  CUMIPMT,
  XNPV,
  CONVERT_CURRENCY,
  TRANSLATE,
  ELIMINATE,
  FX_GAIN_LOSS,
  HYPERINFLATION_ADJUST,
  YTD,
  QTD,
  WEIGHTED_AVERAGE,
  ROLLING,
  ALLOCATE,
  SPREAD,
  DISTRIBUTE,
  PRO_RATA,
} from './financial';

describe('formula financial functions — money known answers (GAP-1 / F-0006)', () => {
  describe('P&L lines', () => {
    it('EBITDA subtracts exactly (float gave 0.09999999999999998)', () => {
      expect(EBITDA(0.3, 0.1, 0.1)).toBe(0.1);
    });

    it('EBIT subtracts exactly (float gave 0.19999999999999998)', () => {
      expect(EBIT(0.3, 0.1)).toBe(0.2);
    });

    it('NOPAT multiplies by the after-tax rate exactly (float gave 0.09000000000000001)', () => {
      expect(NOPAT(0.1, 0.1)).toBe(0.09);
    });

    it('FCFF nets the four terms exactly (float gave 0.20000000000000007)', () => {
      expect(FCFF(0.1, 0.2, 0.05, 0.05)).toBe(0.2);
    });

    it('FCFE adds exactly (float gave 0.30000000000000004)', () => {
      expect(FCFE(0.1, 0.2)).toBe(0.3);
    });
  });

  describe('time value of money', () => {
    it('NPV rounds to cents (float gave 281.8181818181818)', () => {
      expect(NPV(0.1, [100, 200])).toBe(281.82);
    });

    it('PV recovers the exact principal (float gave -10000.002291262748)', () => {
      expect(PV(0.05, 10, 0, 16288.95)).toBe(-10000);
    });

    it('FV rounds to cents (float gave 16288.946267774423)', () => {
      expect(FV(0.05, 10, 0, -10000)).toBe(16288.95);
    });

    it('PMT rounds to cents (float gave -536.8216230121398)', () => {
      expect(PMT(0.05 / 12, 360, 100000)).toBe(-536.82);
    });

    it('PMT zero-rate splits exactly', () => {
      expect(PMT(0, 12, 12000)).toBe(-1000);
    });

    it('XNPV rounds to cents (float gave 281.8181818181818)', () => {
      expect(XNPV(0.1, [100, 200], [0, 365.25])).toBe(281.82);
    });

    it('CUMIPMT sums per-period interest in cents (Excel: -353.89; broken impl gave +303.89)', () => {
      // PMT(5%,12,1000) = -112.82 × 12 = -1,353.90 total paid; interest = -353.90
      expect(CUMIPMT(0.05, 12, 1000, 1, 12, 0)).toBe(-353.89);
    });
  });

  describe('depreciation', () => {
    it('SLN is exact for whole-dollar assets', () => {
      expect(SLN(10000, 2000, 5)).toBe(1600);
    });

    it('SLN rounds fractional depreciation to cents', () => {
      expect(SLN(10000, 1000, 3)).toBe(3000);
    });
  });

  describe('currency', () => {
    it('CONVERT_CURRENCY multiplies exactly (float gave 0.30000000000000004)', () => {
      expect(CONVERT_CURRENCY(0.1, 3)).toBe(0.3);
    });

    it('TRANSLATE multiplies exactly', () => {
      expect(TRANSLATE(1000, 1.1)).toBe(1100);
    });

    it('ELIMINATE reduces by the percentage exactly (float gave 0.06999999999999999)', () => {
      expect(ELIMINATE(0.1, 0.3)).toBe(0.07);
    });

    it('FX_GAIN_LOSS computes the gain exactly', () => {
      expect(FX_GAIN_LOSS(1000, 1.0, 1.2)).toBe(200);
      expect(FX_GAIN_LOSS(1000, 1.2, 1.0)).toBe(-200);
    });

    it('HYPERINFLATION_ADJUST scales by the index ratio exactly (float gave 0.30000000000000004)', () => {
      expect(HYPERINFLATION_ADJUST(0.1, 30, 10)).toBe(0.3);
    });
  });

  describe('growth sums', () => {
    it('YTD sums exactly (float gave 0.6000000000000001)', () => {
      expect(YTD([0.1, 0.2, 0.3], 2)).toBe(0.6);
    });

    it('QTD sums exactly (float gave 0.6000000000000001)', () => {
      expect(QTD([0.1, 0.2, 0.3, 0.4, 0.5, 0.6], 0)).toBe(0.6);
    });

    it('WEIGHTED_AVERAGE divides exactly (float gave 0.15000000000000002)', () => {
      expect(WEIGHTED_AVERAGE([0.1, 0.2] as never, [1, 1] as never)).toBe(0.15);
    });

    it('ROLLING window averages are exact (float gave 0.15000000000000002)', () => {
      expect(ROLLING([0.1, 0.2, 0.3, 0.4], 2)).toEqual([0.15, 0.25, 0.35]);
    });
  });

  describe('allocation (full precision shares)', () => {
    it('ALLOCATE keeps full-precision shares (float gave 0.09999999999999999)', () => {
      expect(ALLOCATE(0.3, [1, 2])).toEqual([0.1, 0.2]);
    });

    it('ALLOCATE with whole dollars matches the historical contract', () => {
      expect(ALLOCATE(1000, [1, 2, 3])).toEqual([1000 / 6, 2000 / 6, 3000 / 6]);
    });

    it('SPREAD splits evenly', () => {
      expect(SPREAD(1200, 4)).toEqual([300, 300, 300, 300]);
    });

    it('DISTRIBUTE scales by shares exactly', () => {
      expect(DISTRIBUTE(0.3, [1, 2])).toEqual([0.1, 0.2]);
    });

    it('PRO_RATA allocates proportionally', () => {
      expect(PRO_RATA(1000, 30, 100)).toBe(300);
      expect(PRO_RATA(1000, 0, 100)).toBe(0);
    });
  });
});
