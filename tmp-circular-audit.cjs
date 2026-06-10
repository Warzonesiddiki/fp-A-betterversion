const fs = require('fs');
const path = require('path');

function scanAllImports(dir) {
  const results = {};
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isFile() && /\.(ts|tsx)$/.test(e.name) && !e.name.includes('.test.') && !e.name.includes('.benchmark.')) {
      const content = fs.readFileSync(fp, 'utf8');
      const imports = [];
      const re = /from\s+['"]([^'"]+)['"]/g;
      let m;
      while ((m = re.exec(content)) !== null) {
        imports.push(m[1]);
      }
      results[fp] = imports;
    } else if (e.isDirectory() && e.name !== 'node_modules' && e.name !== '__tests__') {
      Object.assign(results, scanAllImports(fp));
    }
  }
  return results;
}

const root = __dirname + '/src';
const allImports = scanAllImports(root);

// Map file paths to module names
function toModuleName(filePath) {
  return filePath.replace(root + '/', '').replace(/\/index\.(ts|tsx)$/, '').replace(/\.(ts|tsx)$/, '');
}

// Build adjacency list: moduleName -> [targetModuleNames]
const adj = {};
for (const [fp, imports] of Object.entries(allImports)) {
  const from = toModuleName(fp);
  adj[from] = [];
  for (const imp of imports) {
    if (imp.startsWith('@/')) {
      const target = imp.replace('@/', '');
      adj[from].push(target);
    } else if (imp.startsWith('./') || imp.startsWith('../')) {
      const dir = path.dirname(from);
      const target = path.normalize(path.join(dir, imp)).replace(/\\/g, '/');
      adj[from].push(target);
    }
  }
}

// DFS cycle detection with path tracking
const cycles = [];
const maxDepth = 5;

function dfs(start, current, visited, pathSoFar) {
  if (pathSoFar.length > maxDepth) return;
  const targets = adj[current] || [];
  for (const t of targets) {
    if (t === start && pathSoFar.length >= 2) {
      cycles.push([...pathSoFar, t]);
      return;
    }
    if (!visited.has(t) && pathSoFar.length < maxDepth) {
      visited.add(t);
      dfs(start, t, visited, [...pathSoFar, t]);
      visited.delete(t);
    }
  }
}

const allModules = Object.keys(adj);
for (const mod of allModules) {
  const visited = new Set([mod]);
  dfs(mod, mod, visited, [mod]);
}

// Deduplicate
const seen = new Set();
const unique = [];
for (const c of cycles) {
  // Normalize: rotate so smallest element is first, dedup direction
  const sorted = [...c];
  const minIdx = sorted.indexOf(sorted.slice(0, -1).sort()[0]);
  const normalized = [...sorted.slice(minIdx), ...sorted.slice(1, minIdx), sorted[minIdx]];
  const key = normalized.join(' -> ');
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(c);
  }
}

console.log('=== FULL CIRCULAR DEPENDENCY AUDIT (src/) ===');
console.log('Total modules: ' + allModules.length);
console.log('Cycles found: ' + unique.length);
console.log('');

if (unique.length === 0) {
  console.log('NO CIRCULAR DEPENDENCIES DETECTED');
} else {
  for (let i = 0; i < unique.length; i++) {
    console.log('CYCLE ' + (i + 1) + ':');
    console.log('  ' + unique[i].join('\n  -> '));
    console.log('');
  }
}
