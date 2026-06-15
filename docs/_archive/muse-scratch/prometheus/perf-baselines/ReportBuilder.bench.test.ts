<!-- DRAFT v0.1 — awaiting review — Prometheus 2026-06-12 — pre-Run Baseline -->
/**
 * ReportBuilder — React Render Baseline Benchmark
 *
 * Component: src/components/reports/ReportBuilder.tsx (698 lines, multi-panel editor)
 * Cost driver: forwardRef + multi-panel layout (header, sidebar, preview, controls)
 *
 * Run: npx vitest bench docs/drafts/prometheus/perf-baselines/ReportBuilder.bench.test.ts
 */
import { describe, bench, afterAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReportBuilder } from '@/components/reports/ReportBuilder';
import type { ReportConfig } from '@/types/report';

function makeConfig(seed: number): ReportConfig {
  return {
    id: `r-${seed}`,
    name: `Report ${seed}`,
    rows: 30,
    columns: 12,
    measures: Array.from({ length: 6 }, (_, i) => ({
      id: `m-${i}`,
      name: `Measure ${i}`,
      field: `field_${i}`,
      aggregation: 'sum' as const,
    })),
    dimensions: ['account', 'period', 'entity'],
    filters: [],
    chartType: 'bar' as const,
    theme: 'light' as const,
  };
}

describe('ReportBuilder render baseline (no React.memo)', () => {
  const ITERATIONS = 1000;
  const times: number[] = [];

  bench(`ReportBuilder: ${ITERATIONS} prop-change rerenders (forwardRef, multi-panel)`, () => {
    const initial = makeConfig(0);
    const { rerender } = render(
      <ReportBuilder initialConfig={initial} onSave={() => {}} onPreview={() => {}} />
    );

    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const config = makeConfig(i + 1);
      rerender(
        <ReportBuilder initialConfig={config} onSave={() => {}} onPreview={() => {}} />
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
    console.log(`\n=== ReportBuilder baseline ===`);
    console.log(`  Iterations: ${times.length}`);
    console.log(`  Median:     ${median.toFixed(3)} ms`);
    console.log(`  p95:        ${p95.toFixed(3)} ms`);
    console.log(`  Total:      ${total.toFixed(1)} ms`);
  });
});
