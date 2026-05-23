/**
 * Batch Operation Engine — Execute multiple operations as a single undoable unit
 * Supports: update, delete, insert, format, protect operations
 */

export interface BatchOperation {
  type: 'update' | 'delete' | 'insert' | 'format' | 'protect';
  targets: string[]; // cell refs like "A1", "B2:B10"
  payload: unknown;
}

interface BatchRecord {
  id: string;
  timestamp: number;
  userId: string;
  operations: BatchOperation[];
  previousValues: Map<string, unknown>;
  newValues: Map<string, unknown>;
}

export interface BatchResult {
  batchId: string;
  success: boolean;
  affectedCells: number;
  errors: Array<{ target: string; error: string }>;
}

export class BatchOperationEngine {
  private static history: BatchRecord[] = [];
  private static undoStack: string[] = [];
  private static redoStack: string[] = [];
  private static maxHistory = 100;

  static execute(operations: BatchOperation[], userId: string): BatchResult {
    const batchId = crypto.randomUUID();
    const previousValues = new Map<string, unknown>();
    const newValues = new Map<string, unknown>();
    const errors: Array<{ target: string; error: string }> = [];
    let affectedCells = 0;

    for (const op of operations) {
      for (const target of op.targets) {
        try {
          // Capture previous value before mutation
          previousValues.set(target, this.getCurrentValue(target));

          switch (op.type) {
            case 'update':
              this.applyUpdate(target, op.payload);
              newValues.set(target, op.payload);
              break;
            case 'delete':
              this.applyDelete(target);
              newValues.set(target, null);
              break;
            case 'insert':
              this.applyInsert(target, op.payload);
              newValues.set(target, op.payload);
              break;
            case 'format':
              this.applyFormat(target, op.payload);
              newValues.set(target, op.payload);
              break;
            case 'protect':
              this.applyProtection(target, op.payload as boolean);
              newValues.set(target, op.payload);
              break;
          }
          affectedCells++;
        } catch (e) {
          errors.push({ target, error: e instanceof Error ? e.message : 'Unknown error' });
        }
      }
    }

    const record: BatchRecord = {
      id: batchId,
      timestamp: Date.now(),
      userId,
      operations,
      previousValues,
      newValues,
    };

    this.history.push(record);
    this.undoStack.push(batchId);
    this.redoStack.length = 0; // Clear redo on new action

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return { batchId, success: errors.length === 0, affectedCells, errors };
  }

  static undo(batchId: string): void {
    const idx = this.undoStack.lastIndexOf(batchId);
    if (idx === -1) return;

    const record = this.history.find((r) => r.id === batchId);
    if (!record) return;

    // Restore previous values
    for (const [target, value] of record.previousValues) {
      this.restoreValue(target, value);
    }

    this.undoStack.splice(idx, 1);
    this.redoStack.push(batchId);
  }

  static redo(batchId: string): void {
    const idx = this.redoStack.lastIndexOf(batchId);
    if (idx === -1) return;

    const record = this.history.find((r) => r.id === batchId);
    if (!record) return;

    // Re-apply new values
    for (const [target, value] of record.newValues) {
      this.restoreValue(target, value);
    }

    this.redoStack.splice(idx, 1);
    this.undoStack.push(batchId);
  }

  static undoLast(): void {
    const last = this.undoStack[this.undoStack.length - 1];
    if (last) this.undo(last);
  }

  static redoLast(): void {
    const last = this.redoStack[this.redoStack.length - 1];
    if (last) this.redo(last);
  }

  static getHistory(): BatchRecord[] {
    return [...this.history];
  }

  static canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  static canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // Internal cell access — delegates to store/engine
  private static getCurrentValue(ref: string): unknown {
    // In production, this reads from the appropriate store
    // For now, return a placeholder
    return undefined;
  }

  private static restoreValue(ref: string, value: unknown): void {
    // In production, this writes to the appropriate store
  }

  private static applyUpdate(ref: string, payload: unknown): void {
    // Apply value update
  }

  private static applyDelete(ref: string): void {
    // Delete cell/row
  }

  private static applyInsert(ref: string, payload: unknown): void {
    // Insert cell/row
  }

  private static applyFormat(ref: string, payload: unknown): void {
    // Apply formatting
  }

  private static applyProtection(ref: string, protect: boolean): void {
    // Toggle cell protection
  }
}
