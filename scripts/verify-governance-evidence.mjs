#!/usr/bin/env node
/**
 * Spine GOVERNED evidence gate (PR #89, DEC-062 extension).
 *
 * GOVERNED means authorization, audit, write-guards and lifecycle are enforced —
 * proven by RBAC tests, audit-chain verification, and period-close guards.
 * Entity-scope authorization is explicitly BLOCKED-ON-OWNER O9 and must not be
 * inferred from active entity.
 *
 * docs/plan/governance-evidence.json is the join between a GOVERNED claim and
 * the test that proves it. This gate checks:
 *
 *  - the file exists and the title appears verbatim in it;
 *  - the file is a test file (*.test.ts / *.test.tsx / *.spec.ts / *.spec.tsx);
 *  - the claim does not point at the page it grades;
 *  - each spine route declares authorization / audit / writeGuards and either
 *    an entityScope test claim or an explicit BLOCKED-ON-OWNER O9 boundary;
 *  - entityScope BLOCKED claims must name owner O9, a question, and a note
 *    containing BLOCKED-ON-OWNER;
 *  - each capability named is real (in completion-register CAPABILITIES);
 *  - routes named are real (in src/App.tsx);
 *  - census RBAC counts match the pinned 409 = 302 + 107;
 *  - census auditChain and rbac claims resolve;
 *  - no unknown states or capabilities.
 *
 * Usage: node scripts/verify-governance-evidence.mjs [--check] [--root=DIR]
 * Exit codes: 0 clean, 1 problems, 2 could not verify.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const rootArg = argv.find((a) => a.startsWith('--root='));
const ROOT = rootArg ? resolve(rootArg.slice('--root='.length)) : resolve(import.meta.dirname, '..');

const EVIDENCE = 'docs/plan/governance-evidence.json';
const APP = 'src/App.tsx';
const REGISTER = 'scripts/completion-register.mjs';
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;
const REQUIRED_ROUTE_CLAIMS = ['authorization', 'audit', 'writeGuards', 'entityScope'];

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

const checkTestClaim = (where, claim, { allowPage = null } = {}) => {
  if (!claim || typeof claim !== 'object') {
    problems.push(`${where}: missing evidence claim`);
    return null;
  }
  // Entity-scope BLOCKED-ON-OWNER is allowed to be a boundary object, not a test
  if (claim.owner !== undefined) {
    // This is an entityScope blocked claim — validate it separately
    if (typeof claim.owner !== 'string' || !/^O\d+$/.test(claim.owner)) {
      problems.push(`${where}: entityScope blocked claim must have owner O-id, got "${claim.owner}"`);
    } else if (claim.owner !== 'O9') {
      problems.push(`${where}: entity-scope boundary must be O9 (O9 is the only open entity-scope owner question), got "${claim.owner}"`);
    }
    if (typeof claim.question !== 'string' || claim.question.trim().length < 20) {
      problems.push(`${where}: entityScope blocked claim needs a question of at least 20 chars`);
    }
    if (typeof claim.note !== 'string' || !claim.note.includes('BLOCKED-ON-OWNER')) {
      problems.push(`${where}: entityScope blocked claim note must contain BLOCKED-ON-OWNER`);
    }
    return null;
  }

  const { file, title, proves } = claim;
  if (typeof file !== 'string' || !TEST_FILE.test(file)) {
    problems.push(`${where}: claim must name a test file, got "${file}"`);
    return null;
  }
  if (!existsSync(join(ROOT, file))) {
    problems.push(`${where}: claim file ${file} does not exist`);
    return null;
  }
  if (allowPage && file === allowPage) {
    problems.push(`${where}: claim file ${file} points at the page it grades — proves nothing`);
    return null;
  }
  if (typeof title !== 'string' || title.trim().length < 5) {
    problems.push(`${where}: claim needs the exact test title`);
    return null;
  }
  const fileContent = read(file);
  if (!fileContent.includes(title)) {
    problems.push(`${where}: ${file} has no test titled "${title}"`);
    return null;
  }
  if (typeof proves !== 'string' || proves.trim().length < 20) {
    problems.push(`${where}: needs a "proves" sentence saying what the test establishes`);
  }
  return { file, title };
};

// ---- routes ---------------------------------------------------------------
const appRoutes = new Set([...read(APP).matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]));
const routes = evidence.routes ?? {};
const routeEntries = Object.entries(routes);
if (routeEntries.length === 0) problems.push(`${EVIDENCE}: no routes claimed for GOVERNED`);

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
  for (const state of REQUIRED_ROUTE_CLAIMS) {
    const claim = claims[state];
    if (!claim) {
      problems.push(`${where}: missing required claim "${state}"`);
      continue;
    }
    if (state === 'entityScope' && claim.owner) {
      // Blocked claim — validate boundary
      checkTestClaim(`${where} ${state}`, claim);
    } else {
      if (checkTestClaim(`${where} ${state}`, claim, { allowPage: page })) routeClaims += 1;
    }
  }
  for (const key of Object.keys(claims)) {
    if (!REQUIRED_ROUTE_CLAIMS.includes(key)) {
      problems.push(`${where}: unknown claim "${key}" (allowed: ${REQUIRED_ROUTE_CLAIMS.join(', ')})`);
    }
  }
}

// ---- capabilities ---------------------------------------------------------
const registerText = read(REGISTER);
const listStart = registerText.indexOf('const CAPABILITIES = [');
const listEnd = registerText.indexOf('];', listStart);
if (listStart < 0 || listEnd < 0) {
  fail(2, 'cannot verify: could not read the CAPABILITIES list from the completion register script');
}
const knownCapabilities = new Set(
  [...registerText.slice(listStart, listEnd).matchAll(/'([a-z0-9]+(?:[-.][a-z0-9]+)+)'/g)].map((m) => m[1])
);
if (knownCapabilities.size === 0) fail(2, 'cannot verify: the CAPABILITIES list parsed empty');

const capabilities = evidence.capabilities ?? {};
const capabilityEntries = Object.entries(capabilities);
if (capabilityEntries.length === 0) problems.push(`${EVIDENCE}: no capabilities claimed for GOVERNED`);

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
    if (checkTestClaim(where, claim)) capabilityClaims += 1;
  }
}

// ---- census ---------------------------------------------------------------
const census = evidence.census ?? {};
if (Object.keys(census).length === 0) {
  problems.push(`${EVIDENCE}: no census claimed (rbac + auditChain + entityScope boundary)`);
}

let censusClaims = 0;
if (census.rbac) {
  const where = 'census rbac';
  if (checkTestClaim(where, census.rbac)) censusClaims += 1;
  const counts = census.rbac.counts;
  if (!counts || typeof counts.total !== 'number' || typeof counts.guarded !== 'number' || typeof counts.exceptions !== 'number') {
    problems.push(`${where}: counts must have total/guarded/exceptions numbers`);
  } else {
    if (counts.total !== 409) problems.push(`${where}: total must be 409, got ${counts.total}`);
    if (counts.guarded !== 302) problems.push(`${where}: guarded must be 302, got ${counts.guarded}`);
    if (counts.exceptions !== 107) problems.push(`${where}: exceptions must be 107, got ${counts.exceptions}`);
    if (counts.total !== counts.guarded + counts.exceptions) {
      problems.push(`${where}: total ${counts.total} != guarded ${counts.guarded} + exceptions ${counts.exceptions}`);
    }
  }
} else {
  problems.push('census rbac: missing — N3 closure requires the RBAC census claim');
}

if (census.auditChain) {
  const where = 'census auditChain';
  if (checkTestClaim(where, census.auditChain)) censusClaims += 1;
} else {
  problems.push('census auditChain: missing — N2 closure requires the audit-chain census claim');
}

if (census.entityScope) {
  const where = 'census entityScope';
  // Must be BLOCKED-ON-OWNER O9
  if (census.entityScope.owner) {
    checkTestClaim(where, census.entityScope);
  } else {
    problems.push(`${where}: must be BLOCKED-ON-OWNER O9 — entity-scope cannot be claimed as GOVERNED`);
  }
} else {
  problems.push('census entityScope: missing — O9 boundary must be stated');
}

// ---- policy ---------------------------------------------------------------
if (!evidence.policy || typeof evidence.policy !== 'object') {
  problems.push(`${EVIDENCE}: missing policy block`);
} else {
  for (const key of ['route', 'capability', 'entityScope', 'auditChain', 'rbac']) {
    if (typeof evidence.policy[key] !== 'string' || evidence.policy[key].trim().length < 20) {
      problems.push(`${EVIDENCE}: policy.${key} needs a sentence of at least 20 chars`);
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`✗ governance evidence: ${problems.length} problem(s)\n`);
  for (const problem of problems) process.stderr.write(`  - ${problem}\n`);
  process.exit(1);
}

process.stdout.write(
  `✓ governance evidence: ${routeEntries.length} routes (${routeClaims} state claims) · ` +
    `${capabilityEntries.length} capabilities (${capabilityClaims} claims) · ` +
    `${censusClaims} census claims — every cited test exists and carries the cited title; ` +
    `RBAC 409=302+107 pinned; entity-scope BLOCKED-ON-OWNER O9 stated\n`
);
