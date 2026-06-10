#!/usr/bin/env node
/**
 * Fix destructuring patterns in SafeMathParser.ts
 * const [a, b, c] = args; → const [a, b, c]: [number, number, number] = args;
 * This fixes TS18048 (variable possibly undefined) in destructured assignments.
 */
const fs = require('fs');

const path = "C:\\Users\\Tahir\\Desktop\\frontend that i want\\fp&A\\src\\engines\\SafeMathParser.ts";
let content = fs.readFileSync(path, 'utf8');

// Match: const [var1, var2, ...] = args;
// Replace with: const [var1, var2, ...]: [number, number, ...] = args;
const DESTRUCTURE_RE = /const\s+\[([^\]]+)\]\s*=\s*args;/g;

let count = 0;
content = content.replace(DESTRUCTURE_RE, (match, vars) => {
  const varCount = vars.split(',').length;
  const type = '[' + Array(varCount).fill('number').join(', ') + ']';
  count++;
  return `const [${vars}]: ${type} = args;`;
});

fs.writeFileSync(path, content);
console.log(`Fixed ${count} destructuring patterns`);
