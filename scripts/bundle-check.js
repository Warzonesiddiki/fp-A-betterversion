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
 * Exit code 0 = all gates pass (warnings allowed), 1 = at least one gate fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

const gzipAsync = promisify(gzip);

const MAIN_CHUNK_LIMIT_KB = 150; // KB gzip (G3)
const TOTAL_JS_LIMIT_KB = 2048; // KB gzip (G3)
const LAZY_VENDOR_LIMIT_KB = 300; // KB gzip (G19) - grid-vendor, excel-vendor must be lazy and small

// 90% early warning thresholds (yellow status, exit 0; fail only at 100%)
const MAIN_CHUNK_WARN_KB = Math.floor(MAIN_CHUNK_LIMIT_KB * 0.9 * 100) / 100; // 135 KB
const TOTAL_JS_WARN_KB = Math.floor(TOTAL_JS_LIMIT_KB * 0.9 * 100) / 100; // 1843.2 KB (1.8 MB)
const LAZY_VENDOR_WARN_KB = Math.floor(LAZY_VENDOR_LIMIT_KB * 0.9 * 100) / 100; // 270 KB
const WARN_THRESHOLD_PCT = 90;

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

  // G19: lazy vendor budgets. grid-vendor and excel-vendor must each stay
  // under LAZY_VENDOR_LIMIT_KB gzip so they can be loaded on demand.
  const lazyVendors = ['grid-community-vendor', 'excel-core-vendor', 'grid-react-vendor'];
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

  process.exit(fail);
}

main().catch((err) => {
  console.error('Bundle check failed:', err);
  process.exit(1);
});
