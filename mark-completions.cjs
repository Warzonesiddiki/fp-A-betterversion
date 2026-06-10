const fs = require('fs');
const path = require('path');

const boardPath = path.join('docs', 'task-board.json');
const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

const completed = ['T00763', 'T00077', 'T00078', 'T00037', 'T00038', 'T00102', 'T00103', 'T00003', 'T00004', 'T00001', 'T00002', 'T00006'];

completed.forEach(taskId => {
  const task = board.queue.find(t => t.id === taskId);
  if (task) {
    task.status = 'completed';
    // claimedBy remains the same
  }
});

board.completed += completed.length;
board.inProgress -= completed.length;
board.lastUpdated = new Date().toISOString();

fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
console.log(`Marked ${completed.length} tasks as completed.`);
