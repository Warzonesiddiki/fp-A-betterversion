/**
 * Assumption Engine — Track financial model assumptions separately from calculations
 * Supports versioning, locking, impact analysis, and history
 *
 * MONEY MIGRATION (2026-08-03): for assumptions whose unit is 'currency',
 * impact deltas and estimated impacts flow through the canonical money
 * primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP) and round to
 * cents. percent/ratio/count assumptions are not currency and keep float
 * arithmetic. No raw + - * / on currency values remains.
 */

import { randomId } from '@/utils/cryptoId';
import { roundTo, subtractMoney } from '../utils/money';

export interface Assumption {
  id: string;
  name: string;
  value: number;
  unit: 'percent' | 'currency' | 'ratio' | 'count';
  category: 'revenue' | 'cost' | 'rate' | 'macro' | 'operational';
  source: string;
  effectiveFrom: string;
  effectiveTo: string;
  lockedBy?: string;
  version: number;
  history: AssumptionHistoryEntry[];
}

export interface AssumptionHistoryEntry {
  value: number;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export interface ImpactResult {
  assumptionId: string;
  oldValue: number;
  newValue: number;
  delta: number;
  affectedCells: string[];
  estimatedImpact: number;
}

export class AssumptionEngine {
  private static assumptions = new Map<string, Assumption>();

  static create(data: Omit<Assumption, 'id' | 'version' | 'history'>): Assumption {
    const id = `asm_${randomId()}`;
    const assumption: Assumption = {
      ...data,
      id,
      version: 1,
      history: [],
    };
    this.assumptions.set(id, assumption);
    return assumption;
  }

  static get(id: string): Assumption | undefined {
    return this.assumptions.get(id);
  }

  static getAll(): Assumption[] {
    return Array.from(this.assumptions.values());
  }

  static update(id: string, value: number, userId: string, reason: string): Assumption {
    const existing = this.assumptions.get(id);
    if (!existing) throw new Error(`Assumption ${id} not found`);
    if (existing.lockedBy && existing.lockedBy !== userId) {
      throw new Error(`Assumption ${id} is locked by ${existing.lockedBy}`);
    }

    existing.history.push({
      value: existing.value,
      changedBy: userId,
      changedAt: new Date().toISOString(),
      reason,
    });

    existing.value = value;
    existing.version += 1;
    return existing;
  }

  static lock(id: string, userId: string): void {
    const assumption = this.assumptions.get(id);
    if (!assumption) throw new Error(`Assumption ${id} not found`);
    assumption.lockedBy = userId;
  }

  static unlock(id: string, userId: string): void {
    const assumption = this.assumptions.get(id);
    if (!assumption) throw new Error(`Assumption ${id} not found`);
    if (assumption.lockedBy !== userId) {
      throw new Error(`Only ${assumption.lockedBy} can unlock this assumption`);
    }
    assumption.lockedBy = undefined;
  }

  static getHistory(id: string): AssumptionHistoryEntry[] {
    const assumption = this.assumptions.get(id);
    return assumption?.history ?? [];
  }

  static getByCategory(category: string): Assumption[] {
    return Array.from(this.assumptions.values()).filter((a) => a.category === category);
  }

  static impactAnalysis(assumptionId: string, newValue: number): ImpactResult {
    const assumption = this.assumptions.get(assumptionId);
    if (!assumption) throw new Error(`Assumption ${assumptionId} not found`);

    const affectedCells: string[] = [];
    if (assumption.unit === 'currency') {
      const deltaDec = subtractMoney(newValue, assumption.value);
      const estimatedImpact = roundTo(deltaDec);
      return {
        assumptionId,
        oldValue: assumption.value,
        newValue,
        delta: deltaDec.toNumber(),
        affectedCells,
        estimatedImpact,
      };
    }
    const delta = newValue - assumption.value;
    const estimatedImpact = delta * (assumption.unit === 'percent' ? 0.01 : 1);

    return {
      assumptionId,
      oldValue: assumption.value,
      newValue,
      delta,
      affectedCells,
      estimatedImpact,
    };
  }

  static delete(id: string): boolean {
    return this.assumptions.delete(id);
  }

  static clear(): void {
    this.assumptions.clear();
  }
}
