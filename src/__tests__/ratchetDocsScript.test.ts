/**
 * The four ratchet numbers in `docs/agent/09_KNOWN_GAPS.md` must be the four
 * numbers the gates enforce.
 *
 * WHY THIS EXISTS
 * ---------------
 * The "Ratchet baselines (direction: down only)" table is what a reviewer plans
 * against, and it had drifted from the tree: it claimed determinism 345 / 80
 * while `scripts/determinism-baseline.json` enforced 344 / 79, type-safety
 * escapes 116 while the ratchet measured 47, and a money-adoption floor of
 * 28.89 % while the recorded baseline was 23.54 %. Two of four documented gates
 * were not the gates in force — one of them (type escapes) described a budget
 * 69 casts looser than reality, so the doc invited regressions the gate would
 * have allowed.
 *
 * `scripts/ratchet-docs-check.mjs` converts those claims into checked numbers
 * and runs inside `npm run docs:verify`. This suite pins the checker itself:
 * the real doc must agree with every baseline, a drifted value must fail, and a
 * deleted row must fail too so the check cannot be switched off by removing the
 * line it verifies.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'ratchet-docs-check.mjs');
const DOC = join(ROOT, 'docs', 'agent', '09_KNOWN_GAPS.md');

const EXPECTED_ROWS = [
  'determinism sites / files',
  'type-safety escapes',
  'money AST violations',
  'money adoption',
];

interface Checked {
  row: string;
  documented: string | null;
  expected: string;
  ok: boolean;
}
interface Report {
  doc: string;
  ok: boolean;
  checked: Checked[];
  problems: string[];
}

function run(args: string[]): { status: number; output: string } {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, output: stdout };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? 1, output: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

/** Run the checker against a mutated copy of the real doc. */
function runAgainst(mutate: (md: string) => string): { status: number; output: string } {
  const dir = mkdtempSync(join(tmpdir(), 'ratchet-docs-'));
  try {
    const path = join(dir, '09_KNOWN_GAPS.md');
    writeFileSync(path, mutate(readFileSync(DOC, 'utf8')), 'utf8');
    return run([`--doc=${path}`, '--json']);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('ratchet-docs-check', () => {
  it('reports every documented ratchet value as equal to the gate that enforces it', () => {
    const { status, output } = run(['--json']);

    expect(status).toBe(0);
    const report = JSON.parse(output) as Report;
    expect(report.ok).toBe(true);
    expect(report.problems).toEqual([]);
    // All four rows are checked: a renamed row would silently drop a gate.
    expect(report.checked.map((c) => c.row)).toEqual(EXPECTED_ROWS);
    for (const c of report.checked) {
      expect(c.ok, `${c.row}: doc ${c.documented} vs gate ${c.expected}`).toBe(true);
    }
  });

  it('fails when a documented value drifts from the baseline it describes', () => {
    const { status, output } = runAgainst((md) =>
      md.replace(
        /\| determinism sites \/ files\s*\|\s*[^|]+\|/,
        '| determinism sites / files | 999 / 999 |'
      )
    );

    expect(status).toBe(1);
    const report = JSON.parse(output) as Report;
    expect(report.ok).toBe(false);
    expect(report.problems.join('\n')).toMatch(/determinism sites \/ files/);
    expect(report.problems.join('\n')).toMatch(/999 \/ 999/);
  });

  it('fails when a row is deleted, so the check cannot be switched off', () => {
    const { status, output } = runAgainst((md) =>
      md
        .split('\n')
        .filter((line) => !line.startsWith('| type-safety escapes'))
        .join('\n')
    );

    expect(status).toBe(1);
    const report = JSON.parse(output) as Report;
    expect(report.ok).toBe(false);
    expect(report.problems.join('\n')).toMatch(/row missing from the ratchet table/);
  });
});
