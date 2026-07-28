#!/usr/bin/env node
/**
 * F-0020 / F-0033: release version consistency gate.
 * Fails (exit 1) if the release version differs across:
 *   package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml,
 *   and the VERSION constant reported by src-tauri/src/lib.rs.
 * Also fails if the Tauri updater is active while pointing at an endpoint
 * that is not controlled/reachable (F-0020) — i.e., if updater.active is
 * true, endpoints must exist and must not be the retired placeholder domain
 * unless UPDATER_PLACEHOLDER_ACK is set for a deliberate staging build.
 */
import { readFileSync } from 'node:fs';

const FAILURES = [];
const read = (p) => readFileSync(p, 'utf8');

// 1. package.json
const pkg = JSON.parse(read('package.json'));
const pkgVersion = pkg.version;

// 2. tauri.conf.json
const tauriConf = JSON.parse(read('src-tauri/tauri.conf.json'));
const tauriVersion = tauriConf.version;

// 3. Cargo.toml ([package] version)
const cargo = read('src-tauri/Cargo.toml');
const cargoMatch = cargo.match(/\[package\][\s\S]*?version\s*=\s*"([^"]+)"/);
const cargoVersion = cargoMatch?.[1];

// 4. lib.rs version reported by the app_info command. Preferred form is
// env!("CARGO_PKG_VERSION") (compile-time derivation from Cargo.toml, i.e.,
// consistent by construction); a hardcoded literal is checked against the
// canonical version.
const libRs = read('src-tauri/src/lib.rs');
const libEnvMatch = libRs.match(
  /"name":\s*"FinPlan Pro",\s*"version":\s*env!\("CARGO_PKG_VERSION"\)/
);
const libLitMatch = libRs.match(/"name":\s*"FinPlan Pro",\s*"version":\s*"([^"]+)"/);
const libVersion = libEnvMatch ? cargoVersion : libLitMatch?.[1];

const versions = {
  'package.json': pkgVersion,
  'tauri.conf.json': tauriVersion,
  'Cargo.toml': cargoVersion,
  'lib.rs': libVersion,
};

const canonical = pkgVersion;
for (const [source, version] of Object.entries(versions)) {
  if (version !== canonical) {
    FAILURES.push(
      `version skew: ${source} reports ${version ?? 'NOT FOUND'}, expected ${canonical}`
    );
  }
}

// 5. Updater policy (F-0020)
const updater = tauriConf.updater;
if (updater?.active === true) {
  const endpoints = Array.isArray(updater.endpoints) ? updater.endpoints : [];
  if (endpoints.length === 0) {
    FAILURES.push('updater.active is true but no endpoints are configured');
  }
  for (const endpoint of endpoints) {
    if (endpoint.includes('updates.finplanpro.com') && !process.env.UPDATER_PLACEHOLDER_ACK) {
      FAILURES.push(
        `updater endpoint ${endpoint} has not been verified as controlled infrastructure. ` +
          'Disable the updater (active: false) or set UPDATER_PLACEHOLDER_ACK=1 for a deliberate staging build.'
      );
    }
  }
}

if (FAILURES.length > 0) {
  console.error('✗ version-consistency check failed:');
  for (const f of FAILURES) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✓ version consistency OK (${canonical}) across package.json, tauri.conf.json, Cargo.toml, lib.rs`
);
if (tauriConf.updater?.active !== true) {
  console.log('✓ updater is disabled (no uncontrolled update endpoint)');
}
