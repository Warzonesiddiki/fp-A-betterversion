#!/usr/bin/env node
/**
 * Route disposition gate (PR #87, DEC-061).
 *
 * `scripts/generate-capability-truth-matrix.mjs` classifies a route from its path
 * prefix. That is honest for the routes a prefix explains and useless for the 47
 * it could not: they fell through to `REVIEW — disposition required`, which is a
 * question addressed to nobody. PR #87 answered all 47 in
 * `docs/product/route-dispositions.json`.
 *
 * This gate keeps those answers answerable:
 *
 *  - every decision names a route that exists in `src/App.tsx` (no phantom rows);
 *  - every decision carries a pillar, a disposition, an accountable role, a
 *    reason and the evidence that would move it (no blank fields);
 *  - the disposition starts with a word from the closed vocabulary;
 *  - a decision that says "legacy alias of X" names the target `src/App.tsx`
 *    actually redirects to — the decision cannot drift from the code;
 *  - no route row in the generated matrix is still `REVIEW`, and the matrix
 *    carries the decision for every decided route (so the matrix cannot be
 *    regenerated from a stale table).
 *
 * Usage:
 *   node scripts/verify-route-dispositions.mjs [--check] [--root=DIR]
 *
 * Exit codes: 0 clean, 1 problems, 2 could not verify.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const rootArg = argv.find((a) => a.startsWith('--root='));
const ROOT = rootArg
  ? resolve(rootArg.slice('--root='.length))
  : resolve(import.meta.dirname, '..');

const APP = 'src/App.tsx';
const DECISIONS = 'docs/product/route-dispositions.json';
const MATRIX = 'docs/CAPABILITY_TRUTH_MATRIX.md';
const VOCABULARY = ['MIGRATE', 'RETAIN', 'EXPERIMENTAL', 'RETIRED'];

function fail(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

for (const rel of [APP, DECISIONS, MATRIX]) {
  if (!existsSync(join(ROOT, rel))) fail(2, `cannot verify: ${rel} is missing`);
}

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const app = read(APP);

// Same <Route path="…" element={…} /> shape the matrix generator parses.
const routePattern = /<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g;
const routes = new Map();
for (const [, path, element] of app.matchAll(routePattern)) {
  routes.set(path, { element, redirect: /<Navigate\s+to="([^"]+)"/.exec(element)?.[1] });
}

let decisions;
try {
  decisions = JSON.parse(read(DECISIONS));
} catch (error) {
  fail(2, `cannot verify: ${DECISIONS} is not valid JSON (${error.message})`);
}
const table = decisions.routes ?? {};
const problems = [];

const entries = Object.entries(table);
if (entries.length === 0) problems.push(`${DECISIONS}: no decisions recorded`);

for (const [route, decision] of entries) {
  const where = `${route}: `;
  const record = routes.get(route);
  if (!record) {
    problems.push(
      `${where}the route does not exist in ${APP} (a decision for nothing is not a decision)`
    );
    continue;
  }
  for (const field of ['pillar', 'disposition', 'role', 'reason', 'nextEvidence']) {
    const value = decision?.[field];
    if (typeof value !== 'string' || value.trim().length === 0) {
      problems.push(`${where}missing or blank ${field}`);
    }
  }
  const disposition = typeof decision?.disposition === 'string' ? decision.disposition : '';
  const word = VOCABULARY.find((candidate) => disposition.startsWith(candidate));
  if (disposition && !word) {
    problems.push(
      `${where}disposition "${disposition}" does not start with one of ${VOCABULARY.join(', ')}`
    );
  }
  // A decision that claims an alias must name the route the app actually
  // redirects to. Otherwise the table becomes a second, unverified source of
  // truth about the router.
  const alias = /legacy alias of (\S+)/.exec(disposition);
  if (alias) {
    if (!record.redirect) {
      problems.push(`${where}disposition says "legacy alias" but the route renders no <Navigate>`);
    } else if (alias[1] !== record.redirect) {
      problems.push(
        `${where}disposition says "legacy alias of ${alias[1]}" but the route redirects to ${record.redirect}`
      );
    }
  }
}

// The matrix is generated from this table, so it is the place a stale table
// shows up: rows still in REVIEW, or a decided route whose row disagrees.
const matrixDispositions = new Map();
let routeRows = 0;
for (const line of read(MATRIX).split(/\r?\n/)) {
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  const id = /^`(\/[^`]*|\*)`$/.exec(cells[0] ?? '');
  if (!id) continue;
  routeRows += 1;
  const word = /\b(MIGRATE|RETAIN|EXPERIMENTAL|REVIEW)\b/.exec(cells[2] ?? '');
  const disposition = word ? word[1] : '';
  matrixDispositions.set(id[1], disposition);
  if (disposition === 'REVIEW') {
    problems.push(
      `matrix row ${id[1]} is still REVIEW — regenerate the matrix after deciding it (${DECISIONS})`
    );
  }
}
if (routeRows === 0) problems.push(`${MATRIX}: no route rows found — cannot verify`);

for (const [route, decision] of entries) {
  const measured = matrixDispositions.get(route);
  if (measured === undefined) continue; // already reported as a phantom route
  const declared = VOCABULARY.find((word) => String(decision?.disposition ?? '').startsWith(word));
  if (declared && measured !== declared) {
    problems.push(
      `matrix row ${route} reads ${measured}, the decision says ${declared} — regenerate the matrix`
    );
  }
}

if (problems.length > 0) {
  process.stderr.write(`✗ route dispositions: ${problems.length} problem(s)\n`);
  for (const problem of problems) process.stderr.write(`  - ${problem}\n`);
  process.exit(1);
}

const counts = VOCABULARY.map(
  (word) => `${word} ${entries.filter(([, d]) => String(d?.disposition).startsWith(word)).length}`
).join(' · ');
process.stdout.write(
  `✓ route dispositions: ${entries.length} decided, ${routeRows} route rows, 0 REVIEW (${counts})\n`
);
