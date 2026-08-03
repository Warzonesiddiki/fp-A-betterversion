/**
 * GAP-1 (F-0006) known-answer tests for GoalSeekEngine's money migration.
 *
 * breakEven computes contribution margin, units, revenue from currency inputs.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`;
 * the pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect } from 'vitest';
import { GoalSeekEngine } from './GoalSeekEngine';

describe('GoalSeekEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('breakEven', () => {
    it('computes units and revenue exactly (float gave 2000.0000000000002 or 1999.9999999999998)', () => {
      const result = GoalSeekEngine.breakEven(100000, 50, 30);
      // contributionMargin = 20
      // units = 100000 / 20 = 5000
      // revenue = 5000 * 50 = 250000
      expect(result.valid).toBe(true);
      expect(result.units).toBe(5000);
      expect(result.revenue).toBe(250000);
    });

    it('computes exact break-even on small values without drift (float: 0.1 - 0.06 issues)', () => {
      const result = GoalSeekEngine.breakEven(10, 0.5, 0.4);
      // contributionMargin = 0.1
      // units = 10 / 0.1 = 100
      // revenue = 100 * 0.5 = 50
      expect(result.valid).toBe(true);
      expect(result.units).toBe(100);
      expect(result.revenue).toBe(50);
    });

    it('returns invalid when contribution margin <= 0 (no division by zero)', () => {
      const result = GoalSeekEngine.breakEven(1000, 10, 10);
      expect(result.valid).toBe(false);
      expect(result.units).toBe(0);
      expect(result.revenue).toBe(0);
    });

    it('returns invalid for negative contribution', () => {
      const result = GoalSeekEngine.breakEven(1000, 5, 10);
      expect(result.valid).toBe(false);
    });
  });
});
