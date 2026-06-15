/* eslint-disable */
/**
 * scripts/perf/emit-baseline.cjs
 *
 * Emits a final consolidated G10 + G17 baseline log:
 *   .openhands/baseline-p1-g10-g17.log
 *
 * 3-witness rule (D-002): pulls fresh results from:
 *   1. audit-stores.cjs (G10 — 35/35 canonical)
 *   2. scripts/perf/run-all.mjs  (G17 — grid / monte-carlo / pdf)
 *   3. git status (D-009 — real file:line evidence)
 */
'use strict';
const { spawnSync } = require('node:child_process');
const { writeFileSync, readFileSync, existsSync } = require('node:fs');
const { join } = require('node:path');

const repoRoot = process.cwd();
const out = [];
const ln = (s = '') => { console.log(s); out.push(s); };

ln('╔══════════════════════════════════════════════════════════════════════════╗');
ln('║  P1 — G10 + G17  BASELINE REPORT                                        ║');
ln(`║  Generated: ${new Date().toISOString().padEnd(56)}║`);
ln('╚══════════════════════════════════════════════════════════════════════════╝');
ln('');

// --- 1. G10 audit ---
ln('═'.repeat(78));
ln('  G10 — Stores canonical (subscribeWithSelector + persist + immer + migrate)');
ln('═'.repeat(78));
ln('');
const audit = spawnSync(process.execPath, ['audit-stores.cjs'], { encoding: 'utf8' });
ln(audit.stdout);
ln('');

// --- 2. G17 perf benchmarks ---
ln('═'.repeat(78));
ln('  G17 — Performance benchmarks');
ln('═'.repeat(78));
ln('');
const perf = spawnSync(process.execPath, ['scripts/perf/run-all.mjs'], {
  encoding: 'utf8',
  env: { ...process.env, NODE_OPTIONS: '--expose-gc' },
});
ln(perf.stdout);
ln('');

// --- 3. Git evidence ---
ln('═'.repeat(78));
ln('  D-009 — Real file evidence (git status)');
ln('═'.repeat(78));
ln('');
const git = spawnSync('git', ['status', '--short'], { encoding: 'utf8' });
ln(git.stdout || '(no git changes — all committed)');
ln('');

const gitLog = spawnSync('git', ['log', '--oneline', '-5'], { encoding: 'utf8' });
ln('Recent commits:');
ln(gitLog.stdout);
ln('');

const dest = join(repoRoot, '.openhands', 'baseline-p1-g10-g17.log');
writeFileSync(dest, out.join('\n'), 'utf8');
console.log(`\nWritten to: ${dest}`);

// Exit code mirrors G17 outcome
process.exit(perf.status || 0);
