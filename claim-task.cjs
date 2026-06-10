const fs = require('fs');
const board = JSON.parse(fs.readFileSync('docs/task-board.json'));
const agentName = process.argv[2] || 'opencode';
const task = board.queue.find(t => t.status === 'unclaimed');
if (task) {
  task.status = 'inProgress';
  task.claimedBy = agentName;
  fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
  
  const memPath = 'docs/agent-shared-memory.json';
  let memory = fs.existsSync(memPath) ? fs.readFileSync(memPath, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : [];
  memory.push({ ts: new Date().toISOString(), agent: agentName, kind: 'CLAIM', msg: `Claimed ${task.id}: ${task.title}`, tokens: 50 });
  fs.writeFileSync(memPath, memory.map(m => JSON.stringify(m)).join('\n') + '\n');
  
  console.log(JSON.stringify(task, null, 2));
} else {
  console.log('No unclaimed tasks.');
}
