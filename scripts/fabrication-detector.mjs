#!/usr/bin/env node
/**
 * Fabrication detector (Blueprint W0.1.7).
 *
 * WHY THIS EXISTS
 * ---------------
 * The money-AST detector reads *arithmetic*. Every Severity-0 fabrication
 * found in sessions 007–011 was a *hand-typed literal* — `$12.4M` revenue
 * in a board pack, `24.3%` EBITDA margin, `taxRate: 21` on a 70/15/10/5
 * jurisdiction split — which contain no arithmetic at all. A file at
 * "0 unsafe ops" is un-flagged, not certified.
 *
 * This detector asks a different question:
 *
 *     does this module embed a literal financial figure in a displayed
 *     value (KPI `value`, table cell, JSX prop) or a hardcoded statutory
 *     tax rate in a page?
 *
 * WHAT COUNTS
 * -----------
 *   currency-literal   `$12.4M`, `$4.2M`, `$850k`, `$1,234`, `$42.80`
 *                      as the value of a displayed-figure property
 *   percent-literal    `24.3%`, `+12%` in the same positions
 *   hardcoded-rate     `taxRate: 21` (a numeric literal) in src/pages
 *
 * ENGINES: ENTITY-LABEL RULES (2026-08-25, gate-9c wave)
 * ------------------------------------------------------
 * src/engines was already inside SCAN_DIRS for financial figures, but that
 * missed a second fabrication class: engines embedding demo BUSINESS
 * ENTITIES as literals ('Line B - Packaging' shipped to the production
 * dashboard as if it were measured master data). Engines are pure
 * computation — entity identity must arrive via parameters or data, never
 * be typed into source:
 *
 *   hardcoded-entity-label  a direct string-literal value on an operational
 *                           entity prop (`line:` etc.) anywhere in
 *                           src/engines — zero tolerance by construction
 *   demo-entity-literal     a demo-smell string (`Demo…`, `Sample…`,
 *                           `Acme…`) on a business-entity prop
 *                           (customer/vendor/product/site/plant/warehouse/
 *                           department…) in src/engines
 *
 * Only DIRECT string initializers are inspected; synonym/mapping arrays
 * (NLQ keyword lists, column-name mappings) are not fabricated entities.
 * The ratchet tolerates pre-existing debt via scripts/fabrication-baseline.json;
 * at seeding time the only file matching these rules was ManufacturingEngine.ts,
 * which was cleaned in the same wave — so the seeded debt is zero.
 *
 * WHAT IS SAFE
 * ------------
 *   - Comments and documentation strings (AST: we only inspect property
 *     values of displayed-figure names, so "Pre-populated for a $200M
 *     company" in a template description is not flagged)
 *   - SQL placeholders (`$1`, `$2`)
 *   - Excel refs (`$A$1`)
 *   - Format patterns (`$#,##0.00`)
 *   - Placeholders and purpose copy (`placeholder="> $10,000 needs VP"`)
 *   - Computed values (`fmt.currency0(x)`, `formatPercent(rate)`)
 *
 * EXPECT THE FIRST BASELINE TO BE LARGE. Sector dashboards and report
 * templates still ship invented KPIs. The ratchet makes that visible
 * instead of letting it grow. Export engines are fail-closed at zero —
 * session 010 already cleaned them.
 *
 * Usage:
 *   node scripts/fabrication-detector.mjs             # check against baseline
 *   node scripts/fabrication-detector.mjs --update    # re-record baseline
 *   node scripts/fabrication-detector.mjs --list      # worklist, worst first
 *   node scripts/fabrication-detector.mjs --file <p>  # explain one file
 *   node scripts/fabrication-detector.mjs --json      # machine-readable
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const ROOT = process.cwd();
const BASELINE_PATH = join(ROOT, 'scripts', 'fabrication-baseline.json');

const SCAN_DIRS = ['src/engines', 'src/pages', 'src/components', 'src/templates'];

const isTest = (f) => /\.(test|bench|benchmark|spec|stories)\.[tj]sx?$/.test(f);

/**
 * Property / JSX-attribute names that hold a *displayed* financial figure.
 * Deliberately narrower than "any string": template marketing copy and
 * purpose text mention `$200M` as a scenario size, which is not a KPI.
 */
const DISPLAY_VALUE_NAMES = new Set([
  'value',
  'val',
  'amount',
  'sales',
  'revenue',
  'income',
  'profit',
  'ebitda',
  'cash',
  'variance',
  'dividend',
  'mkt_cap',
  'mktcap',
  'marketcap',
  'ffo_yield',
  'ffoyield',
  'return_ytd',
  'returnytd',
  'compgrowth',
  'conversion',
  'change',
  'provision',
  'deferred',
  'pretaxincome',
  'netincome',
  'totalprovision',
]);

/** Export engines must stay at zero findings (session 010 contract). */
const EXPORT_ZERO_TOLERANCE = [
  'src/engines/ExportTemplateEngine.ts',
  'src/engines/ProfessionalExportEngine.ts',
  'src/engines/ExportEngine.ts',
];

const CURRENCY_COMPACT = /\$\s*\d[\d,]*(?:\.\d+)?\s*[KMBTkbmt]\b/;
const CURRENCY_GROUPED = /\$\s*\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/;
const CURRENCY_DECIMAL = /\$\s*\d+\.\d+\b/;
const PERCENT = /[+\-]?\d+(?:\.\d+)?\s*%/;

/**
 * Operational entity whose name must come from config/data, never from an
 * engine source literal (witness: ManufacturingEngine 'Line B - Packaging').
 */
const OPERATIONAL_ENTITY_PROPS = new Set(['line', 'linename', 'productionline']);

/** Business entities where only demo-smell wording is flagged (keeps legit defaults out). */
const BUSINESS_ENTITY_PROPS = new Set([
  'customer',
  'customername',
  'vendor',
  'vendorname',
  'supplier',
  'suppliername',
  'product',
  'productname',
  'department',
  'departmentname',
  'site',
  'sitename',
  'plant',
  'plantname',
  'warehouse',
  'warehousename',
]);

const DEMO_WORD = /^(demo|sample|example|mock|dummy|fake|testdata|test|lorem|acme)\b/i;

function classifyLiteral(text) {
  if (CURRENCY_COMPACT.test(text) || CURRENCY_GROUPED.test(text) || CURRENCY_DECIMAL.test(text)) {
    return 'currency-literal';
  }
  if (PERCENT.test(text)) return 'percent-literal';
  return null;
}

function propName(node) {
  if (!node) return '';
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxNamespacedName?.(node)) return node.name.text;
  return '';
}

function collectStringLiterals(node, out) {
  if (!node) return;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    out.push(node);
    return;
  }
  if (ts.isJsxExpression(node)) {
    collectStringLiterals(node.expression, out);
    return;
  }
  ts.forEachChild(node, (child) => collectStringLiterals(child, out));
}

function analyseFile(filePath, text) {
  const sf = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    /\.tsx$/.test(filePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const findings = [];
  const at = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  const snippet = (node) => {
    const s = node.getText(sf).replace(/\s+/g, ' ').trim();
    return s.length > 90 ? s.slice(0, 87) + '...' : s;
  };
  const add = (node, kind, op) => findings.push({ line: at(node), kind, op, code: snippet(node) });

  const inPages = filePath.replace(/\\/g, '/').includes('/src/pages/');
  const inEngines = filePath.replace(/\\/g, '/').includes('/src/engines/');

  function inspectDisplayValue(nameNode, valueNode) {
    const name = propName(nameNode).replace(/[_-]/g, '').toLowerCase();
    if (!DISPLAY_VALUE_NAMES.has(name) || !valueNode) return;
    const lits = [];
    collectStringLiterals(valueNode, lits);
    for (const lit of lits) {
      const kind = classifyLiteral(lit.text);
      if (kind) add(lit, kind, lit.text);
    }
  }

  /** Engine entity-label rules: direct string initializers only (no arrays/maps). */
  function inspectEntityLabel(nameNode, valueNode) {
    if (!valueNode || !ts.isStringLiteral(valueNode)) return;
    const name = propName(nameNode).replace(/[_-]/g, '').toLowerCase();
    if (OPERATIONAL_ENTITY_PROPS.has(name)) {
      add(valueNode, 'hardcoded-entity-label', valueNode.text);
    } else if (BUSINESS_ENTITY_PROPS.has(name) && DEMO_WORD.test(valueNode.text)) {
      add(valueNode, 'demo-entity-literal', valueNode.text);
    }
  }

  function visit(node) {
    if (ts.isPropertyAssignment(node) || ts.isPropertyDeclaration(node)) {
      inspectDisplayValue(node.name, node.initializer);
      if (
        inPages &&
        ts.isPropertyAssignment(node) &&
        propName(node.name).toLowerCase() === 'taxrate' &&
        node.initializer &&
        ts.isNumericLiteral(node.initializer)
      ) {
        add(node.initializer, 'hardcoded-rate', node.initializer.getText(sf));
      }
      if (inEngines && ts.isPropertyAssignment(node)) {
        inspectEntityLabel(node.name, node.initializer);
      }
    }

    if (ts.isJsxAttribute(node)) {
      inspectDisplayValue(node.name, node.initializer);
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);

  const seen = new Set();
  return findings.filter((f) => {
    const k = `${f.line}:${f.kind}:${f.op}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist' || e === 'build') continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !isTest(basename(p))) out.push(p);
  }
  return out;
}

const files = SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
const results = [];

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  let findings = [];
  try {
    findings = analyseFile(f, text);
  } catch (err) {
    console.error(`  ! parse failure ${rel}: ${err.message}`);
    process.exitCode = 1;
  }
  results.push({ file: rel, findings, count: findings.length });
}

const flagged = results.filter((r) => r.count > 0);
const totalFindings = flagged.reduce((a, r) => a + r.count, 0);
const byKind = {};
for (const r of flagged) {
  for (const f of r.findings) byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
}

const exportEngineViolations = flagged.filter((r) => EXPORT_ZERO_TOLERANCE.includes(r.file));

const measured = {
  modulesScanned: results.length,
  filesWithFindings: flagged.length,
  findings: totalFindings,
  byKind,
  exportEngineViolations: exportEngineViolations.map((r) => r.file),
};

const argv = process.argv.slice(2);

if (argv.includes('--json')) {
  console.log(JSON.stringify({ measured, modules: flagged }, null, 2));
  process.exit(0);
}

const fileArg = argv.indexOf('--file');
if (fileArg !== -1 && argv[fileArg + 1]) {
  const target = argv[fileArg + 1].replace(/\\/g, '/');
  const hit = results.find((r) => r.file === target || r.file.endsWith(target));
  if (!hit) {
    console.error(`No scanned module matches ${target}`);
    process.exit(1);
  }
  console.log(`${hit.file} — ${hit.count} fabrication finding(s)\n`);
  for (const f of hit.findings) {
    console.log(`  line ${String(f.line).padStart(5)}  ${f.kind.padEnd(18)} ${f.op}`);
    console.log(`         ${f.code}`);
  }
  process.exit(0);
}

console.log('Fabrication scan (displayed financial literals):');
console.log(`  modules scanned               ${measured.modulesScanned}`);
console.log(`  files with findings           ${measured.filesWithFindings}`);
console.log(`  findings                      ${measured.findings}`);
console.log('');
console.log('  Findings by kind:');
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${k.padEnd(18)} ${v}`);
}
console.log('');

if (argv.includes('--list')) {
  console.log('  Worklist (worst first):');
  for (const r of [...flagged].sort((a, b) => b.count - a.count).slice(0, 60)) {
    console.log(`    ${String(r.count).padStart(5)}  ${r.file}`);
  }
  console.log('');
}

if (argv.includes('--update')) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify({ ...measured, recordedAt: new Date().toISOString() }, null, 2) + '\n'
  );
  console.log(`Baseline recorded at ${relative(ROOT, BASELINE_PATH)}`);
  process.exit(0);
}

if (!existsSync(BASELINE_PATH)) {
  console.error('No baseline recorded. Run: node scripts/fabrication-detector.mjs --update');
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const failures = [];

if (exportEngineViolations.length > 0) {
  failures.push(
    `export engines must ship ZERO fabricated figures (session 010 contract): ` +
      exportEngineViolations.map((r) => `${r.file} (${r.count})`).join(', ')
  );
}

if (measured.findings > baseline.findings) {
  failures.push(
    `fabricated displayed figures INCREASED: ${baseline.findings} -> ${measured.findings}. ` +
      'Bind the value to posted data or omit the caption. Do not type a plausible number.'
  );
}
if (measured.filesWithFindings > baseline.filesWithFindings) {
  failures.push(
    `files with fabricated figures INCREASED: ${baseline.filesWithFindings} -> ${measured.filesWithFindings}.`
  );
}

if (failures.length) {
  console.error('FABRICATION RATCHET FAILED:\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('\n  Inspect a module:  node scripts/fabrication-detector.mjs --file <path>');
  process.exit(1);
}

console.log(
  `✓ Ratchet holds (baseline: ${baseline.findings} findings across ` +
    `${baseline.filesWithFindings} files). Export engines remain at zero.`
);
