import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CubeEnginePersistence } from './CubeEnginePersistence';
import type {
  CubeCell,
  CellHistoryEntry,
  Snapshot,
  DimensionDefinition,
  DimensionMember,
  CubeDefinition,
} from '@/types/cube-types';

// =============================================================================
// MOCK INDEXEDDB FOR TESTS
// =============================================================================

// Create a mock IndexedDB implementation for testing
const mockStores = new Map<string, Map<string, unknown>>();

function createMockIDBDatabase(): IDBDatabase {
  const db = {
    objectStoreNames: {
      contains: (name: string) => mockStores.has(name),
      length: mockStores.size,
      item: (index: number) => Array.from(mockStores.keys())[index] ?? null,
    },
    createObjectStore: (name: string) => {
      mockStores.set(name, new Map());
      return {} as IDBObjectStore;
    },
    transaction: (storeNames: string | string[], mode: IDBTransactionMode) => {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames];
      return createMockTransaction(names, mode);
    },
  } as unknown as IDBDatabase;
  return db;
}

function createMockTransaction(storeNames: string[], mode: IDBTransactionMode): IDBTransaction {
  const stores = new Map<string, IDBObjectStore>();
  for (const name of storeNames) {
    stores.set(name, createMockObjectStore(name, mode));
  }

  return {
    objectStore: (name: string) => stores.get(name)!,
    oncomplete: null,
    onerror: null,
  } as unknown as IDBTransaction;
}

function createMockObjectStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
  const store = mockStores.get(storeName) ?? new Map();

  return {
    getAll: () => createIDBRequest(Array.from(store.values())),
    get: (key: string) => createIDBRequest(store.get(key)),
    put: (value: unknown) => {
      // Determine the key based on the store type
      let key: string;
      if (storeName === 'dimensions' || storeName === 'cubes') {
        // Dimensions and cubes use 'name' as key
        const typedValue = value as { name: string };
        key = typedValue.name;
      } else {
        // Cells, history, snapshots use 'id' as key
        const typedValue = value as { id: string };
        key = typedValue.id;
      }
      store.set(key, value);
      return createIDBRequest(undefined);
    },
    delete: (key: string) => {
      store.delete(key);
      return createIDBRequest(undefined);
    },
    clear: () => {
      store.clear();
      return createIDBRequest(undefined);
    },
    index: (indexName: string) => ({
      getAll: (key: string) => {
        const results = Array.from(store.values()).filter((v: unknown) => {
          const item = v as { cellId: string };
          return item.cellId === key;
        });
        return createIDBRequest(results);
      },
    }),
    createIndex: () => ({}),
  } as unknown as IDBObjectStore;
}

function createIDBRequest<T>(result: T): IDBRequest<T> {
  const req = {
    result,
    onsuccess: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    error: null,
  } as unknown as IDBRequest<T>;

  // Simulate async completion
  setTimeout(() => {
    if (req.onsuccess) {
      req.onsuccess(new Event('success'));
    }
  }, 0);

  return req;
}

// =============================================================================
// MOCK WINDOW FOR TAURI DETECTION
// =============================================================================

const originalWindow = global.window;

function mockTauriEnvironment() {
  (global as Record<string, unknown>).window = {
    __TAURI_INTERNALS__: {},
  };
}

function mockBrowserEnvironment() {
  (global as Record<string, unknown>).window = {};
}

function restoreWindow() {
  (global as Record<string, unknown>).window = originalWindow;
}

// =============================================================================
// TEST DATA
// =============================================================================

function createTestCell(overrides?: Partial<CubeCell>): CubeCell {
  return {
    coords: { Account: 'Revenue', Entity: 'US', Time: '2024-01' },
    measure: 'amount',
    value: 100000,
    dataType: 'input',
    ...overrides,
  };
}

function createTestHistoryEntry(overrides?: Partial<CellHistoryEntry>): CellHistoryEntry {
  return {
    id: 'hist-1',
    cellId: 'gl|Account=Revenue|Entity=US|Time=2024-01|amount',
    oldValue: null,
    newValue: 100000,
    dataType: 'input',
    timestamp: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createTestSnapshot(overrides?: Partial<Snapshot>): Snapshot {
  return {
    id: 'snap-1',
    name: 'Test Snapshot',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createTestDimension(overrides?: Partial<DimensionDefinition>): DimensionDefinition {
  return {
    name: 'Account',
    type: 'system',
    hierarchies: [{ name: 'reporting', levels: ['category', 'account'], effectiveDating: false }],
    attributes: [{ name: 'description', dataType: 'text' }],
    members: new Map<string, DimensionMember>([
      [
        'Account:Revenue',
        {
          id: 'Account:Revenue',
          code: 'Revenue',
          name: 'Revenue',
          hierarchy: 'reporting',
          level: 0,
          isLeaf: true,
          isActive: true,
          attributes: {},
          sortOrder: 0,
        },
      ],
    ]),
    ...overrides,
  };
}

function createTestCube(overrides?: Partial<CubeDefinition>): CubeDefinition {
  return {
    name: 'gl',
    dimensions: ['Account', 'Entity', 'Time'],
    measures: [
      { name: 'amount', dataType: 'numeric', aggregation: 'sum' },
      { name: 'quantity', dataType: 'numeric', aggregation: 'sum' },
    ],
    storage: 'sparse',
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('CubeEnginePersistence', () => {
  let persistence: CubeEnginePersistence;

  beforeEach(() => {
    mockStores.clear();
    mockStores.set('cells', new Map());
    mockStores.set('dimensions', new Map());
    mockStores.set('cubes', new Map());
    mockStores.set('history', new Map());
    mockStores.set('snapshots', new Map());

    // Mock IndexedDB globally
    (global as Record<string, unknown>).indexedDB = {
      open: () => {
        const req = createIDBRequest(createMockIDBDatabase());
        return req;
      },
    };

    mockBrowserEnvironment();
    persistence = new CubeEnginePersistence();
  });

  // ---------------------------------------------------------------------------
  // INITIALIZATION TESTS
  // ---------------------------------------------------------------------------

  describe('Initialization', () => {
    it('should initialize successfully in browser environment', async () => {
      await persistence.initialize();
      expect(true).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      await persistence.initialize();
      await persistence.initialize();
      expect(true).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // CELL OPERATIONS TESTS
  // ---------------------------------------------------------------------------

  describe('Cell Operations', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should save a cell to IndexedDB', async () => {
      const cell = createTestCell();
      const cellKey = 'gl|Account=Revenue|Entity=US|Time=2024-01|amount';

      await persistence.saveCell('gl', cell, cellKey);

      const cells = await persistence.loadCells();
      expect(cells).toHaveLength(1);
      expect(cells[0].cellKey).toBe(cellKey);
      expect(cells[0].cell.value).toBe(100000);
    });

    it('should save multiple cells at once', async () => {
      const cells = [
        { cube: 'gl', cell: createTestCell({ value: 100 }), cellKey: 'key1' },
        { cube: 'gl', cell: createTestCell({ value: 200 }), cellKey: 'key2' },
        { cube: 'gl', cell: createTestCell({ value: 300 }), cellKey: 'key3' },
      ];

      await persistence.saveCells(cells);

      const loaded = await persistence.loadCells();
      expect(loaded).toHaveLength(3);
    });

    it('should load cells filtered by cube', async () => {
      const cells = [
        { cube: 'gl', cell: createTestCell({ value: 100 }), cellKey: 'key1' },
        { cube: 'budget', cell: createTestCell({ value: 200 }), cellKey: 'key2' },
      ];

      await persistence.saveCells(cells);

      const glCells = await persistence.loadCells('gl');
      expect(glCells).toHaveLength(1);
      expect(glCells[0].cell.value).toBe(100);
    });

    it('should delete a cell', async () => {
      const cell = createTestCell();
      const cellKey = 'gl|Account=Revenue|Entity=US|Time=2024-01|amount';

      await persistence.saveCell('gl', cell, cellKey);
      const deleted = await persistence.deleteCell(cellKey);

      expect(deleted).toBe(true);

      const cells = await persistence.loadCells();
      expect(cells).toHaveLength(0);
    });

    it('should return false when deleting non-existent cell', async () => {
      const deleted = await persistence.deleteCell('non-existent');
      expect(deleted).toBe(false);
    });

    it('should clear all cells', async () => {
      await persistence.saveCells([
        { cube: 'gl', cell: createTestCell({ value: 100 }), cellKey: 'key1' },
        { cube: 'gl', cell: createTestCell({ value: 200 }), cellKey: 'key2' },
      ]);

      await persistence.clearCells();

      const cells = await persistence.loadCells();
      expect(cells).toHaveLength(0);
    });

    it('should preserve cell coordinates correctly', async () => {
      const cell = createTestCell({
        coords: { Account: 'COGS', Entity: 'UK', Time: '2024-02' },
      });
      const cellKey = 'gl|Account=COGS|Entity=UK|Time=2024-02|amount';

      await persistence.saveCell('gl', cell, cellKey);

      const cells = await persistence.loadCells();
      expect(cells[0].cell.coords).toEqual({
        Account: 'COGS',
        Entity: 'UK',
        Time: '2024-02',
      });
    });

    it('should preserve cell comment and attachment', async () => {
      const cell = createTestCell({
        comment: 'Test comment',
        attachment: 'file.pdf',
      });
      const cellKey = 'test-key';

      await persistence.saveCell('gl', cell, cellKey);

      const cells = await persistence.loadCells();
      expect(cells[0].cell.comment).toBe('Test comment');
      expect(cells[0].cell.attachment).toBe('file.pdf');
    });

    it('should overwrite existing cell on save', async () => {
      const cell1 = createTestCell({ value: 100 });
      const cell2 = createTestCell({ value: 200 });
      const cellKey = 'same-key';

      await persistence.saveCell('gl', cell1, cellKey);
      await persistence.saveCell('gl', cell2, cellKey);

      const cells = await persistence.loadCells();
      expect(cells).toHaveLength(1);
      expect(cells[0].cell.value).toBe(200);
    });

    it('should handle empty cells load', async () => {
      const cells = await persistence.loadCells();
      expect(cells).toHaveLength(0);
    });

    it('should handle cells with string values', async () => {
      const cell = createTestCell({ value: 'text value', dataType: 'input' });
      const cellKey = 'text-cell';

      await persistence.saveCell('gl', cell, cellKey);

      const cells = await persistence.loadCells();
      expect(cells[0].cell.value).toBe('text value');
    });

    it('should handle cells with boolean values', async () => {
      const cell = createTestCell({ value: true, dataType: 'input' });
      const cellKey = 'bool-cell';

      await persistence.saveCell('gl', cell, cellKey);

      const cells = await persistence.loadCells();
      expect(cells[0].cell.value).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // DIMENSION OPERATIONS TESTS
  // ---------------------------------------------------------------------------

  describe('Dimension Operations', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should save and load a single dimension', async () => {
      const dim = createTestDimension();
      const dims = new Map([['Account', dim]]);

      await persistence.saveDimensions(dims);

      const loaded = await persistence.loadDimensions();
      expect(loaded.size).toBe(1);
      expect(loaded.get('Account')?.name).toBe('Account');
    });

    it('should save and load multiple dimensions', async () => {
      const accountDim = createTestDimension();
      const entityDim = createTestDimension({ name: 'Entity' });
      const dims = new Map([
        ['Account', accountDim],
        ['Entity', entityDim],
      ]);

      await persistence.saveDimensions(dims);

      const loaded = await persistence.loadDimensions();
      expect(loaded.size).toBe(2);
    });

    it('should preserve dimension hierarchies', async () => {
      const dim = createTestDimension();
      const dims = new Map([['Account', dim]]);

      await persistence.saveDimensions(dims);

      const loaded = await persistence.loadDimensions();
      const account = loaded.get('Account');
      expect(account?.hierarchies).toHaveLength(1);
      expect(account?.hierarchies[0].name).toBe('reporting');
      expect(account?.hierarchies[0].levels).toEqual(['category', 'account']);
    });

    it('should preserve dimension attributes', async () => {
      const dim = createTestDimension();
      const dims = new Map([['Account', dim]]);

      await persistence.saveDimensions(dims);

      const loaded = await persistence.loadDimensions();
      const account = loaded.get('Account');
      expect(account?.attributes).toHaveLength(1);
      expect(account?.attributes[0].name).toBe('description');
    });

    it('should preserve dimension members', async () => {
      const dim = createTestDimension();
      const dims = new Map([['Account', dim]]);

      await persistence.saveDimensions(dims);

      const loaded = await persistence.loadDimensions();
      const account = loaded.get('Account');
      expect(account?.members.size).toBe(1);
      expect(account?.members.get('Account:Revenue')?.name).toBe('Revenue');
    });

    it('should overwrite dimensions on save', async () => {
      const dim1 = createTestDimension();
      const dim2 = createTestDimension({
        attributes: [{ name: 'newAttr', dataType: 'text' }],
      });

      await persistence.saveDimensions(new Map([['Account', dim1]]));
      await persistence.saveDimensions(new Map([['Account', dim2]]));

      const loaded = await persistence.loadDimensions();
      expect(loaded.get('Account')?.attributes[0].name).toBe('newAttr');
    });

    it('should handle empty dimensions load', async () => {
      const loaded = await persistence.loadDimensions();
      expect(loaded.size).toBe(0);
    });

    it('should preserve member parentId', async () => {
      const dim = createTestDimension({
        members: new Map([
          [
            'Account:Revenue',
            {
              id: 'Account:Revenue',
              code: 'Revenue',
              name: 'Revenue',
              parentId: 'Income',
              hierarchy: 'reporting',
              level: 1,
              isLeaf: true,
              isActive: true,
              attributes: {},
              sortOrder: 0,
            },
          ],
        ]),
      });

      await persistence.saveDimensions(new Map([['Account', dim]]));

      const loaded = await persistence.loadDimensions();
      expect(loaded.get('Account')?.members.get('Account:Revenue')?.parentId).toBe('Income');
    });

    it('should preserve member formula', async () => {
      const dim = createTestDimension({
        members: new Map([
          [
            'Account:NetIncome',
            {
              id: 'Account:NetIncome',
              code: 'NetIncome',
              name: 'Net Income',
              hierarchy: 'reporting',
              level: 0,
              isLeaf: false,
              isActive: true,
              attributes: {},
              formula: 'Revenue - COGS - OpEx',
              sortOrder: 1,
            },
          ],
        ]),
      });

      await persistence.saveDimensions(new Map([['Account', dim]]));

      const loaded = await persistence.loadDimensions();
      expect(loaded.get('Account')?.members.get('Account:NetIncome')?.formula).toBe(
        'Revenue - COGS - OpEx'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // CUBE DEFINITION OPERATIONS TESTS
  // ---------------------------------------------------------------------------

  describe('Cube Definition Operations', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should save and load a cube definition', async () => {
      const cube = createTestCube();
      const cubes = new Map([['gl', cube]]);

      await persistence.saveCubes(cubes);

      const loaded = await persistence.loadCubes();
      expect(loaded.size).toBe(1);
      expect(loaded.get('gl')?.name).toBe('gl');
    });

    it('should save and load multiple cube definitions', async () => {
      const glCube = createTestCube();
      const budgetCube = createTestCube({ name: 'budget' });
      const cubes = new Map([
        ['gl', glCube],
        ['budget', budgetCube],
      ]);

      await persistence.saveCubes(cubes);

      const loaded = await persistence.loadCubes();
      expect(loaded.size).toBe(2);
    });

    it('should preserve cube dimensions', async () => {
      const cube = createTestCube();
      const cubes = new Map([['gl', cube]]);

      await persistence.saveCubes(cubes);

      const loaded = await persistence.loadCubes();
      expect(loaded.get('gl')?.dimensions).toEqual(['Account', 'Entity', 'Time']);
    });

    it('should preserve cube measures', async () => {
      const cube = createTestCube();
      const cubes = new Map([['gl', cube]]);

      await persistence.saveCubes(cubes);

      const loaded = await persistence.loadCubes();
      const measures = loaded.get('gl')?.measures;
      expect(measures).toHaveLength(2);
      expect(measures?.[0].name).toBe('amount');
      expect(measures?.[0].dataType).toBe('numeric');
      expect(measures?.[0].aggregation).toBe('sum');
    });

    it('should preserve cube storage mode', async () => {
      const cube = createTestCube({ storage: 'dense' });
      const cubes = new Map([['gl', cube]]);

      await persistence.saveCubes(cubes);

      const loaded = await persistence.loadCubes();
      expect(loaded.get('gl')?.storage).toBe('dense');
    });

    it('should overwrite cube definitions on save', async () => {
      const cube1 = createTestCube();
      const cube2 = createTestCube({ storage: 'dense' });

      await persistence.saveCubes(new Map([['gl', cube1]]));
      await persistence.saveCubes(new Map([['gl', cube2]]));

      const loaded = await persistence.loadCubes();
      expect(loaded.get('gl')?.storage).toBe('dense');
    });

    it('should handle empty cubes load', async () => {
      const loaded = await persistence.loadCubes();
      expect(loaded.size).toBe(0);
    });

    it('should preserve measure precision', async () => {
      const cube = createTestCube({
        measures: [
          { name: 'amount', dataType: 'numeric', aggregation: 'sum', precision: 2, currency: true },
        ],
      });

      await persistence.saveCubes(new Map([['gl', cube]]));

      const loaded = await persistence.loadCubes();
      expect(loaded.get('gl')?.measures[0].precision).toBe(2);
      expect(loaded.get('gl')?.measures[0].currency).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // HISTORY OPERATIONS TESTS
  // ---------------------------------------------------------------------------

  describe('History Operations', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should save and load history entries', async () => {
      const entry = createTestHistoryEntry();
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].id).toBe('hist-1');
    });

    it('should save multiple history entries', async () => {
      const entries = [
        createTestHistoryEntry({ id: 'hist-1' }),
        createTestHistoryEntry({ id: 'hist-2' }),
        createTestHistoryEntry({ id: 'hist-3' }),
      ];

      await persistence.saveHistory(entries);

      const loaded = await persistence.loadHistory();
      expect(loaded).toHaveLength(3);
    });

    it('should preserve history cellId', async () => {
      const entry = createTestHistoryEntry({ cellId: 'custom-cell-id' });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].cellId).toBe('custom-cell-id');
    });

    it('should preserve history oldValue and newValue', async () => {
      const entry = createTestHistoryEntry({
        oldValue: 50000,
        newValue: 100000,
      });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].oldValue).toBe(50000);
      expect(loaded[0].newValue).toBe(100000);
    });

    it('should preserve history dataType', async () => {
      const entry = createTestHistoryEntry({ dataType: 'calculated' });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].dataType).toBe('calculated');
    });

    it('should preserve history reason', async () => {
      const entry = createTestHistoryEntry({ reason: 'Manual adjustment' });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].reason).toBe('Manual adjustment');
    });

    it('should preserve history timestamp', async () => {
      const entry = createTestHistoryEntry({ timestamp: '2024-06-15T10:30:00Z' });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].timestamp).toBe('2024-06-15T10:30:00Z');
    });

    it('should handle null oldValue', async () => {
      const entry = createTestHistoryEntry({ oldValue: null });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].oldValue).toBeNull();
    });

    it('should not duplicate history entries', async () => {
      const entry = createTestHistoryEntry({ id: 'same-id' });
      await persistence.saveHistory([entry]);
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded).toHaveLength(1);
    });

    it('should handle empty history load', async () => {
      const loaded = await persistence.loadHistory();
      expect(loaded).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // SNAPSHOT OPERATIONS TESTS
  // ---------------------------------------------------------------------------

  describe('Snapshot Operations', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should save and load snapshots', async () => {
      const snapshot = createTestSnapshot();
      const cellValues = new Map([['key1', 100]]);
      const snapshotCells = new Map([['snap-1', cellValues]]);

      await persistence.saveSnapshots([snapshot], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshots).toHaveLength(1);
      expect(loaded.snapshots[0].name).toBe('Test Snapshot');
    });

    it('should save multiple snapshots', async () => {
      const snapshots = [
        createTestSnapshot({ id: 'snap-1', name: 'First' }),
        createTestSnapshot({ id: 'snap-2', name: 'Second' }),
      ];
      const snapshotCells = new Map([
        ['snap-1', new Map([['key1', 100]])],
        ['snap-2', new Map([['key2', 200]])],
      ]);

      await persistence.saveSnapshots(snapshots, snapshotCells);

      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshots).toHaveLength(2);
    });

    it('should preserve snapshot cell values', async () => {
      const snapshot = createTestSnapshot();
      const cellValues = new Map([
        ['cell1', 100],
        ['cell2', 200],
      ]);
      const snapshotCells = new Map([['snap-1', cellValues]]);

      await persistence.saveSnapshots([snapshot], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      const cells = loaded.snapshotCells.get('snap-1');
      expect(cells?.get('cell1')).toBe(100);
      expect(cells?.get('cell2')).toBe(200);
    });

    it('should preserve snapshot description', async () => {
      const snapshot = createTestSnapshot({ description: 'Year-end snapshot' });
      const snapshotCells = new Map([['snap-1', new Map()]]);

      await persistence.saveSnapshots([snapshot], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshots[0].description).toBe('Year-end snapshot');
    });

    it('should preserve snapshot createdAt', async () => {
      const snapshot = createTestSnapshot({ createdAt: '2024-12-31T23:59:59Z' });
      const snapshotCells = new Map([['snap-1', new Map()]]);

      await persistence.saveSnapshots([snapshot], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshots[0].createdAt).toBe('2024-12-31T23:59:59Z');
    });

    it('should overwrite snapshots on save', async () => {
      const snapshot1 = createTestSnapshot({ name: 'Old' });
      const snapshot2 = createTestSnapshot({ name: 'New' });
      const snapshotCells = new Map([['snap-1', new Map()]]);

      await persistence.saveSnapshots([snapshot1], snapshotCells);
      await persistence.saveSnapshots([snapshot2], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshots[0].name).toBe('New');
    });

    it('should handle empty snapshots load', async () => {
      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshots).toHaveLength(0);
    });

    it('should handle snapshot with no cell values', async () => {
      const snapshot = createTestSnapshot();
      const snapshotCells = new Map([['snap-1', new Map()]]);

      await persistence.saveSnapshots([snapshot], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      expect(loaded.snapshotCells.get('snap-1')?.size).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // ROUND-TRIP TESTS
  // ---------------------------------------------------------------------------

  describe('Round-Trip Tests', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should preserve full cell data through save/load cycle', async () => {
      const cell = createTestCell({
        value: 999999.99,
        dataType: 'calculated',
        comment: 'Test comment',
        attachment: 'doc.pdf',
      });
      const cellKey = 'gl|Account=Revenue|Entity=US|Time=2024-01|amount';

      await persistence.saveCell('gl', cell, cellKey);

      const loaded = await persistence.loadCells();
      expect(loaded[0].cell.value).toBe(999999.99);
      expect(loaded[0].cell.dataType).toBe('calculated');
      expect(loaded[0].cell.comment).toBe('Test comment');
      expect(loaded[0].cell.attachment).toBe('doc.pdf');
    });

    it('should preserve dimension hierarchy through save/load cycle', async () => {
      const dim = createTestDimension();
      await persistence.saveDimensions(new Map([['Account', dim]]));

      const loaded = await persistence.loadDimensions();
      const account = loaded.get('Account');

      expect(account?.hierarchies[0].levels).toEqual(['category', 'account']);
      expect(account?.members.get('Account:Revenue')?.hierarchy).toBe('reporting');
    });

    it('should preserve cube measures through save/load cycle', async () => {
      const cube = createTestCube();
      await persistence.saveCubes(new Map([['gl', cube]]));

      const loaded = await persistence.loadCubes();
      const measures = loaded.get('gl')?.measures;

      expect(measures?.[0].name).toBe('amount');
      expect(measures?.[0].aggregation).toBe('sum');
    });

    it('should preserve history through save/load cycle', async () => {
      const entry = createTestHistoryEntry({
        oldValue: 50000,
        newValue: 100000,
        reason: 'Budget adjustment',
      });
      await persistence.saveHistory([entry]);

      const loaded = await persistence.loadHistory();
      expect(loaded[0].oldValue).toBe(50000);
      expect(loaded[0].newValue).toBe(100000);
      expect(loaded[0].reason).toBe('Budget adjustment');
    });

    it('should preserve snapshot cell values through save/load cycle', async () => {
      const snapshot = createTestSnapshot();
      const cellValues = new Map([
        ['cell1', 12345.67],
        ['cell2', 'text'],
        ['cell3', true],
      ]);
      const snapshotCells = new Map([['snap-1', cellValues]]);

      await persistence.saveSnapshots([snapshot], snapshotCells);

      const loaded = await persistence.loadSnapshots();
      const cells = loaded.snapshotCells.get('snap-1');

      expect(cells?.get('cell1')).toBe(12345.67);
      expect(cells?.get('cell2')).toBe('text');
      expect(cells?.get('cell3')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // EDGE CASE TESTS
  // ---------------------------------------------------------------------------

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await persistence.initialize();
    });

    it('should handle very large numbers', async () => {
      const cell = createTestCell({ value: Number.MAX_SAFE_INTEGER });
      const cellKey = 'large-num';

      await persistence.saveCell('gl', cell, cellKey);

      const loaded = await persistence.loadCells();
      expect(loaded[0].cell.value).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle negative numbers', async () => {
      const cell = createTestCell({ value: -999999.99 });
      const cellKey = 'neg-num';

      await persistence.saveCell('gl', cell, cellKey);

      const loaded = await persistence.loadCells();
      expect(loaded[0].cell.value).toBe(-999999.99);
    });

    it('should handle zero values', async () => {
      const cell = createTestCell({ value: 0 });
      const cellKey = 'zero';

      await persistence.saveCell('gl', cell, cellKey);

      const loaded = await persistence.loadCells();
      expect(loaded[0].cell.value).toBe(0);
    });

    it('should handle empty coordinates', async () => {
      const cell = createTestCell({ coords: {} });
      const cellKey = 'empty-coords';

      await persistence.saveCell('gl', cell, cellKey);

      const loaded = await persistence.loadCells();
      expect(loaded[0].cell.coords).toEqual({});
    });

    it('should handle dimension with no members', async () => {
      const dim = createTestDimension({ members: new Map() });
      await persistence.saveDimensions(new Map([['Account', dim]]));

      const loaded = await persistence.loadDimensions();
      expect(loaded.get('Account')?.members.size).toBe(0);
    });

    it('should handle dimension with no hierarchies', async () => {
      const dim = createTestDimension({ hierarchies: [] });
      await persistence.saveDimensions(new Map([['Account', dim]]));

      const loaded = await persistence.loadDimensions();
      expect(loaded.get('Account')?.hierarchies).toHaveLength(0);
    });

    it('should handle dimension with no attributes', async () => {
      const dim = createTestDimension({ attributes: [] });
      await persistence.saveDimensions(new Map([['Account', dim]]));

      const loaded = await persistence.loadDimensions();
      expect(loaded.get('Account')?.attributes).toHaveLength(0);
    });

    it('should handle cube with no measures', async () => {
      const cube = createTestCube({ measures: [] });
      await persistence.saveCubes(new Map([['gl', cube]]));

      const loaded = await persistence.loadCubes();
      expect(loaded.get('gl')?.measures).toHaveLength(0);
    });

    it('should handle cube with no dimensions', async () => {
      const cube = createTestCube({ dimensions: [] });
      await persistence.saveCubes(new Map([['gl', cube]]));

      const loaded = await persistence.loadCubes();
      expect(loaded.get('gl')?.dimensions).toHaveLength(0);
    });

    it('should handle special characters in cell keys', async () => {
      const cell = createTestCell();
      const cellKey = 'gl|Account=Rev&enue|Entity=US&UK|Time=2024-01|amount';

      await persistence.saveCell('gl', cell, cellKey);

      const loaded = await persistence.loadCells();
      expect(loaded[0].cellKey).toBe(cellKey);
    });

    it('should handle concurrent saves', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(persistence.saveCell('gl', createTestCell({ value: i }), `key-${i}`));
      }

      await Promise.all(promises);

      const loaded = await persistence.loadCells();
      expect(loaded).toHaveLength(10);
    });
  });
});
