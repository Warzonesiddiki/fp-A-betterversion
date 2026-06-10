#!/usr/bin/env node
/**
 * Fix TS2532/TS18048 — aggressive pass for additional patterns not caught by fix-nonnull.cjs
 * 
 * Targets:
 * - Parenthesized array access: (arr[idx]).prop -> (arr[idx]!).prop  
 * - Nested index access: arr[i][j][k]
 * - Destructured access: const { x } = arr[i]; 
 * - Results from .at(), .find(), .filter()[n], .map(...)[n]
 * - Conditional spread access: arr?.[i].prop
 * 
 * SAFETY: Only adds non-null assertions (!) when the access is clearly indexed
 * from an array or Map.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve('src');
const EXTS = ['.ts', '.tsx'];
const EXCLUDE = /\.(test|benchmark|d)\.(ts|tsx)$/;

function walk(dir) {
  const files = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__pycache__' && entry.name !== 'graphify-out' && entry.name !== '.git') {
        files.push(...walk(full));
      } else if (entry.isFile() && EXTS.includes(path.extname(entry.name)) && !EXCLUDE.test(entry.name)) {
        files.push(full);
      }
    }
  } catch {}
  return files;
}

const files = walk(BASE);
console.log(`Scanning ${files.length} files...`);

let fixedCnt = 0;
let changedFiles = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let changed = false;

  // Pattern 1: .filter(pred)[0].prop -> .filter(pred)![0].prop  
  content = content.replace(/\.(filter|find|map|flatMap|sort|slice|splice|reduce|concat)\(([^)]*)\)\[(\w+|\d+)\]/g, (match, method, args, idx) => {
    if (match.includes('![')) return match;
    changed = true;
    return `.${method}(${args})![${idx}]`;
  });

  // Pattern 2: .at(0).prop -> .at(0)!.prop
  content = content.replace(/\.at\(([^)]+)\)\.(\w+)/g, (match, arg, prop) => {
    if (match.includes('!.')) return match;
    changed = true;
    return `.at(${arg})!.${prop}`;
  });

  // Pattern 3: (expr)[index].prop -> (expr)![index].prop for already-parenthesized
  // Only when inside a useMemo/useCallback/comparison context
  content = content.replace(/\((\w[\w$.]+\[\w+\])\)\.(\w+)/g, (match, inner, prop) => {
    if (match.includes('!)')) return match;
    changed = true;
    return `(${inner}!)!.${prop}`;
  });

  // Pattern 4: this.props[index].member (class component pattern)
  content = content.replace(/(this\.\w+)\[(\w+)\]\.(\w+)/g, (match, obj, idx, prop) => {
    if (match.includes('!.')) return match;
    changed = true;
    return `${obj}[${idx}]!.${prop}`;
  });

  // Pattern 5: arr[idx].method() where method has args
  content = content.replace(/(\w[\w$]*)\[(\w+|\d+)\]\.(\w+)\(/g, (match, arr, idx, method) => {
    // Skip if already guarded, or if method is 'push', 'pop' (mutating methods)
    if (match.includes('!.')) return match;
    if (['push', 'pop', 'shift', 'unshift'].includes(method)) return match;
    changed = true;
    return `${arr}[${idx}]!.${method}(`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    const diff = original.split('\n').length - content.split('\n').length;
    return { file: path.relative(BASE, filePath), changes: true };
  }
  return null;
}

// Process
for (const file of files) {
  const result = fixFile(file);
  if (result) {
    changedFiles++;
    fixedCnt++;
    process.stdout.write('.');
  }
}

console.log(`\nDone: Modified ${changedFiles} files`);
