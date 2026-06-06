const fs = require('fs');

// Mark task complete
const board = JSON.parse(fs.readFileSync('docs/task-board.json'));
const task = board.queue.find(t => t.id === 'T00123');
if (task) {
  task.status = 'completed';
  board.completed++;
  board.inProgress--;
  fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
}

// Log to memory
const memPath = 'docs/agent-shared-memory.json';
let memory = fs.existsSync(memPath) ? fs.readFileSync(memPath, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : [];
memory.push({ ts: new Date().toISOString(), agent: 'gemini', kind: 'RESULT', msg: 'T00123 fixed (CellValidationEngine strict types/generics implemented)', tokens: 150 });
fs.writeFileSync(memPath, memory.map(m => JSON.stringify(m)).join('\n') + '\n');

console.log('Task T00123 marked complete.');
