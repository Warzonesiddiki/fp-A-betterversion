/**
 * BenchmarkService tests — P0 coverage for G6 (services ≥80%)
 * Mnemosyne ownership: src/services/*.test.ts (BARE-OWNED: BenchmarkService is the
 * only top-level service without a co-located test as of Phase 7.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the dependencies that would require a full engine/spa environment.
vi.mock('@/engines/AIEngine', () => ({
  AIEngine: {
    init: vi.fn().mockResolvedValue(undefined),
    classifyTransaction: vi.fn().mockResolvedValue('opex'),
    getEmbeddings: vi.fn().mockResolvedValue(new Float32Array([0.1, 0.2, 0.3])),
  },
}));

vi.mock('@/utils/masterStorage', () => ({
  masterStorage: {
    setItem: vi.fn().mockResolvedValue(undefined),
    getItem: vi.fn().mockResolvedValue(null),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import { BenchmarkService } from './BenchmarkService';
import { masterStorage } from '@/utils/masterStorage';

describe('BenchmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('runFullSuite', () => {
    it('returns a report with aiEngine and storage sections', async () => {
      const report = await BenchmarkService.runFullSuite();
      expect(report.aiEngine).toBeDefined();
      expect(report.storage).toBeDefined();
      expect(typeof report.aiEngine.init).toBe('number');
      expect(typeof report.aiEngine.classify).toBe('number');
      expect(typeof report.aiEngine.embedding).toBe('number');
      expect(typeof report.storage.write).toBe('number');
      expect(typeof report.storage.read).toBe('number');
      expect(typeof report.storage.delete).toBe('number');
    });

    it('performs a storage write/read/delete cycle', async () => {
      await BenchmarkService.runFullSuite();
      expect(masterStorage.setItem).toHaveBeenCalledWith(
        'benchmark_test',
        expect.objectContaining({ state: expect.any(Object), version: 1 })
      );
      expect(masterStorage.getItem).toHaveBeenCalledWith('benchmark_test');
      expect(masterStorage.removeItem).toHaveBeenCalledWith('benchmark_test');
    });

    it('invokes AIEngine.init/classifyTransaction/getEmbeddings', async () => {
      const { AIEngine } = await import('@/engines/AIEngine');
      await BenchmarkService.runFullSuite();
      expect(AIEngine.init).toHaveBeenCalled();
      expect(AIEngine.classifyTransaction).toHaveBeenCalled();
      expect(AIEngine.getEmbeddings).toHaveBeenCalled();
    });

    it('returns non-negative durations for all metrics', async () => {
      const report = await BenchmarkService.runFullSuite();
      for (const value of [
        report.aiEngine.init,
        report.aiEngine.classify,
        report.aiEngine.embedding,
        report.storage.write,
        report.storage.read,
        report.storage.delete,
      ]) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(value)).toBe(true);
      }
    });
  });

  describe('getHistory', () => {
    it('returns empty array when no history', async () => {
      vi.mocked(masterStorage.getItem).mockResolvedValueOnce(null);
      const h = await BenchmarkService.getHistory();
      expect(h).toEqual([]);
    });

    it('returns stored history when present', async () => {
      const history = [
        { timestamp: 1, name: 'a', duration: 1.0 },
        { timestamp: 2, name: 'b', duration: 2.0 },
      ];
      vi.mocked(masterStorage.getItem).mockResolvedValueOnce({
        state: history,
        version: 1,
      } as never);
      const h = await BenchmarkService.getHistory();
      expect(h).toEqual(history);
    });
  });

  describe('saveResult', () => {
    it('appends six new entries (init, classify, embedding, write, read, delete)', async () => {
      vi.mocked(masterStorage.getItem).mockResolvedValueOnce(null);
      await BenchmarkService.saveResult({
        aiEngine: { init: 1, classify: 2, embedding: 3 },
        storage: { write: 4, read: 5, delete: 6 },
      });
      expect(masterStorage.setItem).toHaveBeenCalledWith(
        'benchmark_history',
        expect.objectContaining({ version: 1 })
      );
      const arg = vi.mocked(masterStorage.setItem).mock.calls.at(-1)?.[1] as {
        state: Array<{ name: string; duration: number }>;
      };
      const names = arg.state.map((s) => s.name);
      expect(names).toEqual([
        'ai_init',
        'ai_classify',
        'ai_embedding',
        'storage_write',
        'storage_read',
        'storage_delete',
      ]);
      const durations = arg.state.map((s) => s.duration);
      expect(durations).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('appends to existing history', async () => {
      const existing = [{ timestamp: 1, name: 'ai_init', duration: 5 }];
      vi.mocked(masterStorage.getItem).mockResolvedValueOnce({
        state: existing,
        version: 1,
      } as never);
      await BenchmarkService.saveResult({
        aiEngine: { init: 1, classify: 2, embedding: 3 },
        storage: { write: 4, read: 5, delete: 6 },
      });
      const arg = vi.mocked(masterStorage.setItem).mock.calls.at(-1)?.[1] as {
        state: Array<{ name: string; duration: number }>;
      };
      // Existing + 6 new = 7 total.
      expect(arg.state).toHaveLength(7);
      // Tail of length 6 = existing ai_init (pushed by -1) + 5 of the 6 new entries.
      // The first new ai_init is at position 1, the other 5 new entries follow.
      const tail = arg.state.slice(-6).map((s) => s.name);
      expect(tail).toEqual([
        'ai_init',
        'ai_classify',
        'ai_embedding',
        'storage_write',
        'storage_read',
        'storage_delete',
      ]);
    });

    it('caps stored history at the last 600 entries', async () => {
      const long = Array.from({ length: 700 }, (_, i) => ({
        timestamp: i,
        name: 'x',
        duration: 0,
      }));
      vi.mocked(masterStorage.getItem).mockResolvedValueOnce({ state: long, version: 1 } as never);
      await BenchmarkService.saveResult({
        aiEngine: { init: 1, classify: 2, embedding: 3 },
        storage: { write: 4, read: 5, delete: 6 },
      });
      const arg = vi.mocked(masterStorage.setItem).mock.calls.at(-1)?.[1] as { state: unknown[] };
      expect(arg.state.length).toBe(600);
    });
  });
});
