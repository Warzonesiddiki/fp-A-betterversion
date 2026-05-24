import { describe, it, expect, vi } from 'vitest';
import { withRetry, createWorker } from '../retry';

describe('retry', () => {
  describe('withRetry', () => {
    it('resolves on successful call', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      await expect(withRetry(fn)).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');

      await expect(withRetry(fn, 3, 10)).resolves.toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws after exhausting retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fail'));
      await expect(withRetry(fn, 2, 10)).rejects.toThrow('always fail');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('createWorker', () => {
    it('returns run and terminate functions', () => {
      const workerFactory = (): Worker =>
        ({
          postMessage: vi.fn(),
          terminate: vi.fn(),
          onmessage: null as unknown as ((e: MessageEvent) => void) | null,
          onerror: null as unknown as ((e: ErrorEvent) => void) | null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn() as unknown as (event: Event) => boolean,
          onmessageerror: null,
        }) as unknown as Worker;
      const worker = createWorker<number>(workerFactory);
      expect(worker.run).toBeDefined();
      expect(worker.terminate).toBeDefined();
    });
  });
});
