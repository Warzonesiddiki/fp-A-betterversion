// =============================================================================
// ALLOCATION ENGINE — Cost/Revenue Allocation for FP&A
// Supports direct, driver-based, step-down, and reciprocal allocation methods
// Pure TypeScript, deterministic, testable, no external dependencies
// =============================================================================

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
// Helpers
// ---------------------------------------------------------------------------

const EPSILON = 0.01;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function sumArray(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function generateTimestamp(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// ENGINE
// ---------------------------------------------------------------------------

export class AllocationEngine {
  // --- Direct Allocation ---

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

    const allocations: AllocationEntry[] = rule.targets.map((target) => {
      const allocated = round2(amount * (target.percentage / 100));
      return {
        target: target.dimensionMember,
        amount: allocated,
        percentage: target.percentage,
      };
    });

    const totalAllocated = round2(sumArray(allocations.map((a) => a.amount)));
    const roundingDiff = round2(amount - totalAllocated);

    // Apply rounding correction to the largest allocation target
    if (Math.abs(roundingDiff) > 0) {
      const largestIdx = allocations.reduce(
        (maxIdx, a, idx, arr) => (a.amount > arr[maxIdx].amount ? idx : maxIdx),
        0
      );
      allocations[largestIdx].amount = round2(allocations[largestIdx].amount + roundingDiff);
    }

    return {
      ruleId: rule.id,
      allocations,
      totalAllocated: amount,
      timestamp: generateTimestamp(),
      auditComment: `Allocation rule "${rule.name}" (${rule.id}): direct allocation of ${amount} across ${rule.targets.length} targets by fixed percentages.`,
    };
  }

  // --- Driver-Based Allocation ---

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

    // Compute weighted driver values
    const weightedDrivers: Array<{ target: string; weightedValue: number }> = [];
    let totalWeightedDriver = 0;

    for (const target of rule.targets) {
      const rawDriver = driverValues[target.dimensionMember] ?? 0;
      if (rawDriver < 0) {
        throw new Error(
          `Allocation rule "${rule.name}": driver value for "${target.dimensionMember}" cannot be negative.`
        );
      }
      const weighted = rawDriver * target.driverWeight;
      weightedDrivers.push({ target: target.dimensionMember, weightedValue: weighted });
      totalWeightedDriver += weighted;
    }

    if (totalWeightedDriver === 0) {
      throw new Error(
        `Allocation rule "${rule.name}": total weighted driver value is zero. Cannot allocate.`
      );
    }

    const allocations: AllocationEntry[] = weightedDrivers.map((wd) => {
      const pct = (wd.weightedValue / totalWeightedDriver) * 100;
      const allocated = round2(amount * (wd.weightedValue / totalWeightedDriver));
      return {
        target: wd.target,
        amount: allocated,
        percentage: round2(pct),
      };
    });

    // Rounding correction
    const totalAllocated = round2(sumArray(allocations.map((a) => a.amount)));
    const roundingDiff = round2(amount - totalAllocated);
    if (Math.abs(roundingDiff) > 0) {
      const largestIdx = allocations.reduce(
        (maxIdx, a, idx, arr) => (a.amount > arr[maxIdx].amount ? idx : maxIdx),
        0
      );
      allocations[largestIdx].amount = round2(allocations[largestIdx].amount + roundingDiff);
    }

    return {
      ruleId: rule.id,
      allocations,
      totalAllocated: amount,
      timestamp: generateTimestamp(),
      auditComment: `Allocation rule "${rule.name}" (${rule.id}): driver-based allocation of ${amount} using ${rule.driverDimension ?? 'driver'} across ${rule.targets.length} targets.`,
    };
  }

  // --- Step-Down Allocation ---

  static allocateStepDown(config: StepDownConfig): AllocationResult[] {
    const { serviceDepartments, productionDepartments, serviceCosts, servicePercentages } = config;

    if (serviceDepartments.length === 0) {
      throw new Error('Step-down allocation requires at least one service department.');
    }
    if (productionDepartments.length === 0) {
      throw new Error('Step-down allocation requires at least one production department.');
    }

    // Validate percentages for each service department
    for (const svcDept of serviceDepartments) {
      const percentages = servicePercentages[svcDept] ?? {};
      const allReceivers = [
        ...serviceDepartments.filter((d) => d !== svcDept),
        ...productionDepartments,
      ];
      const totalPct = sumArray(allReceivers.map((d) => percentages[d] ?? 0));
      if (Math.abs(totalPct - 100) > EPSILON) {
        throw new Error(
          `Step-down allocation: percentages for "${svcDept}" sum to ${totalPct}%, expected 100%.`
        );
      }
    }

    // Track remaining costs for all departments
    const remainingCosts: Record<string, number> = { ...serviceCosts };
    for (const prodDept of productionDepartments) {
      if (remainingCosts[prodDept] === undefined) {
        remainingCosts[prodDept] = 0;
      }
    }

    const results: AllocationResult[] = [];
    const processedServices: string[] = [];

    // Process each service department in order
    for (const svcDept of serviceDepartments) {
      const costToAllocate = remainingCosts[svcDept] ?? 0;

      if (costToAllocate === 0) {
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
      // Allocate to remaining service departments and all production departments
      const receivers = [
        ...serviceDepartments.filter((d) => !processedServices.includes(d) && d !== svcDept),
        ...productionDepartments,
      ];

      const allocations: AllocationEntry[] = [];
      for (const receiver of receivers) {
        const pct = percentages[receiver] ?? 0;
        if (pct > 0) {
          const allocated = round2(costToAllocate * (pct / 100));
          allocations.push({
            target: receiver,
            amount: allocated,
            percentage: pct,
          });
          remainingCosts[receiver] = round2((remainingCosts[receiver] ?? 0) + allocated);
        }
      }

      // Rounding correction
      const totalAllocated = round2(sumArray(allocations.map((a) => a.amount)));
      const roundingDiff = round2(costToAllocate - totalAllocated);
      if (Math.abs(roundingDiff) > 0 && allocations.length > 0) {
        const largestIdx = allocations.reduce(
          (maxIdx, a, idx, arr) => (a.amount > arr[maxIdx].amount ? idx : maxIdx),
          0
        );
        allocations[largestIdx].amount = round2(allocations[largestIdx].amount + roundingDiff);
      }

      remainingCosts[svcDept] = 0;
      processedServices.push(svcDept);

      results.push({
        ruleId: `step-down-${svcDept}`,
        allocations,
        totalAllocated: costToAllocate,
        timestamp: generateTimestamp(),
        auditComment: `Step-down allocation for "${svcDept}": allocated ${costToAllocate} to ${allocations.length} receivers.`,
      });
    }

    return results;
  }

  // --- Reciprocal Allocation ---

  static allocateReciprocal(config: ReciprocalConfig): AllocationResult[] {
    const { departments, departmentCosts, servicePercentages } = config;

    if (departments.length === 0) {
      throw new Error('Reciprocal allocation requires at least one department.');
    }

    // Validate: each department's outgoing percentages should sum to <= 100
    for (const dept of departments) {
      const percentages = servicePercentages[dept] ?? {};
      const totalPct = sumArray(
        departments.filter((d) => d !== dept).map((d) => percentages[d] ?? 0)
      );
      if (totalPct > 100 + EPSILON) {
        throw new Error(
          `Reciprocal allocation: service percentages from "${dept}" sum to ${totalPct}%, exceeds 100%.`
        );
      }
    }

    // Solve simultaneous equations using iterative approximation (Gauss-Seidel)
    // For each department i: totalCost_i = directCost_i + sum_j(pct_ji * totalCost_j)
    const totalCosts: Record<string, number> = {};
    for (const dept of departments) {
      totalCosts[dept] = departmentCosts[dept] ?? 0;
    }

    const MAX_ITERATIONS = 1000;
    const CONVERGENCE_THRESHOLD = 0.001;

    for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
      let maxDelta = 0;

      for (const dept of departments) {
        const directCost = departmentCosts[dept] ?? 0;
        let allocatedFromOthers = 0;

        for (const otherDept of departments) {
          if (otherDept === dept) continue;
          const pct = (servicePercentages[otherDept] ?? {})[dept] ?? 0;
          allocatedFromOthers += totalCosts[otherDept] * (pct / 100);
        }

        const newTotal = directCost + allocatedFromOthers;
        const delta = Math.abs(newTotal - totalCosts[dept]);
        if (delta > maxDelta) maxDelta = delta;
        totalCosts[dept] = newTotal;
      }

      if (maxDelta < CONVERGENCE_THRESHOLD) break;
    }

    // Generate results for each department
    const results: AllocationResult[] = [];

    for (const dept of departments) {
      const percentages = servicePercentages[dept] ?? {};
      const costToAllocate = totalCosts[dept];
      const receivers = departments.filter((d) => d !== dept);

      if (costToAllocate === 0) {
        results.push({
          ruleId: `reciprocal-${dept}`,
          allocations: [],
          totalAllocated: 0,
          timestamp: generateTimestamp(),
          auditComment: `Reciprocal allocation for "${dept}": zero total cost, skipped.`,
        });
        continue;
      }

      const allocations: AllocationEntry[] = [];
      for (const receiver of receivers) {
        const pct = percentages[receiver] ?? 0;
        if (pct > 0) {
          const allocated = round2(costToAllocate * (pct / 100));
          allocations.push({
            target: receiver,
            amount: allocated,
            percentage: round2(pct),
          });
        }
      }

      // Rounding correction
      const totalAllocated = round2(sumArray(allocations.map((a) => a.amount)));
      const roundingDiff = round2(costToAllocate - totalAllocated);
      if (Math.abs(roundingDiff) > 0 && allocations.length > 0) {
        const largestIdx = allocations.reduce(
          (maxIdx, a, idx, arr) => (a.amount > arr[maxIdx].amount ? idx : maxIdx),
          0
        );
        allocations[largestIdx].amount = round2(allocations[largestIdx].amount + roundingDiff);
      }

      results.push({
        ruleId: `reciprocal-${dept}`,
        allocations,
        totalAllocated: round2(costToAllocate),
        timestamp: generateTimestamp(),
        auditComment: `Reciprocal allocation for "${dept}": total cost ${round2(costToAllocate)} (direct + reciprocal), allocated to ${allocations.length} receivers.`,
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

    const totalPercentage = round2(sumArray(rule.targets.map((t) => t.percentage)));
    if (Math.abs(totalPercentage - 100) > EPSILON) {
      throw new Error(
        `Allocation rule "${rule.name}": target percentages sum to ${totalPercentage}%, expected 100%.`
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
    const result: Record<string, number> = {};
    for (const alloc of allocations) {
      result[alloc.target] = round2((alloc.amount / totalAmount) * 100);
    }
    return result;
  }

  static mergeAllocationResults(results: AllocationResult[]): Record<string, number> {
    const merged: Record<string, number> = {};
    for (const result of results) {
      for (const alloc of result.allocations) {
        merged[alloc.target] = round2((merged[alloc.target] ?? 0) + alloc.amount);
      }
    }
    return merged;
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
        if ((servicePercentages[dept][receiver] ?? 0) > 0) {
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
