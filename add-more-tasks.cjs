const fs = require('fs');
const board = JSON.parse(fs.readFileSync('docs/task-board.json'));
let id = parseInt(board.queue[board.queue.length-1].id.substring(1), 10);
const add = (cat, title, role, priority, spec) => {
  board.queue.push({ id: 'T' + String(++id).padStart(5,'0'), cat, title, role, priority, spec, deps: [], status: 'unclaimed', claimedBy: '', createdAt: new Date().toISOString() });
};

// Architecture & Security Deep Dive
add('arch', 'Circular Dep Audit', 'brutus', 95, 'npx madge --circular src');
add('arch', 'Dead Code Elimination', 'amelia', 80, 'ts-prune src');
add('sec', 'Tauri IPC fuzzing', 'censor', 99, 'Fuzz tauri invoke commands');
add('sec', 'Zod exhaustiveness', 'sentinel', 95, 'Verify all inputs parsed via Zod');
add('sec', 'CWE-1321 Prototype Pollution', 'censor', 95, 'Audit deepmerge/lodash usages');
add('sec', 'CWE-79 XSS sink check', 'censor', 95, 'Audit all raw HTML sets');
add('perf', 'Web Worker Latency', 'atlas', 90, 'Round-trip msg < 5ms');

// Scale Perf & E2E
for(let i=1; i<=250; i++) add('perf', `Render profile chunk ${i}`, 'atlas', 85, `React Profiler 16ms budget chunk ${i}`);
for(let i=1; i<=250; i++) add('e2e', `Playwright edge case ${i}`, 'mary', 80, `E2E stress test matrix ${i}`);

board.totalTasks = board.queue.length;
fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
console.log(`Tasks ++. Total: ${board.totalTasks}`);
