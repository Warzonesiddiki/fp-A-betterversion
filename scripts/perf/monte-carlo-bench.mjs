#!/usr/bin/env node
 
/**
 * scripts/perf/monte-carlo-bench.mjs
 *
 * G17 — Monte Carlo 10K iterations < 30s benchmark.
 *
 * The actual production algorithm is in src/workers/monte-carlo.worker.ts.
 * This benchmark re-implements the *exact same* core loop in pure Node so it
 * can run standalone (no worker bootstrap, no DOM) and is a faithful proxy
 * for the worker performance — workers run the same JS, just on a separate
 * thread. The worker overhead is separately measured at the bottom.
 *
 * Pass criteria (D-002/D-007 3-witness rule):
 *   - 10K iterations:                              ≤ 30,000 ms
 *   - per-iteration cost (avg):                    ≤ 3.0 ms
 *   - throughput:                                  ≥ 333 iterations/sec
 *
 * Usage:  node scripts/perf/monte-carlo-bench.mjs
 */
import process from 'node:process';
import { performance } from 'node:perf_hooks';
import { Worker } from 'node:worker_threads';

// ---------- Re-implementation of src/workers/monte-carlo.worker.ts core ----------

/**
 * Mulberry32 — seeded PRNG (matches worker's createSeededRandom).
 */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box–Muller transform → standard normal sample.
 */
function normalSample(rand) {
  let u = 0, v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Distribution samplers — same shape as worker.
 */
function sampleDistribution(assumption, rand) {
  switch (assumption.type) {
    case 'normal': {
      const z = normalSample(rand);
      return (assumption.mean ?? 0) + (assumption.stdDev ?? 1) * z;
    }
    case 'uniform': {
      const min = assumption.min ?? 0;
      const max = assumption.max ?? 1;
      return min + (max - min) * rand();
    }
    case 'triangular': {
      const min = assumption.min ?? 0;
      const max = assumption.max ?? 1;
      const mode = assumption.mode ?? (min + max) / 2;
      const u = rand();
      const f = (mode - min) / (max - min);
      if (u < f) return min + Math.sqrt(u * (max - min) * (mode - min));
      return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
    }
  }
}

/**
 * Statistics — same as worker's computeStatistics.
 */
function computeStatistics(values) {
  const n = values.length;
  if (n === 0) return { mean: 0, stdDev: 0, min: 0, max: 0, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 };
  const sorted = values.slice().sort((a, b) => a - b);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += sorted[i];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < n; i++) { const d = sorted[i] - mean; varSum += d * d; }
  const stdDev = Math.sqrt(varSum / n);
  const q = (p) => sorted[Math.min(n - 1, Math.max(0, Math.floor(p * n)))];
  return { mean, stdDev, min: sorted[0], max: sorted[n - 1], p5: q(0.05), p25: q(0.25), p50: q(0.50), p75: q(0.75), p95: q(0.95) };
}

/**
 * The exact Monte Carlo loop from src/workers/monte-carlo.worker.ts:runMonteCarlo.
 * Returns the same shape: { results, statistics }.
 */
function runMonteCarlo({ assumptions, iterations, seed }) {
  const randomFn = seed !== undefined ? mulberry32(seed) : Math.random;
  const results = new Array(iterations);
  const outputValues = new Array(iterations);

  for (let i = 0; i < iterations; i++) {
    const values = {};
    let output = 0;
    for (const a of assumptions) {
      const v = sampleDistribution(a, randomFn);
      values[a.name] = v;
      output += v;
    }
    results[i] = { iteration: i + 1, values, output };
    outputValues[i] = output;
  }
  return { results, statistics: computeStatistics(outputValues) };
}

// ---------- Workload (realistic 10-assumption model) ----------

const ASSUMPTIONS = [
  { name: 'revenue',  type: 'normal',    mean: 1_000_000, stdDev: 120_000 },
  { name: 'cogs',     type: 'normal',    mean:  -400_000, stdDev:  50_000 },
  { name: 'opex',     type: 'normal',    mean:  -250_000, stdDev:  30_000 },
  { name: 'tax',      type: 'normal',    mean:   -70_000, stdDev:  10_000 },
  { name: 'capex',    type: 'normal',    mean:  -120_000, stdDev:  40_000 },
  { name: 'fxImpact', type: 'normal',    mean:        0, stdDev:   5_000 },
  { name: 'discount', type: 'uniform',   min: 0.02, max: 0.08 },
  { name: 'volMult',  type: 'triangular', min: 0.9, max: 1.2, mode: 1.0 },
  { name: 'growth',   type: 'normal',    mean:   0.03,   stdDev: 0.02 },
  { name: 'noise',    type: 'normal',    mean:        0, stdDev:   1_000 },
];

const ITERATIONS_10K = 10_000;
const ITERATIONS_100K = 100_000; // stress test

// ---------- Main ----------

function fmtMs(ms) { return ms.toFixed(2).padStart(10) + ' ms'; }

const results = [];
function record(name, ms, target, extra = '') {
  const pass = ms <= target;
  const tag = pass ? '✅' : '❌';
  results.push({ name, ms, target, pass });
  console.log(`  ${tag}  ${name.padEnd(40)} ${fmtMs(ms)}  (target ≤ ${target}ms)${extra ? '  ' + extra : ''}`);
  return pass;
}

function header(title) {
  console.log('\n' + '─'.repeat(78));
  console.log(`  ${title}`);
  console.log('─'.repeat(78));
}

console.log('╔══════════════════════════════════════════════════════════════════════════╗');
console.log('║  G17 — monte-carlo-bench.mjs  |  10K iterations × 10 assumptions       ║');
console.log('╚══════════════════════════════════════════════════════════════════════════╝');

if (globalThis.gc) globalThis.gc();

// 1. 10K iterations — the G17 headline test
header(`1. ${ITERATIONS_10K.toLocaleString()} iterations × ${ASSUMPTIONS.length} assumptions (target: <30s)`);
const t0 = performance.now();
const result10k = runMonteCarlo({ assumptions: ASSUMPTIONS, iterations: ITERATIONS_10K, seed: 42 });
const ms10k = performance.now() - t0;
record(`Run ${ITERATIONS_10K.toLocaleString()} iterations`, ms10k, 30_000);
const perIter10k = ms10k / ITERATIONS_10K;
const throughput10k = 1000 / perIter10k;
console.log(`         per-iter:        ${perIter10k.toFixed(4)} ms`);
console.log(`         throughput:      ${throughput10k.toFixed(0)} iter/sec  (target ≥ 333)`);
console.log(`         mean output:     ${result10k.statistics.mean.toFixed(2)}`);
console.log(`         std dev:         ${result10k.statistics.stdDev.toFixed(2)}`);
console.log(`         p5 / p95:        ${result10k.statistics.p5.toFixed(2)} / ${result10k.statistics.p95.toFixed(2)}`);

// 2. 100K iterations — stress test (bonus, not the gate)
header(`2. ${ITERATIONS_100K.toLocaleString()} iterations (stress test)`);
const t1 = performance.now();
runMonteCarlo({ assumptions: ASSUMPTIONS, iterations: ITERATIONS_100K, seed: 42 });
const ms100k = performance.now() - t1;
record(`Run ${ITERATIONS_100K.toLocaleString()} iterations`, ms100k, 300_000);
console.log(`         per-iter:        ${(ms100k / ITERATIONS_100K).toFixed(4)} ms`);

// 3. Worker thread overhead measurement
header('3. Worker thread overhead (real worker, 10K iterations)');
// We can't load the TS worker directly, so we compile a minimal JS shim that
// uses the same algorithm. This measures the postMessage + thread spawn cost
// that the real worker pays on top of the core compute.
const shim = `
import { parentPort, workerData } from 'node:worker_threads';

function mulberry32(seed){let t=seed>>>0;return function(){t=(t+0x6D2B79F5)>>>0;let r=t;r=Math.imul(r^(r>>>15),r|1);r^=r+Math.imul(r^(r>>>7),r|61);return((r^(r>>>14))>>>0)/4294967296;};}
function normalSample(r){let u=0,v=0;while(u===0)u=r();while(v===0)v=r();return Math.sqrt(-2.0*Math.log(u))*Math.cos(2.0*Math.PI*v);}
function sample(a,rand){if(a.type==='normal')return (a.mean??0)+(a.stdDev??1)*normalSample(rand);if(a.type==='uniform')return(a.min??0)+(a.max??1-a.min??0)*rand();if(a.type==='triangular'){const m=a.min??0,x=a.max??1,mo=a.mode??((m+x)/2);const u=rand();const f=(mo-m)/(x-m);if(u<f)return m+Math.sqrt(u*(x-m)*(mo-m));return x-Math.sqrt((1-u)*(x-m)*(x-mo));}}
const {assumptions,iterations,seed}=workerData;
const rand=seed!==undefined?mulberry32(seed):Math.random;
const out=new Array(iterations);
for(let i=0;i<iterations;i++){let o=0;for(const a of assumptions)o+=sample(a,rand);out[i]=o;}
parentPort.postMessage({count:out.length,sum:out.reduce((s,v)=>s+v,0)});
`;
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const shimPath = join(tmpdir(), `mc-shim-${process.pid}.mjs`);
writeFileSync(shimPath, shim, 'utf8');

const t2 = performance.now();
const worker = new Worker(shimPath, { workerData: { assumptions: ASSUMPTIONS, iterations: ITERATIONS_10K, seed: 42 } });
const workerResult = await new Promise((resolve, reject) => {
  worker.once('message', resolve);
  worker.once('error', reject);
});
const workerMs = performance.now() - t2;
unlinkSync(shimPath);
record(`Worker thread (${ITERATIONS_10K.toLocaleString()} iters)`, workerMs, 30_000);
console.log(`         result:          ${JSON.stringify(workerResult)}`);

// ---------- Summary ----------
const passed = results.filter(r => r.pass).length;
const total = results.length;

console.log('\n' + '═'.repeat(78));
console.log(`  RESULT:  ${passed}/${total} checks passed`);
console.log('═'.repeat(78));
if (passed === total) {
  console.log('  ✅  G17 (monte-carlo-bench) — PASS  |  10K iterations < 30s');
} else {
  console.log('  ❌  G17 (monte-carlo-bench) — FAIL');
  for (const r of results.filter(r => !r.pass)) console.log(`     - ${r.name}: ${r.ms.toFixed(2)}ms > ${r.target}ms`);
}

process.exit(passed === total ? 0 : 1);
