#!/usr/bin/env node
 
/**
 * @fileoverview `devex test` — run Vitest with optional scope.
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus
 *
 * @example
 *   node scripts/cli/devex.mjs test
 *   node scripts/cli/devex.mjs test src/engines/monte-carlo
 *   node scripts/cli/devex.mjs test --coverage
 */

import { spawn } from 'node:child_process';

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex test [path] [options]');
    console.log('Runs: vitest run [path] [options]');
    console.log('');
    console.log('Examples:');
    console.log('  devex test                          # full suite');
    console.log('  devex test src/engines/monte-carlo  # focused');
    console.log('  devex test --coverage               # with coverage report');
    console.log('  devex test --watch                  # watch mode');
    return 0;
  }

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';

  // Build vitest args; skip our --help/-h (already handled)
  const vitestArgs = args.filter((a) => a !== '--help' && a !== '-h');

  const cmdString = `${npmCmd} exec -- vitest run ${vitestArgs.join(' ')}`;

  console.log(`\n── devex:test ───────────────────────────`);
  console.log(`$ ${cmdString}\n`);

  return await new Promise((resolve) => {
    const child = spawn(cmdString, { stdio: 'inherit', shell: true });
    child.on('exit', (code) => {
      console.log(`\n── devex:test exit ${code ?? 1} ───────────────────────────`);
      resolve(code ?? 1);
    });
    child.on('error', (err) => {
      console.error('devex:test failed to spawn:', err);
      resolve(1);
    });
  });
}