/**
 * Lane R23 (wave 3) — performance benchmark seed.
 *
 * Hot path: sumMoney from @/utils/money — the canonical exact-money fold
 * (Decimal.plus chain over toDecimal coercion) that underpins engines,
 * stores and dashboards. One operation = one sumMoney call over 10,000
 * mixed MoneyInputs (numbers, numeric strings and pre-built Decimals in
 * realistic ledger proportions), so the bench exercises the coercion path
 * as well as the addition chain.
 *
 * Runs under the bench-only config: npm run test:bench
 * (vitest.bench.config.ts includes every ".bench.test.ts" file under src/
 * and the default suite excludes them). Benches measure only — no
 * assertions. Adaptive batch sizing keeps the whole run well under the 5s
 * budget; the reported number is the median of 7 samples as ops/sec.
 */
import { describe, it } from 'vitest';
import Decimal from 'decimal.js';
import { sumMoney, type MoneyInput } from './money';

const INPUT_COUNT = 10_000;

/** Deterministic LCG so every run measures identical work. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function buildInputs(): MoneyInput[] {
  const rand = lcg(20260823);
  const inputs: MoneyInput[] = new Array(INPUT_COUNT);
  for (let i = 0; i < INPUT_COUNT; i++) {
    const cents = Math.round((rand() * 100_000 - 20_000) * 100) / 100;
    const kind = i % 10;
    if (kind < 7) {
      inputs[i] = cents; // plain numbers — the common case
    } else if (kind < 9) {
      inputs[i] = cents.toFixed(2); // strings from CSV / API layers
    } else {
      inputs[i] = new Decimal(cents); // already-decimal pipeline values
    }
  }
  return inputs;
}

/** Adaptive timing harness — identical contract to the other R23 benches. */
function measureMedian(name: string, op: () => void): void {
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

describe(`bench: sumMoney (${INPUT_COUNT.toLocaleString('en-US')} inputs)`, () => {
  it('measures exact-sum fold ops/sec over 10k mixed MoneyInputs', () => {
    const inputs = buildInputs();
    measureMedian('money.sumMoney(10k inputs)', () => {
      sumMoney(inputs);
    });
  });
});
