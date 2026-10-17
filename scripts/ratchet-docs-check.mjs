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
 * This script converts those four documented claims into script-checked
 * numbers: every value in the table must equal the baseline JSON the
 * corresponding gate reads. Missing or unparseable rows fail too, so the check
 * cannot be disabled by deleting a row.
 *
 * Usage:
 *   node scripts/ratchet-docs-check.mjs                 # exit 1 on any drift
 *   node scripts/ratchet-docs-check.mjs --json          # machine-readable
 *   node scripts/ratchet-docs-check.mjs --doc=<path>    # check another file
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

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

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      { doc: relative(ROOT, DOC_PATH), ok: problems.length === 0, checked, problems },
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
console.log('');

if (problems.length) {
  console.error('RATCHET DOCS DRIFTED:\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ All ${checked.length} documented ratchet values match the gates that enforce them.`);
