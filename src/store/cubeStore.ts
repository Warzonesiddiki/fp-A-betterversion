import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { masterStorage } from '@/utils/masterStorage';
import { CubeEngine } from '@/engines/CubeEngine';
import { withCache, invalidateStoreCache } from '@/utils/storeCache';
import type {
  CubeCell,
  CubeQuery,
  CubeResult,
  CubeDiff,
  MeasureAggregation,
  CellDataType,
  Snapshot,
  DimensionMember,
  MeasureDefinition,
} from '@/types/cube-types';

// =============================================================================
// CUBE STORE — Singleton CubeEngine wrapper via Zustand
// =============================================================================

export interface CubeState {
  engine: CubeEngine;
  isInitialized: boolean;
  cellCount: number;
  historyCount: number;
  snapshots: Snapshot[];

  initialize: () => void;
  writeCell: (
    cube: string,
    coords: Record<string, string>,
    measure: string,
    value: number | string | Date | boolean,
    dataType?: CellDataType,
    comment?: string
  ) => void;
  readCell: (cube: string, coords: Record<string, string>, measure: string) => CubeCell | undefined;
  getCellValue: (
    cube: string,
    coords: Record<string, string>,
    measure: string
  ) => number | string | Date | boolean | undefined;
  deleteCell: (cube: string, coords: Record<string, string>, measure: string) => boolean;
  query: (query: CubeQuery) => CubeResult;
  aggregate: (
    cube: string,
    coords: Partial<Record<string, string>>,
    measure: string,
    aggregation?: MeasureAggregation
  ) => number | null;
  createSnapshot: (name: string, description?: string) => Snapshot;
  compareSnapshots: (snapshotAId: string, snapshotBId: string) => CubeDiff;
  listSnapshots: () => Snapshot[];
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  registerDimension: (
    name: string,
    hierarchies?: { name: string; levels: string[] }[],
    attributes?: { name: string; dataType: 'text' | 'number' | 'boolean' | 'date' }[]
  ) => void;
  registerCube: (name: string, dimensions: string[], measures: MeasureDefinition[]) => void;
  addMember: (dimension: string, member: Omit<DimensionMember, 'id'>) => DimensionMember;
  getMembers: (dimension: string) => DimensionMember[];
  bulkWriteCells: (cells: { cube: string; cell: CubeCell }[]) => void;
  clearAll: () => void;
  refreshCounts: () => void;
  resetUndoRedo: () => void;
}

// Singleton engine shared across all consumers
let _engine: CubeEngine | null = null;

export function getEngine(): CubeEngine {
  if (!_engine) {
    _engine = new CubeEngine();
  }
  return _engine;
}

export function resetEngine(): void {
  _engine = null;
}

// Snapshot for undo/redo — serialize engine state
interface EngineSnapshot {
  cells: Map<string, CubeCell>;
  cellHistory: import('@/types/cube-types').CellHistoryEntry[];
}

function captureEngineState(engine: CubeEngine): EngineSnapshot {
  // Access private state via casting for undo/redo
  const anyEngine = engine as unknown as Record<string, unknown>;
  const cells = new Map(anyEngine['cells'] as Map<string, CubeCell>);
  const cellHistory = [
    ...(anyEngine['cellHistory'] as import('@/types/cube-types').CellHistoryEntry[]),
  ];
  return { cells, cellHistory };
}

function restoreEngineState(engine: CubeEngine, snapshot: EngineSnapshot): void {
  const anyEngine = engine as unknown as Record<string, unknown>;
  anyEngine['cells'] = new Map(snapshot.cells);
  anyEngine['cellHistory'] = [...snapshot.cellHistory];
}

const MAX_UNDO_DEPTH = 100;

/**
 * OLAP cube store — analytics core for FinPlan Pro. Stores dimensions × measures × slices.
 * Transient store (no persist middleware); relies on cubeEngine recompute on hydration.
 * T-Apollo T-AP-010 immer wrapper: nested mutation allowed via `produce()` semantics.
 * @see ADR-002 (Zustand) + ADR-003 (OLAP cube architecture) + ADR-010 (schema migration).
 * @domain Mimo's primary FP&A domain hook — call sites in `src/components/forecast/`, `src/components/scenario/`.
 */
export const useCubeStore = create<CubeState>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => {
        const undoStack: EngineSnapshot[] = [];
        const redoStack: EngineSnapshot[] = [];

        function pushUndo(): void {
          const engine = get().engine;
          const snapshot = captureEngineState(engine);
          undoStack.push(snapshot);
          if (undoStack.length > MAX_UNDO_DEPTH) {
            undoStack.shift();
          }
          redoStack.length = 0; // clear redo on new action
        }

        function refreshFromEngine(): void {
          const engine = get().engine;
          set({
            cellCount: engine.getCellCount(),
            historyCount: engine.getHistoryCount(),
            snapshots: engine.listSnapshots(),
          });
        }

        return {
          engine: getEngine(),
          isInitialized: false,
          cellCount: 0,
          historyCount: 0,
          snapshots: [],

          initialize: () => {
            const engine = get().engine;
            engine.registerSystemDimensions();

            // Register standard GL cubes
            engine.registerCube(
              'GL_Actuals',
              ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
              [
                { name: 'debit', dataType: 'numeric', aggregation: 'sum' },
                { name: 'credit', dataType: 'numeric', aggregation: 'sum' },
                { name: 'netChange', dataType: 'numeric', aggregation: 'sum' },
                { name: 'amount', dataType: 'numeric', aggregation: 'sum' },
              ]
            );

            engine.registerCube(
              'GL_Budget',
              ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
              [
                { name: 'debit', dataType: 'numeric', aggregation: 'sum' },
                { name: 'credit', dataType: 'numeric', aggregation: 'sum' },
                { name: 'netChange', dataType: 'numeric', aggregation: 'sum' },
                { name: 'amount', dataType: 'numeric', aggregation: 'sum' },
              ]
            );

            engine.registerCube(
              'GL_Forecast',
              ['Account', 'Entity', 'Time', 'Scenario', 'Currency'],
              [
                { name: 'debit', dataType: 'numeric', aggregation: 'sum' },
                { name: 'credit', dataType: 'numeric', aggregation: 'sum' },
                { name: 'netChange', dataType: 'numeric', aggregation: 'sum' },
                { name: 'amount', dataType: 'numeric', aggregation: 'sum' },
              ]
            );

            // Add default Scenario members
            engine.addMember('Scenario', {
              code: 'Actual',
              name: 'Actual',
              hierarchy: 'default',
              level: 0,
              isLeaf: true,
              isActive: true,
              attributes: {},
              sortOrder: 0,
            });
            engine.addMember('Scenario', {
              code: 'Budget',
              name: 'Budget',
              hierarchy: 'default',
              level: 0,
              isLeaf: true,
              isActive: true,
              attributes: {},
              sortOrder: 1,
            });
            engine.addMember('Scenario', {
              code: 'Forecast',
              name: 'Forecast',
              hierarchy: 'default',
              level: 0,
              isLeaf: true,
              isActive: true,
              attributes: {},
              sortOrder: 2,
            });

            // Add default Currency member
            engine.addMember('Currency', {
              code: 'USD',
              name: 'US Dollar',
              hierarchy: 'default',
              level: 0,
              isLeaf: true,
              isActive: true,
              attributes: {},
              sortOrder: 0,
            });

            set({ isInitialized: true });
            refreshFromEngine();
          },

          writeCell: (cube, coords, measure, value, dataType = 'input', comment) => {
            pushUndo();
            const engine = get().engine;
            engine.writeCell(cube, { coords, measure, value, dataType, comment });
            invalidateStoreCache('cube');
            refreshFromEngine();
          },

          readCell: (cube, coords, measure) => {
            return get().engine.readCell(cube, coords, measure);
          },

          getCellValue: (cube, coords, measure) => {
            return get().engine.getCellValue(cube, coords, measure);
          },

          deleteCell: (cube, coords, measure) => {
            pushUndo();
            const result = get().engine.deleteCell(cube, coords, measure);
            invalidateStoreCache('cube');
            refreshFromEngine();
            return result;
          },

          query: (query) => {
            const key = `cube:query:${JSON.stringify(query)}`;
            return withCache(key, () => get().engine.query(query));
          },

          aggregate: (cube, coords, measure, aggregation) => {
            const key = `cube:agg:${cube}:${JSON.stringify(coords)}:${measure}:${aggregation ?? 'sum'}`;
            return withCache(key, () => get().engine.aggregate(cube, coords, measure, aggregation));
          },

          createSnapshot: (name, description) => {
            const snapshot = get().engine.createSnapshot(name, description);
            refreshFromEngine();
            return snapshot;
          },

          compareSnapshots: (snapshotAId, snapshotBId) => {
            return get().engine.compareSnapshots(snapshotAId, snapshotBId);
          },

          listSnapshots: () => {
            return get().engine.listSnapshots();
          },

          undo: () => {
            if (undoStack.length === 0) return false;
            const engine = get().engine;
            const current = captureEngineState(engine);
            redoStack.push(current);
            const previous = undoStack.pop()!;
            restoreEngineState(engine, previous);
            refreshFromEngine();
            return true;
          },

          redo: () => {
            if (redoStack.length === 0) return false;
            const engine = get().engine;
            const current = captureEngineState(engine);
            undoStack.push(current);
            const next = redoStack.pop()!;
            restoreEngineState(engine, next);
            refreshFromEngine();
            return true;
          },

          canUndo: () => undoStack.length > 0,
          canRedo: () => redoStack.length > 0,

          registerDimension: (name, hierarchies = [], attributes = []) => {
            get().engine.registerDimension(name, 'user', hierarchies, attributes);
          },

          registerCube: (name, dimensions, measures) => {
            get().engine.registerCube(name, dimensions, measures);
          },

          addMember: (dimension, member) => {
            return get().engine.addMember(dimension, member);
          },

          getMembers: (dimension) => {
            return get().engine.getMembers(dimension);
          },

          bulkWriteCells: (cells) => {
            if (cells.length === 0) return;
            pushUndo();
            const engine = get().engine;
            for (const { cube, cell } of cells) {
              engine.writeCell(cube, cell);
            }
            invalidateStoreCache('cube');
            refreshFromEngine();
          },

          clearAll: () => {
            get().engine.clearAll();
            invalidateStoreCache('cube');
            undoStack.length = 0;
            redoStack.length = 0;
            set({ isInitialized: false, cellCount: 0, historyCount: 0, snapshots: [] });
          },

          refreshCounts: () => {
            refreshFromEngine();
          },

          resetUndoRedo: () => {
            undoStack.length = 0;
            redoStack.length = 0;
          },
        };
      }),
      {
        name: 'cube-store',
        storage: masterStorage,
        version: 1,
        migrate: (state: unknown) => state,
        partialize: (state: CubeState) => ({
          isInitialized: state.isInitialized,
          cellCount: state.cellCount,
          historyCount: state.historyCount,
          snapshots: state.snapshots,
        }),
      }
    )
  )
);

// Memoized selectors to prevent unnecessary re-renders
export const cubeSelectors = {
  engine: (state: CubeState) => state.engine,
  isInitialized: (state: CubeState) => state.isInitialized,
  cellCount: (state: CubeState) => state.cellCount,
  historyCount: (state: CubeState) => state.historyCount,
  snapshots: (state: CubeState) => state.snapshots,
  // Derived selectors
  snapshotCount: (state: CubeState) => state.snapshots.length,
  hasData: (state: CubeState) => state.cellCount > 0,
  canUndo: (state: CubeState) => state.canUndo(),
  canRedo: (state: CubeState) => state.canRedo(),
};
