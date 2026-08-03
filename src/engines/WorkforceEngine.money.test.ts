/**
 * GAP-1 (F-0006) known-answer tests for WorkforceEngine's money migration.
 *
 * Compensation costs (salary, bonus, benefits, taxes, totalCost, equity) are currency.
 * Headcount/attrition counts and percentages stay float (measure-agnostic).
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is);
 * the pre-migration float literal is recorded inline where it differed.
 */

import { describe, it, expect } from 'vitest';
import { WorkforceEngine, type CompInput } from './WorkforceEngine';

describe('WorkforceEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('calculateCompCost (salary + bonus + equity + benefits + taxes via money)', () => {
    it('computes totalCost exactly (float gave 0.30000000000000004 on small sums)', () => {
      const input: CompInput = { salary: 0.1, bonusPct: 100, equityValue: 0, benefitsPct: 100, taxPct: 0 };
      const result = WorkforceEngine.calculateCompCost(input);
      expect(result.totalCost).toBe(0.3);
    });

    it('computes with taxes on (salary+bonus) exactly (float 0.28400000000000003 drift)', () => {
      const input: CompInput = { salary: 0.2, bonusPct: 10, equityValue: 0.01, benefitsPct: 5, taxPct: 20 };
      const result = WorkforceEngine.calculateCompCost(input);
      expect(result.totalCost).toBe(0.284);
    });

    it('handles zero equity and taxes (exact 0.15)', () => {
      const input: CompInput = { salary: 0.1, bonusPct: 50, equityValue: 0, benefitsPct: 0, taxPct: 0 };
      const result = WorkforceEngine.calculateCompCost(input);
      expect(result.totalCost).toBe(0.15);
    });

    it('rounds to cents (2dp) on realistic inputs', () => {
      const input: CompInput = { salary: 100000, bonusPct: 10, equityValue: 5000, benefitsPct: 8, taxPct: 22 };
      const result = WorkforceEngine.calculateCompCost(input);
      expect(result.totalCost).toBe(147200);
    });
  });
});
