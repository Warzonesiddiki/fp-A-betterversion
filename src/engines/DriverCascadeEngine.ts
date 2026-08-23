// =============================================================================
// DRIVER CASCADE ENGINE — DAG-based driver planning with automatic cascading
// Enables connected planning: change a driver → all downstream cells recalculate
// Pure TypeScript, deterministic, testable, no AI dependency
//
// MONEY DISCIPLINE (session 024, K18): cascade targets are cube measures and
// routinely hold currency values. Every cell-value delta, weighting and impact
// sum therefore routes through the decimal helpers in `@/utils/money` — no
// IEEE-754 `+ - * /` on a cell value, and impact accumulation uses
// `sumMoney` / `addMoney` rather than float `+=`. Dimensionless driver
// exponents (the multiplicative ratio raised to `rule.weight`) stay float:
// they are ratios, not money.
// =============================================================================

/**
 * @fileoverview DAG-based driver planning with automatic cascading (change driver → downstream cells recalc)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category driver-cascade
 * @sector 16 (all)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 25th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */

import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
} from '@/utils/money';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriverUnit = 'percentage' | 'absolute' | 'index' | 'ratio';
export type ImpactType = 'additive' | 'multiplicative' | 'replacement';
export type CascadeType = 'direct' | 'weighted' | 'formula';

export interface Driver {
  id: string;
  name: string;
  description?: string;
  unit: DriverUnit;
  baseValue: number;
  currentValue: number;
  minValue: number;
  maxValue: number;
  step: number;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CascadeRule {
  id: string;
  driverId: string;
  targetCube: string;
  targetCoords: Record<string, string>;
  targetMeasure: string;
  cascadeType: CascadeType;
  impactType: ImpactType;
  weight: number;
  formula?: string;
  description?: string;
}

export interface CascadeResult {
  driverId: string;
  driverName: string;
  oldValue: number;
  newValue: number;
  affectedCells: AffectedCell[];
  /** Rules whose formula failed (unknown identifier / parse error / non-finite). They leave their cell untouched. */
  formulaErrors: number;
  totalImpact: number;
  duration: number;
}

export interface AffectedCell {
  cube: string;
  coords: Record<string, string>;
  measure: string;
  oldValue: number;
  newValue: number;
  delta: number;
  ruleId: string;
}

export interface CascadeGraphNode {
  driverId: string;
  ruleId: string;
  targetKey: string;
  dependencies: string[];
}

export interface DriverSnapshot {
  drivers: Driver[];
  rules: CascadeRule[];
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cellKey(cube: string, coords: Record<string, string>, measure: string): string {
  const sortedCoords = Object.keys(coords)
    .sort()
    .map((k) => `${k}=${coords[k]}`)
    .join('|');
  return `${cube}|${sortedCoords}|${measure}`;
}

function generateId(prefix: string): string {
  return randomId(prefix);
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

export class DriverCascadeEngine {
  private drivers = new Map<string, Driver>();
  private rules = new Map<string, CascadeRule[]>();
  private dependencyGraph = new Map<string, CascadeGraphNode>();
  private snapshots: DriverSnapshot[] = [];

  // --- Driver Management ---

  addDriver(driver: Omit<Driver, 'id' | 'createdAt' | 'updatedAt'>): Driver {
    const id = generateId('drv');
    const now = new Date().toISOString();
    const fullDriver: Driver = {
      ...driver,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.drivers.set(id, fullDriver);
    return fullDriver;
  }

  updateDriver(
    id: string,
    updates: Partial<
      Pick<
        Driver,
        | 'name'
        | 'description'
        | 'currentValue'
        | 'baseValue'
        | 'minValue'
        | 'maxValue'
        | 'step'
        | 'category'
        | 'tags'
      >
    >
  ): Driver | undefined {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updated: Driver = {
      ...driver,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.drivers.set(id, updated);
    return updated;
  }

  removeDriver(id: string): boolean {
    const existed = this.drivers.delete(id);
    if (existed) {
      this.rules.delete(id);
      this.rebuildGraph();
    }
    return existed;
  }

  getDriver(id: string): Driver | undefined {
    return this.drivers.get(id);
  }

  listDrivers(): Driver[] {
    return Array.from(this.drivers.values());
  }

  getDriversByCategory(category: string): Driver[] {
    return this.listDrivers().filter((d) => d.category === category);
  }

  // --- Cascade Rules ---

  addRule(rule: Omit<CascadeRule, 'id'>): CascadeRule {
    const id = generateId('rule');
    const fullRule: CascadeRule = { ...rule, id };
    const driverRules = this.rules.get(rule.driverId) ?? [];
    driverRules.push(fullRule);
    this.rules.set(rule.driverId, driverRules);
    this.rebuildGraph();
    return fullRule;
  }

  removeRule(ruleId: string): boolean {
    for (const [driverId, rules] of this.rules) {
      const idx = rules.findIndex((r) => r.id === ruleId);
      if (idx !== -1) {
        rules.splice(idx, 1);
        if (rules.length === 0) this.rules.delete(driverId);
        this.rebuildGraph();
        return true;
      }
    }
    return false;
  }

  getRulesForDriver(driverId: string): CascadeRule[] {
    return this.rules.get(driverId) ?? [];
  }

  getAllRules(): CascadeRule[] {
    const all: CascadeRule[] = [];
    for (const rules of this.rules.values()) {
      all.push(...rules);
    }
    return all;
  }

  // --- Dependency Graph ---

  private rebuildGraph(): void {
    this.dependencyGraph.clear();
    for (const [driverId, rules] of this.rules) {
      for (const rule of rules) {
        const key = cellKey(rule.targetCube, rule.targetCoords, rule.targetMeasure);
        this.dependencyGraph.set(key, {
          driverId,
          ruleId: rule.id,
          targetKey: key,
          dependencies: [driverId],
        });
      }
    }
  }

  detectCircularDependencies(): string[] {
    const cycles: string[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (driverId: string, path: string[]): void => {
      if (inStack.has(driverId)) {
        cycles.push(`Circular: ${path.join(' → ')} → ${driverId}`);
        return;
      }
      if (visited.has(driverId)) return;

      visited.add(driverId);
      inStack.add(driverId);

      const rules = this.rules.get(driverId) ?? [];
      for (const rule of rules) {
        // Check if any rule's target is also a driver (connected planning)
        const targetDriver = this.findDriverByCoords(rule.targetCube, rule.targetCoords);
        if (targetDriver && targetDriver.id !== driverId) {
          dfs(targetDriver.id, [...path, driverId]);
        }
      }

      inStack.delete(driverId);
    };

    for (const driverId of this.drivers.keys()) {
      dfs(driverId, []);
    }

    return cycles;
  }

  private findDriverByCoords(cube: string, coords: Record<string, string>): Driver | undefined {
    // Check if any driver is associated with these coords via rules
    for (const [driverId, rules] of this.rules) {
      for (const rule of rules) {
        if (
          rule.targetCube === cube &&
          JSON.stringify(rule.targetCoords) === JSON.stringify(coords)
        ) {
          return this.drivers.get(driverId);
        }
      }
    }
    return undefined;
  }

  // --- Cascade Calculation ---

  calculateCascade(
    driverId: string,
    newValue: number,
    readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined
  ): CascadeResult {
    const driver = this.drivers.get(driverId);
    if (!driver) {
      throw new Error(`Driver "${driverId}" not found`);
    }

    const start = performance.now();
    const oldValue = driver.currentValue;
    const rules = this.rules.get(driverId) ?? [];
    const affectedCells: AffectedCell[] = [];

    // Formula identifiers resolve against every registered driver, under both
    // its raw id and its hyphen->underscore form (template formulas use snake_case).
    const driverVars: Record<string, number> = {};
    for (const d of this.drivers.values()) {
      driverVars[d.id] = d.currentValue;
      const snake = d.id.replace(/-/g, '_');
      if (!(snake in driverVars)) {
        driverVars[snake] = d.currentValue;
      }
    }
    let formulaErrors = 0;

    for (const rule of rules) {
      const currentCellValue =
        readCell(rule.targetCube, rule.targetCoords, rule.targetMeasure) ?? 0;
      let newCellValue: number;
      // Driver-value delta as an exact decimal; cell values are money-typed
      // measures, so every weighting below routes through @/utils/money.
      const driverDelta = subtractMoney(newValue, oldValue);

      switch (rule.cascadeType) {
        case 'direct': {
          switch (rule.impactType) {
            case 'additive':
              newCellValue = addMoney(
                currentCellValue,
                multiplyMoney(driverDelta, rule.weight)
              ).toNumber();
              break;
            case 'multiplicative':
              if (oldValue !== 0) {
                // Dimensionless ratio of driver values; only the final scale
                // of the (money) cell value is decimal-backed.
                const ratio = divideMoney(newValue, oldValue).toNumber();
                newCellValue = multiplyMoney(
                  currentCellValue,
                  Math.pow(ratio, rule.weight)
                ).toNumber();
              } else {
                newCellValue = currentCellValue;
              }
              break;
            case 'replacement':
              newCellValue = multiplyMoney(newValue, rule.weight).toNumber();
              break;
            default:
              newCellValue = currentCellValue;
          }
          break;
        }

        case 'weighted': {
          newCellValue = addMoney(
            currentCellValue,
            multiplyMoney(driverDelta, rule.weight)
          ).toNumber();
          break;
        }

        case 'formula': {
          // Formula-based cascade. Unknown identifiers / parse failures are
          // counted in result.formulaErrors and leave the cell untouched —
          // never silently frozen at the current value (W6-P0-15).
          if (rule.formula) {
            try {
              newCellValue = evaluateSimpleFormula(
                rule.formula,
                newValue,
                oldValue,
                currentCellValue,
                driverVars,
                (identifier) => {
                  const accountId = identifier.replace(/_/g, '-');
                  const v = readCell(
                    rule.targetCube,
                    { ...rule.targetCoords, account: accountId },
                    rule.targetMeasure
                  );
                  return typeof v === 'number' ? v : undefined;
                }
              );
            } catch {
              formulaErrors += 1;
              newCellValue = currentCellValue;
            }
          } else {
            newCellValue = currentCellValue;
          }
          break;
        }

        default:
          newCellValue = currentCellValue;
      }

      const cellDelta = subtractMoney(newCellValue, currentCellValue);
      if (cellDelta.abs().greaterThan(0.0001)) {
        affectedCells.push({
          cube: rule.targetCube,
          coords: rule.targetCoords,
          measure: rule.targetMeasure,
          oldValue: currentCellValue,
          newValue: roundTo(newCellValue, 2),
          delta: roundTo(cellDelta, 2),
          ruleId: rule.id,
        });
      }
    }

    const duration = performance.now() - start;

    return {
      driverId,
      driverName: driver.name,
      oldValue,
      newValue,
      affectedCells,
      formulaErrors,
      totalImpact: sumMoney(affectedCells.map((c) => c.delta)).toNumber(),
      duration,
    };
  }

  applyCascade(
    result: CascadeResult,
    writeCell: (
      cube: string,
      coords: Record<string, string>,
      measure: string,
      value: number
    ) => void
  ): void {
    // Update driver value
    this.updateDriver(result.driverId, { currentValue: result.newValue });

    // Write affected cells
    for (const cell of result.affectedCells) {
      writeCell(cell.cube, cell.coords, cell.measure, cell.newValue);
    }
  }

  // --- Batch Operations ---

  batchUpdateDrivers(
    updates: Array<{ driverId: string; newValue: number }>,
    readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined,
    writeCell: (
      cube: string,
      coords: Record<string, string>,
      measure: string,
      value: number
    ) => void
  ): CascadeResult[] {
    const results: CascadeResult[] = [];

    // Topological sort: process drivers with no dependencies first
    const sorted = this.topologicalSort(updates.map((u) => u.driverId));

    for (const driverId of sorted) {
      const update = updates.find((u) => u.driverId === driverId);
      if (!update) continue;

      const result = this.calculateCascade(driverId, update.newValue, readCell);
      this.applyCascade(result, writeCell);
      results.push(result);
    }

    return results;
  }

  private topologicalSort(driverIds: string[]): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const dfs = (driverId: string): void => {
      if (visited.has(driverId)) return;
      visited.add(driverId);

      // Visit dependencies first
      const rules = this.rules.get(driverId) ?? [];
      for (const rule of rules) {
        const targetDriver = this.findDriverByCoords(rule.targetCube, rule.targetCoords);
        if (targetDriver && targetDriver.id !== driverId && driverIds.includes(targetDriver.id)) {
          dfs(targetDriver.id);
        }
      }

      result.push(driverId);
    };

    for (const driverId of driverIds) {
      dfs(driverId);
    }

    return result;
  }

  // --- Snapshots ---

  createSnapshot(): DriverSnapshot {
    const snapshot: DriverSnapshot = {
      drivers: this.listDrivers(),
      rules: this.getAllRules(),
      timestamp: new Date().toISOString(),
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  restoreSnapshot(snapshot: DriverSnapshot): void {
    this.drivers.clear();
    this.rules.clear();

    for (const driver of snapshot.drivers) {
      this.drivers.set(driver.id, driver);
    }

    for (const rule of snapshot.rules) {
      const driverRules = this.rules.get(rule.driverId) ?? [];
      driverRules.push(rule);
      this.rules.set(rule.driverId, driverRules);
    }

    this.rebuildGraph();
  }

  listSnapshots(): DriverSnapshot[] {
    return [...this.snapshots];
  }

  // --- Impact Analysis ---

  analyzeImpact(
    driverId: string,
    newValue: number,
    readCell: (cube: string, coords: Record<string, string>, measure: string) => number | undefined
  ): ImpactAnalysis {
    const driver = this.drivers.get(driverId);
    if (!driver) throw new Error(`Driver "${driverId}" not found`);

    const result = this.calculateCascade(driverId, newValue, readCell);
    const delta = subtractMoney(newValue, driver.currentValue);
    const percentageChange =
      driver.currentValue !== 0 ? divideMoney(delta, driver.currentValue).times(100).toNumber() : 0;

    return {
      driverId,
      driverName: driver.name,
      currentValue: driver.currentValue,
      proposedValue: newValue,
      delta: delta.toNumber(),
      percentageChange,
      affectedCellCount: result.affectedCells.length,
      totalImpact: result.totalImpact,
      impactByCube: this.groupImpactByCube(result.affectedCells),
      calculationTimeMs: result.duration,
    };
  }

  private groupImpactByCube(
    cells: AffectedCell[]
  ): Record<string, { count: number; totalImpact: number }> {
    const groups: Record<string, { count: number; totalImpact: number }> = {};
    for (const cell of cells) {
      if (!groups[cell.cube]) {
        groups[cell.cube] = { count: 0, totalImpact: 0 };
      }
      groups![cell.cube]!.count++;
      groups![cell.cube]!.totalImpact = addMoney(
        groups[cell.cube]!.totalImpact,
        cell.delta
      ).toNumber();
    }
    return groups;
  }

  // --- Export/Import ---

  exportState(): { drivers: Driver[]; rules: CascadeRule[] } {
    return {
      drivers: this.listDrivers(),
      rules: this.getAllRules(),
    };
  }

  importState(state: { drivers: Driver[]; rules: CascadeRule[] }): void {
    this.drivers.clear();
    this.rules.clear();

    for (const driver of state.drivers) {
      this.drivers.set(driver.id, driver);
    }

    for (const rule of state.rules) {
      const driverRules = this.rules.get(rule.driverId) ?? [];
      driverRules.push(rule);
      this.rules.set(rule.driverId, driverRules);
    }

    this.rebuildGraph();
  }

  // --- Reset ---

  reset(): void {
    this.drivers.clear();
    this.rules.clear();
    this.dependencyGraph.clear();
    this.snapshots = [];
  }
}

// ---------------------------------------------------------------------------
// Simple Formula Evaluator (for cascade formulas)
// Uses SafeMathParser — NO eval(), NO new Function(), NO code injection
// ---------------------------------------------------------------------------

import { randomId } from '@/utils/cryptoId';
import { safeMathParser } from './SafeMathParser';

/** Thrown when a cascade formula references an unknown identifier, fails to parse, or yields a non-finite value. */
export class CascadeFormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CascadeFormulaError';
  }
}

/**
 * Resolves identifiers against the cascade context, then evaluates via SafeMathParser.
 *
 * Identifier contract (W6-P0-15):
 * - `x`       -> proposed driver value
 * - `old_x` / `prev` (alias) -> previous driver value
 * - `current` -> target cell's current value
 * - any other identifier -> looked up in `vars` (engine drivers keyed by raw id
 *   and hyphen->underscore form); an unknown lookup THROWS — it is never
 *   silently frozen at the current value.
 * Uppercase SafeMathParser function names followed by "(" pass through untouched.
 */
function evaluateSimpleFormula(
  formula: string,
  x: number,
  oldX: number,
  current: number,
  vars: Record<string, number>,
  resolveIdentifier?: (identifier: string) => number | undefined
): number {
  const substituted = formula.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b(?!\s*\()/g, (identifier) => {
    if (identifier === 'x') return String(x);
    if (identifier === 'old_x' || identifier === 'prev') return String(oldX);
    if (identifier === 'current') return String(current);
    if (Object.prototype.hasOwnProperty.call(vars, identifier)) {
      return String(vars[identifier]!);
    }
    // Sibling-account fallback: templates may reference other accounts
    // (e.g. net_revenue, noi). The caller resolves them via its readCell;
    // anything unresolvable THROWS — never silently frozen.
    const resolved = resolveIdentifier?.(identifier);
    if (resolved !== undefined && Number.isFinite(resolved)) {
      return String(resolved);
    }
    throw new CascadeFormulaError(`Unknown identifier "${identifier}" in cascade formula`);
  });

  let result: unknown;
  try {
    result = safeMathParser.evaluate(substituted);
  } catch (error) {
    throw new CascadeFormulaError(
      `Failed to evaluate cascade formula: ${error instanceof Error ? error.message : 'parse error'}`
    );
  }
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new CascadeFormulaError('Cascade formula did not evaluate to a finite number');
  }
  return result;
}

// ---------------------------------------------------------------------------
// Impact Analysis Type
// ---------------------------------------------------------------------------

export interface ImpactAnalysis {
  driverId: string;
  driverName: string;
  currentValue: number;
  proposedValue: number;
  delta: number;
  percentageChange: number;
  affectedCellCount: number;
  totalImpact: number;
  impactByCube: Record<string, { count: number; totalImpact: number }>;
  calculationTimeMs: number;
}
