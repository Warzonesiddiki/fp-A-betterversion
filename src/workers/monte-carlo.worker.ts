/// <reference lib="webworker" />
// =============================================================================
// MONTE CARLO SIMULATION WEB WORKER
// Runs Monte Carlo simulations off the main thread to avoid UI blocking.
// Supports up to 1,000,000 iterations with progress reporting.
// =============================================================================

import type {
  WorkerMessage,
  WorkerResponse,
  MonteCarloRequest,
  MonteCarloResponse,
  MonteCarloResultItem,
  MonteCarloDistribution,
} from './types';

// --- Seeded PRNG (xoshiro128**) for reproducible simulations ---

function createSeededRandom(seed: number): () => number {
  let s0 = seed | 0;
  let s1 = (seed * 1812433253 + 1) | 0;
  let s2 = (s1 * 1812433253 + 1) | 0;
  let s3 = (s2 * 1812433253 + 1) | 0;

  // Ensure non-zero state
  if (s0 === 0 && s1 === 0 && s2 === 0 && s3 === 0) {
    s0 = 1;
  }

  return (): number => {
    const result = ((((s1 * 5) << 7) | ((s1 * 5) >>> 25)) * 9) >>> 0;
    const t = s1 << 9;

    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = ((s3 << 11) | (s3 >>> 21)) >>> 0;

    return result / 4294967296;
  };
}

// --- Distribution sampling ---

function sampleDistribution(dist: MonteCarloDistribution, randomFn: () => number): number {
  const r = randomFn();

  switch (dist.type) {
    case 'uniform': {
      const min = dist.min ?? 0;
      const max = dist.max ?? 1;
      return min + r * (max - min);
    }

    case 'normal': {
      // Box-Muller transform
      const u1 = randomFn();
      const u2 = randomFn();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return (dist.mean ?? 0) + z0 * (dist.stdDev ?? 1);
    }

    case 'triangular': {
      const a = dist.min ?? 0;
      const b = dist.max ?? 1;
      const c = dist.mode ?? 0.5;
      const fc = (c - a) / (b - a);
      if (r < fc) {
        return a + Math.sqrt(r * (b - a) * (c - a));
      }
      return b - Math.sqrt((1 - r) * (b - a) * (b - c));
    }

    default:
      return dist.mean ?? 0;
  }
}

// --- Statistics computation ---

function computeStatistics(values: number[]): MonteCarloResponse['statistics'] {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = sorted.reduce((s, v) => s + v, 0);
  const mean = sum / n;

  const squaredDiffs = sorted.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number): number => {
    const idx = (p / 100) * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return sorted[low]!;
    return sorted[low]! + (sorted[high]! - sorted[low]!) * (idx - low);
  };

  return {
    mean,
    stdDev,
    min: sorted[0]!,
    max: sorted[n - 1]!,
    p5: percentile(5),
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p95: percentile(95),
  };
}

// --- Core simulation ---

function runMonteCarlo(request: MonteCarloRequest): MonteCarloResponse {
  const { assumptions, iterations, seed } = request;

  if (iterations <= 0 || assumptions.length === 0) {
    return {
      results: [],
      statistics: {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        p5: 0,
        p25: 0,
        p50: 0,
        p75: 0,
        p95: 0,
      },
    };
  }

  const randomFn = seed !== undefined ? createSeededRandom(seed) : Math.random;
  const results: MonteCarloResultItem[] = [];
  const outputValues: number[] = [];
  const progressInterval = Math.max(1, Math.floor(iterations / 100));

  for (let i = 0; i < iterations; i++) {
    const values: Record<string, number> = {};
    let output = 0;

    for (const assumption of assumptions) {
      const val = sampleDistribution(assumption, randomFn);
      values[assumption.name] = val;
      output += val;
    }

    results.push({ iteration: i + 1, values, output });
    outputValues.push(output);

    // Report progress every 1%
    if ((i + 1) % progressInterval === 0 || i === iterations - 1) {
      const progressResponse: WorkerResponse = {
        id: 'monte-carlo',
        type: 'progress',
        progress: {
          processed: i + 1,
          total: iterations,
          percent: Math.round(((i + 1) / iterations) * 100),
        },
      };
      self.postMessage(progressResponse);
    }
  }

  return {
    results,
    statistics: computeStatistics(outputValues),
  };
}

// --- Worker message handler ---

self.onmessage = (e: MessageEvent<WorkerMessage<MonteCarloRequest>>) => {
  const { id, payload } = e.data;

  try {
    const result = runMonteCarlo(payload);
    const response: WorkerResponse<MonteCarloResponse> = {
      id,
      type: 'result',
      payload: result,
    };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error in Monte Carlo worker',
    };
    self.postMessage(response);
  }
};
