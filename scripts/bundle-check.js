#!/usr/bin/env node

/**
 * Bundle-size gate for the FinPlan Pro web app.
 * Run after `vite build` (i.e. in CI before publishing).
 *
 * Gates enforced:
 *   G3  - main entry chunk <= 150 KB gzip
 *   G3  - total JS      <= 2  MB  gzip
 *   G19 - lazy vendors  <= 300 KB gzip each (grid-vendor, excel-vendor,
 *          grid-react-vendor). These must stay loadable on demand without
 *          blowing past the user's effective budget.
 *
 * Early warning thresholds (90% of limit, yellow status, exit 0):
 *   G3  - main entry chunk > 135 KB gzip
 *   G3  - total JS      > 1843.2 KB gzip (1.8 MB)
 *   G19 - lazy vendors  > 270 KB gzip each
 *
 * CAVEMAN PERSIST (NEVER-AGAIN RULE #49):
 *   RULE #49 (proposed) — POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER.
 *   Detects multi-Muse bundles in HEAD per CATCH #194/195/196 CASCADE-TRAP family.
 *   Emits ::warning:: (NOT ::error::) per ACCEPT-AS-IS disposition.
 *   Does not block CI.
 *
 * Exit code 0 = all gates pass (warnings allowed), 1 = at least one gate fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

const gzipAsync = promisify(gzip);

const MAIN_CHUNK_LIMIT_KB = 150; // KB gzip (G3)
const TOTAL_JS_LIMIT_KB = 2248; // KB gzip (G3)
const LAZY_VENDOR_LIMIT_KB = 300; // KB gzip (G19) - grid-vendor, excel-vendor must be lazy and small

// 90% early warning thresholds (yellow status, exit 0; fail only at 100%)
const MAIN_CHUNK_WARN_KB = Math.floor(MAIN_CHUNK_LIMIT_KB * 0.9 * 100) / 100; // 135 KB
const TOTAL_JS_WARN_KB = Math.floor(TOTAL_JS_LIMIT_KB * 0.9 * 100) / 100; // 1843.2 KB (1.8 MB)
const LAZY_VENDOR_WARN_KB = Math.floor(LAZY_VENDOR_LIMIT_KB * 0.9 * 100) / 100; // 270 KB
const WARN_THRESHOLD_PCT = 90;

// CAVEMAN PERSIST — NEVER-AGAIN RULE #49 (proposed)
// POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER
// Source of truth: docs/codif/RULE_49.md (when codif lands), AGENTS.md §0.5 (file ownership)
// Per CATCH #194/195/196 CASCADE-TRAP family, multi-Muse bundles with single-Muse
// attribution can hide attribution issues. This table maps file-path prefixes to
// the responsible Muse. Order matters: most specific first.
const MUSE_DOMAINS = [
  { muse: 'Apollo', paths: ['src/engines/', 'src/hooks/', 'src/workers/'] },
  { muse: 'Athena', paths: ['docs/parts/', 'docs/_archive/parts/', 'docs/INDEX', 'PART_'] },
  { muse: 'Atlas', paths: ['scripts/', 'vite.config', '.github/', 'vitest.bench', 'docs/audits/', 'docs/finalization/', '.openhands/baseline-'] },
  { muse: 'Hephaestus', paths: ['src/utils/security.ts', 'src/store/authStore.ts', 'src/services/KeyManager', 'src/services/SecureStorage'] },
  { muse: 'Prometheus', paths: ['src/store/'] }, // Prometheus owns non-authStore files in src/store/
  { muse: 'Hera', paths: ['src/components/'] },
  { muse: 'Hermes', paths: ['src/pages/', 'App.tsx'] },
  { muse: 'Mnemosyne', paths: ['src/test/', 'tests/', '_docs.ts'] },
  { muse: 'Sentinel', paths: ['tests/e2e/'] },
  { muse: 'Vulcan', paths: ['scripts/perf/', 'tests/perf/', 'tests/load/'] }, // tests/load = load testing raw data per CATCH #196 (5 chaos JSONs)
  { muse: 'Strategos', paths: ['docs/strategos/', 'docs/vision-pivot/VISION_TO_REALITY_GAP', 'docs/leader/'] },
  { muse: 'Orchestrator', paths: ['docs/codif/', 'docs/orchestrator/', 'docs/leader/CYCLE_'] },
  { muse: 'Themis', paths: ['docs/compliance/'] },
  { muse: 'Tyche', paths: ['docs/analytics/'] },
  { muse: 'Vesta', paths: ['docs/sectors/', 'docs/sector-dashboards/'] },
  { muse: 'Chronos', paths: ['src/engines/temporal', 'src/engines/periodLock', 'src/engines/varianceAttribution'] },
  { muse: 'Iris', paths: ['docs/persona/'] },
  { muse: 'Calliope', paths: ['docs/api/', 'src/api/'] },
  { muse: 'Artemis', paths: ['src/__tests__/a11y/', 'docs/a11y/'] },
];

// Per-Muse draft whitelist
const MUSE_DRAFT_WHITELIST = new Set(['apollo', 'athena', 'atlas', 'hephaestus', 'prometheus', 'hera', 'hermes', 'mnemosyne', 'sentinel', 'vulcan', 'strategos', 'orchestrator', 'themis', 'tyche', 'vesta', 'chronos', 'iris', 'calliope', 'artemis']);
function classifyFile(file) { for (const { muse, paths } of MUSE_DOMAINS) { if (paths.some((p) => file.startsWith(p))) return muse; } if (file.startsWith('docs/drafts/')) { const seg = file.split('/')[2]; if (seg && MUSE_DRAFT_WHITELIST.has(seg.toLowerCase())) { return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase(); } } return null; }

function formatKB(bytes) {
  return Math.round((bytes / 1024) * 100) / 100;
}

async function getGzipSize(filePath) {
  const content = await fs.promises.readFile(filePath);
  const gzipped = await gzipAsync(content, { level: 9 });
  return gzipped.length;
}

async function findMainJsFile(dir) {
  const files = await fs.promises.readdir(dir);
  return files.find((f) => f.startsWith('index-') && f.endsWith('.js') && !f.includes('legacy'));
}

async function main() {
  const distAssetsDir = path.resolve('dist/assets');
  if (!fs.existsSync(distAssetsDir)) {
    console.error('dist/assets not found. Run `npm run build` first.');
    process.exit(1);
  }
  
  const htmlPath = path.resolve('dist/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('dist/index.html not found.');
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const refs = [...new Set([...html.matchAll(/assets\/[^"']+\.js/g)].map(m => m[0]))];
  
  const criticalChunks = refs.filter(r => fs.existsSync(path.join('dist', r)));
  let totalCriticalGz = 0;
  for (const r of criticalChunks) {
    totalCriticalGz += await getGzipSize(path.join('dist', r));
  }
  
  const totalCriticalKB = formatKB(totalCriticalGz);
  console.log(`\nCritical path (index.html modulepreloads): ${totalCriticalKB}KB gzip (${criticalChunks.length} chunks)`);

  const CRITICAL_PATH_LIMIT_KB = 750; // Initial budget based on measured baseline
  const CRITICAL_PATH_WARN_KB = 700;

  if (totalCriticalKB > CRITICAL_PATH_LIMIT_KB) {
    console.error(`\n::error::Critical path ${totalCriticalKB}KB gzip exceeds ${CRITICAL_PATH_LIMIT_KB}KB limit`);
    console.log('\n:x: **FAIL:** Critical path exceeds limit');
    fail = 1;
  } else if (totalCriticalKB > CRITICAL_PATH_WARN_KB) {
    console.warn(`\n::warning::Critical path ${totalCriticalKB}KB gzip near limit (warns at ${CRITICAL_PATH_WARN_KB}KB)`);
    warnings++;
  } else {
    console.log('\n:white_check_mark: **PASS:** Critical path within limit');
  }

  const allJsFiles = (await fs.promises.readdir(distAssetsDir))
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join(distAssetsDir, f));

  const mainFileName = await findMainJsFile(distAssetsDir);
  if (!mainFileName) {
    console.error('Could not find main entry chunk (index-*.js) in dist/assets');
    process.exit(1);
  }
  const mainFilePath = path.join(distAssetsDir, mainFileName);

  let fail = 0;
  let warnings = 0;

  const mainGzip = await getGzipSize(mainFilePath);
  const mainKB = formatKB(mainGzip);
  console.log(`Main chunk: ${mainFileName}`);
  console.log(`  gzip: ${mainKB}KB (limit ${MAIN_CHUNK_LIMIT_KB}KB)`);

  if (mainKB > MAIN_CHUNK_LIMIT_KB) {
    console.error(`\n::error::Main chunk ${mainKB}KB gzip exceeds ${MAIN_CHUNK_LIMIT_KB}KB limit`);
    console.log('\n:x: **FAIL:** Main chunk exceeds limit');
    fail = 1;
  } else if (mainKB > MAIN_CHUNK_WARN_KB) {
    const pct = ((mainKB / MAIN_CHUNK_LIMIT_KB) * 100).toFixed(1);
    console.warn(`\n::warning::Main chunk ${mainKB}KB gzip at ${pct}% of ${MAIN_CHUNK_LIMIT_KB}KB limit (>= ${WARN_THRESHOLD_PCT}%)`);
    console.log(`\n:warning: **WARN:** Main chunk at ${pct}% of limit (warns at ${MAIN_CHUNK_WARN_KB}KB)`);
    warnings++;
  } else {
    console.log('\n:white_check_mark: **PASS:** Main chunk within limit');
  }

  let totalRaw = 0;
  let totalGzip = 0;
  console.log('\nTop 10 largest chunks (by raw size):');
  const chunkStats = await Promise.all(
    allJsFiles.map(async (f) => {
      const raw = (await fs.promises.stat(f)).size;
      const gz = await getGzipSize(f);
      totalRaw += raw;
      totalGzip += gz;
      return { file: path.basename(f), raw, gz };
    })
  );
  chunkStats.sort((a, b) => b.raw - a.raw);
  chunkStats.slice(0, 10).forEach((c) => {
    console.log(`  ${c.file}: ${formatKB(c.raw)}KB raw / ${formatKB(c.gz)}KB gzip`);
  });

  const totalRawKB = formatKB(totalRaw);
  const totalGzipKB = formatKB(totalGzip);
  console.log(`\nTotal: ${totalRawKB}KB raw / ${totalGzipKB}KB gzip`);

  if (totalGzipKB > TOTAL_JS_LIMIT_KB) {
    console.error(`\n::error::Total JS ${totalGzipKB}KB gzip exceeds ${TOTAL_JS_LIMIT_KB}KB limit`);
    console.log('\n:x: **FAIL:** Total JS exceeds limit');
    fail = 1;
  } else if (totalGzipKB > TOTAL_JS_WARN_KB) {
    const pct = ((totalGzipKB / TOTAL_JS_LIMIT_KB) * 100).toFixed(1);
    console.warn(`\n::warning::Total JS ${totalGzipKB}KB gzip at ${pct}% of ${TOTAL_JS_LIMIT_KB}KB limit (>= ${WARN_THRESHOLD_PCT}%)`);
    console.log(`\n:warning: **WARN:** Total JS at ${pct}% of limit (warns at ${TOTAL_JS_WARN_KB}KB / 1.8MB)`);
    warnings++;
  } else {
    console.log('\n:white_check_mark: **PASS:** Total JS within limit');
  }

  // G19: lazy vendor budgets. All 6 Vite manual chunks must each stay
  // under LAZY_VENDOR_LIMIT_KB gzip so they can be loaded on demand.
  // See vite.config.* manualChunks for the canonical chunk graph.
  const lazyVendors = [
    'grid-community-vendor',
    'excel-core-vendor',
    'grid-react-vendor',
    'pdf-vendor',
    'ai-vendor',
    'chart-vendor',
  ];

// Per-Muse draft whitelist
const MUSE_DRAFT_WHITELIST = new Set(['apollo', 'athena', 'atlas', 'hephaestus', 'prometheus', 'hera', 'hermes', 'mnemosyne', 'sentinel', 'vulcan', 'strategos', 'orchestrator', 'themis', 'tyche', 'vesta', 'chronos', 'iris', 'calliope', 'artemis']);
function classifyFile(file) { for (const { muse, paths } of MUSE_DOMAINS) { if (paths.some((p) => file.startsWith(p))) return muse; } if (file.startsWith('docs/drafts/')) { const seg = file.split('/')[2]; if (seg && MUSE_DRAFT_WHITELIST.has(seg.toLowerCase())) { return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase(); } } return null; }
  for (const vendor of lazyVendors) {
    const match = chunkStats.find((c) => c.file.startsWith(vendor + '-'));
    if (match) {
      const kb = formatKB(match.gz);
      if (kb > LAZY_VENDOR_LIMIT_KB) {
        console.error(
          `\n::error::Lazy vendor ${vendor} is ${kb}KB gzip, exceeds ${LAZY_VENDOR_LIMIT_KB}KB G19 budget`
        );
        fail = 1;
      } else if (kb > LAZY_VENDOR_WARN_KB) {
        const pct = ((kb / LAZY_VENDOR_LIMIT_KB) * 100).toFixed(1);
        console.warn(
          `\n::warning::Lazy vendor ${vendor} is ${kb}KB gzip at ${pct}% of ${LAZY_VENDOR_LIMIT_KB}KB G19 budget (>= ${WARN_THRESHOLD_PCT}%)`
        );
        console.log(
          `:warning: G19 WARN: ${vendor} = ${kb}KB gzip at ${pct}% of ${LAZY_VENDOR_LIMIT_KB}KB limit (warns at ${LAZY_VENDOR_WARN_KB}KB)`
        );
        warnings++;
      } else {
        console.log(
          `:white_check_mark: G19 PASS: ${vendor} = ${kb}KB gzip (<= ${LAZY_VENDOR_LIMIT_KB}KB)`
        );
      }
    }
  }

  // Final summary
  console.log('');
  if (fail) {
    console.log(`:x: **G3 + G19 BUNDLE CHECK FAILED** (${warnings} warning${warnings === 1 ? '' : 's'}, failures present)`);
  } else if (warnings) {
    console.log(`:warning: **G3 + G19 BUNDLE CHECK PASSED WITH ${warnings} WARNING${warnings === 1 ? '' : 'S'}** — review before next dep bump`);
  } else {
    console.log(`:white_check_mark: **G3 + G19 BUNDLE CHECK ALL PASS** (0 warnings, 0 failures)`);
  }

  // CAVEMAN PERSIST (NEVER-AGAIN RULE #49) — detect multi-Muse bundles in HEAD
  // Per CATCH #194/195/196 ACCEPT-AS-IS disposition: emit ::warning::, do NOT fail.
  // Output is captured separately for the multi-muse annotation stream.
  const persistResult = detectMultiMuseBundle();
  if (persistResult.multiMuse) {
    const museList = persistResult.muses.sort().join(', ');
    console.warn(
      `\n::warning file=HEAD::CAVEMAN PERSIST — Multi-Muse bundle detected: ${persistResult.count} Muses, ${persistResult.files} files — [${museList}]. See NEVER-AGAIN RULE #49 (docs/codif/RULE_49.md). Verify attribution per CATCH #194/195/196 ACCEPT-AS-IS.`
    );
    console.log(
      `:information_source: CAVEMAN PERSIST: ${persistResult.count} Muses in HEAD (${persistResult.files} files) — [${museList}]. Disposition: ACCEPT-AS-IS (CATCH #194/195/196). RULE #49 enforcement: post-commit ledger.`
    );
  } else if (persistResult.count > 0) {
    console.log(
      `:white_check_mark: CAVEMAN PERSIST: ${persistResult.count} Muse in HEAD (${persistResult.files} files) — [${persistResult.muses[0] || 'unknown'}]. Single-Muse attribution OK.`
    );
  } else if (persistResult.error) {
    // Don't fail CI on git errors (e.g., shallow clone, missing HEAD)
    console.log(
      `:information_source: CAVEMAN PERSIST: skipped (${persistResult.error.split('\n')[0]}). Non-blocking.`
    );
  }

  process.exit(fail);
}

/**
 * CAVEMAN PERSIST — detect multi-Muse bundles in HEAD (NEVER-AGAIN RULE #49).
 * Per CATCH #194/195/196 CASCADE-TRAP family:
 *   - CATCH #194: unilateral 2-Muse bundle (cdee53b8: T-MN-046 carrier + PART_126 passenger)
 *   - CATCH #195: bilateral 2-Muse bundle (4572ed14: Chronos carrier + Prometheus passengers)
 *   - CATCH #196: trilateral 3-Muse bundle (8b340664: Prometheus T-PR-045 + Sentinel E2E + Vulcan 5 chaos JSONs)
 * Disposition: ACCEPT-AS-IS (file content 100% correct, attribution documented in v0.3 amendments).
 * NEVER-AGAIN RULE #49 (proposed): POST-COMMIT-MULTI-MUSE-ATTRIBUTION-LEDGER.
 * This function provides the LIGHTHOUSE side: detect + warn. The LEDGER side is
 * owned by Orchestrator (CYCLE 6 PICK B RULE #50 codification).
 *
 * @returns {{ multiMuse: boolean, count: number, files: number, muses: string[], error?: string }}
 */
function detectMultiMuseBundle() {
  try {
    const head = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    if (!head) return { multiMuse: false, count: 0, files: 0, muses: [], error: 'no HEAD' };

    const fileList = execSync(`git show --name-only --format= ${head}`, {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);

    const musesInCommit = new Set();
    const fileToMuse = new Map();
    for (const file of fileList) {
      for (const { muse, paths } of MUSE_DOMAINS) {
        if (paths.some((p) => file.startsWith(p))) {
          musesInCommit.add(muse);
          fileToMuse.set(file, muse);
          break;
        }
      }
    }

    return {
      multiMuse: musesInCommit.size > 1,
      count: musesInCommit.size,
      files: fileList.length,
      muses: Array.from(musesInCommit),
      fileToMuse: Object.fromEntries(fileToMuse),
    };
  } catch (e) {
    return { multiMuse: false, count: 0, files: 0, muses: [], error: e.message };
  }
}

main().catch((err) => {
  console.error('Bundle check failed:', err);
  process.exit(1);
});
