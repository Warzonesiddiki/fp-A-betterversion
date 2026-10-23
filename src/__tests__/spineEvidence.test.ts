/**
 * `scripts/verify-spine-evidence.mjs` — the gate behind PR #88 (DEC-062).
 *
 * WHY THIS EXISTS
 * ---------------
 * "CONNECTED" is the first grade in the matrix's maturity ladder, so it is the
 * first place a claim can be dressed up as evidence. The rule this gate enforces
 * is narrow: a claim must name a test file and the exact title inside it. Rename
 * the test, delete it, or point the claim at the page it is grading, and the
 * claim fails instead of aging into folklore.
 *
 * The fixtures are tmp trees fed through `--root=`; no test mutates the repo.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'verify-spine-evidence.mjs');

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

const APP_TSX = `export function App() {
  return (
    <Routes>
      <Route path="/data" element={<DataImportPage />} />
      <Route path="/board-pack" element={<BoardPackPage />} />
    </Routes>
  );
}
`;

const REGISTER_STUB = `const CAPABILITIES = [
  'data.mapping',
  'close.trial-balance',
];
`;

function claim(file: string, title: string) {
  return { file, title };
}

function buildEvidence(overrides: Record<string, unknown> = {}) {
  return {
    shell: {
      stale: {
        ...claim('src/components/ui/FinancialStatusBadge.test.tsx', 'reads stale as stale'),
        proves: 'The shell distinguishes stale data from current data in text.',
      },
    },
    routes: {
      '/data': {
        page: 'src/pages/data/DataImportPage.tsx',
        claims: {
          journey: claim('src/pages/data/DataImportPage.test.tsx', 'advances the wizard'),
          empty: claim('src/pages/data/DataImportPage.test.tsx', 'shows the empty state'),
          error: claim('src/pages/data/DataImportPage.test.tsx', 'shows an error alert'),
          loading: {
            na: 'The page reads the local store synchronously; a page-level skeleton would be a fake indicator here.',
          },
        },
      },
    },
    capabilities: {
      'data.mapping': [
        {
          ...claim(
            'src/services/import/spineAcceptance.test.ts',
            'accepts the documented column set'
          ),
          proves: 'The documented header set maps into the staging pipeline end-to-end.',
        },
      ],
    },
    ...overrides,
  };
}

function writeFixture(evidence: unknown, options: { pageSource?: string } = {}): string {
  tmpDir = mkdtempSync(join(tmpdir(), 'spine-evidence-'));
  const write = (rel: string, body: string) => {
    const full = join(tmpDir as string, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
  };
  write('src/App.tsx', APP_TSX);
  write('scripts/completion-register.mjs', REGISTER_STUB);
  write('docs/plan/spine-evidence.json', JSON.stringify(evidence, null, 2));
  write(
    'src/pages/data/DataImportPage.tsx',
    options.pageSource ?? 'export default function DataImportPage() { return null; }\n'
  );
  write(
    'src/pages/data/DataImportPage.test.tsx',
    `it('advances the wizard', () => {});\nit('shows the empty state', () => {});\nit('shows an error alert', () => {});\n`
  );
  write(
    'src/services/import/spineAcceptance.test.ts',
    `it('accepts the documented column set', () => {});\n`
  );
  write(
    'src/components/ui/FinancialStatusBadge.test.tsx',
    `it('reads stale as stale', () => {});\n`
  );
  return tmpDir as string;
}

describe('verify-spine-evidence.mjs', () => {
  it('accepts a claim whose file and title both resolve', () => {
    const root = writeFixture(buildEvidence());
    const result = run(['--check'], root);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/1 routes \(3 state claims\)/);
    expect(result.stdout).toMatch(/1 capabilities \(1 claims\)/);
  });

  it('the real repository evidence resolves', () => {
    const result = run(['--check']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/13 routes \(48 state claims\)/);
    expect(result.stdout).toMatch(/17 capabilities \(17 claims\)/);

    // The manifest and the pages it grades must still agree about loading.
    const manifest = JSON.parse(
      readFileSync(join(ROOT, 'docs', 'plan', 'spine-evidence.json'), 'utf8')
    ) as { routes: Record<string, { page: string; claims: Record<string, { na?: string }> }> };
    for (const entry of Object.values(manifest.routes)) {
      const source = readFileSync(join(ROOT, entry.page), 'utf8');
      if (entry.claims.loading?.na) {
        expect(source).not.toMatch(/\bisLoading\b|<Skeleton/);
      }
    }
  });

  it('refuses a claim whose test file does not exist', () => {
    const evidence = buildEvidence();
    evidence.routes['/data'].claims.journey = claim('src/pages/data/Gone.test.tsx', 'advances');
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/claim file src\/pages\/data\/Gone\.test\.tsx does not exist/);
  });

  it('refuses a claim whose test title is not in the file', () => {
    const evidence = buildEvidence();
    evidence.routes['/data'].claims.journey = claim(
      'src/pages/data/DataImportPage.test.tsx',
      'a test that was renamed away'
    );
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/has no test titled "a test that was renamed away"/);
  });

  it('refuses a claim that points at the page it grades instead of a test', () => {
    const evidence = buildEvidence();
    evidence.routes['/data'].claims.empty = claim(
      'src/pages/data/DataImportPage.tsx',
      'shows the empty state'
    );
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/claim must name a test file/);
  });

  it('refuses "na" for loading on a page that has a loading branch', () => {
    const root = writeFixture(buildEvidence(), {
      pageSource:
        "import { Skeleton } from '@/components/ui/Skeleton';\nexport default function P() { return <Skeleton />; }\n",
    });
    const result = run(['--check'], root);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(
      /has a loading branch \(isLoading\/<Skeleton\), so "na" is not honest/
    );
  });

  it('refuses a route that is not in src/App.tsx', () => {
    const evidence = buildEvidence();
    evidence.routes['/esg/water'] = evidence.routes['/data'];
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/route \/esg\/water: not a route in src\/App\.tsx/);
  });

  it('refuses a capability id the register does not define', () => {
    const evidence = buildEvidence();
    evidence.capabilities['data.telepathy'] = evidence.capabilities['data.mapping'];
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/capability data\.telepathy: not in the completion register/);
  });

  it('refuses a route with no loading claim and no reason', () => {
    const evidence = buildEvidence();
    delete evidence.routes['/data'].claims.loading;
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/loading is neither claimed nor documented as not applicable/);
  });

  it('refuses a claim with no "proves" sentence', () => {
    const evidence = buildEvidence();
    evidence.capabilities['data.mapping'][0].proves = '';
    const result = run(['--check'], writeFixture(evidence));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/needs a "proves" sentence/);
  });

  it('exits 2 when it cannot verify', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'spine-evidence-'));
    const result = run(['--check'], tmpDir);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/cannot verify: docs\/plan\/spine-evidence\.json is missing/);
  });
});
