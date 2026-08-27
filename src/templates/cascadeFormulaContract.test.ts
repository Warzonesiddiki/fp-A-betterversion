import { describe, it, expect } from 'vitest';
import { getAllTemplates } from './index';
import type { FPTemplate } from '@/engines/TemplateLibrary';
import { DriverCascadeEngine } from '@/engines/DriverCascadeEngine';
import type { Driver } from '@/engines/DriverCascadeEngine';

// =============================================================================
// W6-P0-15 contract — EVERY cascade formula in EVERY registered template must
// evaluate without error under sentinel inputs. A formula referencing an
// unknown identifier previously resolved to 0 / silently froze its target cell,
// producing stale financials with no signal. This test fails loudly and lists
// every offender so template authors cannot ship dead rules again.
// =============================================================================

const SEED_TS = '2026-01-01T00:00:00Z';

function toEngineUnit(unit: FPTemplate['drivers'][number]['unit']): Driver['unit'] {
  return unit === 'percentage' ? 'percentage' : 'absolute';
}

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

describe('All registered templates: cascade formula contract (W6-P0-15)', () => {
  it('every cascade rule evaluates with zero formula errors', () => {
    const templates = getAllTemplates();
    expect(templates.length).toBeGreaterThan(0);

    const offenders: string[] = [];

    for (const tpl of templates) {
      const engine = seedEngineFromTemplate(tpl);
      for (const rule of tpl.cascadeRules) {
        if (!rule.formula || rule.cascadeType !== 'formula') continue;
        try {
          // Sentinel probe: nudge the rule's own driver by one step (clamped).
          const driver = tpl.drivers.find((d) => d.id === rule.driverId);
          if (!driver) {
            offenders.push(
              `${tpl.id} :: ${rule.id} :: rule references missing driver "${rule.driverId}"`
            );
            continue;
          }
          const probe = Math.min(
            driver.maxValue,
            Math.max(driver.minValue, driver.defaultValue + driver.step)
          );
          const result = engine.calculateCascade(rule.driverId, probe, () => 1000);
          if (result.formulaErrors > 0) {
            offenders.push(`${tpl.id} :: ${rule.id} :: "${rule.formula}"`);
          }
        } catch (error) {
          offenders.push(
            `${tpl.id} :: ${rule.id} :: "${rule.formula}" threw ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
