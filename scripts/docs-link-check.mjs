#!/usr/bin/env node
/**
 * docs-link-check.mjs — docs-link graph gate (MISSION D, 2026-08-07)
 *
 * Scans every markdown file in the repo and verifies that every local
 * reference resolves to a real file. Two kinds of references are checked:
 *
 *   1. Markdown links     [text](./path/to/file.md)      — HARD (exit 1 on miss)
 *   2. Backtick citations `docs/path/to/file.md`         — SOFT (warn; `--strict`
 *      promotes warnings to failures so the graph can be fully verified locally)
 *
 * Resolution rules (in order, first match wins):
 *   - strip `#anchor` and `:NNN` line-suffixes
 *   - skip http(s)://, mailto:, data:, #-anchors, and glob/placeholder patterns
 *   - try relative to the referring file's directory
 *   - then try repo-root-relative (covers `docs/...`-prefixed citations written
 *     from inside docs/)
 *   - accept a file, or a directory (GitHub renders dir links), or +'.md'
 *
 * Intentionally ignored: references to anything outside the repo
 * (../issues, ../../discussions are GitHub UI links), and tool-config paths
 * (.claude/, .codex/, .agents/ …) which are not part of the docs graph.
 *
 * Exit codes:
 *   0 — graph clean
 *   1 — broken markdown links (or broken citations under --strict)
 *   2 — internal usage error
 *
 * Usage:
 *   node scripts/docs-link-check.mjs            # hard links only
 *   node scripts/docs-link-check.mjs --strict   # hard links + citations
 *   node scripts/docs-link-check.mjs --json     # machine-readable report
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const JSON_OUT = process.argv.includes('--json');

// MISSION D: deliberate exceptions to the graph (see docs-link-allowlist.json).
let ALLOWLIST = { files: {}, targets: {} };
try {
  ALLOWLIST = JSON.parse(readFileSync(join(ROOT, 'scripts/docs-link-allowlist.json'), 'utf8'));
} catch {
  // allowlist missing — run without exemptions
}
const allowFile = (rel) =>
  Object.prototype.hasOwnProperty.call(ALLOWLIST.files || {}, rel) ||
  // reports/ = dated historical evidence (audits, closeouts, baselines). They
  // reference files that legitimately no longer exist; they are records, not
  // navigational docs. Exempt from the live docs graph by policy (2026-08-07).
  rel.startsWith('reports/') ||
  // session handovers are superseded snapshots once the next session starts.
  /^HANDOVER_PROMPT_SESSION\d+\.md$/.test(rel);
const allowTarget = (t) => Object.prototype.hasOwnProperty.call(ALLOWLIST.targets || {}, t);

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'coverage', 'build',
  'src-tauri/target', '.venv', '__pycache__', 'bench-results',
]);

// Glob/placeholder refs that are intentional documentation patterns, not links.
const PATTERN_RE =
  /[<>*?]|\{[^}]+\}|\(<[^>]+>\)|\bTASK-ID\b|\bNNN\b|<NAME>|\.\.\./;

// Tool-config / out-of-repo refs are outside the docs graph.
const NON_GRAPH_PREFIXES = [
  '.claude/', '.codex/', '.agents/', '.ai/', '.openhands/', '.openclaude/',
  '.swarm/', '.hermes/', '.obsidian/', '.planning/', '_TEMP_ACTIVE/',
  'AGENT_SWARM/', 'hive/', '.a5c/', 'prompt/', 'tests/', 'e2e/', 'src-tauri/',
];

function isGraphTarget(t) {
  if (NON_GRAPH_PREFIXES.some((p) => t.startsWith(p))) return false;
  if (t.startsWith('docs/') || t.startsWith('./docs/') || t.startsWith('../docs/')) return true;
  if (t.endsWith('.md') || t.endsWith('.mdx')) return true;
  return false;
}

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) yield* walk(p);
    else if (/\.(md|mdx)$/.test(e)) yield p;
  }
}

function resolves(target, fromFile) {
  // strip #anchor and :NNN / :NRR / :500-505 style line-suffixes after the
  // filename (only when the base already ends in .md, so real filenames like
  // v0_1.md are untouched)
  let clean = target.split('#')[0];
  if (/\.md/.test(clean)) clean = clean.replace(/:[^/]*$/, '');
  clean = clean.replace(/:\d+$/, '').replace(/:\d+$/, '');
  if (!clean) return true;
  if (PATTERN_RE.test(clean)) return true;
  if (NON_GRAPH_PREFIXES.some((p) => clean.startsWith(p))) return true;
  // out-of-repo relative navigation (GitHub UI links) and negation patterns
  if (clean.startsWith('../') || clean.startsWith('../../') || clean.startsWith('!/')) return true;
  try {
    decodeURIComponent(clean);
  } catch {
    return true; // malformed URI — leave for humans
  }
  const candidates = [
    resolve(dirname(fromFile), clean),
    resolve(ROOT, clean.replace(/^\.\//, '')),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return true;
    if (existsSync(c + '.md')) return true;
    if (existsSync(c + '/index.md')) return true;
  }
  return false;
}

const hardBroken = []; // { file, ref }
const softBroken = []; // { file, ref }

const allMd = [...walk(ROOT)];
const mdCount = allMd.length;
for (const file of allMd) {
  const content = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  if (allowFile(rel)) continue; // deliberate whole-file exemption (historical record)

  // 1. markdown links
  const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = linkRe.exec(content))) {
    let t = m[1].trim();
    if (!t || t.startsWith('#') || /^(https?:|mailto:|data:)/.test(t)) continue;
    if (t.includes('github.com')) continue;
    try {
      t = decodeURIComponent(t);
    } catch { /* keep raw */ }
    if (!isGraphTarget(t)) continue;
    if (!resolves(t, file)) {
      hardBroken.push({ file: rel, ref: m[0].slice(0, 120) });
    }
  }

  // 2. backtick .md citations
  const citeRe = /`([^`]*\.md[^`]*)`/g;
  while ((m = citeRe.exec(content))) {
    let t = m[1].trim();
    if (!t || t.includes(' ') || /^(https?:|mailto:|data:)/.test(t)) continue;
    if (!isGraphTarget(t)) continue;
    if (allowTarget(t.split('#')[0].replace(/:[^/]*$/, ''))) continue; // deliberate forward-reference
    if (!resolves(t, file)) {
      softBroken.push({ file: rel, ref: '`' + t + '`' });
    }
  }
}

const unique = (arr) => [...new Map(arr.map((b) => [`${b.file}|${b.ref}`, b])).values()];
const hard = unique(hardBroken);
const soft = unique(softBroken);

if (JSON_OUT) {
  const payload = JSON.stringify({
    strict: STRICT,
    scannedMd: mdCount,
    brokenLinks: hard,
    brokenCitations: soft,
    hardCount: hard.length,
    softCount: soft.length,
  }, null, 2) + '\n';
  process.stdout.write(payload);
  process.exitCode = hard.length || (STRICT && soft.length) ? 1 : 0;
} else {

if (hard.length) {
  console.error(`✗ ${hard.length} broken markdown link(s) in the docs graph:`);
  for (const b of hard) console.error(`  ${b.file}: ${b.ref}`);
}
if (STRICT && soft.length) {
  console.error(`✗ ${soft.length} broken backtick citation(s) (--strict):`);
  for (const b of soft.slice(0, 60)) console.error(`  ${b.file}: ${b.ref}`);
  if (soft.length > 60) console.error(`  … ${soft.length - 60} more`);
}
if (!hard.length && (!STRICT || !soft.length)) {
  console.log(
    `✓ docs-link graph clean: ${hard.length} broken links` +
    (STRICT ? `, ${soft.length} broken citations (strict)` : '')
  );
  process.exit(0);
}
process.exit(1);
}
