import { describe, it, expect } from 'vitest';
import { FairValueEngine } from './FairValueEngine';

describe('FairValueEngine', () => {
  describe('classifyByLevel', () => {
    it('classifies Level 1 (quoted prices)', () => {
      const result = FairValueEngine.classifyByLevel('quoted_market_price');
      expect(result).toBe(1);
    });

    it('classifies Level 2 (observable inputs)', () => {
      const result = FairValueEngine.classifyByLevel('observable_input');
      expect(result).toBe(2);
    });

    it('classifies Level 3 (unobservable)', () => {
      const result = FairValueEngine.classifyByLevel('unobservable');
      expect(result).toBe(3);
    });
  });

  describe('calculateFairValue', () => {
    it('calculates fair value with discount', () => {
      const result = FairValueEngine.calculateFairValue(1000, 0.1, 5);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1000);
    });

    it('handles zero discount rate', () => {
      const result = FairValueEngine.calculateFairValue(1000, 0, 5);
      expect(result).toBe(1000);
    });
  });
});
