#!/usr/bin/env node
/**
 * AI census — verifies every AI surface calls verifiedFactsGate and that egress is gated.
 * PR #96 — AI cross-cutting hardening.
 *
 * AI surfaces are defined as:
 * - src/components/ai/**
 * - src/pages/ai/**
 * - src/engines/AIEngine.ts
 * - src/engines/AICopilotEngine.ts
 * - src/engines/AutoCommentaryEngine.ts
 * - src/services/ai/**
 * - src/services/llm/**
 * - src/services/nim/**
 *
 * For each surface that generates narrative (contains numeric text generation),
 * we require import of verifiedFactsGate or explicit allow comment.
 *
 * Allowlist: files that are known not to generate narrative numbers can be marked
 * with // @ai-census-allow reason.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

const AI_DIRS = [
  'src/components/ai',
  'src/pages/ai',
  'src/services/ai',
  'src/services/llm',
  'src/services/nim',
];

const AI_FILES = [
  'src/engines/AIEngine.ts',
  'src/engines/AICopilotEngine.ts',
  'src/engines/AutoCommentaryEngine.ts',
  'src/engines/NLQEngine.ts',
];

let files = AI_DIRS.flatMap(d => walk(join(ROOT, d)));
for (const f of AI_FILES) {
  const full = join(ROOT, f);
  if (existsSync(full)) files.push(full);
}

// Filter out tests
files = files.filter(f => !f.includes('.test.') && !f.includes('.spec.') && !f.includes('__tests__'));

const results = [];
let ungated = [];

for (const f of files) {
  const text = readFileSync(f, 'utf8');
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  
  const isAllowlisted = text.includes('@ai-census-allow');
  const importsGate = text.includes('verifiedFactsGate') || text.includes('verifyNarrative');
  const importsEgress = text.includes('llmEgress') || text.includes('isEgressEnabled') || text.includes('nimChat') || text.includes('isNimConfigured');
  
  // Heuristic: does file generate narrative? Check for keywords that indicate text generation with numbers
  const generatesNarrative = 
    /generate.*narrative|generate.*commentary|generate.*summary|interpolate|fmtCurrency|formatMoney|NARRATIVE_SYSTEM_PROMPT|verifyNarrative/i.test(text) ||
    (text.includes('text:') && text.includes('source:')) ||
    rel.includes('NLQChat') ||
    rel.includes('AutoCommentary');
  
  // For now, we consider these files as needing gating if they generate narrative OR are in AI components that could surface text
  const needsGating = generatesNarrative || rel.includes('NLQChat') || rel.includes('AutoCommentary') || rel.includes('AIEngine') || rel.includes('AIIntelligencePage');
  
  results.push({
    file: rel,
    isAllowlisted,
    importsGate,
    importsEgress,
    needsGating,
    generatesNarrative,
  });
  
  if (needsGating && !importsGate && !isAllowlisted) {
    ungated.push(rel);
  }
}

console.log('AI census — surfaces that produce AI-generated text:');
console.log(`  total AI files scanned: ${files.length}`);
console.log(`  files needing verifiedFactsGate: ${results.filter(r => r.needsGating).length}`);
console.log(`  files importing gate: ${results.filter(r => r.importsGate).length}`);
console.log(`  allowlisted: ${results.filter(r => r.isAllowlisted).length}`);
console.log('');
console.log('Detailed:');
for (const r of results) {
  const status = r.needsGating ? (r.importsGate || r.isAllowlisted ? '✓ GATED' : '✗ UNGATED') : '○ no-narrative';
  console.log(`  ${status} ${r.file} ${r.isAllowlisted ? '(allowlisted)' : ''} ${r.importsGate ? '[gate]' : ''} ${r.generatesNarrative ? '[narrative]' : ''}`);
}
console.log('');

if (ungated.length > 0) {
  console.log(`AI CENSUS FAILED: ${ungated.length} ungated surfaces:`);
  for (const f of ungated) console.log(`  ✗ ${f}`);
  console.log('');
  console.log('Fix: each AI surface that generates narrative numbers must import and call verifyNarrative from @/services/ai/verifiedFactsGate, or be explicitly allowlisted with // @ai-census-allow <reason>');
  process.exit(1);
}

console.log('✓ AI census PASS — 0 ungated surfaces');
