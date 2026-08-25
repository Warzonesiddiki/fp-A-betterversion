/**
 * W7E / W6-P1: unit tests for the shared worker request-validation guards.
 *
 * Contract under test:
 * - Every helper throws `WorkerRequestError` (a named Error subclass) on
 *   invalid input and returns a narrowed value otherwise.
 * - `clampIterations` enforces the monte-carlo.worker header contract
 *   ("Supports up to 1,000,000 iterations"): 1e9 clamps to exactly
 *   1_000_000; non-finite and negative values collapse to 0 (which the
 *   worker's existing early-return turns into empty statistics).
 * - Domain validators (`validate*Request`) reject malformed payloads BEFORE
 *   any math runs: NaN amounts, non-finite numbers, wrong shapes.
 */

import { describe, it, expect } from 'vitest';
import {
  WorkerRequestError,
  expectFiniteNumber,
  expectArray,
  expectObject,
  expectStringEnum,
  clampIterations,
  MONTE_CARLO_MAX_ITERATIONS,
  readMessageId,
  readMessagePayload,
  validateMonteCarloRequest,
  validateConsolidationRequest,
  validateBatchCalcRequest,
} from './validateRequest';
import type { MonteCarloRequest, ConsolidationRequest, BatchCalcRequest } from './types';

describe('WorkerRequestError', () => {
  it('is an Error with a stable name', () => {
    const err = new WorkerRequestError('bad input');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('WorkerRequestError');
    expect(err.message).toBe('bad input');
  });
});

describe('expectFiniteNumber', () => {
  it('passes through finite numbers', () => {
    expect(expectFiniteNumber(42, 'v')).toBe(42);
    expect(expectFiniteNumber(-3.5, 'v')).toBe(-3.5);
    expect(expectFiniteNumber(0, 'v')).toBe(0);
  });

  it('rejects NaN, Infinity, and non-number types', () => {
    expect(() => expectFiniteNumber(Number.NaN, 'amount')).toThrow(WorkerRequestError);
    expect(() => expectFiniteNumber(Number.POSITIVE_INFINITY, 'v')).toThrow(WorkerRequestError);
    expect(() => expectFiniteNumber(Number.NEGATIVE_INFINITY, 'v')).toThrow(WorkerRequestError);
    expect(() => expectFiniteNumber('5', 'v')).toThrow(WorkerRequestError);
    expect(() => expectFiniteNumber(null, 'v')).toThrow(WorkerRequestError);
    expect(() => expectFiniteNumber(undefined, 'v')).toThrow(WorkerRequestError);
  });

  it('error message names the offending field', () => {
    expect(() => expectFiniteNumber(Number.NaN, 'entries[2].amount')).toThrow(
      /entries\[2\]\.amount/
    );
  });

  it('enforces an inclusive upper bound when max is provided', () => {
    expect(expectFiniteNumber(100, 'pct', 100)).toBe(100);
    expect(() => expectFiniteNumber(100.01, 'pct', 100)).toThrow(WorkerRequestError);
    expect(() => expectFiniteNumber(101, 'pct', 100)).toThrow(/<= 100/);
  });
});

describe('expectArray', () => {
  it('passes through arrays', () => {
    const arr = [1, 2, 3];
    expect(expectArray<number>(arr, 'items')).toBe(arr);
    expect(expectArray([], 'items')).toEqual([]);
  });

  it('rejects non-arrays including objects and null', () => {
    expect(() => expectArray({}, 'items')).toThrow(WorkerRequestError);
    expect(() => expectArray('nope', 'items')).toThrow(WorkerRequestError);
    expect(() => expectArray(null, 'items')).toThrow(WorkerRequestError);
    expect(() => expectArray(undefined, 'items')).toThrow(/items/);
  });

  it('enforces maxLength when provided', () => {
    expect(expectArray([1, 2, 3], 'items', 3)).toEqual([1, 2, 3]);
    expect(() => expectArray([1, 2, 3, 4], 'items', 3)).toThrow(/<= 3/);
  });
});

describe('expectObject', () => {
  it('passes through plain objects and rejects arrays/null/scalars', () => {
    const obj = { a: 1 };
    expect(expectObject(obj, 'req')).toBe(obj);
    expect(() => expectObject([], 'req')).toThrow(WorkerRequestError);
    expect(() => expectObject(null, 'req')).toThrow(WorkerRequestError);
    expect(() => expectObject('x', 'req')).toThrow(WorkerRequestError);
  });
});

describe('expectStringEnum', () => {
  const TYPES = ['stringify', 'parse'] as const;

  it('passes allowed values through', () => {
    expect(expectStringEnum('stringify', 'type', TYPES)).toBe('stringify');
    expect(expectStringEnum('parse', 'type', TYPES)).toBe('parse');
  });

  it('rejects disallowed, non-string, and case-mismatched values', () => {
    expect(() => expectStringEnum('delete', 'type', TYPES)).toThrow(WorkerRequestError);
    expect(() => expectStringEnum('STRINGIFY', 'type', TYPES)).toThrow(WorkerRequestError);
    expect(() => expectStringEnum(42, 'type', TYPES)).toThrow(WorkerRequestError);
    expect(() => expectStringEnum(null, 'type', TYPES)).toThrow(WorkerRequestError);
  });
});

describe('clampIterations', () => {
  it('clamps 1e9 to the 1,000,000 header-contract cap', () => {
    expect(MONTE_CARLO_MAX_ITERATIONS).toBe(1_000_000);
    expect(clampIterations(1_000_000_000)).toBe(1_000_000);
    expect(clampIterations(Number.MAX_SAFE_INTEGER)).toBe(1_000_000);
  });

  it('keeps in-range values (floored to integers)', () => {
    expect(clampIterations(100)).toBe(100);
    expect(clampIterations(10.9)).toBe(10);
    expect(clampIterations(1_000_000)).toBe(1_000_000);
  });

  it('collapses negatives and non-finite values to 0', () => {
    expect(clampIterations(-5)).toBe(0);
    expect(clampIterations(0)).toBe(0);
    expect(clampIterations(Number.NaN)).toBe(0);
    expect(clampIterations(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('message envelope guards', () => {
  it('readMessageId extracts string ids and defaults garbage envelopes to ""', () => {
    expect(readMessageId({ id: 'task-1', payload: {} })).toBe('task-1');
    expect(readMessageId(null)).toBe('');
    expect(readMessageId(undefined)).toBe('');
    expect(readMessageId(42)).toBe('');
    expect(readMessageId({ id: 7 })).toBe('');
  });

  it('readMessagePayload extracts payload and rejects null envelopes', () => {
    expect(readMessagePayload({ id: 't', payload: { a: 1 } })).toEqual({ a: 1 });
    expect(readMessagePayload({ id: 't', payload: null })).toBeNull();
    expect(() => readMessagePayload(null)).toThrow(WorkerRequestError);
    expect(() => readMessagePayload('garbage')).toThrow(WorkerRequestError);
  });
});

// ---------------------------------------------------------------------------
// Domain validators
// ---------------------------------------------------------------------------

const VALID_MC_PAYLOAD = {
  assumptions: [
    { name: 'revenue', type: 'normal', mean: 1000, stdDev: 100 },
    { name: 'costs', type: 'uniform', min: 500, max: 800 },
  ],
  iterations: 100,
  seed: 42,
};

describe('validateMonteCarloRequest', () => {
  it('accepts a valid payload and preserves fields', () => {
    const req: MonteCarloRequest = validateMonteCarloRequest(VALID_MC_PAYLOAD);
    expect(req.iterations).toBe(100);
    expect(req.seed).toBe(42);
    expect(req.assumptions.length).toBe(2);
  });

  it('rejects null/primitive payloads', () => {
    expect(() => validateMonteCarloRequest(null)).toThrow(WorkerRequestError);
    expect(() => validateMonteCarloRequest('x')).toThrow(WorkerRequestError);
  });

  it('rejects non-array assumptions', () => {
    expect(() => validateMonteCarloRequest({ ...VALID_MC_PAYLOAD, assumptions: 'nope' })).toThrow(
      /assumptions/
    );
  });

  it('rejects assumptions containing non-finite numbers (NaN mean)', () => {
    expect(() =>
      validateMonteCarloRequest({
        ...VALID_MC_PAYLOAD,
        assumptions: [{ name: 'x', type: 'normal', mean: Number.NaN }],
      })
    ).toThrow(WorkerRequestError);
    expect(() =>
      validateMonteCarloRequest({
        ...VALID_MC_PAYLOAD,
        assumptions: [{ name: 'x', type: 'normal', stdDev: Number.POSITIVE_INFINITY }],
      })
    ).toThrow(/stdDev/);
  });

  it('rejects unknown distribution types', () => {
    expect(() =>
      validateMonteCarloRequest({
        ...VALID_MC_PAYLOAD,
        assumptions: [{ name: 'x', type: 'exponential' }],
      })
    ).toThrow(/type/);
  });

  it('rejects NaN iterations instead of silently returning empty stats', () => {
    expect(() =>
      validateMonteCarloRequest({ ...VALID_MC_PAYLOAD, iterations: Number.NaN })
    ).toThrow(WorkerRequestError);
    expect(() => validateMonteCarloRequest({ ...VALID_MC_PAYLOAD, iterations: '1000' })).toThrow(
      WorkerRequestError
    );
  });

  it('clamps iterations above 1e6 to 1_000_000 (header contract)', () => {
    const req = validateMonteCarloRequest({ ...VALID_MC_PAYLOAD, iterations: 1_000_000_000 });
    expect(req.iterations).toBe(1_000_000);
  });

  it('allows omitted seed and zero/negative iterations (existing edge contract)', () => {
    const req: MonteCarloRequest = validateMonteCarloRequest({
      assumptions: VALID_MC_PAYLOAD.assumptions,
      iterations: 0,
    });
    expect(req.seed).toBeUndefined();
    expect(req.iterations).toBe(0);
  });
});

function consolidationFixture(): Record<string, unknown> {
  return {
    entities: [
      {
        entityId: 'P',
        entityName: 'Parent',
        currency: 'USD',
        entries: [
          {
            id: 'p1',
            accountCode: '1000',
            accountName: 'Cash',
            amount: 5000,
            currency: 'USD',
            date: '2026-01-01',
            entityId: 'P',
          },
        ],
      },
    ],
    ownerships: [{ parentId: 'P', childId: 'S1', ownershipPct: 80, method: 'full' }],
    icPairs: [
      { fromEntityId: 'P', toEntityId: 'S1', accountCode: '9001', amount: 100, type: 'receivable' },
    ],
  };
}

describe('validateConsolidationRequest', () => {
  it('accepts a valid payload', () => {
    const req: ConsolidationRequest = validateConsolidationRequest(consolidationFixture());
    expect(req.entities.length).toBe(1);
    expect(req.icPairs?.length).toBe(1);
  });

  it('applies optional-array defaults for icPairs/fxRates/adjustments', () => {
    const fixture = consolidationFixture();
    delete fixture.icPairs;
    const req = validateConsolidationRequest(fixture);
    expect(req.icPairs).toEqual([]);
    expect(req.fxRates).toEqual([]);
    expect(req.adjustments).toEqual([]);
  });

  it('rejects null payloads and non-array entities/ownerships', () => {
    expect(() => validateConsolidationRequest(null)).toThrow(WorkerRequestError);
    expect(() => validateConsolidationRequest({ entities: {}, ownerships: [] })).toThrow(
      /entities/
    );
    expect(() => validateConsolidationRequest({ entities: [], ownerships: 5 })).toThrow(
      /ownerships/
    );
  });

  it('rejects entity entries with NaN amounts before any math runs', () => {
    const fixture = consolidationFixture();
    const entities = fixture.entities as Array<{ entries: Array<Record<string, unknown>> }>;
    entities[0]!.entries[0]!.amount = Number.NaN;
    expect(() => validateConsolidationRequest(fixture)).toThrow(/amount/);
  });

  it('rejects icPairs with non-finite amounts', () => {
    const fixture = consolidationFixture();
    const pairs = fixture.icPairs as Array<Record<string, unknown>>;
    pairs[0]!.amount = Number.POSITIVE_INFINITY;
    expect(() => validateConsolidationRequest(fixture)).toThrow(/amount/);
  });

  it('rejects fx rates that are not finite numbers', () => {
    const fixture = consolidationFixture();
    fixture.fxRates = [
      { fromCurrency: 'EUR', toCurrency: 'USD', rate: '1.1', rateType: 'spot', date: '2026-01-01' },
    ];
    expect(() => validateConsolidationRequest(fixture)).toThrow(WorkerRequestError);
  });

  it('rejects adjustments with non-finite debit/credit amounts', () => {
    const fixture = consolidationFixture();
    fixture.adjustments = [
      {
        accountCode: '1000',
        accountName: 'Goodwill',
        entityId: 'P',
        debitAmount: Number.NaN,
        creditAmount: 0,
        description: 'g',
        type: 'goodwill',
      },
    ];
    expect(() => validateConsolidationRequest(fixture)).toThrow(/debitAmount/);
  });
});

const VALID_BATCH_PAYLOAD = {
  cells: [{ sheet: 'S', col: 'A', row: 1 }],
  dependencies: [{ cell: { sheet: 'S', col: 'A', row: 1 }, dependsOn: [] }],
  formulas: { 'S!A1': 'S!B1+1' },
  values: { 'S!A1': 0, 'S!B1': 41 },
};

describe('validateBatchCalcRequest', () => {
  it('accepts a valid payload', () => {
    const req: BatchCalcRequest = validateBatchCalcRequest(VALID_BATCH_PAYLOAD);
    expect(req.cells.length).toBe(1);
    expect(req.formulas['S!A1']).toBe('S!B1+1');
  });

  it('rejects null payloads and non-array cells/dependencies', () => {
    expect(() => validateBatchCalcRequest(null)).toThrow(WorkerRequestError);
    expect(() => validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, cells: 'x' })).toThrow(/cells/);
    expect(() => validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, dependencies: {} })).toThrow(
      /dependencies/
    );
  });

  it('rejects formulas that are not plain objects or hold non-string formulas', () => {
    expect(() => validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, formulas: null })).toThrow(
      /formulas/
    );
    expect(() =>
      validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, formulas: { 'S!A1': 42 } })
    ).toThrow(/formulas/);
  });

  it('rejects values records holding non-finite numbers (NaN)', () => {
    expect(() =>
      validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, values: { 'S!B1': Number.NaN } })
    ).toThrow(/values/);
    expect(() =>
      validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, values: { 'S!B1': '41' } })
    ).toThrow(/values/);
  });

  it('applies numeric-option defaults only for finite numbers', () => {
    const req = validateBatchCalcRequest(VALID_BATCH_PAYLOAD);
    expect(req.maxIterations).toBeUndefined();
    expect(req.convergenceThreshold).toBeUndefined();

    const bounded = validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, maxIterations: 50 });
    expect(bounded.maxIterations).toBe(50);

    expect(() =>
      validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, maxIterations: Number.NaN })
    ).toThrow(/maxIterations/);
    expect(() =>
      validateBatchCalcRequest({ ...VALID_BATCH_PAYLOAD, convergenceThreshold: '1e-10' })
    ).toThrow(/convergenceThreshold/);
  });
});
