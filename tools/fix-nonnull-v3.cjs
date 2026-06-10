#!/usr/bin/env node
/**
 * fix-nonnull-v3.cjs — Comprehensive non-null assertion batch fixer
 * Covers ALL remaining patterns: arr[i] followed by operator, comparison, assignment
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve('src');
const EXTS = ['.ts', '.tsx'];
const EXCLUDE = /\.d\.(ts|tsx)$/;

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__pycache__' && entry.name !== 'assembly' && entry.name !== 'graphify-out') {
      files.push(...walk(full));
    } else if (entry.isFile() && EXTS.includes(path.extname(entry.name)) && !EXCLUDE.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(BASE);
console.log(`Scanning ${files.length} files...\n`);

let totalFixed = 0;
let changedFiles = 0;

function fixContent(content) {
  let original = content;
  let fixed = 0;

  // Pattern: arr[i].prop -> arr[i]!.prop  (not already ! or ?)
  content = content.replace(/(\w[\w$]*)\[(\w+)\](?<!\!)(?<!\.\.)(?<!\?\()(?=\.[a-zA-Z_])/g, (match) => {
    if (match.includes('!') || match.includes('?.')) return match;
    // Insert ! before the .
    const dotIdx = match.lastIndexOf('.');
    fixed++;
    return match.slice(0, dotIdx) + '!' + match.slice(dotIdx);
  });

  // Pattern: arr[i][j] -> arr[i]![j]  (not already ! or ?.)
  content = content.replace(/(\w[\w$]*)\[(\w+)\](?<!\!)(?<!\?\()\[/g, (match) => {
    if (match.includes('!') || match.includes('?.')) return match;
    // Insert ! before the [
    const bracketIdx = match.lastIndexOf('[');
    fixed++;
    return match.slice(0, bracketIdx) + '![' + match.slice(bracketIdx + 1);
  });

  // Pattern: arr[i] ) -> arr[i]! )  (end of expression in parens)
  content = content.replace(/(\w[\w$]*)\[(\w+)\](?<!\!)(?<!\?\()(?=\s*\))/g, (match) => {
    fixed++;
    return match + '!';
  });

  // Pattern: arr[i] , -> arr[i]!,  (argument separator)
  content = content.replace(/(\w[\w$]*)\[(\w+)\](?<!\!)(?<!\?\()(?=\s*,)/g, (match) => {
    fixed++;
    return match + '!';
  });

  // Pattern: arr[i] ? -> arr[i]! ?  (ternary, NOT ??)
  content = content.replace(/(\w[\w$]*)\[(\w+)\](?<!\!)(?<!\?\()(?=\s+\?\s)/g, (match) => {
    fixed++;
    return match + '!';
  });

  if (content !== original) {
    return { content, fixed };
  }
  return null;
}

const lines = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('[')) continue;
  
  const result = fixContent(content);
  if (result) {
    fs.writeFileSync(file, result.content, 'utf8');
    changedFiles++;
    totalFixed += result.fixed;
    const rel = path.relative(BASE, file);
    lines.push(`  ${rel}: ${result.fixed} fixes`);
    if (lines.length <= 20 || result.fixed > 5) {
      console.log(`  ${rel}: ${result.fixed} fixes`);
    }
  }
}

console.log(`\nDone: ${totalFixed} fixes in ${changedFiles} files`);
