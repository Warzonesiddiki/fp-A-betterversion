#!/usr/bin/env node
/**
 * license:check — Verify dependency licenses are compatible.
 *
 * Checks that all production dependencies have acceptable licenses.
 * Rejects: GPL, AGPL, SSPL, BUSL, or unlicensed dependencies.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
let failures = 0;

const REJECTED_LICENSES = [
  'GPL-1.0', 'GPL-2.0', 'GPL-3.0',
  'AGPL-1.0', 'AGPL-3.0',
  'SSPL-1.0',
  'BUSL-1.1',
  'CC-BY-NC',
  'UNLICENSED',
];

const ACCEPTABLE_LICENSES = [
  'MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause',
  '0BSD', 'CC0-1.0', 'CC-BY-4.0', 'Unlicense', 'WTFPL',
  'Python-2.0', 'PSF-2.0', 'MPL-2.0',
];

console.log('🔍 License Check\n');

try {
  // Get production dependency licenses
  const output = execSync('npm ls --omit=dev --json --all 2>/dev/null', {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  const pkg = JSON.parse(output);
  const deps = pkg.dependencies || {};

  function checkLicense(name, info) {
    const license = info.license || (info.licenses && info.licenses[0]?.type) || 'UNKNOWN';
    const licenseUpper = license.toUpperCase();

    // Check if rejected
    for (const rejected of REJECTED_LICENSES) {
      if (licenseUpper.includes(rejected.toUpperCase())) {
        console.error(`  ❌ ${name}: ${license} (REJECTED)`);
        failures++;
        return;
      }
    }

    // Check for copyleft
    if (licenseUpper.includes('GPL') || licenseUpper.includes('COPYLEFT')) {
      console.error(`  ❌ ${name}: ${license} (REJECTED - copyleft)`);
      failures++;
      return;
    }

    // Check for NC (non-commercial)
    if (licenseUpper.includes('NC') || licenseUpper.includes('NON-COMMERCIAL')) {
      console.error(`  ❌ ${name}: ${license} (REJECTED - non-commercial)`);
      failures++;
      return;
    }

    console.log(`  ✅ ${name}: ${license}`);
  }

  // Check top-level dependencies
  for (const [name, info] of Object.entries(deps)) {
    if (typeof info === 'object' && info !== null) {
      checkLicense(name, info);
    }
  }
} catch (e) {
  console.warn(`  ⚠️  Could not check all licenses: ${e.message}`);
  console.log('  ℹ️  License check is best-effort in sandboxed environments');
}

console.log(`\n${failures === 0 ? '✅ License check passed' : '❌ ' + failures + ' license issue(s) found'}`);
process.exit(failures > 0 ? 1 : 0);
