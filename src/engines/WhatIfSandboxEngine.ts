// =============================================================================
// WHAT-IF SANDBOX ENGINE — Isolated scenario comparison
// Create sandboxes, modify assumptions, compare results side-by-side
// Uses CubeEngine snapshots for isolation
// =============================================================================

import { randomId } from '@/utils/cryptoId';
import { divideMoney, roundTo, sumMoney, toDecimal } from '../utils/money';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Sandbox {
  id: string;
  name: string;
  description?: string;
  baseSnapshotId: string;
  modifications: SandboxModification[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'archived';
}

export interface SandboxModification {
  id: string;
  cube: string;
  coords: Record<string, string>;
  measure: string;
  originalValue: number;
  modifiedValue: number;
  appliedAt: string;
}

export interface SandboxComparison {
  sandboxA: string;
  sandboxB: string;
  differences: ComparisonDifference[];
  summary: ComparisonSummary;
}

export interface ComparisonDifference {
  cube: string;
  coords: Record<string, string>;
  measure: string;
  valueA: number;
  valueB: number;
  delta: number;
  percentChange: number;
}

export interface ComparisonSummary {
  totalDifferences: number;
  largestDelta: ComparisonDifference | null;
  largestPercentChange: ComparisonDifference | null;
  averageDelta: number;
  averagePercentChange: number;
}

export interface SandboxSnapshot {
  sandboxId: string;
  cellValues: Map<string, number>;
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

export class WhatIfSandboxEngine {
  private sandboxes = new Map<string, Sandbox>();
  private snapshots = new Map<string, SandboxSnapshot>();
  private comparisonCache = new Map<string, SandboxComparison>();

  // --- Sandbox Management ---

  createSandbox(
    name: string,
    description: string | undefined,
    baseSnapshotId: string,
    baseCells: Map<string, number>
  ): Sandbox {
    const id = generateId('sandbox');
    const now = new Date().toISOString();

    const sandbox: Sandbox = {
      id,
      name,
      description,
      baseSnapshotId,
      modifications: [],
      createdAt: now,
      updatedAt: now,
      status: 'draft',
    };

    this.sandboxes.set(id, sandbox);

    // Store base snapshot
    const snapshot: SandboxSnapshot = {
      sandboxId: id,
      cellValues: new Map(baseCells),
      timestamp: now,
    };
    this.snapshots.set(id, snapshot);

    return sandbox;
  }

  getSandbox(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  listSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  deleteSandbox(id: string): boolean {
    const existed = this.sandboxes.delete(id);
    if (existed) {
      this.snapshots.delete(id);
      // Clear comparison cache entries involving this sandbox
      for (const [key, comp] of this.comparisonCache) {
        if (comp.sandboxA === id || comp.sandboxB === id) {
          this.comparisonCache.delete(key);
        }
      }
    }
    return existed;
  }

  archiveSandbox(id: string): Sandbox | undefined {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) return undefined;
    sandbox.status = 'archived';
    sandbox.updatedAt = new Date().toISOString();
    return sandbox;
  }

  // --- Modifications ---

  applyModification(
    sandboxId: string,
    cube: string,
    coords: Record<string, string>,
    measure: string,
    newValue: number
  ): SandboxModification {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) throw new Error(`Sandbox "${sandboxId}" not found`);

    const snapshot = this.snapshots.get(sandboxId);
    if (!snapshot) throw new Error(`Snapshot for sandbox "${sandboxId}" not found`);

    const key = cellKey(cube, coords, measure);
    const originalValue = snapshot.cellValues.get(key) ?? 0;

    const modification: SandboxModification = {
      id: generateId('mod'),
      cube,
      coords,
      measure,
      originalValue,
      modifiedValue: newValue,
      appliedAt: new Date().toISOString(),
    };

    sandbox.modifications.push(modification);
    sandbox.updatedAt = new Date().toISOString();

    // Update snapshot
    snapshot.cellValues.set(key, newValue);

    // Invalidate comparison cache
    this.comparisonCache.clear();

    return modification;
  }

  removeModification(sandboxId: string, modificationId: string): boolean {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return false;

    const idx = sandbox.modifications.findIndex((m) => m.id === modificationId);
    if (idx === -1) return false;

    const mod = sandbox.modifications[idx];

    // Restore original value in snapshot
    const snapshot = this.snapshots.get(sandboxId);
    if (snapshot) {
      const key = cellKey(mod!.cube, mod!.coords, mod!.measure);
      snapshot.cellValues.set(key, mod!.originalValue);
    }

    sandbox.modifications.splice(idx, 1);
    sandbox.updatedAt = new Date().toISOString();

    // Invalidate comparison cache
    this.comparisonCache.clear();

    return true;
  }

  getModifications(sandboxId: string): SandboxModification[] {
    const sandbox = this.sandboxes.get(sandboxId);
    return sandbox?.modifications ?? [];
  }

  // --- Cell Access ---

  getCellValue(
    sandboxId: string,
    cube: string,
    coords: Record<string, string>,
    measure: string
  ): number | undefined {
    const snapshot = this.snapshots.get(sandboxId);
    if (!snapshot) return undefined;
    const key = cellKey(cube, coords, measure);
    return snapshot.cellValues.get(key);
  }

  getModifiedCells(sandboxId: string): Map<string, { original: number; modified: number }> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) return new Map();

    const result = new Map<string, { original: number; modified: number }>();
    for (const mod of sandbox.modifications) {
      const key = cellKey(mod.cube, mod.coords, mod.measure);
      result.set(key, { original: mod.originalValue, modified: mod.modifiedValue });
    }
    return result;
  }

  // --- Comparison ---

  compare(sandboxAId: string, sandboxBId: string): SandboxComparison {
    const cacheKey = [sandboxAId, sandboxBId].sort().join('|');
    const cached = this.comparisonCache.get(cacheKey);
    if (cached) return cached;

    const snapshotA = this.snapshots.get(sandboxAId);
    const snapshotB = this.snapshots.get(sandboxBId);
    if (!snapshotA || !snapshotB) {
      throw new Error('Both sandboxes must have snapshots for comparison');
    }

    const differences: ComparisonDifference[] = [];

    // Compare all cells in A against B
    for (const [key, valueA] of snapshotA.cellValues) {
      const valueB = snapshotB.cellValues.get(key);
      if (valueB === undefined) continue;

      const delta = valueB - valueA;
      const percentChange = valueA !== 0 ? (delta / Math.abs(valueA)) * 100 : 0;

      if (Math.abs(delta) > 0.0001) {
        const [cube, coordsStr, measure] = this.parseCellKey(key);
        const coords = this.parseCoords(coordsStr);

        differences.push({
          cube,
          coords,
          measure,
          valueA,
          valueB,
          delta: Math.round(delta * 100) / 100,
          percentChange: Math.round(percentChange * 100) / 100,
        });
      }
    }

    // Also check cells in B that aren't in A
    for (const [key, valueB] of snapshotB.cellValues) {
      if (!snapshotA.cellValues.has(key)) {
        const [cube, coordsStr, measure] = this.parseCellKey(key);
        const coords = this.parseCoords(coordsStr);

        differences.push({
          cube,
          coords,
          measure,
          valueA: 0,
          valueB,
          delta: valueB,
          percentChange: 100,
        });
      }
    }

    // Sort by absolute delta descending
    differences.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    const summary = this.calculateSummary(differences);

    const comparison: SandboxComparison = {
      sandboxA: sandboxAId,
      sandboxB: sandboxBId,
      differences,
      summary,
    };

    this.comparisonCache.set(cacheKey, comparison);

    return comparison;
  }

  private parseCellKey(key: string): [string, string, string] {
    const parts = key.split('|');
    const measure = parts.pop()!;
    const coordsStr = parts.slice(1).join('|');
    const cube = parts[0]!;
    return [cube, coordsStr, measure];
  }

  private parseCoords(coordsStr: string): Record<string, string> {
    const coords: Record<string, string> = {};
    for (const part of coordsStr.split('|')) {
      const [key, value] = part.split('=');
      if (key && value) {
        coords[key] = value;
      }
    }
    return coords;
  }

  private calculateSummary(differences: ComparisonDifference[]): ComparisonSummary {
    if (differences.length === 0) {
      return {
        totalDifferences: 0,
        largestDelta: null,
        largestPercentChange: null,
        averageDelta: 0,
        averagePercentChange: 0,
      };
    }

    const totalDelta = sumMoney(differences.map((d) => d.delta));
    const totalPercent = sumMoney(differences.map((d) => d.percentChange));
    const count = toDecimal(differences.length);

    return {
      totalDifferences: differences.length,
      largestDelta: differences[0]!, // Already sorted by abs(delta)
      largestPercentChange:
        [...differences].sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))[0] ??
        null,
      averageDelta: roundTo(divideMoney(totalDelta, count), 2),
      averagePercentChange: roundTo(divideMoney(totalPercent, count), 2),
    };
  }

  // --- Batch Operations ---

  applyBatchModifications(
    sandboxId: string,
    modifications: Array<{
      cube: string;
      coords: Record<string, string>;
      measure: string;
      newValue: number;
    }>
  ): SandboxModification[] {
    return modifications.map((m) =>
      this.applyModification(sandboxId, m.cube, m.coords, m.measure, m.newValue)
    );
  }

  // --- Clone ---

  cloneSandbox(sourceId: string, newName: string): Sandbox {
    const source = this.sandboxes.get(sourceId);
    if (!source) throw new Error(`Source sandbox "${sourceId}" not found`);

    const sourceSnapshot = this.snapshots.get(sourceId);
    if (!sourceSnapshot) throw new Error(`Source snapshot not found`);

    // Create new sandbox with current cell values
    const newSandbox = this.createSandbox(
      newName,
      `Cloned from ${source.name}`,
      source.baseSnapshotId,
      sourceSnapshot.cellValues
    );

    // Re-apply modifications to maintain modification history
    for (const mod of source.modifications) {
      this.applyModification(newSandbox.id, mod.cube, mod.coords, mod.measure, mod.modifiedValue);
    }

    return newSandbox;
  }

  // --- Export/Import ---

  exportState(): {
    sandboxes: Sandbox[];
    snapshots: Array<{ sandboxId: string; cellValues: Array<[string, number]>; timestamp: string }>;
  } {
    return {
      sandboxes: this.listSandboxes(),
      snapshots: Array.from(this.snapshots.entries()).map(([_id, snap]) => ({
        sandboxId: snap.sandboxId,
        cellValues: Array.from(snap.cellValues.entries()),
        timestamp: snap.timestamp,
      })),
    };
  }

  importState(state: {
    sandboxes: Sandbox[];
    snapshots: Array<{ sandboxId: string; cellValues: Array<[string, number]>; timestamp: string }>;
  }): void {
    this.sandboxes.clear();
    this.snapshots.clear();
    this.comparisonCache.clear();

    for (const sandbox of state.sandboxes) {
      this.sandboxes.set(sandbox.id, sandbox);
    }

    for (const snap of state.snapshots) {
      this.snapshots.set(snap.sandboxId, {
        sandboxId: snap.sandboxId,
        cellValues: new Map(snap.cellValues),
        timestamp: snap.timestamp,
      });
    }
  }

  // --- Reset ---

  reset(): void {
    this.sandboxes.clear();
    this.snapshots.clear();
    this.comparisonCache.clear();
  }
}
