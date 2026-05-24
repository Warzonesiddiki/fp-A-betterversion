import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GridOfflineEngine } from './GridOfflineEngine';

function createMockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

let mockLocalStorage = createMockLocalStorage();

beforeEach(() => {
  mockLocalStorage = createMockLocalStorage();
  vi.stubGlobal('localStorage', mockLocalStorage);
  const pending = GridOfflineEngine.getPendingChanges();
  if (pending.length > 0) {
    GridOfflineEngine.markSynced(pending.map((c) => c.id));
    GridOfflineEngine.cleanup(0);
  }
});

describe('GridOfflineEngine', () => {
  describe('saveGridState / loadGridState', () => {
    it('should save and load grid state', () => {
      const state = {
        columnWidths: { A: 100, B: 150 },
        columnOrder: ['A', 'B'],
        columnVisibility: { A: true, B: true },
        sortModel: [],
        filterModel: {},
        pinnedColumns: {},
        rowHeights: {},
      };
      GridOfflineEngine.saveGridState('grid-1', state);
      const loaded = GridOfflineEngine.loadGridState('grid-1');
      expect(loaded).toEqual(state);
    });

    it('should overwrite existing state', () => {
      const state1 = {
        columnWidths: { A: 100 },
        columnOrder: ['A'],
        columnVisibility: { A: true },
        sortModel: [],
        filterModel: {},
        pinnedColumns: {},
        rowHeights: {},
      };
      const state2 = {
        columnWidths: { A: 200 },
        columnOrder: ['A'],
        columnVisibility: { A: true },
        sortModel: [],
        filterModel: {},
        pinnedColumns: {},
        rowHeights: {},
      };
      GridOfflineEngine.saveGridState('grid-2', state1);
      GridOfflineEngine.saveGridState('grid-2', state2);
      const loaded = GridOfflineEngine.loadGridState('grid-2');
      expect(loaded?.columnWidths.A).toBe(200);
    });

    it('should return null for non-existent grid', () => {
      expect(GridOfflineEngine.loadGridState('nonexistent')).toBeNull();
    });
  });

  describe('trackChange / getPendingChanges', () => {
    it('should track cell changes', () => {
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'A',
        oldValue: '',
        newValue: '100',
        userId: 'user-1',
      });
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'B',
        oldValue: '',
        newValue: '200',
        userId: 'user-1',
      });
      const changes = GridOfflineEngine.getPendingChanges();
      expect(changes).toHaveLength(2);
    });

    it('should track changes across multiple grids', () => {
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'A',
        oldValue: '',
        newValue: '100',
        userId: 'user-1',
      });
      GridOfflineEngine.trackChange({
        tableId: 'grid-2',
        rowId: '0',
        columnId: 'A',
        oldValue: '',
        newValue: '200',
        userId: 'user-1',
      });
      const changes = GridOfflineEngine.getPendingChanges();
      expect(changes.filter((c) => c.tableId === 'grid-1')).toHaveLength(1);
      expect(changes.filter((c) => c.tableId === 'grid-2')).toHaveLength(1);
    });
  });

  describe('markSynced', () => {
    it('should mark changes as synced', () => {
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'A',
        oldValue: '',
        newValue: '100',
        userId: 'user-1',
      });
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'B',
        oldValue: '',
        newValue: '200',
        userId: 'user-1',
      });
      const pending = GridOfflineEngine.getPendingChanges();
      GridOfflineEngine.markSynced(pending.map((c) => c.id));
      expect(GridOfflineEngine.getPendingChanges()).toHaveLength(0);
    });
  });

  describe('getConflicts', () => {
    it('should detect local-wins conflict', () => {
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'A',
        oldValue: '',
        newValue: '100',
        userId: 'user-1',
      });
      const serverChanges = [
        {
          id: 's1',
          tableId: 'grid-1',
          rowId: '0',
          columnId: 'A',
          oldValue: '',
          newValue: '50',
          timestamp: Date.now() - 10000,
          userId: 'user-2',
          synced: true,
        },
      ];
      const conflicts = GridOfflineEngine.getConflicts(serverChanges);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].resolution).toBe('local');
    });
  });

  describe('cleanup', () => {
    it('should remove synced changes older than retention period', () => {
      GridOfflineEngine.trackChange({
        tableId: 'grid-1',
        rowId: '0',
        columnId: 'A',
        oldValue: '',
        newValue: '100',
        userId: 'user-1',
      });
      const pending = GridOfflineEngine.getPendingChanges();
      GridOfflineEngine.markSynced(pending.map((c) => c.id));
      const removed = GridOfflineEngine.cleanup(0);
      expect(removed).toBe(1);
      expect(GridOfflineEngine.getPendingChanges()).toHaveLength(0);
    });
  });
});
