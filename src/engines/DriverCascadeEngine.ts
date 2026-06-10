// =============================================================================
// DRIVER CASCADE ENGINE — DAG-based driver planning with automatic cascading
// Enables connected planning: change a driver → all downstream cells recalculate
// Pure TypeScript, deterministic, testable, no AI dependency
// =============================================================================

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
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

    for (const rule of rules) {
      const currentCellValue =
        readCell(rule.targetCube, rule.targetCoords, rule.targetMeasure) ?? 0;
      let newCellValue: number;

      switch (rule.cascadeType) {
        case 'direct': {
          const delta = newValue - oldValue;
          switch (rule.impactType) {
            case 'additive':
              newCellValue = currentCellValue + delta * rule.weight;
              break;
            case 'multiplicative':
              if (oldValue !== 0) {
                const ratio = newValue / oldValue;
                newCellValue = currentCellValue * Math.pow(ratio, rule.weight);
              } else {
                newCellValue = currentCellValue;
              }
              break;
            case 'replacement':
              newCellValue = newValue * rule.weight;
              break;
            default:
              newCellValue = currentCellValue;
          }
          break;
        }

        case 'weighted': {
          const delta = newValue - oldValue;
          newCellValue = currentCellValue + delta * rule.weight;
          break;
        }

        case 'formula': {
          // Formula-based cascade: evaluate formula with driver value as input
          // Formula uses 'x' as the driver value variable
          if (rule.formula) {
            try {
              newCellValue = evaluateSimpleFormula(
                rule.formula,
                newValue,
                oldValue,
                currentCellValue
              );
            } catch {
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

      const delta = newCellValue - currentCellValue;
      if (Math.abs(delta) > 0.0001) {
        affectedCells.push({
          cube: rule.targetCube,
          coords: rule.targetCoords,
          measure: rule.targetMeasure,
          oldValue: currentCellValue,
          newValue: Math.round(newCellValue * 100) / 100,
          delta: Math.round(delta * 100) / 100,
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
      totalImpact: affectedCells.reduce((sum, c) => sum + c.delta, 0),
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
    const delta = newValue - driver.currentValue;
    const percentageChange = driver.currentValue !== 0 ? (delta / driver.currentValue) * 100 : 0;

    return {
      driverId,
      driverName: driver.name,
      currentValue: driver.currentValue,
      proposedValue: newValue,
      delta,
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
      groups![cell.cube]!.totalImpact += cell.delta;
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

import { safeMathParser } from './SafeMathParser';

function evaluateSimpleFormula(formula: string, x: number, oldX: number, current: number): number {
  // Replace variables in formula
  const expr = formula
    .replace(/\bx\b/g, String(x))
    .replace(/\bold_x\b/g, String(oldX))
    .replace(/\bcurrent\b/g, String(current));

  // Safe evaluation using SafeMathParser (no code injection possible)
  try {
    const result = safeMathParser.evaluate(expr);
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    }
    return current;
  } catch {
    return current;
  }
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
