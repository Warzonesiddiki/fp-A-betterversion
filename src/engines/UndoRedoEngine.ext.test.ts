import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UndoRedoEngine } from './UndoRedoEngine';

// Mock storage adapter for persist/restore tests.
let store: Record<string, string> = {};
vi.mock('@/utils/storageAdapter', () => ({
  storageGet: (k: string) => (k in store ? store[k] : null),
  storageSet: (k: string, v: string) => {
    store[k] = v;
  },
  storageRemove: (k: string) => {
    delete store[k];
  },
}));

describe('UndoRedoEngine — extended coverage', () => {
  beforeEach(() => {
    UndoRedoEngine.clearHistory();
    store = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('static API (cross-store)', () => {
    it('undo() returns null when stack is empty', () => {
      expect(UndoRedoEngine.undo()).toBeNull();
    });

    it('redo() returns null when redo stack is empty', () => {
      expect(UndoRedoEngine.redo()).toBeNull();
    });

    it('redo() with unknown storeKey returns null', () => {
      UndoRedoEngine.pushAction('a', 'x', 1);
      expect(UndoRedoEngine.redo('missing')).toBeNull();
    });

    it('undo() filters by storeKey finding the right action', () => {
      UndoRedoEngine.pushAction('budget', 'add', { v: 1 });
      UndoRedoEngine.pushAction('forecast', 'update', { v: 2 });
      UndoRedoEngine.pushAction('budget', 'edit', { v: 3 });
      const a = UndoRedoEngine.undo('forecast');
      expect(a).toBeDefined();
      expect(a!.storeKey).toBe('forecast');
      expect(a!.action).toBe('update');
    });

    it('undo() with storeKey that does not exist returns null', () => {
      UndoRedoEngine.pushAction('budget', 'add', { v: 1 });
      expect(UndoRedoEngine.undo('missing')).toBeNull();
    });

    it('redo() filters by storeKey', () => {
      UndoRedoEngine.pushAction('budget', 'add', { v: 1 });
      UndoRedoEngine.pushAction('forecast', 'update', { v: 2 });
      UndoRedoEngine.undo('budget');
      UndoRedoEngine.undo('forecast');
      const r = UndoRedoEngine.redo('budget');
      expect(r).toBeDefined();
      expect(r!.storeKey).toBe('budget');
    });

    it('clears redo stack when a new action is pushed', () => {
      UndoRedoEngine.pushAction('budget', 'add', { v: 1 });
      UndoRedoEngine.undo();
      expect(UndoRedoEngine.getRedoStack()).toHaveLength(1);
      UndoRedoEngine.pushAction('budget', 'add', { v: 2 });
      expect(UndoRedoEngine.getRedoStack()).toHaveLength(0);
    });

    it('enforces maxDepth by shifting oldest entry', () => {
      for (let i = 0; i < 150; i++) {
        UndoRedoEngine.pushAction('budget', 'add', { v: i });
      }
      const stack = UndoRedoEngine.getUndoStack();
      expect(stack.length).toBe(100);
      // The first remaining entry should have v=50
      expect((stack[0]!.data as { v: number }).v).toBe(50);
    });

    it('getHistory returns entries sorted by timestamp desc', () => {
      UndoRedoEngine.pushAction('a', 'x', 1);
      UndoRedoEngine.pushAction('b', 'y', 2);
      const hist = UndoRedoEngine.getHistory();
      expect(hist).toHaveLength(2);
      expect(hist[0]!.timestamp).toBeGreaterThanOrEqual(hist[1]!.timestamp);
    });

    it('getUndoStack/getRedoStack return copies', () => {
      UndoRedoEngine.pushAction('a', 'x', 1);
      const us = UndoRedoEngine.getUndoStack();
      us.pop();
      expect(UndoRedoEngine.getUndoStack()).toHaveLength(1);
    });

    it('undoToAction stops at matching id', () => {
      UndoRedoEngine.pushAction('a', 'x', 1);
      UndoRedoEngine.pushAction('a', 'x', 2);
      const target = UndoRedoEngine.getUndoStack()[0]!;
      UndoRedoEngine.pushAction('a', 'x', 3);
      const undone = UndoRedoEngine.undoToAction(target.id);
      expect(undone.length).toBe(2); // items at idx 1 and 2 were undone
      expect(UndoRedoEngine.getUndoStack().length).toBe(1);
      expect(UndoRedoEngine.getUndoStack()[0]!.id).toBe(target.id);
    });

    it('persistHistory round-trips via storage adapter', () => {
      UndoRedoEngine.pushAction('budget', 'add', { v: 42 }, 'user-1');
      UndoRedoEngine.pushAction('fcst', 'upd', { v: 7 });
      UndoRedoEngine.undo(); // moves one to redo
      UndoRedoEngine.persistHistory();
      expect(store['undo-redo']).toBeTruthy();

      UndoRedoEngine.clearHistory();
      expect(UndoRedoEngine.getUndoStack()).toHaveLength(0);
      const ok = UndoRedoEngine.restoreHistory();
      expect(ok).toBe(true);
      expect(UndoRedoEngine.getUndoStack()).toHaveLength(1);
      expect(UndoRedoEngine.getRedoStack()).toHaveLength(1);
    });

    it('restoreHistory returns false with no stored value and on parse failure', () => {
      expect(UndoRedoEngine.restoreHistory()).toBe(false);
      store['undo-redo'] = '{ invalid json';
      expect(UndoRedoEngine.restoreHistory()).toBe(false);
    });

    it('subscribe fires listeners on undo and redo and unsubscribes', () => {
      const events: Array<{ type: string; action: unknown }> = [];
      const unsub = UndoRedoEngine.subscribe((action, type) => {
        events.push({ type, action: action?.action });
      });
      UndoRedoEngine.pushAction('budget', 'add', 1);
      UndoRedoEngine.undo();
      UndoRedoEngine.redo();
      expect(events).toHaveLength(2);
      expect(events[0]!.type).toBe('undo');
      expect(events[1]!.type).toBe('redo');
      unsub();
      UndoRedoEngine.undo();
      expect(events).toHaveLength(2);
    });

    it('canUndo/canRedo static filters by storeKey', () => {
      expect(UndoRedoEngine.canUndo()).toBe(false);
      expect(UndoRedoEngine.canRedo()).toBe(false);
      UndoRedoEngine.pushAction('budget', 'add', 1);
      expect(UndoRedoEngine.canUndo('budget')).toBe(true);
      expect(UndoRedoEngine.canUndo('other')).toBe(false);
      expect(UndoRedoEngine.canRedo('budget')).toBe(false);
      UndoRedoEngine.undo('budget');
      expect(UndoRedoEngine.canUndo('budget')).toBe(false);
      expect(UndoRedoEngine.canRedo('budget')).toBe(true);
      expect(UndoRedoEngine.canRedo('other')).toBe(false);
    });

    it('deep clones data so mutations do not leak into history', () => {
      const obj: { nested: { v: number } } = { nested: { v: 1 } };
      UndoRedoEngine.pushAction('a', 'x', obj);
      obj.nested.v = 999;
      const h = UndoRedoEngine.getUndoStack()[0]!;
      expect((h.data as { nested: { v: number } }).nested.v).toBe(1);
    });
  });

  describe('instance API (generic)', () => {
    it('push/undo/redo cycle with deep cloning', () => {
      const eng = new UndoRedoEngine<{ a: number }>();
      expect(eng.canUndo()).toBe(false);
      expect(eng.canRedo()).toBe(false);
      expect(eng.undo()).toBeNull();
      expect(eng.redo()).toBeNull();
      eng.push({ a: 1 });
      eng.push({ a: 2 });
      expect(eng.getHistoryLength()).toBe(2);
      expect(eng.canUndo()).toBe(true);
      const u1 = eng.undo();
      expect(u1).toEqual({ a: 2 });
      expect(eng.canRedo()).toBe(true);
      // redo pushes to undo
      const r1 = eng.redo();
      expect(r1).toEqual({ a: 2 });
      expect(eng.canRedo()).toBe(false);
    });

    it('clears redo stack on new push', () => {
      const eng = new UndoRedoEngine<number>();
      eng.push(1);
      eng.push(2);
      eng.undo();
      expect(eng.canRedo()).toBe(true);
      eng.push(3);
      expect(eng.canRedo()).toBe(false);
    });

    it('enforces instance maxDepth by shifting oldest', () => {
      const eng = new UndoRedoEngine<number>(5);
      for (let i = 0; i < 10; i++) eng.push(i);
      expect(eng.getHistoryLength()).toBe(5);
      // undo returns most recent (9,8,...), oldest remaining is 5
      const u = eng.undo();
      expect(u).toBe(9);
    });

    it('mutations on returned snapshots do not corrupt internal state', () => {
      const eng = new UndoRedoEngine<{ list: number[] }>();
      const snap = { list: [1, 2, 3] };
      eng.push(snap);
      const out = eng.undo()!;
      out.list.push(99);
      const again = eng.redo()!;
      eng.undo();
      expect(again.list).toEqual([1, 2, 3]);
    });
  });
});
