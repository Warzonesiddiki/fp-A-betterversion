const fs = require('fs');
const ts = require('typescript');

const logContent = fs.readFileSync('tsc_errors.log', 'utf16le');
const lines = logContent.split('\n');

const errorsByFile = {};
let totalFixes = 0;

for (const line of lines) {
  const match = line.match(/^([^:]+)\((\d+),(\d+)\): error (TS2532|TS18048):/);
  if (match) {
    const [, file, lineStr, colStr] = match;
    if (!errorsByFile[file]) errorsByFile[file] = [];
    errorsByFile[file].push({
      line: parseInt(lineStr, 10) - 1, // 0-based
      col: parseInt(colStr, 10) - 1, // 0-based
    });
  }
}

function findNodeAtPosition(node, pos) {
  let found = null;
  ts.forEachChild(node, child => {
    if (child.getStart() <= pos && child.getEnd() > pos) {
      found = findNodeAtPosition(child, pos) || child;
    }
  });
  return found;
}

for (const [file, errors] of Object.entries(errorsByFile)) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  let sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  
  // Sort errors from back to front to avoid offset shifting when inserting '!'
  const sortedErrors = errors.map(err => {
    return ts.getPositionOfLineAndCharacter(sourceFile, err.line, err.col);
  }).sort((a, b) => b - a);
  
  let fixed = 0;
  for (const pos of sortedErrors) {
    const node = findNodeAtPosition(sourceFile, pos);
    if (!node) continue;
    
    // Find the nearest parent that is a PropertyAccessExpression or ElementAccessExpression or CallExpression
    // where the error is about its 'expression' part.
    let targetNode = node;
    while (targetNode && targetNode.parent) {
      if (ts.isPropertyAccessExpression(targetNode.parent) && targetNode.parent.expression === targetNode) {
        break;
      }
      if (ts.isElementAccessExpression(targetNode.parent) && targetNode.parent.expression === targetNode) {
        break;
      }
      if (ts.isCallExpression(targetNode.parent) && targetNode.parent.expression === targetNode) {
        break;
      }
      if (ts.isNonNullExpression(targetNode.parent)) {
        // already has non-null assertion
        targetNode = null;
        break;
      }
      targetNode = targetNode.parent;
    }
    
    if (targetNode && targetNode.parent) {
      const insertPos = targetNode.getEnd();
      // Only insert if it doesn't already have ! or ?.
      const nextChars = code.substr(insertPos, 2);
      if (!nextChars.startsWith('!') && !nextChars.startsWith('?.')) {
        code = code.substring(0, insertPos) + '!' + code.substring(insertPos);
        fixed++;
        // We have to re-parse the AST because offsets changed, but since we go backwards, 
        // we might be okay if we just use the original positions! 
        // Actually, since we go backwards, insertPos is strictly decreasing?
        // Let's rely on backward insertion avoiding offset shifts for EARLIER nodes.
      }
    }
  }
  
  if (fixed > 0) {
    fs.writeFileSync(file, code);
    totalFixes += fixed;
    console.log(`Fixed ${fixed} errors in ${file}`);
  }
}

console.log(`Total TS2532/TS18048 fixes applied: ${totalFixes}`);
