#!/usr/bin/env node
/**
 * Mock-data audit (Omega Council — BATCH-009).
 *
 * BATCH-008 found a page rendering MOCK_ASSETS (fabricated figures) as a real
 * tool. That is a zero-flaw defect hiding inside a reachability symptom. This
 * audit enumerates every module-scope "mock/demo/sample" data array in product
 * code so the council can sequence the "stop lying" fixes.
 *
 * Signal: a top-level `const <NAME> = [` whose NAME suggests synthetic data
 * (MOCK, mock, sample, demo, dummy, fake, placeholder, seed, fixture). High
 * precision; the council reviews each hit before acting.
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
}
if (unique.length === 0) console.log('  (none — no synthetic data arrays detected)');
