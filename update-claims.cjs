const fs = require('fs');
const path = require('path');

const boardPath = path.join('docs', 'task-board.json');
const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

const assignments = [
  { agent: 'brutus', tasks: ['T00003', 'T00004'] },
  { agent: 'censor', tasks: ['T01825', 'T01828'] },
  { agent: 'amelia', tasks: ['T01826', 'T01829'] },
  { agent: 'atlas', tasks: ['T00763'] },
  { agent: 'cobalt', tasks: ['T00001', 'T00005'] },
  { agent: 'mary', tasks: ['T00002', 'T00006'] },
  { agent: 'sally', tasks: ['T00761', 'T00762'] },
  { agent: 'john', tasks: ['T02544', 'T00012'] },
  { agent: 'winston', tasks: ['T00020', 'T00021'] },
  { agent: 'paige', tasks: ['T01943', 'T01946'] },
  { agent: 'vera', tasks: ['T00025', 'T00026'] },
  { agent: 'sentinel', tasks: ['T02547', 'T02552'] },
  { agent: 'ada', tasks: ['T02548', 'T00033'] },
  { agent: 'lovelace', tasks: ['T00037', 'T00038'] },
  { agent: 'turing', tasks: ['T00042', 'T00043'] },
  { agent: 'hopper', tasks: ['T00047', 'T00048'] },
  { agent: 'dijkstra', tasks: ['T00052', 'T00053'] },
  { agent: 'feynman', tasks: ['T00057', 'T00058'] },
  { agent: 'knuth', tasks: ['T00062', 'T00063'] },
  { agent: 'torvalds', tasks: ['T00067', 'T00068'] },
  { agent: 'hamilton', tasks: ['T00072', 'T00073'] },
  { agent: 'babbage', tasks: ['T00077', 'T00078'] },
  { agent: 'nash', tasks: ['T00082', 'T00083'] },
  { agent: 'vonneumann', tasks: ['T00087', 'T00088'] },
  { agent: 'shannon', tasks: ['T00092', 'T00093'] },
  { agent: 'liskov', tasks: ['T00097', 'T00098'] },
  { agent: 'mccarthy', tasks: ['T00102', 'T00103'] },
  { agent: 'lamport', tasks: ['T00107', 'T00108'] },
  { agent: 'engelbart', tasks: ['T00112', 'T00113'] },
  { agent: 'cerf', tasks: ['T00117', 'T00118'] }
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
console.log('Task board updated with 30 assignments.');
