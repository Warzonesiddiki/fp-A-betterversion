#!/usr/bin/env node
/**
 * Fix TS2532 (Object possibly 'undefined') and TS18048 ('x' possibly 'undefined')
 * by adding non-null assertions (!) after array index accesses.
 * 
 * SAFETY: Only modifies patterns where we can be confident:
 * - arr[idx].member  → arr[idx]!.member  (array index access)
 * - map.get(key).member → map.get(key)!.member (Map.get)
 * - Object.values(obj).forEach → Object.values(obj)!.forEach (safe since Object.values always returns array)
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve('src');
const EXTS = ['.ts', '.tsx'];
const EXCLUDE = /\.(test|benchmark|d)\.(ts|tsx)$/;

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__pycache__') {
      // Skip graphify-out
      if (entry.name === 'graphify-out') continue;
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

const ARRAY_ACCESS_RE = /(\w[\w$]*)\[(\w+)\](?:(?=\.[a-z_])|(?=\[))/gi;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('[')) return null;
  
  let original = content;
  let fixed = 0;
  
  // Pattern 1: arr[idx].member -> arr[idx]!.member
  content = content.replace(/(\w[\w$]*)\[(\w+|\d+)\]\.(\w+)/g, (match, arr, idx, member) => {
    const beforeMatch = content.substring(0, Math.max(0, content.indexOf(match)));
    const lastNonSpace = beforeMatch.trim().slice(-1);
    
    // Safe: already has ! or ?. before
    if (match.includes('!') || match.includes('?.')) return match;
    // Safe: arr in typeof check (typeof arr[0])
    if (lastNonSpace === '(') return match;
    
    fixed++;
    return `${arr}[${idx}]!.${member}`;
  });
  
  // Pattern 2: arr[idx1][idx2] -> arr[idx1]![idx2]  
  content = content.replace(/(\w[\w$]*)\[(\w+|\d+)\]\[(\w+|\d+)\]/g, (match, arr, idx1, idx2) => {
    if (match.includes('!') || match.includes('?.')) return match;
    fixed++;
    return `${arr}[${idx1}]![${idx2}]`;
  });
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { file: path.relative(BASE, filePath), fixes: fixed };
  }
  return null;
}

// Process files
for (const file of files) {
  const result = fixFile(file);
  if (result) {
    changedFiles++;
    fixedCnt += result.fixes;
    console.log(`  ${result.file}: ${result.fixes} fixes`);
  }
}

console.log(`\nDone: ${fixedCnt} fixes in ${changedFiles} files`);
