import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

type FormulaWorkerRequest = {
  type: 'full' | 'incremental' | 'batch';
  cells: Record<string, number>[];
  formulas: Record<string, string>;
  dirtyCells?: string[];
  batchIndex?: number;
  totalBatches?: number;
};

type FormulaWorkerResponse = {
  type: 'result' | 'progress' | 'error';
  result?: Record<string, number>[];
  progress?: { processed: number; total: number; percentage: number };
  error?: string;
  batchIndex?: number;
};

describe('formulaWorker', () => {
  let postMessages: FormulaWorkerResponse[];

  beforeAll(async () => {
    postMessages = [];
    vi.spyOn(self, 'postMessage').mockImplementation((msg) => {
      postMessages.push(msg as FormulaWorkerResponse);
    });
    await import('./formulaWorker');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    postMessages = [];
  });

  function sendRequest(req: FormulaWorkerRequest): void {
    const event = new MessageEvent('message', { data: req });
    self.onmessage?.(event);
  }

  function getLastResult(): FormulaWorkerResponse | undefined {
    return postMessages.find((m) => m.type === 'result');
  }

  function getLastError(): string | undefined {
    const errorMsg = postMessages.find((m) => m.type === 'error');
    return errorMsg?.error;
  }

  describe('full calculation', () => {
    it('evaluates formulas across cells', () => {
      sendRequest({
        type: 'full',
        cells: [
          { revenue: 1000, costs: 400 },
          { revenue: 2000, costs: 1500 },
        ],
        formulas: { profit: 'revenue - costs', margin: '(revenue - costs) / revenue * 100' },
      });
      const last = getLastResult();
      expect(last?.result).toHaveLength(2);
      expect(last?.result?.[0].profit).toBe(600);
      expect(last?.result?.[0].margin).toBe(60);
    });

    it('evaluates formulas with only numbers', () => {
      sendRequest({
        type: 'full',
        cells: [
          { a: 10, b: 20 },
          { a: 5, b: 5 },
        ],
        formulas: { sum: 'a + b', product: 'a * b' },
      });
      const last = getLastResult();
      expect(last?.result?.[0].sum).toBe(30);
      expect(last?.result?.[0].product).toBe(200);
      expect(last?.result?.[1].sum).toBe(10);
      expect(last?.result?.[1].product).toBe(25);
    });

    it('handles empty formulas', () => {
      sendRequest({
        type: 'full',
        cells: [{ a: 10 }],
        formulas: {},
      });
      const last = getLastResult();
      expect(last?.result).toEqual([{ a: 10 }]);
    });

    it('handles empty cells array', () => {
      sendRequest({
        type: 'full',
        cells: [],
        formulas: { x: '1 + 1' },
      });
      const last = getLastResult();
      expect(last?.result).toEqual([]);
    });
  });

  describe('incremental calculation', () => {
    it('recalculates only dirty cells', () => {
      sendRequest({
        type: 'incremental',
        cells: [
          { a: 10, b: 20, sum: 30 },
          { a: 5, b: 5, sum: 10 },
        ],
        formulas: { sum: 'a + b' },
        dirtyCells: ['0'],
      });
      const last = getLastResult();
      expect(last?.result?.[0].sum).toBe(30);
      expect(last?.result?.[1]).toEqual({ a: 5, b: 5, sum: 10 });
    });

    it('recalculates all when dirtyCells contains "*"', () => {
      sendRequest({
        type: 'incremental',
        cells: [
          { a: 1, b: 2 },
          { a: 3, b: 4 },
        ],
        formulas: { sum: 'a + b' },
        dirtyCells: ['*'],
      });
      const last = getLastResult();
      expect(last?.result?.[0].sum).toBe(3);
      expect(last?.result?.[1].sum).toBe(7);
    });

    it('throws when dirtyCells is missing', () => {
      sendRequest({
        type: 'incremental',
        cells: [{ a: 1 }],
        formulas: { b: 'a * 2' },
      } as FormulaWorkerRequest);
      expect(getLastError()).toContain('dirtyCells');
    });
  });

  describe('batch calculation', () => {
    it('processes a batch chunk', () => {
      sendRequest({
        type: 'batch',
        cells: [{ a: 10 }, { a: 20 }, { a: 30 }, { a: 40 }],
        formulas: { doubled: 'a * 2' },
        batchIndex: 0,
        totalBatches: 2,
      });
      expect(postMessages.filter((m) => m.type === 'progress')).toHaveLength(1);
      const last = getLastResult();
      expect(last?.result).toHaveLength(2);
      expect(last?.result?.[0].doubled).toBe(20);
      expect(last?.result?.[1].doubled).toBe(40);
      expect(last?.batchIndex).toBe(0);
    });

    it('handles last batch with remaining items', () => {
      sendRequest({
        type: 'batch',
        cells: [{ a: 10 }, { a: 20 }, { a: 30 }],
        formulas: { doubled: 'a * 2' },
        batchIndex: 1,
        totalBatches: 2,
      });
      const last = getLastResult();
      expect(last?.result).toHaveLength(1);
      expect(last?.result?.[0].doubled).toBe(60);
    });

    it('throws when batchIndex or totalBatches is missing', () => {
      sendRequest({
        type: 'batch',
        cells: [{ a: 1 }],
        formulas: { b: 'a * 2' },
      } as FormulaWorkerRequest);
      expect(getLastError()).toContain('batchIndex');
    });
  });

  describe('safe expression evaluation', () => {
    it('rejects unsafe expressions', () => {
      sendRequest({
        type: 'full',
        cells: [{ a: 1 }],
        formulas: { b: 'a + process.exit(0)' },
      });
      const last = getLastResult();
      expect(last?.result?.[0].b).toBe(0);
    });

    it('handles division', () => {
      sendRequest({
        type: 'full',
        cells: [{ a: 10, b: 3 }],
        formulas: { quotient: 'a / b' },
      });
      const last = getLastResult();
      expect(last?.result?.[0].quotient).toBeCloseTo(3.333, 1);
    });

    it('handles parentheses', () => {
      sendRequest({
        type: 'full',
        cells: [{ a: 2, b: 3, c: 4 }],
        formulas: { result: '(a + b) * c' },
      });
      const last = getLastResult();
      expect(last?.result?.[0].result).toBe(20);
    });
  });

  describe('error handling', () => {
    it('reports unknown request type', () => {
      sendRequest({
        type: 'unknown' as 'full',
        cells: [],
        formulas: {},
      });
      expect(getLastError() || postMessages[0]?.error).toBeTruthy();
    });

    it('handles unknown cell references gracefully', () => {
      sendRequest({
        type: 'full',
        cells: [{ a: 10 }],
        formulas: { b: 'nonexistent * 2' },
      });
      const last = getLastResult();
      expect(last?.result?.[0].b).toBe(0);
    });
  });
});
