import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DriverCascadeEngine } from './DriverCascadeEngine';

/**
 * Money-discipline probe for the driver cascade engine (session 024).
 *
 * Cascade targets are cube measures and routinely hold currency values.
 * Pre-session-024 the engine added `delta * rule.weight` onto cell values
 * with IEEE-754 floats, accumulated `totalImpact` with `reduce(sum + delta)`
 * and grouped impacts with `+=` — so a two-cell cascade of 0.3 and 0.6
 * reported 0.8999999999999999. Every such operation now routes through
 * `@/utils/money`.
 */

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

function makeDriver(engine: DriverCascadeEngine): string {
  return engine.addDriver({
    name: 'Price',
    unit: 'absolute',
    baseValue: 10,
    currentValue: 10,
    minValue: 0,
    maxValue: 100,
    step: 0.1,
    category: 'pricing',
    tags: [],
  }).id;
}

describe('DriverCascadeEngine — source guards', () => {
  const src = stripComments(
    fs.readFileSync(path.resolve(__dirname, './DriverCascadeEngine.ts'), 'utf8')
  );

  it('no raw float arithmetic on cell values remains', () => {
    expect(src).not.toMatch(/currentCellValue \+ delta/);
    expect(src).not.toMatch(/currentCellValue \* Math\.pow/);
    expect(src).not.toMatch(/totalImpact \+= cell\.delta/);
    expect(src).not.toMatch(/Math\.round\(newCellValue/);
    expect(src).not.toMatch(/\(sum, c\) => sum \+ c\.delta/);
  });

  it('routes cascade arithmetic through @/utils/money', () => {
    expect(src).toMatch(/from '@\/utils\/money'/);
    expect(src).toMatch(/sumMoney/);
    expect(src).toMatch(/subtractMoney/);
  });
});

describe('DriverCascadeEngine — decimal known answers', () => {
  it('sums impact decimally: 0.3 + 0.6 is 0.9, not 0.8999999999999999', () => {
    const engine = new DriverCascadeEngine();
    const driverId = makeDriver(engine);
    engine.addRule({
      driverId,
      targetCube: 'Budget',
      targetCoords: { account: 'Revenue' },
      targetMeasure: 'amount',
      cascadeType: 'direct',
      impactType: 'additive',
      weight: 1,
    });
    engine.addRule({
      driverId,
      targetCube: 'Budget',
      targetCoords: { account: 'Salaries' },
      targetMeasure: 'amount',
      cascadeType: 'direct',
      impactType: 'additive',
      weight: 2,
    });

    // Driver moves 10 -> 10.3: cell deltas are 0.3 and 0.6.
    const result = engine.calculateCascade(driverId, 10.3, () => 0);
    expect(result.affectedCells.map((c) => c.delta)).toEqual([0.3, 0.6]);
    // Float reduce reported 0.8999999999999999 here before session 024.
    expect(result.totalImpact).toBe(0.9);
  });

  it('computes percentageChange without float drift', () => {
    const engine = new DriverCascadeEngine();
    const driverId = makeDriver(engine);
    engine.addRule({
      driverId,
      targetCube: 'Budget',
      targetCoords: { account: 'Revenue' },
      targetMeasure: 'amount',
      cascadeType: 'direct',
      impactType: 'additive',
      weight: 1,
    });
    // currentValue 10 -> 10.3 is exactly +3%, where the float path
    // (0.2999999999999998 / 10) * 100 reported 2.9999999999999982.
    const impact = engine.analyzeImpact(driverId, 10.3, () => 0);
    expect(impact.delta).toBe(0.3);
    expect(impact.percentageChange).toBe(3);
  });
});
