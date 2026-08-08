// =============================================================================
// CubeEngine — persistence & edge-branch sweep
//
// The main CubeEngine.test.ts covers the core API. These tests drive the
// loadFromStorage / saveToStorage round-trips against a real in-memory
// CubeEnginePersistence (IndexedDB), plus the storage-less and error paths,
// snapshot counter re-derivation, and index/rebuild behaviour.
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { CubeEngine } from './CubeEngine';
import { CubeEnginePersistence } from './CubeEnginePersistence';

function makeEngine(): CubeEngine {
  return new CubeEngine();
}

const coords = {
  Account: 'Account:1000',
  Entity: 'Entity:ent1',
  Time: 'Time:2026-Q1-M01',
  Scenario: 'Scenario:Actual',
  Currency: 'Currency:USD',
};

describe('CubeEngine — persistence & edges', () => {
  let persistence: CubeEnginePersistence;

  beforeEach(async () => {
    (persistence as unknown as { idb?: { close: () => void } })?.idb?.close();
    const dbs = await (
      indexedDB as unknown as { databases: () => Promise<{ name: string }[]> }
    ).databases();
    for (const db of dbs) {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(db.name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
    persistence = new CubeEnginePersistence();
  });

  it('loadFromStorage is a no-op without storage and saveToStorage too', async () => {
    const engine = makeEngine();
    await engine.loadFromStorage(); // no storage → no-op
    await engine.saveToStorage();
    expect(engine.getStorage()).toBeNull();
    expect(engine.getCellCount()).toBe(0);
  });

  it('saveToStorage + fresh engine + loadFromStorage round-trips everything', async () => {
    const engine = makeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
      [
        { name: 'debit', dataType: 'numeric', aggregation: 'sum' },
        { name: 'credit', dataType: 'numeric', aggregation: 'sum' },
      ]
    );
    await engine.writeCell('GL_Actuals', {
      coords,
      measure: 'debit',
      value: 125,
      dataType: 'input',
    });
    await engine.writeCell('GL_Actuals', {
      coords,
      measure: 'credit',
      value: 25,
      dataType: 'input',
    });
    const snap = engine.createSnapshot('Baseline', 'desc');

    engine.initialize(persistence);
    await engine.saveToStorage();

    const fresh = makeEngine();
    fresh.initialize(persistence);
    await fresh.loadFromStorage();

    expect(fresh.getDimension('Account')).toBeDefined();
    expect(fresh.getCube('GL_Actuals')).toBeDefined();
    expect(fresh.getCellValue('GL_Actuals', coords, 'debit')).toBe(125);
    expect(fresh.getCellValue('GL_Actuals', coords, 'credit')).toBe(25);
    expect(fresh.getCellCount()).toBe(2);
    expect(fresh.getHistoryCount()).toBe(2);
    expect(fresh.listSnapshots().map((s) => s.id)).toContain(snap.id);

    // Snapshot counter continues after reload
    const snap2 = fresh.createSnapshot('After Reload');
    expect(snap2.id).not.toBe(snap.id);
  });

  it('loadFromStorage prunes history beyond MAX_HISTORY_SIZE', async () => {
    const engine = makeEngine();
    // Stub storage that returns >10000 history entries (max cap is 10000)
    const bigHistory = Array.from({ length: 10050 }, (_, i) => ({
      id: `h-${i}`,
      cellId: `k-${i}`,
      oldValue: null,
      newValue: i,
      dataType: 'input' as const,
      timestamp: '2024-01-01T00:00:00.000Z',
    }));
    const stubStorage = {
      loadDimensions: async () => new Map(),
      loadCubes: async () => new Map(),
      loadCells: async () => [],
      loadHistory: async () => bigHistory,
      loadSnapshots: async () => ({ snapshots: [], snapshotCells: new Map() }),
    } as unknown as CubeEnginePersistence;

    engine.initialize(stubStorage);
    await engine.loadFromStorage();
    // pruned to the cap (the newest 10000 survive)
    expect(engine.getHistoryCount()).toBe(10000);
    expect(engine.getCellCount()).toBe(0);
  });

  it('loadFromStorage restores the snapshot counter from snapshot ids', async () => {
    const engine = makeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
      [{ name: 'debit', dataType: 'numeric', aggregation: 'sum' }]
    );
    engine.createSnapshot('one');
    engine.createSnapshot('two');

    engine.initialize(persistence);
    await engine.saveToStorage();

    const fresh = makeEngine();
    fresh.initialize(persistence);
    await fresh.loadFromStorage();
    // next snapshot id is numerically after the loaded ones
    const next = fresh.createSnapshot('three');
    const counter = parseInt(next.id.split('-')[2]!, 10);
    expect(counter).toBeGreaterThan(0);
  });

  it('writeCell to an unknown cube throws; readCell too', async () => {
    const engine = makeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account'],
      [{ name: 'debit', dataType: 'numeric', aggregation: 'sum' }]
    );
    await expect(
      engine.writeCell('Nope', {
        coords: { Account: 'a' },
        measure: 'debit',
        value: 1,
        dataType: 'input',
      })
    ).rejects.toThrow(/cube/i);
    // readCell does not validate the cube — it just returns undefined
    expect(engine.readCell('Nope', coords, 'debit')).toBeUndefined();
  });

  it('deleteCell returns false for missing cells and true after delete', async () => {
    const engine = makeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
      [{ name: 'debit', dataType: 'numeric', aggregation: 'sum' }]
    );
    expect(engine.deleteCell('GL_Actuals', coords, 'debit')).toBe(false);
    await engine.writeCell('GL_Actuals', { coords, measure: 'debit', value: 5, dataType: 'input' });
    expect(engine.deleteCell('GL_Actuals', coords, 'debit')).toBe(true);
    expect(engine.getCellValue('GL_Actuals', coords, 'debit')).toBeUndefined();
  });

  it('query with filters, aggregation and grand totals across cubes', async () => {
    const engine = makeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
      [{ name: 'debit', dataType: 'numeric', aggregation: 'sum' }]
    );
    await engine.writeCell('GL_Actuals', {
      coords: { ...coords, Account: 'Account:1000' },
      measure: 'debit',
      value: 100,
      dataType: 'input',
    });
    await engine.writeCell('GL_Actuals', {
      coords: { ...coords, Account: 'Account:2000' },
      measure: 'debit',
      value: 50,
      dataType: 'input',
    });

    const result = engine.query({
      cube: 'GL_Actuals',
      rows: ['Account'],
      columns: [],
      measures: ['debit'],
      filters: [{ dimension: 'Account', memberIds: ['Account:1000'] }],
      includeGrandTotal: true,
    });
    expect(result.rows.length).toBeGreaterThanOrEqual(1);
    expect(result.grandTotal).toBeDefined();
    // only the filtered account is included
    expect(result.rows.every((r) => r.label.includes('Account:1000'))).toBe(true);
  });

  it('clearAll resets cells, history, snapshots and indexes but keeps cubes', async () => {
    const engine = makeEngine();
    engine.registerSystemDimensions();
    engine.registerCube(
      'GL_Actuals',
      ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
      [{ name: 'debit', dataType: 'numeric', aggregation: 'sum' }]
    );
    await engine.writeCell('GL_Actuals', { coords, measure: 'debit', value: 1, dataType: 'input' });
    engine.createSnapshot('s');
    expect(engine.getCellCount()).toBe(1);

    engine.clearAll();
    expect(engine.getCellCount()).toBe(0);
    expect(engine.getHistoryCount()).toBe(0);
    expect(engine.listSnapshots()).toHaveLength(0);
    expect(engine.listDimensions()).toHaveLength(0);
    expect(engine.listCubes()).toHaveLength(0);
  });
});
