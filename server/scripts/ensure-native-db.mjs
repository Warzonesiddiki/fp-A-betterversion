#!/usr/bin/env node
/**
 * Ensure the better-sqlite3 NATIVE binding is present before the test suites run.
 *
 * WHY THIS EXISTS
 * ---------------
 * `server/.npmrc` sets `ignore-scripts=true` as a deliberate supply-chain
 * posture: no third-party package may execute an install script on `npm ci`.
 * That flag is global, so it also suppresses better-sqlite3's own
 * `prebuild-install || node-gyp rebuild` step — the package installs with **no
 * compiled binding at all**.
 *
 * The consequence was a silently red server suite: `src/db/bootSchema.test.ts`
 * and `src/db/schemaReconciliation.test.ts` exercise real SQLite semantics
 * (PRAGMA / ALTER TABLE / legacy-table rebuild) and cannot run against the
 * in-memory mock fallback in `src/db/connection.ts`. On a clean checkout they
 * failed with "Could not locate the bindings file" — 9 failing tests.
 *
 * Note that `ignore-scripts=true` ALSO disables npm lifecycle hooks such as
 * `pretest`, so this bootstrap cannot be a `pretest` script: it is invoked
 * explicitly from the `test` / `test:native-db` scripts in package.json.
 *
 * WHAT IT DOES
 * ------------
 * 1. No-op fast path when the binding already loads (idempotent, ~30ms).
 * 2. Otherwise rebuilds ONLY better-sqlite3, re-enabling scripts for that one
 *    vetted package via `npm_config_ignore_scripts=false`.
 * 3. Points node-gyp at the locally installed Node headers
 *    (`npm_config_nodedir`, derived from `process.execPath`) so the build works
 *    OFFLINE — without it node-gyp tries to download headers from nodejs.org
 *    and fails in network-restricted CI runners and sandboxes.
 *
 * If the rebuild genuinely cannot succeed (e.g. no C++ toolchain), this exits
 * non-zero with an actionable message rather than letting the suite fail later
 * with an opaque bindings error.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const PACKAGE = 'better-sqlite3';

/** Returns true when the native binding loads and can open a database. */
function bindingWorks() {
  try {
    const Database = require(PACKAGE);
    const probe = new Database(':memory:');
    probe.exec('CREATE TABLE __probe__ (id INTEGER PRIMARY KEY)');
    probe.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Directory holding this Node runtime's C++ headers, when they ship alongside
 * the binary (the usual case for official images: <prefix>/include/node/node.h).
 * Returning it lets node-gyp build without any network access.
 */
function localNodeDir() {
  const prefix = path.dirname(path.dirname(process.execPath));
  return fs.existsSync(path.join(prefix, 'include', 'node', 'node.h')) ? prefix : null;
}

if (bindingWorks()) {
  process.exit(0);
}

console.warn(`[ensure-native-db] ${PACKAGE} native binding missing — rebuilding it now.`);

const nodedir = localNodeDir();
if (nodedir) {
  console.warn(`[ensure-native-db] Using local Node headers (${nodedir}) — offline build.`);
} else {
  console.warn('[ensure-native-db] No local Node headers found; node-gyp may need network access.');
}

const result = spawnSync('npm', ['rebuild', PACKAGE], {
  cwd: path.resolve(import.meta.dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    // Re-enable scripts for this single, vetted package only. The repo-wide
    // `ignore-scripts=true` in server/.npmrc stays in force for everything else.
    npm_config_ignore_scripts: 'false',
    ...(nodedir ? { npm_config_nodedir: nodedir } : {}),
  },
});

// `npm rebuild` can report success while silently skipping the compile step,
// so trust the binding probe rather than the exit code.
if (!bindingWorks()) {
  console.error(
    `\n[ensure-native-db] FAILED to build the ${PACKAGE} native binding` +
      (result.error ? ` (${result.error.message})` : '') +
      '.\n' +
      'The real-SQLite suites (db/bootSchema, db/schemaReconciliation) cannot run without it.\n' +
      'Ensure a C++ toolchain (build-essential/python3) and Node headers are available, then retry:\n' +
      `  npm_config_ignore_scripts=false npm rebuild ${PACKAGE}\n`
  );
  process.exit(1);
}

console.warn('[ensure-native-db] Native binding built successfully.');
