/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, vi, beforeEach } from 'vitest';
import { AIEngine } from './AIEngine';

describe('AIEngine Performance Audit', () => {
  const mockPipeline = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (AIEngine as any).classifier = null;
    (AIEngine as any).pipeline = mockPipeline;
    (AIEngine as any).transformersAvailable = true;

    mockPipeline.mockImplementation(() => {
      const classifier = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.99 }]);
      return Promise.resolve(classifier);
    });
  });

  it('Benchmark detectAnomalies for 1,000 iterations (Mocked ML)', async () => {
    const count = 1000;
    const descriptions = Array.from({ length: count }, (_, i) => `Transaction ${i}`);

    const start = performance.now();
    await AIEngine.detectAnomalies(descriptions, 100);
    const end = performance.now();

    console.log(`AIEngine: Processed ${count} transactions in ${end - start}ms`);
  });

  it('Benchmark detectAnomalies for 10,000 iterations (Mocked ML)', async () => {
    const count = 10000;
    const descriptions = Array.from({ length: count }, (_, i) => `Transaction ${i}`);

    const start = performance.now();
    await AIEngine.detectAnomalies(descriptions, 500);
    const end = performance.now();

    console.log(`AIEngine: Processed ${count} transactions in ${end - start}ms`);
  });
});
