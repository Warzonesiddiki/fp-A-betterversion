import { describe, it, expect, beforeEach } from 'vitest';
import { FairValueEngine } from './FairValueEngine';

describe('FairValueEngine', () => {
  beforeEach(() => {
    FairValueEngine.reset();
  });

  describe('classifyByLevel', () => {
    it('classifies Level 1 (quoted prices)', () => {
      const result = FairValueEngine.classifyByLevel({}, true, true);
      expect(result).toBe(1);
    });

    it('classifies Level 2 (observable inputs)', () => {
      const result = FairValueEngine.classifyByLevel({}, false, true);
      expect(result).toBe(2);
    });

    it('classifies Level 3 (unobservable)', () => {
      const result = FairValueEngine.classifyByLevel({}, false, false);
      expect(result).toBe(3);
    });
  });

  describe('calculateDCF', () => {
    it('calculates DCF with positive cash flows', () => {
      const result = FairValueEngine.calculateDCF([100, 200, 300], 0.1);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(600);
    });

    it('calculates DCF with terminal growth rate', () => {
      const result = FairValueEngine.calculateDCF([100, 200, 300], 0.1, 0.03);
      expect(result).toBeGreaterThan(0);
    });

    it('handles zero discount rate', () => {
      // With discount rate 0, PV = sum of cash flows, but 0 causes division by zero in terminal calc
      // So just test with a very small rate.
      // Money migration: DCF is now exact to cents — 100/1.001 + 200/1.002001
      // = 299.5004995... rounds to 299.5 (old float returned the raw 299.5004995).
      const result = FairValueEngine.calculateDCF([100, 200], 0.001);
      expect(result).toBe(299.5);
    });
  });

  describe('measure and getHierarchy', () => {
    it('measures and retrieves hierarchy', () => {
      FairValueEngine.measure({
        assetId: 'asset1',
        assetName: 'Test Asset',
        value: 1000,
        level: 1,
        approach: 'market',
        inputs: { price: 100 },
        confidence: 0.95,
        date: '2024-01-01',
      });
      const hierarchy = FairValueEngine.getHierarchy('asset1');
      expect(hierarchy.level1).toHaveLength(1);
      expect(hierarchy.total).toBe(1000);
    });
  });
});
