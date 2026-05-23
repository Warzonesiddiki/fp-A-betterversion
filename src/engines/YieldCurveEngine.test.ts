import { describe, it, expect } from 'vitest';
import { YieldCurveEngine } from './YieldCurveEngine';

describe('YieldCurveEngine', () => {
  describe('bootstrap', () => {
    it('should return sorted curve', () => {
      const result = YieldCurveEngine.bootstrap([
        { maturity: 5, rate: 0.03 },
        { maturity: 1, rate: 0.01 },
        { maturity: 10, rate: 0.04 },
      ]);
      expect(result[0].maturity).toBe(1);
      expect(result[1].maturity).toBe(5);
      expect(result[2].maturity).toBe(10);
    });

    it('should preserve rates', () => {
      const result = YieldCurveEngine.bootstrap([
        { maturity: 1, rate: 0.02 },
        { maturity: 5, rate: 0.03 },
      ]);
      expect(result[0].rate).toBe(0.02);
      expect(result[1].rate).toBe(0.03);
    });

    it('should handle single point', () => {
      const result = YieldCurveEngine.bootstrap([{ maturity: 5, rate: 0.03 }]);
      expect(result).toHaveLength(1);
    });
  });

  describe('interpolate', () => {
    it('should interpolate linearly between points', () => {
      const curve = [
        { maturity: 1, rate: 0.02 },
        { maturity: 5, rate: 0.04 },
      ];
      const rate = YieldCurveEngine.interpolate(3, curve);
      expect(rate).toBeCloseTo(0.03, 4);
    });

    it('should return first rate for early maturity', () => {
      const curve = [
        { maturity: 2, rate: 0.02 },
        { maturity: 5, rate: 0.04 },
      ];
      const rate = YieldCurveEngine.interpolate(1, curve);
      expect(rate).toBe(0.02);
    });

    it('should return last rate for late maturity', () => {
      const curve = [
        { maturity: 1, rate: 0.02 },
        { maturity: 5, rate: 0.04 },
      ];
      const rate = YieldCurveEngine.interpolate(10, curve);
      expect(rate).toBe(0.04);
    });

    it('should return exact rate at point', () => {
      const curve = [
        { maturity: 1, rate: 0.02 },
        { maturity: 5, rate: 0.04 },
      ];
      const rate = YieldCurveEngine.interpolate(5, curve);
      expect(rate).toBeCloseTo(0.04, 6);
    });

    it('should return 0 for empty curve', () => {
      expect(YieldCurveEngine.interpolate(5, [])).toBe(0);
    });
  });
});
