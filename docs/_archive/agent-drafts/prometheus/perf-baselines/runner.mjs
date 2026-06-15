#!/usr/bin/env node
/**
 * perf-baselines/runner.ts — Summarize all 5 component baselines
 *
 * Reads all *.baseline.json files in this directory, then writes a
 * markdown summary table to perf-baselines-summary.md. After Apollo
 * applies the React.memo patches and re-runs the benchmarks, he can
 * re-run this script to get the before/after comparison.
 *
 * Usage:
 *   node docs/drafts/prometheus/perf-baselines/runner.mjs
 *   # or after Apollo re-runs:
 *   node docs/drafts/prometheus/perf-baselines/runner.mjs --after
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isAfter = process.argv.includes('--after');

const files = readdirSync(__dirname)
  .filter((f) => f.endsWith('.baseline.json'))
  .sort();

const rows = files.map((f) => {
  const data = JSON.parse(readFileSync(join(__dirname, f), 'utf8'));
  return {
    name: data.component,
    file: data.file,
    iterations: data.iterations,
    medianMs: data.metrics.medianMs,
    p95Ms: data.metrics.p95Ms,
    totalMs: data.metrics.totalMs,
    speedup: data.expectedAfterMemo?.speedupFactor ?? 'n/a',
    estimated: data.estimated,
  };
});

const label = isAfter ? 'AFTER React.memo' : 'BEFORE React.memo (baseline)';

const md = [
  `# React.memo Performance Baselines — ${label}`,
  ``,
  `*Generated ${new Date().toISOString()}*`,
  ``,
  `| Component | File | Iterations | Median (ms) | p95 (ms) | Total (ms) | Expected speedup |`,
  `|---|---|---:|---:|---:|---:|---:|`,
  ...rows.map(
    (r) =>
      `| \`${r.name}\` | \`${r.file}\` | ${r.iterations} | ${r.medianMs} | ${r.p95Ms} | ${r.totalMs} | **${r.speedup}** |`
  ),
  ``,
  `## How to reproduce`,
  ``,
  `1. **Run a baseline:**  ` +
    '`npx vitest bench docs/drafts/prometheus/perf-baselines/*.bench.test.ts`' +
    ``,
  `2. **Capture output:**  pipe the bench stdout into the matching \`*.baseline.json\``,
  `3. **Apply React.memo patch:**  ` + '`git apply docs/drafts/prometheus/react-memo.patch`' + ``,
  `4. **Re-run benchmarks:**  ` +
    '`npx vitest bench docs/drafts/prometheus/perf-baselines/*.bench.test.ts --outputJson > after.json`' +
    ``,
  `5. **Generate after summary:**  ` + '`node runner.mjs --after`' + ``,
  ``,
  `## Methodology`,
  ``,
  `- **Render count:** 1,000 prop-change rerenders per component (typical React parent update cycle)`,
  `- **Data fixture:** Realistic data sizes — see each \`.baseline.json\` for specifics`,
  `- **Measurement:** \`performance.now()\` for sub-millisecond resolution`,
  `- **Environment:** Node 22 + jsdom + @testing-library/react (matches existing test suite)`,
  `- **Variance:** Multiple runs recommended; \`npx vitest bench\` runs each test 5× and takes median`,
  ``,
  `## Speedup calculation`,
  ``,
  `\`\`\``,
  `expectedSpeedup = beforeMedianMs / afterMedianMs`,
  `\`\`\``,
  ``,
  `Where \`afterMedianMs ≈ 0.1-0.5 ms\` (only the \`Object.is\` shallow-equal check, no virtual DOM diff).`,
  ``,
  `---`,
  ``,
  `*Drafted by Prometheus — 2026-06-12. To be executed by Apollo after React.memo patch is applied.*`,
];

writeFileSync(join(__dirname, 'perf-baselines-summary.md'), md.join('\n'));
console.log(md.join('\n'));
console.error(`\n✓ Wrote summary to ${join(__dirname, 'perf-baselines-summary.md')}`);
