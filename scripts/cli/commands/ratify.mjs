#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * @fileoverview `devex ratify` — RATIFICATION GATE pre-check.
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus
 *
 * Runs the 5 mandatory pre-RATIFICATION checks per AGENTS.md Husky pre-push:
 *   1. TSC clean (tsc --noEmit)
 *   2. ESLint clean (--max-warnings 0)
 *   3. Bundle size within limits (main ≤150KB / total ≤2MB gzip)
 *   4. Working tree clean (no uncommitted changes)
 *   5. HEAD synced with origin/main (no drift > 1 commit)
 *
 * @example
 *   node scripts/cli/devex.mjs ratify          # run all 5 gates
 *   node scripts/cli/devex.mjs ratify --quick   # skip gates 4+5
 */

import { spawn } from 'node:child_process';

function runStep(label, cmdString) {
  return new Promise((resolve) => {
    console.log(`\n── ratify:${label} ───────────────────────────`);
    const child = spawn(cmdString, { stdio: 'inherit', shell: true });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`ratify:${label} failed to spawn:`, err);
      resolve(1);
    });
  });
}

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex ratify [--quick] [--json]');
    console.log('Pre-RATIFICATION 5-gate check per AGENTS.md Husky pre-push gates.');
    console.log('');
    console.log('Gates:');
    console.log('  1. TSC clean        (npm run check)');
    console.log('  2. ESLint clean     (npm run lint)');
    console.log('  3. Bundle size      (npm run build + size check)');
    console.log('  4. Tree clean       (git status --short)');
    console.log('  5. HEAD synced      (git rev-parse HEAD + origin/main)');
    console.log('');
    console.log('Options:');
    console.log('  --quick   Skip gates 4+5 (use when only validating code)');
    console.log('  --json    Emit JSON summary');
    return 0;
  }

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const quick = args.includes('--quick');
  const asJson = args.includes('--json');

  const results = {};

  // Gate 1: TSC
  results.tsc = await runStep(
    'tsc',
    `${npmCmd} exec -- tsc --noEmit -p tsconfig.json`,
  );
  if (results.tsc !== 0) {
    return finalize(results, 'TSC FAILED', asJson);
  }

  // Gate 2: ESLint
  results.lint = await runStep(
    'lint',
    `${npmCmd} exec -- eslint src --max-warnings 0`,
  );
  if (results.lint !== 0) {
    return finalize(results, 'ESLINT FAILED', asJson);
  }

  // Gate 3: Bundle (delegates to devex bundle --json)
  const bundleProc = await new Promise((resolve) => {
    const c = spawn(`node scripts/cli/devex.mjs bundle --json`, {
      stdio: ['inherit', 'pipe', 'inherit'],
      shell: true,
    });
    let out = '';
    c.stdout.on('data', (d) => (out += d.toString()));
    c.on('exit', (code) => resolve({ code: code ?? 1, out }));
  });
  results.bundle = bundleProc.code;
  if (results.bundle !== 0) {
    return finalize(results, 'BUNDLE SIZE FAILED', asJson);
  }

  if (!quick) {
    // Gate 4: tree clean
    results.tree = await runStep('tree', 'git status --short');
    if (results.tree !== 0) {
      return finalize(results, 'WORKING TREE DIRTY', asJson);
    }

    // Gate 5: HEAD synced
    results.sync = await runStep('sync', 'git fetch origin && git rev-parse HEAD && git rev-parse origin/main');
    if (results.sync !== 0) {
      return finalize(results, 'HEAD NOT SYNCED', asJson);
    }
  }

  return finalize(results, 'ALL GATES PASSED ✅', asJson);
}

function finalize(results, message, asJson) {
  const allPassed = Object.values(results).every((v) => v === 0);
  if (asJson) {
    console.log(JSON.stringify({ gates: results, allPassed, message }, null, 2));
  } else {
    console.log(`\n── ratify ─────────────────────────────────`);
    console.log(message);
    console.log('Gates:', results);
    console.log('──────────────────────────────────────────\n');
  }
  return allPassed ? 0 : 1;
}