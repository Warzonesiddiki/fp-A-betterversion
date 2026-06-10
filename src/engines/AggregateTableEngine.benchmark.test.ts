import { describe, it } from 'vitest';
import { AggregateTableEngine } from './AggregateTableEngine';

describe('AggregateTableEngine Benchmark', () => {
  it('should handle 1M aggregations', () => {
    const iterations = 1_000_000;
    const data = Array.from({ length: 1000 }, (_, i) => ({
      entityId: `E${i % 10}`,
      accountId: `A${i % 50}`,
      period: `2026-${String((i % 12) + 1).padStart(2, '0')}`,
      debit: Math.random() * 1000,
      credit: Math.random() * 500,
    }));

    console.time('1M Aggregations');
    for (let i = 0; i < iterations / 1000; i++) {
      AggregateTableEngine.aggregate(data, 'monthly');
    }
    console.timeEnd('1M Aggregations');

    const stats = AggregateTableEngine.getStats();
    console.log('Final Stats:', stats);
  });

  it('should handle 100k range queries', () => {
    const iterations = 100_000;
    console.time('100k Range Queries');
    for (let i = 0; i < iterations; i++) {
      AggregateTableEngine.queryRange('E1', 'A1', '2026-01', '2026-12', 'monthly');
    }
    console.timeEnd('100k Range Queries');
  });
});
