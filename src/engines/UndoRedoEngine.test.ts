import { describe, it, expect, beforeEach } from 'vitest';
import { UndoRedoEngine } from './UndoRedoEngine';

describe('UndoRedoEngine', () => {
  beforeEach(() => {
    UndoRedoEngine.clearHistory();
  });

  it('should push and undo actions', () => {
    UndoRedoEngine.pushAction('budget', 'add', { value: 1 });
    UndoRedoEngine.pushAction('budget', 'add', { value: 2 });
    const undone = UndoRedoEngine.undo();
    expect(undone).toBeDefined();
  });

  it('should redo actions', () => {
    UndoRedoEngine.pushAction('budget', 'add', { value: 1 });
    UndoRedoEngine.undo();
    const redone = UndoRedoEngine.redo();
    expect(redone).toBeDefined();
  });

  it('should track history', () => {
    UndoRedoEngine.pushAction('budget', 'add', { value: 1 });
    UndoRedoEngine.pushAction('budget', 'update', { value: 2 });
    const history = UndoRedoEngine.getHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  it('should reset state', () => {
    UndoRedoEngine.pushAction('budget', 'add', { value: 1 });
    UndoRedoEngine.clearHistory();
    const history = UndoRedoEngine.getHistory();
    expect(history.length).toBe(0);
  });
});
