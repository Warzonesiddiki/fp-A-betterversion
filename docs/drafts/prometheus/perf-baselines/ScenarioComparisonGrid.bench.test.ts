<!-- DRAFT v0.1 — awaiting review — Prometheus 2026-06-12 — pre-Run Baseline -->
/**
 * ScenarioComparisonGrid — React Render Baseline Benchmark
 *
 * Component: src/components/ui/ScenarioComparisonGrid.tsx (237 lines, side-by-side matrix)
 * Cost driver: scenarios × metrics grid (10 scenarios × 8 metrics = 80 cells)
 *
 * Run: npx vitest bench docs/drafts/prometheus/perf-baselines/ScenarioComparisonGrid.bench.test.ts
 */
import { describe, bench, afterAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ScenarioComparisonGrid } from '@/components/ui/ScenarioComparisonGrid';
import type { Scenario } from '@/types/scenario';

function makeScenarios(seed: number): Scenario[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `s-${seed}-${i}`,
    name: `Scenario ${i}`,
    baseRevenue: 100000 + i * 5000,
    baseCost: 60000 + i * 3000,
    growthRate: 0.05 + (i % 5) * 0.01,
    iterations: 1000,
  }));
}

const METRICS = ['Revenue', 'Cost', 'Margin', 'EBITDA', 'FCF', 'ROIC', 'NPV', 'IRR'];

describe('ScenarioComparisonGrid render baseline (no React.memo)', () => {
  const ITERATIONS = 1000;
  const times: number[] = [];

  bench(`ScenarioComparisonGrid: ${ITERATIONS} prop-change rerenders (10×8=80 cells)`, () => {
    const initial = makeScenarios(0);
    const { rerender } = render(
      <ScenarioComparisonGrid scenarios={initial} baseScenario={initial[0]} metrics={METRICS} />
    );

    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const scenarios = makeScenarios(i + 1);
      rerender(
        <ScenarioComparisonGrid scenarios={scenarios} baseScenario={scenarios[0]} metrics={METRICS} />
      );
      times.push(performance.now() - t0);
    }

    cleanup();
  });

  afterAll(() => {
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const total = times.reduce((a, b) => a + b, 0);
    console.log(`\n=== ScenarioComparisonGrid baseline ===`);
    console.log(`  Iterations: ${times.length}`);
    console.log(`  Median:     ${median.toFixed(3)} ms`);
    console.log(`  p95:        ${p95.toFixed(3)} ms`);
    console.log(`  Total:      ${total.toFixed(1)} ms`);
  });
});
