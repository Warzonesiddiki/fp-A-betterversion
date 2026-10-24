import { describe, it, expect } from 'vitest';
import { BondPricingEngine } from './BondPricingEngine';

/**
 * GOVERNANCE EVIDENCE for cap:treasury.bond-pricing
 *
 * The BondPricingEngine computes bond prices, yield to maturity, Macaulay
 * and modified duration, convexity, accrued interest, and dirty/clean prices.
 * The governance dimension here is PRICING ACCURACY — bond prices feed
 * treasury reporting and investment decisions. Bond prices and accrued
 * interest are money (decimal.js, ROUND_HALF_UP); YTM, duration, and
 * convexity are rate metrics computed from Decimal-precision intermediates.
 *
 * Tested dimensions:
 * 1. Bond pricing
 * 2. Yield to maturity
 * 3. Duration (Macaulay, modified, convexity)
 * 4. Accrued interest
 * 5. Dirty/clean price
 * 6. Money primitive safety
 * 7. Determinism
 */

describe('BondPricingEngine — GOVERNANCE (treasury.bond-pricing)', () => {

  describe('1. Bond pricing', () => {

    it('price returns a positive amount for a par bond', () => {
      const price = BondPricingEngine.price(1000, 0.05, 0.05, 10);
      expect(price).toBeCloseTo(1000, 2);
    });

    it('price returns a discount for YTM > coupon rate', () => {
      const price = BondPricingEngine.price(1000, 0.03, 0.05, 10);
      expect(price).toBeLessThan(1000);
    });

    it('price returns a premium for YTM < coupon rate', () => {
      const price = BondPricingEngine.price(1000, 0.07, 0.05, 10);
      expect(price).toBeGreaterThan(1000);
    });

    it('price handles zero coupon bonds', () => {
      const price = BondPricingEngine.price(1000, 0, 0.05, 10);
      expect(price).toBeGreaterThan(0);
      expect(price).toBeLessThan(1000);
    });

    it('price handles single-period bonds', () => {
      const price = BondPricingEngine.price(1000, 0.05, 0.05, 1);
      expect(price).toBeCloseTo(1000, 2);
    });
  });

  describe('2. Yield to maturity', () => {

    it('yieldToMaturity returns YTM close to coupon rate for par bond', () => {
      const ytm = BondPricingEngine.yieldToMaturity(1000, 1000, 0.05, 10);
      expect(ytm).toBeCloseTo(0.05, 4);
    });

    it('yieldToMaturity returns higher YTM for discount bond', () => {
      const ytm = BondPricingEngine.yieldToMaturity(900, 1000, 0.05, 10);
      expect(ytm).toBeGreaterThan(0.05);
    });

    it('yieldToMaturity returns lower YTM for premium bond', () => {
      const ytm = BondPricingEngine.yieldToMaturity(1100, 1000, 0.05, 10);
      expect(ytm).toBeLessThan(0.05);
    });
  });

  describe('3. Duration', () => {

    it('duration returns Macaulay, modified, and convexity', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur).toBeDefined();
      expect(dur.macaulay).toBeDefined();
      expect(dur.modified).toBeDefined();
      expect(dur.convexity).toBeDefined();
    });

    it('Macaulay duration is positive and less than periods', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur.macaulay).toBeGreaterThan(0);
      expect(dur.macaulay).toBeLessThan(10);
    });

    it('Modified duration is less than Macaulay duration', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur.modified).toBeLessThan(dur.macaulay);
    });

    it('Convexity is positive', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur.convexity).toBeGreaterThan(0);
    });
  });

  describe('4. Accrued interest', () => {

    it('accruedInterest computes interest proportional to days', () => {
      const ai = BondPricingEngine.accruedInterest(1000, 0.05, 30, 180);
      expect(ai).toBeCloseTo(8.33, 2);
    });

    it('accruedInterest returns 0 for zero days since coupon', () => {
      const ai = BondPricingEngine.accruedInterest(1000, 0.05, 0, 180);
      expect(ai).toBe(0);
    });

    it('accruedInterest returns full coupon for full period', () => {
      const ai = BondPricingEngine.accruedInterest(1000, 0.05, 180, 180);
      expect(ai).toBeCloseTo(50, 2);
    });
  });

  describe('5. Dirty/clean price', () => {

    it('dirtyPrice equals cleanPrice plus accrued interest', () => {
      const dp = BondPricingEngine.dirtyPrice(980, 1000, 0.05, 30, 180);
      const ai = BondPricingEngine.accruedInterest(1000, 0.05, 30, 180);
      expect(dp).toBeCloseTo(980 + ai, 2);
    });

    it('dirtyPrice is always >= cleanPrice', () => {
      const dp = BondPricingEngine.dirtyPrice(980, 1000, 0.05, 30, 180);
      expect(dp).toBeGreaterThanOrEqual(980);
    });
  });

  describe('6. Money primitive safety', () => {

    it('price uses decimal arithmetic for large face values', () => {
      const price = BondPricingEngine.price(999999999, 0.05, 0.05, 10);
      expect(price).toBeGreaterThan(0);
    });

    it('accruedInterest handles small fractional amounts', () => {
      const ai = BondPricingEngine.accruedInterest(0.01, 0.05, 1, 365);
      expect(ai).toBeCloseTo(0, 4);
    });
  });

  describe('7. Determinism', () => {

    it('price is deterministic', () => {
      const r1 = BondPricingEngine.price(1000, 0.05, 0.05, 10);
      const r2 = BondPricingEngine.price(1000, 0.05, 0.05, 10);
      expect(r1).toBe(r2);
    });

    it('yieldToMaturity is deterministic', () => {
      const r1 = BondPricingEngine.yieldToMaturity(1000, 1000, 0.05, 10);
      const r2 = BondPricingEngine.yieldToMaturity(1000, 1000, 0.05, 10);
      expect(r1).toBeCloseTo(r2, 6);
    });

    it('duration is deterministic', () => {
      const r1 = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      const r2 = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(r1).toEqual(r2);
    });
  });
});
