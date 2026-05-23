/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BatchOperationEngine } from './BatchOperationEngine';

describe('BatchOperationEngine', () => {
  let engine: BatchOperationEngine;

  beforeEach(() => {
    engine = new BatchOperationEngine();
  });

  describe('execute', () => {
    it('executes a batch of operations', () => {
      const operations = [
        { type: 'update' as const, targets: ['A1'], payload: { value: 100 } },
        { type: 'update' as const, targets: ['B1'], payload: { value: 200 } },
      ];
      const result = engine.execute(operations, 'user-1');
      expect(result.success).toBe(true);
      expect(result.processed).toBe(2);
    });

    it('handles empty operations', () => {
      const result = engine.execute([], 'user-1');
      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
    });
  });

  describe('undo', () => {
    it('undoes a batch operation', () => {
      const operations = [{ type: 'update' as const, targets: ['A1'], payload: { value: 100 } }];
      engine.execute(operations, 'user-1');
      const undoResult = engine.undo();
      expect(undoResult.success).toBe(true);
    });
  });

  describe('getHistory', () => {
    it('returns operation history', () => {
      engine.execute(
        [{ type: 'update' as const, targets: ['A1'], payload: { value: 100 } }],
        'user-1'
      );
      const history = engine.getHistory();
      expect(history.length).toBe(1);
    });
  });
});
