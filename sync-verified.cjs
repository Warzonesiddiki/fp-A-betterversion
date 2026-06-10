const fs = require('fs');
const path = require('path');

const boardPath = path.join('docs', 'task-board.json');
const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

const completed = [
  'T00025', 'T01832', 'T00771', 'T00043', 'T00059', 'T00071', 'T00117', 'T00118',
  'T00037', 'T00038', 'T00077', 'T00078', 'T00102', 'T00103', 'T00003', 'T00004',
  'T00001', 'T00002', 'T00006',
  'T00775', 'T00779', // Atlas
  'T00015',           // John
  'T00026', 'T00027', 'T00028' // Vera
];

let count = 0;
completed.forEach(taskId => {
  const task = board.queue.find(t => t.id === taskId);
  if (task && task.status !== 'completed') {
    task.status = 'completed';
    count++;
  }
});

board.completed += count;
board.inProgress -= count;
board.lastUpdated = new Date().toISOString();

fs.writeFileSync(boardPath, JSON.stringify(board, null, 2));
console.log(`Marked ${count} verified tasks as completed. Total completed: ${board.completed}`);
