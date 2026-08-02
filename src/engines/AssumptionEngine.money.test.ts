/**
 * GAP-1 (F-0006) known-answer tests for AssumptionEngine's money migration.
 *
 * Currency-unit assumptions compute impact deltas as money. Each case is a
 * FIXED input -> EXACT expected decimal asserted with `toBe` (Object.is); the
 * pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AssumptionEngine } from './AssumptionEngine';

const currencyAssumption = () =>
  AssumptionEngine.create({
    name: 'FX Rate Floor',
    value: 0.3,
    unit: 'currency',
    category: 'macro',
    source: 'test',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2026-12-31',
  });

describe('AssumptionEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    AssumptionEngine.clear();
  });

  it('computes currency deltas exactly (float gave -0.19999999999999998)', () => {
    const a = currencyAssumption();
    const impact = AssumptionEngine.impactAnalysis(a.id, 0.1);
    expect(impact.delta).toBe(-0.2);
    expect(impact.estimatedImpact).toBe(-0.2);
  });

  it('rounds currency estimated impact to cents', () => {
    const a = AssumptionEngine.create({
      name: 'Unit Cost',
      value: 0.1,
      unit: 'currency',
      category: 'cost',
      source: 'test',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
    });
    const impact = AssumptionEngine.impactAnalysis(a.id, 0.34);
    expect(impact.delta).toBe(0.24);
    expect(impact.estimatedImpact).toBe(0.24);
  });

  it('keeps percent assumptions in ratio space', () => {
    const a = AssumptionEngine.create({
      name: 'Growth',
      value: 0.05,
      unit: 'percent',
      category: 'revenue',
      source: 'test',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
    });
    const impact = AssumptionEngine.impactAnalysis(a.id, 0.1);
    // delta 0.05; estimated impact = delta * 0.01 (ratio conversion)
    expect(impact.delta).toBeCloseTo(0.05);
    expect(impact.estimatedImpact).toBeCloseTo(0.0005);
  });

  it('keeps count assumptions in plain arithmetic', () => {
    const a = AssumptionEngine.create({
      name: 'Headcount',
      value: 10,
      unit: 'count',
      category: 'operational',
      source: 'test',
      effectiveFrom: '2026-01-01',
      effectiveTo: '2026-12-31',
    });
    const impact = AssumptionEngine.impactAnalysis(a.id, 12);
    expect(impact.delta).toBe(2);
    expect(impact.estimatedImpact).toBe(2);
  });
});
