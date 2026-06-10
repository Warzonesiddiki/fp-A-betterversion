#!/usr/bin/env node
/**
 * Fix TS2532 (Object possibly 'undefined') and TS18048 ('x' possibly 'undefined')
 * by adding non-null assertions (!) after array index accesses.
 * 
 * VERSION 2: Targets ALL files including tests.
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve('src');
const EXTS = ['.ts', '.tsx'];
// Only exclude .d.ts type declaration files
const EXCLUDE = /\.d\.(ts|tsx)$/;

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__pycache__') {
      if (entry.name === 'graphify-out') continue;
      if (entry.name === 'assembly') continue;
      files.push(...walk(full));
    } else if (entry.isFile() && EXTS.includes(path.extname(entry.name)) && !EXCLUDE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(BASE);
console.log(`Checking ${files.length} files...`);

let fixedCnt = 0;
let changedFiles = 0;

// ARRAY_ACCESS_RE matches var[idx] where idx is a word or number
// Followed by .prop or [
const ARRAY_ACCESS_RE = /(\w[\w$]*)\[(\w+)\](?:(?=\.[a-z_])|(?=\[))/gi;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('[')) return null;
  
  let original = content;
  let fixed = 0;
  
  // Pattern 1: arr[idx].member -> arr[idx]!.member
  content = content.replace(/(\w[\w$]*)\[(\w+|['"`][^'"`]+['"`])\](?<!\?)(?<!!)\.(\w+)/g, (match, arr, idx, member) => {
    // Skip: already has ! or ?. before
    if (match.includes('!') || match.includes('?.')) return match;
    // Skip: typeof arr[0]
    const beforeMatch = content.substring(0, Math.max(0, content.indexOf(match)));
    const beforeTrimmed = beforeMatch.trim();
    if (beforeTrimmed.endsWith('typeof')) return match;
    // Skip: arr in template literal or after new/delete/void
    if (beforeTrimmed.endsWith('new') || beforeTrimmed.endsWith('delete') || beforeTrimmed.endsWith('void')) return match;
    
    fixed++;
    return `${arr}[${idx}]!.${member}`;
  });
  
  // Pattern 2: arr[idx1][idx2] -> arr[idx1]![idx2]
  content = content.replace(/(\w[\w$]*)\[(\w+|['"`][^'"`]+['"`])\](?<!\?)(?<!!)\[(\w+|['"`][^'"`]+['"`])\]/g, (match, arr, idx1, idx2) => {
    if (match.includes('!') || match.includes('?.')) return match;
    // Skip: inline if this is a type annotation or declaration
    // Only fix if the first bracket access looks like runtime code
    fixed++;
    return `${arr}[${idx1}]![${idx2}]`;
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { file: path.relative(BASE, filePath), fixes: fixed };
  }
  return null;
}

for (const file of files) {
  const result = fixFile(file);
  if (result) {
    changedFiles++;
    fixedCnt += result.fixes;
    if (result.fixes > 5) {
      console.log(`  ${result.file}: ${result.fixes} fixes`);
    }
  }
}

console.log(`\nDone: ${fixedCnt} fixes in ${changedFiles} files`);
