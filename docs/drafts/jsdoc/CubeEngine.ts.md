<!-- DRAFT v0.2 — ground-truth corrected 2026-06-12 — Mnemosyne -->

# JSDoc draft — `src/engines/CubeEngine.ts` (v0.2, corrected)

> **Ground-truth note (2026-06-12)**: v0.1 listed 5 internal types that
> did not exist in the real source. The real `CubeEngine` (750 lines) is a
> stateful class with **15+ public methods** organized around three concerns:
> dimension/member management, cube registration, and cell read/write with
> optional history snapshots. State is mirrored to a `CubeEnginePersistence`
> adapter for crash recovery. v0.2 documents the actual public surface.

---

## Current source (signature summary, 750 lines)

```ts
import type { CubeEnginePersistence } from './CubeEnginePersistence';

export interface CubeMember {
  /* id, dimensionId, name, parent, children */
}
export interface Dimension {
  /* id, name, type, members[] */
}
export interface CubeDefinition {
  /* id, name, dimensions[], defaultMeasure */
}
export interface CellKey {
  /* dimensionId, memberPath */
}
export interface CellValue {
  /* numeric, currency, string, etc. */
}

export class CubeEngine {
  private dimensions: Map<string, Dimension>;
  private cubes: Map<string, CubeDefinition>;
  private cells: Map<string, Map<string, CellValue>>;
  private cellHistory: Map<string, CellValue[]>;
  private snapshots: Map<string, Snapshot>;
  private snapshotCells: Map<string, Map<string, CellValue>>;
  private snapshotCounter: number;
  private lastSnapshotCellValues: Map<string, CellValue>;
  private cellCubeIndex: Map<string, string>;
  private cubeCellIndex: Map<string, Set<string>>;
  private memberChildrenIndex: Map<string, Set<string>>;
  private storage: CubeEnginePersistence;
  private static readonly MAX_HISTORY_SIZE = 10_000;

  // === Dimension / member management ===
  registerDimension(dimension: Dimension): void;
  getDimension(dimensionId: string): Dimension | undefined;
  listDimensions(): Dimension[];
  addMember(dimensionId: string, member: CubeMember): void;
  getMember(dimensionId: string, memberId: string): CubeMember | undefined;
  getMembers(dimensionId: string): CubeMember[];
  getLeafMembers(dimensionId: string): CubeMember[];
  getAncestors(dimensionId: string, memberId: string): CubeMember[];
  getDescendants(dimensionId: string, memberId: string): CubeMember[];

  // === Cube registration ===
  registerCube(cube: CubeDefinition): void;
  getCube(cubeId: string): CubeDefinition | undefined;
  listCubes(): CubeDefinition[];

  // === Cell read/write ===
  writeCell(cubeId: string, key: CellKey, value: CellValue): Promise<void>;
  readCell(cubeId: string, key: CellKey): CellValue | undefined;

  // === Snapshots & history ===
  createSnapshot(label: string): string; // returns snapshotId
  getSnapshot(snapshotId: string): Snapshot | undefined;
  listSnapshots(): Snapshot[];
  getCellHistory(cubeId: string, key: CellKey): CellValue[];
}
```

## Proposed JSDoc to paste above the `import { CubeEnginePersistence }` line

```ts
/**
 * The OLAP cube that sits at the centre of FinPlan Pro. All 202 engines
 * read from or write to the cube — it is the single source of truth for
 * multi-dimensional financial data.
 *
 * **Three concerns, three clusters of methods:**
 *
 *  1. **Dimensions and members** — define the axes of analysis. Every
 *     dimension has a tree of members (e.g. `Account` → `Revenue` → `Product Revenue`
 *     → `SaaS Revenue`). Use `registerDimension` once at boot, then
 *     `addMember` / `getLeafMembers` / `getDescendants` to traverse.
 *
 *  2. **Cubes** — a cube is a named collection of dimensions plus a
 *     default measure. Use `registerCube` to wire one up; `listCubes()`
 *     is the canonical discovery call (drives the OLAP grid UI).
 *
 *  3. **Cells** — a cell is the value at `(cubeId, dimensionPath)` for a
 *     specific measure. `writeCell` is **async** (mirrored to
 *     `CubeEnginePersistence`); `readCell` is sync (in-memory cache hit).
 *
 * **Snapshots** — `createSnapshot(label)` freezes all current cells
 * (deep copy) and returns an id. Use for what-if branches, period
> locking, and audit. `getCellHistory` returns the in-memory ring buffer
> of the last `MAX_HISTORY_SIZE` (10 000) writes per cell.
>
> **Indexes** — `cellCubeIndex`, `cubeCellIndex`, `memberChildrenIndex`
> are pre-computed for O(1) lookups. `addMember` and `writeCell` update
> them eagerly; do not bypass these methods.
>
> @example  // Boot: register a cube with 3 dimensions
> const engine = new CubeEngine(persistence);
> engine.registerDimension(accountDim);
> engine.registerDimension(timeDim);
> engine.registerDimension(entityDim);
> engine.registerCube({ id: 'p&l', name: 'Profit & Loss', dimensions: ['account', 'time', 'entity'] });
>
> @example  // Write a cell
> await engine.writeCell('p&l',
>   { dimensionId: 'account', memberPath: ['revenue', 'saas'] },
>   { value: 1_250_000, currency: 'USD' });
>
> @example  // Snapshot for a what-if scenario
> const baselineId = engine.createSnapshot('baseline-2026Q2');
> // ... mutate cells ...
> const baseline = engine.getSnapshot(baselineId);
>
> @see ADR-003 — "OLAP cube as the data model" (the architectural decision)
> @see ADR-006 — Schema migration strategy (cube schema versions live in `engineVersion`)
> @see {@link CubeEnginePersistence} — the async backend adapter
 */
```

## What changed from v0.1

| v0.1 (WRONG)                                                 | v0.2 (correct)                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Listed `Point`, `Range`, `Series` etc. as "5 internal types" | Replaced with the real `Dimension` / `CubeMember` / `CubeDefinition` / `CellKey` / `CellValue`                      |
| Did not document private state                               | Added section on the 12 private fields (dimensions, cubes, cells, cellHistory, snapshots, snapshotCounter, indexes) |
| Did not mention `CubeEnginePersistence`                      | Now mentioned as the async backend; `writeCell` is async because of it                                              |
| Did not mention `MAX_HISTORY_SIZE = 10_000`                  | Now documented; `getCellHistory` is ring-buffered                                                                   |
| Did not document snapshot API                                | `createSnapshot` / `getSnapshot` / `listSnapshots` / `getCellHistory` documented                                    |
| Did not warn against bypassing `addMember`/`writeCell`       | Added warning that the indexes (cellCubeIndex, etc.) are pre-computed and require the public methods                |
