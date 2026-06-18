#!/usr/bin/env node
 
/**
 * @fileoverview `devex lint` — run `npx eslint src --max-warnings 0` (the
 * Husky pre-push Gate 2 default per AGENTS.md).
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus
 *
 * @example
 *   node scripts/cli/devex.mjs lint
 *   node scripts/cli/devex.mjs lint --fix
 */

import { spawn } from 'node:child_process';

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex lint [extra args...]');
    console.log('Runs: npx eslint src --max-warnings 0 [extra args...]');
    return 0;
  }
  return new Promise((resolve) => {
    const child = spawn(
      'npm.cmd exec -- eslint src --max-warnings 0 ' + args.join(' '),
      { stdio: 'inherit', shell: true },
    );
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error('Failed to spawn eslint:', err);
      resolve(1);
    });
  });
}
