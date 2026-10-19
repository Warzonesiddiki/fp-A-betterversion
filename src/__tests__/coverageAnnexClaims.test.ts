import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const SCRIPT = resolve(ROOT, 'scripts/check-coverage-annex.mjs');
const SOURCE = resolve(ROOT, 'docs/MASTER_CHECKLIST_COVERAGE.md');
const TEMP_DIR = mkdtempSync(join(tmpdir(), 'coverage-annex-check-'));

afterAll(() => rmSync(TEMP_DIR, { recursive: true, force: true }));

function runChecker(file: string) {
  return spawnSync(process.execPath, [SCRIPT, '--file', file], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

describe('coverage annex claim checker', () => {
  it('accepts the measured annex while disclosing the unresolved owner rows', () => {
    const result = runChecker(SOURCE);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('107 mapped rows');
    expect(`${result.stdout}\n${result.stderr}`).toContain('108–110 remain unresolved');
  });

  it('rejects a deliberately incorrect pinned RBAC count in row 26', () => {
    const markdown = readFileSync(SOURCE, 'utf8');
    const row26 = markdown.split('\n').find((line) => line.startsWith('| 26  |'));
    expect(row26).toBeDefined();
    expect(row26).toContain('409');

    const wrong = markdown.replace('pins 409 Zustand', 'pins 408 Zustand');
    const wrongFile = join(TEMP_DIR, 'wrong-row-26.md');
    writeFileSync(wrongFile, wrong);

    const result = runChecker(wrongFile);
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toContain('row 26');
    expect(`${result.stdout}\n${result.stderr}`).toContain('408');
    expect(`${result.stdout}\n${result.stderr}`).toContain('409');
  });
});
