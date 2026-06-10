const fs = require('fs');
const path = 'docs/agent-shared-memory.json';
const lines = fs.readFileSync(path, 'utf8').split('\n').filter(Boolean);
const fixed = lines.map(line => {
  try {
    return JSON.parse(line.replace(/\\`/g, '"').replace(/`/g, '"'));
  } catch (e) {
    return null;
  }
}).filter(Boolean);
fs.writeFileSync(path, fixed.map(m => JSON.stringify(m)).join('\n') + '\n');
console.log('Fixed agent-shared-memory.json corruption.');
