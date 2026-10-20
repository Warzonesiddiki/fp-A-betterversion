#!/usr/bin/env node
/** Prove populated updateBudget denial tests detect removal of its real guard.
 * The mutation is a test-only Vite transform; checked-out source is never edited.
 * Both the normal 5/5 pass and the exact mutant 4-denied/1-Admin split are required.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'fp-budget-guard-'));
const sourcePath = join(root, 'src/store/budgetStore.ts');
const original = readFileSync(sourcePath, 'utf8');

try {
  const config = join(temporary, 'mutant.config.mjs');
  writeFileSync(
    config,
    `import base from ${JSON.stringify(join(root, 'vite.config.ts'))};
export default {
  ...base,
  plugins: [...base.plugins, {
    name: 'budget-update-guard-removal-proof', enforce: 'pre',
    transform(source, id) {
      if (id.split('?')[0] !== ${JSON.stringify(sourcePath)}) return;
      const pattern = /\\bupdateBudget:\\s*enforce\\(/g;
      if ([...source.matchAll(pattern)].length !== 1) throw new Error('Expected exactly one updateBudget guard');
      return source.replace(pattern, 'updateBudget: ((_permission, _action, handler) => handler)(');
    }
  }]
};
`
  );

  function run(name, extra = []) {
    const reportPath = join(temporary, `${name}.json`);
    const child = spawnSync(
      process.execPath,
      [
        '--max-old-space-size=2800',
        join(root, 'node_modules/vitest/vitest.mjs'),
        'run',
        'src/store/budgetStore.authorization.test.ts',
        '-t',
        'updateBudget',
        '--maxWorkers=2',
        '--reporter=json',
        `--outputFile=${reportPath}`,
        ...extra,
      ],
      { cwd: root, encoding: 'utf8', timeout: 120_000, maxBuffer: 32 * 1024 * 1024 }
    );
    if (child.error || child.signal)
      throw child.error ?? new Error(`Runner signal: ${child.signal}`);
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    return {
      exit: child.status,
      passed: report.numPassedTests,
      failed: report.numFailedTests,
      passedTitles: report.testResults.flatMap((file) =>
        file.assertionResults.filter((test) => test.status === 'passed').map((test) => test.title)
      ),
      failedTitles: report.testResults
        .flatMap((file) =>
          file.assertionResults.filter((test) => test.status === 'failed').map((test) => test.title)
        )
        .sort(),
    };
  }

  const normal = run('normal');
  const mutant = run('mutant', ['--config', config]);
  if (normal.exit !== 0 || normal.passed !== 5 || normal.failed !== 0) {
    throw new Error(`Normal guard witnesses failed: ${JSON.stringify(normal)}`);
  }
  if (mutant.exit !== 1 || mutant.passed !== 1 || mutant.failed !== 4) {
    throw new Error(
      `Guard-removal mutant was not killed by all four denials: ${JSON.stringify(mutant)}`
    );
  }
  const expectedDenials = [
    'no session',
    'Viewer',
    'exact permission withheld',
    'stale Admin object',
  ]
    .map((session) => `denies ${session} with no financial or history mutation`)
    .sort();
  if (
    JSON.stringify(mutant.failedTitles) !== JSON.stringify(expectedDenials) ||
    JSON.stringify(mutant.passedTitles) !==
      JSON.stringify(['actually changes populated state for a full Admin'])
  ) {
    throw new Error(`Unexpected mutation witnesses: ${JSON.stringify(mutant)}`);
  }
  if (readFileSync(sourcePath, 'utf8') !== original) throw new Error('Checked-out source changed');
  console.log(
    `PASS normal ${normal.passed}/5; guard-removal mutant ${mutant.failed} denied-case failures / ${mutant.passed} Admin pass; source unchanged.`
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
