import { useCallback, useRef, useState } from 'react';
import { useUIStore } from '@/store/uiStore';

interface UndoableOptions<T> {
  action: () => T;
  undo: () => void;
  redo: () => void;
  description: string;
  undoTimeout?: number;
}

interface UndoEntry {
  id: string;
  description: string;
  undo: () => void;
  redo: () => void;
  timer: ReturnType<typeof setTimeout>;
}

export function useUndoableAction() {
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);
  const addToast = useUIStore((s) => s.addToast);
  const entryIdRef = useRef(0);

  const execute = useCallback(
    <T>(options: UndoableOptions<T>): T => {
      const result = options.action();
      const id = `undo-${++entryIdRef.current}`;

      // Clear any existing redo stack on new action
      setRedoStack([]);

      const entry: UndoEntry = {
        id,
        description: options.description,
        undo: options.undo,
        redo: options.redo,
        timer: setTimeout(() => {
          // Auto-expire undo after timeout
          setUndoStack((prev) => prev.filter((e) => e.id !== id));
        }, options.undoTimeout || 10000),
      };

      setUndoStack((prev) => [...prev, entry]);

      addToast({
        type: 'info',
        title: options.description,
        message: 'Press Ctrl+Z to undo',
        duration: 5000,
      });

      return result;
    },
    [addToast]
  );

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      clearTimeout(entry.timer);
      entry.undo();
      setRedoStack((r) => [...r, entry]);
      addToast({
        type: 'info',
        title: `Undone: ${entry.description}`,
        message: 'Press Ctrl+Y to redo',
        duration: 3000,
      });
      return prev.slice(0, -1);
    });
  }, [addToast]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const entry = prev[prev.length - 1];
      entry.redo();
      setUndoStack((u) => [...u, entry]);
      addToast({
        type: 'info',
        title: `Redone: ${entry.description}`,
        message: '',
        duration: 3000,
      });
      return prev.slice(0, -1);
    });
  }, [addToast]);

  return { execute, undo, redo, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 };
}
