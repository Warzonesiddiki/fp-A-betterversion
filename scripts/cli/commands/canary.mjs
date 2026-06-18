#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * @fileoverview `devex canary` — run Apollo's canary health check (TSC + ESLint
 * + Build per CAVEMAN_PERSIST cycle-25-turn-322 PROMETHEUS 18th HL).
 *
 * @version v0.1.1
 * @date 2026-06-18
 * @author Prometheus
 *
 * @example
 *   node scripts/cli/devex.mjs canary
 *   node scripts/cli/devex.mjs canary --skip-build
 */

import { spawn } from 'node:child_process';

/** Spawn a single command via shell; resolve with its exit code. */
function runStep(label, cmdString) {
  return new Promise((resolve) => {
    console.log(`\n── canary:${label} ───────────────────────────`);
    const child = spawn(cmdString, { stdio: 'inherit', shell: true });
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error(`canary:${label} failed to spawn:`, err);
      resolve(1);
    });
  });
}

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex canary [--skip-build]');
    console.log('Runs: tsc --noEmit && eslint src --max-warnings 0 && vite build');
    console.log('Options:');
    console.log('  --skip-build   Skip the production build step');
    return 0;
  }

  const skipBuild = args.includes('--skip-build');

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  const tscCode = await runStep(
    'tsc',
    `${npmCmd} exec -- tsc --noEmit -p tsconfig.json`,
  );
  if (tscCode !== 0) {
    console.error(`\n❌ canary FAILED at tsc (exit ${tscCode})`);
    return tscCode;
  }

  const lintCode = await runStep(
    'lint',
    `${npmCmd} exec -- eslint src --max-warnings 0`,
  );
  if (lintCode !== 0) {
    console.error(`\n❌ canary FAILED at lint (exit ${lintCode})`);
    return lintCode;
  }

  if (!skipBuild) {
    const buildCode = await runStep('build', 'npx vite build');
    if (buildCode !== 0) {
      console.error(`\n❌ canary FAILED at build (exit ${buildCode})`);
      return buildCode;
    }
  }

  console.log('\n✅ canary PASSED (TSC + ESLint + Build)');
  return 0;
}