/**
 * UndoRedoEngine — Cross-store undo/redo with persistence and history
 */

interface UndoAction {
  id: string;
  storeKey: string;
  action: string;
  data: unknown;
  timestamp: number;
  userId?: string;
}

interface UndoRedoSnapshot {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
}

export class UndoRedoEngine<T = unknown> {
  private static undoStack: UndoAction[] = [];
  private static redoStack: UndoAction[] = [];
  private static maxDepth = 100;
  private static listeners: Array<(action: UndoAction | null, type: 'undo' | 'redo') => void> = [];

  // Instance state for generic usage
  private instanceUndoStack: T[] = [];
  private instanceRedoStack: T[] = [];
  private instanceMaxDepth: number;

  constructor(maxDepth: number = 100) {
    this.instanceMaxDepth = maxDepth;
  }

  push(snapshot: T): void {
    this.instanceUndoStack.push(JSON.parse(JSON.stringify(snapshot)));
    this.instanceRedoStack = [];
    if (this.instanceUndoStack.length > this.instanceMaxDepth) {
      this.instanceUndoStack.shift();
    }
  }

  undo(): T | null {
    if (this.instanceUndoStack.length === 0) return null;
    const snapshot = this.instanceUndoStack.pop()!;
    this.instanceRedoStack.push(snapshot);
    return JSON.parse(JSON.stringify(snapshot));
  }

  redo(): T | null {
    if (this.instanceRedoStack.length === 0) return null;
    const snapshot = this.instanceRedoStack.pop()!;
    this.instanceUndoStack.push(snapshot);
    return JSON.parse(JSON.stringify(snapshot));
  }

  canUndo(): boolean {
    return this.instanceUndoStack.length > 0;
  }

  canRedo(): boolean {
    return this.instanceRedoStack.length > 0;
  }

  getHistoryLength(): number {
    return this.instanceUndoStack.length;
  }

  /**
   * Push action to undo stack
   */
  static pushAction(storeKey: string, action: string, data: unknown, userId?: string): void {
    const entry: UndoAction = {
      id: `undo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      storeKey,
      action,
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      userId,
    };

    this.undoStack.push(entry);
    this.redoStack = []; // Clear redo on new action

    // Enforce memory limit
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  /**
   * Undo last action (optionally per-store)
   */
  static undo(storeKey?: string): UndoAction | null {
    let idx = this.undoStack.length - 1;

    if (storeKey) {
      // Find last action for this store
      for (let i = this.undoStack.length - 1; i >= 0; i--) {
        if (this.undoStack[i].storeKey === storeKey) {
          idx = i;
          break;
        }
      }
      if (idx < 0 || this.undoStack[idx].storeKey !== storeKey) return null;
    }

    if (this.undoStack.length === 0) return null;

    const action = this.undoStack.splice(idx, 1)[0];
    this.redoStack.push(action);

    this.notifyListeners(action, 'undo');
    return action;
  }

  /**
   * Redo last undone action
   */
  static redo(storeKey?: string): UndoAction | null {
    if (this.redoStack.length === 0) return null;

    let action: UndoAction;
    if (storeKey) {
      const idx = this.redoStack.findLastIndex((a) => a.storeKey === storeKey);
      if (idx < 0) return null;
      action = this.redoStack.splice(idx, 1)[0];
    } else {
      action = this.redoStack.pop()!;
    }

    this.undoStack.push(action);
    this.notifyListeners(action, 'redo');
    return action;
  }

  /**
   * Get full history with timestamps
   */
  static getHistory(): UndoAction[] {
    return [...this.undoStack].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get undo stack
   */
  static getUndoStack(): UndoAction[] {
    return [...this.undoStack];
  }

  /**
   * Get redo stack
   */
  static getRedoStack(): UndoAction[] {
    return [...this.redoStack];
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Undo to specific action
   */
  static undoToAction(actionId: string): UndoAction[] {
    const undone: UndoAction[] = [];
    while (this.undoStack.length > 0) {
      const last = this.undoStack[this.undoStack.length - 1];
      if (last.id === actionId) break;
      const action = this.undo()!;
      if (action) undone.push(action);
    }
    return undone;
  }

  /**
   * Persist history to localStorage
   */
  static persistHistory(): void {
    const snapshot: UndoRedoSnapshot = {
      undoStack: this.undoStack,
      redoStack: this.redoStack,
    };
    try {
      localStorage.setItem('finplan-undo-redo', JSON.stringify(snapshot));
    } catch {
      // Storage full — clear old entries
      this.undoStack = this.undoStack.slice(-20);
      this.redoStack = this.redoStack.slice(-20);
      localStorage.setItem(
        'finplan-undo-redo',
        JSON.stringify({
          undoStack: this.undoStack,
          redoStack: this.redoStack,
        })
      );
    }
  }

  /**
   * Restore history from localStorage
   */
  static restoreHistory(): boolean {
    try {
      const stored = localStorage.getItem('finplan-undo-redo');
      if (!stored) return false;
      const snapshot = JSON.parse(stored) as UndoRedoSnapshot;
      this.undoStack = snapshot.undoStack ?? [];
      this.redoStack = snapshot.redoStack ?? [];
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Subscribe to undo/redo events
   */
  static subscribe(
    listener: (action: UndoAction | null, type: 'undo' | 'redo') => void
  ): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Check if can undo
   */
  static canUndo(storeKey?: string): boolean {
    if (storeKey) return this.undoStack.some((a) => a.storeKey === storeKey);
    return this.undoStack.length > 0;
  }

  /**
   * Check if can redo
   */
  static canRedo(storeKey?: string): boolean {
    if (storeKey) return this.redoStack.some((a) => a.storeKey === storeKey);
    return this.redoStack.length > 0;
  }

  private static notifyListeners(action: UndoAction | null, type: 'undo' | 'redo'): void {
    for (const listener of this.listeners) {
      listener(action, type);
    }
  }
}
