import { describe, it, expect } from 'vitest';
import {
  CascadeCalculationEngine,
  InvalidOwnershipShareError,
  type OwnershipNode,
  type CascadeICPair,
  type CascadeFXRate,
  type CascadeStep,
} from './CascadeCalculationEngine';

// =============================================================================
// TEST HELPERS
// =============================================================================

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

// =============================================================================
// TESTS (15 tests, exceeds ≥10 minimum per Leader spec)
// =============================================================================

describe('CascadeCalculationEngine', () => {
  it('1. validateOwnershipTree returns valid for clean 2-level tree', () => {
    const tree = [
      makeOwnership({ entityId: 'P' }),
      makeOwnership({ entityId: 'S1', parentId: 'P', ownershipPct: 80 }),
    ];
    const result = CascadeCalculationEngine.validateOwnershipTree(tree);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('2. validateOwnershipTree detects cycle (A->B->A)', () => {
    const tree = [
      makeOwnership({ entityId: 'A', parentId: 'B', ownershipPct: 60 }),
      makeOwnership({ entityId: 'B', parentId: 'A', ownershipPct: 40 }),
    ];
    const result = CascadeCalculationEngine.validateOwnershipTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Cycle'))).toBe(true);
  });

  it('3. validateOwnershipTree flags invalid ownershipPct > 100', () => {
    const tree = [
      makeOwnership({ entityId: 'P' }),
      makeOwnership({ entityId: 'S', parentId: 'P', ownershipPct: 150 }),
    ];
    const result = CascadeCalculationEngine.validateOwnershipTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('150'))).toBe(true);
  });

  it('4. buildOwnershipMap indexes by entityId (O(1) lookup)', () => {
    const tree = [
      makeOwnership({ entityId: 'A' }),
      makeOwnership({ entityId: 'B', parentId: 'A' }),
    ];
    const map = CascadeCalculationEngine.buildOwnershipMap(tree);
    expect(map.size).toBe(2);
    expect(map.get('B')?.parentId).toBe('A');
    expect(map.get('C')).toBeUndefined();
  });

  it('5. topologicallySort puts parents before children', () => {
    const tree = [
      makeOwnership({ entityId: 'C', parentId: 'B' }),
      makeOwnership({ entityId: 'A' }),
      makeOwnership({ entityId: 'B', parentId: 'A' }),
    ];
    const sorted = CascadeCalculationEngine.topologicallySort(tree);
    expect(sorted[0].entityId).toBe('A');
    expect(sorted[1].entityId).toBe('B');
    expect(sorted[2].entityId).toBe('C');
  });

  it('6. findUltimateParent walks to top of ownership chain', () => {
    const tree = [
      makeOwnership({ entityId: 'GP' }),
      makeOwnership({ entityId: 'P', parentId: 'GP', ownershipPct: 70 }),
      makeOwnership({ entityId: 'S', parentId: 'P', ownershipPct: 100 }),
    ];
    expect(CascadeCalculationEngine.findUltimateParent(tree, 'S')).toBe('GP');
    expect(CascadeCalculationEngine.findUltimateParent(tree, 'GP')).toBe('GP');
  });

  it('7. computeCumulativeOwnership multiplies % across levels', () => {
    const tree = [
      makeOwnership({ entityId: 'P' }),
      makeOwnership({ entityId: 'S1', parentId: 'P', ownershipPct: 80 }),
      makeOwnership({ entityId: 'S2', parentId: 'S1', ownershipPct: 50 }),
    ];
    expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'S2')).toBe(40); // 80% * 50%
    expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'S1')).toBe(80);
    expect(CascadeCalculationEngine.computeCumulativeOwnership(tree, 'P')).toBe(100);
  });

  it('8. computeICElimination at level 0 = full IC amount', () => {
    const pair: CascadeICPair = {
      fromEntityId: 'A',
      toEntityId: 'B',
      amount: 1000,
      currency: 'USD',
      type: 'receivable',
    };
    expect(CascadeCalculationEngine.computeICElimination(pair, 100, 0)).toBe(1000);
  });

  it('9. computeICElimination at depth > 0 weighted by ownership', () => {
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

  it('10. computeNCI returns minority share of net income (DECIMALS: 0.3 = 30%)', () => {
    expect(CascadeCalculationEngine.computeNCI(1000, 0.3)).toBe(300);
    expect(CascadeCalculationEngine.computeNCI(1000, 0)).toBe(0);
    expect(CascadeCalculationEngine.computeNCI(-500, 0.25)).toBe(-125);
    // boundary shares are legal
    expect(CascadeCalculationEngine.computeNCI(1000, 1)).toBe(1000);
  });

  it('10b. computeNCI rejects percent-scale / out-of-range shares (100x guard)', () => {
    // percent-scale input (30 meaning 30%) must fail loudly, not yield 300
    expect(() => CascadeCalculationEngine.computeNCI(1000, 30)).toThrow(InvalidOwnershipShareError);
    expect(() => CascadeCalculationEngine.computeNCI(1000, 25)).toThrow(InvalidOwnershipShareError);
    expect(() => CascadeCalculationEngine.computeNCI(1000, 1.5)).toThrow(
      InvalidOwnershipShareError
    );
    expect(() => CascadeCalculationEngine.computeNCI(1000, -0.1)).toThrow(
      InvalidOwnershipShareError
    );
    expect(() => CascadeCalculationEngine.computeNCI(1000, Number.NaN)).toThrow(
      InvalidOwnershipShareError
    );
    expect(() => CascadeCalculationEngine.computeNCI(1000, Number.POSITIVE_INFINITY)).toThrow(
      InvalidOwnershipShareError
    );
  });

  it('11. computeFXImpact applies current-rate translation', () => {
    expect(CascadeCalculationEngine.computeFXImpact(1000, usdEur, 'current-rate')).toBe(1080);
    expect(CascadeCalculationEngine.computeFXImpact(500, usdEur, 'current-rate')).toBe(540);
  });

  it('12. cascade returns validated result for clean tree (2-level, 80% sub, EUR/USD)', () => {
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
    expect(result.totalNCI).toBe(100); // 20% of S NI (500) = 100
    expect(result.totalFXImpact).toBe(540); // 500 * 1.08
  });

  it('13. cascade returns validated=false for invalid (cyclic) tree', () => {
    const tree = [
      makeOwnership({ entityId: 'A', parentId: 'B', ownershipPct: 60 }),
      makeOwnership({ entityId: 'B', parentId: 'A', ownershipPct: 40 }),
    ];
    const result = CascadeCalculationEngine.cascade(tree, [], [], new Map(), 'full-step');
    expect(result.validated).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.steps).toEqual([]);
  });

  it('14. detectOrphans flags entities with no path to ultimate parent', () => {
    const tree = [
      makeOwnership({ entityId: 'A' }),
      makeOwnership({ entityId: 'B', parentId: 'A' }),
      makeOwnership({ entityId: 'C' }), // orphan
    ];
    const orphans = CascadeCalculationEngine.detectOrphans(tree);
    expect(orphans).toEqual(expect.arrayContaining(['A', 'C']));
    expect(orphans).not.toContain('B');
  });

  it('15. summarizeSteps returns last cumulative totals', () => {
    const steps: CascadeStep[] = [
      {
        level: 0,
        entityId: 'A',
        ownershipPct: 100,
        method: 'full-step',
        icElimination: 100,
        nciOwnership: 0,
        nciAmount: 0,
        fxImpact: 0,
        cumulativeNCI: 0,
        cumulativeElimination: 100,
      },
      {
        level: 1,
        entityId: 'B',
        ownershipPct: 80,
        method: 'full-step',
        icElimination: 50,
        nciOwnership: 20,
        nciAmount: 20,
        fxImpact: 10,
        cumulativeNCI: 20,
        cumulativeElimination: 150,
      },
    ];
    const sum = CascadeCalculationEngine.summarizeSteps(steps);
    expect(sum.totalElim).toBe(150);
    expect(sum.totalNCI).toBe(20);
    expect(sum.totalFX).toBe(10);
  });
});
