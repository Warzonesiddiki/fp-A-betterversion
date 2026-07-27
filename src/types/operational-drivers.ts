/**
 * Operational Driver Types — Non-Financial Input Streams
 *
 * Maps operational metrics (headcount, utilization, infrastructure) into
 * financial calculation paths. These are the "levers" that drive
 * driver-based planning and rolling forecasts.
 *
 * DESIGN: Every operational driver produces a financial output that feeds
 * into existing engines (SaaS, CapEx, Tax, etc.) via the formula DAG.
 */

import type { PreciseAmount } from './precision';

// ─── Driver Category Taxonomy ──────────────────────────────────────────────

/**
 * Top-level operational driver categories.
 * Each category contains specific driver types.
 */
export type OperationalDriverCategory =
  | 'headcount'
  | 'utilization'
  | 'infrastructure'
  | 'sales-pipeline'
  | 'customer-success'
  | 'supply-chain'
  | 'compliance'
  | 'custom';

/**
 * Specific driver types within each category.
 * These map 1:1 to the driver-based planning formulas.
 */
export type OperationalDriverType =
  // Headcount
  | 'fte-count'
  | 'avg-salary'
  | 'benefits-multiplier'
  | 'hiring-velocity'
  | 'attrition-rate'
  | 'time-to-hire'
  | 'onboarding-cost'
  // Utilization
  | 'billable-utilization'
  | 'capacity-hours'
  | 'realization-rate'
  | 'bench-percentage'
  | 'overtime-multiplier'
  // Infrastructure
  | 'server-count'
  | 'cloud-spend-monthly'
  | 'data-center-cost'
  | 'saas-subscriptions'
  | 'license-count'
  // Sales Pipeline
  | 'lead-volume'
  | 'conversion-rate'
  | 'avg-deal-size'
  | 'sales-cycle-days'
  | 'quota-per-rep'
  // Customer Success
  | 'customer-count'
  | 'churn-rate'
  | 'expansion-rate'
  | 'nps-score'
  | 'support-ticket-volume'
  // Supply Chain
  | 'inventory-turns'
  | 'cogs-per-unit'
  | 'supplier-lead-time'
  | 'defect-rate'
  // Compliance
  | 'audit-finding-count'
  | 'sox-control-count'
  | 'incident-count'
  // Custom
  | 'custom-metric';

// ─── Operational Driver Definition ─────────────────────────────────────────

/**
 * A single operational driver — the "input lever" that produces financial output.
 */
export interface OperationalDriver {
  /** Unique driver ID */
  readonly id: string;
  /** Driver category */
  readonly category: OperationalDriverCategory;
  /** Specific driver type */
  readonly type: OperationalDriverType;
  /** Human-readable name (e.g., 'Engineering Headcount') */
  readonly name: string;
  /** Description of what this driver measures */
  readonly description: string;
  /** Unit of measurement (e.g., 'FTE', '%', '$/month', 'hours') */
  readonly unit: string;
  /** Current values by period (YYYY-MM → value) */
  readonly values: ReadonlyMap<string, number>;
  /** Historical values (actuals) */
  readonly actuals: ReadonlyMap<string, number>;
  /** Forecast values (forward-looking) */
  readonly forecasts: ReadonlyMap<string, number>;
  /** Minimum allowed value (for validation) */
  readonly minValue: number | null;
  /** Maximum allowed value (for validation) */
  readonly maxValue: number | null;
  /** Whether this driver is editable by the user */
  readonly isEditable: boolean;
  /** Source of the data (manual, api, import, calculated) */
  readonly source: 'manual' | 'api' | 'import' | 'calculated';
  /** The financial accounts this driver feeds into */
  readonly linkedAccounts: readonly string[];
  /** The formula that converts this driver's value to a financial amount */
  readonly formula: string | null;
}

// ─── Driver Chain (Dependency) ─────────────────────────────────────────────

/**
 * A driver chain represents the dependency path from operational inputs
 * to financial outputs. Enables "what-if" tracing.
 *
 * Example chain:
 *   FTE Count (100) × Avg Salary ($120K) × Benefits Multiplier (1.35) = Total Comp ($16.2M)
 */
export interface DriverChain {
  /** Unique chain ID */
  readonly id: string;
  /** Chain name (e.g., 'Total Compensation Calculation') */
  readonly name: string;
  /** Ordered list of driver IDs in the chain */
  readonly driverIds: readonly string[];
  /** The formula combining all drivers */
  readonly formula: string;
  /** The output account code (where the result lands) */
  readonly outputAccountCode: string;
  /** The output period (YYYY-MM) */
  readonly outputPeriod: string;
  /** Computed result (null if not yet evaluated) */
  readonly result: PreciseAmount | null;
  /** Whether the chain has been evaluated */
  readonly isEvaluated: boolean;
}

// ─── Driver Matrix (Multi-Dimensional) ─────────────────────────────────────

/**
 * A driver matrix holds values across multiple dimensions:
 * periods × entities × scenarios.
 * Enables cross-dimensional driver analysis.
 */
export interface DriverMatrix {
  /** Matrix ID */
  readonly id: string;
  /** The driver this matrix represents */
  readonly driverId: string;
  /** Periods (columns) */
  readonly periods: readonly string[];
  /** Entities (rows) */
  readonly entities: readonly string[];
  /** Scenario being viewed */
  readonly scenarioId: string;
  /**
   * Values: values[entityIndex][periodIndex] = number
   * Using nested arrays for memory efficiency with large matrices.
   */
  readonly values: readonly (readonly number[])[];
}

// ─── Driver Sensitivity Analysis ───────────────────────────────────────────

/**
 * Sensitivity analysis result — how much does the financial output change
 * when a single operational driver changes by X%?
 */
export interface DriverSensitivity {
  /** The driver being analyzed */
  readonly driverId: string;
  /** The output account being measured */
  readonly outputAccountCode: string;
  /** Base case value */
  readonly baseValue: PreciseAmount;
  /** Sensitivity scenarios: ±X% change → resulting output */
  readonly scenarios: readonly SensitivityScenario[];
  /** Elasticity (% change in output / % change in input) */
  readonly elasticity: number;
}

export interface SensitivityScenario {
  /** Percentage change in driver value (e.g., +10, -10) */
  readonly changePercent: number;
  /** Resulting financial output */
  readonly outputValue: PreciseAmount;
  /** Delta from base case */
  readonly delta: PreciseAmount;
}

// ─── Driver Store Shape ────────────────────────────────────────────────────

export interface OperationalDriverState {
  /** All registered drivers */
  readonly drivers: readonly OperationalDriver[];
  /** All registered driver chains */
  readonly chains: readonly DriverChain[];
  /** Active driver matrices */
  readonly matrices: readonly DriverMatrix[];
  /** Whether any driver values have been modified since last save */
  readonly isDirty: boolean;
  /** Last evaluation timestamp */
  readonly lastEvaluatedAt: string | null;
}
