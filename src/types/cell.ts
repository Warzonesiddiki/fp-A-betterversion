// src/types/cell.ts
// Extended CellAddress for audit trail and lineage use cases.
// Meticulus (TSC-Auditor) — TURN 389+ re-creation + extension after commit removed
// Original 26L extended CellAddress with sectorId/scenarioId/periodId/lineItemId

import type { CellAddress as BaseCellAddress } from '@/types/cube-types';

/**
 * Extended CellAddress used by audit trail, lineage, and data quality tracking.
 * Includes the base coords + the "logical" identifiers for sector/scenario/period/line item.
 *
 * The optional lineage fields allow audit entries to reference the business-level
 * identity of a cell (sector + scenario + period + lineItem) without having to
 * recompute it from the cube coordinates.
 */
export interface CellAddress extends BaseCellAddress {
  /** Sector identifier (e.g., 'manufacturing', 'saas', 'retail') */
  sectorId?: string;
  /** Scenario identifier (e.g., 'Actual', 'Budget', 'Forecast') */
  scenarioId?: string;
  /** Period identifier (e.g., '2026-Q2', '2026-06') */
  periodId?: string;
  /** Line item identifier (e.g., 'revenue', 'cogs', 'opex') */
  lineItemId?: string;
}

// Re-export the base type for callers that want the strict shape.
export type { BaseCellAddress };
