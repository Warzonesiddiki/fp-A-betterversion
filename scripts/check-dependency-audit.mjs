#!/usr/bin/env node
/**
 * Production dependency audit gate (F-0021).
 *
 * Blocks on any HIGH/CRITICAL advisory in the PRODUCTION dependency tree unless
 * it is explicitly accepted in security/audit-allowlist.json with a reason, an
 * exposure assessment and an expiry date.
 *
 * The allowlist is not a mute button:
 *   - an expired acceptance FAILS the build,
 *   - an acceptance whose advisory no longer appears FAILS the build (delete the
 *     stale entry so the file keeps describing reality),
 *   - anything not listed FAILS the build.
 *
 * Exit 0 = production tree has no unaccepted HIGH/CRITICAL vulnerabilities.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const BLOCKING = new Set(['high', 'critical']);

function runAudit() {
  try {
    // `npm audit` exits non-zero when it finds anything; capture output regardless.
    const out = execFileSync('npm', ['audit', '--omit=dev', '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(out);
  } catch (error) {
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        /* fall through */
      }
    }
    console.error('Could not run `npm audit --omit=dev --json`.');
    console.error(error.stderr || error.message);
    process.exit(2);
  }
}

const allowlist = JSON.parse(readFileSync(join(ROOT, 'security', 'audit-allowlist.json'), 'utf8'));
const report = runAudit();
const today = new Date().toISOString().slice(0, 10);

const accepted = new Map();
for (const entry of allowlist.accepted) {
  accepted.set(entry.package, entry);
}

const failures = [];
const observedBlocking = new Map();

for (const [name, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  if (!BLOCKING.has(vuln.severity)) continue;
  observedBlocking.set(name, vuln);
}

// 1. Unaccepted blocking vulnerabilities.
for (const [name, vuln] of observedBlocking) {
  const entry = accepted.get(name);
  if (!entry) {
    const advisories = (vuln.via ?? [])
      .filter((v) => typeof v === 'object')
      .map((v) => `${v.title} (${v.url})`)
      .join('; ');
    failures.push(
      `${name} [${vuln.severity}] is not accepted in security/audit-allowlist.json. ${advisories}`
    );
    continue;
  }
  if (entry.expires_on < today) {
    failures.push(
      `${name}: risk acceptance expired on ${entry.expires_on}. Re-review, upgrade, or replace the dependency.`
    );
  }
}

// 2. Stale acceptances that no longer correspond to a real advisory.
for (const [name, entry] of accepted) {
  if (!observedBlocking.has(name)) {
    failures.push(
      `${name}: allowlisted but no longer reported by npm audit. Delete the entry (accepted ${entry.accepted_on}) so the allowlist stays truthful.`
    );
  }
}

const meta = report.metadata?.vulnerabilities ?? {};
console.log(
  `npm audit --omit=dev: critical=${meta.critical ?? 0} high=${meta.high ?? 0} ` +
    `moderate=${meta.moderate ?? 0} low=${meta.low ?? 0}`
);
for (const [name, vuln] of observedBlocking) {
  const entry = accepted.get(name);
  console.log(
    `  ${entry ? 'ACCEPTED' : 'BLOCKING'}  ${name} [${vuln.severity}]` +
      (entry ? ` — expires ${entry.expires_on}` : '')
  );
}

if (failures.length > 0) {
  console.error('\nProduction dependency audit FAILED:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log('\nNo unaccepted HIGH/CRITICAL vulnerabilities in production dependencies.');
