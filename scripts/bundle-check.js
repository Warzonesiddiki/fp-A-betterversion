#!/usr/bin/env node
// Bundle size check script for CI
// Validates that main chunk and total JS stay within limits

import fs from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const MAIN_CHUNK_LIMIT_KB = 150;   // KB gzip
const TOTAL_JS_LIMIT_KB = 2048;    // KB gzip

const distDir = path.join(process.cwd(), 'dist', 'assets');

function getFiles(dir, pattern) {
  const files = [];
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && matchPattern(entry.name, pattern)) {
        files.push(fullPath);
      }
    }
  }
  walk(dir);
  return files;
}

function matchPattern(filename, pattern) {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(filename);
}

async function getGzipSize(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const gzip = createGzip();
  const chunks = [];
  
  for await (const chunk of fileStream.pipe(gzip)) {
    chunks.push(chunk);
  }
  
  return Buffer.concat(chunks).length;
}

function getRawSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function formatKB(bytes) {
  return Math.round(bytes / 1024);
}

async function main() {
  console.log('## Bundle Size Report\n');

  // Find main chunk
  const mainChunks = getFiles(distDir, 'index-*.js');
  if (mainChunks.length === 0) {
    console.error('::error::No main chunk (index-*.js) found in dist/assets/');
    process.exit(1);
  }

  const mainChunk = mainChunks[0];
  const mainRawSize = getRawSize(mainChunk);
  const mainGzipSize = await getGzipSize(mainChunk);
  const mainRawKB = formatKB(mainRawSize);
  const mainGzipKB = formatKB(mainGzipSize);

  // Total JS
  const allJsFiles = getFiles(distDir, '*.js');
  let totalRaw = 0;
  let totalGzip = 0;

  console.log('| Chunk | Raw (KB) | Gzip (KB) |');
  console.log('|-------|----------|-----------|');

  for (const file of allJsFiles.sort()) {
    const name = path.basename(file);
    const raw = getRawSize(file);
    const gzip = await getGzipSize(file);
    totalRaw += raw;
    totalGzip += gzip;
    console.log(`| ${name} | ${formatKB(raw)} | ${formatKB(gzip)} |`);
  }

  const totalRawKB = formatKB(totalRaw);
  const totalGzipKB = formatKB(totalGzip);

  console.log('');
  console.log(`**Main chunk:** ${mainRawKB}KB raw -> ${mainGzipKB}KB gzip (limit: ${MAIN_CHUNK_LIMIT_KB}KB)`);
  console.log(`**Total JS:** ${totalRawKB}KB raw -> ${totalGzipKB}KB gzip (limit: ${TOTAL_JS_LIMIT_KB}KB)`);

  let fail = 0;

  if (mainGzipKB > MAIN_CHUNK_LIMIT_KB) {
    console.error(`\n::error::Main chunk ${mainGzipKB}KB gzip exceeds ${MAIN_CHUNK_LIMIT_KB}KB limit`);
    console.log('\n:x: **FAIL:** Main chunk exceeds limit');
    fail = 1;
  } else {
    console.log('\n:white_check_mark: **PASS:** Main chunk within limit');
  }

  if (totalGzipKB > TOTAL_JS_LIMIT_KB) {
    console.error(`\n::error::Total JS ${totalGzipKB}KB gzip exceeds ${TOTAL_JS_LIMIT_KB}KB limit`);
    console.log('\n:x: **FAIL:** Total JS exceeds limit');
    fail = 1;
  } else {
    console.log('\n:white_check_mark: **PASS:** Total JS within limit');
  }

  process.exit(fail);
}

main();