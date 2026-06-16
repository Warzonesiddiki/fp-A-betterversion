#!/usr/bin/env node
 
/**
 * scripts/perf/pdf-bench.mjs
 *
 * G17 — 500-row financial PDF report generation < 3s benchmark.
 *
 * Mimics src/engines/ExportEngine.ts:exportReportToPDF using the same
 * jsPDF 4.x API and the same table-style drawing primitive (rect + text
 * rows, since the project doesn't depend on jspdf-autotable).
 *
 * Pass criteria (D-002/D-007 3-witness rule):
 *   - 500-row report:       ≤ 3,000 ms
 *   - output size:          sanity-checked (not 0, not 50MB+)
 *   - per-page timing:      consistent
 *
 * Usage:  node scripts/perf/pdf-bench.mjs
 */
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { writeFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { jsPDF } from 'jspdf';

// ---------- Synthetic 500-row financial dataset ----------

const ROW_COUNT = 500;
const COLS = ['Account', 'Type', 'Region', 'Period', 'Scenario', 'Amount', 'Qty', 'Unit Price', 'Discount', 'Tax'];

const ACCOUNT_TYPES = ['Revenue', 'COGS', 'OpEx', 'Asset', 'Liability', 'Equity'];
const REGIONS = ['NA', 'EMEA', 'APAC', 'LATAM'];
const SCENARIOS = ['Actual', 'Budget', 'Forecast'];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(7);

function buildRows(n) {
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = [
      `ACC-${(i * 13) % 9999}`,
      ACCOUNT_TYPES[i % ACCOUNT_TYPES.length],
      REGIONS[i % REGIONS.length],
      `2025-${String((i % 12) + 1).padStart(2, '0')}`,
      SCENARIOS[i % SCENARIOS.length],
      Math.round((rand() - 0.5) * 1_000_000 * 100) / 100,
      Math.floor(rand() * 10_000),
      Math.round(rand() * 500 * 100) / 100,
      Math.round(rand() * 0.3 * 1000) / 1000,
      Math.round(rand() * 0.15 * 1000) / 1000,
    ];
  }
  return out;
}

// ---------- PDF generation (mirrors ExportEngine style) ----------

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fmtPct = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2 });

/**
 * Generate the 500-row PDF report.
 * Same drawing primitives as src/engines/ExportEngine.ts:exportReportToPDF:
 *   - header (title + meta)
 *   - table header row (filled rect + bold text)
 *   - data rows (alternating shading, formatted cells)
 *   - page break when y > pageHeight - margin
 *   - page footer (page number)
 */
function generatePdf(rows, title = 'Financial Plan — GL Detail') {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 36;
  const COL_W = (PAGE_W - MARGIN * 2) / COLS.length; // 10 cols
  const ROW_H = 14;
  let y = MARGIN;

  // ---- Title block (once) ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, MARGIN, y + 14);
  y += 28;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toISOString()}`, MARGIN, y);
  doc.text(`Rows: ${rows.length}`, PAGE_W - MARGIN - 60, y);
  y += 18;

  // ---- Table header ----
  const drawHeader = () => {
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, ROW_H, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    for (let c = 0; c < COLS.length; c++) {
      doc.text(COLS[c], MARGIN + c * COL_W + 4, y + 10);
    }
    doc.setTextColor(0, 0, 0);
    y += ROW_H;
  };
  drawHeader();

  // ---- Data rows ----
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (let i = 0; i < rows.length; i++) {
    if (y + ROW_H > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
      drawHeader();
    }
    if (i % 2 === 0) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, ROW_H, 'F');
    }
    const r = rows[i];
    doc.text(String(r[0]), MARGIN + 0 * COL_W + 4, y + 10);
    doc.text(String(r[1]), MARGIN + 1 * COL_W + 4, y + 10);
    doc.text(String(r[2]), MARGIN + 2 * COL_W + 4, y + 10);
    doc.text(String(r[3]), MARGIN + 3 * COL_W + 4, y + 10);
    doc.text(String(r[4]), MARGIN + 4 * COL_W + 4, y + 10);
    doc.text(fmt.format(r[5]), MARGIN + 5 * COL_W + 4, y + 10);
    doc.text(String(r[6]), MARGIN + 6 * COL_W + 4, y + 10);
    doc.text(fmt.format(r[7]), MARGIN + 7 * COL_W + 4, y + 10);
    doc.text(fmtPct.format(r[8]), MARGIN + 8 * COL_W + 4, y + 10);
    doc.text(fmtPct.format(r[9]), MARGIN + 9 * COL_W + 4, y + 10);
    y += ROW_H;
  }

  // ---- Page footers ----
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_W - MARGIN - 60, PAGE_H - 16);
    doc.text('FinPlan Pro v1.0.0', MARGIN, PAGE_H - 16);
  }

  return doc;
}

// ---------- Main ----------

function fmtMs(ms) { return ms.toFixed(2).padStart(10) + ' ms'; }
function fmtKB(b) { return (b / 1024).toFixed(2).padStart(8) + ' KB'; }

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
console.log('║  G17 — pdf-bench.mjs  |  500-row financial report  |  jsPDF 4.x         ║');
console.log('╚══════════════════════════════════════════════════════════════════════════╝');

if (globalThis.gc) globalThis.gc();

// 1. Data prep
header('1. Data preparation (500 rows)');
const t0 = performance.now();
const rows = buildRows(ROW_COUNT);
const prepMs = performance.now() - t0;
record('Generate 500 rows', prepMs, 50);

// 2. PDF generation (the G17 headline test)
header(`2. PDF generation (${ROW_COUNT} rows × ${COLS.length} cols, target: <3s)`);
const t1 = performance.now();
const doc = generatePdf(rows);
const genMs = performance.now() - t1;
record(`Render ${ROW_COUNT}-row report`, genMs, 3_000);

// 3. PDF output
header('3. PDF output & size check');
const pdfBytes = doc.output('arraybuffer');
const pdfBuf = Buffer.from(pdfBytes);
const outPath = join(tmpdir(), `finplan-bench-${process.pid}.pdf`);
writeFileSync(outPath, pdfBuf);
const sizeBytes = statSync(outPath).size;
console.log(`  output:        ${outPath}`);
console.log(`  size:          ${fmtKB(sizeBytes)}`);
console.log(`  pages:         ${doc.getNumberOfPages()}`);

const sizeOk = sizeBytes > 5_000 && sizeBytes < 5_000_000;
console.log(`  ${sizeOk ? '✅' : '❌'}  size sanity (5KB < size < 5MB)`);
results.push({ name: 'Size sanity', pass: sizeOk });

// 4. Page count timing (split into halves to check linear scaling)
header('4. Per-200-row timing (linearity check)');
const t3 = performance.now();
generatePdf(rows.slice(0, 200));
const half1 = performance.now() - t3;
const t4 = performance.now();
generatePdf(rows.slice(200, 400));
const half2 = performance.now() - t4;
const t5 = performance.now();
generatePdf(rows.slice(400, 500));
const half3 = performance.now() - t5;
console.log(`  rows 0–199:   ${fmtMs(half1)}  (${(half1 / 200).toFixed(2)}ms/row)`);
console.log(`  rows 200–399: ${fmtMs(half2)}  (${(half2 / 200).toFixed(2)}ms/row)`);
console.log(`  rows 400–499: ${fmtMs(half3)}  (${(half3 / 100).toFixed(2)}ms/row)`);

// ---------- Summary ----------
const passed = results.filter(r => r.pass).length;
const total = results.length;

console.log('\n' + '═'.repeat(78));
console.log(`  RESULT:  ${passed}/${total} checks passed`);
console.log('═'.repeat(78));
if (passed === total) {
  console.log('  ✅  G17 (pdf-bench) — PASS  |  500-row report < 3s');
} else {
  console.log('  ❌  G17 (pdf-bench) — FAIL');
  for (const r of results.filter(r => !r.pass)) console.log(`     - ${r.name}`);
}

process.exit(passed === total ? 0 : 1);
