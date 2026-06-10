import { describe, it, expect } from 'vitest';
import { CellAuditTrailEngine } from './CellAuditTrailEngine';

describe('CellAuditTrailEngine Performance Benchmark', () => {
  it('should process 1M iterations rapidly in bulk', () => {
    const engine = new CellAuditTrailEngine();
    engine.setRetentionConfig({ retentionDays: 999999 });

    const total = 1000000;
    const batchSize = 100000;
    const batches = total / batchSize;

    const start = performance.now();

    for (let i = 0; i < batches; i++) {
      const entries = new Array(batchSize);
      for (let j = 0; j < batchSize; j++) {
        entries[j] = {
          cellId: `A${j}`,
          oldValue: j,
          newValue: j + 1,
        };
      }
      engine.recordBulk(entries, 'perf-user', 'Perf User', 'bulk update');
    }

    const end = performance.now();
    const duration = end - start;

    console.log(`1M records inserted in ${duration.toFixed(2)}ms`);
    expect(engine.getEntryCount()).toBe(total);
    // Expect 1M records to take less than 5000ms
    expect(duration).toBeLessThan(5000);
  });
});
