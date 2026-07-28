#!/usr/bin/env node
// =============================================================================
// PREFIX UNUSED PARAMETERS
// =============================================================================
// One-shot codemod used to enable `noUnusedParameters` in tsconfig.json.
//
// TypeScript (like this repo's ESLint config, which already uses
// `argsIgnorePattern: '^_'`) treats a leading underscore as "intentionally
// unused". This script renames only *parameters* flagged by TS6133, using the
// compiler API so each shape is handled correctly:
//
//   positional param      (value, name, props)  ->  (_value, _name, props)
//   destructured prop     ({ period = '' })     ->  ({ period: _period = '' })
//                                                    ^ property name preserved,
//                                                      so callers are unaffected
//
// It deliberately does NOT touch unused locals, imports, or types — deleting
// those needs human review (side-effecting imports, re-exported types).
//
// Usage: node scripts/prefix-unused-params.mjs [--dry]
// =============================================================================

import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const DRY = process.argv.includes('--dry');
const projectRoot = resolve(dirname(new URL(import.meta.url).pathname), '..');
const configPath = resolve(projectRoot, 'tsconfig.json');

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);

// Force the flag on for this analysis regardless of what's checked in.
const options = {
  ...parsed.options,
  noUnusedParameters: true,
  noUnusedLocals: false,
  noEmit: true,
};

const program = ts.createProgram(parsed.fileNames, options);
const diagnostics = program.getSemanticDiagnostics();

// TS6133: "'x' is declared but its value is never read."
const unused = diagnostics.filter((d) => d.code === 6133 && d.file && d.start !== undefined);

/** @type {Map<string, Array<{start:number,end:number,text:string}>>} */
const editsByFile = new Map();
let skipped = 0;

for (const d of unused) {
  const sf = d.file;
  const node = findNodeAt(sf, d.start);
  if (!node || !ts.isIdentifier(node)) {
    skipped += 1;
    continue;
  }

  const parent = node.parent;
  let edit = null;

  if (ts.isParameter(parent) && parent.name === node) {
    // Plain positional parameter: rename in place.
    edit = { start: node.getStart(sf), end: node.getEnd(), text: `_${node.text}` };
  } else if (ts.isBindingElement(parent) && parent.name === node && !parent.propertyName) {
    // Destructured parameter element. Only rewrite when the binding pattern
    // belongs to a parameter — never a local `const { a } = obj`.
    if (isInsideParameterBindingPattern(parent)) {
      if (ts.isArrayBindingPattern(parent.parent)) {
        // Positional destructuring: `([key]) => ...`. There is no property
        // name to preserve, so rename directly — `[key: _key]` is a syntax
        // error, which an earlier version of this codemod emitted.
        edit = { start: node.getStart(sf), end: node.getEnd(), text: `_${node.text}` };
      } else {
        // Object destructuring: keep the property name so callers and the
        // object's shape are unaffected.
        edit = {
          start: node.getStart(sf),
          end: node.getEnd(),
          text: `${node.text}: _${node.text}`,
        };
      }
    }
  }

  if (!edit) {
    skipped += 1;
    continue;
  }

  if (!editsByFile.has(sf.fileName)) editsByFile.set(sf.fileName, []);
  editsByFile.get(sf.fileName).push(edit);
}

let changedFiles = 0;
let changedIdents = 0;

for (const [fileName, edits] of editsByFile) {
  // Apply back-to-front so earlier offsets stay valid.
  edits.sort((a, b) => b.start - a.start);
  let text = readFileSync(fileName, 'utf8');
  for (const e of edits) {
    text = text.slice(0, e.start) + e.text + text.slice(e.end);
  }
  if (!DRY) writeFileSync(fileName, text);
  changedFiles += 1;
  changedIdents += edits.length;
}

console.log(
  `${DRY ? '[dry run] ' : ''}renamed ${changedIdents} parameter(s) across ${changedFiles} file(s); skipped ${skipped} non-parameter diagnostic(s)`
);

function findNodeAt(sourceFile, pos) {
  let found = null;
  (function visit(node) {
    if (node.getStart(sourceFile) === pos && ts.isIdentifier(node)) {
      found = node;
      return;
    }
    if (pos >= node.getStart(sourceFile) && pos < node.getEnd()) {
      ts.forEachChild(node, visit);
    }
  })(sourceFile);
  return found;
}

function isInsideParameterBindingPattern(bindingElement) {
  let n = bindingElement.parent; // ObjectBindingPattern / ArrayBindingPattern
  while (n && (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n) || ts.isBindingElement(n))) {
    n = n.parent;
  }
  return !!n && ts.isParameter(n);
}
