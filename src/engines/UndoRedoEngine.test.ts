import { describe, it, expect, beforeEach } from 'vitest';
import { UndoRedoEngine } from './UndoRedoEngine';

describe('UndoRedoEngine', () => {
  beforeEach(() => {
    UndoRedoEngine.clearHistory();
  });

  it('peeks at instance history without consuming or exposing mutable snapshots', () => {
    const engine = new UndoRedoEngine<{ entries: string[] }>();
    expect(engine.peekUndo()).toBeNull();
    expect(engine.peekRedo()).toBeNull();
    engine.push({ entries: ['a'] });
    const peek = engine.peekUndo()!;
    peek.entries.push('mutated');
    expect(engine.getHistoryLength()).toBe(1);
    expect(engine.peekUndo()).toEqual({ entries: ['a'] });
    engine.undo();
    expect(engine.peekUndo()).toBeNull();
    expect(engine.peekRedo()).toEqual({ entries: ['a'] });
    engine.peekRedo()!.entries.push('mutated');
    expect(engine.canRedo()).toBe(true);
    expect(engine.redo()).toEqual({ entries: ['a'] });
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
