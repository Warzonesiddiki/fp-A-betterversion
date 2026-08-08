import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CubeEnginePersistence } from './CubeEnginePersistence';

// ---------------------------------------------------------------------------
// Fake @tauri-apps/plugin-sql database (in-memory, mimics the SQL used by the
// persistence layer so the Tauri branch of CubeEnginePersistence is covered).
// ---------------------------------------------------------------------------

const dbMock = vi.hoisted(() => {
  type Row = Record<string, unknown>;
  const tables: Record<string, Map<string, Row>> = {
    cube_cells: new Map(),
    cube_dimensions: new Map(),
    cube_definitions: new Map(),
    cube_history: new Map(),
    cube_snapshots: new Map(),
  };

  const execute = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('CREATE TABLE IF NOT EXISTS')) return;
    if (sql.includes('CREATE INDEX IF NOT EXISTS')) return;

    if (sql.includes('INSERT INTO cube_cells')) {
      const [id, cube, coords, measure, value, dataType, comment, attachment] = params;
      tables.cube_cells.set(String(id), {
        id: String(id),
        cube: String(cube),
        coords: String(coords),
        measure: String(measure),
        value: String(value),
        data_type: String(dataType),
        dataType: String(dataType),
        comment: comment ?? null,
        attachment: attachment ?? null,
      });
      return;
    }
    if (sql.includes('INSERT INTO cube_dimensions')) {
      const [name, data] = params;
      tables.cube_dimensions.set(String(name), { name: String(name), data: String(data) });
      return;
    }
    if (sql.includes('INSERT INTO cube_definitions')) {
      const [name, data] = params;
      tables.cube_definitions.set(String(name), { name: String(name), data: String(data) });
      return;
    }
    if (sql.includes('INSERT OR IGNORE INTO cube_history')) {
      const [id, cellId, oldValue, newValue, dataType, reason, timestamp] = params;
      if (!tables.cube_history.has(String(id))) {
        tables.cube_history.set(String(id), {
          id: String(id),
          cellId: String(cellId),
          old_value: oldValue,
          oldValue,
          new_value: String(newValue),
          newValue: String(newValue),
          data_type: String(dataType),
          dataType: String(dataType),
          reason: reason ?? null,
          timestamp: String(timestamp),
        });
      }
      return;
    }
    if (sql.includes('INSERT INTO cube_snapshots')) {
      const [id, name, createdAt, description, cellValues] = params;
      tables.cube_snapshots.set(String(id), {
        id: String(id),
        name: String(name),
        createdAt: String(createdAt),
        description: description ?? null,
        cell_values: String(cellValues),
        cellValues: String(cellValues),
      });
      return;
    }
    if (sql.includes('DELETE FROM cube_cells WHERE id')) {
      tables.cube_cells.delete(String(params[0]));
      return;
    }
    if (sql.includes('DELETE FROM cube_cells')) {
      tables.cube_cells.clear();
      return;
    }
  });

  const select = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('COUNT(*) as count FROM cube_cells WHERE id')) {
      return [{ count: tables.cube_cells.has(String(params[0])) ? 1 : 0 }];
    }
    if (sql.includes('FROM cube_cells WHERE cube')) {
      return [...tables.cube_cells.values()].filter((r) => r.cube === String(params[0]));
    }
    if (sql.includes('FROM cube_cells')) return [...tables.cube_cells.values()];
    if (sql.includes('FROM cube_dimensions')) return [...tables.cube_dimensions.values()];
    if (sql.includes('FROM cube_definitions')) return [...tables.cube_definitions.values()];
    if (sql.includes('FROM cube_history')) {
      return [...tables.cube_history.values()].sort((a, b) =>
        String(a.timestamp).localeCompare(String(b.timestamp))
      );
    }
    if (sql.includes('FROM cube_snapshots')) {
      return [...tables.cube_snapshots.values()].sort((a, b) =>
        String(a.createdAt).localeCompare(String(b.createdAt))
      );
    }
    return [];
  });

  return { execute, select, tables };
});

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: { load: vi.fn().mockResolvedValue({ execute: dbMock.execute, select: dbMock.select }) },
}));

const cell = (over: Record<string, unknown> = {}) => ({
  coords: { Account: '1000', Period: 'Jan' },
  measure: 'debit',
  value: 100,
  dataType: 'input',
  ...over,
});

describe('CubeEnginePersistence (Tauri backend)', () => {
  beforeEach(() => {
    for (const t of Object.values(dbMock.tables)) t.clear();
    dbMock.execute.mockClear();
    dbMock.select.mockClear();
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
    delete (window as unknown as Record<string, unknown>).__TAURI__;
  });

  it('initialize creates the Tauri schema tables', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();

    const sqls = dbMock.execute.mock.calls.map((c) => String(c[0]));
    expect(sqls.filter((s) => s.includes('CREATE TABLE IF NOT EXISTS cube_cells'))).toHaveLength(1);
    expect(
      sqls.filter((s) => s.includes('CREATE TABLE IF NOT EXISTS cube_dimensions'))
    ).toHaveLength(1);
    expect(
      sqls.filter((s) => s.includes('CREATE TABLE IF NOT EXISTS cube_definitions'))
    ).toHaveLength(1);
    expect(sqls.filter((s) => s.includes('CREATE TABLE IF NOT EXISTS cube_history'))).toHaveLength(
      1
    );
    expect(
      sqls.filter((s) => s.includes('CREATE TABLE IF NOT EXISTS cube_snapshots'))
    ).toHaveLength(1);
    expect(sqls.some((s) => s.includes('CREATE INDEX IF NOT EXISTS'))).toBe(true);
  });

  it('saveCell upserts and loadCells filters by cube', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();

    await persistence.saveCell('GL_Actuals', cell({ value: 42, comment: 'c' }), 't1');
    await persistence.saveCell('GL_Budget', cell({ value: 7 }), 't2');

    const all = await persistence.loadCells();
    expect(all).toHaveLength(2);
    expect(all.find((r) => r.cellKey === 't1')!.cell.measure).toBe('debit');
    expect(all.find((r) => r.cellKey === 't1')!.cell.comment).toBe('c');

    const filtered = await persistence.loadCells('GL_Budget');
    expect(filtered.map((r) => r.cellKey)).toEqual(['t2']);
  });

  it('saveCells batch persists through the tauri path', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.saveCells([
      { cube: 'GL_Actuals', cell: cell({ value: 1 }), cellKey: 'b1' },
      { cube: 'GL_Actuals', cell: cell({ value: 2 }), cellKey: 'b2' },
    ]);
    expect((await persistence.loadCells()).map((r) => r.cellKey)).toEqual(['b1', 'b2']);
  });

  it('deleteCell checks existence then deletes', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();
    expect(await persistence.deleteCell('missing')).toBe(false);

    await persistence.saveCell('GL_Actuals', cell({ value: 1 }), 'd1');
    expect(await persistence.deleteCell('d1')).toBe(true);
    expect(await persistence.loadCells()).toHaveLength(0);
  });

  it('clearCells deletes all rows from cube_cells', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();
    await persistence.saveCell('GL_Actuals', cell({ value: 1 }), 'c1');
    await persistence.clearCells();
    expect(await persistence.loadCells()).toHaveLength(0);
  });

  it('round-trips dimensions through the tauri tables', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();
    await persistence.saveDimensions(
      new Map([
        [
          'Account',
          {
            name: 'Account',
            type: 'standard',
            hierarchies: [{ name: 'default', levels: ['Root'], effectiveDating: false }],
            attributes: [{ name: 'ccy', dataType: 'string', defaultValue: 'USD' }],
            members: new Map([
              [
                'm1',
                {
                  id: 'm1',
                  code: 'm1',
                  name: 'M1',
                  parentId: null,
                  hierarchy: 'default',
                  level: 0,
                  isLeaf: true,
                  isActive: true,
                  attributes: {},
                  formula: null,
                  effectiveStart: null,
                  effectiveEnd: null,
                  sortOrder: 0,
                },
              ],
            ]),
          },
        ],
      ])
    );

    const loaded = await persistence.loadDimensions();
    expect(loaded.size).toBe(1);
    const dim = loaded.get('Account')!;
    expect(dim.hierarchies[0]!.levels).toEqual(['Root']);
    expect(dim.members.get('m1')!.name).toBe('M1');
  });

  it('round-trips cube definitions through the tauri tables', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();
    await persistence.saveCubes(
      new Map([
        [
          'GL_Actuals',
          {
            name: 'GL_Actuals',
            dimensions: ['Account'],
            measures: [{ name: 'debit', dataType: 'numeric', precision: 2, aggregation: 'sum' }],
            storage: 'default',
          },
        ],
      ])
    );
    const loaded = await persistence.loadCubes();
    expect(loaded.get('GL_Actuals')!.measures[0]!.aggregation).toBe('sum');
  });

  it('round-trips history entries through the tauri tables', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();
    await persistence.saveHistory([
      {
        id: 'h1',
        cellId: 'c1',
        oldValue: 10,
        newValue: 20,
        dataType: 'input',
        reason: 'r',
        timestamp: '2024-01-01T00:00:00Z',
      },
      {
        id: 'h2',
        cellId: 'c2',
        oldValue: null,
        newValue: 30,
        dataType: 'imported',
        timestamp: '2024-01-02T00:00:00Z',
      },
    ]);
    const history = await persistence.loadHistory();
    expect(history).toHaveLength(2);
    // Tauri rows carry values as JSON strings (stored via JSON.stringify)
    expect(history[0]).toMatchObject({ id: 'h1', oldValue: '10', newValue: '20', reason: 'r' });
    expect(history[1]).toMatchObject({ oldValue: null, newValue: '30' });
  });

  it('round-trips snapshots through the tauri tables', async () => {
    const persistence = new CubeEnginePersistence();
    await persistence.initialize();
    await persistence.saveSnapshots(
      [{ id: 's1', name: 'Snap', createdAt: '2024-01-01T00:00:00Z', description: 'd' }],
      new Map([['s1', new Map([['k1', 99]])]])
    );
    const { snapshots, snapshotCells } = await persistence.loadSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({ name: 'Snap', description: 'd' });
    expect(snapshotCells.has('s1')).toBe(true);
  });
});
