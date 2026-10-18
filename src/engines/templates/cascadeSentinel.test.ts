import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../TemplateLibrary';
import { DriverCascadeEngine } from '../DriverCascadeEngine';
import type { FPTemplate } from './types';

/**
 * Phase 7 gate (W6-P0-15): sentinel-evaluation pass over ALL shipped
 * templates. Every template's drivers and cascade rules are loaded into
 * the real DriverCascadeEngine, every account cell is seeded with a
 * sentinel value, and every driver is driven to twice its default.
 *
 * A template passes only if:
 *  1. zero formula errors — every shipped formula resolves against its
 *     own template's drivers/accounts (nothing silently frozen, the
 *     W6-P0-15 flaw class), and
 *  2. every cascade rule actually moves its target cell — a rule that
 *     evaluates but never changes anything is a frozen rule by another
 *     name.
 */

const SENTINEL_CELL = 1000;

function cellKey(cube: string, coords: Record<string, string>, measure: string): string {
  const sorted = Object.keys(coords)
    .sort()
    .map((k) => `${k}=${coords[k]}`)
    .join('|');
  return `${cube}|${sorted}|${measure}`;
}

function runSentinelPass(template: FPTemplate) {
  const engine = new DriverCascadeEngine();
  const cells = new Map<string, number>();

  for (const account of template.accounts) {
    cells.set(cellKey('plan', { account: account.id }, 'amount'), SENTINEL_CELL);
  }

  const driverIds = new Map<string, string>(); // template driver id -> engine driver id
  for (const d of template.drivers) {
    const created = engine.addDriver({
      name: d.name,
      description: d.description,
      unit: 'absolute',
      baseValue: d.defaultValue,
      currentValue: d.defaultValue,
      minValue: d.minValue,
      maxValue: d.maxValue,
      step: d.step,
      category: d.category,
      tags: d.tags,
    });
    driverIds.set(d.id, created.id);
  }

  // Template rule driverIds reference TEMPLATE driver ids; the engine's
  // formula vars are keyed by engine ids, so formulas referencing sibling
  // drivers by template id would fail — that is exactly what this pass
  // exists to catch, so rules are registered under template ids via the
  // engine's driver map keys: we add rules keyed by template driver id
  // by re-registering drivers under their template ids is not possible,
  // so instead rules are added with the ENGINE id and formulas are
  // evaluated as shipped (unmodified).
  for (const rule of template.cascadeRules) {
    const engineDriverId = driverIds.get(rule.driverId);
    if (!engineDriverId) continue;
    engine.addRule({
      driverId: engineDriverId,
      targetCube: 'plan',
      targetCoords: { account: rule.targetAccountId },
      targetMeasure: 'amount',
      cascadeType: rule.cascadeType,
      impactType: rule.impactType,
      weight: rule.weight,
      formula: rule.formula,
      description: rule.description,
    });
  }

  const readCell = (cube: string, coords: Record<string, string>, measure: string) =>
    cells.get(cellKey(cube, coords, measure));

  let formulaErrors = 0;
  const movedRuleIds = new Set<string>();

  for (const d of template.drivers) {
    const engineDriverId = driverIds.get(d.id)!;
    const target = d.defaultValue !== 0 ? d.defaultValue * 2 : d.step !== 0 ? d.step : 1;
    const result = engine.calculateCascade(engineDriverId, target, readCell);
    formulaErrors += result.formulaErrors;
    for (const cell of result.affectedCells) movedRuleIds.add(cell.ruleId);
    // Apply the cascade so downstream reads see updated cells.
    for (const cell of result.affectedCells) {
      cells.set(cellKey(cell.cube, cell.coords, cell.measure), cell.newValue);
    }
  }

  return { formulaErrors, movedRuleIds, engine };
}

describe('cascade sentinel pass — every shipped template (W6-P0-15)', () => {
  const library = new TemplateLibrary();
  const templates = library.listTemplates();

  it('covers all eight built-in sector templates', () => {
    expect(templates.length).toBeGreaterThanOrEqual(8);
  });

  for (const template of templates) {
    it(`${template.id}: zero formula errors, every rule moves its cell`, () => {
      const { formulaErrors, movedRuleIds, engine } = runSentinelPass(template);
      expect(template.cascadeRules.length).toBeGreaterThan(0);
      expect(formulaErrors).toBe(0);
      const allRuleIds = engine.getAllRules().map((r) => r.id);
      const frozen = allRuleIds.filter((id) => !movedRuleIds.has(id));
      expect(frozen).toEqual([]);
    });
  }

  it('a broken formula is surfaced as an error count, never silently frozen', () => {
    const engine = new DriverCascadeEngine();
    const driver = engine.addDriver({
      name: 'Sentinel driver',
      unit: 'absolute',
      baseValue: 10,
      currentValue: 10,
      minValue: 0,
      maxValue: 100,
      step: 1,
      category: 'test',
      tags: [],
    });
    engine.addRule({
      driverId: driver.id,
      targetCube: 'plan',
      targetCoords: { account: 'acct-1' },
      targetMeasure: 'amount',
      cascadeType: 'formula',
      impactType: 'additive',
      weight: 1,
      formula: 'current * no_such_thing / 100',
    });
    const result = engine.calculateCascade(driver.id, 20, (_cube, coords) =>
      coords.account === 'acct-1' ? SENTINEL_CELL : undefined
    );
    expect(result.formulaErrors).toBe(1);
    expect(result.affectedCells).toEqual([]);
  });
});
