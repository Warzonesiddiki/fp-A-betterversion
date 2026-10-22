#!/usr/bin/env node
/**
 * Spine CONNECTED evidence gate (PR #88, DEC-062).
 *
 * The plan asks for a narrow, real claim: a synthetic D365-shaped file goes in,
 * control totals tie, quarantine is named, the trial balance balances, a close
 * cannot be bypassed, an exception rule produces a finding, a disposition
 * survives reload, a board pack ties out. The evidence for that already exists
 * in the suite — spread over page tests, import tests and engine tests — but
 * nothing joined a claim to the test that proves it, so "CONNECTED" would have
 * been an opinion written into a table.
 *
 * `docs/plan/spine-evidence.json` is that join. Every claim names a file and the
 * exact test title inside it. This gate checks:
 *
 *  - the file exists and the title appears verbatim in it (a renamed or deleted
 *    test breaks the claim instead of silently orphaning it);
 *  - each spine route declares journey / empty / error and either a loading
 *    claim or a documented `na`, and `na` is refused for a page whose source has
 *    a page-level loading branch (`isLoading` or `<Skeleton`);
 *  - each spine capability declares at least one claim with a `proves` sentence;
 *  - the declared page exists, and the claim's file is a test file — a claim
 *    pointing at the page it grades would prove nothing;
 *  - every route and capability named is real: routes must exist in
 *    `src/App.tsx`, capability ids must exist in the completion register's
 *    capability list.
 *
 * Usage: node scripts/verify-spine-evidence.mjs [--check] [--root=DIR]
 * Exit codes: 0 clean, 1 problems, 2 could not verify.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const rootArg = argv.find((a) => a.startsWith('--root='));
const ROOT = rootArg
  ? resolve(rootArg.slice('--root='.length))
  : resolve(import.meta.dirname, '..');

const EVIDENCE = 'docs/plan/spine-evidence.json';
const APP = 'src/App.tsx';
const REGISTER = 'scripts/completion-register.mjs';
const REQUIRED_STATES = ['journey', 'empty', 'error'];
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;

function fail(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

for (const rel of [EVIDENCE, APP, REGISTER]) {
  if (!existsSync(join(ROOT, rel))) fail(2, `cannot verify: ${rel} is missing`);
}

const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let evidence;
try {
  evidence = JSON.parse(read(EVIDENCE));
} catch (error) {
  fail(2, `cannot verify: ${EVIDENCE} is not valid JSON (${error.message})`);
}

const problems = [];
const checkClaim = (where, claim, { allowNa = false } = {}) => {
  if (!claim || typeof claim !== 'object') {
    problems.push(`${where}: missing evidence claim`);
    return null;
  }
  if (claim.na !== undefined) {
    if (!allowNa) {
      problems.push(`${where}: "na" is only allowed for the loading state`);
      return null;
    }
    if (typeof claim.na !== 'string' || claim.na.trim().length < 40) {
      problems.push(`${where}: "na" needs a reason of at least 40 characters, not an excuse`);
      return null;
    }
    return null;
  }
  const { file, title } = claim;
  if (typeof file !== 'string' || !TEST_FILE.test(file)) {
    problems.push(`${where}: claim must name a test file, got "${file}"`);
    return null;
  }
  if (!existsSync(join(ROOT, file))) {
    problems.push(`${where}: claim file ${file} does not exist`);
    return null;
  }
  if (typeof title !== 'string' || title.trim().length < 5) {
    problems.push(`${where}: claim needs the exact test title`);
    return null;
  }
  if (!read(file).includes(title)) {
    problems.push(`${where}: ${file} has no test titled "${title}"`);
    return null;
  }
  return { file, title };
};

// ---- routes ---------------------------------------------------------------
const appRoutes = new Set(
  [...read(APP).matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1])
);
const routes = evidence.routes ?? {};
const routeEntries = Object.entries(routes);
if (routeEntries.length === 0) problems.push(`${EVIDENCE}: no routes claimed`);

let routeClaims = 0;
for (const [route, entry] of routeEntries) {
  const where = `route ${route}`;
  if (!appRoutes.has(route)) {
    problems.push(`${where}: not a route in ${APP}`);
    continue;
  }
  const page = entry?.page;
  if (typeof page !== 'string' || !existsSync(join(ROOT, page))) {
    problems.push(`${where}: page "${page}" does not exist`);
    continue;
  }
  const claims = entry?.claims ?? {};
  for (const state of REQUIRED_STATES) {
    if (checkClaim(`${where} ${state}`, claims[state])) routeClaims += 1;
  }
  if (claims.loading === undefined) {
    problems.push(`${where}: loading is neither claimed nor documented as not applicable`);
  } else if (claims.loading?.na !== undefined) {
    const source = read(page);
    if (/\bisLoading\b|<Skeleton/.test(source)) {
      problems.push(
        `${where}: the page has a loading branch (isLoading/<Skeleton), so "na" is not honest — cite the test`
      );
    }
  } else if (checkClaim(`${where} loading`, claims.loading)) {
    routeClaims += 1;
  }
  for (const key of Object.keys(claims)) {
    if (![...REQUIRED_STATES, 'loading'].includes(key)) {
      problems.push(`${where}: unknown state "${key}"`);
    }
  }
}

// ---- shell ----------------------------------------------------------------
const shell = evidence.shell ?? {};
if (Object.keys(shell).length === 0) {
  problems.push(`${EVIDENCE}: no shell-level state claimed (stale/offline lives in the shell)`);
}
let shellClaims = 0;
for (const [state, claim] of Object.entries(shell)) {
  if (checkClaim(`shell ${state}`, claim)) shellClaims += 1;
  if (typeof claim?.proves !== 'string' || claim.proves.trim().length < 20) {
    problems.push(`shell ${state}: needs a "proves" sentence saying what the test establishes`);
  }
}

// ---- capabilities ---------------------------------------------------------
// The capability ids are the register's own list; parsing the script keeps one
// source of truth instead of a second, drifting copy in this gate.
const registerText = read(REGISTER);
const listStart = registerText.indexOf('const CAPABILITIES = [');
const listEnd = registerText.indexOf('];', listStart);
if (listStart < 0 || listEnd < 0) {
  fail(
    2,
    'cannot verify: could not read the CAPABILITIES list from the completion register script'
  );
}
const knownCapabilities = new Set(
  [...registerText.slice(listStart, listEnd).matchAll(/'([a-z0-9]+(?:[-.][a-z0-9]+)+)'/g)].map(
    (match) => match[1]
  )
);
if (knownCapabilities.size === 0) fail(2, 'cannot verify: the CAPABILITIES list parsed empty');

const capabilities = evidence.capabilities ?? {};
const capabilityEntries = Object.entries(capabilities);
if (capabilityEntries.length === 0) problems.push(`${EVIDENCE}: no capabilities claimed`);

let capabilityClaims = 0;
for (const [capability, claims] of capabilityEntries) {
  if (!knownCapabilities.has(capability)) {
    problems.push(`capability ${capability}: not in the completion register's capability list`);
    continue;
  }
  if (!Array.isArray(claims) || claims.length === 0) {
    problems.push(`capability ${capability}: needs at least one claim`);
    continue;
  }
  for (const [index, claim] of claims.entries()) {
    const where = `capability ${capability}[${index}]`;
    if (checkClaim(where, claim)) capabilityClaims += 1;
    if (typeof claim?.proves !== 'string' || claim.proves.trim().length < 20) {
      problems.push(`${where}: needs a "proves" sentence saying what the test establishes`);
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`✗ spine evidence: ${problems.length} problem(s)\n`);
  for (const problem of problems) process.stderr.write(`  - ${problem}\n`);
  process.exit(1);
}

process.stdout.write(
  `✓ spine evidence: ${routeEntries.length} routes (${routeClaims} state claims) · ` +
    `${shellClaims} shell claims · ${capabilityEntries.length} capabilities ` +
    `(${capabilityClaims} claims) — every cited test exists and carries the cited title\n`
);
