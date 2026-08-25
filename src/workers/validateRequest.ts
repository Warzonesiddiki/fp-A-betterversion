/**
 * Shared worker request-validation guards (W7E / W6-P1).
 *
 * W6-P1 audit finding: none of the four workers validated incoming payloads
 * before running math — NaN amounts poisoned Decimal sums silently, NaN or
 * 1e9 iterations produced empty statistics or effectively-hung simulations,
 * and storage.worker destructured its envelope OUTSIDE its try block so a
 * null message crashed the worker uncaught.
 *
 * This module is the single choke point between `self.onmessage` and the
 * math. Every guard throws `WorkerRequestError`; worker handlers catch it and
 * reply through the existing `{ type: 'error' }` protocol. Domain validators
 * return freshly-checked request objects; they never mutate their input.
 *
 * Iteration cap source of truth: monte-carlo.worker.ts header comment —
 * "Supports up to 1,000,000 iterations" — so oversized iteration counts are
 * CLAMPED to that contract rather than rejected.
 */

import type {
  MonteCarloRequest,
  MonteCarloDistribution,
  ConsolidationRequest,
  ConsolidationEntityData,
  ConsolidationGLEntry,
  ConsolidationOwnership,
  ConsolidationICPair,
  ConsolidationFXRate,
  ConsolidationAdjustment,
  BatchCalcRequest,
} from './types';

// --- Error type ---

export class WorkerRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkerRequestError';
  }
}

// --- Narrow primitive guards ---

export function expectObject(value: unknown, name: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new WorkerRequestError(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function expectFiniteNumber(value: unknown, name: string, max?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new WorkerRequestError(`${name} must be a finite number`);
  }
  if (max !== undefined && value > max) {
    throw new WorkerRequestError(`${name} must be <= ${max}`);
  }
  return value;
}

export function expectArray<T = unknown>(value: unknown, name: string, maxLength?: number): T[] {
  if (!Array.isArray(value)) {
    throw new WorkerRequestError(`${name} must be an array`);
  }
  if (maxLength !== undefined && value.length > maxLength) {
    throw new WorkerRequestError(`${name} length must be <= ${maxLength}`);
  }
  return value as T[];
}

export function expectStringEnum(value: unknown, name: string, allowed: readonly string[]): string {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new WorkerRequestError(`${name} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

function expectNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string') {
    throw new WorkerRequestError(`${name} must be a string`);
  }
  return value;
}

/** Optional numeric field: validates only when present. */
function expectOptionalFiniteNumber(value: unknown, name: string): number | undefined {
  return value === undefined ? undefined : expectFiniteNumber(value, name);
}

// --- Iterations clamp (monte-carlo header contract) ---

export const MONTE_CARLO_MAX_ITERATIONS = 1_000_000;

export function clampIterations(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.floor(n), 0), MONTE_CARLO_MAX_ITERATIONS);
}

// --- Message envelope guards ---

/** Extracts `id` without throwing; malformed envelopes yield ''. */
export function readMessageId(envelope: unknown): string {
  if (envelope !== null && typeof envelope === 'object') {
    const id = (envelope as Record<string, unknown>).id;
    if (typeof id === 'string') return id;
  }
  return '';
}

/** Extracts `payload`, rejecting envelopes that are not objects. */
export function readMessagePayload(envelope: unknown): unknown {
  return expectObject(envelope, 'message').payload;
}

// --- Monte Carlo ---

const DISTRIBUTION_TYPES = ['normal', 'uniform', 'triangular'] as const;

function validateDistribution(raw: unknown, index: number): MonteCarloDistribution {
  const a = expectObject(raw, `assumptions[${index}]`);
  const p = `assumptions[${index}]`;
  // Fields are readonly on MonteCarloDistribution, so the validated copy is
  // built in one expression; absent optionals stay absent.
  return {
    name: expectNonEmptyString(a.name, `${p}.name`),
    type: expectStringEnum(
      a.type,
      `${p}.type`,
      DISTRIBUTION_TYPES
    ) as MonteCarloDistribution['type'],
    ...(a.mean !== undefined ? { mean: expectFiniteNumber(a.mean, `${p}.mean`) } : {}),
    ...(a.stdDev !== undefined ? { stdDev: expectFiniteNumber(a.stdDev, `${p}.stdDev`) } : {}),
    ...(a.min !== undefined ? { min: expectFiniteNumber(a.min, `${p}.min`) } : {}),
    ...(a.max !== undefined ? { max: expectFiniteNumber(a.max, `${p}.max`) } : {}),
    ...(a.mode !== undefined ? { mode: expectFiniteNumber(a.mode, `${p}.mode`) } : {}),
  };
}

export function validateMonteCarloRequest(raw: unknown): MonteCarloRequest {
  const payload = expectObject(raw, 'payload');
  const assumptionsRaw = expectArray(payload.assumptions, 'assumptions');
  return {
    assumptions: assumptionsRaw.map(validateDistribution),
    iterations: clampIterations(expectFiniteNumber(payload.iterations, 'iterations')),
    seed: expectOptionalFiniteNumber(payload.seed, 'seed'),
  };
}

// --- Consolidation ---

function validateGLEntry(raw: unknown, index: number): ConsolidationGLEntry {
  const e = expectObject(raw, `entities[].entries[${index}]`);
  expectFiniteNumber(e.amount, `entries[${index}].amount`);
  expectOptionalFiniteNumber(e.debit, `entries[${index}].debit`);
  expectOptionalFiniteNumber(e.credit, `entries[${index}].credit`);
  return e as unknown as ConsolidationGLEntry;
}

function validateEntityData(raw: unknown, index: number): ConsolidationEntityData {
  const entity = expectObject(raw, `entities[${index}]`);
  expectArray(entity.entries, `entities[${index}].entries`).map(validateGLEntry);
  return entity as unknown as ConsolidationEntityData;
}

function validateOwnership(raw: unknown, index: number): ConsolidationOwnership {
  const o = expectObject(raw, `ownerships[${index}]`);
  expectFiniteNumber(o.ownershipPct, `ownerships[${index}].ownershipPct`);
  expectOptionalFiniteNumber(o.acquisitionCost, `ownerships[${index}].acquisitionCost`);
  expectOptionalFiniteNumber(
    o.bookValueAtAcquisition,
    `ownerships[${index}].bookValueAtAcquisition`
  );
  return o as unknown as ConsolidationOwnership;
}

function validateICPair(raw: unknown, index: number): ConsolidationICPair {
  const p = expectObject(raw, `icPairs[${index}]`);
  expectFiniteNumber(p.amount, `icPairs[${index}].amount`);
  return p as unknown as ConsolidationICPair;
}

function validateFXRate(raw: unknown, index: number): ConsolidationFXRate {
  const r = expectObject(raw, `fxRates[${index}]`);
  expectFiniteNumber(r.rate, `fxRates[${index}].rate`);
  return r as unknown as ConsolidationFXRate;
}

function validateAdjustment(raw: unknown, index: number): ConsolidationAdjustment {
  const a = expectObject(raw, `adjustments[${index}]`);
  expectFiniteNumber(a.debitAmount, `adjustments[${index}].debitAmount`);
  expectFiniteNumber(a.creditAmount, `adjustments[${index}].creditAmount`);
  return a as unknown as ConsolidationAdjustment;
}

export function validateConsolidationRequest(raw: unknown): ConsolidationRequest {
  const payload = expectObject(raw, 'payload');
  return {
    entities: expectArray<ConsolidationEntityData>(payload.entities, 'entities').map(
      validateEntityData
    ),
    ownerships: expectArray<ConsolidationOwnership>(payload.ownerships, 'ownerships').map(
      validateOwnership
    ),
    icPairs: expectArray<ConsolidationICPair>(payload.icPairs ?? [], 'icPairs').map(validateICPair),
    fxRates: expectArray<ConsolidationFXRate>(payload.fxRates ?? [], 'fxRates').map(validateFXRate),
    adjustments: expectArray<ConsolidationAdjustment>(payload.adjustments ?? [], 'adjustments').map(
      validateAdjustment
    ),
  };
}

// --- Batch calc ---

function validateRecordOf<T>(
  value: unknown,
  name: string,
  checkItem: (item: unknown, key: string) => T
): Record<string, T> {
  const record = expectObject(value, name);
  const result: Record<string, T> = {};
  for (const [key, item] of Object.entries(record)) {
    result[key] = checkItem(item, `${name}[${key}]`);
  }
  return result;
}

export function validateBatchCalcRequest(raw: unknown): BatchCalcRequest {
  const payload = expectObject(raw, 'payload');
  return {
    cells: expectArray(payload.cells, 'cells') as unknown as BatchCalcRequest['cells'],
    dependencies: expectArray(
      payload.dependencies ?? [],
      'dependencies'
    ) as unknown as BatchCalcRequest['dependencies'],
    formulas: validateRecordOf(payload.formulas, 'formulas', (f, key) =>
      expectNonEmptyString(f, key)
    ),
    values: validateRecordOf(payload.values, 'values', (v, key) => expectFiniteNumber(v, key)),
    maxIterations: expectOptionalFiniteNumber(payload.maxIterations, 'maxIterations'),
    convergenceThreshold: expectOptionalFiniteNumber(
      payload.convergenceThreshold,
      'convergenceThreshold'
    ),
  };
}
