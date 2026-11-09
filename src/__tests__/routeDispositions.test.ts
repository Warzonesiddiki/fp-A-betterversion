/**
 * `scripts/verify-route-dispositions.mjs` — the gate behind PR #87 (DEC-061).
 *
 * WHY THIS EXISTS
 * ---------------
 * The capability matrix classifies a route from its path prefix. Forty-seven
 * routes matched no prefix and were labelled `REVIEW — disposition required`:
 * a question with no owner, repeated in every report. PR #87 answered all 47 in
 * `docs/product/route-dispositions.json`. An answer written once decays the same
 * way every other document claim in this repo decayed — silently — so the table
 * is checked, not trusted:
 *
 *  - a decision for a route that no longer exists is a decision nobody can obey;
 *  - a blank reason is an answer without a reason;
 *  - "legacy alias of X" must name what the router actually redirects to;
 *  - a matrix row still in REVIEW means the matrix was regenerated from a stale
 *    table, and the register (which reads the matrix) would silently inherit it.
 *
 * Fixtures are tmp trees fed through `--root=`, so no test mutates the repo.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'verify-route-dispositions.mjs');

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

function run(args: string[], root?: string): RunResult {
  const full = root ? [...args, `--root=${root}`] : args;
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...full], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? -1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

const APP_TSX = `import { Route, Navigate } from 'react-router-dom';
export function App() {
  return (
    <Routes>
      <Route path="/revenue" element={<Navigate to="/revenue/rev-rec" replace />} />
      <Route path="/revenue/rev-rec" element={<RevRecDashboard />} />
      <Route path="/esg/carbon" element={<CarbonDashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
`;

type Decision = {
  pillar?: string;
  disposition?: string;
  role?: string;
  reason?: string;
  nextEvidence?: string;
};

const GOOD_DECISIONS: Record<string, Decision> = {
  '/revenue': {
    pillar: 'Modeling',
    disposition: 'MIGRATE — legacy alias of /revenue/rev-rec',
    role: 'Controller product owner',
    reason: 'One-line alias; adds no surface of its own.',
    nextEvidence: 'Router test asserts the redirect target.',
  },
  '/esg/carbon': {
    pillar: 'ESG',
    disposition: 'EXPERIMENTAL — no disclosed methodology; certify or retire',
    role: 'ESG reporting owner',
    reason: 'Carbon dashboard with no disclosed methodology.',
    nextEvidence: 'Declare the standard and jurisdiction tier (O5).',
  },
};

function matrixRow(route: string, disposition: string): string {
  return `| \`${route}\` | Modeling | ${disposition} | Controller product owner | Page | \`src/pages/Page.tsx\` | BUILT — TEST EVIDENCE | UNVERIFIED | UNVERIFIED | UNVERIFIED | review |`;
}

function matrix(rows: Array<[string, string]>): string {
  return [
    '| Route | Pillar | Disposition | Accountable role | Route component | Source | Built evidence | Connected | Governed | Enterprise-ready | Required next evidence |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map(([route, disposition]) => matrixRow(route, disposition)),
    '',
  ].join('\n');
}

function writeFixture(decisions: Record<string, Decision>, matrixBody: string): string {
  tmpDir = mkdtempSync(join(tmpdir(), 'route-dispositions-'));
  const write = (rel: string, body: string) => {
    const full = join(tmpDir as string, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };
  write('src/App.tsx', APP_TSX);
  write(
    'docs/product/route-dispositions.json',
    JSON.stringify({ policy: {}, routes: decisions }, null, 2)
  );
  write('docs/CAPABILITY_TRUTH_MATRIX.md', matrixBody);
  return tmpDir as string;
}

const CLEAN_MATRIX = matrix([
  ['/revenue', 'MIGRATE'],
  ['/revenue/rev-rec', 'MIGRATE'],
  ['/esg/carbon', 'EXPERIMENTAL'],
  ['*', 'RETAIN'],
]);

describe('verify-route-dispositions.mjs', () => {
  it('accepts a decided tree and reports the counts', () => {
    const root = writeFixture(GOOD_DECISIONS, CLEAN_MATRIX);
    const result = run(['--check'], root);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/2 decided, 4 route rows, 0 REVIEW/);
  });

  it('the real repository has no undecided route and no REVIEW row', () => {
    const result = run(['--check']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/65 decided, 227 route rows, 0 REVIEW/);

    const matrixText = readFileSync(join(ROOT, 'docs', 'CAPABILITY_TRUTH_MATRIX.md'), 'utf8');
    const reviewRoutes = matrixText
      .split(/\r?\n/)
      .filter((line) => /^\| `(\/[^`]*|\*)` \|/.test(line) && /REVIEW/.test(line));
    expect(reviewRoutes).toEqual([]);
  });

  it('refuses a decision for a route that does not exist', () => {
    const root = writeFixture(
      { ...GOOD_DECISIONS, '/esg/water': GOOD_DECISIONS['/esg/carbon'] as Decision },
      CLEAN_MATRIX
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/\/esg\/water: the route does not exist/);
  });

  it('refuses a decision with a blank field', () => {
    const root = writeFixture(
      { ...GOOD_DECISIONS, '/esg/carbon': { ...GOOD_DECISIONS['/esg/carbon'], reason: '  ' } },
      CLEAN_MATRIX
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/missing or blank reason/);
  });

  it('refuses a disposition outside the vocabulary', () => {
    const root = writeFixture(
      {
        ...GOOD_DECISIONS,
        '/esg/carbon': { ...GOOD_DECISIONS['/esg/carbon'], disposition: 'KEEP — later' },
      },
      CLEAN_MATRIX
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(
      /does not start with one of MIGRATE, RETAIN, EXPERIMENTAL, RETIRED/
    );
  });

  it('refuses an alias decision that names a different target than the router', () => {
    const root = writeFixture(
      {
        ...GOOD_DECISIONS,
        '/revenue': {
          ...GOOD_DECISIONS['/revenue'],
          disposition: 'MIGRATE — legacy alias of /revenue/deferred',
        },
      },
      CLEAN_MATRIX
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(
      /says "legacy alias of \/revenue\/deferred" but the route redirects to \/revenue\/rev-rec/
    );
  });

  it('refuses an alias decision on a route that renders no redirect', () => {
    const root = writeFixture(
      {
        ...GOOD_DECISIONS,
        '/esg/carbon': {
          ...GOOD_DECISIONS['/esg/carbon'],
          disposition: 'MIGRATE — legacy alias of /esg/overview',
        },
      },
      CLEAN_MATRIX
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/renders no <Navigate>/);
  });

  it('refuses a matrix row still in REVIEW', () => {
    const root = writeFixture(
      GOOD_DECISIONS,
      matrix([
        ['/revenue', 'MIGRATE'],
        ['/revenue/rev-rec', 'REVIEW'],
        ['/esg/carbon', 'EXPERIMENTAL'],
        ['*', 'RETAIN'],
      ])
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/matrix row \/revenue\/rev-rec is still REVIEW/);
  });

  it('refuses a matrix row that disagrees with the decision', () => {
    const root = writeFixture(
      GOOD_DECISIONS,
      matrix([
        ['/revenue', 'RETAIN'],
        ['/revenue/rev-rec', 'MIGRATE'],
        ['/esg/carbon', 'EXPERIMENTAL'],
        ['*', 'RETAIN'],
      ])
    );
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/matrix row \/revenue reads RETAIN, the decision says MIGRATE/);
  });

  it('exits 2 when it cannot verify', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'route-dispositions-'));
    mkdirSync(join(tmpDir, 'src'), { recursive: true });
    writeFileSync(join(tmpDir, 'src', 'App.tsx'), APP_TSX);
    const result = run(['--check'], tmpDir);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(
      /cannot verify: docs\/product\/route-dispositions\.json is missing/
    );
  });
});
