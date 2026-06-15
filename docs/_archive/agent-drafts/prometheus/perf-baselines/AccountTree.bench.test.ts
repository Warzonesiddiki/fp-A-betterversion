<!-- DRAFT v0.1 — awaiting review — Prometheus 2026-06-12 — pre-Run Baseline -->
/**
 * AccountTree — React Render Baseline Benchmark
 *
 * Component: src/components/ui/AccountTree.tsx (230 lines, hierarchical tree)
 * Cost driver: deep nesting (5+ levels), expand/collapse state, 200+ account nodes
 *
 * Run: npx vitest bench docs/drafts/prometheus/perf-baselines/AccountTree.bench.test.ts
 */
import { describe, bench, afterAll } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { AccountTree } from '@/components/ui/AccountTree';
import type { AccountNode } from '@/types/account';

// Hierarchical tree: 3 roots × 10 children × 5 grandchildren = 183 nodes
function makeAccounts(seed: number): AccountNode[] {
  const roots: AccountNode[] = [];
  for (let r = 0; r < 3; r++) {
    const children: AccountNode[] = [];
    for (let c = 0; c < 10; c++) {
      const grandchildren: AccountNode[] = [];
      for (let g = 0; g < 5; g++) {
        grandchildren.push({
          id: `g-${seed}-${r}-${c}-${g}`,
          name: `Grandchild ${g}`,
          balance: ((seed + r * 100 + c * 10 + g) * 1000) % 100000,
          depth: 3,
        });
      }
      children.push({
        id: `c-${seed}-${r}-${c}`,
        name: `Child ${c}`,
        balance: ((seed + r * 100 + c) * 10000) % 1000000,
        depth: 2,
        children: grandchildren,
      });
    }
    roots.push({
      id: `r-${seed}-${r}`,
      name: `Root ${r}`,
      balance: 0,
      depth: 1,
      children: children,
    });
  }
  return roots;
}

describe('AccountTree render baseline (no React.memo)', () => {
  const ITERATIONS = 1000;
  const times: number[] = [];

  bench(`AccountTree: ${ITERATIONS} prop-change rerenders (~183 nodes)`, () => {
    const initial = makeAccounts(0);
    const { rerender } = render(
      <AccountTree accounts={initial} expandedIds={new Set()} onToggle={() => {}} onSelect={() => {}} />
    );

    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const accounts = makeAccounts(i + 1);
      rerender(
        <AccountTree accounts={accounts} expandedIds={new Set([`r-${i+1}-0`])} onToggle={() => {}} onSelect={() => {}} />
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
    console.log(`\n=== AccountTree baseline ===`);
    console.log(`  Iterations: ${times.length}`);
    console.log(`  Median:     ${median.toFixed(3)} ms`);
    console.log(`  p95:        ${p95.toFixed(3)} ms`);
    console.log(`  Total:      ${total.toFixed(1)} ms`);
  });
});
