// =============================================================================
// VERSION CONTROL ENGINE — Git-like versioning for budgets
// Pure TypeScript, deterministic, testable
// =============================================================================

// --- Type Definitions ---

export type CellValue = number | string | boolean | null;

export interface CellChange {
  readonly cube: string;
  readonly coords: Record<string, string>;
  readonly measure: string;
  readonly oldValue: CellValue;
  readonly newValue: CellValue;
}

export interface VersionBranch {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly parentBranchId: string | null;
  readonly baseSnapshotId: string;
  readonly createdAt: string;
  readonly createdBy: string;
}

export interface VersionCommit {
  readonly id: string;
  readonly branchId: string;
  readonly message: string;
  readonly author: string;
  readonly timestamp: string;
  readonly cellChanges: readonly CellChange[];
  readonly parentCommitId: string | null;
}

export interface MergeConflict {
  readonly cube: string;
  readonly coords: Record<string, string>;
  readonly measure: string;
  readonly branchAValue: CellValue;
  readonly branchBValue: CellValue;
  readonly baseValue: CellValue;
}

export interface MergeResult {
  readonly success: boolean;
  readonly conflicts: readonly MergeConflict[];
  readonly mergedCells: number;
  readonly commitId: string | null;
}

export interface DiffEntry {
  readonly cube: string;
  readonly coords: Record<string, string>;
  readonly measure: string;
  readonly from: CellValue;
  readonly to: CellValue;
  readonly branch: string;
}

export interface VersionDiff {
  readonly changes: readonly DiffEntry[];
}

export interface CellSnapshot {
  readonly value: CellValue;
}

export type SerializedVersionControlState = {
  branches: VersionBranch[];
  commits: VersionCommit[];
  snapshots: Record<string, Record<string, CellSnapshot>>;
  branchCommitOrder: Record<string, string[]>;
};

// --- Engine ---

export class VersionControlEngine {
  private branches = new Map<string, VersionBranch>();
  private commits = new Map<string, VersionCommit>();
  private snapshots = new Map<string, Map<string, CellSnapshot>>();
  private branchCommitOrder = new Map<string, string[]>();
  private idCounter = 0;

  // --- Helpers ---

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${++this.idCounter}`;
  }

  private cellKey(cube: string, coords: Record<string, string>, measure: string): string {
    const coordStr = Object.entries(coords)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(';');
    return `${cube}::${coordStr}::${measure}`;
  }

  private parseCellKey(key: string): {
    cube: string;
    coords: Record<string, string>;
    measure: string;
  } {
    const parts = key.split('::');
    const cube = parts[0]!;
    const measure = parts[2]!;
    const coords: Record<string, string> = {};
    if (parts[1]!) {
      for (const pair of parts[1]!.split(';')) {
        const [k, v] = pair.split('=');
        if (k && v !== undefined) coords[k] = v!;
      }
    }
    return { cube, coords, measure };
  }

  private deepCloneSnapshot(snapshot: Map<string, CellSnapshot>): Map<string, CellSnapshot> {
    const clone = new Map<string, CellSnapshot>();
    snapshot.forEach((value, key) => {
      clone.set(key, { ...value });
    });
    return clone;
  }

  private collectKeys(...maps: Map<string, CellSnapshot>[]): string[] {
    const keySet = new Set<string>();
    for (const map of maps) {
      map.forEach((_value, key) => {
        keySet.add(key);
      });
    }
    return Array.from(keySet);
  }

  private now(): string {
    return new Date().toISOString();
  }

  // --- Branch Management ---

  createBranch(
    name: string,
    description: string,
    createdBy: string,
    parentBranchId?: string
  ): VersionBranch {
    if (name.trim() === '') {
      throw new Error('Branch name cannot be empty');
    }

    // Check for duplicate name
    this.branches.forEach((branch) => {
      if (branch.name === name) {
        throw new Error(`Branch "${name}" already exists`);
      }
    });

    let baseSnapshotId: string;

    if (parentBranchId) {
      const parentBranch = this.branches.get(parentBranchId);
      if (!parentBranch) {
        throw new Error(`Parent branch "${parentBranchId}" not found`);
      }
      // Clone parent's latest snapshot
      const parentSnapshot = this.getBranchSnapshot(parentBranchId);
      baseSnapshotId = this.generateId('snap');
      this.snapshots.set(baseSnapshotId, parentSnapshot);
    } else {
      // Create from empty state (root branch)
      baseSnapshotId = this.generateId('snap');
      this.snapshots.set(baseSnapshotId, new Map());
    }

    const branch: VersionBranch = {
      id: this.generateId('branch'),
      name,
      description,
      parentBranchId: parentBranchId ?? null,
      baseSnapshotId,
      createdAt: this.now(),
      createdBy,
    };

    this.branches.set(branch.id, branch);
    this.branchCommitOrder.set(branch.id, []);

    return branch;
  }

  getBranch(branchId: string): VersionBranch | undefined {
    return this.branches.get(branchId);
  }

  getBranchByName(name: string): VersionBranch | undefined {
    let found: VersionBranch | undefined;
    this.branches.forEach((branch) => {
      if (branch.name === name) found = branch;
    });
    return found;
  }

  listBranches(): VersionBranch[] {
    return Array.from(this.branches.values());
  }

  // --- Commit Operations ---

  commit(
    branchId: string,
    message: string,
    author: string,
    cellChanges: CellChange[]
  ): VersionCommit {
    const branch = this.branches.get(branchId);
    if (!branch) {
      throw new Error(`Branch "${branchId}" not found`);
    }

    if (message.trim() === '') {
      throw new Error('Commit message cannot be empty');
    }

    if (cellChanges.length === 0) {
      throw new Error('Cannot commit with no changes');
    }

    const order = this.branchCommitOrder.get(branchId) ?? [];
    const parentCommitId = order.length > 0 ? order[order.length - 1]! : null;

    const commit: VersionCommit = {
      id: this.generateId('commit'),
      branchId,
      message,
      author,
      timestamp: this.now(),
      cellChanges: [...cellChanges],
      parentCommitId,
    };

    this.commits.set(commit.id, commit);
    order.push(commit.id);
    this.branchCommitOrder.set(branchId, order);

    // Update the branch snapshot with committed changes
    const snapshot = this.getBranchSnapshot(branchId);
    for (const change of cellChanges) {
      const key = this.cellKey(change.cube, change.coords, change.measure);
      if (change.newValue === null) {
        snapshot.delete(key);
      } else {
        snapshot.set(key, { value: change.newValue });
      }
    }

    // Store updated snapshot linked to this commit
    this.snapshots.set(commit.id, this.deepCloneSnapshot(snapshot));

    return commit;
  }

  getCommit(commitId: string): VersionCommit | undefined {
    return this.commits.get(commitId);
  }

  getBranchCommits(branchId: string): VersionCommit[] {
    const order = this.branchCommitOrder.get(branchId) ?? [];
    return order.map((id) => this.commits.get(id)!).filter(Boolean);
  }

  getCommitSnapshot(commitId: string): Map<string, CellSnapshot> | undefined {
    const snapshot = this.snapshots.get(commitId);
    if (!snapshot) return undefined;
    return this.deepCloneSnapshot(snapshot);
  }

  // --- Snapshot Access ---

  private getBranchSnapshot(branchId: string): Map<string, CellSnapshot> {
    const order = this.branchCommitOrder.get(branchId) ?? [];
    if (order.length === 0) {
      const branch = this.branches.get(branchId);
      if (!branch) return new Map();
      const base = this.snapshots.get(branch.baseSnapshotId);
      return base ? this.deepCloneSnapshot(base) : new Map();
    }
    const lastCommitId = order[order.length - 1]!;
    const snap = this.snapshots.get(lastCommitId);
    return snap ? this.deepCloneSnapshot(snap) : new Map();
  }

  // --- Diff ---

  diff(branchAId: string, branchBId: string): VersionDiff {
    const snapshotA = this.getBranchSnapshot(branchAId);
    const snapshotB = this.getBranchSnapshot(branchBId);

    const branchA = this.branches.get(branchAId);
    const branchB = this.branches.get(branchBId);
    if (!branchA || !branchB) {
      throw new Error('Both branches must exist for diff');
    }

    const allKeys = this.collectKeys(snapshotA, snapshotB);
    const changes: DiffEntry[] = [];

    for (const key of allKeys) {
      const valA = snapshotA.get(key)?.value ?? null;
      const valB = snapshotB.get(key)?.value ?? null;

      if (valA !== valB) {
        const { cube, coords, measure } = this.parseCellKey(key);
        changes.push({
          cube,
          coords,
          measure,
          from: valA,
          to: valB,
          branch: branchB.name,
        });
      }
    }

    return { changes };
  }

  diffCommits(commitAId: string, commitBId: string): VersionDiff {
    const snapshotA = this.snapshots.get(commitAId);
    const snapshotB = this.snapshots.get(commitBId);
    if (!snapshotA || !snapshotB) {
      throw new Error('Both commits must exist for diff');
    }

    const allKeys = this.collectKeys(snapshotA, snapshotB);
    const changes: DiffEntry[] = [];

    for (const key of allKeys) {
      const valA = snapshotA.get(key)?.value ?? null;
      const valB = snapshotB.get(key)?.value ?? null;

      if (valA !== valB) {
        const { cube, coords, measure } = this.parseCellKey(key);
        changes.push({
          cube,
          coords,
          measure,
          from: valA,
          to: valB,
          branch: '',
        });
      }
    }

    return { changes };
  }

  // --- Merge ---

  merge(sourceBranchId: string, targetBranchId: string, author: string): MergeResult {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    if (!sourceBranch) throw new Error(`Source branch "${sourceBranchId}" not found`);
    if (!targetBranch) throw new Error(`Target branch "${targetBranchId}" not found`);

    // Find merge base (common ancestor)
    const baseSnapshot = this.findMergeBase(sourceBranchId, targetBranchId);
    const sourceSnapshot = this.getBranchSnapshot(sourceBranchId);
    const targetSnapshot = this.getBranchSnapshot(targetBranchId);

    const allKeys = this.collectKeys(baseSnapshot, sourceSnapshot, targetSnapshot);

    const conflicts: MergeConflict[] = [];
    const mergedChanges: CellChange[] = [];

    for (const key of allKeys) {
      const baseVal = baseSnapshot.get(key)?.value ?? null;
      const sourceVal = sourceSnapshot.get(key)?.value ?? null;
      const targetVal = targetSnapshot.get(key)?.value ?? null;

      const sourceChanged = sourceVal !== baseVal;
      const targetChanged = targetVal !== baseVal;

      if (sourceChanged && targetChanged && sourceVal !== targetVal) {
        // Conflict: both branches changed the same cell to different values
        const { cube, coords, measure } = this.parseCellKey(key);
        conflicts.push({
          cube,
          coords,
          measure,
          branchAValue: sourceVal,
          branchBValue: targetVal,
          baseValue: baseVal,
        });
      } else if (sourceChanged && sourceVal !== targetVal) {
        // Source changed, target did not (or same change) - auto-merge
        const { cube, coords, measure } = this.parseCellKey(key);
        mergedChanges.push({
          cube,
          coords,
          measure,
          oldValue: targetVal,
          newValue: sourceVal,
        });
      }
      // If only target changed or neither changed, keep target's value (no action needed)
    }

    if (conflicts.length > 0) {
      return {
        success: false,
        conflicts,
        mergedCells: 0,
        commitId: null,
      };
    }

    // Auto-merge: apply source changes to target
    if (mergedChanges.length > 0) {
      const mergeCommit = this.commit(
        targetBranchId,
        `Merge branch "${sourceBranch.name}" into "${targetBranch.name}"`,
        author,
        mergedChanges
      );

      return {
        success: true,
        conflicts: [],
        mergedCells: mergedChanges.length,
        commitId: mergeCommit.id,
      };
    }

    // No changes to merge
    return {
      success: true,
      conflicts: [],
      mergedCells: 0,
      commitId: null,
    };
  }

  mergeWithResolutions(
    sourceBranchId: string,
    targetBranchId: string,
    author: string,
    resolutions: Map<string, CellValue>
  ): MergeResult {
    const sourceBranch = this.branches.get(sourceBranchId);
    const targetBranch = this.branches.get(targetBranchId);
    if (!sourceBranch) throw new Error(`Source branch "${sourceBranchId}" not found`);
    if (!targetBranch) throw new Error(`Target branch "${targetBranchId}" not found`);

    const baseSnapshot = this.findMergeBase(sourceBranchId, targetBranchId);
    const sourceSnapshot = this.getBranchSnapshot(sourceBranchId);
    const targetSnapshot = this.getBranchSnapshot(targetBranchId);

    const allKeys = this.collectKeys(baseSnapshot, sourceSnapshot, targetSnapshot);

    const mergedChanges: CellChange[] = [];

    for (const key of allKeys) {
      const baseVal = baseSnapshot.get(key)?.value ?? null;
      const sourceVal = sourceSnapshot.get(key)?.value ?? null;
      const targetVal = targetSnapshot.get(key)?.value ?? null;

      const sourceChanged = sourceVal !== baseVal;
      const targetChanged = targetVal !== baseVal;

      if (sourceChanged && targetChanged && sourceVal !== targetVal) {
        // This is a conflict - resolve using provided resolutions
        const resolvedValue = resolutions.get(key);
        if (resolvedValue === undefined) {
          throw new Error(`No resolution provided for conflict at key "${key}"`);
        }
        const { cube, coords, measure } = this.parseCellKey(key);
        mergedChanges.push({
          cube,
          coords,
          measure,
          oldValue: targetVal,
          newValue: resolvedValue,
        });
      } else if (sourceChanged && sourceVal !== targetVal) {
        const { cube, coords, measure } = this.parseCellKey(key);
        mergedChanges.push({
          cube,
          coords,
          measure,
          oldValue: targetVal,
          newValue: sourceVal,
        });
      }
    }

    if (mergedChanges.length > 0) {
      const mergeCommit = this.commit(
        targetBranchId,
        `Merge branch "${sourceBranch.name}" into "${targetBranch.name}" (with conflict resolutions)`,
        author,
        mergedChanges
      );

      return {
        success: true,
        conflicts: [],
        mergedCells: mergedChanges.length,
        commitId: mergeCommit.id,
      };
    }

    return {
      success: true,
      conflicts: [],
      mergedCells: 0,
      commitId: null,
    };
  }

  private findMergeBase(branchAId: string, branchBId: string): Map<string, CellSnapshot> {
    const branchA = this.branches.get(branchAId);
    const branchB = this.branches.get(branchBId);
    if (!branchA || !branchB) return new Map();

    // Walk up the ancestry to find the common ancestor
    const ancestorsA = this.getBranchAncestry(branchAId);
    const ancestorsB = this.getBranchAncestry(branchBId);

    // Find the most recent common ancestor branch
    for (const a of ancestorsA) {
      if (ancestorsB.includes(a)) {
        // Use this ancestor branch's snapshot as merge base
        return this.getBranchSnapshot(a);
      }
    }

    // If no common ancestor, use empty snapshot
    return new Map();
  }

  private getBranchAncestry(branchId: string): string[] {
    const ancestry: string[] = [branchId];
    let current = this.branches.get(branchId);
    while (current?.parentBranchId) {
      ancestry.push(current.parentBranchId);
      current = this.branches.get(current.parentBranchId);
    }
    return ancestry;
  }

  // --- Conflict Detection (standalone) ---

  detectConflicts(branchAId: string, branchBId: string): MergeConflict[] {
    const baseSnapshot = this.findMergeBase(branchAId, branchBId);
    const snapshotA = this.getBranchSnapshot(branchAId);
    const snapshotB = this.getBranchSnapshot(branchBId);

    const allKeys = this.collectKeys(baseSnapshot, snapshotA, snapshotB);

    const conflicts: MergeConflict[] = [];

    for (const key of allKeys) {
      const baseVal = baseSnapshot.get(key)?.value ?? null;
      const valA = snapshotA.get(key)?.value ?? null;
      const valB = snapshotB.get(key)?.value ?? null;

      const aChanged = valA !== baseVal;
      const bChanged = valB !== baseVal;

      if (aChanged && bChanged && valA !== valB) {
        const { cube, coords, measure } = this.parseCellKey(key);
        conflicts.push({
          cube,
          coords,
          measure,
          branchAValue: valA,
          branchBValue: valB,
          baseValue: baseVal,
        });
      }
    }

    return conflicts;
  }

  // --- History ---

  getTimeline(branchId: string): VersionCommit[] {
    return this.getBranchCommits(branchId);
  }

  getCellHistory(
    branchId: string,
    cube: string,
    coords: Record<string, string>,
    measure: string
  ): CellChange[] {
    const commits = this.getBranchCommits(branchId);
    const key = this.cellKey(cube, coords, measure);
    const changes: CellChange[] = [];

    for (const commit of commits) {
      for (const change of commit.cellChanges) {
        const changeKey = this.cellKey(change.cube, change.coords, change.measure);
        if (changeKey === key) {
          changes.push(change);
        }
      }
    }

    return changes;
  }

  // --- Serialization ---

  serialize(): SerializedVersionControlState {
    const snapshotsObj: Record<string, Record<string, CellSnapshot>> = {};
    this.snapshots.forEach((snapMap, id) => {
      const obj: Record<string, CellSnapshot> = {};
      snapMap.forEach((val, key) => {
        obj[key] = { ...val };
      });
      snapshotsObj[id] = obj;
    });

    const orderObj: Record<string, string[]> = {};
    this.branchCommitOrder.forEach((order, branchId) => {
      orderObj[branchId] = [...order];
    });

    return {
      branches: Array.from(this.branches.values()),
      commits: Array.from(this.commits.values()),
      snapshots: snapshotsObj,
      branchCommitOrder: orderObj,
    };
  }

  static deserialize(data: SerializedVersionControlState): VersionControlEngine {
    const engine = new VersionControlEngine();

    for (const branch of data.branches) {
      engine.branches.set(branch.id, branch);
    }

    for (const commit of data.commits) {
      engine.commits.set(commit.id, commit);
    }

    for (const [id, snapObj] of Object.entries(data.snapshots)) {
      const snapMap = new Map<string, CellSnapshot>();
      for (const [key, val] of Object.entries(snapObj)) {
        snapMap.set(key, { ...val });
      }
      engine.snapshots.set(id, snapMap);
    }

    for (const [branchId, order] of Object.entries(data.branchCommitOrder)) {
      engine.branchCommitOrder.set(branchId, [...order]);
    }

    return engine;
  }

  // --- Utilities ---

  getSnapshotCellValue(
    branchId: string,
    cube: string,
    coords: Record<string, string>,
    measure: string
  ): CellValue {
    const snapshot = this.getBranchSnapshot(branchId);
    const key = this.cellKey(cube, coords, measure);
    return snapshot.get(key)?.value ?? null;
  }

  getBranchCount(): number {
    return this.branches.size;
  }

  getCommitCount(): number {
    return this.commits.size;
  }

  deleteBranch(branchId: string): boolean {
    const branch = this.branches.get(branchId);
    if (!branch) return false;

    // Check if any other branch uses this as parent
    this.branches.forEach((other) => {
      if (other.parentBranchId === branchId) {
        throw new Error(`Cannot delete branch "${branch.name}": it has child branches`);
      }
    });

    // Clean up commits
    const order = this.branchCommitOrder.get(branchId) ?? [];
    for (const commitId of order) {
      this.commits.delete(commitId);
      this.snapshots.delete(commitId);
    }

    this.snapshots.delete(branch.baseSnapshotId);
    this.branchCommitOrder.delete(branchId);
    this.branches.delete(branchId);

    return true;
  }
}
