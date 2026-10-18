/**
 * The palette-migration ratchet must hold at the number it recorded, must fail
 * on any file that gains a raw palette utility, and must refuse to re-record a
 * worse baseline.
 *
 * WHY THIS EXISTS
 * ---------------
 * The UI restyle starts from a half-migrated surface: measured on 2026-10-18 at
 * commit 6d25994, `scripts/palette-ratchet.mjs` counts 5,548 numbered Tailwind
 * palette utilities across 373 non-test modules under `src/` (src/components
 * 3,147, src/pages 2,398, src/engines 3) against 4,648 semantic `var(--…)`
 * usages in those same two trees. A numbered stop such as `text-slate-500` or
 * `dark:bg-gray-900` hardcodes one colour: it does not flip with the theme, it
 * cannot be re-valued centrally, and the theme contract suites in `src/theme/`
 * cannot see it. That is the defect class `lightContrast.contract.test.ts`
 * caught in commit 76ed099.
 *
 * A migration of 373 files only finishes if it cannot quietly grow while it is
 * in progress, so `scripts/palette-ratchet.mjs` runs inside `npm run check` and
 * this suite pins the script itself: the real tree must equal the recorded
 * baseline (a pattern that matched nothing would also "hold", so the scan is
 * asserted to be live), variants and opacity suffixes must count, comments must
 * not, and `--update` must only ever move the baseline down.
 *
 * Every fixture is a throwaway tree in `tmpdir()`, reached with `--root=`. A
 * probe file is NEVER written inside `src/`: the contrast contracts scan
 * `src/components` and `src/pages` and vitest runs files in parallel, so an
 * in-repo probe would make them flaky.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'palette-ratchet.mjs');
const BASELINE = join(ROOT, 'scripts', 'palette-baseline.json');

interface Report {
  ok: boolean;
  modulesScanned: number;
  filesWithSites: number;
  total: number;
  baselineTotal: number | null;
  perFile: Record<string, number>;
  failures: string[];
}

interface Baseline {
  modulesScanned: number;
  filesWithSites: number;
  total: number;
  perFile: Record<string, number>;
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

const created: string[] = [];

afterEach(() => {
  while (created.length > 0) {
    rmSync(created.pop() as string, { recursive: true, force: true });
  }
});

/** Build a throwaway tree: `files` are relative paths, `baseline` is optional. */
function fixture(files: Record<string, string>, baseline?: Baseline): Baseline & { root: string } {
  const root = mkdtempSync(join(tmpdir(), 'palette-ratchet-'));
  created.push(root);
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, body, 'utf8');
  }
  const baselinePath = join(root, 'scripts', 'palette-baseline.json');
  if (baseline) {
    mkdirSync(dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, JSON.stringify(baseline, null, 2), 'utf8');
  }
  return { ...(baseline ?? { modulesScanned: 0, filesWithSites: 0, total: 0, perFile: {} }), root };
}

function readBaselineOf(fx: { root: string }): Baseline {
  return JSON.parse(readFileSync(join(fx.root, 'scripts', 'palette-baseline.json'), 'utf8'));
}

describe('palette-ratchet', () => {
  it('holds on the real tree and reports exactly the recorded baseline', () => {
    const { status, output } = run(['--json']);

    expect(status).toBe(0);
    const report = JSON.parse(output) as Report;
    const baseline = JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline;

    expect(report.ok).toBe(true);
    expect(report.failures).toEqual([]);
    expect(report.total).toBe(baseline.total);
    expect(report.filesWithSites).toBe(baseline.filesWithSites);
    // A pattern that matched nothing would hold too, so prove the scan is live.
    expect(report.modulesScanned).toBeGreaterThan(500);
    expect(report.total).toBeGreaterThan(0);

    // --list names every file, worst first, and the counts must add up.
    const listed = run(['--list']);
    expect(listed.status).toBe(0);
    const counts = listed.output
      .split('\n')
      .map((line) => /^\s+(\d+)\s+src\//.exec(line)?.[1])
      .filter((n): n is string => n !== undefined)
      .map(Number);
    expect(counts).toHaveLength(report.filesWithSites);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(report.total);
  });

  it('fails when a new file appears with any utility, and names it (new file)', () => {
    const fx = fixture(
      { 'src/components/Fresh.tsx': 'export const cls = "bg-slate-800 text-slate-100";\n' },
      {
        modulesScanned: 1,
        filesWithSites: 1,
        total: 2,
        perFile: { 'src/components/AlreadyMigratedAway.tsx': 2 },
      }
    );

    const { status, output } = run([`--root=${fx.root}`]);

    expect(status).toBe(1);
    expect(output).toMatch(/PALETTE RATCHET FAILED/);
    expect(output).toMatch(/src\/components\/Fresh\.tsx/);
    expect(output).toMatch(/0 -> 2 \(new file\)/);
  });

  it('fails when a known file rises, and shows the delta', () => {
    const fx = fixture(
      {
        'src/components/A.tsx':
          'export const one = "text-slate-500";\nexport const two = "bg-gray-900";\n',
      },
      { modulesScanned: 1, filesWithSites: 1, total: 1, perFile: { 'src/components/A.tsx': 1 } }
    );

    const { status, output } = run([`--root=${fx.root}`]);

    expect(status).toBe(1);
    expect(output).toMatch(/src\/components\/A\.tsx: raw palette utilities 1 -> 2 \(\+1\)/);
  });

  it('counts dark: variants and opacity suffixes, which still hardcode a stop', () => {
    const fx = fixture({
      'src/components/Variants.tsx':
        'export const a = "dark:bg-gray-900";\n' +
        'export const b = "bg-slate-800/50";\n' +
        'export const c = "hover:text-red-500 md:border-blue-200";\n',
    });

    expect(run([`--root=${fx.root}`, '--update']).status).toBe(0);

    const recorded = readBaselineOf(fx);
    expect(recorded.perFile['src/components/Variants.tsx']).toBe(4);
    expect(recorded.total).toBe(4);
  });

  it('does not count a utility that appears only in a comment', () => {
    const fx = fixture({
      'src/components/Documented.tsx':
        '// was text-slate-500 before the migration\n' +
        '/* bg-gray-900 and border-red-500 are documented here, not used */\n' +
        'export const real = "text-slate-500";\n',
    });

    expect(run([`--root=${fx.root}`, '--update']).status).toBe(0);

    const recorded = readBaselineOf(fx);
    expect(recorded.perFile['src/components/Documented.tsx']).toBe(1);
    expect(recorded.total).toBe(1);
  });

  it('--update refuses to record a worse baseline and leaves the file untouched', () => {
    const fx = fixture(
      {
        'src/components/A.tsx':
          'export const a = "text-slate-500";\nexport const b = "bg-gray-900";\n',
      },
      { modulesScanned: 1, filesWithSites: 1, total: 1, perFile: { 'src/components/A.tsx': 1 } }
    );

    const { status, output } = run([`--root=${fx.root}`, '--update']);

    expect(status).toBe(1);
    expect(output).toMatch(/Refusing to record a baseline that is WORSE/);
    expect(output).toMatch(/src\/components\/A\.tsx: 1 -> 2/);
    const after = readBaselineOf(fx);
    expect(after.total).toBe(1);
    expect(after.perFile['src/components/A.tsx']).toBe(1);
  });

  it('--update records an improvement and the next run holds at the lower number', () => {
    const fx = fixture(
      { 'src/components/A.tsx': 'export const a = "text-slate-500";\n' },
      { modulesScanned: 1, filesWithSites: 1, total: 3, perFile: { 'src/components/A.tsx': 3 } }
    );

    expect(run([`--root=${fx.root}`, '--update']).status).toBe(0);
    const after = readBaselineOf(fx);
    expect(after.total).toBe(1);
    expect(after.perFile['src/components/A.tsx']).toBe(1);

    const held = run([`--root=${fx.root}`, '--json']);
    expect(held.status).toBe(0);
    const report = JSON.parse(held.output) as Report;
    expect(report.ok).toBe(true);
    expect(report.total).toBe(1);
    expect(report.baselineTotal).toBe(1);
  });
});
