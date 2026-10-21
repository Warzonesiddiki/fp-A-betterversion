/**
 * `scripts/license-check.mjs` must fail closed.
 *
 * WHY THIS EXISTS
 * ---------------
 * Audit P2-21 flagged `license:check` as a gate that could not fail. Reading
 * the pre-2026-10-21 source confirms three independent holes:
 *
 *   1. `ACCEPTABLE_LICENSES` was declared and never consulted — the script was
 *      a denylist, so `UNKNOWN` fell through to `✅ name: UNKNOWN`.
 *   2. A dependency with no readable license field became the literal string
 *      `UNKNOWN`, matched no rejected pattern, and was blessed.
 *   3. The outer `catch` printed "best-effort in sandboxed environments" and
 *      exited **0**, so a failed `npm ls` (no node_modules, bad JSON) reported
 *      success having verified nothing.
 *
 * That is the same defect class as the Windows path bug previously found in
 * `ratchet-docs-check.mjs`: a check whose failure path is indistinguishable
 * from its success path. These tests pin the three exit codes — 0 verified ok,
 * 1 rejected/unverifiable, 2 could-not-verify-at-all — and assert the allowlist
 * is load-bearing rather than decorative.
 *
 * Every fixture is a throwaway JSON file in `tmpdir()` fed via
 * `--npm-ls-json=`, so no test needs `node_modules` and none touches the repo.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'license-check.mjs');

let tmpDir: string | null = null;

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Write an `npm ls --json` shaped fixture and run the script against it. */
function runWithInventory(deps: Record<string, unknown>): RunResult {
  if (!tmpDir) tmpDir = mkdtempSync(join(tmpdir(), 'license-check-'));
  const file = join(tmpDir, 'npm-ls.json');
  writeFileSync(file, JSON.stringify({ dependencies: deps }), 'utf8');

  try {
    const stdout = execFileSync('node', [SCRIPT, `--npm-ls-json=${file}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { status: 0, stdout, stderr: '' };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return {
      status: err.status ?? -1,
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
    };
  }
}

describe('license-check — acceptable inventories pass', () => {
  it('passes an inventory of allowlisted licenses and exits 0', () => {
    const r = runWithInventory({
      react: { license: 'MIT' },
      tauri: { license: 'Apache-2.0' },
      decimal: { license: 'BSD-3-Clause' },
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('License check passed');
  });

  it('accepts a licence only via the `licenses[]` legacy shape', () => {
    const r = runWithInventory({
      legacy: { licenses: [{ type: 'MIT' }] },
    });
    expect(r.status).toBe(0);
  });

  it('handles SPDX OR: one acceptable alternative is enough', () => {
    expect(runWithInventory({ a: { license: 'MIT OR Apache-2.0' } }).status).toBe(0);
    // GPL-3.0 OR MIT — the consumer may choose MIT, so this is permitted.
    expect(runWithInventory({ b: { license: 'GPL-3.0 OR MIT' } }).status).toBe(0);
  });

  it('normalises SPDX suffixes (Apache-2.0-only)', () => {
    expect(runWithInventory({ a: { license: 'Apache-2.0-only' } }).status).toBe(0);
  });
});

describe('license-check — the allowlist is load-bearing', () => {
  it('fails closed on a license that is not rejected but not allowlisted', () => {
    // Pre-fix this logged "✅ ... UNKNOWN" and exited 0.
    const r = runWithInventory({ mystery: { license: 'SomeCustomLicense-1.0' } });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('CANNOT VERIFY');
    expect(r.stderr).toContain('mystery');
  });

  it('fails closed when the license field is entirely absent', () => {
    // Pre-fix: `UNKNOWN`, matches no denylist pattern, ✅ and exit 0.
    const r = runWithInventory({ nolicense: { version: '1.0.0' } });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('no license field');
    expect(r.stderr).toContain('nolicense');
  });

  it('fails closed on "SEE LICENSE IN ..."', () => {
    const r = runWithInventory({ opaque: { license: 'SEE LICENSE IN LICENSE.md' } });
    expect(r.status).toBe(1);
  });
});

describe('license-check — rejected licenses', () => {
  it('rejects GPL-3.0', () => {
    const r = runWithInventory({ gpl: { license: 'GPL-3.0' } });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('REJECTED');
  });

  it('rejects AGPL regardless of version suffix', () => {
    expect(runWithInventory({ a: { license: 'AGPL-3.0-or-later' } }).status).toBe(1);
  });

  it('rejects an AND expression where one side is rejected', () => {
    expect(runWithInventory({ a: { license: 'MIT AND GPL-3.0' } }).status).toBe(1);
  });

  it('rejects UNLICENSED', () => {
    expect(runWithInventory({ a: { license: 'UNLICENSED' } }).status).toBe(1);
  });
});

describe('license-check — cannot verify at all exits 2, never 0', () => {
  it('exits 2 when the inventory file cannot be read', () => {
    // The pre-fix catch printed "best-effort" and exited 0.
    const r = runWithInventory({ ignored: { license: 'MIT' } });
    // Overwrite the fixture path with a missing file via a fresh temp dir.
    const missing = join(tmpdir(), `does-not-exist-${Date.now()}.json`);
    try {
      execFileSync('node', [SCRIPT, `--npm-ls-json=${missing}`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      throw new Error('expected a non-zero exit');
    } catch (e) {
      const err = e as { status?: number; stderr?: string };
      expect(err.status).toBe(2);
      expect(err.stderr).toContain('could not read the dependency inventory');
    }
    expect(r.status).toBe(0); // sanity: the valid fixture still passes
  });

  it('exits 2 on an empty inventory rather than reporting a vacuous pass', () => {
    const r = runWithInventory({});
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('zero production dependencies');
  });
});
