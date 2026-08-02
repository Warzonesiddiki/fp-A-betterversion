/**
 * AllocationRuleEngine — Rule-based cost allocation
 * Distributes costs across departments, products, or regions based on configurable rules
 *
 * MONEY MIGRATION (2026-08-03): source amounts, per-target allocation amounts,
 * totalAllocated and variance are money and flow through the canonical money
 * primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP). Allocation shares
 * keep full Decimal precision (they reconcile by construction); percentages
 * are ratios. No raw + - * / on currency values remains.
 */

import { addMoney, divideMoney, multiplyMoney, subtractMoney, toDecimal } from '../utils/money';

export interface AllocationRule {
  id: string;
  name: string;
  description: string;
  sourceAccount: string;
  targets: AllocationTarget[];
  method: 'percentage' | 'driver' | 'equal' | 'revenue' | 'headcount' | 'squarefoot';
  driverId?: string;
  effectiveFrom: string;
  effectiveTo: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface AllocationTarget {
  accountCode: string;
  departmentId?: string;
  percentage?: number;
  driverValue?: number;
  formula?: string;
}

export interface AllocationResult {
  ruleId: string;
  sourceAmount: number;
  allocations: Array<{
    targetAccount: string;
    targetDepartment?: string;
    amount: number;
    percentage: number;
  }>;
  totalAllocated: number;
  variance: number;
  timestamp: string;
}

export class AllocationRuleEngine {
  private static rules: Map<string, AllocationRule> = new Map();

  /**
   * Create a new allocation rule
   */
  static create(rule: Omit<AllocationRule, 'id' | 'createdAt'>): AllocationRule {
    const id = `alloc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const full: AllocationRule = {
      ...rule,
      id,
      createdAt: new Date().toISOString(),
    };
    this.rules.set(id, full);
    return full;
  }

  /**
   * Update an existing rule
   */
  static update(id: string, changes: Partial<AllocationRule>): AllocationRule | null {
    const existing = this.rules.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes };
    this.rules.set(id, updated);
    return updated;
  }

  /**
   * Delete a rule
   */
  static delete(id: string): boolean {
    return this.rules.delete(id);
  }

  /**
   * Get all rules
   */
  static getAll(): AllocationRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules for a specific source account
   */
  static getByAccount(accountCode: string): AllocationRule[] {
    return this.getAll().filter((r) => r.sourceAccount === accountCode && r.isActive);
  }

  /**
   * Execute allocation for a given amount
   */
  static allocate(
    ruleId: string,
    sourceAmount: number,
    context?: {
      revenueByTarget?: Map<string, number>;
      headcountByTarget?: Map<string, number>;
      squarefootByTarget?: Map<string, number>;
    }
  ): AllocationResult {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return {
        ruleId,
        sourceAmount,
        allocations: [],
        totalAllocated: 0,
        variance: sourceAmount,
        timestamp: new Date().toISOString(),
      };
    }

    const allocations: AllocationResult['allocations'] = [];
    let totalAllocated = toDecimal(0);

    switch (rule.method) {
      case 'percentage': {
        for (const target of rule.targets) {
          const pct = target.percentage ?? 0;
          const amount = multiplyMoney(toDecimal(sourceAmount), pct / 100);
          allocations.push({
            targetAccount: target.accountCode,
            targetDepartment: target.departmentId,
            amount: amount.toNumber(),
            percentage: pct,
          });
          totalAllocated = addMoney(totalAllocated, amount);
        }
        break;
      }

      case 'equal': {
        const perTarget = divideMoney(sourceAmount, rule.targets.length);
        for (const target of rule.targets) {
          allocations.push({
            targetAccount: target.accountCode,
            targetDepartment: target.departmentId,
            amount: perTarget.toNumber(),
            percentage: 100 / rule.targets.length,
          });
          totalAllocated = addMoney(totalAllocated, perTarget);
        }
        break;
      }

      case 'revenue': {
        const totalRevenue = context?.revenueByTarget
          ? Array.from(context.revenueByTarget.values()).reduce((a, b) => a + b, 0)
          : 1;
        for (const target of rule.targets) {
          const revenue = context?.revenueByTarget?.get(target.accountCode) ?? 0;
          const share = totalRevenue > 0 ? toDecimal(revenue).div(totalRevenue) : toDecimal(0);
          const amount = multiplyMoney(toDecimal(sourceAmount), share);
          allocations.push({
            targetAccount: target.accountCode,
            targetDepartment: target.departmentId,
            amount: amount.toNumber(),
            percentage: share.times(100).toNumber(),
          });
          totalAllocated = addMoney(totalAllocated, amount);
        }
        break;
      }

      case 'headcount': {
        const totalHeadcount = context?.headcountByTarget
          ? Array.from(context.headcountByTarget.values()).reduce((a, b) => a + b, 0)
          : 1;
        for (const target of rule.targets) {
          const hc = context?.headcountByTarget?.get(target.accountCode) ?? 0;
          const share = totalHeadcount > 0 ? toDecimal(hc).div(totalHeadcount) : toDecimal(0);
          const amount = multiplyMoney(toDecimal(sourceAmount), share);
          allocations.push({
            targetAccount: target.accountCode,
            targetDepartment: target.departmentId,
            amount: amount.toNumber(),
            percentage: share.times(100).toNumber(),
          });
          totalAllocated = addMoney(totalAllocated, amount);
        }
        break;
      }

      case 'squarefoot': {
        const totalSqft = context?.squarefootByTarget
          ? Array.from(context.squarefootByTarget.values()).reduce((a, b) => a + b, 0)
          : 1;
        for (const target of rule.targets) {
          const sqft = context?.squarefootByTarget?.get(target.accountCode) ?? 0;
          const share = totalSqft > 0 ? toDecimal(sqft).div(totalSqft) : toDecimal(0);
          const amount = multiplyMoney(toDecimal(sourceAmount), share);
          allocations.push({
            targetAccount: target.accountCode,
            targetDepartment: target.departmentId,
            amount: amount.toNumber(),
            percentage: share.times(100).toNumber(),
          });
          totalAllocated = addMoney(totalAllocated, amount);
        }
        break;
      }

      case 'driver': {
        const totalDriver = rule.targets.reduce((sum, t) => sum + (t.driverValue ?? 0), 0);
        for (const target of rule.targets) {
          const driverVal = target.driverValue ?? 0;
          const share = totalDriver > 0 ? toDecimal(driverVal).div(totalDriver) : toDecimal(0);
          const amount = multiplyMoney(toDecimal(sourceAmount), share);
          allocations.push({
            targetAccount: target.accountCode,
            targetDepartment: target.departmentId,
            amount: amount.toNumber(),
            percentage: share.times(100).toNumber(),
          });
          totalAllocated = addMoney(totalAllocated, amount);
        }
        break;
      }
    }

    return {
      ruleId,
      sourceAmount,
      allocations,
      totalAllocated: totalAllocated.toNumber(),
      variance: subtractMoney(sourceAmount, totalAllocated).toNumber(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate rule completeness
   */
  static validate(rule: AllocationRule): string[] {
    const errors: string[] = [];
    if (!rule.name) errors.push('Rule name is required');
    if (!rule.sourceAccount) errors.push('Source account is required');
    if (rule.targets.length === 0) errors.push('At least one target is required');
    if (rule.method === 'percentage') {
      const total = rule.targets.reduce((sum, t) => sum + (t.percentage ?? 0), 0);
      if (Math.abs(total - 100) > 0.01)
        errors.push(`Percentages must sum to 100% (currently ${total}%)`);
    }
    return errors;
  }
}
