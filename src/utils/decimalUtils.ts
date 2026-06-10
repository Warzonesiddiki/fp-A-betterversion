const EPSILON = 1e-9;

export function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function safeMultiply(a: number, b: number, decimals: number = 2): number {
  return roundToDecimals(a * b, decimals);
}

export function safeDivide(numerator: number, denominator: number, decimals: number = 2): number {
  if (denominator === 0) return 0;
  return roundToDecimals(numerator / denominator, decimals);
}

export function areClose(a: number, b: number, tolerance: number = EPSILON): boolean {
  return Math.abs(a - b) <= tolerance;
}

export function roundToTotal(amounts: number[], targetTotal: number): number[] {
  const cents = amounts.map((a) => Math.round(a * 100));
  const targetCents = Math.round(targetTotal * 100);
  const sum = cents.reduce((s, c) => s + c, 0);
  let diff = targetCents - sum;
  let i = 0;
  while (diff !== 0 && i < cents.length) {
    if (diff > 0) {
      cents![i]! += 1;
      diff -= 1;
    } else {
      cents![i]! -= 1;
      diff += 1;
    }
    i = (i + 1) % cents.length;
  }
  return cents.map((c) => c / 100);
}

export function toFixedSafe(value: number, decimals: number): string {
  return roundToDecimals(value, decimals).toFixed(decimals);
}

export function parseFinite(value: string, fallback: number = 0): number {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}
