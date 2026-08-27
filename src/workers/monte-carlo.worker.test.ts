import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { WorkerResponse, MonteCarloResponse } from './types';

describe('monte-carlo.worker', () => {
  let postMessages: WorkerResponse[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg as WorkerResponse);
    });
    await import('./monte-carlo.worker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  function runMC(payload: Record<string, unknown>): MonteCarloResponse | undefined {
    self.onmessage?.(
      new MessageEvent('message', {
        data: { id: 'monte-carlo', type: 'compute', payload },
      })
    );
    const results = postMessages.filter((m) => m.type === 'result');
    return results[results.length - 1]?.payload as MonteCarloResponse | undefined;
  }

  function getLastError(): string | undefined {
    const errorMsg = postMessages.find((m) => m.type === 'error');
    return errorMsg?.error;
  }

  describe('seeded random simulation', () => {
    it('produces reproducible results with same seed', () => {
      const result1 = runMC({
        assumptions: [
          { name: 'revenue', type: 'normal', mean: 1000, stdDev: 100 },
          { name: 'costs', type: 'uniform', min: 500, max: 800 },
        ],
        iterations: 100,
        seed: 42,
      });
      const result2 = runMC({
        assumptions: [
          { name: 'revenue', type: 'normal', mean: 1000, stdDev: 100 },
          { name: 'costs', type: 'uniform', min: 500, max: 800 },
        ],
        iterations: 100,
        seed: 42,
      });
      expect(result1?.results.length).toBe(100);
      expect(result2?.results.length).toBe(100);
      expect(result1?.results[0]!.output).toBe(result2?.results[0]!.output);
      expect(result1?.statistics.mean).toBe(result2?.statistics.mean);
    });

    it('produces different result arrays with different seeds', () => {
      const result1 = runMC({
        assumptions: [
          { name: 'a', type: 'uniform', min: 0, max: 100 },
          { name: 'b', type: 'normal', mean: 50, stdDev: 10 },
        ],
        iterations: 50,
        seed: 12345,
      });
      const result2 = runMC({
        assumptions: [
          { name: 'a', type: 'uniform', min: 0, max: 100 },
          { name: 'b', type: 'normal', mean: 50, stdDev: 10 },
        ],
        iterations: 50,
        seed: 67890,
      });
      const outputs1 = result1?.results.map((r) => r.output) ?? [];
      const outputs2 = result2?.results.map((r) => r.output) ?? [];
      const same = outputs1.every((v, i) => v === outputs2[i]!);
      expect(same).toBe(false);
    });
  });

  describe('distribution sampling', () => {
    it('samples uniform within bounds', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 5, max: 10 }],
        iterations: 1000,
        seed: 42,
      });
      for (const r of result?.results ?? []) {
        expect(r.values.x).toBeGreaterThanOrEqual(5);
        expect(r.values.x).toBeLessThanOrEqual(10);
      }
    });

    it('samples normal distribution with correct mean', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'normal', mean: 500, stdDev: 50 }],
        iterations: 5000,
        seed: 42,
      });
      expect(result?.statistics.mean).toBeCloseTo(500, -1);
    });

    it('samples triangular distribution within bounds', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'triangular', min: 0, max: 100, mode: 50 }],
        iterations: 1000,
        seed: 42,
      });
      for (const r of result?.results ?? []) {
        expect(r.values.x).toBeGreaterThanOrEqual(0);
        expect(r.values.x).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('statistics computation', () => {
    it('computes statistics from results', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
        iterations: 10000,
        seed: 42,
      });
      const stats = result?.statistics;
      expect(stats?.min).toBeGreaterThanOrEqual(0);
      expect(stats?.max).toBeLessThanOrEqual(100);
      expect(stats?.mean).toBeGreaterThan(30);
      expect(stats?.mean).toBeLessThan(70);
      expect(stats?.p50).toBeGreaterThan(30);
      expect(stats?.p50).toBeLessThan(70);
      expect(stats?.p5).toBeLessThan(stats?.p25 ?? 0);
      expect(stats?.p75).toBeGreaterThan(stats?.p50 ?? 0);
      expect(stats?.p95).toBeGreaterThan(stats?.p75 ?? 0);
    });
  });

  describe('progress reporting', () => {
    it('reports progress during simulation', () => {
      runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
        iterations: 500,
        seed: 42,
      });
      const progressMsgs = postMessages.filter((m) => m.type === 'progress');
      expect(progressMsgs.length).toBeGreaterThan(0);
      expect(progressMsgs![0]!.progress?.percent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('handles zero iterations', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
        iterations: 0,
      });
      expect(result?.results).toEqual([]);
      expect(result?.statistics.mean).toBe(0);
    });

    it('handles empty assumptions', () => {
      const result = runMC({
        assumptions: [],
        iterations: 100,
      });
      expect(result?.results.length).toBe(0);
      expect(result?.statistics.mean).toBe(0);
    });

    it('handles single iteration', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 10, max: 20 }],
        iterations: 1,
        seed: 42,
      });
      expect(result?.results.length).toBe(1);
      expect(result?.statistics.max).toBe(result?.statistics.min);
    });
  });

  describe('error handling', () => {
    it('reports errors gracefully', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: { id: 'err', type: 'compute', payload: null },
        })
      );
      expect(getLastError()).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // W7E / W6-P1: request validation before math
  // ---------------------------------------------------------------------------
  describe('W7E/W6-P1 request validation', () => {
    it('rejects NaN iterations with an error reply instead of returning empty stats', () => {
      // Pre-fix: NaN <= 0 is false, the loop never runs, and the worker
      // silently returned zeroed statistics.
      runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
        iterations: Number.NaN,
      });
      expect(getLastError()).toMatch(/iterations/i);
    });

    it('clamps iterations above the header contract to exactly 1_000_000', () => {
      // Header: "Supports up to 1,000,000 iterations" — 1e9 must clamp, not
      // hang the worker (pre-fix this looped a billion times).
      const result = runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 1 }],
        iterations: 1_000_000_000,
        seed: 42,
      });
      expect(result?.results.length).toBe(1_000_000);
      const progress = postMessages.find((m) => m.type === 'progress');
      expect(progress?.progress?.total).toBe(1_000_000);
    }, 30_000);

    it('rejects assumptions holding non-finite numbers', () => {
      runMC({
        assumptions: [{ name: 'x', type: 'normal', mean: Number.NaN }],
        iterations: 10,
      });
      expect(getLastError()).toMatch(/mean/);
    });

    it('null envelope data produces exactly one error reply, no crash', () => {
      // Pre-fix `const { id, payload } = e.data` threw synchronously outside
      // the try block for null message data.
      expect(() => self.onmessage?.(new MessageEvent('message', { data: null }))).not.toThrow();
      const errors = postMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Large-N regression (Wave-1 S1 audit ledger #47: MC crash >=200k iterations)
  // ---------------------------------------------------------------------------

  describe('large iteration counts', () => {
    it('completes 250k iterations with correct statistics and bounded progress messages', () => {
      const result = runMC({
        assumptions: [{ name: 'x', type: 'uniform', min: 0, max: 100 }],
        iterations: 250_000,
        seed: 42,
      });
      expect(result?.results.length).toBe(250_000);
      const stats = result?.statistics;
      expect(stats?.min).toBeGreaterThanOrEqual(0);
      expect(stats?.max).toBeLessThanOrEqual(100);
      expect(stats?.mean).toBeGreaterThan(45);
      expect(stats?.mean).toBeLessThan(55);
      expect(stats?.p50).toBeGreaterThan(45);
      expect(stats?.p50).toBeLessThan(55);
      // ~1% cadence: floor(250000/100) = one message per 2500 iterations + final
      const progressMsgs = postMessages.filter((m) => m.type === 'progress');
      expect(progressMsgs.length).toBeLessThanOrEqual(101);
    }, 15_000);
  });
});
