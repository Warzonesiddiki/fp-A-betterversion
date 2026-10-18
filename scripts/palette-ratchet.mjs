#!/usr/bin/env node
/**
 * Palette-migration ratchet (UI restyle Phase 1). It guards the same rules the
 * seven theme contract suites in `src/theme/` pin under their own ids UI-01 /
 * UI-07 / UI-08; those ids live in the suites, not in
 * docs/discovery/requirements-register.md, which numbers requirements
 * FR-/NFR-/UX-/AI-.
 *
 * The theme is a set of semantic custom properties in `src/index.css`
 * (--text-*, --bg-*, --border-*, --surface-*, --action-*, --accent-*,
 * --financial-*). A numbered Tailwind palette utility — `text-slate-500`,
 * `dark:bg-gray-900`, `bg-slate-800/50` — hardcodes one colour stop, so it does
 * not flip with the theme, cannot be re-valued centrally, and its contrast is
 * not covered by the theme contract suites in `src/theme/`. That is why
 * `lightContrast.contract.test.ts` caught commit 76ed099: a panel written with
 * `text-white` / `text-slate-400` and no dark backdrop.
 *
 * The migration is half done and the surface is large. Measured on 2026-10-18
 * at commit 6d25994: 5,548 raw palette utilities across 373 non-test modules
 * under src/ (src/components 3,147, src/pages 2,398, src/engines 3), against
 * 4,648 semantic `var(--…)` usages in those same two trees, counted with
 * `grep -roE "var\(--[a-z0-9-]+\)" src/pages src/components --include=*.ts
 * --include=*.tsx`. Restyling everything therefore means finishing that
 * migration, and a migration can only be finished if it cannot silently grow
 * while it is in progress.
 *
 * This script counts the raw palette utilities per FILE and fails if any file's
 * count rises above its recorded baseline, or a new file appears with any.
 * Files are listed individually so a regression is attributable to a file, not
 * hidden by an unrelated fix elsewhere: the only escape from a rising count is
 * to remove at least as many utilities from the same file.
 *
 * The approved replacements are the semantic tokens declared in `src/index.css`,
 * written either as the arbitrary-value utilities the tree already uses
 * (`text-slate-500` -> `text-[var(--text-secondary)]` 543 in use,
 * `bg-slate-800/50` -> `bg-[var(--bg-surface)]` 192, `text-[var(--text-muted)]`
 * 1,621) or as one of the `@theme inline` bridge utilities
 * (`text-muted-foreground` 141, `bg-primary` 31, `ring-ring` 5). Adding a token
 * to `src/index.css` is allowed and welcome; adding a numbered stop is not.
 * "Half migrated" is literal: one className can carry a migrated token and a
 * raw stop side by side, and this script counts the raw one.
 *
 * Usage:
 *   node scripts/palette-ratchet.mjs              # check against baseline
 *   node scripts/palette-ratchet.mjs --update     # re-record (per-file totals must not rise)
 *   node scripts/palette-ratchet.mjs --list       # print every file, worst first
 *   node scripts/palette-ratchet.mjs --json       # machine-readable (tests)
 *   node scripts/palette-ratchet.mjs --root=<dir> --baseline=<path>   # throwaway tree
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname, basename, relative, resolve, dirname } from 'node:path';

function argValue(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

// resolve(), never join(): --root and --baseline are absolute in the tests, and
// join() would swallow an absolute path into the cwd.
const CWD = process.cwd();
const ROOT = resolve(CWD, argValue('root', '.'));
const BASELINE_PATH = resolve(
  CWD,
  argValue('baseline', join(ROOT, 'scripts', 'palette-baseline.json'))
);
const isTest = (f) => /\.(test|bench|benchmark|spec|stories)\.[tj]sx?$/.test(f);

/** Every module that can render a colour: the whole of src/, tests excluded. */
const SCAN_DIRS = ['src'];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !isTest(basename(p))) out.push(p);
  }
  return out;
}

/**
 * One global pattern: any numbered palette utility, with any variant prefix
 * (`dark:`, `hover:`, `md:`) and any opacity suffix (`/50`). Both still
 * hardcode a palette stop that does not flip with the theme, so both count.
 */
const PALETTE_UTILITY =
  /(text|bg|border|ring|fill|stroke|from|via|to|divide|outline|decoration|shadow|accent|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g;

/** Strip comments so documentation that mentions `text-slate-500` is not counted. */
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
const perFile = {};
const sites = [];

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  const text = stripComments(readFileSync(f, 'utf8'));
  PALETTE_UTILITY.lastIndex = 0;
  let fileTotal = 0;
  let m;
  while ((m = PALETTE_UTILITY.exec(text)) !== null) {
    fileTotal += 1;
    const line = text.slice(0, m.index).split('\n').length;
    sites.push({ file: rel, line, utility: m[0] });
  }
  if (fileTotal > 0) perFile[rel] = fileTotal;
}

const total = Object.values(perFile).reduce((a, b) => a + b, 0);
const measured = {
  modulesScanned: files.length,
  filesWithSites: Object.keys(perFile).length,
  total,
};

const sortedPerFile = Object.fromEntries(
  Object.entries(perFile).sort(([a], [b]) => a.localeCompare(b))
);
const worstFirst = Object.entries(perFile).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const isJson = process.argv.includes('--json');

if (!isJson) {
  console.log('Palette-migration ratchet (raw numbered palette utilities under src/):');
  console.log(`  modules scanned             ${measured.modulesScanned}`);
  console.log(`  files with sites            ${measured.filesWithSites}`);
  console.log(`  raw palette utilities       ${measured.total}`);
  console.log('');

  if (process.argv.includes('--list')) {
    for (const [f, n] of worstFirst) console.log(`  ${String(n).padStart(5)}  ${f}`);
    console.log('');
  }
}

if (process.argv.includes('--update')) {
  if (existsSync(BASELINE_PATH)) {
    const prev = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    const risen = Object.entries(sortedPerFile).filter(([f, n]) => n > (prev.perFile?.[f] ?? 0));
    if (risen.length) {
      console.error('Refusing to record a baseline that is WORSE than the previous one:');
      for (const [f, n] of risen) console.error(`  ✗ ${f}: ${prev.perFile?.[f] ?? 0} -> ${n}`);
      console.error(
        'Fix the regression (use a semantic token from src/index.css) or delete this guard explicitly.'
      );
      process.exit(1);
    }
  }
  // --baseline may point at a directory that does not exist yet (the tests run
  // against a throwaway tree), so create it rather than fail on ENOENT.
  mkdirSync(dirname(BASELINE_PATH), { recursive: true });
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ ...measured, perFile: sortedPerFile, recordedAt: '2026-10-18' }, null, 2) +
      '\n'
  );
  const shown = relative(CWD, BASELINE_PATH);
  console.log(`Baseline recorded at ${shown.startsWith('..') ? BASELINE_PATH : shown}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error('No baseline recorded. Run: node scripts/palette-ratchet.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const failures = [];
for (const [f, n] of Object.entries(sortedPerFile)) {
  const before = baseline.perFile?.[f];
  if (n > (before ?? 0)) {
    failures.push(
      `${f}: raw palette utilities ${before ?? 0} -> ${n} ` +
        `(${before === undefined ? 'new file' : `+${n - before}`}). ` +
        'Use a semantic token from src/index.css, or remove at least as many ' +
        'utilities from this same file.'
    );
  }
}

if (isJson) {
  console.log(
    JSON.stringify(
      {
        root: relative(CWD, ROOT) || '.',
        baseline: relative(CWD, BASELINE_PATH),
        ok: failures.length === 0,
        ...measured,
        baselineTotal: baseline.total ?? null,
        baselineFilesWithSites: baseline.filesWithSites ?? null,
        perFile: sortedPerFile,
        failures,
      },
      null,
      2
    )
  );
  process.exit(failures.length === 0 ? 0 : 1);
}

if (failures.length) {
  console.error('PALETTE RATCHET FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

const improved = (baseline.total ?? 0) - measured.total;
console.log(
  `✓ Ratchet holds (baseline: ${baseline.total} raw palette utilities across ` +
    `${baseline.filesWithSites} files` +
    (improved > 0
      ? `; now ${measured.total} — ${improved} fewer. Run --update to lock in the improvement).`
      : ').')
);
