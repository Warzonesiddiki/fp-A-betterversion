#!/usr/bin/env node
/**
 * Sharded full-suite runner for memory-constrained machines.
 *
 * `npm test` asks Node for an 8 GB heap and lets Vitest hold every one of the
 * ~1200 test files' module graphs in a single process tree. On a developer box
 * or CI runner with less RAM than that, the run either thrashes or is simply
 * never attempted — which is how three genuine failures (a stale hand-written
 * lucide mock in src/pages/smoke.test.tsx and a missing /visual/atlas help
 * entry) survived in the tree while every scoped run reported green.
 *
 * This runner executes the suite in N sequential shards, each in its own
 * process with a modest heap, and aggregates the result. Total wall time is
 * comparable to the single-process run; peak memory is a fraction of it.
 *
 * Usage:
 *   node scripts/test-sharded.mjs                 # 8 shards, 2 workers, 2800 MB
 *   node scripts/test-sharded.mjs --shards=4
 *   node scripts/test-sharded.mjs --workers=4 --heap=4096
 *   node scripts/test-sharded.mjs --only=3        # run just shard 3
 *
 * Exits non-zero if any shard fails.
 */
import { spawnSync } from 'node:child_process';

function arg(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.split('=')[1]) : fallback;
}

const shards = arg('shards', 8);
const workers = arg('workers', 2);
const heap = arg('heap', 2800);
const only = arg('only', 0);

const targets = only ? [only] : Array.from({ length: shards }, (_, i) => i + 1);
const results = [];
const started = Date.now();

for (const shard of targets) {
  process.stdout.write(`\n=== shard ${shard}/${shards} ===\n`);
  const t0 = Date.now();
  const run = spawnSync(
    process.execPath,
    [
      `--max-old-space-size=${heap}`,
      'node_modules/vitest/vitest.mjs',
      'run',
      `--shard=${shard}/${shards}`,
      `--maxWorkers=${workers}`,
      '--reporter=dot',
    ],
    { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' }
  );

  const out = run.stdout ?? '';
  process.stdout.write(out);

  // Vitest's summary lines, stripped of ANSI, e.g. "Tests  1568 passed (1568)".
  const plain = out.replace(/\u001b\[[0-9;]*m/g, '');
  const files = /Test Files\s+(.*)/.exec(plain)?.[1]?.trim() ?? 'unknown';
  const tests = /\bTests\s+(.*)/.exec(plain)?.[1]?.trim() ?? 'unknown';

  results.push({
    shard,
    ok: run.status === 0,
    files,
    tests,
    seconds: Math.round((Date.now() - t0) / 1000),
  });
}

const failed = results.filter((r) => !r.ok);

process.stdout.write(`\n${'='.repeat(72)}\nSharded suite summary\n${'='.repeat(72)}\n`);
for (const r of results) {
  process.stdout.write(
    `${r.ok ? 'PASS' : 'FAIL'}  shard ${r.shard}/${shards}  ${String(r.seconds).padStart(4)}s  ${r.tests}\n`
  );
}
process.stdout.write(
  `\n${results.length - failed.length}/${results.length} shards passed in ${Math.round((Date.now() - started) / 1000)}s\n`
);

if (failed.length > 0) {
  process.stdout.write(`\nFailing shards: ${failed.map((r) => r.shard).join(', ')}\n`);
  process.stdout.write(
    `Re-run one with: node scripts/test-sharded.mjs --shards=${shards} --only=${failed[0].shard}\n`
  );
  process.exit(1);
}
