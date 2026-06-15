<!-- DRAFT v0.1 — awaiting review — Prometheus 2026-06-12 — pre-Run Baseline -->
/**
 * ReportResultsPanel — React Render Baseline Benchmark
 *
 * Component: src/components/reports/ReportResultsPanel.tsx (291 lines, result renderer)
 * Cost driver: large data set rendering, charts + tables
 *
 * Run: npx vitest bench docs/drafts/prometheus/perf-baselines/ReportResultsPanel.bench.test.ts
 */
import { describe, bench, afterAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ReportResultsPanel } from '@/components/reports/ReportResultsPanel';
import type { Report } from '@/types/report';

function makeReport(seed: number): Report {
  return {
    id: `r-${seed}`,
    name: `Report ${seed}`,
    rows: Array.from({ length: 50 }, (_, r) => ({
      id: `row-${seed}-${r}`,
      account: `Account ${r}`,
      period: `2026-Q${(r % 4) + 1}`,
      value: ((seed + r) * 1000) % 100000,
      variance: ((seed + r) % 100) - 50,
    })),
    generatedAt: new Date().toISOString(),
    totalRows: 50,
  };
}

describe('ReportResultsPanel render baseline (no React.memo)', () => {
  const ITERATIONS = 1000;
  const times: number[] = [];

  bench(`ReportResultsPanel: ${ITERATIONS} prop-change rerenders (50-row data set)`, () => {
    const initial = makeReport(0);
    const { rerender } = render(
      <ReportResultsPanel report={initial} onExport={() => {}} onShare={() => {}} />
    );

    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const report = makeReport(i + 1);
      rerender(
        <ReportResultsPanel report={report} onExport={() => {}} onShare={() => {}} />
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
    console.log(`\n=== ReportResultsPanel baseline ===`);
    console.log(`  Iterations: ${times.length}`);
    console.log(`  Median:     ${median.toFixed(3)} ms`);
    console.log(`  p95:        ${p95.toFixed(3)} ms`);
    console.log(`  Total:      ${total.toFixed(1)} ms`);
  });
});
