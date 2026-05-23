// =============================================================================
// WEB WORKERS — PUBLIC API
// Provides typed, high-level functions for running heavy calculations in workers.
// Each function manages its own worker pool lifecycle.
// =============================================================================

export { WorkerPool } from './worker-pool';
export type { WorkerPoolOptions } from './worker-pool';

export type {
  WorkerMessage,
  WorkerResponse,
  WorkerProgress,
  MonteCarloDistribution,
  MonteCarloRequest,
  MonteCarloResultItem,
  MonteCarloResponse,
  ConsolidationGLEntry,
  ConsolidationEntityData,
  ConsolidationOwnership,
  ConsolidationICPair,
  ConsolidationFXRate,
  ConsolidationAdjustment,
  ConsolidationRequest,
  ConsolidationResponse,
  BatchCellIdentifier,
  BatchCalcDependency,
  BatchCalcRequest,
  BatchCalcResponse,
} from './types';

import { createMonteCarloPool, createConsolidationPool, createBatchCalcPool } from './worker-pool';
import type { WorkerPool } from './worker-pool';
import type { WorkerProgress } from './types';
import type {
  MonteCarloRequest,
  MonteCarloResponse,
  ConsolidationRequest,
  ConsolidationResponse,
  BatchCalcRequest,
  BatchCalcResponse,
} from './types';

// =============================================================================
// SINGLETON POOLS (lazy-initialized)
// =============================================================================

let monteCarloPool: WorkerPool | null = null;
let consolidationPool: WorkerPool | null = null;
let batchCalcPool: WorkerPool | null = null;

function getMonteCarloPool(): WorkerPool {
  if (!monteCarloPool) {
    monteCarloPool = createMonteCarloPool();
  }
  return monteCarloPool;
}

function getConsolidationPool(): WorkerPool {
  if (!consolidationPool) {
    consolidationPool = createConsolidationPool();
  }
  return consolidationPool;
}

function getBatchCalcPool(): WorkerPool {
  if (!batchCalcPool) {
    batchCalcPool = createBatchCalcPool();
  }
  return batchCalcPool;
}

// =============================================================================
// HIGH-LEVEL API
// =============================================================================

/**
 * Run a Monte Carlo simulation in a Web Worker.
 *
 * @param request - Simulation parameters (assumptions, iterations, optional seed)
 * @param onProgress - Optional progress callback
 * @returns Simulation results with statistical summary
 *
 * @example
 * ```ts
 * const result = await runMonteCarlo({
 *   assumptions: [
 *     { name: 'revenue', type: 'normal', mean: 1000000, stdDev: 100000 },
 *     { name: 'costs', type: 'uniform', min: 500000, max: 800000 },
 *   ],
 *   iterations: 50000,
 * });
 * console.log(result.statistics.p50); // Median output
 * ```
 */
export async function runMonteCarlo(
  request: MonteCarloRequest,
  onProgress?: (progress: WorkerProgress) => void
): Promise<MonteCarloResponse> {
  return getMonteCarloPool().run<MonteCarloResponse>(request, onProgress);
}

/**
 * Run a multi-entity consolidation in a Web Worker.
 *
 * @param request - Consolidation parameters (entities, ownerships, IC pairs, FX rates)
 * @param onProgress - Optional progress callback
 * @returns Consolidation result with eliminations and totals
 *
 * @example
 * ```ts
 * const result = await runConsolidation({
 *   entities: [parentEntity, subEntity1, subEntity2],
 *   ownerships: [
 *     { parentId: 'P', childId: 'S1', ownershipPct: 100, method: 'full' },
 *     { parentId: 'P', childId: 'S2', ownershipPct: 80, method: 'full' },
 *   ],
 *   icPairs: [...],
 * });
 * ```
 */
export async function runConsolidation(
  request: ConsolidationRequest,
  onProgress?: (progress: WorkerProgress) => void
): Promise<ConsolidationResponse> {
  return getConsolidationPool().run<ConsolidationResponse>(request, onProgress);
}

/**
 * Run batch formula recalculation in a Web Worker.
 *
 * @param request - Cell dependencies, formulas, and current values
 * @param onProgress - Optional progress callback
 * @returns Updated values after convergence
 *
 * @example
 * ```ts
 * const result = await runBatchCalc({
 *   cells: [{ sheet: 'Sheet1', col: 'A', row: 1 }],
 *   dependencies: [...],
 *   formulas: { 'Sheet1!A1': 'B1+C1' },
 *   values: { 'Sheet1!B1': 100, 'Sheet1!C1': 200 },
 * });
 * ```
 */
export async function runBatchCalc(
  request: BatchCalcRequest,
  onProgress?: (progress: WorkerProgress) => void
): Promise<BatchCalcResponse> {
  return getBatchCalcPool().run<BatchCalcResponse>(request, onProgress);
}

/**
 * Terminate all worker pools and free resources.
 * Call this when workers are no longer needed (e.g., on app shutdown).
 */
export function terminateAllWorkers(): void {
  if (monteCarloPool) {
    monteCarloPool.terminate();
    monteCarloPool = null;
  }
  if (consolidationPool) {
    consolidationPool.terminate();
    consolidationPool = null;
  }
  if (batchCalcPool) {
    batchCalcPool.terminate();
    batchCalcPool = null;
  }
}

/**
 * Get combined status of all worker pools.
 */
export function getWorkerPoolStatus(): {
  monteCarlo: { workers: number; busy: number; queued: number };
  consolidation: { workers: number; busy: number; queued: number };
  batchCalc: { workers: number; busy: number; queued: number };
} {
  return {
    monteCarlo: {
      workers: monteCarloPool?.workerCount ?? 0,
      busy: monteCarloPool?.busyCount ?? 0,
      queued: monteCarloPool?.queuedCount ?? 0,
    },
    consolidation: {
      workers: consolidationPool?.workerCount ?? 0,
      busy: consolidationPool?.busyCount ?? 0,
      queued: consolidationPool?.queuedCount ?? 0,
    },
    batchCalc: {
      workers: batchCalcPool?.workerCount ?? 0,
      busy: batchCalcPool?.busyCount ?? 0,
      queued: batchCalcPool?.queuedCount ?? 0,
    },
  };
}
