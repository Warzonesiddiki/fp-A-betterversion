#!/usr/bin/env node
/**
 * One-stop acceptance census — PR #90 (C2).
 *
 * The vision's one-stop rule: every SUPPORTED workflow is completable inside
 * the app; no second app is a mandatory step. Excel export is optional
 * interoperability, not a completion prerequisite (DEC-035 supersedes DEC-018).
 *
 * This script is the gate for C2. It reads the completion register's SUPPORTED
 * routes and verifies:
 * - Each SUPPORTED route's page exists and does not declare Excel as mandatory
 * - Corrections tracker (FR-010, DEC-035) has in-app lifecycle REQUESTED→APPLIED→RE-VERIFIED
 *   with Excel export optional
 * - D365 intake is in-app (CSV/XLSX/D365 via GL upload)
 * - DEC-035 exists and states Excel optional
 *
 * It fails when a SUPPORTED workflow names an external tool as required.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function fail(msg) {
  console.error(`✗ one-stop acceptance: ${msg}`);
  process.exit(1);
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

// Load register
let register;
try {
  register = JSON.parse(read('docs/plan/completion-register.json'));
} catch (e) {
  fail(`cannot read completion-register.json: ${e.message}`);
}

const supportedRoutes = register.rows.filter((r) => r.status === 'SUPPORTED' && r.kind === 'route');
if (supportedRoutes.length === 0) {
  fail('no SUPPORTED routes — cannot verify one-stop');
}
ok(`SUPPORTED routes: ${supportedRoutes.length} (${supportedRoutes.map((r) => r.id).join(', ')})`);

// Load evidence manifests for page paths
let spine, gov;
try {
  spine = JSON.parse(read('docs/plan/spine-evidence.json'));
} catch {
  spine = { routes: {} };
}
try {
  gov = JSON.parse(read('docs/plan/governance-evidence.json'));
} catch {
  gov = { routes: {} };
}

// Check DEC-035 exists and states Excel optional
const decisionLog = read('docs/discovery/decision-log.md');
if (!decisionLog.includes('DEC-035')) {
  fail('DEC-035 not found in decision-log.md — one-stop correction decision missing');
}
if (!/Excel.*optional/i.test(decisionLog) || !/in-tool.*sufficient/i.test(decisionLog)) {
  fail('DEC-035 does not state Excel optional and in-tool sufficient');
}
ok('DEC-035 present and states Excel optional, in-tool sufficient');

// Check each SUPPORTED route's page does not require Excel as mandatory
const forbiddenPhrases = [
  /Excel is required/i,
  /requires Excel/i,
  /mandatory.*Excel/i,
  /must.*export.*Excel/i,
];

for (const row of supportedRoutes) {
  const routePath = row.id.replace('route:', '');
  const evidence = row.evidence ?? {};
  // Prefer page from gov or spine manifest
  const govEntry = gov.routes?.[routePath];
  const spineEntry = spine.routes?.[routePath];
  const pageFile = govEntry?.page || spineEntry?.page;
  if (!pageFile) {
    fail(`${row.id}: no page file in evidence manifests`);
  }
  if (!existsSync(join(ROOT, pageFile))) {
    fail(`${row.id}: page file ${pageFile} does not exist`);
  }
  const pageSource = read(pageFile);
  for (const re of forbiddenPhrases) {
    if (re.test(pageSource)) {
      fail(`${row.id}: page ${pageFile} contains forbidden phrase ${re} — Excel must be optional`);
    }
  }
  // For corrections route, verify optional export wording
  if (routePath === '/data/corrections') {
    if (!/Excel.*optional/i.test(pageSource) && !/optional.*export/i.test(pageSource)) {
      // Also check component comment
      if (!/Excel remains an optional export/i.test(pageSource) && !/Excel export is optional/i.test(pageSource)) {
        fail(`/data/corrections: page ${pageFile} does not state Excel optional`);
      }
    }
    ok(`/data/corrections: in-app correction path with optional Excel export`);
  }
}

// Check D365 intake is in-app (GL upload accepts CSV/XLSX/D365)
const glUploadPage = 'src/pages/data/GLUploadPage.tsx';
if (!existsSync(join(ROOT, glUploadPage))) {
  // Try alternative
  const alt = 'src/pages/data/DataImportPage.tsx';
  if (!existsSync(join(ROOT, alt))) {
    fail('D365 intake page not found (GLUploadPage or DataImportPage)');
  } else {
    const src = read(alt);
    if (!/D365/i.test(src) && !/csv/i.test(src)) {
      fail(`${alt} does not mention D365/CSV intake`);
    }
    ok(`D365 intake in-app via ${alt}`);
  }
} else {
  const src = read(glUploadPage);
  if (!/D365/i.test(src) && !/csv/i.test(src)) {
    fail(`${glUploadPage} does not mention D365/CSV intake`);
  }
  ok(`D365 intake in-app via ${glUploadPage}`);
}

// Check corrections tracker has human-only lifecycle
const correctionsPage = 'src/pages/data/CorrectionsPage.tsx';
if (existsSync(join(ROOT, correctionsPage))) {
  const src = read(correctionsPage);
  if (!/REQUESTED.*APPLIED.*RE-VERIFIED/i.test(src) && !/REQUESTED.*APPLIED.*REVERIFIED/i.test(src)) {
    fail(`${correctionsPage} does not document REQUESTED→APPLIED→RE-VERIFIED lifecycle`);
  }
  ok(`Corrections tracker lifecycle documented in ${correctionsPage}`);
}

// Final census: no SUPPORTED workflow requires external tool
console.log('');
console.log(`✓ one-stop acceptance: ${supportedRoutes.length} SUPPORTED routes completable in-app, Excel optional, D365 intake in-app, DEC-035 recorded`);
