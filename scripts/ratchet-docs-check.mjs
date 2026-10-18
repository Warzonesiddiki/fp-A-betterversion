#!/usr/bin/env node
/**
 * Ratchet-docs check.
 *
 * The "Ratchet baselines (direction: down only)" table in
 * `docs/agent/09_KNOWN_GAPS.md` is the human-readable record of the gates this
 * repo enforces. It drifted: it claimed determinism 345 / 80 while the gate
 * enforced 344 / 79, type-safety escapes 116 while the tree measured 47, and a
 * money-adoption floor of 28.89 % while the recorded baseline was 23.54 %. A
 * document that describes gates which are not the gates in force is worse than
 * no document: it is the number a reviewer plans against.
 *
 * This script converts those five documented claims into script-checked
 * numbers: every value in the table must equal the baseline JSON the
 * corresponding gate reads. Missing or unparseable rows fail too, so the check
 * cannot be disabled by deleting a row.
 *
 * The same numbers are also stated in prose in three other live documents, and
 * those had drifted too: the requirements register said NFR-001 baselines "345
 * sites across 160 calculation-path files" (the gate enforces 344 / 79), the
 * project brief said "345 wall-clock/random sites" and "adoption 28.9 %" (the
 * adoption floor is 29.16 %), and the domain-rules table said "345 legacy sites
 * remain". Each of those sentences is checked as well. Historical records are
 * deliberately NOT checked: `docs/archive/**` and the dated
 * `docs/discovery/audit-progress-2026-10-15.md` describe the state on the day
 * they were written, and rewriting them would falsify the record.
 *
 * Usage:
 *   node scripts/ratchet-docs-check.mjs                 # exit 1 on any drift
 *   node scripts/ratchet-docs-check.mjs --json          # machine-readable
 *   node scripts/ratchet-docs-check.mjs --doc=<path>    # table doc only
 *   node scripts/ratchet-docs-check.mjs --prose=<path>  # override a prose doc
 *                                                       # (repeatable; matched
 *                                                       #  by basename)
 */
import { readFileSync, existsSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

const ROOT = process.cwd();

function argValue(name, fallback) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const DOC_PATH = resolve(ROOT, argValue('doc', 'docs/agent/09_KNOWN_GAPS.md'));

function readBaseline(file) {
  const p = join(ROOT, 'scripts', file);
  if (!existsSync(p)) {
    throw new Error(`missing baseline file ${relative(ROOT, p)}`);
  }
  return JSON.parse(readFileSync(p, 'utf8'));
}

/** Rows the table must carry, and the baseline number each one states. */
function expectations() {
  const determinism = readBaseline('determinism-baseline.json');
  const typeSafety = readBaseline('type-safety-baseline.json');
  const moneyAst = readBaseline('money-ast-baseline.json');
  const moneyAdoption = readBaseline('money-adoption-baseline.json');
  const palette = readBaseline('palette-baseline.json');

  return [
    {
      row: 'determinism sites / files',
      file: 'scripts/determinism-baseline.json',
      // Rendered as "<sites> / <files>".
      parse: (value) => {
        const m = value.match(/^(\d+)\s*\/\s*(\d+)$/);
        return m ? `${m[1]} / ${m[2]}` : null;
      },
      expected: `${determinism.total} / ${determinism.filesWithSites}`,
    },
    {
      row: 'type-safety escapes',
      file: 'scripts/type-safety-baseline.json',
      parse: (value) => {
        const m = value.match(/^(\d+)$/);
        return m ? m[1] : null;
      },
      expected: String(typeSafety.totalTypeEscapes),
    },
    {
      row: 'money AST violations',
      file: 'scripts/money-ast-baseline.json',
      parse: (value) => {
        const m = value.match(/^(\d+)$/);
        return m ? m[1] : null;
      },
      expected: String(moneyAst.unsafeOperations),
    },
    {
      row: 'money adoption',
      file: 'scripts/money-adoption-baseline.json',
      // Rendered as "<pct> % (floor)" — the floor the adoption gate enforces.
      parse: (value) => {
        const m = value.match(/^(\d+(?:\.\d+)?)\s*%/);
        return m ? m[1] : null;
      },
      expected: String(moneyAdoption.adoptionPercent),
    },
    {
      row: 'palette migration',
      file: 'scripts/palette-baseline.json',
      // Rendered as "<raw palette utilities> / <files with sites>".
      parse: (value) => {
        const m = value.match(/^(\d+)\s*\/\s*(\d+)$/);
        return m ? `${m[1]} / ${m[2]}` : null;
      },
      expected: `${palette.total} / ${palette.filesWithSites}`,
    },
  ];
}

/** Read `| <row> | <value> | <file> |` out of the ratchet-baselines table. */
function documentedValues(md) {
  const values = new Map();
  for (const line of md.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    values.set(cells[0].toLowerCase(), cells[1]);
  }
  return values;
}

/**
 * Prose claims: a sentence in a live document that states a ratchet number.
 * Each rule is matched within a single line, so a claim can never be assembled
 * out of two different rows, and a second number elsewhere in the file cannot
 * satisfy it.
 */
function proseRules() {
  const determinism = readBaseline('determinism-baseline.json');
  const moneyAdoption = readBaseline('money-adoption-baseline.json');
  const detSites = String(determinism.total);

  return [
    {
      doc: 'docs/discovery/requirements-register.md',
      id: 'NFR-001 determinism sites / files',
      file: 'scripts/determinism-baseline.json',
      re: /baselines\s+(\d+)[^\n]{0,220}?sites across\s+(\d+)\s+calculation-path files/,
      render: (m) => `${m[1]} / ${m[2]}`,
      expected: `${determinism.total} / ${determinism.filesWithSites}`,
    },
    {
      doc: 'docs/agent/01_PROJECT_BRIEF.md',
      id: 'determinism sites (project brief)',
      file: 'scripts/determinism-baseline.json',
      re: /\|\s*Determinism\s*\|\s*(\d+)\s+wall-clock\/random sites/,
      render: (m) => m[1],
      expected: detSites,
    },
    {
      doc: 'docs/agent/01_PROJECT_BRIEF.md',
      id: 'money adoption (project brief)',
      file: 'scripts/money-adoption-baseline.json',
      re: /\|\s*Money\s*\|[^\n]{0,220}?adoption\s+(\d+(?:\.\d+)?)\s*%/,
      render: (m) => `${m[1]} %`,
      expected: `${moneyAdoption.adoptionPercent} %`,
    },
    {
      doc: 'docs/agent/03_DOMAIN_RULES.md',
      id: 'determinism sites (domain rules)',
      file: 'scripts/determinism-baseline.json',
      re: /\((\d+)\s+legacy sites remain/,
      render: (m) => m[1],
      expected: detSites,
    },
  ];
}

/** `--prose=<path>` (repeatable) overrides a prose doc, matched by basename. */
const PROSE_OVERRIDES = process.argv
  .filter((a) => a.startsWith('--prose='))
  .map((a) => resolve(ROOT, a.slice('--prose='.length)));

function prosePath(defaultRel) {
  const base = defaultRel.split('/').pop();
  // Compare basenames with `path.basename`, not a literal "/" separator: on
  // Windows `resolve()` returns `C:\\…\\03_DOMAIN_RULES.md`, an `endsWith('/…')`
  // test never matched, and every `--prose=` override silently fell back to the
  // live repo file — so the checker's own mutation tests could not detect a
  // mutation they had written to a temp copy (measured 2026-10-18: the three
  // "fails when …" cases in `src/__tests__/ratchetDocsScript.test.ts` returned
  // the unmutated verdict on this platform).
  const hit = PROSE_OVERRIDES.find((p) => basename(p) === base);
  return hit ?? resolve(ROOT, defaultRel);
}

function firstLineMatch(md, re) {
  for (const line of md.split('\n')) {
    const m = line.match(re);
    if (m) return m;
  }
  return null;
}

if (!existsSync(DOC_PATH)) {
  console.error(`ratchet-docs: cannot find ${relative(ROOT, DOC_PATH)}`);
  process.exit(1);
}

const md = readFileSync(DOC_PATH, 'utf8');
const documented = documentedValues(md);

const checked = [];
const problems = [];

for (const exp of expectations()) {
  const key = exp.row.toLowerCase();
  if (!documented.has(key)) {
    problems.push(`row missing from the ratchet table: "${exp.row}"`);
    checked.push({ row: exp.row, documented: null, expected: exp.expected, ok: false });
    continue;
  }
  const raw = documented.get(key);
  const parsed = exp.parse(raw);
  if (parsed === null) {
    problems.push(`row "${exp.row}": cannot read a number out of "${raw}"`);
    checked.push({ row: exp.row, documented: raw, expected: exp.expected, ok: false });
    continue;
  }
  const ok = parsed === exp.expected;
  if (!ok) {
    problems.push(
      `row "${exp.row}": doc says ${parsed}, ${exp.file} enforces ${exp.expected}` +
        ` — update the doc or run the gate's --update, then make them agree`
    );
  }
  checked.push({ row: exp.row, documented: parsed, expected: exp.expected, ok });
}

// Prose claims are skipped when a single table doc is named with --doc: that
// mode checks one KNOWN_GAPS-shaped file (the script's own tests use it with a
// temporary fixture), and quietly re-checking three unrelated repo docs would
// make its result depend on files the caller never asked about.
const prose = [];
if (!process.argv.some((a) => a.startsWith('--doc='))) {
  for (const rule of proseRules()) {
    const path = prosePath(rule.doc);
    if (!existsSync(path)) {
      problems.push(`prose doc missing: ${relative(ROOT, path)}`);
      prose.push({
        doc: rule.doc,
        id: rule.id,
        documented: null,
        expected: rule.expected,
        ok: false,
      });
      continue;
    }
    const m = firstLineMatch(readFileSync(path, 'utf8'), rule.re);
    if (m === null) {
      problems.push(
        `prose claim "${rule.id}" in ${rule.doc}: cannot find the claim (reworded or ` +
          `deleted?) — ${rule.file} enforces ${rule.expected}`
      );
      prose.push({
        doc: rule.doc,
        id: rule.id,
        documented: null,
        expected: rule.expected,
        ok: false,
      });
      continue;
    }
    const documented = rule.render(m);
    const ok = documented === rule.expected;
    if (!ok) {
      problems.push(
        `prose claim "${rule.id}" in ${rule.doc}: doc says ${documented}, ${rule.file} ` +
          `enforces ${rule.expected} — update the doc or run the gate's --update, then make them agree`
      );
    }
    prose.push({ doc: rule.doc, id: rule.id, documented, expected: rule.expected, ok });
  }
}

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      { doc: relative(ROOT, DOC_PATH), ok: problems.length === 0, checked, prose, problems },
      null,
      2
    )
  );
  process.exit(problems.length === 0 ? 0 : 1);
}

console.log(`Ratchet documentation (${relative(ROOT, DOC_PATH)}):`);
for (const c of checked) {
  console.log(`  ${c.ok ? '✓' : '✗'} ${c.row}: doc ${c.documented ?? '—'} vs gate ${c.expected}`);
}
if (prose.length) {
  console.log('');
  console.log('Prose claims in the live docs:');
  for (const c of prose) {
    console.log(
      `  ${c.ok ? '✓' : '✗'} ${c.doc} — ${c.id}: doc ${c.documented ?? '—'} vs gate ${c.expected}`
    );
  }
}
console.log('');

if (problems.length) {
  console.error('RATCHET DOCS DRIFTED:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✓ All ${checked.length + prose.length} documented ratchet values ` +
    `(${checked.length} table rows, ${prose.length} prose claims) match the gates that enforce them.`
);
