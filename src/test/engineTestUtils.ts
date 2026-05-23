export function expectCloseTo(actual: number, expected: number, precision = 2) {
  const diff = Math.abs(actual - expected);
  const tolerance = Math.pow(10, -precision);
  if (diff > tolerance) {
    throw new Error(
      `Expected ${expected} but got ${actual} (diff: ${diff}, tolerance: ${tolerance})`
    );
  }
}

export function expectFinancialEqual(actual: number, expected: number, cents = true) {
  const precision = cents ? 2 : 0;
  expectCloseTo(actual, expected, precision);
}

export function mockCellValue(ref: string, values: Record<string, number> = {}): number {
  return values[ref] ?? 0;
}

export function createCellMap(entries: [string, number][]): Record<string, number> {
  return Object.fromEntries(entries);
}
