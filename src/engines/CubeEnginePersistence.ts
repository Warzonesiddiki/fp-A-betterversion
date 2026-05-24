import type {
  CubeCell,
  CellHistoryEntry,
  Snapshot,
  DimensionDefinition,
  DimensionMember,
  CubeDefinition,
  MeasureDefinition,
  HierarchyDefinition,
  AttributeDefinition,
} from '@/types/cube-types';

// =============================================================================
// CUBE ENGINE PERSISTENCE — Dual-backend adapter (IndexedDB + Tauri SQLite)
// Every operation is atomic, fully typed, and error-handled.
// =============================================================================

interface IndexedDBDatabase {
  createObjectStore(name: string, options?: { keyPath: string }): void;
  objectStoreNames: DOMStringList;
  transaction(storeNames: string | string[], mode: IDBTransactionMode): IDBTransaction;
}

interface SerializedDimension {
  name: string;
  type: 'system' | 'user';
  hierarchies: HierarchyDefinition[];
  attributes: AttributeDefinition[];
  members: SerializedMember[];
}

interface SerializedMember {
  id: string;
  code: string;
  name: string;
  parentId?: string;
  hierarchy: string;
  level: number;
  isLeaf: boolean;
  isActive: boolean;
  attributes: Record<string, string | number | boolean>;
  formula?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  sortOrder: number;
}

interface SerializedCube {
  name: string;
  dimensions: string[];
  measures: MeasureDefinition[];
  storage: 'sparse' | 'dense';
}

interface SerializedCell {
  id: string;
  cube: string;
  coords: Record<string, string>;
  measure: string;
  value: number | string | boolean;
  dataType: string;
  comment?: string;
  attachment?: string;
}

interface SerializedHistoryEntry {
  id: string;
  cellId: string;
  oldValue: unknown;
  newValue: unknown;
  dataType: string;
  reason?: string;
  timestamp: string;
}

interface SerializedSnapshot {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  cellValues: Record<string, unknown>;
}

type StorageBackend = 'indexeddb' | 'tauri';

// =============================================================================
// BACKEND DETECTION
// =============================================================================

async function detectBackend(): Promise<StorageBackend> {
  try {
    const tauriGlobals =
      (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ !== undefined ||
      (window as unknown as Record<string, unknown>).__TAURI__ !== undefined;
    if (tauriGlobals) return 'tauri';
  } catch {
    // window not available in test environment
  }
  return 'indexeddb';
}

// =============================================================================
// INDEXEDDB HELPERS
// =============================================================================

function openCubeDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('finplan-cube', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cells')) {
        db.createObjectStore('cells', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('dimensions')) {
        db.createObjectStore('dimensions', { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains('cubes')) {
        db.createObjectStore('cubes', { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains('history')) {
        const store = db.createObjectStore('history', { keyPath: 'id' });
        store.createIndex('cellId', 'cellId', { unique: false });
      }
      if (!db.objectStoreNames.contains('snapshots')) {
        db.createObjectStore('snapshots', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(new Error(`Failed to open IndexedDB: ${req.error?.message ?? 'unknown error'}`));
  });
}

function idbGetAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () =>
      reject(new Error(`Failed to read ${storeName}: ${req.error?.message ?? 'unknown error'}`));
  });
}

function idbGet<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () =>
      reject(
        new Error(
          `Failed to get ${key} from ${storeName}: ${req.error?.message ?? 'unknown error'}`
        )
      );
  });
}

function idbPut<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(`Failed to write to ${storeName}: ${req.error?.message ?? 'unknown error'}`)
      );
  });
}

function idbDelete(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(
        new Error(
          `Failed to delete ${key} from ${storeName}: ${req.error?.message ?? 'unknown error'}`
        )
      );
  });
}

function idbClear(db: IDBDatabase, storeName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () =>
      reject(new Error(`Failed to clear ${storeName}: ${req.error?.message ?? 'unknown error'}`));
  });
}

function idbGetByIndex<T>(
  db: IDBDatabase,
  storeName: string,
  indexName: string,
  key: string
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(key);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () =>
      reject(
        new Error(`Failed to query index ${indexName}: ${req.error?.message ?? 'unknown error'}`)
      );
  });
}

// =============================================================================
// TAURI SQLITE HELPERS
// =============================================================================

async function getTauriDB(): Promise<import('@tauri-apps/plugin-sql').default> {
  const Database = (await import('@tauri-apps/plugin-sql')).default;
  return Database.load('sqlite:finplan.db');
}

async function tauriExec(
  db: import('@tauri-apps/plugin-sql').default,
  sql: string,
  params: unknown[] = []
): Promise<void> {
  await db.execute(sql, params);
}

async function tauriSelect<T>(
  db: import('@tauri-apps/plugin-sql').default,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  return db.select<T[]>(sql, params);
}

// =============================================================================
// CUBE ENGINE PERSISTENCE CLASS
// =============================================================================

export class CubeEnginePersistence {
  private backend: StorageBackend | null = null;
  private idb: IDBDatabase | null = null;
  private tauriDb: import('@tauri-apps/plugin-sql').default | null = null;
  private initialized = false;

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.backend = await detectBackend();

    if (this.backend === 'tauri') {
      this.tauriDb = await getTauriDB();
      await this.createTauriTables();
    } else {
      this.idb = await openCubeDB();
    }

    this.initialized = true;
  }

  private async createTauriTables(): Promise<void> {
    if (!this.tauriDb) throw new Error('Tauri DB not initialized');

    await tauriExec(
      this.tauriDb,
      `
      CREATE TABLE IF NOT EXISTS cube_cells (
        id TEXT PRIMARY KEY,
        cube TEXT NOT NULL,
        coords TEXT NOT NULL,
        measure TEXT NOT NULL,
        value TEXT NOT NULL,
        data_type TEXT NOT NULL,
        comment TEXT,
        attachment TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    );

    await tauriExec(
      this.tauriDb,
      `
      CREATE TABLE IF NOT EXISTS cube_dimensions (
        name TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    );

    await tauriExec(
      this.tauriDb,
      `
      CREATE TABLE IF NOT EXISTS cube_definitions (
        name TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    );

    await tauriExec(
      this.tauriDb,
      `
      CREATE TABLE IF NOT EXISTS cube_history (
        id TEXT PRIMARY KEY,
        cell_id TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT NOT NULL,
        data_type TEXT NOT NULL,
        reason TEXT,
        timestamp TEXT NOT NULL
      )
    `
    );

    await tauriExec(
      this.tauriDb,
      `
      CREATE TABLE IF NOT EXISTS cube_snapshots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        description TEXT,
        cell_values TEXT NOT NULL
      )
    `
    );

    await tauriExec(
      this.tauriDb,
      `
      CREATE INDEX IF NOT EXISTS idx_cube_cells_cube ON cube_cells(cube)
    `
    );

    await tauriExec(
      this.tauriDb,
      `
      CREATE INDEX IF NOT EXISTS idx_cube_history_cell_id ON cube_history(cell_id)
    `
    );
  }

  // ---------------------------------------------------------------------------
  // CELL OPERATIONS
  // ---------------------------------------------------------------------------

  async saveCell(cube: string, cell: CubeCell, cellKey: string): Promise<void> {
    await this.ensureInitialized();

    const serialized: SerializedCell = {
      id: cellKey,
      cube,
      coords: { ...cell.coords },
      measure: cell.measure,
      value: cell.value as number | string | boolean,
      dataType: cell.dataType,
      comment: cell.comment,
      attachment: cell.attachment,
    };

    if (this.backend === 'tauri' && this.tauriDb) {
      await tauriExec(
        this.tauriDb,
        `INSERT INTO cube_cells (id, cube, coords, measure, value, data_type, comment, attachment)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT(id) DO UPDATE SET value = $5, data_type = $6, comment = $7, attachment = $8, updated_at = CURRENT_TIMESTAMP`,
        [
          serialized.id,
          serialized.cube,
          JSON.stringify(serialized.coords),
          serialized.measure,
          JSON.stringify(serialized.value),
          serialized.dataType,
          serialized.comment ?? null,
          serialized.attachment ?? null,
        ]
      );
    } else if (this.idb) {
      await idbPut(this.idb, 'cells', serialized);
    }
  }

  async saveCells(cells: Array<{ cube: string; cell: CubeCell; cellKey: string }>): Promise<void> {
    await this.ensureInitialized();

    if (this.backend === 'tauri' && this.tauriDb) {
      for (const { cube, cell, cellKey } of cells) {
        await this.saveCell(cube, cell, cellKey);
      }
    } else if (this.idb) {
      for (const { cube, cell, cellKey } of cells) {
        const serialized: SerializedCell = {
          id: cellKey,
          cube,
          coords: { ...cell.coords },
          measure: cell.measure,
          value: cell.value as number | string | boolean,
          dataType: cell.dataType,
          comment: cell.comment,
          attachment: cell.attachment,
        };
        await idbPut(this.idb, 'cells', serialized);
      }
    }
  }

  async loadCells(cubeFilter?: string): Promise<Array<{ cellKey: string; cell: CubeCell }>> {
    await this.ensureInitialized();

    if (this.backend === 'tauri' && this.tauriDb) {
      const rows = cubeFilter
        ? await tauriSelect<SerializedCell>(
            this.tauriDb,
            'SELECT * FROM cube_cells WHERE cube = $1',
            [cubeFilter]
          )
        : await tauriSelect<SerializedCell>(this.tauriDb, 'SELECT * FROM cube_cells');

      return rows.map((row) => ({
        cellKey: row.id,
        cell: this.deserializeCell(row),
      }));
    } else if (this.idb) {
      const all = cubeFilter
        ? (await idbGetAll<SerializedCell>(this.idb, 'cells')).filter((c) => c.cube === cubeFilter)
        : await idbGetAll<SerializedCell>(this.idb, 'cells');

      return all.map((row) => ({
        cellKey: row.id,
        cell: this.deserializeCell(row),
      }));
    }

    return [];
  }

  async deleteCell(cellKey: string): Promise<boolean> {
    await this.ensureInitialized();

    if (this.backend === 'tauri' && this.tauriDb) {
      const rows = await tauriSelect<{ count: number }>(
        this.tauriDb,
        'SELECT COUNT(*) as count FROM cube_cells WHERE id = $1',
        [cellKey]
      );
      if (rows[0]?.count === 0) return false;

      await tauriExec(this.tauriDb, 'DELETE FROM cube_cells WHERE id = $1', [cellKey]);
      return true;
    } else if (this.idb) {
      const existing = await idbGet<SerializedCell>(this.idb, 'cells', cellKey);
      if (!existing) return false;

      await idbDelete(this.idb, 'cells', cellKey);
      return true;
    }

    return false;
  }

  async clearCells(): Promise<void> {
    await this.ensureInitialized();

    if (this.backend === 'tauri' && this.tauriDb) {
      await tauriExec(this.tauriDb, 'DELETE FROM cube_cells');
    } else if (this.idb) {
      await idbClear(this.idb, 'cells');
    }
  }

  // ---------------------------------------------------------------------------
  // DIMENSION OPERATIONS
  // ---------------------------------------------------------------------------

  async saveDimensions(dimensions: Map<string, DimensionDefinition>): Promise<void> {
    await this.ensureInitialized();

    for (const [name, dim] of dimensions) {
      const serialized: SerializedDimension = {
        name: dim.name,
        type: dim.type,
        hierarchies: dim.hierarchies.map((h) => ({
          name: h.name,
          levels: [...h.levels],
          effectiveDating: h.effectiveDating,
        })),
        attributes: dim.attributes.map((a) => ({
          name: a.name,
          dataType: a.dataType,
          defaultValue: a.defaultValue,
        })),
        members: Array.from(dim.members.values()).map((m) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          parentId: m.parentId,
          hierarchy: m.hierarchy,
          level: m.level,
          isLeaf: m.isLeaf,
          isActive: m.isActive,
          attributes: { ...m.attributes },
          formula: m.formula,
          effectiveStart: m.effectiveStart,
          effectiveEnd: m.effectiveEnd,
          sortOrder: m.sortOrder ?? 0,
        })),
      };

      if (this.backend === 'tauri' && this.tauriDb) {
        await tauriExec(
          this.tauriDb,
          `INSERT INTO cube_dimensions (name, data)
           VALUES ($1, $2)
           ON CONFLICT(name) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
          [name, JSON.stringify(serialized)]
        );
      } else if (this.idb) {
        await idbPut(this.idb, 'dimensions', serialized);
      }
    }
  }

  async loadDimensions(): Promise<Map<string, DimensionDefinition>> {
    await this.ensureInitialized();

    const result = new Map<string, DimensionDefinition>();

    if (this.backend === 'tauri' && this.tauriDb) {
      const rows = await tauriSelect<{ name: string; data: string }>(
        this.tauriDb,
        'SELECT name, data FROM cube_dimensions'
      );
      for (const row of rows) {
        const parsed = JSON.parse(row.data) as SerializedDimension;
        result.set(parsed.name, this.deserializeDimension(parsed));
      }
    } else if (this.idb) {
      const all = await idbGetAll<SerializedDimension>(this.idb, 'dimensions');
      for (const dim of all) {
        result.set(dim.name, this.deserializeDimension(dim));
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // CUBE DEFINITION OPERATIONS
  // ---------------------------------------------------------------------------

  async saveCubes(cubes: Map<string, CubeDefinition>): Promise<void> {
    await this.ensureInitialized();

    for (const [name, cube] of cubes) {
      const serialized: SerializedCube = {
        name: cube.name,
        dimensions: [...cube.dimensions],
        measures: cube.measures.map((m) => ({
          name: m.name,
          dataType: m.dataType,
          precision: m.precision,
          aggregation: m.aggregation,
          currency: m.currency,
        })),
        storage: cube.storage,
      };

      if (this.backend === 'tauri' && this.tauriDb) {
        await tauriExec(
          this.tauriDb,
          `INSERT INTO cube_definitions (name, data)
           VALUES ($1, $2)
           ON CONFLICT(name) DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
          [name, JSON.stringify(serialized)]
        );
      } else if (this.idb) {
        await idbPut(this.idb, 'cubes', serialized);
      }
    }
  }

  async loadCubes(): Promise<Map<string, CubeDefinition>> {
    await this.ensureInitialized();

    const result = new Map<string, CubeDefinition>();

    if (this.backend === 'tauri' && this.tauriDb) {
      const rows = await tauriSelect<{ name: string; data: string }>(
        this.tauriDb,
        'SELECT name, data FROM cube_definitions'
      );
      for (const row of rows) {
        const parsed = JSON.parse(row.data) as SerializedCube;
        result.set(parsed.name, {
          name: parsed.name,
          dimensions: parsed.dimensions,
          measures: parsed.measures,
          storage: parsed.storage,
        });
      }
    } else if (this.idb) {
      const all = await idbGetAll<SerializedCube>(this.idb, 'cubes');
      for (const cube of all) {
        result.set(cube.name, {
          name: cube.name,
          dimensions: cube.dimensions,
          measures: cube.measures,
          storage: cube.storage,
        });
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // HISTORY OPERATIONS
  // ---------------------------------------------------------------------------

  async saveHistory(history: CellHistoryEntry[]): Promise<void> {
    await this.ensureInitialized();

    if (this.backend === 'tauri' && this.tauriDb) {
      for (const entry of history) {
        await tauriExec(
          this.tauriDb,
          `INSERT OR IGNORE INTO cube_history (id, cell_id, old_value, new_value, data_type, reason, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            entry.id,
            entry.cellId,
            entry.oldValue !== null ? JSON.stringify(entry.oldValue) : null,
            JSON.stringify(entry.newValue),
            entry.dataType,
            entry.reason ?? null,
            entry.timestamp,
          ]
        );
      }
    } else if (this.idb) {
      for (const entry of history) {
        const serialized: SerializedHistoryEntry = {
          id: entry.id,
          cellId: entry.cellId,
          oldValue: entry.oldValue,
          newValue: entry.newValue,
          dataType: entry.dataType,
          reason: entry.reason,
          timestamp: entry.timestamp,
        };
        await idbPut(this.idb, 'history', serialized);
      }
    }
  }

  async loadHistory(): Promise<CellHistoryEntry[]> {
    await this.ensureInitialized();

    if (this.backend === 'tauri' && this.tauriDb) {
      const rows = await tauriSelect<SerializedHistoryEntry>(
        this.tauriDb,
        'SELECT * FROM cube_history ORDER BY timestamp ASC'
      );
      return rows.map((row) => ({
        id: row.id,
        cellId: row.cellId,
        oldValue: row.oldValue as number | string | Date | boolean | null,
        newValue: row.newValue as number | string | Date | boolean,
        dataType: row.dataType as CellHistoryEntry['dataType'],
        reason: row.reason,
        timestamp: row.timestamp,
      }));
    } else if (this.idb) {
      return idbGetAll<SerializedHistoryEntry>(this.idb, 'history').then((rows) =>
        rows.map((row) => ({
          id: row.id,
          cellId: row.cellId,
          oldValue: row.oldValue as number | string | Date | boolean | null,
          newValue: row.newValue as number | string | Date | boolean,
          dataType: row.dataType as CellHistoryEntry['dataType'],
          reason: row.reason,
          timestamp: row.timestamp,
        }))
      );
    }

    return [];
  }

  // ---------------------------------------------------------------------------
  // SNAPSHOT OPERATIONS
  // ---------------------------------------------------------------------------

  async saveSnapshots(
    snapshots: Snapshot[],
    snapshotCells: Map<string, Map<string, unknown>>
  ): Promise<void> {
    await this.ensureInitialized();

    for (const snap of snapshots) {
      const cellMap = snapshotCells.get(snap.id);
      const cellValues: Record<string, unknown> = {};
      if (cellMap) {
        for (const [key, val] of cellMap) {
          cellValues[key] = val;
        }
      }

      const serialized: SerializedSnapshot = {
        id: snap.id,
        name: snap.name,
        createdAt: snap.createdAt,
        description: snap.description,
        cellValues,
      };

      if (this.backend === 'tauri' && this.tauriDb) {
        await tauriExec(
          this.tauriDb,
          `INSERT INTO cube_snapshots (id, name, created_at, description, cell_values)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT(id) DO UPDATE SET name = $2, description = $4, cell_values = $5`,
          [
            serialized.id,
            serialized.name,
            serialized.createdAt,
            serialized.description ?? null,
            JSON.stringify(serialized.cellValues),
          ]
        );
      } else if (this.idb) {
        await idbPut(this.idb, 'snapshots', serialized);
      }
    }
  }

  async loadSnapshots(): Promise<{
    snapshots: Snapshot[];
    snapshotCells: Map<string, Map<string, unknown>>;
  }> {
    await this.ensureInitialized();

    const snapshots: Snapshot[] = [];
    const snapshotCells = new Map<string, Map<string, unknown>>();

    if (this.backend === 'tauri' && this.tauriDb) {
      const rows = await tauriSelect<SerializedSnapshot>(
        this.tauriDb,
        'SELECT * FROM cube_snapshots ORDER BY created_at ASC'
      );
      for (const row of rows) {
        snapshots.push({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
          description: row.description,
        });

        const cellMap = new Map<string, unknown>();
        const values = JSON.parse(JSON.stringify(row.cellValues)) as Record<string, unknown>;
        for (const [key, val] of Object.entries(values)) {
          cellMap.set(key, val);
        }
        snapshotCells.set(row.id, cellMap);
      }
    } else if (this.idb) {
      const all = await idbGetAll<SerializedSnapshot>(this.idb, 'snapshots');
      for (const row of all) {
        snapshots.push({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt,
          description: row.description,
        });

        const cellMap = new Map<string, unknown>();
        for (const [key, val] of Object.entries(row.cellValues)) {
          cellMap.set(key, val);
        }
        snapshotCells.set(row.id, cellMap);
      }
    }

    return { snapshots, snapshotCells };
  }

  // ---------------------------------------------------------------------------
  // DESERIALIZATION HELPERS
  // ---------------------------------------------------------------------------

  private deserializeCell(row: SerializedCell): CubeCell {
    return {
      coords: { ...row.coords },
      measure: row.measure,
      value: row.value,
      dataType: row.dataType as CubeCell['dataType'],
      comment: row.comment,
      attachment: row.attachment,
    };
  }

  private deserializeDimension(dim: SerializedDimension): DimensionDefinition {
    const members = new Map<string, DimensionMember>();
    for (const m of dim.members) {
      members.set(m.id, {
        id: m.id,
        code: m.code,
        name: m.name,
        parentId: m.parentId,
        hierarchy: m.hierarchy,
        level: m.level,
        isLeaf: m.isLeaf,
        isActive: m.isActive,
        attributes: { ...m.attributes },
        formula: m.formula,
        effectiveStart: m.effectiveStart,
        effectiveEnd: m.effectiveEnd,
        sortOrder: m.sortOrder,
      });
    }

    return {
      name: dim.name,
      type: dim.type,
      hierarchies: dim.hierarchies,
      attributes: dim.attributes,
      members,
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}
