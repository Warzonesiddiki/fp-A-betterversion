// =============================================================================
// AIEngine performance audit (mocked ML)
// =============================================================================
// This bench measures AIEngine.detectAnomalies batching overhead — NOT real
// model inference — so the transformers pipeline is mocked.
//
// The previous version assigned `(AIEngine as any).pipeline` and
// `transformersAvailable`, neither of which exists: `pipeline` is a
// module-level binding inside AIEngine.ts, not a static class field. The real
// `loadTransformers()` therefore still ran, tried to fetch a remote model, and
// every run failed with "All devices failed to initialize classifier".
//
// We now mock the module itself (same approach as AIEngine.test.ts), which is
// what actually intercepts the pipeline.
// =============================================================================

import { describe, it, vi, beforeEach, expect } from 'vitest';

const mockPipeline = vi.fn();

vi.mock('@huggingface/transformers', () => ({
  pipeline: mockPipeline,
  env: {
    allowRemoteModels: true,
    useBrowserCache: true,
  },
}));

// Import after the mock is registered.
const { AIEngine } = await import('./AIEngine');

describe('AIEngine Performance Audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the engine's memoized pipeline instances between runs.
    (AIEngine as any).classifier = null;
    (AIEngine as any).extractor = null;
    (AIEngine as any).device = 'unknown';

    const classifier = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.99 }]);
    mockPipeline.mockResolvedValue(classifier);
  });

  it('Benchmark detectAnomalies for 1,000 iterations (Mocked ML)', async () => {
    const count = 1000;
    const descriptions = Array.from({ length: count }, (_, i) => `Transaction ${i}`);

    const start = performance.now();
    const results = await AIEngine.detectAnomalies(descriptions, 100);
    const elapsed = performance.now() - start;

    expect(results).toHaveLength(count);
    console.log(`AIEngine: Processed ${count} transactions in ${elapsed.toFixed(2)}ms`);
  });

  it('Benchmark detectAnomalies for 10,000 iterations (Mocked ML)', async () => {
    const count = 10000;
    const descriptions = Array.from({ length: count }, (_, i) => `Transaction ${i}`);

    const start = performance.now();
    const results = await AIEngine.detectAnomalies(descriptions, 500);
    const elapsed = performance.now() - start;

    expect(results).toHaveLength(count);
    console.log(`AIEngine: Processed ${count} transactions in ${elapsed.toFixed(2)}ms`);
  });
});
