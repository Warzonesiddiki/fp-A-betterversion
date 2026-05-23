import { describe, it, expect, beforeEach } from 'vitest';
import { AggregationDesigner } from './AggregationDesigner';

// =============================================================================
// AggregationDesigner Tests
// =============================================================================

describe('AggregationDesigner', () => {
  let designer: AggregationDesigner;

  beforeEach(() => {
    designer = new AggregationDesigner();
  });

  describe('define', () => {
    it('should create a new aggregation definition', () => {
      const def = designer.define('Revenue by Region', 'finance', ['Region'], ['Revenue'], 'sum');
      expect(def.name).toBe('Revenue by Region');
      expect(def.cube).toBe('finance');
      expect(def.dimensions).toEqual(['Region']);
      expect(def.measures).toEqual(['Revenue']);
      expect(def.aggregation).toBe('sum');
      expect(def.materialized).toBe(false);
      expect(def.cellCount).toBe(0);
    });

    it('should generate unique IDs', () => {
      const def1 = designer.define('Test1', 'cube', ['d1'], ['m1']);
      const def2 = designer.define('Test2', 'cube', ['d2'], ['m2']);
      expect(def1.id).not.toBe(def2.id);
    });

    it('should default aggregation to sum', () => {
      const def = designer.define('Test', 'cube', ['d'], ['m']);
      expect(def.aggregation).toBe('sum');
    });

    it('should support all aggregation types', () => {
      const types = ['sum', 'avg', 'count', 'min', 'max'] as const;
      for (const aggType of types) {
        const d = new AggregationDesigner();
        const def = d.define('Test', 'cube', ['d'], ['m'], aggType);
        expect(def.aggregation).toBe(aggType);
      }
    });
  });

  describe('getDefinition / listDefinitions', () => {
    it('should retrieve a definition by ID', () => {
      const def = designer.define('Test', 'cube', ['d'], ['m']);
      expect(designer.getDefinition(def.id)).toBe(def);
    });

    it('should return undefined for non-existent ID', () => {
      expect(designer.getDefinition('nonexistent')).toBeUndefined();
    });

    it('should list all definitions', () => {
      designer.define('A', 'cube', ['d'], ['m']);
      designer.define('B', 'cube', ['d'], ['m']);
      expect(designer.listDefinitions()).toHaveLength(2);
    });
  });

  describe('deleteDefinition', () => {
    it('should delete an existing definition', () => {
      const def = designer.define('Test', 'cube', ['d'], ['m']);
      expect(designer.deleteDefinition(def.id)).toBe(true);
      expect(designer.getDefinition(def.id)).toBeUndefined();
    });

    it('should return false for non-existent ID', () => {
      expect(designer.deleteDefinition('nonexistent')).toBe(false);
    });
  });

  describe('materialize', () => {
    let defId: string;

    beforeEach(() => {
      const def = designer.define('Revenue by Region', 'finance', ['Region'], ['Revenue'], 'sum');
      defId = def.id;
    });

    it('should return null for non-existent definition', () => {
      const result = designer.materialize('nonexistent', new Map());
      expect(result).toBeNull();
    });

    it('should aggregate cells with sum', () => {
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      cells.set('cube=finance|Region=East|measure=Revenue', 50);
      cells.set('cube=finance|Region=West|measure=Revenue', 200);

      const result = designer.materialize(defId, cells);
      expect(result).not.toBeNull();
      expect(result!.materialized).toBe(true);
      expect(result!.cellCount).toBeGreaterThan(0);
    });

    it('should aggregate cells with avg', () => {
      const d = new AggregationDesigner();
      const def = d.define('Test', 'finance', ['Region'], ['Revenue'], 'avg');
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      cells.set('cube=finance|Region=East|measure=Revenue', 200);

      const result = d.materialize(def.id, cells);
      expect(result).not.toBeNull();
    });

    it('should aggregate cells with count', () => {
      const d = new AggregationDesigner();
      const def = d.define('Test', 'finance', ['Region'], ['Revenue'], 'count');
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      cells.set('cube=finance|Region=West|measure=Revenue', 200);

      const result = d.materialize(def.id, cells);
      expect(result).not.toBeNull();
    });

    it('should aggregate cells with min', () => {
      const d = new AggregationDesigner();
      const def = d.define('Test', 'finance', ['Region'], ['Revenue'], 'min');
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      cells.set('cube=finance|Region=East|measure=Revenue', 50);

      const result = d.materialize(def.id, cells);
      expect(result).not.toBeNull();
    });

    it('should aggregate cells with max', () => {
      const d = new AggregationDesigner();
      const def = d.define('Test', 'finance', ['Region'], ['Revenue'], 'max');
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      cells.set('cube=finance|Region=East|measure=Revenue', 300);

      const result = d.materialize(def.id, cells);
      expect(result).not.toBeNull();
    });

    it('should skip cells from non-matching cubes', () => {
      const cells = new Map<string, unknown>();
      cells.set('cube=other|Region=East|measure=Revenue', 100);

      const result = designer.materialize(defId, cells);
      expect(result).not.toBeNull();
      expect(result!.cellCount).toBe(0);
    });

    it('should skip cells with non-matching measures', () => {
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=COGS', 100);

      const result = designer.materialize(defId, cells);
      expect(result).not.toBeNull();
      expect(result!.cellCount).toBe(0);
    });
  });

  describe('query', () => {
    let defId: string;

    beforeEach(() => {
      const def = designer.define('Revenue by Region', 'finance', ['Region'], ['Revenue'], 'sum');
      defId = def.id;
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      cells.set('cube=finance|Region=West|measure=Revenue', 200);
      designer.materialize(defId, cells);
    });

    it('should return null for non-existent definition', () => {
      expect(designer.query('nonexistent')).toBeNull();
    });

    it('should return all cells when no filters applied', () => {
      const result = designer.query(defId);
      expect(result).not.toBeNull();
      expect(result!.definitionId).toBe(defId);
      expect(result!.cells.length).toBeGreaterThan(0);
    });

    it('should filter cells by dimension value', () => {
      const result = designer.query(defId, { Region: 'East' });
      expect(result).not.toBeNull();
      for (const cell of result!.cells) {
        expect(cell.dimensions['Region']).toBe('East');
      }
    });

    it('should return empty cells when definition is not materialized', () => {
      const freshDesigner = new AggregationDesigner();
      const freshDef = freshDesigner.define('Test', 'cube', ['d'], ['m']);
      const result = freshDesigner.query(freshDef.id);
      expect(result).not.toBeNull();
      expect(result!.cells).toHaveLength(0);
    });

    it('should track hit counts', () => {
      const r1 = designer.query(defId);
      const r2 = designer.query(defId);
      const r3 = designer.query(defId);
      expect(r1!.hitCount).toBe(1);
      expect(r2!.hitCount).toBe(2);
      expect(r3!.hitCount).toBe(3);
    });

    it('should report queryTimeMs >= 0', () => {
      const result = designer.query(defId);
      expect(result!.queryTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('refresh', () => {
    it('should return false for non-existent definition', () => {
      expect(designer.refresh('nonexistent', new Map())).toBe(false);
    });

    it('should re-materialize existing definition', () => {
      const def = designer.define('Test', 'finance', ['Region'], ['Revenue'], 'sum');
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 100);
      designer.materialize(def.id, cells);

      const newCells = new Map<string, unknown>();
      newCells.set('cube=finance|Region=West|measure=Revenue', 500);
      expect(designer.refresh(def.id, newCells)).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return zero stats when empty', () => {
      const stats = designer.getStats();
      expect(stats.totalDefinitions).toBe(0);
      expect(stats.materializedCount).toBe(0);
      expect(stats.totalCells).toBe(0);
    });

    it('should count definitions and materialized', () => {
      designer.define('A', 'cube', ['d'], ['m']);
      const def = designer.define('B', 'cube', ['d'], ['m']);
      const cells = new Map<string, unknown>();
      cells.set('cube=x|d=y|m=z', 100);
      designer.materialize(def.id, cells);

      const stats = designer.getStats();
      expect(stats.totalDefinitions).toBe(2);
      expect(stats.materializedCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty cell map', () => {
      const def = designer.define('Test', 'cube', ['d'], ['m']);
      const result = designer.materialize(def.id, new Map());
      expect(result).not.toBeNull();
      expect(result!.cellCount).toBe(0);
    });

    it('should handle cells with non-numeric values', () => {
      const def = designer.define('Test', 'finance', ['Region'], ['Revenue'], 'sum');
      const cells = new Map<string, unknown>();
      cells.set('cube=finance|Region=East|measure=Revenue', 'not-a-number' as unknown);

      const result = designer.materialize(def.id, cells);
      expect(result).not.toBeNull();
    });

    it('should handle multiple aggregations on same cube', () => {
      const def1 = designer.define('Sum', 'cube', ['d'], ['m'], 'sum');
      const def2 = designer.define('Avg', 'cube', ['d'], ['m'], 'avg');
      expect(designer.listDefinitions()).toHaveLength(2);
      expect(def1.id).not.toBe(def2.id);
    });
  });
});
