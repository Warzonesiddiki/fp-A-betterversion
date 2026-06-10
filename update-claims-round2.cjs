const fs = require('fs');
const path = require('path');

const boardPath = path.join('docs', 'task-board.json');
const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

const assignments = [
  { agent: 'atlas', tasks: ['T00767'] },
  { agent: 'babbage', tasks: ['T00079', 'T00080'] },
  { agent: 'lovelace', tasks: ['T00039', 'T00040'] },
  { agent: 'mccarthy', tasks: ['T00104', 'T00105'] },
  { agent: 'brutus', tasks: ['T00007', 'T00008'] },
  { agent: 'cobalt', tasks: ['T00005', 'T00009'] },
  { agent: 'mary', tasks: ['T00010', 'T00014'] },
  { agent: 'john', tasks: ['T00012'] } // T02544 already inProgress
];

assignments.forEach(a => {
  a.tasks.forEach(taskId => {
    const task = board.queue.find(t => t.id === taskId);
    if (task) {
      task.status = 'inProgress';
      task.claimedBy = `bmad-agent-${a.agent}`;
    }
  });
});

board.lastUpdated = new Date().toISOString();
fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
console.log('Task board updated with next round of assignments.');
