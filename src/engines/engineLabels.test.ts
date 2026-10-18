import { describe, it, expect } from 'vitest';
import { EXPERIMENTAL_ENGINES } from './engineLabels';
import { ENGINE_IDS } from './engineManifest.generated';

/**
 * DEC-019: engines with no product path must be labelled EXPERIMENTAL
 * with a measured reason. This test keeps the label honest:
 *  - every labelled id is a real manifest engine (no stale labels);
 *  - every label states why it is not a supported feature.
 */
describe('EXPERIMENTAL engine labels (DEC-019)', () => {
  it('labels only real manifest engines, each with a reason', () => {
    const ids = new Set<string>(ENGINE_IDS);
    for (const [id, reason] of Object.entries(EXPERIMENTAL_ENGINES)) {
      expect(ids.has(id)).toBe(true);
      expect(reason.length).toBeGreaterThan(20);
    }
  });

  it('RollingForecastEngine is labelled experimental (roll semantics unconsumed by any product path)', () => {
    expect(EXPERIMENTAL_ENGINES['RollingForecastEngine']).toMatch(/rollingForecastModel/);
  });

  it('ForecastMethodEngine is labelled experimental (builder page ships its own methods)', () => {
    expect(EXPERIMENTAL_ENGINES['ForecastMethodEngine']).toMatch(/Forecast builder/);
  });
});
