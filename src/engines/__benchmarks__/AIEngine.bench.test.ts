import { describe, it, expect, vi, beforeAll } from 'vitest';
import { AIEngine } from '../AIEngine';

// Mock transformers to avoid loading 23MB models in test env
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(() =>
    Object.assign(async () => [{ label: 'POSITIVE', score: 0.99 }], { dispose: async () => {} })
  ),
  env: {
    allowRemoteModels: true,
    useBrowserCache: true,
  },
}));

describe('AIEngine Benchmarks', () => {
  beforeAll(async () => {
    await AIEngine.init();
  });

  it('benchmarks single transaction classification', async () => {
    const start = performance.now();
    await AIEngine.classifyTransaction('Office supplies for New York office');
    const end = performance.now();
    console.log(`Single classification: ${end - start}ms`);
    expect(end - start).toBeLessThan(1000); // Should be very fast with mock
  });

  it('benchmarks large dataset anomaly detection (1000 items)', async () => {
    const dataset = Array.from(
      { length: 1000 },
      (_, i) => `Transaction ${i}: Purchase of equipment`
    );

    const start = performance.now();
    const results = await AIEngine.detectAnomalies(dataset);
    const end = performance.now();

    console.log(`Anomaly detection (1000 items): ${end - start}ms`);
    console.log(`Average per item: ${(end - start) / 1000}ms`);

    expect(results).toHaveLength(1000);
    expect(end - start).toBeLessThan(5000); // Expect sequential processing to be reasonably fast
  });

  it('benchmarks large dataset anomaly detection with parallel batches (1000 items)', async () => {
    const dataset = Array.from(
      { length: 1000 },
      (_, i) => `Transaction ${i}: Purchase of equipment`
    );

    const start = performance.now();
    const results = await AIEngine.detectAnomalies(dataset, 50); // Larger batch size
    const end = performance.now();

    console.log(`Parallel Anomaly detection (1000 items, batch=50): ${end - start}ms`);
    console.log(`Average per item: ${(end - start) / 1000}ms`);

    expect(results).toHaveLength(1000);
    expect(end - start).toBeLessThan(2000); // Should be faster than sequential
  });
});
