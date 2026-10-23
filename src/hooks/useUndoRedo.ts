import { UndoRedoEngine } from '@/engines/UndoRedoEngine';

/**
 * Undo/redo state snapshot type.
 * Each store defines what fields to capture.
 */
export type UndoableState = Record<string, unknown>;

/**
 * Undo/redo actions injected into a Zustand store.
 */
export interface UndoRedoActions<T extends UndoableState> {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistoryLength: () => number;
  _undoEngine: UndoRedoEngine<T>;
  _captureSnapshot: () => void;
}

/**
 * Creates undo/redo actions for a Zustand store.
 *
 * @param getSnapshot - Extracts the undoable portion of store state
 * @param applySnapshot - Applies a snapshot back to the store (calls set)
 * @param maxDepth - Maximum history depth (default: 100)
 */
export function createUndoRedoActions<T extends UndoableState>(
  getSnapshot: () => T,
  applySnapshot: (snapshot: T) => void,
  maxDepth: number = 100
): UndoRedoActions<T> {
  const engine = new UndoRedoEngine<T>(maxDepth);

  return {
    _undoEngine: engine,

    _captureSnapshot: () => {
      const snapshot = getSnapshot();
      engine.push(snapshot);
    },

    undo: () => {
      const snapshot = engine.undo();
      if (snapshot !== null) {
        applySnapshot(snapshot);
      }
    },

    redo: () => {
      const snapshot = engine.redo();
      if (snapshot !== null) {
        applySnapshot(snapshot);
      }
    },

    canUndo: () => engine.canUndo(),
    canRedo: () => engine.canRedo(),
    getHistoryLength: () => engine.getHistoryLength(),
  };
}

/**
 * Hook to consume undo/redo from any store that has the actions.
 *
 * Usage:
 * ```ts
 * const { undo, redo, canUndo, canRedo } = useUndoRedo(useMyStore);
 * ```
 */
export function useUndoRedo<
  T extends {
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
  },
>(store: { getState: () => T }) {
  const state = store.getState();
  return {
    undo: state.undo,
    redo: state.redo,
    canUndo: state.canUndo(),
    canRedo: state.canRedo(),
  };
}
