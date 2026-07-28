#!/usr/bin/env node
// =============================================================================
// CSP HASH CHECK
// =============================================================================
// index.html ships a strict `script-src` that whitelists the inline theme
// bootstrap by sha256 hash. That hash had silently drifted from the actual
// script, which means the bootstrap was blocked by CSP in any browser that
// enforces the meta policy (flash of wrong theme, and a console error).
//
// This script recomputes the hash of every inline <script> in index.html and
// fails if any of them is missing from the policy.
//
// Usage:
//   node scripts/csp-hash-check.js            # check index.html
//   node scripts/csp-hash-check.js dist/index.html
// =============================================================================

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const target = resolve(process.argv[2] ?? 'index.html');
const html = readFileSync(target, 'utf8');

// NB: the policy itself contains single quotes ('self', 'sha256-...'), so the
// attribute value must be matched with double quotes only.
const cspMatch = html.match(
  /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i
);

if (!cspMatch) {
  console.error(`FAIL: no Content-Security-Policy meta tag found in ${target}`);
  process.exit(1);
}

const csp = cspMatch[1];
const scriptSrc = csp
  .split(';')
  .map((d) => d.trim())
  .find((d) => d.startsWith('script-src'));

if (!scriptSrc) {
  console.error('FAIL: CSP has no script-src directive');
  process.exit(1);
}

// Inline scripts only — anything with a src= attribute is covered by 'self'.
const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
  (m) => m[1]
);

let failures = 0;

for (const [i, body] of inlineScripts.entries()) {
  const hash = `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
  if (scriptSrc.includes(hash)) {
    console.log(`PASS: inline script #${i + 1} allowed by '${hash}'`);
  } else {
    failures += 1;
    console.error(
      `FAIL: inline script #${i + 1} is NOT allowed by CSP.\n` +
        `      Add this to script-src in ${target}:\n` +
        `      '${hash}'`
    );
  }
}

if (!inlineScripts.length) {
  console.log('PASS: no inline scripts to hash');
}

if (csp.includes("script-src") && /script-src[^;]*'unsafe-inline'/.test(csp)) {
  failures += 1;
  console.error("FAIL: script-src contains 'unsafe-inline' — use hashes instead");
}

if (failures > 0) {
  console.error(`\nCSP HASH CHECK FAILED (${failures} problem(s))`);
  process.exit(1);
}

console.log('\nCSP HASH CHECK PASSED');
