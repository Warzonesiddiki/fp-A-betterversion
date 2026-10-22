/**
 * `scripts/skills-index.mjs` must fail closed.
 *
 * WHY THIS EXISTS
 * ---------------
 * The skill library (docs/agent/skills) is the set of methods a session is told
 * to apply. Its index is generated from frontmatter, so the failure modes are
 * the boring ones that actually happen: a skill added without a group, a
 * description that never says when to use it, a stale index nobody regenerated,
 * or an index row pointing at a file that was deleted. Any of those leaves the
 * next session working from a map that does not match the tree — the exact
 * drift `verify-readme-stats.mjs` catches for the README.
 *
 * These tests pin the three exit codes (0 verified, 1 violation, 2 could-not-
 * verify) and prove the checks are load-bearing rather than decorative. Every
 * fixture is a throwaway tree in `tmpdir()`, so no test mutates the repository.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'skills-index.mjs');

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

function run(args: string[]): RunResult {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status?: number; stdout?: string; stderr?: string };
    return { status: e.status ?? -1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

const README = `# Skills\n\n<!-- SKILLS:START -->\n\n<!-- SKILLS:END -->\n`;

const SKILL = (slug: string, opts: { name?: string; group?: string; description?: string } = {}) =>
  `---\nname: ${opts.name ?? slug}\ndescription: >\n  ${opts.description ?? `Use when testing ${slug}.`}\ngroup: ${opts.group ?? 'discipline'}\n---\n\n# ${slug}\n\nbody\n`;

/** Build a fixture tree and return its root. */
function fixture(files: Record<string, string>): string {
  tmpDir = mkdtempSync(join(tmpdir(), 'skills-index-'));
  const dir = join(tmpDir, 'docs', 'agent', 'skills');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'README.md'), README);
  for (const [name, body] of Object.entries(files)) writeFileSync(join(dir, name), body);
  return tmpDir;
}

describe('skills-index.mjs', () => {
  it('passes on the real repository (index built and current)', () => {
    const result = run(['--check']);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/skills: \d+ skills, frontmatter valid, index current/);
  });

  it('rebuilds a stale index, then passes --check', () => {
    const root = fixture({ 'alpha.md': SKILL('alpha') });
    expect(run([`--root=${root}`, '--check']).status).toBe(1);
    expect(run([`--root=${root}`]).status).toBe(0);
    expect(run([`--root=${root}`, '--check']).status).toBe(0);
  });

  it('rejects a name that does not match the file name', () => {
    const root = fixture({ 'alpha.md': SKILL('alpha', { name: 'beta' }) });
    const result = run([`--root=${root}`]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/name "beta" != file name "alpha"/);
  });

  it('rejects a missing group, an unknown group and a missing description', () => {
    const noGroup = fixture({
      'alpha.md': `---\nname: alpha\ndescription: Use when x.\n---\n\nbody\n`,
    });
    expect(run([`--root=${noGroup}`]).status).toBe(1);

    const unknown = fixture({ 'alpha.md': SKILL('alpha', { group: 'nonsense' }) });
    const unknownResult = run([`--root=${unknown}`]);
    expect(unknownResult.status).toBe(1);
    expect(unknownResult.stderr).toMatch(/unknown group "nonsense"/);

    const noDescription = fixture({
      'alpha.md': `---\nname: alpha\ngroup: discipline\n---\n\nbody\n`,
    });
    expect(run([`--root=${noDescription}`]).status).toBe(1);
  });

  it('rejects a description that never says when to use the skill', () => {
    const root = fixture({ 'alpha.md': SKILL('alpha', { description: 'A list of tips.' }) });
    const result = run([`--root=${root}`]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/must say when to use it/);
  });

  it('rejects an index row whose file no longer exists', () => {
    const root = fixture({ 'alpha.md': SKILL('alpha') });
    // Index it, then delete the file the row points at.
    expect(run([`--root=${root}`]).status).toBe(0);
    rmSync(join(root, 'docs', 'agent', 'skills', 'alpha.md'));
    writeFileSync(join(root, 'docs', 'agent', 'skills', 'beta.md'), SKILL('beta'));
    const result = run([`--root=${root}`, '--check']);
    expect(result.status).toBe(1);
  });

  it('cannot verify without a skills directory or without index markers', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'skills-index-empty-'));
    expect(run([`--root=${tmpDir}`]).status).toBe(2);

    const noMarkers = fixture({ 'alpha.md': SKILL('alpha') });
    writeFileSync(join(noMarkers, 'docs', 'agent', 'skills', 'README.md'), '# Skills\n');
    expect(run([`--root=${noMarkers}`]).status).toBe(1);
  });
});
