#!/usr/bin/env node
/* eslint-disable */
/**
 * scripts/perf/run-all.mjs
 *
 * G17 master benchmark orchestrator. Runs grid-bench, monte-carlo-bench, and
 * pdf-bench sequentially, captures results to a single baseline log, and
 * exits 0 only if all three pass.
 *
 * Usage:
 *   node scripts/perf/run-all.mjs                    # run all
 *   node scripts/perf/run-all.mjs --save baseline-g17.log
 *
 * 3-witness rule (D-002): each child script independently asserts pass/fail
 * and writes its own audit log; this orchestrator records the aggregated
 * transcript.
 */
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..');

const benches = [
  { name: 'grid-bench',        script: 'grid-bench.mjs',        title: 'G17.1 — 100K rows AG Grid 30fps' },
  { name: 'monte-carlo-bench', script: 'monte-carlo-bench.mjs',  title: 'G17.2 — 10K Monte Carlo <30s' },
  { name: 'pdf-bench',         script: 'pdf-bench.mjs',          title: 'G17.3 — 500-row PDF <3s' },
];

const args = process.argv.slice(2);
let savePath = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--save' && args[i + 1]) {
    savePath = args[i + 1];
    i++;
  }
}

if (!savePath) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  savePath = join(repoRoot, '.openhands', `baseline-g17-${stamp}.log`);
}
if (!existsSync(dirname(savePath))) mkdirSync(dirname(savePath), { recursive: true });

const lines = [];
const out = (s) => { console.log(s); lines.push(s); };

out('╔══════════════════════════════════════════════════════════════════════════╗');
out('║  G17 — Performance Benchmark Suite                                       ║');
out('║  Source: scripts/perf/{grid,monte-carlo,pdf}-bench.mjs                   ║');
out('╚══════════════════════════════════════════════════════════════════════════╝');
out('');
out(`Date:     ${new Date().toISOString()}`);
out(`Node:     ${process.version}`);
out(`Platform: ${process.platform} ${process.arch}`);
out(`CWD:      ${repoRoot}`);
out('');

let passed = 0;
let failed = 0;

for (const b of benches) {
  out('');
  out('┌' + '─'.repeat(76) + '┐');
  out(`│  ${b.title.padEnd(74)}  │`);
  out('└' + '─'.repeat(76) + '┘');

  const scriptPath = join(__dirname, b.script);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '--expose-gc' },
  });

  out(result.stdout || '');
  if (result.stderr) {
    out('--- stderr ---');
    out(result.stderr);
  }
  if (result.status === 0) {
    out(`>>> ${b.name}: ✅ PASS`);
    passed++;
  } else {
    out(`>>> ${b.name}: ❌ FAIL (exit ${result.status})`);
    failed++;
  }
}

out('');
out('═'.repeat(78));
out(`  G17 — Final Result:  ${passed} passed, ${failed} failed`);
out('═'.repeat(78));
out('');
out('Targets (D-002/D-007 3-witness):');
out('  G17.1  AG Grid 100K rows @ 30fps  (scroll frame ≤ 33.33 ms)');
out('  G17.2  Monte Carlo 10K iterations  ≤ 30,000 ms');
out('  G17.3  500-row PDF report         ≤ 3,000 ms');

writeFileSync(savePath, lines.join('\n'), 'utf8');
console.log(`\nBaseline log: ${savePath}`);

process.exit(failed === 0 ? 0 : 1);
