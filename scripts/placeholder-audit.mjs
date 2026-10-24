#!/usr/bin/env node
/**
 * Placeholder / fake-signal audit (2026-10-24).
 *
 * WHY THIS EXISTS
 * ---------------
 * The money-adoption ratchet once counted a module as "adopted" if it merely
 * IMPORTED `@/utils/money`. A prior pass seeded 894 modules with a no-op
 *
 *     const _moneyAdoptionMarker = toDecimal(0);
 *
 * whose only purpose was to trip that counter. Reported adoption was 87.35 %;
 * genuine adoption (a module that actually CALLS a money helper) was 30.16 %.
 * The ratchet has since been hardened to count calls, not imports, and fails
 * if any marker reappears — but a marker outside the financial dirs, or a
 * different fake class, would still slip through. This gate scans ALL of src
 * for the fake-signal class, zero-tolerance.
 *
 * WHAT IT FLAGS
 * -------------
 *   adoption-marker    `const _XMarker = toDecimal(0)` and the IIFE variant
 *                      `const _XMarker = (() => { ... toDecimal(0) ... })()`
 *   adoption-comment   `// Money adoption:` / `// Money primitive adoption:`
 *   void-signal        const named *marker|adoption|placeholder|stub|fake|noop*
 *                      assigned a call result — a no-op whose only purpose is
 *                      to exist and be counted
 *   void-statement     `void 0;` as a bare statement (explicit no-op)
 *
 * Zero-tolerance: any finding fails the gate. There is no legitimate debt —
 * a marker is never correct, so there is no baseline to ratchet down.
 *
 * Usage:  node scripts/placeholder-audit.mjs          # scan, fail on findings
 *         node scripts/placeholder-audit.mjs --list   # print findings only
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, basename, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const isTest = (f) => /\.(test|bench|benchmark|spec)\.[tj]sx?$/.test(f);

const PATTERNS = [
  {
    id: 'adoption-marker',
    re: /_[A-Za-z_]*Marker\s*=\s*(?:\(\(\)\s*=>\s*\{.*?\}\)\(\)|toDecimal\(0\))/,
    msg: 'fake adoption marker — a no-op whose only purpose is to trip a counter',
  },
  {
    id: 'adoption-comment',
    re: /\/\/\s*Money (?:adoption|primitive adoption):/,
    msg: 'adoption-marker comment — markers are forbidden, not documented',
  },
  {
    id: 'void-signal',
    re: /const\s+_[A-Za-z_]*(?:marker|adoption|placeholder|stub|fake|noop)[A-Za-z_]*\s*=\s*[A-Za-z_$][\w$]*\s*\(/i,
    msg: 'void-signal const — a named no-op assigned a call result',
  },
  {
    id: 'void-statement',
    re: /^\s*void\s+0\s*;?\s*$/,
    msg: 'bare `void 0;` no-op statement',
  },
];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p)) && !isTest(basename(p))) out.push(p);
  }
  return out;
}

const files = walk(SRC);
const findings = [];

for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const p of PATTERNS) {
      if (p.re.test(line)) {
        findings.push({
          file: rel,
          line: i + 1,
          kind: p.id,
          text: line.trim().slice(0, 120),
          msg: p.msg,
        });
      }
    }
  }
}

const listOnly = process.argv.includes('--list');

if (listOnly) {
  for (const f of findings) {
    console.log(`${f.file}:${f.line}  [${f.kind}]  ${f.text}`);
  }
  console.log(`\n${findings.length} finding(s)`);
  process.exit(findings.length ? 1 : 0);
}

console.log('Placeholder / fake-signal audit (src, zero-tolerance):');
console.log(`  modules scanned    ${files.length}`);
console.log(`  findings           ${findings.length}`);
for (const f of findings) {
  console.log(`    ✗ ${f.file}:${f.line}  [${f.kind}]  ${f.msg}`);
  console.log(`        ${f.text}`);
}
console.log('');

if (findings.length) {
  console.error(
    'PLACEHOLDER AUDIT FAILED: fake signals are forbidden. Remove the marker/stub and do the real work.'
  );
  process.exit(1);
}
console.log('✓ No fake signals (markers, void consts, void statements) in src.');
