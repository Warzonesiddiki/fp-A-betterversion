#!/usr/bin/env node
/**
 * escape-ledger-check.mjs — Blueprint §24.2/§24.3 instrumentation (W0.10).
 *
 * WHY THIS EXISTS
 * ---------------
 * Section 24 defines the all-in-one promise as a measurable scoreboard: every
 * workflow of a monthly FP&A cycle is enumerated, classified, and owned, and
 * the GA gate is "ZERO hard escapes in the Core-20". Until now that gate was
 * uncomputable — the ledger lived as prose in BLUEPRINT.md §24.2 with no
 * executable check. This script makes the scoreboard runnable so the roadmap
 * cannot drift from the goal silently.
 *
 * SOURCES
 *   - Canonical rows 1–30, escape-class-if-unmet, target phase: hardcoded
 *     below, transcribed verbatim from .agent/blueprint-parts/12c-section-24.md
 *     (§24.2 table). Changing them requires a Blueprint amendment.
 *   - Current status per row: docs/product/escape-ledger.json (maintained;
 *     every wave that ships a workflow updates its row and cites evidence).
 *
 * MODES
 *   node scripts/escape-ledger-check.mjs            → report (exit 0 unless
 *                                                     ledger file invalid)
 *   node scripts/escape-ledger-check.mjs --phase p1 → additionally enforce
 *                                                     that phase's escape-
 *                                                     rate target (p1 ≤40%,
 *                                                     p2 ≤20%, ga ≤5% AND
 *                                                     zero Core-20 hard
 *                                                     escapes)
 *
 * CLASSIFICATION (§24.2/§24.3)
 *   built        → workflow completes in-product; no escape counted
 *   partial      → counts as its classIfUnmet escape (Hard or Soft)
 *   not-started  → same as partial
 *   legitimate   → allowed governed boundary (rows 21–30 only); REQUIRES
 *                  reason + handoff fields, else reclassified Hard
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATUS_FILE = path.join(__dirname, '..', 'docs', 'product', 'escape-ledger.json');

/** Verbatim from §24.2. id 1–20 = Core-20. */
const ROWS = [
  { id: 1,  name: 'Build/maintain an operating model',    owner: 'F-CORE-001/011',           phase: 1, cls: 'hard' },
  { id: 2,  name: 'Rolling forecast',                     owner: 'F-PLAN-001',               phase: 1, cls: 'hard' },
  { id: 3,  name: 'Budget cycle + submissions',           owner: 'F-PLAN-002, F-WORKFLOW-008', phase: 1, cls: 'hard' },
  { id: 4,  name: 'Actuals ingestion from ERP',           owner: 'F-INTEGRATE-000/001',      phase: 1, cls: 'hard' },
  { id: 5,  name: 'Variance analysis + commentary',       owner: 'F-REPORT-003, F-AI-004',   phase: 1, cls: 'soft' },
  { id: 6,  name: 'Three-statement model',                owner: 'F-CORE-002, F-PLAT-004',   phase: 0, cls: 'hard' },
  { id: 7,  name: 'Multi-entity consolidation',           owner: 'F-CORE-006',               phase: 2, cls: 'hard' },
  { id: 8,  name: 'FX translation (IAS 21)',              owner: 'F-CORE-005',               phase: 1, cls: 'hard' },
  { id: 9,  name: 'Intercompany elimination',             owner: 'A.8',                      phase: 2, cls: 'hard' },
  { id: 10, name: 'Period close checklist',               owner: 'F-CLOSE-001, A.4',         phase: 2, cls: 'hard' },
  { id: 11, name: 'Journal entries + adjustments',        owner: 'A.4',                      phase: 2, cls: 'hard' },
  { id: 12, name: 'Reconciliations',                      owner: 'XIX-C, A.4',               phase: 2, cls: 'hard' },
  { id: 13, name: 'Board pack production',                owner: 'F-REPORT-006, A.17',       phase: 2, cls: 'hard' },
  { id: 14, name: 'Management reporting pack',            owner: 'F-REPORT-002',             phase: 1, cls: 'hard' },
  { id: 15, name: 'Ad-hoc analysis / slice-and-dice',     owner: 'F-REPORT-004, F-ANALYSIS-001', phase: 2, cls: 'soft' },
  { id: 16, name: 'Dashboards + KPI monitoring',          owner: 'F-REPORT-001',             phase: 1, cls: 'soft' },
  { id: 17, name: 'Scenario / sensitivity analysis',      owner: 'F-CORE-010, F-PLAN-004',   phase: 1, cls: 'hard' },
  { id: 18, name: 'Headcount / workforce planning',       owner: 'F-PLAN-003',               phase: 2, cls: 'hard' },
  { id: 19, name: 'Cash flow forecasting + treasury',     owner: 'A.5',                      phase: 2, cls: 'hard' },
  { id: 20, name: 'Capex / project planning',             owner: 'F-PLAN-005',               phase: 2, cls: 'hard' },
  { id: 21, name: 'Revenue recognition (ASC 606)',        owner: 'A.6',                      phase: 3, cls: 'legitimate' },
  { id: 22, name: 'Lease accounting (IFRS 16)',           owner: 'A.7',                      phase: 3, cls: 'legitimate' },
  { id: 23, name: 'Tax provision',                        owner: 'A.7',                      phase: 3, cls: 'legitimate' },
  { id: 24, name: 'Statutory reporting / XBRL',           owner: '§14.5',                    phase: 3, cls: 'legitimate-boundary' },
  { id: 25, name: 'Audit evidence / PBC fulfilment',      owner: 'F-WORKFLOW-007, A.15',     phase: 2, cls: 'hard' },
  { id: 26, name: 'SOX / ICFR controls testing',          owner: 'A.15',                     phase: 3, cls: 'legitimate' },
  { id: 27, name: 'Narrative / MD&A authoring',           owner: 'F-REPORT-013',             phase: 2, cls: 'hard' },
  { id: 28, name: 'Data prep / mapping / cleansing',      owner: 'F-INTEGRATE-000, §8.3',    phase: 2, cls: 'hard' },
  { id: 29, name: 'Distributing reports to stakeholders', owner: 'F-REPORT-007',             phase: 2, cls: 'hard' },
  { id: 30, name: 'Model documentation / handover',       owner: 'F-REPORT-014',             phase: 3, cls: 'soft' },
];

const VALID_STATUS = new Set(['built', 'partial', 'not-started', 'legitimate']);
const TARGETS = { p1: 40, p2: 20, ga: 5 };

function main() {
  const args = process.argv.slice(2);
  const phaseArg = args.indexOf('--phase');
  const phase = phaseArg >= 0 ? args[phaseArg + 1] : null;

  let ledger;
  try {
    ledger = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
  } catch (err) {
    console.error(`✗ escape-ledger.json unreadable (${err.message}).`);
    console.error('  The §24 scoreboard cannot be computed without it.');
    process.exit(1);
  }

  const statusById = new Map();
  for (const row of ledger.rows ?? []) {
    if (!ROWSSPEC_IDS().has(row.id)) {
      console.error(`✗ ledger row ${row.id} is not part of the §24.2 canon.`);
      process.exit(1);
    }
    if (!VALID_STATUS.has(row.status)) {
      console.error(
        `✗ ledger row ${row.id}: invalid status "${row.status}" (built|partial|not-started|legitimate).`
      );
      process.exit(1);
    }
    statusById.set(row.id, row);
  }

  let hard = 0;
  let soft = 0;
  let coreHardOffenders = [];
  const problems = [];
  for (const spec of ROWS) {
    const s = statusById.get(spec.id);
    if (!s) {
      problems.push(`row ${spec.id} ("${spec.name}") missing from ledger`);
      continue;
    }
    const escaped =
      s.status === 'partial' || s.status === 'not-started'
        ? spec.cls === 'legitimate' || spec.cls === 'legitimate-boundary'
          ? null // governed boundary candidates handled below
          : spec.cls
        : null;
    if (escaped === 'hard') {
      hard += 1;
      if (spec.id <= 20) coreHardOffenders.push(`${spec.id} ${spec.name}`);
    }
    if (escaped === 'soft') soft += 1;
    if (s.status === 'legitimate') {
      if (spec.cls !== 'legitimate' && spec.cls !== 'legitimate-boundary') {
        problems.push(
          `row ${spec.id}: status "legitimate" but §24.2 class is ${spec.cls.toUpperCase()} — ` +
            'reclassification requires a Blueprint amendment (§22.6 honesty clause).'
        );
      }
      if (!s.reason || !s.handoff) {
        problems.push(`row ${spec.id}: legitimate boundary needs reason + handoff (§24.4).`);
      }
    }
    if (!s.evidence) {
      problems.push(`row ${spec.id}: missing evidence pointer (route/engine/test that proves status).`);
    }
  }
  if (problems.length > 0) {
    console.error('✗ Escape ledger integrity failures:');
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }

  const total = ROWS.length;
  const rate = ((hard + soft) / total) * 100;
  console.log('═══ §24.2 ESCAPE LEDGER ═══');
  console.log(`rows=${total}  built=${ROWS.length - hard - soft - countLegit(statusById)}  hardEscapes=${hard}  softEscapes=${soft}`);
  console.log(`escape rate = ${rate.toFixed(1)}%  (Core-20 hard offenders: ${coreHardOffenders.length})`);
  if (coreHardOffenders.length > 0) {
    for (const o of coreHardOffenders) console.log(`  CORE-HARD: ${o}`);
  }

  if (phase) {
    const targetPct = TARGETS[phase];
    if (targetPct === undefined) {
      console.error(`✗ unknown --phase "${phase}" (p1|p2|ga).`);
      process.exit(1);
    }
    const failures = [];
    if (rate > targetPct) failures.push(`escape rate ${rate.toFixed(1)}% > ${targetPct}%`);
    if (phase === 'ga' && coreHardOffenders.length > 0) {
      failures.push(`GA requires ZERO Core-20 hard escapes (${coreHardOffenders.length} present)`);
    }
    if (failures.length > 0) {
      console.error(`✗ §24 phase-${phase} gate FAILED:`);
      for (const f of failures) console.error(`  - ${f}`);
      process.exit(1);
    }
    console.log(`✓ §24 phase-${phase} gate satisfied (rate ≤ ${targetPct}%${phase === 'ga' ? ', zero Core-20 hard escapes' : ''}).`);
  } else {
    console.log('(advisory mode — pass --phase p1|p2|ga to enforce a target)');
  }
}

function countLegit(statusById) {
  let n = 0;
  for (const spec of ROWS) {
    const s = statusById.get(spec.id);
    if (s && s.status === 'legitimate') n += 1;
  }
  return n;
}

function ROWSSPEC_IDS() {
  return new Set(ROWS.map((r) => r.id));
}

main();
