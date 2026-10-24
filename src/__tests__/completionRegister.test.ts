/**
 * `scripts/completion-register.mjs` — the gate that makes the last ten PRs
 * verifiable instead of rhetorical (PR #86, completion plan §3).
 *
 * WHY THIS EXISTS
 * ---------------
 * The register is only worth what it refuses. A register that accepts a blank
 * status, an invented `O`-id, a `SUPPORTED` row with no test behind it, or a
 * hand-edited rendered table is a document that will read as complete while the
 * product is not. Every one of those is a real way a completion claim decays,
 * so each gets a failing test here before the script exists.
 *
 * The fixtures are throwaway trees in `tmpdir()` fed via `--root=`, so no test
 * mutates the repository and none depends on the real census.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'completion-register.mjs');

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

const APP_TSX = `import { lazy } from 'react';
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
export const routes = [
  <Route path="/login" element={<LoginPage />} />,
  <Route path="/dashboard" element={<DashboardPage />} />,
];
`;

const REQUIREMENTS = `| ID      | Priority | Requirement | Acceptance criteria | Status   | Target evidence |
| ------- | -------- | ----------- | ------------------- | -------- | --------------- |
| FR-001  | P0       | Close works | Periods lock        | Partial  | test            |
| FR-002  | P0       | Import works | Rows reconcile     | Proposed | test            |
`;

const ANNEX = `# Master Checklist Coverage — owner checklist (2 sections)

| # | Area | Status | Evidence | Owner |
| - | ---- | ------ | -------- | ----- |
| 1 | Import | WORKS | something | owner |
| 2 | Export | UNWIRED | nothing | owner |
`;

const SCOPE = `# Scope
<!-- coverage-scope: {"expectedSections":4,"sourceOwed":[3,4],"decision":"DEC-001"} -->

Source owed: 3, 4.
`;

const TASKBOARD = `# Taskboard

## OWNER (blocked — do not work around, do not silently drop)

| #   | Needed from owner     | Blocks           | Since      |
| --- | --------------------- | ---------------- | ---------- |
| O1  | A real export sample  | Verified labels  | 2026-10-18 |
| O2  | Roll semantics        | Rolling forecast | 2026-10-19 |
| O3  | Key escrow decision   | Data-safety claim| 2026-10-19 |
| O4  | SOX authority         | SOX claims       | 2026-10-19 |
| O9  | Entity grant set      | Entity scope     | 2026-10-19 |

## Other tables are not the owner table

| O99 | decoy row that must not count |
`;

const DECISION_LOG = `# Decisions

| ID | Date | Decision | Status | Evidence | Alternatives | Actor | Refs | Revisit |
| -- | ---- | -------- | ------ | -------- | ------------ | ----- | ---- | ------- |
| DEC-001 | 2026-10-01 | Something was decided | Accepted | evidence | none | agent | docs | never |
`;

const PACKAGE_JSON = JSON.stringify(
  { name: 'fixture', scripts: { tsc: 'tsc --noEmit', 'docs:verify': 'node x.mjs' } },
  null,
  2
);

/** Build a small but structurally real tree for the register to census. */
function fixture(): string {
  tmpDir = mkdtempSync(join(tmpdir(), 'completion-register-'));
  const write = (rel: string, body: string) => {
    const full = join(tmpDir as string, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };
  write('src/App.tsx', APP_TSX);
  write('src/pages/auth/LoginPage.tsx', 'export default function LoginPage() { return null; }\n');
  write(
    'src/pages/DashboardPage.tsx',
    'export default function DashboardPage() { return null; }\n'
  );
  write('src/engines/FXEngine.ts', 'export const fx = 1;\n');
  write('src/engines/FXEngine.test.ts', 'export const t = 1;\n');
  write('src/engines/CashEngine.ts', 'export const cash = 1;\n');
  write('src/engines/index.ts', 'export * from "./FXEngine";\n');
  write(
    'docs/CAPABILITY_TRUTH_MATRIX.md',
    `| Route | Pillar | Disposition | Role | Component | Source | Built | Connected | Governed | Ready | Next |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| \`/login\` | Identity | MIGRATE — auth pattern | Platform product owner | LoginPage | \`src/pages/auth/LoginPage.tsx\` | BUILT | UNVERIFIED | UNVERIFIED | UNVERIFIED | review |
| \`/dashboard\` | PLAN | RETAIN — keep the screen | Owner | DashboardPage | \`src/pages/DashboardPage.tsx\` | BUILT | UNVERIFIED | UNVERIFIED | UNVERIFIED | review |
`
  );
  write('docs/discovery/requirements-register.md', REQUIREMENTS);
  write('docs/MASTER_CHECKLIST_COVERAGE.md', ANNEX);
  write('docs/discovery/OWNER_SCOPE_REGISTER_111_200.md', SCOPE);
  write('docs/discovery/decision-log.md', DECISION_LOG);
  write('docs/TASKBOARD.md', TASKBOARD);
  write('docs/plan/COMPLETION_PLAN_86_100.md', '# Plan\n\n§3 defines the register.\n');
  write('package.json', PACKAGE_JSON);
  return tmpDir as string;
}

const readJson = (root: string) =>
  JSON.parse(readFileSync(join(root, 'docs', 'plan', 'completion-register.json'), 'utf8'));
const writeJson = (root: string, data: unknown) =>
  writeFileSync(
    join(root, 'docs', 'plan', 'completion-register.json'),
    `${JSON.stringify(data, null, 2)}\n`
  );
const row = (data: { rows: Array<Record<string, unknown>> }, id: string) =>
  data.rows.find((r) => r.id === id) as Record<string, unknown> | undefined;

/** Write rows and re-render the view, so assertions test the rule under test. */
function saveRows(root: string, data: unknown) {
  writeJson(root, data);
  run([], root);
}

describe('completion-register.mjs', () => {
  it('seeds one row per censused item and then passes --check', () => {
    const root = fixture();
    const seed = run(['--seed'], root);
    expect(seed.status).toBe(0);

    const data = readJson(root);
    const ids = data.rows.map((r: { id: string }) => r.id);
    expect(new Set(ids).size).toBe(ids.length); // no duplicate identities
    // 2 routes + 2 engines + 2 requirements + 4 annex sections + capability rows
    expect(ids).toContain('route:/login');
    expect(ids).toContain('route:/dashboard');
    expect(ids).toContain('engine:FXEngine');
    expect(ids).toContain('engine:CashEngine');
    expect(ids).toContain('req:FR-001');
    expect(ids).toContain('annex:1');
    expect(ids).toContain('annex:4');
    expect(ids).toContain('cap:close.trial-balance');

    const check = run(['--check'], root);
    expect(check.status).toBe(0);
    expect(check.stdout).toMatch(/SUPPORTED 0/);
  });

  it('fails when a discovered route has no register row', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);
    const data = readJson(root);
    data.rows = data.rows.filter((r: { id: string }) => r.id !== 'route:/dashboard');
    writeJson(root, data);
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/no register row for route:\/dashboard/);
  });

  it('fails on a row whose item no longer exists, and on a blank or unknown status', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);

    const orphan = readJson(root);
    orphan.rows.push({
      kind: 'route',
      id: 'route:/deleted',
      status: 'EXPERIMENTAL',
      evidence: { gatedBy: 'route:/deleted' },
      note: 'ghost',
    });
    writeJson(root, orphan);
    expect(run(['--check'], root).stderr).toMatch(/route:\/deleted is not in the census/);

    const unknown = readJson(root);
    unknown.rows = unknown.rows.filter((r: { id: string }) => r.id !== 'route:/deleted');
    (row(unknown, 'route:/login') as Record<string, unknown>).status = 'PROBABLY-FINE';
    writeJson(root, unknown);
    const unknownResult = run(['--check'], root);
    expect(unknownResult.status).toBe(1);
    expect(unknownResult.stderr).toMatch(/unknown status "PROBABLY-FINE"/);

    const blank = readJson(root);
    (row(blank, 'route:/login') as Record<string, unknown>).status = '';
    writeJson(root, blank);
    expect(run(['--check'], root).stderr).toMatch(/blank status/);
  });

  it('refuses SUPPORTED without resolving test ids, a real gate script and a doc link', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);

    const noTests = readJson(root);
    Object.assign(row(noTests, 'req:FR-001') as object, {
      status: 'SUPPORTED',
      evidence: { gate: 'tsc', doc: 'docs/TASKBOARD.md' },
    });
    writeJson(root, noTests);
    expect(run(['--check'], root).stderr).toMatch(/SUPPORTED requires at least one test id/);

    const missingTestFile = readJson(root);
    Object.assign(row(missingTestFile, 'req:FR-001') as object, {
      status: 'SUPPORTED',
      evidence: {
        tests: ['src/engines/Ghost.test.ts'],
        gate: 'tsc',
        doc: 'docs/TASKBOARD.md',
      },
    });
    writeJson(root, missingTestFile);
    expect(run(['--check'], root).stderr).toMatch(/test id .* does not exist/);

    const missingGate = readJson(root);
    Object.assign(row(missingGate, 'req:FR-001') as object, {
      status: 'SUPPORTED',
      evidence: {
        tests: ['src/engines/FXEngine.test.ts'],
        gate: 'completion:register',
        doc: 'docs/TASKBOARD.md',
      },
    });
    writeJson(root, missingGate);
    expect(run(['--check'], root).stderr).toMatch(
      /gate "completion:register" is not an npm script/
    );

    const good = readJson(root);
    Object.assign(row(good, 'req:FR-001') as object, {
      status: 'SUPPORTED',
      evidence: { tests: ['src/engines/FXEngine.test.ts'], gate: 'tsc', doc: 'docs/TASKBOARD.md' },
    });
    saveRows(root, good);
    const result = run(['--check'], root);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/SUPPORTED 1/);
  });

  it('refuses a BLOCKED-ON-OWNER row whose O-id is not in the owner table', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);
    const data = readJson(root);
    Object.assign(row(data, 'cap:model.fx-translation') as object, {
      status: 'BLOCKED-ON-OWNER',
      evidence: { owner: 'O42', question: 'Which rate source?' },
    });
    writeJson(root, data);
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/O42 is not in the owner table/);

    const fixed = readJson(root);
    Object.assign(row(fixed, 'cap:model.fx-translation') as object, {
      status: 'BLOCKED-ON-OWNER',
      evidence: { owner: 'O2', question: 'Which rate source?' },
    });
    saveRows(root, fixed);
    expect(run(['--check'], root).status).toBe(0);
  });

  it('carries the matrix disposition and refuses any row left in REVIEW', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);

    const seeded = readJson(root);
    expect(
      (row(seeded, 'route:/login') as { evidence: Record<string, string> }).evidence.disposition
    ).toBe('MIGRATE');
    expect(
      (row(seeded, 'route:/dashboard') as { evidence: Record<string, string> }).evidence.disposition
    ).toBe('RETAIN');

    const promoted = readJson(root);
    Object.assign(row(promoted, 'route:/login') as object, {
      status: 'SUPPORTED',
      evidence: {
        gatedBy: '/login',
        disposition: 'REVIEW',
        tests: ['src/engines/FXEngine.test.ts'],
        gate: 'tsc',
        doc: 'docs/TASKBOARD.md',
      },
    });
    saveRows(root, promoted);
    const reviewResult = run(['--check'], root);
    expect(reviewResult.status).toBe(1);
    // PR #87 decided every route, so REVIEW is no longer a state a row may rest
    // in — not even an EXPERIMENTAL one. It means "nobody has decided this".
    expect(reviewResult.stderr).toMatch(/disposition REVIEW — no recorded decision/);

    const misspelled = readJson(root);
    Object.assign(row(misspelled, 'route:/dashboard') as object, {
      status: 'EXPERIMENTAL',
      evidence: { gatedBy: '/dashboard', disposition: 'KEEP' },
    });
    saveRows(root, misspelled);
    expect(run(['--check'], root).stderr).toMatch(/unknown disposition "KEEP"/);
  });

  it('refuses RETIRED with an unknown decision, and NOT_BUILT with nothing naming it', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);

    const retired = readJson(root);
    Object.assign(row(retired, 'engine:CashEngine') as object, {
      status: 'RETIRED',
      evidence: { decision: 'DEC-999', commit: 'deadbee' },
    });
    writeJson(root, retired);
    expect(run(['--check'], root).stderr).toMatch(/DEC-999 is not in the decision log/);

    const notBuilt = readJson(root);
    Object.assign(row(notBuilt, 'engine:CashEngine') as object, {
      status: 'NOT_BUILT',
      evidence: {},
    });
    writeJson(root, notBuilt);
    expect(run(['--check'], root).stderr).toMatch(/NOT_BUILT requires a namedBy/);
  });

  it('rejects a hand-edited rendered view, and rewrites it when not checking', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);
    const view = join(root, 'docs', 'plan', 'COMPLETION_REGISTER.md');
    writeFileSync(view, '# edited by hand\n');

    const check = run(['--check'], root);
    expect(check.status).toBe(1);
    expect(check.stderr).toMatch(/rendered view is stale/);

    expect(run([], root).status).toBe(0);
    expect(readFileSync(view, 'utf8')).toMatch(/\| Status \|/);
    expect(run(['--check'], root).status).toBe(0);
  });

  it('cannot verify a tree with no census sources', () => {
    const empty = mkdtempSync(join(tmpdir(), 'completion-register-empty-'));
    tmpDir = empty;
    const result = run(['--check'], root(empty));
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/cannot verify/);
  });

  it('--release fails while any row is not SUPPORTED or RETIRED', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);
    const result = run(['--release'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/release contract C1/);
  });

  it('the real repository register is present, current and covers the measured census', () => {
    const result = run(['--check']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/completion register: \d+ rows/);

    // The census block is the register's own record of what it covers. If a
    // route, engine, requirement or annex section is added without the register
    // growing, --check fails first; these numbers make the shape visible so a
    // silent re-definition of the census is a test failure, not a review catch.
    const data = readJson(ROOT);
    expect(data.census).toMatchObject({
      routes: 227,
      engines: 180,
      requirements: 19,
      annex: 200,
      capabilities: 74,
    });
    expect(data.rows).toHaveLength(708);
    for (const row of data.rows) expect(data.vocabulary).toContain(row.status);
  });

  it('refuses a CONNECTED claim whose test file or title does not resolve', () => {
    const root = fixture();
    expect(run(['--seed'], root).status).toBe(0);

    const missingFile = readJson(root);
    Object.assign(row(missingFile, 'cap:close.trial-balance') as object, {
      evidence: { connected: [{ file: 'src/pages/data/Gone.test.tsx', title: 'gone' }] },
    });
    saveRows(root, missingFile);
    expect(run(['--check'], root).stderr).toMatch(
      /connected test src\/pages\/data\/Gone\.test\.tsx does not exist/
    );

    const missingTitle = readJson(root);
    Object.assign(row(missingTitle, 'cap:close.trial-balance') as object, {
      evidence: {
        connected: [
          { file: 'src/engines/FXEngine.test.ts', title: 'a test that no longer exists' },
        ],
      },
    });
    saveRows(root, missingTitle);
    expect(run(['--check'], root).stderr).toMatch(
      /has no test titled "a test that no longer exists"/
    );
  });
});

function root(dir: string): string {
  return dir;
}
