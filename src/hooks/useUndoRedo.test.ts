/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUndoRedoActions, useUndoRedo } from './useUndoRedo';

// Mock the UndoRedoEngine
vi.mock('@/engines/UndoRedoEngine', () => {
  return {
    UndoRedoEngine: class {
      private history: any[] = [];
      private pointer = -1;
      constructor(private maxDepth: number = 100) {}

      push(state: any) {
        this.history = this.history.slice(0, this.pointer + 1);
        this.history.push(state);
        if (this.history.length > this.maxDepth) this.history.shift();
        this.pointer = this.history.length - 1;
      }

      undo() {
        if (this.pointer <= 0) return null;
        this.pointer--;
        return this.history[this.pointer];
      }

      redo() {
        if (this.pointer >= this.history.length - 1) return null;
        this.pointer++;
        return this.history[this.pointer];
      }

      canUndo() {
        return this.pointer > 0;
      }
      canRedo() {
        return this.pointer < this.history.length - 1;
      }
      getHistoryLength() {
        return this.history.length;
      }
    },
  };
});

describe('createUndoRedoActions', () => {
  let state = { count: 0 };
  const getSnapshot = () => ({ count: state.count });
  const applySnapshot = (snap: { count: number }) => {
    state = { count: snap.count };
  };

  beforeEach(() => {
    state = { count: 0 };
  });

  it('should create actions', () => {
    const actions = createUndoRedoActions(getSnapshot, applySnapshot);
    expect(actions.undo).toBeDefined();
    expect(actions.redo).toBeDefined();
    expect(actions.canUndo()).toBe(false);
    expect(actions.canRedo()).toBe(false);
  });

  it('should capture and undo snapshot', () => {
    const actions = createUndoRedoActions(getSnapshot, applySnapshot);

    state.count = 1;
    actions._captureSnapshot();
    state.count = 2;
    actions._captureSnapshot();

    expect(actions.canUndo()).toBe(true);
    actions.undo();
    expect(state.count).toBe(1);
  });

  it('should redo after undo', () => {
    const actions = createUndoRedoActions(getSnapshot, applySnapshot);

    state.count = 1;
    actions._captureSnapshot();
    state.count = 2;
    actions._captureSnapshot();

    actions.undo();
    expect(state.count).toBe(1);
    expect(actions.canRedo()).toBe(true);

    actions.redo();
    expect(state.count).toBe(2);
  });

  it('should not undo when history is empty', () => {
    const actions = createUndoRedoActions(getSnapshot, applySnapshot);
    actions.undo(); // should not throw
    expect(state.count).toBe(0);
  });

  it('should not redo when at latest state', () => {
    const actions = createUndoRedoActions(getSnapshot, applySnapshot);
    state.count = 1;
    actions._captureSnapshot();
    actions.redo(); // should not change state
    expect(state.count).toBe(1);
  });

  it('should respect maxDepth', () => {
    const actions = createUndoRedoActions(getSnapshot, applySnapshot, 3);
    for (let i = 1; i <= 5; i++) {
      state.count = i;
      actions._captureSnapshot();
    }
    expect(actions.getHistoryLength()).toBeLessThanOrEqual(3);
  });
});

describe('useUndoRedo', () => {
  it('should return undo/redo/canUndo/canRedo from store', () => {
    const mockStore = {
      getState: () => ({
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: () => true,
        canRedo: () => false,
      }),
    };

    const result = useUndoRedo(mockStore as any);
    expect(result.canUndo).toBe(true);
    expect(result.canRedo).toBe(false);
    expect(typeof result.undo).toBe('function');
    expect(typeof result.redo).toBe('function');
  });

  it('should reflect canUndo=false when no history', () => {
    const mockStore = {
      getState: () => ({
        undo: vi.fn(),
        redo: vi.fn(),
        canUndo: () => false,
        canRedo: () => false,
      }),
    };

    const result = useUndoRedo(mockStore as any);
    expect(result.canUndo).toBe(false);
    expect(result.canRedo).toBe(false);
  });
});
