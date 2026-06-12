import { AssumptionEngine } from './AssumptionEngine';

function benchmark() {
  console.log('--- AssumptionEngine Performance Audit ---');

  // Setup
  AssumptionEngine.clear();
  const categories: Array<'revenue' | 'cost' | 'rate' | 'macro' | 'operational'> = [
    'revenue',
    'cost',
    'rate',
    'macro',
    'operational',
  ];
  for (let i = 0; i < 100; i++) {
    AssumptionEngine.create({
      name: `Assumption ${i}`,
      value: Math.random(),
      unit: 'count',
      category: categories[i % 5]!,
      source: 'benchmark',
      effectiveFrom: '2026-01',
      effectiveTo: '2026-12',
    });
  }

  const iterations = 1_000_000;

  // Benchmark getAll
  let start = performance.now();
  for (let i = 0; i < iterations; i++) {
    AssumptionEngine.getAll();
  }
  let end = performance.now();
  console.log(`getAll (${iterations} iterations): ${(end - start).toFixed(2)}ms`);

  // Benchmark getByCategory
  start = performance.now();
  for (let i = 0; i < iterations; i++) {
    AssumptionEngine.getByCategory('revenue');
  }
  end = performance.now();
  console.log(`getByCategory (${iterations} iterations): ${(end - start).toFixed(2)}ms`);
}

benchmark();
