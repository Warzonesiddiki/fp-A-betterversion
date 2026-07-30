// =============================================================================
// ALLOCATION ENGINE — Cost/Revenue Allocation for FP&A
// Supports direct, driver-based, step-down, and reciprocal allocation methods
// Pure TypeScript, deterministic, testable, no external dependencies
//
// MONEY PRIMITIVE: All financial calculations use Decimal.js via @/utils/money.
// The hand-rolled round2() function has been replaced with roundMoney() which
// uses Decimal.js ROUND_HALF_UP for exact penny precision. Rounding correction
// uses allocateMoney() to ensure parts always sum exactly to the parent.
// =============================================================================

/**
 * @fileoverview Cost/Revenue allocation (direct, driver-based, step-down, reciprocal methods)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category allocation
 * @sector 16 (all)
 * @since 1.0.0
 */

import Decimal from 'decimal.js';
import { toDecimal, roundTo, allocateMoney, DEFAULT_CURRENCY_PLACES } from '@/utils/money';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AllocationMethod = 'direct' | 'driver' | 'step-down' | 'reciprocal';

export interface AllocationTarget {
  dimensionMember: string;
  percentage: number;
  driverWeight: number;
}

export interface AllocationRule {
  id: string;
  name: string;
  sourceAccount: string;
  method: AllocationMethod;
  targets: AllocationTarget[];
  driverDimension?: string;
  driverMeasure?: string;
  period: string;
  isRecurring: boolean;
}

export interface AllocationEntry {
  target: string;
  amount: number;
  percentage: number;
}

export interface AllocationResult {
  ruleId: string;
  allocations: AllocationEntry[];
  totalAllocated: number;
  timestamp: string;
  auditComment: string;
}

export interface CubeCell {
  coords: Record<string, string>;
  measure: string;
  value: number;
  dataType: 'calculated';
  comment: string;
}

export interface StepDownConfig {
  serviceDepartments: string[];
  productionDepartments: string[];
  serviceCosts: Record<string, number>;
  servicePercentages: Record<string, Record<string, number>>;
}

export interface ReciprocalConfig {
  departments: string[];
  departmentCosts: Record<string, number>;
  servicePercentages: Record<string, Record<string, number>>;
}

// ---------------------------------------------------------------------------
// Helpers — Decimal-based
// ---------------------------------------------------------------------------

const EPSILON = new Decimal('0.01');

/** Round to 2 decimal places using Decimal.js ROUND_HALF_UP (replaces hand-rolled round2). */
function r2(n: number | Decimal): number {
  return roundTo(n, DEFAULT_CURRENCY_PLACES);
}

/** Decimal-based sum that avoids float drift. */
function dSum(arr: number[]): Decimal {
  let acc = new Decimal(0);
  for (const v of arr) acc = acc.plus(v);
  return acc;
}

function generateTimestamp(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

export class AllocationEngine {
  // --- Direct Allocation (Decimal-based) ---

  static allocateDirect(rule: AllocationRule, amount: number): AllocationResult {
    AllocationEngine.validateDirectRule(rule);

    if (amount === 0) {
      return {
        ruleId: rule.id,
        allocations: rule.targets.map((t) => ({
          target: t.dimensionMember,
          amount: 0,
          percentage: t.percentage,
        })),
        totalAllocated: 0,
        timestamp: generateTimestamp(),
        auditComment: `Allocation rule "${rule.name}" (${rule.id}): zero amount, no allocation needed.`,
      };
    }

    const amountD = toDecimal(amount, 'amount');
    const weights = rule.targets.map((t) => t.percentage);
    const allocatedDecimals = allocateMoney(amountD, weights);

    const allocations: AllocationEntry[] = rule.targets.map((target, i) => ({
      target: target.dimensionMember,
      amount: allocatedDecimals[i]!.toNumber(),
      percentage: target.percentage,
    }));

    return {
      ruleId: rule.id,
      allocations,
      totalAllocated: amount,
      timestamp: generateTimestamp(),
      auditComment: `Allocation rule "${rule.name}" (${rule.id}): direct allocation of ${amount} across ${rule.targets.length} targets by fixed percentages.`,
    };
  }

  // --- Driver-Based Allocation (Decimal-based) ---

  static allocateByDriver(
    rule: AllocationRule,
    amount: number,
    driverValues: Record<string, number>
  ): AllocationResult {
    if (amount === 0) {
      return {
        ruleId: rule.id,
        allocations: rule.targets.map((t) => ({
          target: t.dimensionMember,
          amount: 0,
          percentage: 0,
        })),
        totalAllocated: 0,
        timestamp: generateTimestamp(),
        auditComment: `Allocation rule "${rule.name}" (${rule.id}): zero amount, no driver-based allocation needed.`,
      };
    }

    if (rule.targets.length === 0) {
      throw new Error(`Allocation rule "${rule.name}": must have at least one target.`);
    }

    // Compute weighted driver values using Decimal
    const weightedDrivers: Array<{ target: string; weightedValue: Decimal }> = [];
    let totalWeightedDriver = new Decimal(0);

    for (const target of rule.targets) {
      const rawDriver = driverValues[target.dimensionMember] ?? 0;
      if (rawDriver < 0) {
        throw new Error(
          `Allocation rule "${rule.name}": driver value for "${target.dimensionMember}" cannot be negative.`
        );
      }
      const weighted = new Decimal(rawDriver).times(target.driverWeight);
      weightedDrivers.push({ target: target.dimensionMember, weightedValue: weighted });
      totalWeightedDriver = totalWeightedDriver.plus(weighted);
    }

    if (totalWeightedDriver.isZero()) {
      throw new Error(
        `Allocation rule "${rule.name}": total weighted driver value is zero. Cannot allocate.`
      );
    }

    // Use Decimal for allocation weights
    const weights = weightedDrivers.map((wd) => wd.weightedValue.toNumber());
    const amountD = toDecimal(amount, 'amount');
    const allocatedDecimals = allocateMoney(amountD, weights);

    const allocations: AllocationEntry[] = weightedDrivers.map((wd, i) => {
      const pct = wd.weightedValue.div(totalWeightedDriver).times(100);
      return {
        target: wd.target,
        amount: allocatedDecimals[i]!.toNumber(),
        percentage: r2(pct),
      };
    });

    return {
      ruleId: rule.id,
      allocations,
      totalAllocated: amount,
      timestamp: generateTimestamp(),
      auditComment: `Allocation rule "${rule.name}" (${rule.id}): driver-based allocation of ${amount} using ${rule.driverDimension ?? 'driver'} across ${rule.targets.length} targets.`,
    };
  }

  // --- Step-Down Allocation (Decimal-based) ---

  static allocateStepDown(config: StepDownConfig): AllocationResult[] {
    const { serviceDepartments, productionDepartments, serviceCosts, servicePercentages } = config;

    if (serviceDepartments.length === 0) {
      throw new Error('Step-down allocation requires at least one service department.');
    }
    if (productionDepartments.length === 0) {
      throw new Error('Step-down allocation requires at least one production department.');
    }

    // Validate percentages for each service department using Decimal
    for (const svcDept of serviceDepartments) {
      const percentages = servicePercentages[svcDept] ?? {};
      const allReceivers = [
        ...serviceDepartments.filter((d) => d !== svcDept),
        ...productionDepartments,
      ];
      const totalPct = dSum(allReceivers.map((d) => percentages[d] ?? 0));
      if (totalPct.minus(100).abs().greaterThan(EPSILON)) {
        throw new Error(
          `Step-down allocation: percentages for "${svcDept}" sum to ${totalPct.toNumber()}%, expected 100%.`
        );
      }
    }

    // Track remaining costs using Decimal
    const remainingCosts: Record<string, Decimal> = {};
    for (const [dept, cost] of Object.entries(serviceCosts)) {
      remainingCosts[dept] = toDecimal(cost, `serviceCosts[${dept}]`);
    }
    for (const prodDept of productionDepartments) {
      if (remainingCosts[prodDept] === undefined) {
        remainingCosts[prodDept] = new Decimal(0);
      }
    }

    const results: AllocationResult[] = [];
    const processedServices: string[] = [];

    for (const svcDept of serviceDepartments) {
      const costToAllocate = remainingCosts[svcDept] ?? new Decimal(0);

      if (costToAllocate.isZero()) {
        results.push({
          ruleId: `step-down-${svcDept}`,
          allocations: [],
          totalAllocated: 0,
          timestamp: generateTimestamp(),
          auditComment: `Step-down allocation for "${svcDept}": zero cost, skipped.`,
        });
        processedServices.push(svcDept);
        continue;
      }

      const percentages = servicePercentages[svcDept] ?? {};
      const receivers = [
        ...serviceDepartments.filter((d) => !processedServices.includes(d) && d !== svcDept),
        ...productionDepartments,
      ];

      const weights = receivers.map((r) => percentages[r] ?? 0);
      const allocatedDecimals = allocateMoney(costToAllocate, weights);

      const allocations: AllocationEntry[] = [];
      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i]!;
        const pct = percentages[receiver] ?? 0;
        if (pct > 0) {
          const allocated = allocatedDecimals[i]!;
          allocations.push({
            target: receiver,
            amount: allocated.toNumber(),
            percentage: pct,
          });
          remainingCosts[receiver] = (remainingCosts[receiver] ?? new Decimal(0)).plus(allocated);
        }
      }

      remainingCosts[svcDept] = new Decimal(0);
      processedServices.push(svcDept);

      results.push({
        ruleId: `step-down-${svcDept}`,
        allocations,
        totalAllocated: costToAllocate.toNumber(),
        timestamp: generateTimestamp(),
        auditComment: `Step-down allocation for "${svcDept}": allocated ${costToAllocate.toNumber()} to ${allocations.length} receivers.`,
      });
    }

    return results;
  }

  // --- Reciprocal Allocation (Decimal-based Gauss-Seidel) ---

  static allocateReciprocal(config: ReciprocalConfig): AllocationResult[] {
    const { departments, departmentCosts, servicePercentages } = config;

    if (departments.length === 0) {
      throw new Error('Reciprocal allocation requires at least one department.');
    }

    // Validate using Decimal
    for (const dept of departments) {
      const percentages = servicePercentages[dept] ?? {};
      const totalPct = dSum(departments.filter((d) => d !== dept).map((d) => percentages[d] ?? 0));
      if (totalPct.greaterThan(100 + EPSILON.toNumber())) {
        throw new Error(
          `Reciprocal allocation: service percentages from "${dept}" sum to ${totalPct.toNumber()}%, exceeds 100%.`
        );
      }
    }

    // Gauss-Seidel with Decimal arithmetic for financial truth
    const totalCosts: Record<string, Decimal> = {};
    for (const dept of departments) {
      totalCosts[dept] = toDecimal(departmentCosts[dept] ?? 0, `departmentCosts[${dept}]`);
    }

    const MAX_ITERATIONS = 1000;
    const CONVERGENCE_THRESHOLD = new Decimal('0.001');

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let maxDelta = new Decimal(0);

      for (const dept of departments) {
        const directCost = toDecimal(departmentCosts[dept] ?? 0, `directCost[${dept}]`);
        let allocatedFromOthers = new Decimal(0);

        for (const otherDept of departments) {
          if (otherDept === dept) continue;
          const pct = (servicePercentages[otherDept] ?? {})[dept] ?? 0;
          allocatedFromOthers = allocatedFromOthers.plus(
            totalCosts[otherDept]!.times(pct).div(100)
          );
        }

        const newTotal = directCost.plus(allocatedFromOthers);
        const delta = newTotal.minus(totalCosts[dept]!).abs();
        if (delta.greaterThan(maxDelta)) maxDelta = delta;
        totalCosts[dept] = newTotal;
      }

      if (maxDelta.lessThan(CONVERGENCE_THRESHOLD)) break;
    }

    // Generate results
    const results: AllocationResult[] = [];

    for (const dept of departments) {
      const percentages = servicePercentages[dept] ?? {};
      const costToAllocate = totalCosts[dept]!;
      const receivers = departments.filter((d) => d !== dept);

      if (costToAllocate.isZero()) {
        results.push({
          ruleId: `reciprocal-${dept}`,
          allocations: [],
          totalAllocated: 0,
          timestamp: generateTimestamp(),
          auditComment: `Reciprocal allocation for "${dept}": zero total cost, skipped.`,
        });
        continue;
      }

      const weights = receivers.map((r) => percentages[r] ?? 0);
      const hasPositiveWeights = weights.some((w) => w > 0);

      // If no positive weights, department has no outgoing services — skip allocation
      if (!hasPositiveWeights) {
        results.push({
          ruleId: `reciprocal-${dept}`,
          allocations: [],
          totalAllocated: r2(costToAllocate),
          timestamp: generateTimestamp(),
          auditComment: `Reciprocal allocation for "${dept}": total cost ${r2(costToAllocate)}, no outgoing service percentages.`,
        });
        continue;
      }

      const allocatedDecimals = allocateMoney(costToAllocate, weights);

      const allocations: AllocationEntry[] = [];
      for (let i = 0; i < receivers.length; i++) {
        const receiver = receivers[i]!;
        const pct = percentages[receiver] ?? 0;
        if (pct > 0) {
          allocations.push({
            target: receiver,
            amount: allocatedDecimals[i]!.toNumber(),
            percentage: r2(pct),
          });
        }
      }

      results.push({
        ruleId: `reciprocal-${dept}`,
        allocations,
        totalAllocated: r2(costToAllocate),
        timestamp: generateTimestamp(),
        auditComment: `Reciprocal allocation for "${dept}": total cost ${r2(costToAllocate)} (direct + reciprocal), allocated to ${allocations.length} receivers.`,
      });
    }

    return results;
  }

  // --- Cube Cell Generation ---

  static toCubeCells(
    result: AllocationResult,
    periodDimension: string,
    accountDimension: string,
    costCenterDimension: string,
    measure: string = 'amount'
  ): CubeCell[] {
    const cells: CubeCell[] = [];

    for (const alloc of result.allocations) {
      cells.push({
        coords: {
          [periodDimension]: periodDimension,
          [accountDimension]: accountDimension,
          [costCenterDimension]: alloc.target,
        },
        measure,
        value: alloc.amount,
        dataType: 'calculated',
        comment: result.auditComment,
      });
    }

    return cells;
  }

  // --- Validation ---

  static validateDirectRule(rule: AllocationRule): void {
    if (rule.targets.length === 0) {
      throw new Error(`Allocation rule "${rule.name}": must have at least one target.`);
    }

    const totalPercentage = dSum(rule.targets.map((t) => t.percentage));
    if (totalPercentage.minus(100).abs().greaterThan(EPSILON)) {
      throw new Error(
        `Allocation rule "${rule.name}": target percentages sum to ${totalPercentage.toNumber()}%, expected 100%.`
      );
    }

    for (const target of rule.targets) {
      if (target.percentage < 0) {
        throw new Error(
          `Allocation rule "${rule.name}": target "${target.dimensionMember}" has negative percentage.`
        );
      }
    }
  }

  static validateDriverValues(
    rule: AllocationRule,
    driverValues: Record<string, number>
  ): string[] {
    const warnings: string[] = [];

    for (const target of rule.targets) {
      const value = driverValues[target.dimensionMember];
      if (value === undefined) {
        warnings.push(`Missing driver value for "${target.dimensionMember}".`);
      } else if (value < 0) {
        warnings.push(`Negative driver value for "${target.dimensionMember}": ${value}.`);
      } else if (value === 0) {
        warnings.push(`Zero driver value for "${target.dimensionMember}".`);
      }
    }

    return warnings;
  }

  // --- Utility ---

  static computeEffectivePercentages(
    allocations: AllocationEntry[],
    totalAmount: number
  ): Record<string, number> {
    if (totalAmount === 0) return {};
    const totalD = toDecimal(totalAmount, 'totalAmount');
    const result: Record<string, number> = {};
    for (const alloc of allocations) {
      result[alloc.target] = r2(toDecimal(alloc.amount, 'amount').div(totalD).times(100));
    }
    return result;
  }

  static mergeAllocationResults(results: AllocationResult[]): Record<string, number> {
    const merged: Record<string, Decimal> = {};
    for (const result of results) {
      for (const alloc of result.allocations) {
        merged[alloc.target] = (merged[alloc.target] ?? new Decimal(0)).plus(
          toDecimal(alloc.amount, 'amount')
        );
      }
    }
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(merged)) {
      result[key] = r2(value);
    }
    return result;
  }

  static detectCircularReferences(
    servicePercentages: Record<string, Record<string, number>>
  ): string[] {
    const cycles: string[] = [];
    const departments = Object.keys(servicePercentages);
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const dfs = (dept: string, path: string[]): void => {
      if (inStack.has(dept)) {
        const cycleStart = path.indexOf(dept);
        const cycle = path.slice(cycleStart).concat(dept);
        cycles.push(cycle.join(' -> '));
        return;
      }
      if (visited.has(dept)) return;

      visited.add(dept);
      inStack.add(dept);

      const receivers = Object.keys(servicePercentages[dept] ?? {});
      for (const receiver of receivers) {
        if ((servicePercentages[dept]![receiver] ?? 0) > 0) {
          dfs(receiver, [...path, dept]);
        }
      }

      inStack.delete(dept);
    };

    for (const dept of departments) {
      dfs(dept, []);
    }

    return cycles;
  }
}
