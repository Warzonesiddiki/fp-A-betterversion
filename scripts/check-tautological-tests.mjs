#!/usr/bin/env node
/**
 * Tautological-assertion gate (F-0027).
 *
 * The audit found 48 assertions that pass regardless of product behaviour —
 * `expect(true).toBe(true)`, `it` blocks with no assertion at all, and
 * try/catch shapes where the catch branch asserts a constant so ANY outcome
 * is accepted. These are worse than missing tests: they report coverage for
 * behaviour nobody verified. Three real defects were hiding behind them
 * (SafeMathParser returning 0 for division by zero, an unbounded recursion in
 * SecretsVault, and a stale "KNOWN BUG" placeholder for an already-fixed bug).
 *
 * This gate fails the build if any return. Comments are ignored so the
 * historical explanations left at the fix sites do not trip it.
 *
 * Exit 0 = no tautological assertions in the test suite.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');

/** Patterns that assert a constant and therefore cannot fail. */
const TAUTOLOGIES = [
  { re: /expect\(\s*true\s*\)\s*\.\s*toBe\(\s*true\s*\)/, why: 'expect(true).toBe(true)' },
  { re: /expect\(\s*true\s*\)\s*\.\s*toBeTruthy\(\s*\)/, why: 'expect(true).toBeTruthy()' },
  { re: /expect\(\s*false\s*\)\s*\.\s*toBe\(\s*false\s*\)/, why: 'expect(false).toBe(false)' },
  { re: /expect\(\s*(\d+)\s*\)\s*\.\s*toBe\(\s*\1\s*\)/, why: 'expect(N).toBe(N)' },
  {
    re: /expect\(\s*(['"`])(.*?)\1\s*\)\s*\.\s*toBe\(\s*\1\2\1\s*\)/,
    why: 'expect("x").toBe("x")',
  },
  { re: /expect\(\s*1\s*\)\s*\.\s*toBe\(\s*1\s*\)/, why: 'expect(1).toBe(1)' },
  /**
   * Not a literal constant, but tautological all the same: `render()` always
   * returns a container element, so this holds even when the component renders
   * absolutely nothing. 210 of these were shipped across 110 files under the
   * name "renders without crashing", and they hid seven pages whose empty state
   * was a dead end. Assert the rendered DOM instead:
   *   expect(container.querySelectorAll('*').length).toBeGreaterThanOrEqual(N)
   */
  {
    re: /expect\(\s*container\s*\)\s*\.\s*(?:toBeTruthy\(\s*\)|toBeDefined\(\s*\)|not\s*\.\s*toBeNull\(\s*\))/,
    why: 'expect(container).toBeTruthy() — always true, even for an empty render',
  },
  /**
   * Same failure mode via the destructured RTL result or a bare mount call.
   */
  {
    re: /expect\(\s*(?:baseElement|wrapper)\s*\)\s*\.\s*(?:toBeTruthy\(\s*\)|toBeDefined\(\s*\))/,
    why: 'expect(baseElement/wrapper).toBeTruthy() — always true, even for an empty render',
  },
];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

/**
 * Strip comments so an explanation of a removed tautology is not itself a hit.
 * Deliberately simple: line comments, block comments, and nothing else.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (_m, p1) => p1);
}

const violations = [];
const files = statSync(SRC).isDirectory() ? walk(SRC) : [];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const code = stripComments(raw);
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    for (const { re, why } of TAUTOLOGIES) {
      if (re.test(line)) {
        violations.push(`${relative(ROOT, file)}:${index + 1}  ${why}`);
        break;
      }
    }
  });
}

console.log(`Scanned ${files.length} test files for tautological assertions.`);

if (violations.length > 0) {
  console.error(`\n${violations.length} tautological assertion(s) found:\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error(
    '\nA test that asserts a constant certifies nothing and hides defects.\n' +
      'Assert real behaviour, or delete the test and say why in the commit.'
  );
  process.exit(1);
}

console.log('No tautological assertions found.');
