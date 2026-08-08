// =============================================================================
// deterministicRng unit tests — reproducible PRNG (PROMETHEUS PATCH 22)
// =============================================================================
import { afterEach, describe, expect, it } from 'vitest';
import { generateId, mulberry32, resetRng, rng, setRng } from './deterministicRng';

afterEach(() => {
  resetRng();
});

describe('mulberry32', () => {
  it('is deterministic for a fixed seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces values in [0, 1)', () => {
    const g = mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const v = g();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = mulberry32(1)();
    const b = mulberry32(2)();
    expect(a).not.toBe(b);
  });
});

describe('default rng + setRng/resetRng', () => {
  it('default rng is deterministic across calls (seed 42)', () => {
    const seq = Array.from({ length: 5 }, () => rng());
    const seq2 = Array.from({ length: 5 }, () => rng());
    // continuing the same sequence should not repeat
    expect(seq).not.toEqual(seq2);
  });

  it('setRng replaces the generator and resetRng restores it', () => {
    const before = rng();
    const stub = () => 0.5;
    setRng(stub);
    expect(rng()).toBe(0.5);
    resetRng();
    expect(rng()).not.toBe(0.5);
    void before;
  });
});

describe('generateId', () => {
  it('produces the documented format', () => {
    const id = generateId('task', 7);
    expect(id).toMatch(/^task_7_[0-9a-z]{4}$/);
  });

  it('is reproducible for a fixed fresh seed and counter', () => {
    setRng(mulberry32(42));
    const a = generateId('dep', 3);
    setRng(mulberry32(42));
    const b = generateId('dep', 3);
    expect(a).toBe(b);
  });

  it('varies with the counter', () => {
    resetRng();
    const a = generateId('dep', 1);
    resetRng();
    const b = generateId('dep', 2);
    expect(a).not.toBe(b);
  });

  it('always returns a 4-char rng suffix (zero-padded)', () => {
    // force a tiny rng value so the base-36 string is short
    setRng(() => 0);
    expect(generateId('x', 1)).toMatch(/^x_1_0000$/);
  });
});
