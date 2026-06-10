export interface FormulaWorkerRequest {
  type: 'full' | 'incremental' | 'batch';
  cells: Record<string, number>[];
  formulas: Record<string, string>;
  dirtyCells?: string[];
  batchIndex?: number;
  totalBatches?: number;
}

export interface FormulaWorkerResponse {
  type: 'result' | 'progress' | 'error';
  result?: Record<string, number>[];
  progress?: {
    processed: number;
    total: number;
    percentage: number;
  };
  error?: string;
  batchIndex?: number;
}

function safeEval(expr: string, _context: Record<string, number>): number {
  const cleaned = expr.replace(/\s+/g, '');
  if (!/^[\d+\-*/().]+$/.test(cleaned)) throw new Error('Unsafe expression');

  const tokens: (string | number)[] = [];
  let num = '';
  for (const ch of cleaned) {
    if ('+-*/()'.includes(ch)) {
      if (num) {
        tokens.push(parseFloat(num));
        num = '';
      }
      tokens.push(ch);
    } else {
      num += ch;
    }
  }
  if (num) tokens.push(parseFloat(num));

  const output: (number | string)[] = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const t of tokens) {
    if (typeof t === 'number') {
      output.push(t);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') {
        output.push(ops.pop()!);
      }
      ops.pop();
    } else {
      while (ops.length && prec[ops[ops.length - 1]!]! >= prec[t]!) {
        output.push(ops.pop()!);
      }
      ops.push(t);
    }
  }
  while (ops.length) output.push(ops.pop()!);

  const stack: number[] = [];
  for (const t of output) {
    if (typeof t === 'number') {
      stack.push(t);
    } else {
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (t) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          stack.push(a / b);
          break;
      }
    }
  }
  return stack[0] ?? 0;
}

function evaluateCell(
  cell: Record<string, number>,
  formulas: Record<string, string>
): Record<string, number> {
  const evaluated: Record<string, number> = {};
  for (const [key, formula] of Object.entries(formulas)) {
    try {
      const withValues = formula.replace(/\b([a-zA-Z_]\w*)\b/g, (_, name) => {
        const val = cell[name];
        if (val === undefined) throw new Error(`Unknown reference: ${name}`);
        return String(val);
      });
      evaluated[key] = safeEval(withValues, cell);
    } catch {
      evaluated[key] = 0;
    }
  }
  return { ...cell, ...evaluated };
}

function processFull(
  cells: Record<string, number>[],
  formulas: Record<string, string>
): Record<string, number>[] {
  return cells.map((cell) => evaluateCell(cell, formulas));
}

function processIncremental(
  cells: Record<string, number>[],
  formulas: Record<string, string>,
  dirtyCells: string[]
): Record<string, number>[] {
  const dirtySet = new Set(dirtyCells);
  const results: Record<string, number>[] = [];

  for (let i = 0; i < cells.length; i++) {
    if (dirtySet.has(String(i)) || dirtySet.has('*')) {
      results.push(evaluateCell(cells[i]!, formulas));
    } else {
      results.push(cells[i]!);
    }
  }

  return results;
}

function processBatch(
  cells: Record<string, number>[],
  formulas: Record<string, string>,
  batchIndex: number,
  totalBatches: number
): {
  results: Record<string, number>[];
  progress: { processed: number; total: number; percentage: number };
} {
  const batchSize = Math.ceil(cells.length / totalBatches);
  const start = batchIndex * batchSize;
  const end = Math.min(start + batchSize, cells.length);
  const batchCells = cells.slice(start, end);

  const results = batchCells.map((cell) => evaluateCell(cell, formulas));

  return {
    results,
    progress: {
      processed: end,
      total: cells.length,
      percentage: (end / cells.length) * 100,
    },
  };
}

self.onmessage = (e: MessageEvent<FormulaWorkerRequest>) => {
  const { type, cells, formulas, dirtyCells, batchIndex, totalBatches } = e.data;

  try {
    switch (type) {
      case 'full': {
        const result = processFull(cells, formulas);
        const response: FormulaWorkerResponse = { type: 'result', result };
        self.postMessage(response);
        break;
      }

      case 'incremental': {
        if (!dirtyCells) {
          throw new Error('dirtyCells required for incremental calc');
        }
        const result = processIncremental(cells, formulas, dirtyCells);
        const response: FormulaWorkerResponse = { type: 'result', result };
        self.postMessage(response);
        break;
      }

      case 'batch': {
        if (batchIndex === undefined || totalBatches === undefined) {
          throw new Error('batchIndex and totalBatches required for batch calc');
        }
        const { results, progress } = processBatch(cells, formulas, batchIndex, totalBatches);

        const progressResponse: FormulaWorkerResponse = {
          type: 'progress',
          progress,
          batchIndex,
        };
        self.postMessage(progressResponse);

        const resultResponse: FormulaWorkerResponse = {
          type: 'result',
          result: results,
          batchIndex,
        };
        self.postMessage(resultResponse);
        break;
      }

      default:
        throw new Error(`Unknown request type: ${type}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const response: FormulaWorkerResponse = { type: 'error', error: message };
    self.postMessage(response);
  }
};
