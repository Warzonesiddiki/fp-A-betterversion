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

function runChecker(file: string, scopeFile?: string) {
  const args = [SCRIPT, '--file', file];
  if (scopeFile) args.push('--scope-file', scopeFile);
  return spawnSync(process.execPath, args, {
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
    expect(result.stderr).toContain('93 sections UNASSESSED — SOURCE OWED (108–200)');
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

  it.each(['WORKS', 'RETIRED', 'NOT-SUPPORTED'])(
    'rejects a source-owed row silently promoted to %s',
    (status) => {
      const markdown = readFileSync(SOURCE, 'utf8').replace(
        'Rows 108–110 remain unresolved',
        'Rows 109–110 remain unresolved'
      );
      const file = join(TEMP_DIR, `source-owed-${status}.md`);
      writeFileSync(
        file,
        `${markdown}\n| 108 | Source text owed | ${status} — no source | Phase review | Evidence owed |\n`
      );
      const result = runChecker(file);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain('row 108 is source-owed');
    }
  );

  it('keeps source-owed placeholder rows unassessed even when every legacy row exists', () => {
    const markdown = readFileSync(SOURCE, 'utf8').replace(
      'Rows 108–110 remain unresolved',
      'Legacy rows are represented by source-owed placeholders'
    );
    const file = join(TEMP_DIR, 'legacy-placeholders.md');
    writeFileSync(
      file,
      markdown +
        [108, 109, 110]
          .map(
            (number) =>
              `\n| ${number} | Source text owed | UNASSESSED — SOURCE OWED | Await source | Evidence owed |`
          )
          .join('')
    );
    const result = runChecker(file);
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('93 sections UNASSESSED — SOURCE OWED (108–200)');
    expect(result.stdout).not.toContain('all 110 declared owner sections are mapped');
  });

  it('fails closed when the supplemental scope contract cannot be read', () => {
    const result = runChecker(SOURCE, join(TEMP_DIR, 'missing-scope.md'));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('cannot read owner scope register');
  });

  it('fails closed when scope metadata is missing instead of falling back to 110', () => {
    const file = join(TEMP_DIR, 'incomplete-scope.md');
    writeFileSync(file, 'Source text owed. Missing is not zero.');
    const result = runChecker(SOURCE, file);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('missing or invalid coverage-scope contract');
  });
  it('requires all expected rows once the source contract marks them reviewed', () => {
    const file = join(TEMP_DIR, 'reviewed-scope.md');
    writeFileSync(
      file,
      '<!-- coverage-scope: {"expectedSections":200,"sourceOwed":[],"decision":"DEC-034"} -->'
    );
    const result = runChecker(SOURCE, file);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('reviewed owner sections 108–200 require coverage rows');
  });
});
