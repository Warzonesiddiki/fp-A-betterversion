import { describe, it, expect, beforeEach } from 'vitest';
import {
  VersionControlEngine,
  type CellChange,
  type MergeConflict,
  type SerializedVersionControlState,
} from './VersionControlEngine';

// =============================================================================
// VERSION CONTROL ENGINE TESTS — 50+ tests
// =============================================================================

describe('VersionControlEngine', () => {
  let engine: VersionControlEngine;

  const sampleChange = (overrides: Partial<CellChange> = {}): CellChange => ({
    cube: 'budget',
    coords: { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
    measure: 'amount',
    oldValue: 100,
    newValue: 200,
    ...overrides,
  });

  const sampleChanges = (count: number, baseValue = 100): CellChange[] =>
    Array.from({ length: count }, (_, i) =>
      sampleChange({
        coords: { Account: `Account-${i}`, Entity: 'HQ', Period: '2026-01' },
        oldValue: baseValue,
        newValue: baseValue + (i + 1) * 10,
      })
    );

  beforeEach(() => {
    engine = new VersionControlEngine();
  });

  // =========================================================================
  // BRANCHING
  // =========================================================================

  describe('Branching', () => {
    it('should create a root branch', () => {
      const branch = engine.createBranch('main', 'Main branch', 'admin');
      expect(branch.id).toBeTruthy();
      expect(branch.name).toBe('main');
      expect(branch.description).toBe('Main branch');
      expect(branch.parentBranchId).toBeNull();
      expect(branch.createdBy).toBe('admin');
      expect(branch.createdAt).toBeTruthy();
    });

    it('should create a child branch from a parent', () => {
      const main = engine.createBranch('main', 'Main branch', 'admin');
      const feature = engine.createBranch('feature', 'Feature branch', 'analyst', main.id);
      expect(feature.parentBranchId).toBe(main.id);
    });

    it('should reject empty branch names', () => {
      expect(() => engine.createBranch('', 'desc', 'admin')).toThrow('Branch name cannot be empty');
      expect(() => engine.createBranch('   ', 'desc', 'admin')).toThrow(
        'Branch name cannot be empty'
      );
    });

    it('should reject duplicate branch names', () => {
      engine.createBranch('main', 'Main', 'admin');
      expect(() => engine.createBranch('main', 'Duplicate', 'admin')).toThrow(
        'Branch "main" already exists'
      );
    });

    it('should reject non-existent parent branch', () => {
      expect(() => engine.createBranch('feature', 'desc', 'admin', 'nonexistent')).toThrow(
        'Parent branch "nonexistent" not found'
      );
    });

    it('should clone parent snapshot to child branch', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Add data', 'admin', [sampleChange({ newValue: 500 })]);

      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);
      const val = engine.getSnapshotCellValue(
        feature.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(500);
    });

    it('should list all branches', () => {
      engine.createBranch('main', 'Main', 'admin');
      engine.createBranch('dev', 'Development', 'admin');
      engine.createBranch('staging', 'Staging', 'admin');
      expect(engine.listBranches()).toHaveLength(3);
    });

    it('should get branch by id', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      expect(engine.getBranch(branch.id)?.name).toBe('main');
    });

    it('should get branch by name', () => {
      engine.createBranch('main', 'Main', 'admin');
      const found = engine.getBranchByName('main');
      expect(found?.name).toBe('main');
    });

    it('should return undefined for non-existent branch', () => {
      expect(engine.getBranch('nonexistent')).toBeUndefined();
      expect(engine.getBranchByName('nonexistent')).toBeUndefined();
    });

    it('should count branches', () => {
      expect(engine.getBranchCount()).toBe(0);
      engine.createBranch('main', 'Main', 'admin');
      expect(engine.getBranchCount()).toBe(1);
      engine.createBranch('dev', 'Dev', 'admin');
      expect(engine.getBranchCount()).toBe(2);
    });

    it('should delete a branch', () => {
      const branch = engine.createBranch('feature', 'Feature', 'admin');
      engine.commit(branch.id, 'test', 'admin', [sampleChange()]);
      expect(engine.deleteBranch(branch.id)).toBe(true);
      expect(engine.getBranch(branch.id)).toBeUndefined();
      expect(engine.getBranchCount()).toBe(0);
    });

    it('should not delete a branch with children', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.createBranch('child', 'Child', 'admin', main.id);
      expect(() => engine.deleteBranch(main.id)).toThrow('it has child branches');
    });

    it('should return false when deleting non-existent branch', () => {
      expect(engine.deleteBranch('nonexistent')).toBe(false);
    });
  });

  // =========================================================================
  // COMMITS
  // =========================================================================

  describe('Commits', () => {
    let branchId: string;

    beforeEach(() => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      branchId = branch.id;
    });

    it('should create a commit', () => {
      const commit = engine.commit(branchId, 'Initial budget', 'analyst', [sampleChange()]);
      expect(commit.id).toBeTruthy();
      expect(commit.branchId).toBe(branchId);
      expect(commit.message).toBe('Initial budget');
      expect(commit.author).toBe('analyst');
      expect(commit.timestamp).toBeTruthy();
      expect(commit.cellChanges).toHaveLength(1);
      expect(commit.parentCommitId).toBeNull();
    });

    it('should chain commits with parent references', () => {
      const c1 = engine.commit(branchId, 'First', 'admin', [sampleChange()]);
      const c2 = engine.commit(branchId, 'Second', 'admin', [sampleChange({ newValue: 300 })]);
      expect(c2.parentCommitId).toBe(c1.id);
    });

    it('should reject empty commit message', () => {
      expect(() => engine.commit(branchId, '', 'admin', [sampleChange()])).toThrow(
        'Commit message cannot be empty'
      );
      expect(() => engine.commit(branchId, '   ', 'admin', [sampleChange()])).toThrow(
        'Commit message cannot be empty'
      );
    });

    it('should reject commit with no changes', () => {
      expect(() => engine.commit(branchId, 'Empty', 'admin', [])).toThrow(
        'Cannot commit with no changes'
      );
    });

    it('should reject commit on non-existent branch', () => {
      expect(() => engine.commit('nonexistent', 'msg', 'admin', [sampleChange()])).toThrow(
        'Branch "nonexistent" not found'
      );
    });

    it('should update branch snapshot after commit', () => {
      engine.commit(branchId, 'Add data', 'admin', [sampleChange()]);
      const val = engine.getSnapshotCellValue(
        branchId,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(200);
    });

    it('should accumulate changes across commits', () => {
      engine.commit(branchId, 'First', 'admin', [sampleChange({ newValue: 200 })]);
      engine.commit(branchId, 'Second', 'admin', [sampleChange({ newValue: 300 })]);
      const val = engine.getSnapshotCellValue(
        branchId,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(300);
    });

    it('should handle null (deletion) values', () => {
      engine.commit(branchId, 'Add', 'admin', [sampleChange({ newValue: 500 })]);
      engine.commit(branchId, 'Delete', 'admin', [sampleChange({ oldValue: 500, newValue: null })]);
      const val = engine.getSnapshotCellValue(
        branchId,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBeNull();
    });

    it('should get commit by id', () => {
      const commit = engine.commit(branchId, 'Test', 'admin', [sampleChange()]);
      const found = engine.getCommit(commit.id);
      expect(found?.message).toBe('Test');
    });

    it('should get all commits on a branch in order', () => {
      engine.commit(branchId, 'First', 'admin', [sampleChange()]);
      engine.commit(branchId, 'Second', 'admin', [sampleChange({ newValue: 300 })]);
      engine.commit(branchId, 'Third', 'admin', [sampleChange({ newValue: 400 })]);
      const commits = engine.getBranchCommits(branchId);
      expect(commits).toHaveLength(3);
      expect(commits![0]!.message).toBe('First');
      expect(commits![2]!.message).toBe('Third');
    });

    it('should count commits', () => {
      expect(engine.getCommitCount()).toBe(0);
      engine.commit(branchId, 'First', 'admin', [sampleChange()]);
      expect(engine.getCommitCount()).toBe(1);
    });

    it('should handle multiple cell changes in a single commit', () => {
      const changes = sampleChanges(5);
      engine.commit(branchId, 'Bulk update', 'admin', changes);
      const commits = engine.getBranchCommits(branchId);
      expect(commits![0]!.cellChanges).toHaveLength(5);
    });
  });

  // =========================================================================
  // DIFF
  // =========================================================================

  describe('Diff', () => {
    it('should show no changes between identical branches', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const branchA = engine.createBranch('a', 'Branch A', 'admin', main.id);
      const branchB = engine.createBranch('b', 'Branch B', 'admin', main.id);

      const diff = engine.diff(branchA.id, branchB.id);
      expect(diff.changes).toHaveLength(0);
    });

    it('should detect cell additions in one branch', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const feature = engine.createBranch('feature', 'Feature', 'admin', main.id);

      engine.commit(feature.id, 'Add data', 'admin', [sampleChange({ oldValue: null })]);

      const diff = engine.diff(main.id, feature.id);
      expect(diff.changes).toHaveLength(1);
      expect(diff!.changes[0]!.from).toBeNull();
      expect(diff!.changes[0]!.to).toBe(200);
    });

    it('should detect cell modifications', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 100 })]);

      const feature = engine.createBranch('feature', 'Feature', 'admin', main.id);
      engine.commit(feature.id, 'Change', 'admin', [
        sampleChange({ oldValue: 100, newValue: 250 }),
      ]);

      const diff = engine.diff(main.id, feature.id);
      expect(diff.changes).toHaveLength(1);
      expect(diff!.changes[0]!.from).toBe(100);
      expect(diff!.changes[0]!.to).toBe(250);
    });

    it('should detect cell deletions', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Add', 'admin', [sampleChange({ newValue: 500 })]);

      const feature = engine.createBranch('feature', 'Feature', 'admin', main.id);
      engine.commit(feature.id, 'Delete', 'admin', [
        sampleChange({ oldValue: 500, newValue: null }),
      ]);

      const diff = engine.diff(main.id, feature.id);
      expect(diff.changes).toHaveLength(1);
      expect(diff!.changes[0]!.from).toBe(500);
      expect(diff!.changes[0]!.to).toBeNull();
    });

    it('should diff between two commits', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const c1 = engine.commit(main.id, 'First', 'admin', [sampleChange({ newValue: 100 })]);
      const c2 = engine.commit(main.id, 'Second', 'admin', [
        sampleChange({ oldValue: 100, newValue: 200 }),
      ]);

      const diff = engine.diffCommits(c1.id, c2.id);
      expect(diff.changes).toHaveLength(1);
      expect(diff!.changes[0]!.from).toBe(100);
      expect(diff!.changes[0]!.to).toBe(200);
    });

    it('should throw for non-existent branches in diff', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      expect(() => engine.diff(main.id, 'nonexistent')).toThrow(
        'Both branches must exist for diff'
      );
    });

    it('should throw for non-existent commits in diffCommits', () => {
      expect(() => engine.diffCommits('a', 'b')).toThrow('Both commits must exist for diff');
    });

    it('should detect multiple changes across branches', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const a = engine.createBranch('a', 'A', 'admin', main.id);
      const b = engine.createBranch('b', 'B', 'admin', main.id);

      engine.commit(a.id, 'Change A', 'admin', [
        sampleChange({
          coords: { Account: 'A1', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 100,
        }),
      ]);
      engine.commit(b.id, 'Change B', 'admin', [
        sampleChange({
          coords: { Account: 'A2', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 200,
        }),
      ]);

      const diff = engine.diff(a.id, b.id);
      expect(diff.changes.length).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // MERGING
  // =========================================================================

  describe('Merge', () => {
    it('should auto-merge when no conflicts', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);

      engine.commit(feature.id, 'Add revenue', 'analyst', [sampleChange({ newValue: 500 })]);

      const result = engine.merge(feature.id, main.id, 'admin');
      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(result.mergedCells).toBe(1);
      expect(result.commitId).toBeTruthy();
    });

    it('should detect conflicts when same cell changed differently', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 100 })]);

      const branchA = engine.createBranch('a', 'A', 'user1', main.id);
      const branchB = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(branchA.id, 'A changes', 'user1', [
        sampleChange({ oldValue: 100, newValue: 200 }),
      ]);
      engine.commit(branchB.id, 'B changes', 'user2', [
        sampleChange({ oldValue: 100, newValue: 300 }),
      ]);

      const result = engine.merge(branchA.id, branchB.id, 'admin');
      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result!.conflicts[0]!.branchAValue).toBe(200);
      expect(result!.conflicts[0]!.branchBValue).toBe(300);
      expect(result!.conflicts[0]!.baseValue).toBe(100);
    });

    it('should auto-merge non-overlapping changes', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'A changes', 'user1', [
        sampleChange({
          coords: { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 100,
        }),
      ]);
      engine.commit(b.id, 'B changes', 'user2', [
        sampleChange({
          coords: { Account: 'COGS', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 200,
        }),
      ]);

      const result = engine.merge(a.id, b.id, 'admin');
      expect(result.success).toBe(true);
      expect(result.mergedCells).toBe(1);
    });

    it('should reject merge with non-existent source branch', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      expect(() => engine.merge('nonexistent', main.id, 'admin')).toThrow(
        'Source branch "nonexistent" not found'
      );
    });

    it('should reject merge with non-existent target branch', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      expect(() => engine.merge(main.id, 'nonexistent', 'admin')).toThrow(
        'Target branch "nonexistent" not found'
      );
    });

    it('should report no changes when merging identical branches', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const feature = engine.createBranch('feature', 'Feature', 'admin', main.id);

      const result = engine.merge(feature.id, main.id, 'admin');
      expect(result.success).toBe(true);
      expect(result.mergedCells).toBe(0);
      expect(result.commitId).toBeNull();
    });

    it('should detect conflict when both branches add to same cell', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'A adds', 'user1', [sampleChange({ oldValue: null, newValue: 100 })]);
      engine.commit(b.id, 'B adds', 'user2', [sampleChange({ oldValue: null, newValue: 200 })]);

      const result = engine.merge(a.id, b.id, 'admin');
      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
    });

    it('should handle merge when one branch deletes and other modifies', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Add', 'admin', [sampleChange({ newValue: 100 })]);

      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'Delete', 'user1', [sampleChange({ oldValue: 100, newValue: null })]);
      engine.commit(b.id, 'Update', 'user2', [sampleChange({ oldValue: 100, newValue: 200 })]);

      const result = engine.merge(a.id, b.id, 'admin');
      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(1);
      expect(result!.conflicts[0]!.branchAValue).toBeNull();
      expect(result!.conflicts[0]!.branchBValue).toBe(200);
    });

    it('should auto-merge when source changed but target did not', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 100 })]);

      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);
      engine.commit(feature.id, 'Update', 'analyst', [
        sampleChange({ oldValue: 100, newValue: 999 }),
      ]);

      // No changes on main after branching
      const result = engine.merge(feature.id, main.id, 'admin');
      expect(result.success).toBe(true);
      expect(result.mergedCells).toBe(1);
    });

    it('should update target snapshot after successful merge', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);

      engine.commit(feature.id, 'Add', 'analyst', [sampleChange({ newValue: 777 })]);
      engine.merge(feature.id, main.id, 'admin');

      const val = engine.getSnapshotCellValue(
        main.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(777);
    });
  });

  // =========================================================================
  // CONFLICT RESOLUTION
  // =========================================================================

  describe('Conflict Resolution', () => {
    it('should resolve conflicts with mergeWithResolutions', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 100 })]);

      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'A', 'user1', [sampleChange({ oldValue: 100, newValue: 200 })]);
      engine.commit(b.id, 'B', 'user2', [sampleChange({ oldValue: 100, newValue: 300 })]);

      const cellKey = 'budget::Account=Revenue;Entity=HQ;Period=2026-01::amount';
      const resolutions = new Map<string, null | number | string | boolean>();
      resolutions.set(cellKey, 250);

      const result = engine.mergeWithResolutions(a.id, b.id, 'admin', resolutions);
      expect(result.success).toBe(true);
      expect(result.mergedCells).toBe(1);
    });

    it('should throw if resolution missing for a conflict', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 100 })]);

      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'A', 'user1', [sampleChange({ oldValue: 100, newValue: 200 })]);
      engine.commit(b.id, 'B', 'user2', [sampleChange({ oldValue: 100, newValue: 300 })]);

      const emptyResolutions = new Map<string, null | number | string | boolean>();
      expect(() => engine.mergeWithResolutions(a.id, b.id, 'admin', emptyResolutions)).toThrow(
        'No resolution provided for conflict'
      );
    });

    it('should apply resolved value to target branch snapshot', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 100 })]);

      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'A', 'user1', [sampleChange({ oldValue: 100, newValue: 200 })]);
      engine.commit(b.id, 'B', 'user2', [sampleChange({ oldValue: 100, newValue: 300 })]);

      const cellKey = 'budget::Account=Revenue;Entity=HQ;Period=2026-01::amount';
      const resolutions = new Map<string, null | number | string | boolean>();
      resolutions.set(cellKey, 42);

      engine.mergeWithResolutions(a.id, b.id, 'admin', resolutions);

      const val = engine.getSnapshotCellValue(
        b.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(42);
    });
  });

  // =========================================================================
  // CONFLICT DETECTION (standalone)
  // =========================================================================

  describe('Conflict Detection', () => {
    it('should detect no conflicts between unrelated branches', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const a = engine.createBranch('a', 'A', 'admin', main.id);
      const b = engine.createBranch('b', 'B', 'admin', main.id);

      engine.commit(a.id, 'A', 'admin', [
        sampleChange({
          coords: { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 100,
        }),
      ]);
      engine.commit(b.id, 'B', 'admin', [
        sampleChange({
          coords: { Account: 'COGS', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 200,
        }),
      ]);

      const conflicts = engine.detectConflicts(a.id, b.id);
      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts at cell granularity', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [
        sampleChange({ newValue: 100 }),
        sampleChange({
          coords: { Account: 'COGS', Entity: 'HQ', Period: '2026-01' },
          newValue: 50,
        }),
      ]);

      // Both branches from main, but make main's latest snapshot the base
      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      // A changes only Revenue (COGS stays at 50 from base)
      engine.commit(a.id, 'A', 'user1', [sampleChange({ oldValue: 100, newValue: 200 })]);
      // B changes only Revenue (COGS stays at 50 from base)
      engine.commit(b.id, 'B', 'user2', [sampleChange({ oldValue: 100, newValue: 300 })]);

      const conflicts = engine.detectConflicts(a.id, b.id);
      // Only Revenue conflicts (both changed to different values)
      // COGS unchanged on both branches -> no conflict
      expect(conflicts).toHaveLength(1);
      expect(conflicts![0]!.coords.Account).toBe('Revenue');
    });

    it('should include base value in conflict report', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Base', 'admin', [sampleChange({ newValue: 42 })]);

      const a = engine.createBranch('a', 'A', 'user1', main.id);
      const b = engine.createBranch('b', 'B', 'user2', main.id);

      engine.commit(a.id, 'A', 'user1', [sampleChange({ oldValue: 42, newValue: 100 })]);
      engine.commit(b.id, 'B', 'user2', [sampleChange({ oldValue: 42, newValue: 200 })]);

      const conflicts = engine.detectConflicts(a.id, b.id);
      expect(conflicts![0]!.baseValue).toBe(42);
    });
  });

  // =========================================================================
  // HISTORY / TIMELINE
  // =========================================================================

  describe('History', () => {
    it('should return full timeline for a branch', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'First', 'admin', [sampleChange()]);
      engine.commit(branch.id, 'Second', 'admin', [sampleChange({ newValue: 300 })]);
      engine.commit(branch.id, 'Third', 'admin', [sampleChange({ newValue: 400 })]);

      const timeline = engine.getTimeline(branch.id);
      expect(timeline).toHaveLength(3);
      expect(timeline![0]!.message).toBe('First');
      expect(timeline![1]!.message).toBe('Second');
      expect(timeline![2]!.message).toBe('Third');
    });

    it('should return empty timeline for branch with no commits', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      expect(engine.getTimeline(branch.id)).toHaveLength(0);
    });

    it('should return cell-specific history', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'First', 'admin', [sampleChange({ newValue: 100 })]);
      engine.commit(branch.id, 'Second', 'admin', [sampleChange({ oldValue: 100, newValue: 200 })]);

      // Add a different cell change
      engine.commit(branch.id, 'Other cell', 'admin', [
        sampleChange({
          coords: { Account: 'COGS', Entity: 'HQ', Period: '2026-01' },
          oldValue: null,
          newValue: 50,
        }),
      ]);

      const history = engine.getCellHistory(
        branch.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(history).toHaveLength(2);
      expect(history![0]!.newValue).toBe(100);
      expect(history![1]!.newValue).toBe(200);
    });

    it('should isolate history between branches', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);

      engine.commit(main.id, 'Main commit', 'admin', [sampleChange({ newValue: 100 })]);
      engine.commit(feature.id, 'Feature commit', 'analyst', [
        sampleChange({ oldValue: null, newValue: 500 }),
      ]);

      const mainTimeline = engine.getTimeline(main.id);
      const featureTimeline = engine.getTimeline(feature.id);

      expect(mainTimeline).toHaveLength(1);
      expect(featureTimeline).toHaveLength(1);
      expect(mainTimeline![0]!.message).toBe('Main commit');
      expect(featureTimeline![0]!.message).toBe('Feature commit');
    });
  });

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  describe('Serialization', () => {
    it('should serialize and deserialize state', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Initial', 'admin', [sampleChange({ newValue: 100 })]);
      engine.commit(main.id, 'Update', 'admin', [sampleChange({ oldValue: 100, newValue: 200 })]);

      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);
      engine.commit(feature.id, 'Feature work', 'analyst', [
        sampleChange({ oldValue: 200, newValue: 300 }),
      ]);

      const serialized = engine.serialize();
      const restored = VersionControlEngine.deserialize(serialized);

      expect(restored.getBranchCount()).toBe(2);
      expect(restored.getCommitCount()).toBe(3);
      expect(
        restored
          .listBranches()
          .map((b) => b.name)
          .sort()
      ).toEqual(['feature', 'main']);
    });

    it('should preserve branch relationships after deserialization', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const _feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);

      const serialized = engine.serialize();
      const restored = VersionControlEngine.deserialize(serialized);

      const restoredFeature = restored.getBranchByName('feature');
      expect(restoredFeature?.parentBranchId).toBe(main.id);
    });

    it('should preserve commit order after deserialization', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'First', 'admin', [sampleChange({ newValue: 100 })]);
      engine.commit(main.id, 'Second', 'admin', [sampleChange({ oldValue: 100, newValue: 200 })]);

      const serialized = engine.serialize();
      const restored = VersionControlEngine.deserialize(serialized);

      const commits = restored.getBranchCommits(main.id);
      expect(commits).toHaveLength(2);
      expect(commits![0]!.message).toBe('First');
      expect(commits![1]!.message).toBe('Second');
    });

    it('should preserve snapshot data after deserialization', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      engine.commit(main.id, 'Add', 'admin', [sampleChange({ newValue: 42 })]);

      const serialized = engine.serialize();
      const restored = VersionControlEngine.deserialize(serialized);

      const val = restored.getSnapshotCellValue(
        main.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(42);
    });

    it('should handle empty engine serialization', () => {
      const serialized = engine.serialize();
      const restored = VersionControlEngine.deserialize(serialized);
      expect(restored.getBranchCount()).toBe(0);
      expect(restored.getCommitCount()).toBe(0);
    });
  });

  // =========================================================================
  // SNAPSHOT ACCESS
  // =========================================================================

  describe('Snapshot Access', () => {
    it('should read cell value from branch snapshot', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'Add', 'admin', [sampleChange({ newValue: 999 })]);

      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(999);
    });

    it('should return null for non-existent cell', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Unknown', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBeNull();
    });

    it('should return deep clone of commit snapshot', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      const commit = engine.commit(branch.id, 'Add', 'admin', [sampleChange({ newValue: 100 })]);

      const snap = engine.getCommitSnapshot(commit.id);
      expect(snap).toBeDefined();

      // Mutating the clone should not affect the engine
      if (snap) {
        snap.clear();
        const val = engine.getSnapshotCellValue(
          branch.id,
          'budget',
          { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
          'amount'
        );
        expect(val).toBe(100);
      }
    });

    it('should return undefined for non-existent commit snapshot', () => {
      expect(engine.getCommitSnapshot('nonexistent')).toBeUndefined();
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe('Edge Cases', () => {
    it('should handle boolean cell values', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'Bool', 'admin', [
        sampleChange({
          measure: 'isApproved',
          oldValue: null,
          newValue: true,
        }),
      ]);

      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'isApproved'
      );
      expect(val).toBe(true);
    });

    it('should handle string cell values', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'String', 'admin', [
        sampleChange({
          measure: 'comment',
          oldValue: null,
          newValue: 'Approved by CFO',
        }),
      ]);

      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'comment'
      );
      expect(val).toBe('Approved by CFO');
    });

    it('should handle zero as a valid cell value', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'Zero', 'admin', [sampleChange({ oldValue: 100, newValue: 0 })]);

      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(0);
    });

    it('should handle negative values', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'Negative', 'admin', [
        sampleChange({ oldValue: null, newValue: -500 }),
      ]);

      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(-500);
    });

    it('should handle coords with special characters', () => {
      const branch = engine.createBranch('main', 'Main', 'admin');
      engine.commit(branch.id, 'Special', 'admin', [
        sampleChange({
          coords: { Account: 'Rev & COGS', Entity: 'HQ/Sub', Period: '2026-01' },
          oldValue: null,
          newValue: 100,
        }),
      ]);

      const val = engine.getSnapshotCellValue(
        branch.id,
        'budget',
        { Account: 'Rev & COGS', Entity: 'HQ/Sub', Period: '2026-01' },
        'amount'
      );
      expect(val).toBe(100);
    });

    it('should handle many branches independently', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const branches = Array.from({ length: 10 }, (_, i) =>
        engine.createBranch(`branch-${i}`, `Branch ${i}`, 'admin', main.id)
      );

      branches.forEach((b, i) => {
        engine.commit(b.id, `Commit ${i}`, 'admin', [
          sampleChange({ oldValue: null, newValue: i * 100 }),
        ]);
      });

      branches.forEach((b, i) => {
        const val = engine.getSnapshotCellValue(
          b.id,
          'budget',
          { Account: 'Revenue', Entity: 'HQ', Period: '2026-01' },
          'amount'
        );
        expect(val).toBe(i * 100);
      });
    });

    it('should not share commit IDs between branches', () => {
      const main = engine.createBranch('main', 'Main', 'admin');
      const feature = engine.createBranch('feature', 'Feature', 'analyst', main.id);

      const c1 = engine.commit(main.id, 'Main', 'admin', [sampleChange({ newValue: 100 })]);
      const c2 = engine.commit(feature.id, 'Feature', 'analyst', [sampleChange({ newValue: 200 })]);

      expect(c1.id).not.toBe(c2.id);
    });
  });
});
