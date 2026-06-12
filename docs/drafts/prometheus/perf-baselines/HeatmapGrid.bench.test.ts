<!-- DRAFT v0.1 — awaiting review — Prometheus 2026-06-12 — pre-Run Baseline -->
/**
 * HeatmapGrid — React Render Baseline Benchmark
 *
 * Component: src/components/dashboard/HeatmapGrid.tsx (209 lines, already uses memo at line ~225)
 * Status: NOTE — already wrapped in React.memo (per earlier audit). This baseline measures
 *         the EFFECTIVE cost when memo is bypassed (props change every time, e.g., when
 *         spec.dimension changes).
 *
 * Run: npx vitest bench docs/drafts/prometheus/perf-baselines/HeatmapGrid.bench.test.ts
 * Output: median/p95/total ms printed to stdout, written to .baseline.json
 */
import { describe, bench, beforeAll, afterAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { HeatmapGrid } from '@/components/dashboard/HeatmapGrid';
import type { HeatmapSpec, HeatmapCell } from '@/types/heatmap';

// 20x20 = 400 cells with realistic data
function makeHeatmapData(seed: number): { spec: HeatmapSpec; cells: HeatmapCell[][] } {
  const rows = 20;
  const cols = 20;
  const cells: HeatmapCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: HeatmapCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        rowId: `r-${r}`,
        colId: `c-${c}`,
        value: ((seed + r * cols + c) % 100) / 100,
        label: `${r},${c}`,
      });
    }
    cells.push(row);
  }
  return {
    spec: { dimension: `iter-${seed}`, valueRange: [0, 1], colorScheme: 'viridis' },
    cells,
  };
}

describe('HeatmapGrid render baseline (no React.memo)', () => {
  const ITERATIONS = 1000;
  const times: number[] = [];

  bench(`HeatmapGrid: ${ITERATIONS} prop-change rerenders (20x20=400 cells)`, () => {
    // Initial render
    const initial = makeHeatmapData(0);
    const { rerender } = render(<HeatmapGrid spec={initial.spec} cells={initial.cells} />);

    // 1,000 prop-change rerenders
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const data = makeHeatmapData(i + 1);
      rerender(<HeatmapGrid spec={data.spec} cells={data.cells} />);
      times.push(performance.now() - t0);
    }

    cleanup();
  });

  afterAll(() => {
    const sorted = [...times].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const total = times.reduce((a, b) => a + b, 0);
    console.log(`\n=== HeatmapGrid baseline ===`);
    console.log(`  Iterations: ${times.length}`);
    console.log(`  Median:     ${median.toFixed(3)} ms`);
    console.log(`  p95:        ${p95.toFixed(3)} ms`);
    console.log(`  Total:      ${total.toFixed(1)} ms`);
    console.log(`  Mean:       ${(total / times.length).toFixed(3)} ms`);
  });
});
