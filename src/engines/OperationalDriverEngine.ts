/**
 * Operational Driver Engine — Maps Non-Financial Inputs to Financial Outputs
 *
 * Converts operational metrics (headcount, utilization, infrastructure)
 * into financial calculations via driver chains.
 *
 * Example chain:
 *   FTE Count (100) × Avg Salary ($120K) × Benefits Multiplier (1.35) = Total Comp ($16.2M)
 *
 * @module OperationalDriverEngine
 */

import type {
  OperationalDriver,
  OperationalDriverType,
  DriverChain,
  DriverMatrix,
  DriverSensitivity,
  SensitivityScenario,
} from '@/types/operational-drivers';
import { toPrecise, fromPrecise, preciseMul, preciseDiv, preciseSub } from '@/utils/precisionMath';

// ─── Driver Creation ───────────────────────────────────────────────────────

/**
 * Create a new operational driver with default values.
 */
export function createDriver(
  type: OperationalDriverType,
  name: string,
  unit: string,
  category: OperationalDriver['category'],
  description: string = ''
): OperationalDriver {
  return {
    id: `drv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category,
    type,
    name,
    description: description || `${name} operational driver`,
    unit,
    values: new Map(),
    actuals: new Map(),
    forecasts: new Map(),
    minValue: null,
    maxValue: null,
    isEditable: true,
    source: 'manual',
    linkedAccounts: [],
    formula: null,
  };
}

// ─── Driver Chain Evaluation ───────────────────────────────────────────────

/**
 * Evaluate a driver chain — compute the financial output from operational inputs.
 *
 * The formula multiplies all driver values together (with optional adjustments).
 * Returns the result as a precise integer.
 */
export function evaluateChain(
  chain: DriverChain,
  drivers: ReadonlyMap<string, OperationalDriver>,
  period: string
): { result: number; driverValues: Record<string, number>; errors: string[] } {
  const driverValues: Record<string, number> = {};
  const errors: string[] = [];
  let product = 1;

  for (const driverId of chain.driverIds) {
    const driver = drivers.get(driverId);
    if (!driver) {
      errors.push(`Driver '${driverId}' not found`);
      continue;
    }

    const value = driver.values.get(period) ?? driver.forecasts.get(period) ?? 0;
    driverValues[driverId] = value;
    product *= value;
  }

  return {
    result: product,
    driverValues,
    errors,
  };
}

/**
 * Evaluate a chain using precise integer arithmetic.
 */
export function evaluateChainPrecise(
  chain: DriverChain,
  drivers: ReadonlyMap<string, OperationalDriver>,
  period: string
): { result: bigint; errors: string[] } {
  const errors: string[] = [];
  let product = toPrecise(1);

  for (const driverId of chain.driverIds) {
    const driver = drivers.get(driverId);
    if (!driver) {
      errors.push(`Driver '${driverId}' not found`);
      continue;
    }

    const value = driver.values.get(period) ?? driver.forecasts.get(period) ?? 0;
    const preciseValue = toPrecise(value);
    product = preciseMul(product, preciseValue).value;
  }

  return { result: product, errors };
}

// ─── Driver Chain Creation ─────────────────────────────────────────────────

/**
 * Create a driver chain from a list of driver IDs.
 */
export function createChain(
  name: string,
  driverIds: readonly string[],
  outputAccountCode: string,
  outputPeriod: string
): DriverChain {
  return {
    id: `chain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    driverIds,
    formula: driverIds.map((id) => `[${id}]`).join(' × '),
    outputAccountCode,
    outputPeriod,
    result: null,
    isEvaluated: false,
  };
}

// ─── Pre-Built Driver Templates ────────────────────────────────────────────

/**
 * Create the standard headcount compensation driver chain.
 * FTE Count × Avg Salary × Benefits Multiplier = Total Compensation
 */
export function createHeadcountChain(
  fteDriverId: string,
  salaryDriverId: string,
  benefitsDriverId: string,
  outputPeriod: string
): DriverChain {
  return createChain(
    'Total Compensation',
    [fteDriverId, salaryDriverId, benefitsDriverId],
    'total-compensation',
    outputPeriod
  );
}

/**
 * Create the SaaS revenue driver chain.
 * Customer Count × ARPU × (1 - Churn Rate) = Recurring Revenue
 */
export function createSaaSRevenueChain(
  customerDriverId: string,
  arpuDriverId: string,
  churnDriverId: string,
  outputPeriod: string
): DriverChain {
  return createChain(
    'SaaS Recurring Revenue',
    [customerDriverId, arpuDriverId, churnDriverId],
    'recurring-revenue',
    outputPeriod
  );
}

// ─── Sensitivity Analysis ──────────────────────────────────────────────────

/**
 * Perform sensitivity analysis on a single driver within a chain.
 * Measures how much the financial output changes when the driver changes by ±X%.
 */
export function analyzeSensitivity(
  chain: DriverChain,
  drivers: ReadonlyMap<string, OperationalDriver>,
  targetDriverId: string,
  period: string,
  changePercentages: readonly number[] = [-20, -10, -5, 5, 10, 20]
): DriverSensitivity {
  const { result: baseValue } = evaluateChain(chain, drivers, period);

  const scenarios: SensitivityScenario[] = changePercentages.map((pct) => {
    // Create a modified drivers map with the target driver changed
    const modifiedDrivers = new Map(drivers);
    const targetDriver = modifiedDrivers.get(targetDriverId);
    if (targetDriver) {
      const originalValue = targetDriver.values.get(period) ?? 0;
      const newValue = originalValue * (1 + pct / 100);
      const modifiedDriver: OperationalDriver = {
        ...targetDriver,
        values: new Map(targetDriver.values).set(period, newValue),
      };
      modifiedDrivers.set(targetDriverId, modifiedDriver);
    }

    const { result: newValue } = evaluateChain(chain, modifiedDrivers, period);
    const delta = newValue - baseValue;

    return {
      changePercent: pct,
      outputValue: toPrecise(newValue),
      delta: toPrecise(delta),
    };
  });

  // Calculate elasticity (% change in output / % change in input)
  const plusTen = scenarios.find((s) => s.changePercent === 10);
  const elasticity =
    plusTen && baseValue !== 0
      ? (fromPrecise(plusTen.delta) / baseValue) / (10 / 100)
      : 0;

  return {
    driverId: targetDriverId,
    outputAccountCode: chain.outputAccountCode,
    baseValue: toPrecise(baseValue),
    scenarios,
    elasticity,
  };
}

// ─── Driver Matrix Operations ──────────────────────────────────────────────

/**
 * Create a driver matrix from a driver's values across periods and entities.
 */
export function createMatrix(
  driverId: string,
  periods: readonly string[],
  entities: readonly string[],
  scenarioId: string,
  driverValues: ReadonlyMap<string, ReadonlyMap<string, number>>
): DriverMatrix {
  const values: number[][] = [];

  for (const entity of entities) {
    const entityValues: number[] = [];
    const entityData = driverValues.get(entity);
    for (const period of periods) {
      entityValues.push(entityData?.get(period) ?? 0);
    }
    values.push(entityValues);
  }

  return {
    id: `matrix-${driverId}-${scenarioId}`,
    driverId,
    periods,
    entities,
    scenarioId,
    values,
  };
}

/**
 * Get a column (period) total from a driver matrix.
 */
export function getColumnTotal(matrix: DriverMatrix, periodIndex: number): number {
  let total = 0;
  for (const row of matrix.values) {
    total += row[periodIndex] ?? 0;
  }
  return total;
}

/**
 * Get a row (entity) total from a driver matrix.
 */
export function getRowTotal(matrix: DriverMatrix, entityIndex: number): number {
  const row = matrix.values[entityIndex];
  if (!row) return 0;
  return row.reduce((sum, val) => sum + val, 0);
}
