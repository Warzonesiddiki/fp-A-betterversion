#!/usr/bin/env node
/**
 * Auto-update the progress tracker HTML.
 *
 * Reads real project state (git log, money-adoption baseline, test counts,
 * file counts) and injects it into PROGRESS_TRACKER.html.
 *
 * Usage:
 *   node scripts/update-tracker.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TRACKER_PATH = join(ROOT, 'PROGRESS_TRACKER.html');
const BASELINE_PATH = join(ROOT, 'scripts', 'money-adoption-baseline.json');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd: ROOT }).trim();
  } catch (e) {
    return '';
  }
}

function readJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

function countFiles(dir, ext) {
  let count = 0;
  function walk(d) {
    if (!existsSync(d)) return;
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      const s = statSync(p);
      if (s.isDirectory()) walk(p);
      else if (e.endsWith(ext)) count++;
    }
  }
  walk(dir);
  return count;
}

function getGitInfo() {
  const head = run('git log --oneline -1');
  const branch = run('git branch --show-current');
  return { head, branch };
}

function main() {
  if (!existsSync(TRACKER_PATH)) {
    console.error('PROGRESS_TRACKER.html not found');
    process.exit(1);
  }
  if (!existsSync(BASELINE_PATH)) {
    console.error('money-adoption-baseline.json not found');
    process.exit(1);
  }

  const baseline = readJson(BASELINE_PATH);
  const git = getGitInfo();
  const srcFiles = countFiles(join(ROOT, 'src'), '.ts') + countFiles(join(ROOT, 'src'), '.tsx');
  const pages = countFiles(join(ROOT, 'src/pages'), '.tsx');
  const components = countFiles(join(ROOT, 'src/components'), '.tsx');
  const engines = countFiles(join(ROOT, 'src/engines'), '.ts');
  const stores = countFiles(join(ROOT, 'src/store'), '.ts');
  const testFiles = countFiles(join(ROOT, 'src'), '.test.ts') + countFiles(join(ROOT, 'src'), '.test.tsx');
  const moneyTests = countFiles(join(ROOT, 'src'), 'money.test.ts') + countFiles(join(ROOT, 'src'), 'money.test.tsx');
  const pagesTest = countFiles(join(ROOT, 'src/pages'), '.test.tsx') + countFiles(join(ROOT, 'src/pages'), '.test.ts');
  const componentsTest = countFiles(join(ROOT, 'src/components'), '.test.tsx') + countFiles(join(ROOT, 'src/components'), '.test.ts');

  // Format timestamp
  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

  // Read tracker
  let html = readFileSync(TRACKER_PATH, 'utf8');

  // Build dynamic metric block
  const metrics = {
    financialModules: baseline.financialModules,
    modulesUsingMoney: baseline.modulesUsingMoneyPrimitive,
    adoption: baseline.adoptionPercent,
    rawToFixed: baseline.rawToFixedSites,
    serverFinancial: baseline.serverFinancialModules,
    serverUsing: baseline.serverModulesUsingMoneyPrimitive,
    serverToFixed: baseline.serverRawToFixedSites,
    srcFiles,
    pages,
    components,
    engines,
    stores,
    testFiles,
    moneyTests,
    pagesTest,
    componentsTest,
  };

  // Inject values into the HTML using regex-based replacement
  // (the HTML has static values, we replace them).
  const replacements = [
    { from: /"stat-value">\d+<span class="stat-delta">\/ \d+<\/span>/, to: `"stat-value">${metrics.modulesUsingMoney}<span class="stat-delta">/ ${metrics.financialModules}</span>` },
    { from: /"stat-value" style="color: var\(--green-ink\)">\d+<\/div>\s*<div class="stat-sub">Zero float-money sites/, to: `"stat-value" style="color: var(--green-ink)">${metrics.rawToFixed}</div>\n      <div class="stat-sub">Zero float-money sites` },
    { from: /"stat-value">\d[\d,]*<span class="stat-delta amber">\+\d+ this wave<\/span>/, to: `"stat-value">${metrics.testFiles.toLocaleString()}<span class="stat-delta amber">+${metrics.moneyTests - 9} this wave</span>` },
    { from: /"stat-value">\d[\d,]*<\/div>\s*<div class="stat-sub">\d+ components/, to: `"stat-value">${metrics.srcFiles.toLocaleString()}</div>\n      <div class="stat-sub">${metrics.components} components + ${metrics.engines} engines + ${metrics.stores} stores + ${metrics.pages} pages` },
    { from: /<code>[a-f0-9]{7}<\/code>/, to: `<code>${git.head.split(' ')[0]}</code>` },
    { from: /Last updated: <code>[^<]*<\/code>/, to: `Last updated: <code>${now} UTC</code>` },
  ];

  let updated = 0;
  for (const r of replacements) {
    if (r.from.test(html)) {
      html = html.replace(r.from, r.to);
      updated++;
    } else {
      console.warn(`No match for: ${r.from}`);
    }
  }

  writeFileSync(TRACKER_PATH, html, 'utf8');
  console.log(`✓ Updated PROGRESS_TRACKER.html (${updated} replacements)`);
  console.log(`  ${metrics.modulesUsingMoney}/${metrics.financialModules} modules on money primitive (${metrics.adoption}%)`);
  console.log(`  ${metrics.rawToFixed} raw toFixed sites, ${metrics.testFiles} test files, ${metrics.srcFiles} source files`);
  console.log(`  Branch: ${git.branch}, head: ${git.head.split(' ')[0]}`);
}

main();
