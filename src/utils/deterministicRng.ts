// =============================================================================
// DETERMINISTIC RNG (PROMETHEUS PATCH 22 + VULCAN T-FIX-10 ENGINE PURITY REFACTOR)
// =============================================================================
// PATCH 22: Engines must NOT use non-deterministic Date.now() + Math.random()
// for ID generation (SOX/IFRS reproducibility requirement).
// Mulberry32 PRNG with seed=42 is the canonical reproducible RNG.
// =============================================================================

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function (): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const defaultRng = mulberry32(42);

export let rng: () => number = defaultRng;

export function setRng(newRng: () => number): void {
  rng = newRng;
}

export function resetRng(): void {
  rng = defaultRng;
}

export function generateId(prefix: string, monotonicCounter: number): string {
  const rngPart = Math.floor(rng() * 0xffffffff)
    .toString(36)
    .slice(0, 4)
    .padEnd(4, '0');
  return `${prefix}_${monotonicCounter}_${rngPart}`;
}
