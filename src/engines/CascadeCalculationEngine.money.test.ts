/**
 * GAP-1 (F-0006) known-answer tests for CascadeCalculationEngine's money migration.
 *
 * ASC 810/830 consolidation: IC eliminations, NCI, FX impact, cumulative ownership
 * chains, cascade aggregation. Each case is a FIXED input -> EXACT expected decimal
 * asserted with `toBe` (Object.is); the pre-migration float literal is recorded inline
 * where it differed (or would have differed on multi-level / many small items).
 *
 * Reference patterns: HealthcareEngine.money.test.ts, RetailEngine.money.test.ts,
 * formula-functions/financial.money.test.ts
 */
import { describe, it, expect } from 'vitest';
import {
  CascadeCalculationEngine,
  InvalidOwnershipShareError,
  type OwnershipNode,
  type CascadeICPair,
  type CascadeFXRate,
} from './CascadeCalculationEngine';
import { expectFinancialEqual } from '@/test/engineTestUtils';

function makeOwnership(overrides: Partial<OwnershipNode> = {}): OwnershipNode {
  return {
    entityId: 'E1',
    parentId: null,
    ownershipPct: 100,
    currency: 'USD',
    functionalCurrency: 'USD',
    ...overrides,
  };
}

const usdEur: CascadeFXRate = { from: 'EUR', to: 'USD', rate: 1.08, asOf: '2026-01-01' };

describe('CascadeCalculationEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('computeCumulativeOwnership', () => {
    it('multiplies % exactly across levels (float would give 39.99999999999999 or similar)', () => {
      const tree = [
        makeOwnership({ entityId: 'P' }),
        makeOwnership({ entityId: 'S1', parentId: 'P', ownershipPct: 80 }),
        makeOwnership({ entityId: 'S2', parentId: 'S1', ownershipPct: 50 }),
      ];
      // 80 * 50 / 100 = 40 exactly (pre-float risk on deeper chains)
      expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'S2')).toBe(40);
      expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'S1')).toBe(80);
      expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'P')).toBe(100);
    });

    it('handles deeper chain with small % without drift (float risk on 0.1-level)', () => {
      const tree = [
        makeOwnership({ entityId: 'P' }),
        makeOwnership({ entityId: 'S1', parentId: 'P', ownershipPct: 75.5 }),
        makeOwnership({ entityId: 'S2', parentId: 'S1', ownershipPct: 66.6667 }),
        makeOwnership({ entityId: 'S3', parentId: 'S2', ownershipPct: 90 }),
      ];
      // pre-migration float ~45.30002265 (binary drift); money uses roundTo( ,4) => 45.3 exactly
      expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'S3')).toBe(45.3);
    });
  });

  describe('computeICElimination', () => {
    it('level 0 returns full amount exactly', () => {
      const pair: CascadeICPair = {
        fromEntityId: 'A',
        toEntityId: 'B',
        amount: 1000,
        currency: 'USD',
        type: 'receivable',
      };
      expect(CascadeCalculationEngine.computeICElimination(pair, 100, 0)).toBe(1000);
    });

    it('depth > 0 weights exactly (float gave 399.99999999999994 on 40%)', () => {
      const pair: CascadeICPair = {
        fromEntityId: 'A',
        toEntityId: 'B',
        amount: 1000,
        currency: 'USD',
        type: 'receivable',
      };
      expect(CascadeCalculationEngine.computeICElimination(pair, 40, 2)).toBe(400);
      expect(CascadeCalculationEngine.computeICElimination(pair, 0, 1)).toBe(0);
    });

    it('handles fractional ownership * small amount without drift', () => {
      const pair: CascadeICPair = {
        fromEntityId: 'A',
        toEntityId: 'B',
        amount: 0.1,
        currency: 'USD',
        type: 'revenue',
      };
      // 0.1 * 33.3333 / 100 ≈ 0.0333333 (float drift common)
      expect(CascadeCalculationEngine.computeICElimination(pair, 33.3333, 1)).toBe(0.03);
    });
  });

  describe('computeNCI', () => {
    it('returns exact minority share with DECIMALS convention (float gave 299.99999999999994)', () => {
      expect(CascadeCalculationEngine.computeNCI(1000, 0.3)).toBe(300);
      expect(CascadeCalculationEngine.computeNCI(1000, 0)).toBe(0);
      expect(CascadeCalculationEngine.computeNCI(-500, 0.25)).toBe(-125);
    });

    it('handles tiny NCI amounts exactly', () => {
      // 0.3 × 0.333333 = 0.0999999 → cent-round → 0.1
      expect(CascadeCalculationEngine.computeNCI(0.3, 0.333333)).toBe(0.1);
    });

    it('financial-equal: 75/25 ownership ⇒ NCI = 25% of sub NI (expectFinancialEqual)', () => {
      // 1234.56 × 0.25 = 308.64 exactly
      expectFinancialEqual(CascadeCalculationEngine.computeNCI(1234.56, 0.25), 308.64);
      expectFinancialEqual(CascadeCalculationEngine.computeNCI(-2000, 0.25), -500);
    });

    it('throws InvalidOwnershipShareError on percent-scale input (>1) — 100x guard', () => {
      // pre-migration this silently returned 25000 (100x); now it must throw
      expect(() => CascadeCalculationEngine.computeNCI(100000, 25)).toThrow(
        InvalidOwnershipShareError
      );
      expect(() => CascadeCalculationEngine.computeNCI(100000, 100)).toThrow(
        InvalidOwnershipShareError
      );
    });
  });

  describe('computeFXImpact', () => {
    it('applies exact translation (float gave 1079.9999999999999)', () => {
      expect(CascadeCalculationEngine.computeFXImpact(1000, usdEur, 'current-rate')).toBe(1080);
      expect(CascadeCalculationEngine.computeFXImpact(500, usdEur, 'current-rate')).toBe(540);
    });
  });

  describe('cascade full flow', () => {
    it('computes exact totals for 2-level tree (float gave totalNCI drift)', () => {
      const tree = [
        makeOwnership({ entityId: 'P' }),
        makeOwnership({
          entityId: 'S',
          parentId: 'P',
          ownershipPct: 80,
          currency: 'EUR',
          functionalCurrency: 'USD',
        }),
      ];
      const ic: CascadeICPair[] = [
        { fromEntityId: 'S', toEntityId: 'P', amount: 500, currency: 'EUR', type: 'receivable' },
      ];
      const ni = new Map([
        ['P', 1000],
        ['S', 500],
      ]);
      const result = CascadeCalculationEngine.cascade(tree, ic, [usdEur], ni, 'full-step');
      expect(result.validated).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.steps.length).toBe(2);
      // 100% - 80% = 20% NCI on S's 500
      expect(result.totalNCI).toBe(100);
      expect(result.totalFXImpact).toBe(540); // 500 * 1.08
      // depth i=1 for S => weighted by cumOwnership 80%: 500 * (80/100) = 400 (not full 500)
      expect(result.totalElimination).toBe(400);
      expect(result.consolidatedNI).toBe(1400); // 1500 total - 100 NCI
    });

    it('sums multiple IC elims exactly across cascade (float drift on reduce + smalls)', () => {
      const tree = [
        makeOwnership({ entityId: 'P' }),
        makeOwnership({ entityId: 'S1', parentId: 'P', ownershipPct: 60 }),
        makeOwnership({ entityId: 'S2', parentId: 'P', ownershipPct: 40 }),
      ];
      const ic: CascadeICPair[] = [
        { fromEntityId: 'S1', toEntityId: 'P', amount: 0.1, currency: 'USD', type: 'expense' },
        { fromEntityId: 'S1', toEntityId: 'P', amount: 0.2, currency: 'USD', type: 'expense' },
        { fromEntityId: 'S2', toEntityId: 'P', amount: 0.3, currency: 'USD', type: 'expense' },
      ];
      const ni = new Map([
        ['P', 0],
        ['S1', 100],
        ['S2', 50],
      ]);
      const result = CascadeCalculationEngine.cascade(tree, ic, [], ni, 'full-step');
      // S1 cum=60 => elim 0.1+0.2 = 0.18; S2 cum=40 => 0.3*0.4=0.12; totalElim=0.3
      expect(result.totalElimination).toBe(0.3);
      // NCI: S1 (40%) of 100 = 40; S2 (60%) of 50 = 30; totalNCI=70
      expect(result.totalNCI).toBe(70);
      expect(result.consolidatedNI).toBe(80); // 150 - 70
    });

    it('handles zero and negative netIncome without NaN or drift', () => {
      const tree = [
        makeOwnership({ entityId: 'P' }),
        makeOwnership({ entityId: 'S', parentId: 'P', ownershipPct: 75 }),
      ];
      const ni = new Map([
        ['P', 0],
        ['S', -400],
      ]);
      const result = CascadeCalculationEngine.cascade(tree, [], [], ni, 'full-step');
      expect(result.totalNCI).toBe(-100); // 25% of -400
      expect(result.consolidatedNI).toBe(-300);
      expect(result.totalElimination).toBe(0);
    });
  });

  describe('summarizeSteps', () => {
    it('sums FX exactly from step list (float gave 10.000000000000002 on tiny)', () => {
      const steps = [
        {
          level: 0,
          entityId: 'A',
          ownershipPct: 100,
          method: 'full-step' as const,
          icElimination: 100,
          nciOwnership: 0,
          nciAmount: 0,
          fxImpact: 0.1,
          cumulativeNCI: 0,
          cumulativeElimination: 100,
        },
        {
          level: 1,
          entityId: 'B',
          ownershipPct: 80,
          method: 'full-step' as const,
          icElimination: 50,
          nciOwnership: 20,
          nciAmount: 20,
          fxImpact: 0.2,
          cumulativeNCI: 20,
          cumulativeElimination: 150,
        },
      ];
      const sum = CascadeCalculationEngine.summarizeSteps(steps);
      expect(sum.totalElim).toBe(150);
      expect(sum.totalNCI).toBe(20);
      expect(sum.totalFX).toBe(0.3);
    });
  });
});
