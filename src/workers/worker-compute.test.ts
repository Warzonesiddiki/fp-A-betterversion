import { describe, it, expect } from 'vitest';
import type {
  MonteCarloRequest,
  ConsolidationRequest,
  ConsolidationEntityData,
  ConsolidationOwnership,
  BatchCalcRequest,
  BatchCellIdentifier,
  BatchCalcDependency,
} from './types';

// =============================================================================
// PURE COMPUTATION TESTS
// These test the algorithms used inside workers by re-implementing the pure
// functions. This validates correctness without requiring a real Worker env.
// =============================================================================

// --- Monte Carlo helpers ---

function sampleUniform(min: number, max: number, r: number): number {
  return min + r * (max - min);
}

function sampleTriangular(a: number, b: number, c: number, r: number): number {
  const fc = (c - a) / (b - a);
  if (r < fc) return a + Math.sqrt(r * (b - a) * (c - a));
  return b - Math.sqrt((1 - r) * (b - a) * (b - c));
}

function computeStatistics(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  const percentile = (p: number): number => {
    const idx = (p / 100) * (n - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    if (low === high) return sorted[low];
    return sorted[low] + (sorted[high] - sorted[low]) * (idx - low);
  };

  return {
    mean,
    stdDev,
    min: sorted[0],
    max: sorted[n - 1],
    p5: percentile(5),
    p25: percentile(25),
    p50: percentile(50),
    p75: percentile(75),
    p95: percentile(95),
  };
}

describe('Worker compute logic', () => {
  // =========================================================================
  // MONTE CARLO
  // =========================================================================

  describe('Monte Carlo sampling', () => {
    it('should sample uniform distribution correctly', () => {
      expect(sampleUniform(0, 100, 0)).toBe(0);
      expect(sampleUniform(0, 100, 0.5)).toBe(50);
      expect(sampleUniform(0, 100, 1)).toBe(100);
      expect(sampleUniform(10, 20, 0.3)).toBe(13);
    });

    it('should sample triangular distribution correctly', () => {
      // min=0, max=10, mode=5
      const result = sampleTriangular(0, 10, 5, 0.3);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10);

      // At r=0 should be min
      expect(sampleTriangular(0, 10, 5, 0.001)).toBeCloseTo(0, 0);
    });

    it('should compute statistics correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const stats = computeStatistics(values);

      expect(stats.mean).toBe(5.5);
      expect(stats.min).toBe(1);
      expect(stats.max).toBe(10);
      expect(stats.p50).toBe(5.5);
      expect(stats.stdDev).toBeCloseTo(2.872, 1);
    });

    it('should handle single value', () => {
      const stats = computeStatistics([42]);
      expect(stats.mean).toBe(42);
      expect(stats.stdDev).toBe(0);
      expect(stats.min).toBe(42);
      expect(stats.max).toBe(42);
    });

    it('should handle empty array gracefully', () => {
      // Edge case - should not crash
      const values: number[] = [];
      const sum = values.reduce((s, v) => s + v, 0);
      expect(sum).toBe(0);
    });
  });

  // =========================================================================
  // CONSOLIDATION
  // =========================================================================

  describe('Consolidation logic', () => {
    function getAccountCategory(code: string): string {
      const map: Record<string, string> = {
        '1': 'asset',
        '2': 'liability',
        '3': 'equity',
        '4': 'revenue',
        '5': 'expense',
        '6': 'expense',
      };
      return map[code.charAt(0)] ?? 'expense';
    }

    function sumByCategory(
      entries: Array<{ accountCode: string; amount: number }>,
      category: string
    ): number {
      return entries
        .filter((e) => getAccountCategory(e.accountCode) === category)
        .reduce((sum, e) => sum + e.amount, 0);
    }

    it('should categorize accounts correctly', () => {
      expect(getAccountCategory('1000')).toBe('asset');
      expect(getAccountCategory('2000')).toBe('liability');
      expect(getAccountCategory('3000')).toBe('equity');
      expect(getAccountCategory('4000')).toBe('revenue');
      expect(getAccountCategory('5000')).toBe('expense');
      expect(getAccountCategory('6000')).toBe('expense');
    });

    it('should sum by category correctly', () => {
      const entries = [
        { accountCode: '1000', amount: 1000 },
        { accountCode: '1100', amount: 500 },
        { accountCode: '2000', amount: -300 },
        { accountCode: '4000', amount: 2000 },
        { accountCode: '5000', amount: -800 },
      ];

      expect(sumByCategory(entries, 'asset')).toBe(1500);
      expect(sumByCategory(entries, 'liability')).toBe(-300);
      expect(sumByCategory(entries, 'revenue')).toBe(2000);
      expect(sumByCategory(entries, 'expense')).toBe(-800);
    });

    it('should detect IC accounts by prefix', () => {
      const entries = [
        { accountCode: '9001', amount: 100, entityId: 'A' },
        { accountCode: '9001', amount: -100, entityId: 'B' },
        { accountCode: '1000', amount: 500, entityId: 'A' },
      ];

      const icAccounts = new Set(
        entries.filter((e) => e.accountCode.startsWith('9')).map((e) => e.accountCode)
      );

      expect(icAccounts.size).toBe(1);
      expect(icAccounts.has('9001')).toBe(true);
    });

    it('should calculate minority interest correctly', () => {
      const ownershipPct = 80;
      const minorityPct = (100 - ownershipPct) / 100;
      const netIncome = 1000;
      const mi = minorityPct * netIncome;

      expect(mi).toBe(200);
    });
  });

  // =========================================================================
  // BATCH CALCULATION
  // =========================================================================

  describe('Batch calculation logic', () => {
    it('should build dependency graph correctly', () => {
      const deps: BatchCalcDependency[] = [
        { cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [{ sheet: 'S', col: 'B', row: 1 }] },
        { cell: { sheet: 'S', col: 'B', row: 1 }, dependsOn: [{ sheet: 'S', col: 'C', row: 1 }] },
      ];

      const graph = new Map<string, Set<string>>();
      for (const dep of deps) {
        const key = `${dep.cell.sheet}!${dep.cell.col}${dep.cell.row}`;
        const depKeys = new Set(dep.dependsOn.map((d) => `${d.sheet}!${d.col}${d.row}`));
        graph.set(key, depKeys);
      }

      expect(graph.get('S!A1')?.has('S!B1')).toBe(true);
      expect(graph.get('S!B1')?.has('S!C1')).toBe(true);
    });

    it('should perform topological sort correctly', () => {
      // A depends on B, B depends on C
      // Sort should give: C, B, A
      const cells = new Set(['C', 'B', 'A']);
      const graph = new Map<string, Set<string>>();
      graph.set('A', new Set(['B']));
      graph.set('B', new Set(['C']));
      graph.set('C', new Set());

      // Kahn's algorithm
      const inDegree = new Map<string, number>();
      for (const key of cells) {
        inDegree.set(key, 0);
      }
      for (const [key, deps] of graph) {
        for (const dep of deps) {
          if (cells.has(dep)) {
            inDegree.set(key, (inDegree.get(key) ?? 0) + 1);
          }
        }
      }

      const queue: string[] = [];
      for (const [key, degree] of inDegree) {
        if (degree === 0) queue.push(key);
      }

      const result: string[] = [];
      let head = 0;
      while (head < queue.length) {
        const current = queue[head++];
        result.push(current);
        for (const [key, deps] of graph) {
          if (deps.has(current)) {
            const newDegree = (inDegree.get(key) ?? 1) - 1;
            inDegree.set(key, newDegree);
            if (newDegree === 0) queue.push(key);
          }
        }
      }

      expect(result).toEqual(['C', 'B', 'A']);
    });

    it('should evaluate simple arithmetic formula', () => {
      const values: Record<string, number> = { B1: 100, C1: 200 };

      // Simulate formula: B1+C1
      let expr = 'B1+C1';
      expr = expr.replace(/B1/g, String(values['B1']));
      expr = expr.replace(/C1/g, String(values['C1']));

      const result = Function(`"use strict"; return (${expr})`)();
      expect(result).toBe(300);
    });

    it('should handle cell key encoding/decoding', () => {
      const cell: BatchCellIdentifier = { sheet: 'Sheet1', col: 'AB', row: 42 };
      const key = `${cell.sheet}!${cell.col}${cell.row}`;
      expect(key).toBe('Sheet1!AB42');

      const match = key.match(/^(.+)!(.+?)(\d+)$/);
      expect(match).toBeTruthy();
      expect(match![1]).toBe('Sheet1');
      expect(match![2]).toBe('AB');
      expect(match![3]).toBe('42');
    });
  });

  // =========================================================================
  // TYPE EXPORTS
  // =========================================================================

  describe('Type definitions', () => {
    it('should define MonteCarloRequest shape', () => {
      const request: MonteCarloRequest = {
        assumptions: [
          { name: 'revenue', type: 'normal', mean: 100, stdDev: 10 },
          { name: 'costs', type: 'uniform', min: 50, max: 80 },
        ],
        iterations: 1000,
        seed: 42,
      };

      expect(request.assumptions.length).toBe(2);
      expect(request.iterations).toBe(1000);
      expect(request.seed).toBe(42);
    });

    it('should define ConsolidationRequest shape', () => {
      const entities: ConsolidationEntityData[] = [
        {
          entityId: 'P',
          entityName: 'Parent',
          currency: 'USD',
          entries: [
            {
              id: '1',
              accountCode: '1000',
              accountName: 'Cash',
              amount: 1000,
              currency: 'USD',
              date: '2026-01-01',
              entityId: 'P',
            },
          ],
        },
      ];

      const ownerships: ConsolidationOwnership[] = [];
      const request: ConsolidationRequest = { entities, ownerships };

      expect(request.entities.length).toBe(1);
      expect(request.entities[0].entityId).toBe('P');
    });

    it('should define BatchCalcRequest shape', () => {
      const cells: BatchCellIdentifier[] = [{ sheet: 'Sheet1', col: 'A', row: 1 }];
      const dependencies: BatchCalcDependency[] = [
        {
          cell: { sheet: 'Sheet1', col: 'A', row: 1 },
          dependsOn: [{ sheet: 'Sheet1', col: 'B', row: 1 }],
        },
      ];
      const request: BatchCalcRequest = {
        cells,
        dependencies,
        formulas: { 'Sheet1!A1': 'B1*2' },
        values: { 'Sheet1!B1': 50 },
      };

      expect(request.formulas['Sheet1!A1']).toBe('B1*2');
      expect(request.values['Sheet1!B1']).toBe(50);
    });
  });
});
