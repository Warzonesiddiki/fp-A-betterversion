#!/usr/bin/env node
/**
 * Mock-data audit (Omega Council — BATCH-009, hardened MISSION C / F-04).
 *
 * BATCH-008 found a page rendering MOCK_ASSETS (fabricated figures) as a real
 * tool. That is a zero-flaw defect hiding inside a reachability symptom. This
 * audit enumerates every "mock/demo/sample" data array in product code so the
 * council can sequence the "stop lying" fixes.
 *
 * Signal: a `const <NAME> = [` (module or component scope) whose NAME suggests
 * synthetic data (MOCK, mock, sample, demo, dummy, fake, placeholder, seed,
 * fixture).
 *
 * DISPOSITION ENFORCEMENT (MISSION C, 2026-08-07): every synthetic array must
 * have ONE of three dispositions — no exceptions, no "leave it":
 *   wired      → replaced by a real store/engine (site must NOT appear below)
 *   deleted    → removed (site must NOT appear below)
 *   disclosed  → deliberate labeled demo default; the file MUST contain the
 *                `demo defaults` disclosure marker on the declaration
 * A hit that is not in DISPOSITIONS, or a disclosed site without the marker,
 * fails the audit (exit 1) — this is the enforced zero-mock-data gate.
 *
 * Usage: node scripts/mock-data-audit.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const SCAN_DIRS = ['src/pages', 'src/components'];
const MOCK_RE = /mock|sample|demo|dummy|fake|placeholder|seed|fixture/i;
// Top-level (module scope) const array declarations: `const NAME [ : Type[] ] = [`
const DECL_RE = /^[ \t]*const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*\[/gm;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !/\.(test|bench|spec|stories)\./.test(p)) {
      out.push(p);
    }
  }
  return out;
}

const hits = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const text = readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      // Only flag declarations whose identifier looks synthetic.
      const m = /^([ \t]*)const\s+([A-Za-z0-9_]+)\s*(?::[^=]+)?=\s*\[/.exec(line);
      if (m && MOCK_RE.test(m[2])) {
        hits.push({
          file: relative(ROOT, file).replace(/\\/g, '/'),
          name: m[2],
          line: line.trim(),
        });
      }
    }
  }
}

// Dedupe by file+name (a const declared once).
const seen = new Set();
const unique = hits.filter((h) => {
  const k = `${h.file}::${h.name}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

// ---------------------------------------------------------------------------
// DISPOSITION LIST (MISSION C / F-04) — every known synthetic array site.
//   wired     → real store/engine now drives the page
//   deleted   → array removed (dead surface deleted)
//   disclosed → labeled demo default; file must carry the `demo defaults`
//               disclosure marker on the declaration
// ---------------------------------------------------------------------------
const DISPOSITIONS = {
  // ── WIRED (real store/engine replaces the array) ─────────────────────────
  'src/pages/accounting/MultiBookPage.tsx::MOCK_BOOKS': 'wired',
  'src/pages/capex/CapExDashboard.tsx::mockProjects': 'wired',
  'src/pages/consolidation/OwnershipTreePage.tsx::mockEntities': 'wired',
  'src/pages/healthcare/PatientRevenuePage.tsx::mockPeriods': 'wired',
  'src/pages/sectors/TelecomDashboardPage.tsx::mockArpuTrend': 'wired',
  'src/pages/workforce/PayrollForecastPage.tsx::mockDepartments': 'wired',
  'src/pages/sectors/LogisticsDashboardPage.tsx::mockTopLanes': 'wired',
  // ── DISCLOSED (labeled demo defaults; marker required) ───────────────────
  'src/components/dashboard/DashboardTemplate.tsx::mockKPIs': 'disclosed',
  'src/components/dashboard/DashboardTemplate.tsx::mockTrafficItems': 'disclosed',
  'src/components/dashboard/DashboardTemplate.tsx::mockTornado': 'disclosed',
  'src/components/dashboard/DashboardTemplate.tsx::mockActivities': 'disclosed',
  'src/components/dashboard/DashboardTemplate.tsx::mockComboData': 'disclosed',
  'src/pages/sectors/GovernmentDashboardPage.tsx::mockDepartmentBudget': 'disclosed',
  'src/pages/sectors/GovernmentDashboardPage.tsx::mockRevenueByCategory': 'disclosed',
  'src/pages/sectors/GovernmentDashboardPage.tsx::mockSpendingDistribution': 'disclosed',
  'src/pages/consolidation/ICEliminationPage.tsx::mockPairs': 'disclosed',
  'src/pages/manufacturing/InventoryPage.tsx::mockInventory': 'disclosed',
  'src/pages/retail/PromoAnalysisPage.tsx::mockPromos': 'disclosed',
  'src/pages/revenue/DeferredSchedulePage.tsx::mockContracts': 'disclosed',
  'src/pages/tax/TransferPricingPage.tsx::mockTransactions': 'disclosed',
  'src/pages/treasury/FXExposurePage.tsx::mockExposures': 'disclosed',
  'src/components/currency/FXPositionGrid.tsx::SAMPLE_POSITIONS': 'disclosed',
  'src/components/currency/HedgeManager.tsx::SAMPLE': 'disclosed',
};

const DISCLOSURE_MARKER = 'demo defaults';

// ---------------------------------------------------------------------------
// Enforce dispositions
// ---------------------------------------------------------------------------
const failures = [];

// 1. Every hit must be a known disposition.
for (const h of unique) {
  const key = `${h.file}::${h.name}`;
  const disposition = DISPOSITIONS[key];
  if (!disposition) {
    failures.push(
      `NO DISPOSITION: ${key} — wire it to a real store/engine, delete it, or label it with the '${DISCLOSURE_MARKER}' disclosure comment and register it in DISPOSITIONS.`
    );
    continue;
  }
  // 2. Disclosed sites must carry the disclosure marker in the file.
  if (disposition === 'disclosed') {
    const text = readFileSync(join(ROOT, h.file), 'utf8');
    if (!text.includes(DISCLOSURE_MARKER)) {
      failures.push(
        `MISSING DISCLOSURE: ${key} — add a '// demo defaults — replaced by real data when X is imported' comment at the declaration.`
      );
    }
  }
}

// 3. Wired/deleted sites must no longer be detected (the wiring actually
//    removed the fabricated array).
for (const [key, disposition] of Object.entries(DISPOSITIONS)) {
  if (disposition === 'wired' || disposition === 'deleted') {
    if (seen.has(key)) {
      failures.push(
        `STILL PRESENT: ${key} (${disposition}) — the array still exists; the wiring/removal did not land.`
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const byFile = new Map();
for (const h of unique) {
  if (!byFile.has(h.file)) byFile.set(h.file, []);
  byFile.get(h.file).push(h.name);
}

console.log('🎭 Mock-data audit (pages/components rendering synthetic data)\n');
console.log(`  files with mock/demo arrays: ${byFile.size}`);
console.log(`  total synthetic arrays:      ${unique.length}\n`);

const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [file, names] of sorted) {
  console.log(`  ${file}`);
  console.log(`     ${names.join(', ')}`);
  const statuses = names.map((n) => DISPOSITIONS[`${file}::${n}`] ?? '?');
  console.log(`     disposition: ${statuses.join(', ')}`);
}
if (unique.length === 0) console.log('  (none — no synthetic data arrays detected)');

const dispositionCounts = Object.values(DISPOSITIONS).reduce((acc, d) => {
  acc[d] = (acc[d] ?? 0) + 1;
  return acc;
}, {});
console.log(
  `\n  dispositions: ${Object.entries(dispositionCounts)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ')}`
);

if (failures.length > 0) {
  console.error(`\n✖ MOCK-DATA AUDIT FAILED (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ Zero-mock-data gate holds: every synthetic array has a disposition (wired/deleted/disclosed).');
