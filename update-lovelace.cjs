const fs = require('fs');
const path = require('path');

const memoryPath = path.join(__dirname, 'docs', 'agent-shared-memory.json');
const boardPath = path.join(__dirname, 'docs', 'task-board.json');

// Update shared memory
let memory = fs.readFileSync(memoryPath, 'utf8');
const newEntries = `{"ts":"${new Date().toISOString()}","agent":"lovelace","kind":"RESULT","ref":"T00037","msg":"Completed T00037: AnomalyDetectionEngine 100% Branch Coverage"}
{"ts":"${new Date().toISOString()}","agent":"lovelace","kind":"RESULT","ref":"T00038","msg":"Completed T00038: AnomalyDetectionEngine Known-Answer Standards"}\n`;
fs.writeFileSync(memoryPath, memory + (!memory.endsWith('\n') ? '\n' : '') + newEntries);

// Update task board
let board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
for (const task of board) {
  if (task.id === 'T00037' || task.id === 'T00038') {
    task.status = 'completed';
    task.claimedBy = 'lovelace';
  }
}
fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));

console.log('Updated JSONs');