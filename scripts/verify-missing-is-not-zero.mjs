#!/usr/bin/env node
/**
 * Missing-is-not-zero census — PR #91 (C3).
 *
 * The rule: on SUPPORTED surfaces, a money read that defaults to 0 must either
 * be fixed (render "unavailable" with a reason) or annotated with why zero is
 * correct there. The quarantine notice must be shown wherever a total can be
 * short.
 *
 * This script is a census, not a full AST analysis. It scans SUPPORTED routes'
 * page sources for patterns:
 * - `?? 0` / `|| 0` / `Number(x) || 0` / `parseFloat(x) || 0`
 * on money-adjacent reads (debit, credit, amount, total, balance).
 *
 * It fails when a SUPPORTED surface contains an unannotated default-zero that
 * could hide missing data.
 *
 * For now it reports findings and warns; the full fix is PR #91's sweep.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

let register, spine, gov;
try {
  register = JSON.parse(read('docs/plan/completion-register.json'));
  spine = JSON.parse(read('docs/plan/spine-evidence.json'));
  gov = JSON.parse(read('docs/plan/governance-evidence.json'));
} catch (e) {
  console.error(`✗ missing-is-not-zero: cannot read register/evidence: ${e.message}`);
  process.exit(1);
}

const supportedRoutes = register.rows.filter((r) => r.status === 'SUPPORTED' && r.kind === 'route');
console.log(`SUPPORTED routes: ${supportedRoutes.length}`);

const moneyZeroPatterns = [
  { re: /\?\?\s*0/g, label: '?? 0' },
  { re: /\|\|\s*0/g, label: '|| 0' },
  { re: /Number\s*\([^)]+\)\s*\|\|\s*0/g, label: 'Number(x) || 0' },
  { re: /parseFloat\s*\([^)]+\)\s*\|\|\s*0/g, label: 'parseFloat(x) || 0' },
];

let findings = 0;
for (const row of supportedRoutes) {
  const routePath = row.id.replace('route:', '');
  const pageFile = gov.routes?.[routePath]?.page || spine.routes?.[routePath]?.page;
  if (!pageFile || !existsSync(join(ROOT, pageFile))) continue;
  const src = read(pageFile);
  for (const { re, label } of moneyZeroPatterns) {
    const matches = [...src.matchAll(re)];
    if (matches.length > 0) {
      // Check if near money words
      for (const m of matches) {
        const idx = m.index ?? 0;
        const snippet = src.slice(Math.max(0, idx - 80), idx + 80).toLowerCase();
        if (
          snippet.includes('debit') ||
          snippet.includes('credit') ||
          snippet.includes('amount') ||
          snippet.includes('total') ||
          snippet.includes('balance')
        ) {
          // Check if annotated with why zero is correct or quarantine
          const context = src.slice(Math.max(0, idx - 200), idx + 200);
          if (!/zero is correct/i.test(context) && !/quarantine/i.test(context) && !/unavailable/i.test(context)) {
            console.log(`  ? ${row.id} ${pageFile} has ${label} near money: ...${snippet.slice(0, 80)}...`);
            findings += 1;
          }
        }
      }
    }
  }
}

if (findings === 0) {
  console.log('✓ missing-is-not-zero: 0 unannotated default-zero money reads on SUPPORTED surfaces');
} else {
  console.log(`\n✗ missing-is-not-zero: ${findings} potential default-zero money reads on SUPPORTED surfaces — review for quarantine/unavailable`);
  console.log('  This is a census for PR #91; not yet a hard gate, but must be fixed or annotated.');
  // For now, warn but don't fail — PR #91 will make it a hard gate
  process.exit(0);
}
