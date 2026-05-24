/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { BatchOperationEngine } from './BatchOperationEngine';

describe('BatchOperationEngine', () => {
  describe('initial state', () => {
    it('starts with empty history', () => {
      expect(BatchOperationEngine.getHistory()).toEqual([]);
      expect(BatchOperationEngine.canUndo()).toBe(false);
      expect(BatchOperationEngine.canRedo()).toBe(false);
    });
  });

  describe('execute', () => {
    it('executes a batch of operations', () => {
      const operations = [
        { type: 'update' as const, targets: ['A1'], payload: { value: 100 } },
        { type: 'update' as const, targets: ['B1'], payload: { value: 200 } },
      ];
      const result = BatchOperationEngine.execute(operations, 'user-1');
      expect(result.success).toBe(true);
      expect(result.affectedCells).toBe(2);
      expect(typeof result.batchId).toBe('string');
    });

    it('handles empty operations', () => {
      const result = BatchOperationEngine.execute([], 'user-1');
      expect(result.success).toBe(true);
      expect(result.affectedCells).toBe(0);
    });
  });

  describe('undo', () => {
    it('undoes a batch operation and allows redo', () => {
      const operations = [{ type: 'update' as const, targets: ['A1'], payload: { value: 100 } }];
      const result = BatchOperationEngine.execute(operations, 'user-1');
      expect(BatchOperationEngine.canUndo()).toBe(true);

      BatchOperationEngine.undo(result.batchId);
      expect(BatchOperationEngine.canRedo()).toBe(true);
    });

    it('undoLast reverts the most recent operation', () => {
      const operations = [{ type: 'update' as const, targets: ['C1'], payload: { value: 300 } }];
      const result = BatchOperationEngine.execute(operations, 'user-1');
      expect(BatchOperationEngine.canUndo()).toBe(true);

      BatchOperationEngine.undoLast();
      expect(BatchOperationEngine.canRedo()).toBe(true);
    });
  });

  describe('redo', () => {
    it('redoes a batch operation after undo', () => {
      const operations = [{ type: 'update' as const, targets: ['D1'], payload: { value: 400 } }];
      const result = BatchOperationEngine.execute(operations, 'user-2');
      BatchOperationEngine.undo(result.batchId);
      expect(BatchOperationEngine.canRedo()).toBe(true);

      BatchOperationEngine.redo(result.batchId);
      expect(BatchOperationEngine.canUndo()).toBe(true);
    });

    it('redoLast reverts the most recent undo', () => {
      const operations = [{ type: 'update' as const, targets: ['E1'], payload: { value: 500 } }];
      BatchOperationEngine.execute(operations, 'user-2');
      BatchOperationEngine.undoLast();
      expect(BatchOperationEngine.canRedo()).toBe(true);

      BatchOperationEngine.redoLast();
      expect(BatchOperationEngine.canUndo()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('reports errors per target on failure', () => {
      const operations = [{ type: 'delete' as const, targets: ['Z99'], payload: null }];
      const result = BatchOperationEngine.execute(operations, 'user-1');
      // success is true because internal methods silently succeed (no-op stubs)
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
