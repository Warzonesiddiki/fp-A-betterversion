const fs = require('fs');
const path = require('path');

const tasks = [];
let id = 0;

const add = (cat, title, role, priority, spec, deps=[]) => {
  tasks.push({
    id: 'T' + String(++id).padStart(5,'0'),
    cat, title, role, priority, spec, deps,
    status: 'unclaimed', claimedBy: '',
    createdAt: new Date().toISOString()
  });
};

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = fs.statSync(dirFile).isDirectory() ? walkSync(dirFile, filelist) : filelist.concat(dirFile);
    } catch (err) {
      if (err.code === 'ENOENT' || err.code === 'EPERM' || err.code === 'EACCES') {}
    }
  });
  return filelist;
};

const allFiles = walkSync('src');
const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

const engines = tsFiles.filter(f => f.includes('engines') && !f.includes('.test.'));
const components = tsFiles.filter(f => f.includes('components') && f.endsWith('.tsx') && !f.includes('.test.'));
const stores = tsFiles.filter(f => f.includes('store') && !f.includes('.test.'));
const pages = tsFiles.filter(f => f.includes('pages') && f.endsWith('.tsx') && !f.includes('.test.'));
const workers = tsFiles.filter(f => f.includes('workers') && !f.includes('.test.'));

// 1. ENGINE PERFECTION
engines.forEach(f => {
  const name = path.basename(f, '.ts');
  add('eng', `${name} 100% Branch Coverage`, 'cobalt', 90, `Write exhaustive tests for ${f} achieving 100% branch/line coverage.`);
  add('eng', `${name} Known-Answer Standards`, 'mary', 85, `Add exact FASB/IAS/GAAP mathematical match tests for ${name}.`);
  add('eng', `${name} 0x Any / Strict Types`, 'brutus', 95, `Eliminate all implicit/explicit any in ${f}. Use robust generics.`);
  add('eng', `${name} Perf Audit 1M loops`, 'brutus', 80, `Benchmark ${name} for 1M iterations. Optimize array allocations.`);
});

// 2. COMPONENT PERFECTION
components.forEach(f => {
  const name = path.basename(f, '.tsx');
  add('ui', `${name} WCAG 2.2 AA Keyboard Nav`, 'sally', 95, `Ensure ${f} is fully navigable by keyboard (tabindex, focus trap).`);
  add('ui', `${name} ARIA roles & Contrast`, 'sally', 90, `Audit ${f} for 4.5:1 contrast and correct ARIA labels.`);
  add('ui', `${name} React.memo/useMemo optimization`, 'atlas', 75, `Prevent unnecessary renders in ${f} using profiling.`);
  add('ui', `${name} RTL/Vitest coverage`, 'cobalt', 85, `Achieve 80%+ interaction coverage for ${f} using testing-library.`);
});

// 3. STORE PERFECTION
stores.forEach(f => {
  const name = path.basename(f, '.ts');
  add('store', `${name} CWE-922 Encryption Check`, 'censor', 99, `Ensure ${f} does not leak PII to plain localStorage. Use encryptStorage.`);
  add('store', `${name} Immer Mutability Strict`, 'amelia', 85, `Verify ${f} uses draft mutations correctly with no state leaks.`);
  add('store', `${name} OPFS/Debounce logic`, 'atlas', 80, `Ensure ${f} debounce saves to OPFS atomically to prevent corruption.`);
});

// 4. PAGE PERFECTION
pages.forEach(f => {
  const name = path.basename(f, '.tsx');
  add('page', `${name} Playwright E2E User Flow`, 'mary', 85, `Write E2E test in tests/ covering critical path for ${name}.`);
  add('page', `${name} ErrorBoundary isolation`, 'paige', 80, `Ensure ${name} gracefully catches crashes without bringing down app.`);
  add('page', `${name} Suspense / Lazy loading`, 'atlas', 75, `Check Vite chunk splitting for ${name} to keep main bundle < 150kb.`);
});

// 5. WORKER PERFECTION
workers.forEach(f => {
  const name = path.basename(f, '.ts');
  add('worker', `${name} Memory Leak Audit`, 'atlas', 90, `Stress test ${name} for uncollected objects and detached listeners.`);
  add('worker', `${name} Structured Clone Error check`, 'paige', 85, `Ensure messages to ${name} are cloneable and caught if failed.`);
});

// 6. GLOBAL GATES
add('gates', 'Global: 0 TSC Errors', 'brutus', 100, 'node node_modules/typescript/bin/tsc --noEmit must pass with 0 errors.');
add('gates', 'Global: 0 ESLint Warnings', 'amelia', 100, 'eslint src --max-warnings 0. Fix exhaustive-deps and jsx-a11y.');
add('gates', 'Global: Bundle < 150KB gzip', 'john', 95, 'Ensure initial load bundle is minimal. Check vite rollup config.');
add('gates', 'Global: All Tests Green', 'cobalt', 100, 'vitest run must execute perfectly with 0 fails.');

// 7. SECURITY & ARCHITECTURE
add('sec', 'Audit all package-lock.json deps', 'censor', 95, 'Check for high/critical vulnerabilities via npm audit.');
add('sec', 'Plugin Sandbox Escape Test', 'sentinel', 100, 'Aggressively try to escape the 3-layer iframe/worker sandbox.');
add('arch', 'Remove duplicated engines', 'ada', 90, 'Identify and merge the 181 duplicated logic files in engines/.');

const board = {
  version: 6,
  lastUpdated: new Date().toISOString(),
  totalTasks: tasks.length,
  completed: 0,
  inProgress: 0,
  queue: tasks
};

fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
console.log(`Generated ${tasks.length} highly targeted perfection tasks mapped to exact source files.`);
