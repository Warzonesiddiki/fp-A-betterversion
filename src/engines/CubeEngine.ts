/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  DimensionDefinition,
  DimensionMember,
  CubeDefinition,
  CubeCell,
  CubeQuery,
  CubeResult,
  MeasureAggregation,
  CellHistoryEntry,
  Snapshot,
  CubeDiff,
  CellAddress,
  HierarchyDefinition,
  AttributeDefinition,
  DimensionType,
  MeasureDefinition,
  CubeStorageMode,
  CellDataType,
} from '@/types/cube-types';
import { CubeEnginePersistence } from './CubeEnginePersistence';

// =============================================================================
// CUBE ENGINE — Multi-dimensional OLAP data model
// Pure TypeScript, deterministic, testable
// =============================================================================

/** Maximum number of history entries to retain in memory (prevents unbounded growth) */
const MAX_HISTORY_SIZE = 10000;

export class CubeEngine {
  private dimensions = new Map<string, DimensionDefinition>();
  private cubes = new Map<string, CubeDefinition>();
  private cells = new Map<string, CubeCell>();
  private cellHistory: CellHistoryEntry[] = [];
  private snapshots: Snapshot[] = [];
  private snapshotCells = new Map<string, Map<string, unknown>>();
  private snapshotCounter = 0;
  private lastSnapshotCellValues = new Map<string, unknown>();
  private storage: CubeEnginePersistence | null = null;

  // Performance indexes: cell key prefix → cube name (avoids O(cells×cubes) lookup)
  private cellCubeIndex = new Map<string, string>();
  // Cube name → Set of cell keys (for fast per-cube iteration)
  private cubeCellIndex = new Map<string, Set<string>>();
  // Dimension member → child IDs index (for fast descendant lookup)
  private memberChildrenIndex = new Map<string, Set<string>>();

  // --- Dimension Management ---

  registerDimension(
    name: string,
    type: DimensionType = 'user',
    hierarchies: HierarchyDefinition[] = [],
    attributes: AttributeDefinition[] = []
  ): void {
    if (this.dimensions.has(name)) {
      throw new Error(`Dimension "${name}" already exists`);
    }
    this.dimensions.set(name, {
      name,
      type,
      hierarchies,
      attributes,
      members: new Map(),
    });
  }

  getDimension(name: string): DimensionDefinition | undefined {
    return this.dimensions.get(name);
  }

  listDimensions(): string[] {
    return Array.from(this.dimensions.keys());
  }

  addMember(dimension: string, member: Omit<DimensionMember, 'id'>): DimensionMember {
    const dim = this.dimensions.get(dimension);
    if (!dim) throw new Error(`Dimension "${dimension}" not found`);

    const id = `${dimension}:${member.code}`;
    const fullMember: DimensionMember = { ...member, id, sortOrder: member.sortOrder ?? 0 };
    dim.members.set(id, fullMember);

    // Build children index for fast descendant traversal
    if (member.parentId) {
      const parentKey = `${dimension}:${member.parentId}`;
      if (!this.memberChildrenIndex.has(parentKey)) {
        this.memberChildrenIndex.set(parentKey, new Set());
      }
      this.memberChildrenIndex.get(parentKey)!.add(id);
    }

    return fullMember;
  }

  getMember(dimension: string, memberId: string): DimensionMember | undefined {
    return this.dimensions.get(dimension)?.members.get(memberId);
  }

  getMembers(dimension: string): DimensionMember[] {
    return Array.from(this.dimensions.get(dimension)?.members.values() ?? []);
  }

  getLeafMembers(dimension: string): DimensionMember[] {
    return this.getMembers(dimension).filter((m) => m.isLeaf && m.isActive);
  }

  getAncestors(dimension: string, memberId: string): DimensionMember[] {
    const ancestors: DimensionMember[] = [];
    const dim = this.dimensions.get(dimension);
    if (!dim) return ancestors;

    let current = dim.members.get(memberId);
    while (current?.parentId) {
      const parent = dim.members.get(`${dimension}:${current.parentId}`);
      if (!parent) break;
      ancestors.push(parent);
      current = parent;
    }
    return ancestors;
  }

  getDescendants(dimension: string, memberId: string): DimensionMember[] {
    const descendants: DimensionMember[] = [];
    const dim = this.dimensions.get(dimension);
    if (!dim) return descendants;

    // Use children index for O(1) per-level traversal instead of O(n) scan
    const queue = [memberId.includes(':') ? memberId : `${dimension}:${memberId}`];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = this.memberChildrenIndex.get(currentId);
      if (children) {
        for (const childId of children) {
          const member = dim.members.get(childId);
          if (member) {
            descendants.push(member);
            queue.push(childId);
          }
        }
      }
    }
    return descendants;
  }

  // --- Cube Management ---

  registerCube(
    name: string,
    dimensions: string[],
    measures: MeasureDefinition[],
    storage: CubeStorageMode = 'sparse'
  ): void {
    for (const dim of dimensions) {
      if (!this.dimensions.has(dim)) {
        throw new Error(`Dimension "${dim}" not registered`);
      }
    }
    this.cubes.set(name, { name, dimensions, measures, storage });
  }

  getCube(name: string): CubeDefinition | undefined {
    return this.cubes.get(name);
  }

  listCubes(): string[] {
    return Array.from(this.cubes.keys());
  }

  // --- Cell Operations ---

  async writeCell(cube: string, cell: CubeCell): Promise<void> {
    const cubeDef = this.cubes.get(cube);
    if (!cubeDef) throw new Error(`Cube "${cube}" not found`);

    for (const dim of cubeDef.dimensions) {
      if (!(dim in cell.coords)) {
        throw new Error(`Missing dimension "${dim}" in cell`);
      }
    }
    if (!cubeDef.measures.some((m) => m.name === cell.measure)) {
      throw new Error(`Measure "${cell.measure}" not found in cube "${cube}"`);
    }

    const key = this.cellKey(cube, cell.coords, cell.measure);
    const oldValue = this.cells.get(key)?.value ?? null;

    this.cells.set(key, { ...cell });

    // Maintain performance indexes
    this.cellCubeIndex.set(key, cube);
    if (!this.cubeCellIndex.has(cube)) {
      this.cubeCellIndex.set(cube, new Set());
    }
    this.cubeCellIndex.get(cube)!.add(key);

    const historyEntry: CellHistoryEntry = {
      id: `hist-${Date.now()}-${this.cellHistory.length}`,
      cellId: key,
      oldValue,
      newValue: cell.value,
      dataType: cell.dataType,
      timestamp: new Date().toISOString(),
    };
    this.cellHistory.push(historyEntry);

    // Prune oldest entries when history exceeds limit
    if (this.cellHistory.length > MAX_HISTORY_SIZE) {
      this.cellHistory = this.cellHistory.slice(-MAX_HISTORY_SIZE);
    }

    if (this.storage) {
      await this.storage.saveCell(cube, cell, key);
      await this.storage.saveHistory([historyEntry]);
    }
  }

  readCell(cube: string, coords: Record<string, string>, measure: string): CubeCell | undefined {
    const key = this.cellKey(cube, coords, measure);
    return this.cells.get(key);
  }

  getCellValue(
    cube: string,
    coords: Record<string, string>,
    measure: string
  ): number | string | Date | boolean | undefined {
    return this.readCell(cube, coords, measure)?.value;
  }

  deleteCell(cube: string, coords: Record<string, string>, measure: string): boolean {
    const key = this.cellKey(cube, coords, measure);
    const deleted = this.cells.delete(key);
    if (deleted) {
      this.cellCubeIndex.delete(key);
      this.cubeCellIndex.get(cube)?.delete(key);
    }
    return deleted;
  }

  getCellHistory(
    cube: string,
    coords: Record<string, string>,
    measure: string
  ): CellHistoryEntry[] {
    const key = this.cellKey(cube, coords, measure);
    return this.cellHistory.filter((h) => h.cellId === key);
  }

  // --- Query & Aggregation ---

  query(query: CubeQuery): CubeResult {
    const cubeDef = this.cubes.get(query.cube);
    if (!cubeDef) throw new Error(`Cube "${query.cube}" not found`);

    const filteredCells = this.filterCells(query);
    const aggregated = this.aggregateCells(filteredCells, query);

    return this.formatResult(aggregated, query);
  }

  aggregate(
    cube: string,
    coords: Partial<Record<string, string>>,
    measure: string,
    aggregation: MeasureAggregation = 'sum'
  ): number | null {
    const cubeDef = this.cubes.get(cube);
    if (!cubeDef) throw new Error(`Cube "${cube}" not found`);

    const matchingCells: CubeCell[] = [];
    for (const cell of this.cells.values()) {
      if (!cell.measure.startsWith(measure) && cell.measure !== measure) continue;

      const cellCube = this.findCubeForCell(cell);
      if (cellCube !== cube) continue;

      let matches = true;
      for (const [dim, memberId] of Object.entries(coords)) {
        if (cell.coords[dim] !== memberId) {
          matches = false;
          break;
        }
      }
      if (matches) matchingCells.push(cell);
    }

    if (matchingCells.length === 0) return null;

    let sum = 0;
    let count = 0;
    let min = Infinity;
    let max = -Infinity;
    let first: number | undefined;

    for (const c of matchingCells) {
      const v = c.value;
      const num = typeof v === 'number' ? v : 0;
      if (first === undefined) first = num;
      sum += num;
      count++;
      if (num < min) min = num;
      if (num > max) max = num;
    }

    if (count === 0) return null;

    switch (aggregation) {
      case 'sum':
        return sum;
      case 'avg':
        return sum / count;
      case 'count':
        return count;
      case 'min':
        return min;
      case 'max':
        return max;
      case 'none':
        return first ?? null;
      default:
        return sum;
    }
  }

  // --- Snapshot Management ---

  createSnapshot(name: string, description?: string): Snapshot {
    const snapshot: Snapshot = {
      id: `snap-${Date.now()}-${++this.snapshotCounter}`,
      name,
      createdAt: new Date().toISOString(),
      description,
    };
    this.snapshots.push(snapshot);

    // Store only changed cells (differential snapshot)
    const cellMap = new Map<string, unknown>();
    const currentValues = new Map<string, unknown>();

    for (const [key, cell] of this.cells) {
      currentValues.set(key, cell.value);
      const lastValue = this.lastSnapshotCellValues.get(key);

      // Store if cell is new or changed
      if (lastValue === undefined || lastValue !== cell.value) {
        cellMap.set(key, cell.value);
      }
    }

    // Store null for cells that were deleted since last snapshot
    for (const [key] of this.lastSnapshotCellValues) {
      if (!currentValues.has(key)) {
        cellMap.set(key, null);
      }
    }

    this.snapshotCells.set(snapshot.id, cellMap);
    this.lastSnapshotCellValues = currentValues;

    return snapshot;
  }

  listSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }

  compareSnapshots(snapshotAId: string, snapshotBId: string): CubeDiff {
    const cellsA = this.reconstructSnapshotCells(snapshotAId);
    const cellsB = this.reconstructSnapshotCells(snapshotBId);
    if (!cellsA || !cellsB) throw new Error('Snapshot not found');

    const allKeys = new Set([...cellsA.keys(), ...cellsB.keys()]);
    const changed: CubeDiff['changed'] = [];
    const added: CubeDiff['added'] = [];
    const removed: CubeDiff['removed'] = [];

    for (const key of allKeys) {
      const valA = cellsA.get(key);
      const valB = cellsB.get(key);

      if (valA === undefined) {
        added.push(this.parseCellAddress(key));
      } else if (valB === undefined) {
        removed.push(this.parseCellAddress(key));
      } else if (valA !== valB) {
        changed.push({
          address: this.parseCellAddress(key),
          oldValue: valA,
          newValue: valB,
        });
      }
    }

    return {
      changed,
      added,
      removed,
      summary: {
        cellsChanged: changed.length,
        cellsAdded: added.length,
        cellsRemoved: removed.length,
      },
    };
  }

  // --- System Dimensions ---

  registerSystemDimensions(): void {
    const systemDims: { name: string; hierarchies?: HierarchyDefinition[] }[] = [
      {
        name: 'Account',
        hierarchies: [
          { name: 'reporting', levels: ['category', 'account'], effectiveDating: false },
          { name: 'tax', levels: ['tax_category', 'account'], effectiveDating: false },
        ],
      },
      {
        name: 'Entity',
        hierarchies: [
          { name: 'legal', levels: ['group', 'entity'], effectiveDating: false },
          { name: 'department', levels: ['division', 'department'], effectiveDating: false },
        ],
      },
      {
        name: 'Time',
        hierarchies: [
          { name: 'calendar', levels: ['year', 'quarter', 'month', 'day'], effectiveDating: false },
        ],
      },
      {
        name: 'Scenario',
        hierarchies: [{ name: 'default', levels: ['scenario'], effectiveDating: false }],
      },
      {
        name: 'Currency',
        hierarchies: [{ name: 'default', levels: ['currency'], effectiveDating: false }],
      },
      {
        name: 'Version',
        hierarchies: [{ name: 'default', levels: ['version'], effectiveDating: false }],
      },
      {
        name: 'DataSource',
        hierarchies: [{ name: 'default', levels: ['source'], effectiveDating: false }],
      },
    ];

    for (const dim of systemDims) {
      if (!this.dimensions.has(dim.name)) {
        this.registerDimension(dim.name, 'system', dim.hierarchies ?? []);
      }
    }
  }

  // --- State ---

  getCellCount(): number {
    return this.cells.size;
  }

  getHistoryCount(): number {
    return this.cellHistory.length;
  }

  clearAll(): void {
    this.dimensions.clear();
    this.cubes.clear();
    this.cells.clear();
    this.cellHistory = [];
    this.snapshots = [];
    this.snapshotCells.clear();
    this.lastSnapshotCellValues.clear();
    this.cellCubeIndex.clear();
    this.cubeCellIndex.clear();
    this.memberChildrenIndex.clear();
  }

  // --- Persistence ---

  initialize(storage: CubeEnginePersistence): void {
    this.storage = storage;
  }

  async loadFromStorage(): Promise<void> {
    if (!this.storage) return;

    const [dimensions, cubes, cells, history, snapshotsData] = await Promise.all([
      this.storage.loadDimensions(),
      this.storage.loadCubes(),
      this.storage.loadCells(),
      this.storage.loadHistory(),
      this.storage.loadSnapshots(),
    ]);

    this.dimensions = dimensions;
    this.cubes = cubes;
    this.cells = new Map(cells.map(({ cellKey, cell }) => [cellKey, cell]));
    // Prune loaded history if it exceeds limit
    this.cellHistory =
      history.length > MAX_HISTORY_SIZE ? history.slice(-MAX_HISTORY_SIZE) : history;
    this.snapshots = snapshotsData.snapshots;
    this.snapshotCells = snapshotsData.snapshotCells;

    // Rebuild performance indexes after loading
    this.rebuildIndexes();

    if (this.snapshots.length > 0) {
      const ids = this.snapshots.map((s) => {
        const match = s.id.match(/snap-(\d+)-(\d+)/);
        return match ? parseInt(match[2]!, 10) : 0;
      });
      this.snapshotCounter = Math.max(...ids, 0);
    }
  }

  async saveToStorage(): Promise<void> {
    if (!this.storage) return;

    await this.storage.saveDimensions(this.dimensions);
    await this.storage.saveCubes(this.cubes);

    const cellEntries = Array.from(this.cells.entries()).map(([key, cell]) => ({
      cube: key.split('|')[0]!,
      cell,
      cellKey: key,
    }));
    await this.storage.saveCells(cellEntries);

    await this.storage.saveHistory(this.cellHistory);
    await this.storage.saveSnapshots(this.snapshots, this.snapshotCells);
  }

  getStorage(): CubeEnginePersistence | null {
    return this.storage;
  }

  // --- Private Helpers ---

  private cellKey(cube: string, coords: Record<string, string>, measure: string): string {
    const sortedCoords = Object.keys(coords)
      .sort()
      .map((k) => `${k}=${coords[k]}`)
      .join('|');
    return `${cube}|${sortedCoords}|${measure}`;
  }

  private findCubeForCell(cell: CubeCell): string | null {
    // Use index if available, fallback to scan
    for (const [name, cubeDef] of this.cubes) {
      const dims = cubeDef.dimensions;
      const coordKeys = Object.keys(cell.coords);
      if (dims.length === coordKeys.length && dims.every((d) => d in cell.coords)) {
        return name;
      }
    }
    return null;
  }

  private filterCells(query: CubeQuery): CubeCell[] {
    const cubeDef = this.cubes.get(query.cube);
    if (!cubeDef) return [];

    // Use cube index for O(cube_cells) instead of O(all_cells) iteration
    const cubeCellKeys = this.cubeCellIndex.get(query.cube);
    const matchingCells: CubeCell[] = [];

    const cellIterator = cubeCellKeys
      ? (Array.from(cubeCellKeys)
          .map((key) => this.cells.get(key))
          .filter(Boolean) as CubeCell[])
      : Array.from(this.cells.values());

    for (const cell of cellIterator) {
      // When using cube index, cells are already filtered by cube; otherwise verify
      if (!cubeCellKeys && this.findCubeForCell(cell) !== query.cube) continue;
      if (!cubeDef.measures.some((m) => m.name === cell.measure)) continue;

      let matches = true;
      for (const filter of query.filters) {
        const cellMemberId = cell.coords[filter.dimension];
        if (!cellMemberId) {
          matches = false;
          break;
        }
        if (filter.includeChildren) {
          const descendants = this.getDescendants(filter.dimension, cellMemberId);
          const descendantIds = new Set(descendants.map((d) => d.id));
          if (!filter.memberIds.includes(cellMemberId) && !descendantIds.has(cellMemberId)) {
            matches = false;
            break;
          }
        } else {
          if (!filter.memberIds.includes(cellMemberId)) {
            matches = false;
            break;
          }
        }
      }
      if (matches) matchingCells.push(cell);
    }
    return matchingCells;
  }

  private aggregateCells(cells: CubeCell[], query: CubeQuery): Map<string, number> {
    const aggregated = new Map<string, number>();
    const agg = query.aggregation ?? 'sum';

    for (const cell of cells) {
      const rowKey = this.buildRowKey(cell, query.rows);
      const value = typeof cell.value === 'number' ? cell.value : 0;

      const existing = aggregated.get(rowKey) ?? 0;
      switch (agg) {
        case 'sum':
          aggregated.set(rowKey, existing + value);
          break;
        case 'avg':
          aggregated.set(rowKey, existing + value);
          break;
        case 'count':
          aggregated.set(rowKey, existing + 1);
          break;
        case 'min':
          aggregated.set(rowKey, existing === 0 ? value : Math.min(existing, value));
          break;
        case 'max':
          aggregated.set(rowKey, Math.max(existing, value));
          break;
        default:
          aggregated.set(rowKey, existing + value);
      }
    }

    if (agg === 'avg') {
      const counts = new Map<string, number>();
      for (const cell of cells) {
        const rowKey = this.buildRowKey(cell, query.rows);
        counts.set(rowKey, (counts.get(rowKey) ?? 0) + 1);
      }
      for (const [key, sum] of aggregated) {
        aggregated.set(key, sum / (counts.get(key) ?? 1));
      }
    }

    return aggregated;
  }

  private buildRowKey(cell: CubeCell, rowDims: string[]): string {
    return rowDims.map((d) => cell.coords[d] ?? '').join('|');
  }

  private formatResult(aggregated: Map<string, number>, query: CubeQuery): CubeResult {
    const rows: CubeResult['rows'] = [];
    for (const [label, value] of aggregated) {
      rows.push({ label, values: [value], isTotal: false });
    }

    const headers: CubeResult['headers'] = query.rows.map((dim) => ({
      dimension: dim,
      members: this.getMembers(dim).map((m) => m.id),
    }));

    let grandTotal: (number | string | null)[] | undefined;
    if (query.includeGrandTotal && rows.length > 0) {
      const total = rows.reduce((sum, r) => sum + ((r.values[0] as number) ?? 0), 0);
      grandTotal = [total];
    }

    return { headers, rows, grandTotal };
  }

  private reconstructSnapshotCells(snapshotId: string): Map<string, unknown> | undefined {
    const snapshotIndex = this.snapshots.findIndex((s) => s.id === snapshotId);
    if (snapshotIndex === -1) return undefined;

    // Walk backwards through the snapshot chain, collecting values
    const result = new Map<string, unknown>();
    for (let i = snapshotIndex; i >= 0; i--) {
      const snapId = this.snapshots[i]!.id;
      const cells = this.snapshotCells.get(snapId);
      if (!cells) continue;

      for (const [key, value] of cells) {
        // Only set if not already resolved from a later snapshot
        if (!result.has(key)) {
          if (value === null) {
            // Deleted cell — mark as explicitly absent
            result.set(key, undefined);
          } else {
            result.set(key, value);
          }
        }
      }
    }

    // Remove deleted markers
    for (const [key, value] of result) {
      if (value === undefined) {
        result.delete(key);
      }
    }

    return result;
  }

  private rebuildIndexes(): void {
    this.cellCubeIndex.clear();
    this.cubeCellIndex.clear();
    this.memberChildrenIndex.clear();

    // Rebuild cell-to-cube index
    for (const [key, cell] of this.cells) {
      const cube = this.findCubeForCell(cell);
      if (cube) {
        this.cellCubeIndex.set(key, cube);
        if (!this.cubeCellIndex.has(cube)) {
          this.cubeCellIndex.set(cube, new Set());
        }
        this.cubeCellIndex.get(cube)!.add(key);
      }
    }

    // Rebuild member children index
    for (const dim of this.dimensions.values()) {
      for (const member of dim.members.values()) {
        if (member.parentId) {
          const parentKey = `${dim.name}:${member.parentId}`;
          if (!this.memberChildrenIndex.has(parentKey)) {
            this.memberChildrenIndex.set(parentKey, new Set());
          }
          this.memberChildrenIndex.get(parentKey)!.add(member.id);
        }
      }
    }
  }

  private parseCellAddress(key: string): CellAddress {
    const parts = key.split('|');
    const cube = parts[0]!;
    const measure = parts[parts.length - 1]!;
    const coords: Record<string, string> = {};
    for (let i = 1; i < parts.length - 1; i++) {
      const [dim, memberId] = parts[i]!.split('=');
      coords[dim!] = memberId!;
    }
    return { cube, coords, measure };
  }
}
