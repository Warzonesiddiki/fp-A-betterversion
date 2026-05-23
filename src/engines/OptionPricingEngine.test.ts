import { describe, it, expect } from 'vitest';
import { OptionPricingEngine } from './OptionPricingEngine';

describe('OptionPricingEngine', () => {
  describe('blackScholes', () => {
    it('should price an at-the-money call', () => {
      const result = OptionPricingEngine.blackScholes(100, 100, 1, 0.05, 0.2, 'call');
      expect(result.price).toBeGreaterThan(0);
      expect(result.price).toBeLessThan(20);
    });

    it('should price an in-the-money call higher than out-of-money', () => {
      const itm = OptionPricingEngine.blackScholes(110, 100, 1, 0.05, 0.2, 'call');
      const otm = OptionPricingEngine.blackScholes(90, 100, 1, 0.05, 0.2, 'call');
      expect(itm.price).toBeGreaterThan(otm.price);
    });

    it('should price a put', () => {
      const result = OptionPricingEngine.blackScholes(100, 100, 1, 0.05, 0.2, 'put');
      expect(result.price).toBeGreaterThan(0);
    });

    it('should have call delta between 0 and 1', () => {
      const result = OptionPricingEngine.blackScholes(100, 100, 1, 0.05, 0.2, 'call');
      expect(result.delta).toBeGreaterThan(0);
      expect(result.delta).toBeLessThan(1);
    });

    it('should have put delta between -1 and 0', () => {
      const result = OptionPricingEngine.blackScholes(100, 100, 1, 0.05, 0.2, 'put');
      expect(result.delta).toBeGreaterThan(-1);
      expect(result.delta).toBeLessThan(0);
    });

    it('should have positive gamma', () => {
      const result = OptionPricingEngine.blackScholes(100, 100, 1, 0.05, 0.2, 'call');
      expect(result.gamma).toBeGreaterThan(0);
    });

    it('should have positive vega', () => {
      const result = OptionPricingEngine.blackScholes(100, 100, 1, 0.05, 0.2, 'call');
      expect(result.vega).toBeGreaterThan(0);
    });

    it('should handle expired option', () => {
      const result = OptionPricingEngine.blackScholes(110, 100, 0, 0.05, 0.2, 'call');
      expect(result.price).toBe(10);
      expect(result.gamma).toBe(0);
    });

    it('should handle zero volatility', () => {
      const result = OptionPricingEngine.blackScholes(110, 100, 1, 0.05, 0, 'call');
      expect(result.price).toBeGreaterThan(0);
    });
  });
});
