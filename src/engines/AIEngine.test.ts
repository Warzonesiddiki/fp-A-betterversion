/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @huggingface/transformers
const mockPipeline = vi.fn();
vi.mock('@huggingface/transformers', () => ({
  pipeline: mockPipeline,
  env: {
    allowRemoteModels: true,
    useBrowserCache: true,
  },
}));

// Import after mock setup
const { AIEngine } = await import('./AIEngine');

describe('AIEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset static state
    (AIEngine as any).classifier = null;
    (AIEngine as any).extractor = null;
    (AIEngine as any).device = 'unknown';
  });

  describe('init', () => {
    it('should initialize classifier via pipeline', async () => {
      const mockClassifier = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.99 }]);
      mockPipeline.mockResolvedValue(mockClassifier);

      await AIEngine.init();

      expect(mockPipeline).toHaveBeenCalledWith(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        expect.objectContaining({ device: expect.any(String) })
      );
    });

    it('should not re-initialize if classifier already exists', async () => {
      const mockClassifier = vi.fn();
      mockPipeline.mockResolvedValue(mockClassifier);

      await AIEngine.init();
      await AIEngine.init(); // second call

      expect(mockPipeline).toHaveBeenCalledTimes(1);
    });

    it('should call onProgress callback during initialization', async () => {
      const onProgress = vi.fn();
      const mockClassifier = vi.fn();
      mockPipeline.mockImplementation(async (_task: string, _model: string, options: any) => {
        if (options?.progress_callback) {
          options.progress_callback({ status: 'progress', progress: 50 });
        }
        return mockClassifier;
      });

      await AIEngine.init(onProgress);
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('should fall back to WASM if WebGPU fails', async () => {
      const mockClassifier = vi.fn();
      // WebGPU fails 3 times (initial + 2 retries), then WASM succeeds
      mockPipeline
        .mockRejectedValueOnce(new Error('WebGPU attempt 1'))
        .mockRejectedValueOnce(new Error('WebGPU attempt 2'))
        .mockRejectedValueOnce(new Error('WebGPU attempt 3'))
        .mockResolvedValueOnce(mockClassifier);

      await AIEngine.init();

      expect(mockPipeline).toHaveBeenCalledTimes(4);
      expect(mockPipeline).toHaveBeenLastCalledWith(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        expect.objectContaining({ device: 'wasm' })
      );
    });
  });

  describe('classifyTransaction', () => {
    it('should classify a transaction description', async () => {
      const mockClassifier = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.95 }]);
      mockPipeline.mockResolvedValue(mockClassifier);

      const result = await AIEngine.classifyTransaction('Office supplies purchase');
      expect(result).toEqual({ label: 'POSITIVE', score: 0.95 });
      expect(mockClassifier).toHaveBeenCalledWith('Office supplies purchase');
    });

    it('should auto-initialize if classifier is null', async () => {
      const mockClassifier = vi.fn().mockResolvedValue([{ label: 'NEGATIVE', score: 0.88 }]);
      mockPipeline.mockResolvedValue(mockClassifier);

      (AIEngine as any).classifier = null;
      const result = await AIEngine.classifyTransaction('Fraudulent charge');
      expect(result.label).toBe('NEGATIVE');
    });
  });

  describe('getEmbeddings', () => {
    it('should extract embeddings via feature-extraction pipeline', async () => {
      const mockExtractor = vi.fn().mockResolvedValue({
        data: new Float32Array([0.1, 0.2, 0.3]),
      });
      mockPipeline.mockResolvedValue(mockExtractor);

      const result = await AIEngine.getEmbeddings('test text');
      expect(mockExtractor).toHaveBeenCalledWith('test text');
      expect(result).toEqual({ data: new Float32Array([0.1, 0.2, 0.3]) });
    });

    it('should reuse existing extractor on subsequent calls', async () => {
      const mockExtractor = vi.fn().mockResolvedValue({ data: new Float32Array([0.1]) });
      mockPipeline.mockResolvedValue(mockExtractor);

      await AIEngine.getEmbeddings('first call');
      await AIEngine.getEmbeddings('second call');

      expect(mockExtractor).toHaveBeenCalledTimes(2);
    });
  });

  describe('detectAnomalies', () => {
    it('should classify multiple descriptions', async () => {
      const mockClassifier = vi
        .fn()
        .mockResolvedValueOnce([{ label: 'POSITIVE', score: 0.9 }])
        .mockResolvedValueOnce([{ label: 'NEGATIVE', score: 0.85 }]);
      mockPipeline.mockResolvedValue(mockClassifier);

      const result = await AIEngine.detectAnomalies(['Good transaction', 'Suspicious wire']);
      expect(result).toHaveLength(2);
      expect(result![0]!.sentiment).toBe('POSITIVE');
      expect(result![1]!.sentiment).toBe('NEGATIVE');
    });

    it('should return empty array for empty input', async () => {
      const result = await AIEngine.detectAnomalies([]);
      expect(result).toHaveLength(0);
    });

    it('should report progress during batch processing', async () => {
      const mockClassifier = vi.fn().mockResolvedValue([{ label: 'POSITIVE', score: 0.9 }]);
      mockPipeline.mockResolvedValue(mockClassifier);
      const onProgress = vi.fn();

      await AIEngine.detectAnomalies(['a', 'b', 'c'], 2, onProgress);

      expect(onProgress).toHaveBeenCalled();
      const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1];
      expect(lastCall[0]).toBe(3); // processed
      expect(lastCall[1]).toBe(3); // total
    });
  });

  describe('getStatus', () => {
    it('should report uninitialized state', () => {
      const status = AIEngine.getStatus();
      expect(status.initialized).toBe(false);
      expect(status.device).toBe('unknown');
      expect(status.classifierReady).toBe(false);
      expect(status.extractorReady).toBe(false);
    });

    it('should report initialized state after init', async () => {
      const mockClassifier = vi.fn();
      mockPipeline.mockResolvedValue(mockClassifier);

      await AIEngine.init();

      const status = AIEngine.getStatus();
      expect(status.initialized).toBe(true);
      expect(status.device).toMatch(/^(webgpu|wasm)$/);
      expect(status.classifierReady).toBe(true);
    });
  });

  describe('dispose', () => {
    it('should clean up classifier and extractor', async () => {
      const mockDispose = vi.fn().mockResolvedValue(undefined);
      const mockClassifier = vi.fn();
      (mockClassifier as any).dispose = mockDispose;
      mockPipeline.mockResolvedValue(mockClassifier);

      await AIEngine.init();
      expect(AIEngine.getStatus().initialized).toBe(true);

      await AIEngine.dispose();
      expect(AIEngine.getStatus().initialized).toBe(false);
      expect(AIEngine.getStatus().device).toBe('unknown');
    });
  });

  describe('getEmbeddings fallback', () => {
    it('should fall back to WASM for embeddings if WebGPU fails', async () => {
      const mockExtractor = vi.fn().mockResolvedValue({ data: new Float32Array([0.1]) });
      // WebGPU fails, WASM succeeds
      mockPipeline
        .mockRejectedValueOnce(new Error('WebGPU failed'))
        .mockResolvedValueOnce(mockExtractor);

      const result = await AIEngine.getEmbeddings('test text');
      expect(result).toEqual({ data: new Float32Array([0.1]) });
      expect(mockPipeline).toHaveBeenCalledTimes(2);
    });
  });
});
