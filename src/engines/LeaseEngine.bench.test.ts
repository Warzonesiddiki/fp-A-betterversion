/**
 * Lane R23 (wave 3) — performance benchmark seed.
 *
 * Hot path: LeaseEngine.generateDisclosure on a 48-month ASC 842 schedule
 * (48 monthly payments discounted through the decimal.js effective-monthly-
 * rate chain, plus classification and a 48-term sumMoney).
 *
 * Runs under the bench-only config: npm run test:bench
 * (vitest.bench.config.ts includes every ".bench.test.ts" file under src/
 * and the default suite excludes them). Benches measure only — no
 * assertions. Each run keeps well under the 5s budget via adaptive batch
 * sizing (each sample lasts at least 60ms) and 7 samples; the reported
 * number is the median sample converted to ops/sec.
 */
import { describe, it } from 'vitest';
import { LeaseEngine, type LeaseContract } from './LeaseEngine';

/** Deterministic LCG so every run measures identical work (no Math.random cost/noise). */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildLease(): LeaseContract {
  const rand = lcg(20260823);
  const leasePayments: number[] = [];
  for (let m = 0; m < 48; m++) {
    // Seasonal ±5% around a $12,000 base rent, rounded to cents.
    const seasonal = 1 + 0.05 * Math.sin((m / 12) * Math.PI * 2);
    const noise = 0.95 + 0.1 * rand();
    leasePayments.push(Math.round(12000 * seasonal * noise * 100) / 100);
  }
  return {
    id: 'bench-lease-001',
    assetDescription: 'Benchmark HQ office floor',
    commencementDate: '2024-01-01',
    leaseTerm: 48,
    leasePayments,
    discountRate: 0.055,
    residualValueGuarantee: 2500,
    // classification intentionally omitted so classifyLease runs each op
  };
}

/**
 * Adaptive timing harness: warm up, calibrate a batch that takes ≥60ms,
 * then take 7 samples and log the median as ms/op and ops/sec.
 */
function measureMedian(name: string, op: () => void): void {
  op();
  op();
  let batch = 1;
  let calibratedMs = 60;
  for (;;) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) op();
    const dt = performance.now() - t0;
    if (dt >= 60) {
      calibratedMs = dt;
      break;
    }
    const next = Math.min(8192, Math.ceil((60 / Math.max(dt, 0.05)) * batch));
    if (next <= batch) break;
    batch = next;
  }
  // Budget guard: expensive ops drop to 3 samples so the whole bench stays
  // inside its <5s run budget.
  const samples = Math.max(3, Math.min(7, Math.floor(2500 / Math.max(calibratedMs, 1))));
  const durations: number[] = [];
  for (let s = 0; s < samples; s++) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) op();
    durations.push(performance.now() - t0);
  }
  durations.sort((a, b) => a - b);
  const medianMs = durations[Math.floor(samples / 2)]!;
  const perOpMs = medianMs / batch;
  console.log(
    `[bench] ${name}: median ${perOpMs.toFixed(4)} ms/op · ${Math.round(1000 / perOpMs).toLocaleString('en-US')} ops/s · batch=${batch} · samples=${samples} · measured=${durations.reduce((a, b) => a + b, 0).toFixed(0)}ms`
  );
}

describe('bench: LeaseEngine.generateDisclosure (48-month schedule)', () => {
  it('measures disclosure generation ops/sec', () => {
    const lease = buildLease();
    measureMedian('LeaseEngine.generateDisclosure(48mo)', () => {
      LeaseEngine.generateDisclosure(lease);
    });
  });
});
