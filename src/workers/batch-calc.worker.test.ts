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

  // ---------------------------------------------------------------------------
  // W6-P0-01 class guard: a failing formula must never silently zero.
  // One guard for the whole silent-zero class, not per instance.
  // ---------------------------------------------------------------------------
  describe('W6-P0-01 silent-zero class guard', () => {
    it('erroring cells are listed in errors and keep their prior value — never a fresh 0', () => {
      self.onmessage?.(
        new MessageEvent('message', {
          data: {
            id: 'w6p001',
            type: 'compute',
            payload: {
              cells: [
                { sheet: 'Sheet', col: 'A', row: 1 },
                { sheet: 'Sheet', col: 'A', row: 2 },
                { sheet: 'Sheet', col: 'A', row: 3 },
              ],
              dependencies: [
                {
                  cell: { sheet: 'Sheet', col: 'A', row: 1 },
                  dependsOn: [
                    { sheet: 'Sheet', col: 'B', row: 1 },
                    { sheet: 'Sheet', col: 'C', row: 1 },
                  ],
                },
                { cell: { sheet: 'Sheet', col: 'A', row: 2 }, dependsOn: [] },
                {
                  cell: { sheet: 'Sheet', col: 'A', row: 3 },
                  dependsOn: [{ sheet: 'Sheet', col: 'B', row: 1 }],
                },
              ],
              formulas: {
                'Sheet!A1': 'Sheet!B1+Sheet!C1',
                'Sheet!A2': '1/0',
                'Sheet!A3': 'FOO(Sheet!B1)',
              },
              values: {
                'Sheet!A1': 0,
                'Sheet!A2': 777,
                'Sheet!A3': 555,
                'Sheet!B1': 100,
                'Sheet!C1': 200,
              },
              maxIterations: 10,
              convergenceThreshold: 1e-10,
            },
          },
        })
      );
      const payload = getLastPayload();
      // Good cells still compute.
      expect(payload?.updatedValues['Sheet!A1']).toBe(300);
      // Both bad cells are reported by key...
      expect(payload?.errors).toContain('Sheet!A2');
      expect(payload?.errors).toContain('Sheet!A3');
      // ...and neither was silently zeroed: the prior value survives so a
      // consumer can show "stale", not a fabricated 0.
      expect(payload?.updatedValues['Sheet!A2']).toBe(777);
      expect(payload?.updatedValues['Sheet!A3']).toBe(555);
    });
  });

  // ---------------------------------------------------------------------------
  // W7E / W6-P1: request validation before math
  // ---------------------------------------------------------------------------
  describe('W7E/W6-P1 request validation', () => {
    function dispatch(payload: unknown): void {
      self.onmessage?.(
        new MessageEvent('message', { data: { id: 'w7e-batch', type: 'compute', payload } })
      );
    }

    const validPayload = () => ({
      cells: [{ sheet: 'S', col: 'A', row: 1 }],
      dependencies: [{ cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [] }],
      formulas: { 'S!A1': 'S!B1*2' },
      values: { 'S!A1': 0, 'S!B1': 21 },
    });

    it('rejects values records holding NaN instead of evaluating with NaN', () => {
      // Pre-fix: String(NaN) was substituted into the expression, the safe
      // evaluator threw per-cell, and the worker returned a "successful"
      // result with the cell silently recorded in errors[].
      dispatch({ ...validPayload(), values: { 'S!A1': 0, 'S!B1': Number.NaN } });
      const error = postMessages.find((m) => m.type === 'error');
      expect(error?.error).toMatch(/values/i);
    });

    it('rejects formulas records holding non-string formulas', () => {
      dispatch({
        ...validPayload(),
        formulas: { 'S!A1': 42 },
      });
      const error = postMessages.find((m) => m.type === 'error');
      expect(error?.error).toMatch(/formulas/i);
    });

    it('null envelope data produces exactly one error reply, no crash', () => {
      expect(() => self.onmessage?.(new MessageEvent('message', { data: null }))).not.toThrow();
      const errors = postMessages.filter((m) => m.type === 'error');
      expect(errors.length).toBe(1);
    });
  });
});
