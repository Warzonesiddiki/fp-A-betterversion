#!/usr/bin/env node
/**
 * skills-index.mjs — the agent-skill library gate.
 *
 * WHY THIS EXISTS
 * ---------------
 * `docs/agent/skills/` is the set of methods a session is expected to apply on
 * this project. A library nobody indexes is a folder nobody reads: a skill gets
 * added, the index does not, and the next session works from a stale map. That
 * is the same drift `verify-readme-stats.mjs` exists to stop, applied to the
 * instructions rather than the README.
 *
 * RULES (all checked against the filesystem, never against a copy)
 *   1. every `*.md` in the skills directory has YAML frontmatter
 *   2. `name:` equals the file name without `.md`
 *   3. `description:` is present and says when to use it ("Use …")
 *   4. `group:` is one of GROUPS
 *   5. the generated index in `docs/agent/skills/README.md` lists every skill
 *      exactly once, and no row without a file
 *
 * USAGE
 *   node scripts/skills-index.mjs            # rewrite the index block
 *   node scripts/skills-index.mjs --check    # exit 1 if the index is stale
 *   node scripts/skills-index.mjs --root=DIR # verify another tree (tests)
 *
 * EXIT CODES
 *   0 verified ok · 1 violation or stale index · 2 could not verify at all
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = process.cwd();
const argRoot = process.argv.find((a) => a.startsWith('--root='));
const ROOT_DIR = argRoot ? argRoot.slice('--root='.length) : ROOT;
const CHECK = process.argv.includes('--check');

export const SKILLS_DIR = join('docs', 'agent', 'skills');
export const START = '<!-- SKILLS:START -->';
export const END = '<!-- SKILLS:END -->';

export const GROUPS = [
  ['discipline', 'How work is done'],
  ['finance', 'Money, accounting and the finance domain'],
  ['engineering', 'Code, data, security and release mechanics'],
  ['product-ui', 'What the user sees and exports'],
  ['meta', 'Documentation, traceability, authoring'],
  ['owner', "The owner's Ponytail set (verbatim, standing)"],
];
const GROUP_IDS = new Set(GROUPS.map(([id]) => id));

function die(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function parseFrontmatter(text, file) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') return { error: `${file}: no frontmatter (first line must be ---)` };
  const close = lines.indexOf('---', 1);
  if (close === -1) return { error: `${file}: frontmatter is not closed` };
  const fm = { _body: lines.slice(close + 1), _raw: lines.slice(1, close) };
  let current = null;
  for (const line of fm._raw) {
    const kv = /^([a-zA-Z_]+):\s*(.*)$/.exec(line);
    if (kv) {
      current = kv[1];
      // `key: >` / `key: |` open a folded block; the marker is not content.
      fm[current] = /^[>|][+-]?$/.test(kv[2].trim()) ? '' : kv[2].trim();
      continue;
    }
    if (/^\s+/.test(line) && current) {
      fm[current] = `${fm[current] ? `${fm[current]} ` : ''}${line.trim()}`.trim();
    }
  }
  return fm;
}

function loadSkills(dir) {
  if (!existsSync(dir)) return { error: `cannot verify: ${dir} does not exist`, files: [] };
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();
  if (files.length === 0) return { error: `cannot verify: no skill files in ${dir}`, files: [] };
  const skills = [];
  const problems = [];
  for (const file of files) {
    const text = readFileSync(join(dir, file), 'utf8');
    const fm = parseFrontmatter(text, file);
    if (fm.error) {
      problems.push(fm.error);
      continue;
    }
    const slug = basename(file, '.md');
    if (!fm.name) problems.push(`${file}: missing \`name:\``);
    else if (fm.name !== slug) problems.push(`${file}: name "${fm.name}" != file name "${slug}"`);
    if (!fm.description) problems.push(`${file}: missing \`description:\``);
    else if (!/^use\b/i.test(fm.description) && !/·?\s*\buse\b/i.test(fm.description))
      problems.push(`${file}: description must say when to use it ("Use when/for/before …")`);
    if (!fm.group) problems.push(`${file}: missing \`group:\``);
    else if (!GROUP_IDS.has(fm.group))
      problems.push(`${file}: unknown group "${fm.group}" (allowed: ${[...GROUP_IDS].join(', ')})`);
    skills.push({ slug, file, description: fm.description || '', group: fm.group || '' });
  }
  return { skills, problems, files };
}

function renderIndex(skills) {
  const out = [START, ''];
  out.push('| Skill | Use it when | Group |');
  out.push('| --- | --- | --- |');
  for (const [id, label] of GROUPS) {
    const rows = skills.filter((s) => s.group === id);
    if (rows.length === 0) continue;
    out.push(`| **${label}** | | |`);
    for (const s of rows) {
      const when = s.description.replace(/\s+/g, ' ').trim();
      out.push(`| [\`${s.slug}\`](${s.slug}.md) | ${when} | ${id} |`);
    }
  }
  out.push('', END);
  return out.join('\n');
}

function replaceBlock(readme, block) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end === -1 || end < start) return null;
  return `${readme.slice(0, start)}${block}${readme.slice(end + END.length)}`;
}

const dir = join(ROOT_DIR, SKILLS_DIR);
const loaded = loadSkills(dir);
if (loaded.error) die(2, `✗ skills: ${loaded.error}`);

const problems = [...(loaded.problems || [])];

const readmePath = join(dir, 'README.md');
if (!existsSync(readmePath)) {
  die(2, `✗ skills: ${join(SKILLS_DIR, 'README.md')} is missing (it is the index)`);
}
const readme = readFileSync(readmePath, 'utf8');
const block = renderIndex(loaded.skills);
const next = replaceBlock(readme, block);
if (next === null) {
  die(1, `✗ skills: README.md is missing the ${START} … ${END} markers`);
}

// Rows in the COMMITTED index: a row with no file, or a duplicate, is a
// violation in its own right — not merely a stale block.
const fileSlugs = new Set(loaded.skills.map((s) => s.slug));
const committedBlock = readme.slice(readme.indexOf(START), readme.indexOf(END));
const listedRows = [...committedBlock.matchAll(/^\| \[`([a-z0-9-]+)`\]/gm)].map((m) => m[1]);
for (const slug of new Set(listedRows)) {
  if (listedRows.filter((s) => s === slug).length > 1) problems.push(`index lists "${slug}" twice`);
  if (!fileSlugs.has(slug)) problems.push(`index lists "${slug}" but no file exists`);
}

if (problems.length > 0) {
  process.stderr.write(
    `✗ skills: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join('\n')}\n`
  );
  process.exit(1);
}

if (CHECK) {
  if (next !== readme) {
    die(
      1,
      '✗ skills: docs/agent/skills/README.md is stale — run `npm run skills:index` and commit the result'
    );
  }
  process.stdout.write(
    `✓ skills: ${loaded.skills.length} skills, frontmatter valid, index current\n`
  );
  process.exit(0);
}

writeFileSync(readmePath, next);
process.stdout.write(`✓ skills: index rebuilt for ${loaded.skills.length} skills\n`);
