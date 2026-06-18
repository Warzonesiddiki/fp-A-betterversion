#!/usr/bin/env node
 
/**
 * @fileoverview `devex bench` — run T-PR-082 perf benchmarks.
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus
 *
 * @example
 *   node scripts/cli/devex.mjs bench                # list suites
 *   node scripts/cli/devex.mjs bench --monte-carlo  # 10K Monte Carlo trials
 *   node scripts/cli/devex.mjs bench --cash-flow     # 10K journal entries
 */

import { spawn } from 'node:child_process';

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex bench [--suite NAME]');
    console.log('Runs T-PR-082 perf benchmarks (Vulcan T-PR-082 owner).');
    console.log('');
    console.log('Suites:');
    console.log('  --monte-carlo   10K Monte Carlo trials under xoshiro128 seed=42');
    console.log('  --cash-flow     10K journal entries batch insert p95 latency');
    console.log('  --ai-forecast   AI Forecast perf cells (P0A-02 50-user concurrent)');
    console.log('  --collab        Real-time Collab 50-user 100 ops/sec WebSocket');
    console.log('  --integration   Full-stack Vite+AG Grid+Recharts+Tauri under load');
    console.log('');
    console.log('Owner: Vulcan (T-PR-082 perf DRI).');
    console.log('See docs/CAVEMAN_PERSIST/CYCLE_25_TURN_386_PLUS_VULCAN_TN2_TPR082_v0_7.md');
    return 0;
  }

  const suite = args.find((a) => a.startsWith('--')) ?? '--list';

  const benchFiles = {
    '--monte-carlo': 'scripts/perf/T-PR-082/monte-carlo.spec.ts',
    '--cash-flow': 'scripts/perf/T-PR-082/cash-flow.spec.ts',
    '--ai-forecast': 'scripts/perf/T-PR-082/ai-forecast.spec.ts',
    '--collab': 'scripts/perf/T-PR-082/realtime-collab.spec.ts',
    '--integration': 'scripts/perf/T-PR-082/integration.spec.ts',
  };

  const benchFile = benchFiles[suite];

  if (suite === '--list' || !benchFile) {
    console.log('Available suites:');
    console.log('  --monte-carlo, --cash-flow, --ai-forecast, --collab, --integration');
    console.log('\nNOTE: T-PR-082 perf scripts are OWNED by Vulcan and may not exist yet.');
    console.log('      This command is a placeholder ready for Vulcan T-N+2 implementation.');
    return 0;
  }

  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const cmdString = `${npmCmd} exec -- vitest bench --run ${benchFile}`;

  console.log(`\n── devex:bench (${suite}) ───────────────────────────`);
  return await new Promise((resolve) => {
    const child = spawn(cmdString, { stdio: 'inherit', shell: true });
    child.on('exit', (code) => {
      console.log(`\n── devex:bench exit ${code ?? 1} ───────────────────────────`);
      resolve(code ?? 1);
    });
    child.on('error', (err) => {
      console.error('devex:bench failed to spawn:', err);
      resolve(1);
    });
  });
}