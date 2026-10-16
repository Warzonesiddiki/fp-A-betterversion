#!/usr/bin/env node
/**
 * MEMORY integrity check. Small on purpose (see _system/INTEGRITY.md).
 * Usage: node MEMORY/_system/check.mjs [--write]   (--write updates STATE.integrity)
 */
import fs from 'node:fs';
import path from 'node:path';

const MEM = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ROOT = path.resolve(MEM, '..');
const errors = [];
const read = (p) => fs.readFileSync(path.join(MEM, p), 'utf8');
const exists = (p) => fs.existsSync(p);

// 1. MAP/TREE paths exist (first token of each indented line, skip MISSING/planned)
for (const line of read('MAP/TREE.md').split('\n')) {
  const m = /^\s{0,2}([A-Za-z0-9_./-]+\/?)\s{2,}(VERIFIED|MISSING)/.exec(line);
  if (m && m[2] === 'VERIFIED' && !exists(path.join(ROOT, m[1]))) {
    errors.push(`MAP/TREE.md claims VERIFIED but missing on disk: ${m[1]}`);
  }
}

// 2. TRUTH.md weasel words (outside the rule line that names them)
const truth = read('TRUTH.md');
for (const [i, line] of truth.split('\n').entries()) {
  if (!/^\s*[-*]?\s*\[(FACT|POINTER|MEASURE|DECISION)/.test(line.trim())) continue;
  const bad = /\b(should|probably|I think|we will|going to)\b/i.exec(line);
  if (bad) errors.push(`TRUTH.md:${i + 1} weasel word "${bad[1]}" in a claim line`);
}

// 3. STATE.json parses and matches NOW
let state = null;
try {
  state = JSON.parse(read('STATE.json'));
} catch (e) {
  errors.push(`STATE.json does not parse: ${e.message}`);
}
if (state) {
  const now = read('TASKS/NOW.md');
  if (state.now?.task_id && !now.includes(state.now.task_id)) {
    errors.push(`STATE.now.task_id ${state.now.task_id} not found in TASKS/NOW.md`);
  }
}

// 4. secret scan
const SECRET = /(AKIA[0-9A-Z]{8,}|BEGIN [A-Z ]*PRIVATE KEY|api_key\s*=\s*['"][^'"]+|password\s*=\s*['"][^'"]+)/;
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const full = path.join(dir, d.name);
    return d.isDirectory() ? walk(full) : [full];
  });
const files = walk(MEM);
for (const f of files) {
  if (f.endsWith('check.mjs')) continue;
  const hit = SECRET.exec(fs.readFileSync(f, 'utf8'));
  if (hit) errors.push(`possible secret in ${path.relative(ROOT, f)}: ${hit[1].slice(0, 20)}…`);
}

// 5. INDEX links resolve
for (const m of read('INDEX.md').matchAll(/`(MEMORY\/[A-Za-z0-9_./-]+)`/g)) {
  const p = path.join(ROOT, m[1]);
  if (!m[1].endsWith('/') && !exists(p) && !m[1].includes('*')) {
    errors.push(`INDEX.md points at missing ${m[1]}`);
  }
}

// 6. front-matter present on every shard
for (const f of files.filter((f) => f.endsWith('.md'))) {
  if (!fs.readFileSync(f, 'utf8').startsWith('---')) {
    errors.push(`missing front-matter: ${path.relative(ROOT, f)}`);
  }
}

const ok = errors.length === 0;
console.log(ok ? 'MEMORY integrity: PASS' : `MEMORY integrity: FAIL (${errors.length})`);
for (const e of errors) console.log(`  - ${e}`);

if (process.argv.includes('--write') && state) {
  state.integrity = { last_run: new Date().toISOString().slice(0, 10), ok, errors };
  fs.writeFileSync(path.join(MEM, 'STATE.json'), JSON.stringify(state, null, 2) + '\n');
}
process.exit(ok ? 0 : 1);
