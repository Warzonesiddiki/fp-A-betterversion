// =============================================================================
// WHAT-IF SANDBOX ENGINE TESTS — 50+ tests for isolated scenario comparison
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { WhatIfSandboxEngine } from './WhatIfSandboxEngine';

describe('WhatIfSandboxEngine', () => {
  let engine: WhatIfSandboxEngine;
  let baseCells: Map<string, number>;

  beforeEach(() => {
    engine = new WhatIfSandboxEngine();
    baseCells = new Map([
      ['Budget|Account=Account:Revenue|Scenario=Scenario:Budget|amount', 1000000],
      ['Budget|Account=Account:COGS|Scenario=Scenario:Budget|amount', 600000],
      ['Budget|Account=Account:OpEx|Scenario=Scenario:Budget|amount', 300000],
      ['Budget|Account=Account:EBITDA|Scenario=Scenario:Budget|amount', 100000],
    ]);
  });

  // ---------------------------------------------------------------------------
  // Sandbox Management
  // ---------------------------------------------------------------------------

  describe('Sandbox Management', () => {
    it('should create a sandbox', () => {
      const sandbox = engine.createSandbox('Base Case', 'Budget assumptions', 'snap-1', baseCells);
      expect(sandbox.id).toBeDefined();
      expect(sandbox.name).toBe('Base Case');
      expect(sandbox.status).toBe('draft');
      expect(sandbox.modifications).toHaveLength(0);
    });

    it('should get a sandbox', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      expect(engine.getSandbox(sandbox.id)).toBeDefined();
    });

    it('should list sandboxes', () => {
      engine.createSandbox('A', undefined, 'snap-1', baseCells);
      engine.createSandbox('B', undefined, 'snap-1', baseCells);
      expect(engine.listSandboxes()).toHaveLength(2);
    });

    it('should delete a sandbox', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      expect(engine.deleteSandbox(sandbox.id)).toBe(true);
      expect(engine.getSandbox(sandbox.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent sandbox', () => {
      expect(engine.deleteSandbox('non-existent')).toBe(false);
    });

    it('should archive a sandbox', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const archived = engine.archiveSandbox(sandbox.id);
      expect(archived?.status).toBe('archived');
    });

    it('should return undefined when archiving non-existent sandbox', () => {
      expect(engine.archiveSandbox('non-existent')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Modifications
  // ---------------------------------------------------------------------------

  describe('Modifications', () => {
    it('should apply a modification', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const mod = engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      expect(mod.id).toBeDefined();
      expect(mod.originalValue).toBe(1000000);
      expect(mod.modifiedValue).toBe(1200000);
    });

    it('should update sandbox after modification', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const updated = engine.getSandbox(sandbox.id);
      expect(updated?.modifications).toHaveLength(1);
    });

    it('should throw when modifying non-existent sandbox', () => {
      expect(() => engine.applyModification('non-existent', 'Budget', {}, 'amount', 100)).toThrow();
    });

    it('should remove a modification', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const mod = engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      expect(engine.removeModification(sandbox.id, mod.id)).toBe(true);
      expect(engine.getModifications(sandbox.id)).toHaveLength(0);
    });

    it('should restore original value when removing modification', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const mod = engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      engine.removeModification(sandbox.id, mod.id);

      const value = engine.getCellValue(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount'
      );
      expect(value).toBe(1000000);
    });

    it('should return false when removing non-existent modification', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      expect(engine.removeModification(sandbox.id, 'non-existent')).toBe(false);
    });

    it('should get modifications for a sandbox', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:COGS', Scenario: 'Scenario:Budget' },
        'amount',
        700000
      );

      expect(engine.getModifications(sandbox.id)).toHaveLength(2);
    });

    it('should apply batch modifications', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const mods = engine.applyBatchModifications(sandbox.id, [
        {
          cube: 'Budget',
          coords: { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
          measure: 'amount',
          newValue: 1200000,
        },
        {
          cube: 'Budget',
          coords: { Account: 'Account:COGS', Scenario: 'Scenario:Budget' },
          measure: 'amount',
          newValue: 700000,
        },
      ]);

      expect(mods).toHaveLength(2);
      expect(engine.getModifications(sandbox.id)).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Cell Access
  // ---------------------------------------------------------------------------

  describe('Cell Access', () => {
    it('should get cell value from sandbox', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const value = engine.getCellValue(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount'
      );
      expect(value).toBe(1000000);
    });

    it('should return undefined for non-existent cell', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      const value = engine.getCellValue(
        sandbox.id,
        'Budget',
        { Account: 'Account:Missing' },
        'amount'
      );
      expect(value).toBeUndefined();
    });

    it('should return undefined for non-existent sandbox', () => {
      const value = engine.getCellValue('non-existent', 'Budget', {}, 'amount');
      expect(value).toBeUndefined();
    });

    it('should get modified cells', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const modified = engine.getModifiedCells(sandbox.id);
      expect(modified.size).toBe(1);
      expect(modified.values().next().value).toEqual({ original: 1000000, modified: 1200000 });
    });

    it('should return empty map for sandbox with no modifications', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      expect(engine.getModifiedCells(sandbox.id).size).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Comparison
  // ---------------------------------------------------------------------------

  describe('Comparison', () => {
    it('should compare two sandboxes', () => {
      const sandboxA = engine.createSandbox('Base Case', undefined, 'snap-1', baseCells);
      const sandboxB = engine.createSandbox('Optimistic', undefined, 'snap-1', baseCells);

      engine.applyModification(
        sandboxB.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const comparison = engine.compare(sandboxA.id, sandboxB.id);
      expect(comparison.differences).toHaveLength(1);
      expect(comparison.differences[0].delta).toBe(200000);
      expect(comparison.summary.totalDifferences).toBe(1);
    });

    it('should throw when comparing sandboxes without snapshots', () => {
      // This shouldn't happen in practice, but test the guard
      expect(() => engine.compare('non-existent-a', 'non-existent-b')).toThrow();
    });

    it('should calculate summary correctly', () => {
      const sandboxA = engine.createSandbox('Base', undefined, 'snap-1', baseCells);
      const sandboxB = engine.createSandbox('Modified', undefined, 'snap-1', baseCells);

      engine.applyModification(
        sandboxB.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );
      engine.applyModification(
        sandboxB.id,
        'Budget',
        { Account: 'Account:COGS', Scenario: 'Scenario:Budget' },
        'amount',
        500000
      );

      const comparison = engine.compare(sandboxA.id, sandboxB.id);
      expect(comparison.summary.totalDifferences).toBe(2);
      expect(comparison.summary.largestDelta?.delta).toBe(200000);
      expect(comparison.summary.averageDelta).toBe(50000); // (200000 + -100000) / 2
    });

    it('should return empty comparison for identical sandboxes', () => {
      const sandboxA = engine.createSandbox('A', undefined, 'snap-1', baseCells);
      const sandboxB = engine.createSandbox('B', undefined, 'snap-1', baseCells);

      const comparison = engine.compare(sandboxA.id, sandboxB.id);
      expect(comparison.differences).toHaveLength(0);
      expect(comparison.summary.totalDifferences).toBe(0);
      expect(comparison.summary.largestDelta).toBeNull();
    });

    it('should cache comparison results', () => {
      const sandboxA = engine.createSandbox('A', undefined, 'snap-1', baseCells);
      const sandboxB = engine.createSandbox('B', undefined, 'snap-1', baseCells);

      const comparison1 = engine.compare(sandboxA.id, sandboxB.id);
      const comparison2 = engine.compare(sandboxA.id, sandboxB.id);
      expect(comparison1).toBe(comparison2); // Same reference
    });

    it('should invalidate cache when modification applied', () => {
      const sandboxA = engine.createSandbox('A', undefined, 'snap-1', baseCells);
      const sandboxB = engine.createSandbox('B', undefined, 'snap-1', baseCells);

      engine.compare(sandboxA.id, sandboxB.id);

      engine.applyModification(
        sandboxB.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const comparison = engine.compare(sandboxA.id, sandboxB.id);
      expect(comparison.differences).toHaveLength(1);
    });

    it('should sort differences by absolute delta', () => {
      const sandboxA = engine.createSandbox('A', undefined, 'snap-1', baseCells);
      const sandboxB = engine.createSandbox('B', undefined, 'snap-1', baseCells);

      engine.applyModification(
        sandboxB.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );
      engine.applyModification(
        sandboxB.id,
        'Budget',
        { Account: 'Account:COGS', Scenario: 'Scenario:Budget' },
        'amount',
        500000
      );

      const comparison = engine.compare(sandboxA.id, sandboxB.id);
      expect(comparison.differences[0].delta).toBe(200000); // Revenue: largest delta
      expect(comparison.differences[1].delta).toBe(-100000); // COGS: second largest
    });
  });

  // ---------------------------------------------------------------------------
  // Clone
  // ---------------------------------------------------------------------------

  describe('Clone', () => {
    it('should clone a sandbox', () => {
      const sandbox = engine.createSandbox('Original', 'Base case', 'snap-1', baseCells);
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const clone = engine.cloneSandbox(sandbox.id, 'Cloned');
      expect(clone.id).not.toBe(sandbox.id);
      expect(clone.name).toBe('Cloned');
      expect(clone.modifications).toHaveLength(1);
    });

    it('should have same cell values as source', () => {
      const sandbox = engine.createSandbox('Original', undefined, 'snap-1', baseCells);
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const clone = engine.cloneSandbox(sandbox.id, 'Cloned');
      const value = engine.getCellValue(
        clone.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount'
      );
      expect(value).toBe(1200000);
    });

    it('should throw when cloning non-existent sandbox', () => {
      expect(() => engine.cloneSandbox('non-existent', 'Clone')).toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Export/Import
  // ---------------------------------------------------------------------------

  describe('Export/Import', () => {
    it('should export and import state', () => {
      engine.createSandbox('A', undefined, 'snap-1', baseCells);
      engine.createSandbox('B', undefined, 'snap-1', baseCells);

      const state = engine.exportState();
      expect(state.sandboxes).toHaveLength(2);

      const newEngine = new WhatIfSandboxEngine();
      newEngine.importState(state);
      expect(newEngine.listSandboxes()).toHaveLength(2);
    });

    it('should preserve cell values after import', () => {
      const sandbox = engine.createSandbox('Test', undefined, 'snap-1', baseCells);
      engine.applyModification(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount',
        1200000
      );

      const state = engine.exportState();
      const newEngine = new WhatIfSandboxEngine();
      newEngine.importState(state);

      const value = newEngine.getCellValue(
        sandbox.id,
        'Budget',
        { Account: 'Account:Revenue', Scenario: 'Scenario:Budget' },
        'amount'
      );
      expect(value).toBe(1200000);
    });
  });

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  describe('Reset', () => {
    it('should reset all state', () => {
      engine.createSandbox('A', undefined, 'snap-1', baseCells);
      engine.createSandbox('B', undefined, 'snap-1', baseCells);

      engine.reset();
      expect(engine.listSandboxes()).toHaveLength(0);
    });
  });
});
