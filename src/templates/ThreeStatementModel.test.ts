import { describe, it, expect } from 'vitest';
import { buildThreeStatementModel } from './ThreeStatementModel';
import { DriverCascadeEngine } from '@/engines/DriverCascadeEngine';
import type { Driver } from '@/engines/DriverCascadeEngine';
import type { DriverDefinition, FPTemplate } from '@/engines/TemplateLibrary';

// =============================================================================
// W6-P0-15 regression — cascade DSL alignment.
// The engine previously resolved only x / old_x / current; `prev` lexed as a
// cell ref evaluating to 0, so the revenue-growth rule zeroed Net Revenue
// instead of growing it off its previous value.
// =============================================================================

const SEED_TS = '2026-01-01T00:00:00Z';

function toEngineUnit(unit: DriverDefinition['unit']): Driver['unit'] {
  return unit === 'percentage' ? 'percentage' : 'absolute';
}

/** Seeds an engine with the template's drivers (template ids preserved) and rules. */
function seedEngineFromTemplate(tpl: FPTemplate): DriverCascadeEngine {
  const engine = new DriverCascadeEngine();
  engine.importState({
    drivers: tpl.drivers.map((d) => ({
      id: d.id,
      name: d.name,
      baseValue: d.defaultValue,
      currentValue: d.defaultValue,
      minValue: d.minValue,
      maxValue: d.maxValue,
      step: d.step,
      category: d.category,
      tags: [...d.tags],
      unit: toEngineUnit(d.unit),
      createdAt: SEED_TS,
      updatedAt: SEED_TS,
    })),
    rules: tpl.cascadeRules.map((r) => ({
      id: r.id,
      driverId: r.driverId,
      targetCube: 'accounts',
      targetCoords: { account: r.targetAccountId },
      targetMeasure: 'amount',
      cascadeType: r.cascadeType,
      impactType: r.impactType,
      weight: r.weight,
      formula: r.formula,
    })),
  });
  return engine;
}

describe('ThreeStatementModel cascade formulas', () => {
  it('revenue growth changes Net Revenue via old_x baseline', () => {
    const tpl = buildThreeStatementModel();
    const engine = seedEngineFromTemplate(tpl);

    // Default growth is 8%; move to 12%. Formula: old_x * (1 + x / 100)
    // = 8 * 1.12 = 8.96 — previously `prev` evaluated to 0.
    const result = engine.calculateCascade('3s-revenue-growth', 12, () => 200_000_000);

    expect(result.formulaErrors ?? 0).toBe(0);
    expect(result.affectedCells).toHaveLength(1);
    const cell = result.affectedCells[0]!;
    expect(cell.coords['account']).toBe('3s-revenue');
    expect(cell.newValue).toBeCloseTo(8.96, 6);
    expect(cell.delta).not.toBe(0);
  });
});
