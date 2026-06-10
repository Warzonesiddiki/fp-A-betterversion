const fs = require('fs');

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

const roles = ['brutus', 'amelia', 'censor', 'atlas', 'cobalt', 'mary', 'sally', 'john', 'winston', 'paige', 'vera'];

// Generate 1000 Engine tasks
for (let i = 1; i <= 200; i++) {
  add('eng', `Engine_${i} unit test`, 'cobalt', 80, `Write full branch coverage for engine ${i}`);
  add('eng', `Engine_${i} known-answer`, 'mary', 70, `FASB/IAS exact value match for engine ${i}`);
  add('eng', `Engine_${i} perf audit`, 'brutus', 85, `1M iterations benchmark for engine ${i}`);
  add('eng', `Engine_${i} refactor`, 'amelia', 60, `Simplify cognitive complexity for engine ${i}`);
  add('eng', `Engine_${i} types`, 'brutus', 95, `Strict typing no any for engine ${i}`);
}

// Generate 1000 UI Component tasks
for (let i = 1; i <= 200; i++) {
  add('ui', `Component_${i} a11y`, 'sally', 90, `WCAG 2.2 AA check for comp ${i}`);
  add('ui', `Component_${i} storybook`, 'mary', 50, `Create stories for comp ${i}`);
  add('ui', `Component_${i} test`, 'cobalt', 80, `Vitest render/event check comp ${i}`);
  add('ui', `Component_${i} memo`, 'atlas', 75, `React.memo / useMemo audit comp ${i}`);
  add('ui', `Component_${i} contrast`, 'sally', 85, `Color contrast 4.5:1 comp ${i}`);
}

// Generate 1000 Lint/TS tasks
for (let i = 1; i <= 500; i++) {
  add('lint', `File_Batch_${i} eslint`, 'amelia', 70, `Fix all eslint warnings batch ${i}`);
  add('tsc', `File_Batch_${i} strict`, 'brutus', 90, `Resolve tsc errors batch ${i}`);
}

// Generate 500 Security tasks
for (let i = 1; i <= 166; i++) {
  add('sec', `Sec_Module_${i} CWE audit`, 'censor', 95, `Check CWE vulnerabilities module ${i}`);
  add('sec', `Sec_Module_${i} sanitize`, 'censor', 90, `Input validation module ${i}`);
  add('sec', `Sec_Module_${i} crypto`, 'censor', 85, `Encryption verify module ${i}`);
}

// Generate 500 Store tasks
for (let i = 1; i <= 125; i++) {
  add('store', `Store_${i} encryption`, 'censor', 95, `CWE-922 check store ${i}`);
  add('store', `Store_${i} tests`, 'cobalt', 80, `Action coverage store ${i}`);
  add('store', `Store_${i} OPFS`, 'atlas', 70, `Persistence debounce store ${i}`);
  add('store', `Store_${i} undo/redo`, 'amelia', 65, `Immer history check store ${i}`);
}

// Generate 400 Page tasks
for (let i = 1; i <= 80; i++) {
  add('page', `Page_${i} lazy load`, 'atlas', 75, `React.lazy boundary page ${i}`);
  add('page', `Page_${i} e2e`, 'mary', 85, `Playwright full flow page ${i}`);
  add('page', `Page_${i} a11y`, 'sally', 90, `Keyboard nav page ${i}`);
  add('page', `Page_${i} mobile`, 'sally', 60, `Responsive layout page ${i}`);
  add('page', `Page_${i} error bound`, 'paige', 80, `Crash recovery page ${i}`);
}

// Generate 100 Worker tasks
for (let i = 1; i <= 25; i++) {
  add('worker', `Worker_${i} memory`, 'atlas', 90, `Leak check worker ${i}`);
  add('worker', `Worker_${i} error`, 'paige', 85, `Message fallback worker ${i}`);
  add('worker', `Worker_${i} throughput`, 'brutus', 80, `Perf max batch worker ${i}`);
  add('worker', `Worker_${i} e2e`, 'mary', 75, `Full lifecycle worker ${i}`);
}

const board = {
  version: 5,
  lastUpdated: new Date().toISOString(),
  totalTasks: tasks.length,
  completed: 0,
  inProgress: 0,
  queue: tasks
};

fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
console.log(`Generated ${tasks.length} tasks and saved to docs/task-board.json`);
