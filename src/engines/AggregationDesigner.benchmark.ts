import { describe, bench } from 'vitest';
import { AggregationDesigner } from './AggregationDesigner';

describe('AggregationDesigner Benchmark', () => {
  const designer = new AggregationDesigner();
  const def = designer.define(
    'LargeAgg',
    'finance',
    ['Region', 'Product', 'Entity'],
    ['Revenue'],
    'sum'
  );

  const cells = new Map<string, number>();
  for (let i = 0; i < 1000; i++) {
    cells.set(
      `cube=finance|Region=Region${i % 10}|Product=Product${i % 5}|Entity=E${i % 2}|measure=Revenue`,
      i
    );
  }

  bench('materialize 1M iterations total (batch of 1k x 1k)', () => {
    // We simulate 1M iterations by materializing 1000 times a 1000-cell map
    for (let i = 0; i < 1000; i++) {
      designer.materialize(def.id, cells);
    }
  });

  bench('query 1M times', () => {
    designer.materialize(def.id, cells);
    for (let i = 0; i < 1000000; i++) {
      designer.query(def.id, { Region: 'Region1' });
    }
  });
});
