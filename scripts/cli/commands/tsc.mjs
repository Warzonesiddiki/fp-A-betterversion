#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * @fileoverview `devex tsc` — run `npx tsc --noEmit` with project defaults
 * (per AGENTS.md §Commands: `npx tsc --noEmit`).
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus
 *
 * @example
 *   node scripts/cli/devex.mjs tsc
 *   node scripts/cli/devex.mjs tsc --pretty
 */

import { spawn } from 'node:child_process';

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex tsc [extra args...]');
    console.log('Runs: npx tsc --noEmit -p tsconfig.json [extra args...]');
    return 0;
  }
  return new Promise((resolve) => {
    // shell:true because on Windows npm.cmd needs it for PATH resolution.
    // DEP0190 is a false positive for our trusted local invocations.
    const child = spawn(
      'npm.cmd exec -- tsc --noEmit -p tsconfig.json ' + args.join(' '),
      {
        stdio: 'inherit',
        shell: true,
      },
    );
    child.on('exit', (code) => resolve(code ?? 1));
    child.on('error', (err) => {
      console.error('Failed to spawn tsc:', err);
      resolve(1);
    });
  });
}
