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
 * WHAT IT DOES (hardened for Node >=22 ABI 137+ and the npm allowScripts policy)
 * ------------
 * 0. Fails fast and loudly on known-incompatible combinations: better-sqlite3
 *    11.x cannot compile against Node >= 22's V8 API (`GetPrototype`,
 *    `GetIsolate`, `PropertyCallbackInfo::This` were removed). If 11.x is
 *    pinned on a modern runtime we exit non-zero with an upgrade instruction
 *    instead of letting node-gyp produce an opaque C2039 wall.
 * 1. No-op fast path when the binding already loads (idempotent, ~30ms).
 * 2. Otherwise tries `prebuild-install` FIRST — better-sqlite3@13 ships
 *    prebuilt binaries for current Node ABIs, which needs no compiler at all.
 * 3. Falls back to `npm rebuild`, re-enabling scripts for that one vetted
 *    package via `npm_config_ignore_scripts=false`. NOTE: newer npm versions
 *    additionally enforce an allowScripts policy that blocks install scripts
 *    EVEN THEN, while still exiting 0 — a silent false-success. We never trust
 *    npm's exit code; the binding probe is the only source of truth, and any
 *    failure prints remediation steps (K2/K14: fail loudly, no silent green).
 * 4. Points node-gyp at the locally installed Node headers
 *    (`npm_config_nodedir`, derived from `process.execPath`) so the build works
 *    OFFLINE — without it node-gyp tries to download headers from nodejs.org
 *    and fails in network-restricted CI runners and sandboxes.
 */

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const PACKAGE = 'better-sqlite3';
const SERVER_ROOT = path.resolve(import.meta.dirname, '..');

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

function installedPackageVersion() {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(
        path.join(SERVER_ROOT, 'node_modules', PACKAGE, 'package.json'),
        'utf8',
      ),
    );
    return pkg.version ?? null;
  } catch {
    return null;
  }
}

/**
 * Known source-incompatibility: better-sqlite3 11.x targets the V8 API of
 * Node <= 23-era headers; on Node >= 22 runtimes with newer V8 (and always on
 * ABI >= 137) node-gyp fails with C2039 'GetPrototype'/'GetIsolate'/'This'.
 * Fail loudly up front rather than emitting a confusing compiler dump (K14).
 */
function checkKnownIncompatibility() {
  if (bindingWorks()) return;
  const version = installedPackageVersion();
  const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  if (
    version !== null &&
    version.startsWith('11.') &&
    major >= 22
  ) {
    console.error(
      `\n[ensure-native-db] INCOMPATIBLE COMBINATION DETECTED\n` +
        `${PACKAGE}@${version} is pinned but cannot build on Node v${process.versions.node} ` +
        `(ABI ${process.versions.modules}): its sources use V8 APIs removed after Node 21.\n` +
        `Remediation:\n` +
        `  cd server && npm install ${PACKAGE}@^13.0.0   # ships prebuilt binaries for current ABIs\n` +
        `then re-run this bootstrap.\n`,
    );
    process.exit(1);
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

/**
 * Attempt to fetch/install the official prebuilt binary for this exact
 * Node ABI. This is the cheapest correct path on modern runtimes and avoids
 * both the C++ toolchain requirement and the allowScripts policy entirely
 * (prebuild-install is invoked directly, not as an npm lifecycle hook).
 */
function tryPrebuiltInstall() {
  console.warn(`[ensure-native-db] Trying prebuilt binary (${PACKAGE}@13+ ships them for current Node ABIs)...`);
  const result = spawnSync('npx', ['--yes', 'prebuild-install', '--verbose'], {
    cwd: path.join(SERVER_ROOT, 'node_modules', PACKAGE),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    console.warn('[ensure-native-db] No prebuilt binary available; falling back to source build.');
    return false;
  }
  return bindingWorks();
}

/**
 * Source-build fallback. Returns true only when the binding actually loads
 * afterwards — npm may exit 0 while silently skipping the compile under the
 * allowScripts policy, so the probe is the sole source of truth.
 */
function tryNpmRebuild() {
  console.warn(`[ensure-native-db] Rebuilding ${PACKAGE} from source...`);
  const nodedir = localNodeDir();
  if (nodedir) {
    console.warn(`[ensure-native-db] Using local Node headers (${nodedir}) — offline build.`);
  } else {
    console.warn('[ensure-native-db] No local Node headers found; node-gyp may need network access.');
  }

  spawnSync('npm', ['rebuild', PACKAGE], {
    cwd: SERVER_ROOT,
    stdio: 'inherit',
    // 'npm' is npm.cmd on Windows — spawnSync needs a shell to resolve it.
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      // Re-enable scripts for this single, vetted package only. The repo-wide
      // `ignore-scripts=true` in server/.npmrc stays in force for everything else.
      npm_config_ignore_scripts: 'false',
      ...(nodedir ? { npm_config_nodedir: nodedir } : {}),
    },
  });
  return bindingWorks();
}

/**
 * Last-resort recovery: better-sqlite3@13+ bundles its platform prebuilts
 * INSIDE the published tarball (`prebuilds/<platform>.node`, loaded via
 * node-gyp-build — no lifecycle script involved). A forced reinstall of just
 * this one vetted package restores them even when the allowScripts policy
 * blocks every install script. No compile toolchain required.
 */
function tryForcedReinstall() {
  const version = installedPackageVersion() ?? 'latest';
  console.warn(`[ensure-native-db] Falling back to forced reinstall of ${PACKAGE}@${version} (restores bundled prebuilds)...`);
  // npm considers an existing (even corrupted) install "up to date" and will
  // NOT re-extract unless the package directory is removed first.
  fs.rmSync(path.join(SERVER_ROOT, 'node_modules', PACKAGE), { recursive: true, force: true });
  spawnSync('npm', ['install', '--force', '--ignore-scripts', `${PACKAGE}@${version}`], {
    cwd: SERVER_ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  return bindingWorks();
}

checkKnownIncompatibility();

if (bindingWorks()) {
  process.exit(0);
}

console.warn(`[ensure-native-db] ${PACKAGE} native binding missing or stale (Node ABI ${process.versions.modules}).`);

if (tryPrebuiltInstall()) {
  console.warn('[ensure-native-db] Prebuilt native binding installed successfully.');
  process.exit(0);
}

if (tryNpmRebuild()) {
  console.warn('[ensure-native-db] Native binding built successfully.');
  process.exit(0);
}

if (tryForcedReinstall()) {
  console.warn('[ensure-native-db] Native binding restored via forced reinstall (bundled prebuilds).');
  process.exit(0);
}

console.error(
  `\n[ensure-native-db] FAILED to provision the ${PACKAGE} native binding.\n` +
    `The real-SQLite suites (db/bootSchema, db/schemaReconciliation, db/tenancy.test,\n` +
    `routes/gl.tenancy.test) cannot run without it.\n\n` +
    `Likely causes and remediation:\n` +
    `1. npm's allowScripts policy blocked the install script even with ignore-scripts=false\n` +
    `   (npm exits 0 while skipping the compile — a silent false-success).\n` +
    `   Review and approve it:\n` +
    `     npm install-scripts ls\n` +
    `   or build by hand from the package directory:\n` +
    `     cd server/node_modules/${PACKAGE}\n` +
    `     npx --yes prebuild-install || npx --yes node-gyp rebuild --release\n` +
    `2. No prebuilt binary exists for Node v${process.versions.node} (ABI ${process.versions.modules})\n` +
    `   and no C++ toolchain / Node headers are installed.\n` +
    `3. ${PACKAGE} 11.x is pinned on Node >= 22 — upgrade instead:\n` +
    `     cd server && npm install ${PACKAGE}@^13.0.0\n`,
);
process.exit(1);
