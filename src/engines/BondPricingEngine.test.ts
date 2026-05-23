import { describe, it, expect } from 'vitest';
import { BondPricingEngine } from './BondPricingEngine';

describe('BondPricingEngine', () => {
  describe('price', () => {
    it('should price a bond at par when coupon equals YTM', () => {
      const price = BondPricingEngine.price(1000, 0.05, 0.05, 10);
      expect(price).toBeCloseTo(1000, 0);
    });

    it('should price above par when coupon > YTM', () => {
      const price = BondPricingEngine.price(1000, 0.08, 0.05, 10);
      expect(price).toBeGreaterThan(1000);
    });

    it('should price below par when coupon < YTM', () => {
      const price = BondPricingEngine.price(1000, 0.03, 0.05, 10);
      expect(price).toBeLessThan(1000);
    });

    it('should handle zero YTM', () => {
      const price = BondPricingEngine.price(1000, 0.05, 0, 10);
      expect(price).toBe(1500);
    });

    it('should handle single period', () => {
      const price = BondPricingEngine.price(1000, 0.05, 0.05, 1);
      expect(price).toBeCloseTo(1000, 0);
    });
  });

  describe('yieldToMaturity', () => {
    it('should find YTM for par bond', () => {
      const ytm = BondPricingEngine.yieldToMaturity(1000, 1000, 0.05, 10);
      expect(ytm).toBeCloseTo(0.05, 3);
    });

    it('should find YTM for discount bond', () => {
      const ytm = BondPricingEngine.yieldToMaturity(900, 1000, 0.05, 10);
      expect(ytm).toBeGreaterThan(0.05);
    });

    it('should find YTM for premium bond', () => {
      const ytm = BondPricingEngine.yieldToMaturity(1100, 1000, 0.05, 10);
      expect(ytm).toBeLessThan(0.05);
    });
  });

  describe('duration', () => {
    it('should return positive duration', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur.macaulay).toBeGreaterThan(0);
      expect(dur.modified).toBeGreaterThan(0);
    });

    it('should have modified duration less than macaulay', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur.modified).toBeLessThanOrEqual(dur.macaulay);
    });

    it('should have convexity > 0', () => {
      const dur = BondPricingEngine.duration(1000, 0.05, 0.05, 10);
      expect(dur.convexity).toBeGreaterThan(0);
    });

    it('should have shorter duration for shorter maturity', () => {
      const short = BondPricingEngine.duration(1000, 0.05, 0.05, 5);
      const long = BondPricingEngine.duration(1000, 0.05, 0.05, 20);
      expect(short.macaulay).toBeLessThan(long.macaulay);
    });
  });
});
