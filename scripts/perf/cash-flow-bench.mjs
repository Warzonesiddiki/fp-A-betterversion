#!/usr/bin/env node
/**
 * G22 — cash-flow-bench.mjs  |  Cash flow engine perf bench  |  cell.07 T-PR-082 v0.7
 *
 * Benchmarks:
 *   1. Cash flow projection (12 months × 100K line items)
 *   2. AR/AP aging buckets (100K invoices × 5 buckets)
 *   3. Working capital calculation (CA - CL)
 *   4. Free cash flow derivation (OCF - CapEx)
 *   5. 13-week rolling forecast (13 weeks × 1000 daily entries)
 *
 * Targets (cell.07 Cash Flow per T-PR-082 v0.7 4-gaps design):
 *   - 12-month projection ≤ 1500 ms
 *   - AR/AP aging ≤ 800 ms
 *   - Working capital ≤ 200 ms
 *   - Free cash flow ≤ 100 ms
 *   - 13-week rolling ≤ 600 ms
 *
 * @purity-tier BENCHMARK_HARNESS (no production side effects)
 * @cross-witness Archimedes T-FIX-04 MATH CROSS-WITNESS (slot 019eda5a-71e2)
 * @cross-witness Vulcan T-FIX-10 9-violator coordination (slot 019ed5ae-9995)
 */

import { performance } from 'node:perf_hooks';

const MONTHS = 12;
const LINE_ITEMS = 100_000;
const INVOICES = 100_000;
const BUCKETS = 5;
const WEEKS = 13;
const ENTRIES_PER_DAY = 1000;
const DAYS_PER_WEEK = 7;
const DAILY_ENTRIES = ENTRIES_PER_DAY * DAYS_PER_WEEK; // 7000 per week, 91,000 total
const SEED = 42;

// ---------- Deterministic RNG (mulberry32, seed=42 — same as T-FIX-10) ----------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(SEED);

// ---------- Data generators ----------

function generateLineItem(idx) {
  return {
    id: idx,
    date: new Date(Date.UTC(2026, 0, 1) + idx * 3600).toISOString(), // hourly
    amount: Math.round(rng() * 10000) / 100,
    type: rng() < 0.6 ? 'receipt' : 'payment', // 60/40 receipts/payments
    account: ['AR', 'AP', 'Inventory', 'Payroll', 'Tax'][Math.floor(rng() * 5)],
  };
}

function generateInvoice(idx) {
  return {
    id: idx,
    invoiceDate: new Date(Date.UTC(2026, 0, 1) + Math.floor(rng() * 365) * 86400000).toISOString(),
    dueDate: new Date(Date.UTC(2026, 0, 1) + (Math.floor(rng() * 365) + 30) * 86400000).toISOString(),
    amount: Math.round(rng() * 50000) / 100,
    type: rng() < 0.5 ? 'AR' : 'AP',
  };
}

function generateDailyEntry(weekIdx, dayIdx) {
  return {
    week: weekIdx,
    day: dayIdx,
    inflows: Math.round(rng() * 100000) / 100,
    outflows: Math.round(rng() * 80000) / 100,
    date: new Date(Date.UTC(2026, 0, 5) + (weekIdx * 7 + dayIdx) * 86400000).toISOString(),
  };
}

// ---------- Bench functions ----------

function projectCashFlow(lineItems, months) {
  const projections = new Array(months).fill(null).map(() => ({
    receipts: 0,
    payments: 0,
    net: 0,
    running: 0,
  }));
  for (const item of lineItems) {
    const monthIdx = Math.floor((new Date(item.date).getTime() - Date.UTC(2026, 0, 1)) / (30 * 86400000)) % months;
    if (monthIdx >= 0 && monthIdx < months) {
      if (item.type === 'receipt') projections[monthIdx].receipts += item.amount;
      else projections[monthIdx].payments += item.amount;
    }
  }
  let running = 0;
  for (const p of projections) {
    p.net = p.receipts - p.payments;
    running += p.net;
    p.running = running;
  }
  return projections;
}

function arApAging(invoices) {
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0, d90plus: 0 };
  const now = Date.UTC(2026, 5, 18); // Today
  for (const inv of invoices) {
    const daysPast = Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000);
    if (daysPast <= 0) buckets.current += inv.amount;
    else if (daysPast <= 30) buckets.d30 += inv.amount;
    else if (daysPast <= 60) buckets.d60 += inv.amount;
    else if (daysPast <= 90) buckets.d90 += inv.amount;
    else buckets.d90plus += inv.amount;
  }
  return buckets;
}

function workingCapital(lineItems) {
  let currentAssets = 0;
  let currentLiabilities = 0;
  for (const item of lineItems) {
    if (item.account === 'AR' || item.account === 'Inventory') {
      currentAssets += item.amount;
    } else if (item.account === 'AP' || item.account === 'Payroll' || item.account === 'Tax') {
      currentLiabilities += item.amount;
    }
  }
  return { currentAssets, currentLiabilities, workingCapital: currentAssets - currentLiabilities };
}

function freeCashFlow(ocf, capex) {
  return ocf - capex;
}

function rolling13Week(entries) {
  const weeks = new Array(WEEKS).fill(null).map(() => ({ inflows: 0, outflows: 0, net: 0 }));
  for (const e of entries) {
    if (e.week >= 0 && e.week < WEEKS) {
      weeks[e.week].inflows += e.inflows;
      weeks[e.week].outflows += e.outflows;
    }
  }
  let running = 0;
  for (const w of weeks) {
    w.net = w.inflows - w.outflows;
    running += w.net;
    w.running = running;
  }
  return weeks;
}

// ---------- Reporting ----------

function fmtMs(ms) { return ms.toFixed(2).padStart(8) + ' ms'; }
function fmtMB(b) { return (b / 1024 / 1024).toFixed(2).padStart(7) + ' MB'; }

const results = [];
function record(name, ms, target, extra = '') {
  const pass = ms <= target;
  const tag = pass ? '✅' : '❌';
  results.push({ name, ms, target, pass });
  console.log(`  ${tag}  ${name.padEnd(40)} ${fmtMs(ms)}  (target ≤ ${target}ms)${extra ? '  ' + extra : ''}`);
  return pass;
}

function header(title) {
  console.log('\n' + '─'.repeat(78));
  console.log(`  ${title}`);
  console.log('─'.repeat(78));
}

console.log('╔══════════════════════════════════════════════════════════════════════════╗');
console.log('║  G22 — cash-flow-bench.mjs  |  cell.07 Cash Flow  |  T-PR-082 v0.7     ║');
console.log('╚══════════════════════════════════════════════════════════════════════════╝');

if (globalThis.gc) globalThis.gc();

// 1. Cash flow projection
header(`1. 12-month cash flow projection (${LINE_ITEMS.toLocaleString()} line items)`);
const lineItems = Array.from({ length: LINE_ITEMS }, (_, i) => generateLineItem(i));
const t0 = performance.now();
const projections = projectCashFlow(lineItems, MONTHS);
const projMs = performance.now() - t0;
record(`Project ${MONTHS}-month cash flow`, projMs, 1500, `| ${projections.length} months`);

// 2. AR/AP aging
header(`2. AR/AP aging (${INVOICES.toLocaleString()} invoices × ${BUCKETS} buckets)`);
const invoices = Array.from({ length: INVOICES }, (_, i) => generateInvoice(i));
const t1 = performance.now();
const aging = arApAging(invoices);
const agingMs = performance.now() - t1;
record(`AR/AP aging ${INVOICES.toLocaleString()} invoices`, agingMs, 800,
  `| current=$${aging.current.toFixed(0)} d30=$${aging.d30.toFixed(0)} d60=$${aging.d60.toFixed(0)} d90=$${aging.d90.toFixed(0)} d90+=$${aging.d90plus.toFixed(0)}`);

// 3. Working capital
header('3. Working capital calculation');
const t2 = performance.now();
const wc = workingCapital(lineItems);
const wcMs = performance.now() - t2;
record('Working capital', wcMs, 200,
  `| CA=$${wc.currentAssets.toFixed(0)} CL=$${wc.currentLiabilities.toFixed(0)} WC=$${wc.workingCapital.toFixed(0)}`);

// 4. Free cash flow
header('4. Free cash flow derivation');
const t3 = performance.now();
const fcf = freeCashFlow(1_500_000, 350_000);
const fcfMs = performance.now() - t3;
record('Free cash flow', fcfMs, 100, `| FCF=$${fcf.toFixed(0)}`);

// 5. 13-week rolling forecast
header(`5. 13-week rolling forecast (${WEEKS} weeks × ${ENTRIES_PER_DAY} entries/day × ${DAYS_PER_WEEK} days = ${(ENTRIES_PER_DAY * DAYS_PER_WEEK * WEEKS).toLocaleString()} total)`);
const dailyEntries = [];
for (let w = 0; w < WEEKS; w++) {
  for (let d = 0; d < DAYS_PER_WEEK; d++) {
    for (let e = 0; e < ENTRIES_PER_DAY; e++) {
      dailyEntries.push(generateDailyEntry(w, d));
    }
  }
}
const t4 = performance.now();
const weeks13 = rolling13Week(dailyEntries);
const w13Ms = performance.now() - t4;
record(`13-week rolling ${dailyEntries.length.toLocaleString()} entries`, w13Ms, 600,
  `| ${weeks13.length} weeks`);

// 6. Memory footprint
header('6. Memory footprint');
const heapUsed = process.memoryUsage().heapUsed;
const rss = process.memoryUsage().rss;
console.log(`  heap used:  ${fmtMB(heapUsed)}`);
console.log(`  RSS:        ${fmtMB(rss)}`);

// Summary
const passed = results.filter(r => r.pass).length;
const failed = results.length - passed;
console.log('\n' + '═'.repeat(78));
console.log(`  SUMMARY: ${passed}/${results.length} targets PASSED`);
if (failed > 0) {
  console.log(`  ❌ ${failed} target(s) FAILED`);
  process.exitCode = 1;
} else {
  console.log(`  ✅ ALL TARGETS PASSED`);
}
console.log('═'.repeat(78));