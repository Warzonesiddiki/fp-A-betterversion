const fs = require('fs');
const board = JSON.parse(fs.readFileSync('docs/task-board.json'));
const memPath = 'docs/agent-shared-memory.json';
let memory = fs.existsSync(memPath) ? fs.readFileSync(memPath, 'utf8').split('\n').filter(Boolean).map(JSON.parse) : [];

const agents = ['brutus','censor','amelia','atlas','cobalt','mary','sally','john','winston','paige','vera','sentinel','ada','lovelace','turing','hopper','dijkstra','feynman','knuth','torvalds','hamilton','babbage','nash','vonneumann','shannon','liskov','mccarthy','lamport','engelbart','cerf'];

let claimed = 0;
agents.forEach(agent => {
  let tasks = board.queue.filter(t => t.status === 'unclaimed' && t.role === agent).slice(0, 1);
  if (tasks.length < 1) {
    const fallback = board.queue.filter(t => t.status === 'unclaimed' && t.claimedBy === '').slice(0, 1 - tasks.length);
    tasks = tasks.concat(fallback);
  }
  
  tasks.forEach(t => {
    t.status = 'inProgress';
    t.claimedBy = agent;
    memory.push({ ts: new Date().toISOString(), agent, kind: 'CLAIM', msg: `Claimed ${t.id}: ${t.title}`, tokens: 45 });
    claimed++;
  });
});

board.inProgress += claimed;
fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
fs.writeFileSync(memPath, memory.map(m => JSON.stringify(m)).join('\n') + '\n');
console.log(`Swarm LIVE. 30 agents claimed ${claimed} tasks. Shared mem synced.`);
