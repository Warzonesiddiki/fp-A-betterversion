import { AdvancedOLAPEngine } from './AdvancedOLAPEngine';

const engine = new AdvancedOLAPEngine();

// Setup mock data
for (let i = 0; i < 1000; i++) {
  engine.addMember({
    id: `m${i}`,
    name: `Member ${i}`,
    dimensionId: 'd1',
    parentId: i === 0 ? null : `m${Math.floor(i / 10)}`,
    level: Math.floor(Math.log10(i + 1)),
    properties: {},
  });
}

const start = performance.now();
for (let i = 0; i < 1000000; i++) {
  engine.getMember(`m${i % 1000}`);
}
const end = performance.now();

console.log(`1M lookups: ${end - start}ms`);

const startQuery = performance.now();
for (let i = 0; i < 10000; i++) {
  engine.executeQuery({
    rows: [`[m${i % 100}]`],
    columns: [`[m${(i + 1) % 100}]`],
  });
}
const endQuery = performance.now();
console.log(`10k queries: ${endQuery - startQuery}ms`);
