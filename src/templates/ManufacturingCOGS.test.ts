import { describe, it, expect } from 'vitest';
import { buildManufacturingCOGSTemplate } from './ManufacturingCOGS';
import { DriverCascadeEngine } from '@/engines/DriverCascadeEngine';
import type { Driver } from '@/engines/DriverCascadeEngine';
import type { DriverDefinition, FPTemplate } from '@/engines/TemplateLibrary';

// =============================================================================
// W6-P0-15 regression — cascade DSL alignment.
// Formula rules referenced labor_rate / production_volume / actual_material,
// which the evaluator resolved to 0-valued cell refs (silently), so standard
// labor, good units and variance cells never moved.
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

const tpl = buildManufacturingCOGSTemplate();

describe('ManufacturingCOGS cascade formulas', () => {
  it('labor hours × mct_labor_rate produces a nonzero standard-labor delta', () => {
    const engine = seedEngineFromTemplate(tpl);
    // 0.75 -> 0.80 h/unit at $28/h = 22.4 (previously labor_rate resolved to 0).
    const result = engine.calculateCascade('mct-labor-hours', 0.8, () => 1_000_000);

    expect(result.formulaErrors ?? 0).toBe(0);
    expect(result.affectedCells).toHaveLength(1);
    const cell = result.affectedCells[0]!;
    expect(cell.coords['account']).toBe('mct-std-labor');
    expect(cell.newValue).toBeCloseTo(22.4, 6);
    expect(cell.delta).not.toBe(0);
  });

  it('yield × mct_production_volume produces nonzero good-units delta', () => {
    const engine = seedEngineFromTemplate(tpl);
    // 96% -> 97% of 25,000 units = 24,250 good units.
    const result = engine.calculateCascade('mct-yield', 97, () => 1_000_000);

    expect(result.formulaErrors ?? 0).toBe(0);
    expect(result.affectedCells).toHaveLength(1);
    const cell = result.affectedCells[0]!;
    expect(cell.coords['account']).toBe('mct-good-units');
    expect(cell.newValue).toBeCloseTo(24250, 6);
    expect(cell.delta).not.toBe(0);
  });

  it('material price variance × mct_material_cost_bom produces a nonzero delta', () => {
    const engine = seedEngineFromTemplate(tpl);
    // 2% -> 5% price variance on a $42 BOM = $2.10 variance.
    const result = engine.calculateCascade('mct-material-price-var', 5, () => 1_000_000);

    expect(result.formulaErrors ?? 0).toBe(0);
    expect(result.affectedCells).toHaveLength(1);
    const cell = result.affectedCells[0]!;
    expect(cell.coords['account']).toBe('mct-material-price-var');
    expect(cell.newValue).toBeCloseTo(2.1, 6);
    expect(cell.delta).not.toBe(0);
  });
});
