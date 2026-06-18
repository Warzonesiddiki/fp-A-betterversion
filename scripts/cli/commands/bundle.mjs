#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * @fileoverview `devex bundle` — bundle size check.
 *
 * @version v0.1.0
 * @date 2026-06-18
 * @author Prometheus
 *
 * Per AGENTS.md CI:
 *   - Main chunk MUST stay under 150KB gzip
 *   - Total JS MUST stay under 2MB gzip
 *
 * @example
 *   node scripts/cli/devex.mjs bundle          # analyze built output
 *   node scripts/cli/devex.mjs bundle --json   # emit JSON for tooling
 */

import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const LIMITS = {
  mainChunkKB: 150,
  totalJsKB: 2_000, // 2 MB
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

function gzipSize(filePath) {
  const buf = fs.readFileSync(filePath);
  return gzipSync(buf).length;
}

export async function run(args) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: devex bundle [--json] [--dir <path>]');
    console.log('Checks bundle size against AGENTS.md limits.');
    console.log('  Main chunk: ≤150KB gzip');
    console.log('  Total JS:   ≤2MB gzip');
    return 0;
  }

  const distDir = (() => {
    const idx = args.indexOf('--dir');
    if (idx >= 0 && args[idx + 1]) return path.resolve(args[idx + 1]);
    return path.resolve(process.cwd(), 'dist', 'assets');
  })();

  if (!fs.existsSync(distDir)) {
    console.error(`devex:bundle — dist directory not found: ${distDir}`);
    console.error('Run `npm run build` first.');
    return 2;
  }

  const files = walk(distDir);
  const results = files.map((f) => ({
    file: path.relative(process.cwd(), f),
    gzipBytes: gzipSize(f),
  }));

  results.sort((a, b) => b.gzipBytes - a.gzipBytes);

  const jsResults = results.filter((r) => r.file.endsWith('.js'));
  const mainChunk = jsResults[0];
  const totalJsBytes = jsResults.reduce((s, r) => s + r.gzipBytes, 0);

  const mainChunkKB = mainChunk ? Math.round(mainChunk.gzipBytes / 102.4) / 10 : 0;
  const totalJsMB = Math.round((totalJsBytes / 1024 / 1024) * 100) / 100;

  const mainOK = mainChunk ? mainChunk.gzipBytes <= LIMITS.mainChunkKB * 1024 : true;
  const totalOK = totalJsBytes <= LIMITS.totalJsKB * 1024;

  const report = {
    mainChunk: mainChunk
      ? { file: mainChunk.file, gzipBytes: mainChunk.gzipBytes, gzipKB: mainChunkKB, limitKB: LIMITS.mainChunkKB, ok: mainOK }
      : null,
    totalJs: { gzipBytes: totalJsBytes, gzipMB: totalJsMB, limitMB: LIMITS.totalJsKB / 1024, ok: totalOK },
    files: results,
  };

  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n── devex:bundle ──────────────────────────`);
    console.log(`Main chunk: ${report.mainChunk?.file ?? '(none)'} ${mainChunkKB}KB / ${LIMITS.mainChunkKB}KB  ${mainOK ? '✅' : '❌'}`);
    console.log(`Total JS:   ${totalJsMB}MB / ${(LIMITS.totalJsKB / 1024).toFixed(2)}MB  ${totalOK ? '✅' : '❌'}`);
    console.log(`\nTop 5 by gzip size:`);
    for (const r of results.slice(0, 5)) {
      const kb = Math.round(r.gzipBytes / 102.4) / 10;
      console.log(`  ${kb.toFixed(1).padStart(7)}KB  ${r.file}`);
    }
    console.log('──────────────────────────────────────────\n');
  }

  return mainOK && totalOK ? 0 : 1;
}