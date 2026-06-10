// wave02 setup: pick 2,500 unclaimed tasks, pre-claim across 50 agents, write manifests
const fs = require('fs');
const path = require('path');

const board = JSON.parse(fs.readFileSync('docs/task-board.json', 'utf8'));
const manifestDir = 'agent_runs/wave02';
fs.mkdirSync(manifestDir, { recursive: true });

// Pick 2,500 unclaimed tasks - prefer cats with file-targetable work
const PREFERRED_CATS = ['eng', 'test', 'store', 'perf', 'sec', 'a11y', 'err', 'arch'];
const TARGET = 2500;
const TASKS_PER_AGENT = 50;
const AGENT_COUNT = 50;

const unclaimed = board.queue.filter(t => t.status === 'unclaimed');
const selected = [];

// Try preferred categories first, then fill from rest
for (const cat of PREFERRED_CATS) {
  const catTasks = unclaimed.filter(t => t.cat === cat);
  for (const t of catTasks) {
    if (selected.length >= TARGET) break;
    selected.push(t);
  }
}
if (selected.length < TARGET) {
  for (const t of unclaimed) {
    if (selected.length >= TARGET) break;
    if (!selected.includes(t)) selected.push(t);
  }
}

const sliced = selected.slice(0, TARGET);
const now = new Date().toISOString();
let claimed = 0;

for (let i = 0; i < AGENT_COUNT; i++) {
  const agentName = `agent-${String(i + 1).padStart(2, '0')}`;
  const agentTasks = sliced.slice(i * TASKS_PER_AGENT, (i + 1) * TASKS_PER_AGENT);
  if (agentTasks.length === 0) continue;

  // Write manifest
  const manifest = {
    agent: agentName,
    wave: 'wave02',
    taskCount: agentTasks.length,
    tasks: agentTasks.map(t => ({ id: t.id, cat: t.cat, title: t.title, spec: t.spec })),
    createdAt: now,
  };
  fs.writeFileSync(path.join(manifestDir, `${agentName}.json`), JSON.stringify(manifest, null, 2));

  // Pre-claim on board
  for (const task of agentTasks) {
    const idx = board.queue.findIndex(q => q.id === task.id);
    if (idx !== -1) {
      board.queue[idx].status = 'inProgress';
      board.queue[idx].claimedBy = agentName;
      board.queue[idx].claimedAt = now;
      claimed++;
    }
  }
}

board.lastUpdated = now;
board.inProgress = board.queue.filter(t => t.status === 'inProgress').length;
board.completed = board.queue.filter(t => t.status === 'completed').length;

fs.writeFileSync('docs/task-board.json', JSON.stringify(board, null, 2));
console.log(`pre-claimed ${claimed} tasks across ${AGENT_COUNT} agents`);
console.log(`manifests at ${manifestDir}/agent-NN.json`);
console.log(`board: ${board.completed} done, ${board.inProgress} in progress, ${board.queue.length - board.completed - board.inProgress} unclaimed`);
