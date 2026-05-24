import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import type { WorkerResponse, BatchCalcResponse } from './types';

describe('batch-calc.worker', () => {
  let postMessages: WorkerResponse[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg as WorkerResponse);
    });
    await import('./batch-calc.worker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  function getLastPayload(): BatchCalcResponse | undefined {
    const result = postMessages.find((m) => m.type === 'result');
    return result?.payload as BatchCalcResponse | undefined;
  }

  function getLastError(): string | undefined {
    const errorMsg = postMessages.find((m) => m.type === 'error');
    return errorMsg?.error;
  }

  describe('dependency graph and topological sort', () => {
    it('processes simple formula A1 = B1 + C1', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-1',
            type: 'compute',
            payload: {
              cells: [{ sheet: 'Sheet', col: 'A', row: 1 }],
              dependencies: [
                {
                  cell: { sheet: 'Sheet', col: 'A', row: 1 },
                  dependsOn: [
                    { sheet: 'Sheet', col: 'B', row: 1 },
                    { sheet: 'Sheet', col: 'C', row: 1 },
                  ],
                },
              ],
              formulas: { 'Sheet!A1': 'Sheet!B1+Sheet!C1' },
              values: { 'Sheet!A1': 0, 'Sheet!B1': 100, 'Sheet!C1': 200 },
              maxIterations: 10,
              convergenceThreshold: 1e-10,
            },
          },
        })
      );
      const payload = getLastPayload();
      expect(payload?.updatedValues['Sheet!A1']).toBe(300);
      expect(payload?.converged).toBe(true);
      expect(payload?.dirtyCells).toContain('Sheet!A1');
    });

    it('handles chained dependencies A1 = B1, B1 = C1', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-2',
            type: 'compute',
            payload: {
              cells: [{ sheet: 'S', col: 'A', row: 1 }],
              dependencies: [
                {
                  cell: { sheet: 'S', col: 'A', row: 1 },
                  dependsOn: [{ sheet: 'S', col: 'B', row: 1 }],
                },
                {
                  cell: { sheet: 'S', col: 'B', row: 1 },
                  dependsOn: [{ sheet: 'S', col: 'C', row: 1 }],
                },
              ],
              formulas: { 'S!A1': 'S!B1', 'S!B1': 'S!C1' },
              values: { 'S!A1': 0, 'S!B1': 0, 'S!C1': 42 },
              maxIterations: 10,
              convergenceThreshold: 1e-10,
            },
          },
        })
      );
      const payload = getLastPayload();
      expect(payload?.updatedValues['S!A1']).toBe(42);
      expect(payload?.updatedValues['S!B1']).toBe(42);
    });

    it('detects affected cells through reverse graph', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-3',
            type: 'compute',
            payload: {
              cells: [{ sheet: 'S', col: 'C', row: 1 }],
              dependencies: [
                {
                  cell: { sheet: 'S', col: 'A', row: 1 },
                  dependsOn: [{ sheet: 'S', col: 'B', row: 1 }],
                },
                {
                  cell: { sheet: 'S', col: 'B', row: 1 },
                  dependsOn: [{ sheet: 'S', col: 'C', row: 1 }],
                },
              ],
              formulas: { 'S!A1': 'S!B1', 'S!B1': 'S!C1' },
              values: { 'S!A1': 0, 'S!B1': 0, 'S!C1': 99 },
              maxIterations: 10,
              convergenceThreshold: 1e-10,
            },
          },
        })
      );
      const payload = getLastPayload();
      expect(payload?.affectedCells).toContain('S!B1');
      expect(payload?.affectedCells).toContain('S!A1');
    });
  });

  describe('empty and edge cases', () => {
    it('returns initial values for empty cells', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-empty',
            type: 'compute',
            payload: {
              cells: [],
              dependencies: [],
              formulas: {},
              values: {},
              maxIterations: 10,
            },
          },
        })
      );
      const payload = getLastPayload();
      expect(payload?.updatedValues).toEqual({});
      expect(payload?.converged).toBe(true);
      expect(payload?.iterationCount).toBe(0);
    });

    it('converges immediately for single constant', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-const',
            type: 'compute',
            payload: {
              cells: [{ sheet: 'S', col: 'A', row: 1 }],
              dependencies: [{ cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [] }],
              formulas: { 'S!A1': '42' },
              values: { 'S!A1': 0 },
              maxIterations: 10,
              convergenceThreshold: 1e-10,
            },
          },
        })
      );
      const payload = getLastPayload();
      expect(payload?.updatedValues['S!A1']).toBe(42);
      expect(payload?.iterationCount).toBe(2);
    });
  });

  describe('formula evaluation', () => {
    it('evaluates SUM function', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-sum',
            type: 'compute',
            payload: {
              cells: [{ sheet: 'S', col: 'A', row: 1 }],
              dependencies: [{ cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [] }],
              formulas: { 'S!A1': 'SUM(10,20,30)' },
              values: { 'S!A1': 0 },
              maxIterations: 10,
            },
          },
        })
      );
      expect(getLastPayload()?.updatedValues['S!A1']).toBe(60);
    });

    it('evaluates AVERAGE function', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-avg',
            type: 'compute',
            payload: {
              cells: [{ sheet: 'S', col: 'A', row: 1 }],
              dependencies: [{ cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [] }],
              formulas: { 'S!A1': 'AVERAGE(10,20,30)' },
              values: { 'S!A1': 0 },
              maxIterations: 10,
            },
          },
        })
      );
      expect(getLastPayload()?.updatedValues['S!A1']).toBe(20);
    });

    it('evaluates MAX and MIN functions', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-maxmin',
            type: 'compute',
            payload: {
              cells: [
                { sheet: 'S', col: 'A', row: 1 },
                { sheet: 'S', col: 'B', row: 1 },
              ],
              dependencies: [
                { cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [] },
                { cell: { sheet: 'S', col: 'B', row: 1 }, dependsOn: [] },
              ],
              formulas: { 'S!A1': 'MAX(5,10,3)', 'S!B1': 'MIN(5,10,3)' },
              values: { 'S!A1': 0, 'S!B1': 0 },
              maxIterations: 10,
            },
          },
        })
      );
      const payload = getLastPayload();
      expect(payload?.updatedValues['S!A1']).toBe(10);
      expect(payload?.updatedValues['S!B1']).toBe(3);
    });
  });

  describe('error handling', () => {
    it('reports worker errors', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'test-err',
            type: 'compute',
            payload: null,
          },
        })
      );
      expect(getLastError()).toBeTruthy();
    });
  });
});
