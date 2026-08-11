import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CubeEnginePersistence } from './CubeEnginePersistence';
import type {
  CubeCell,
  CellHistoryEntry,
  DimensionDefinition,
  CubeDefinition,
  Snapshot,
} from '@/types/cube-types';

/**
 * F-05 browser-beta hardening: when IndexedDB is unavailable (jsdom, private
 * browsing, restricted webviews) CubeEnginePersistence must fall back to an
 * in-memory backend instead of crashing on an undefined `indexedDB`
 * reference. jsdom has no IndexedDB, so the default environment exercises the
 * memory backend directly.
 */

const WINDOW_ANY = window as unknown as Record<string, unknown>;

function makeCell(overrides: Partial<CubeCell> = {}): CubeCell {
  return {
    coords: { A: '1' },
    measure: 'amount',
    value: 100,
    dataType: 'number',
    ...overrides,
  };
}

describe('CubeEnginePersistence in-memory fallback (no IndexedDB)', () => {
  let persistence: CubeEnginePersistence;

  beforeEach(() => {
    // jsdom has no indexedDB by default; make sure no mock leaks in.
    delete (globalThis as Record<string, unknown>).indexedDB;
    persistence = new CubeEnginePersistence();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).indexedDB;
  });

  it('initializes without IndexedDB', async () => {
    await expect(persistence.initialize()).resolves.toBeUndefined();
  });

  it('round-trips cells', async () => {
    await persistence.initialize();
    await persistence.saveCell('cube1', makeCell({ value: 42 }), 'cell-1');

    const loaded = await persistence.loadCells('cube1');
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.cellKey).toBe('cell-1');
    expect(loaded[0]!.cell.value).toBe(42);

    const loadedAll = await persistence.loadCells();
    expect(loadedAll).toHaveLength(1);

    expect(await persistence.deleteCell('cell-1')).toBe(true);
    expect(await persistence.deleteCell('cell-1')).toBe(false);
    expect(await persistence.loadCells()).toHaveLength(0);
  });

  it('round-trips dimensions', async () => {
    await persistence.initialize();
    const dims = new Map<string, DimensionDefinition>();
    dims.set('region', {
      name: 'region',
      type: 'system',
      hierarchies: [{ name: 'h', levels: ['All', 'Country'] }],
      attributes: [],
      members: new Map([
        [
          'm1',
          {
            id: 'm1',
            code: 'US',
            name: 'United States',
            hierarchy: 'h',
            level: 1,
            isLeaf: true,
            isActive: true,
            attributes: {},
            sortOrder: 0,
          },
        ],
      ]),
    });
    await persistence.saveDimensions(dims);

    const loaded = await persistence.loadDimensions();
    expect(loaded.size).toBe(1);
    expect(loaded.get('region')?.members.get('m1')?.code).toBe('US');
  });

  it('round-trips cube definitions', async () => {
    await persistence.initialize();
    const cubes = new Map<string, CubeDefinition>();
    cubes.set('cube1', {
      name: 'cube1',
      dimensions: ['region'],
      measures: [{ name: 'amount', dataType: 'number', precision: 2, aggregation: 'sum' }],
      storage: 'sparse',
    });
    await persistence.saveCubes(cubes);

    const loaded = await persistence.loadCubes();
    expect(loaded.get('cube1')?.measures[0]?.name).toBe('amount');
  });

  it('round-trips history', async () => {
    await persistence.initialize();
    const history: CellHistoryEntry[] = [
      {
        id: 'h1',
        cellId: 'cell-1',
        oldValue: 1,
        newValue: 2,
        dataType: 'number',
        reason: 'edit',
        timestamp: '2026-08-11T00:00:00.000Z',
      },
    ];
    await persistence.saveHistory(history);

    const loaded = await persistence.loadHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.newValue).toBe(2);
    expect(loaded[0]!.dataType).toBe('number');
  });

  it('round-trips snapshots with cell values', async () => {
    await persistence.initialize();
    const snapshots: Snapshot[] = [
      { id: 's1', name: 'Q3 snapshot', createdAt: '2026-08-11', description: 'draft' },
    ];
    const snapshotCells = new Map<string, Map<string, unknown>>();
    snapshotCells.set('s1', new Map([['A1|amount', 123]]));
    await persistence.saveSnapshots(snapshots, snapshotCells);

    const { snapshots: loadedSnaps, snapshotCells: loadedCells } =
      await persistence.loadSnapshots();
    expect(loadedSnaps).toHaveLength(1);
    expect(loadedSnaps[0]!.name).toBe('Q3 snapshot');
    expect(loadedCells.get('s1')?.get('A1|amount')).toBe(123);
  });

  it('falls back to memory when IndexedDB exists but open fails', async () => {
    (globalThis as Record<string, unknown>).indexedDB = {
      open: () => {
        throw new Error('SecurityError: IndexedDB unavailable');
      },
    };
    await persistence.initialize();
    await persistence.saveCell('cube1', makeCell(), 'cell-1');
    expect(await persistence.loadCells()).toHaveLength(1);
  });

  it('never attempts Tauri paths in a browser', async () => {
    delete WINDOW_ANY.__TAURI_INTERNALS__;
    delete WINDOW_ANY.__TAURI__;
    await persistence.initialize();
    await persistence.saveCell('cube1', makeCell(), 'cell-1');
    expect(await persistence.loadCells()).toHaveLength(1);
    expect(WINDOW_ANY.__TAURI_INTERNALS__).toBeUndefined();
  });
});
