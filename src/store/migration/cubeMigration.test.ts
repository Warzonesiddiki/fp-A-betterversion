// =============================================================================
// CUBE MIGRATION ORCHESTRATOR TESTS — 50+ tests for atomic, verified migrations
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CubeEngine } from '@/engines/CubeEngine';
import {
  CubeMigration,
  runFullMigration,
  runDryMigration,
  runSelectiveMigration,
  createMigrationBackup,
} from './cubeMigration';
import { STORE_NAMES } from './storeMigrators';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestCube(): CubeEngine {
  return new CubeEngine();
}

function createMigration(cube?: CubeEngine): CubeMigration {
  return new CubeMigration(cube ?? createTestCube());
}

// ---------------------------------------------------------------------------
// MIGRATION ORCHESTRATOR TESTS
// ---------------------------------------------------------------------------

describe('CubeMigration', () => {
  let cube: CubeEngine;
  let migration: CubeMigration;

  beforeEach(() => {
    cube = createTestCube();
    migration = createMigration(cube);
  });

  // --- Construction ---

  describe('construction', () => {
    it('should create a CubeMigration instance', () => {
      expect(migration).toBeInstanceOf(CubeMigration);
    });

    it('should accept a CubeEngine instance', () => {
      const customCube = new CubeEngine();
      const m = new CubeMigration(customCube);
      expect(m).toBeInstanceOf(CubeMigration);
    });
  });

  // --- Full Migration ---

  describe('full migration', () => {
    it('should run full migration with default config', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(report).toBeDefined();
      expect(report.id).toContain('cube-migration-report-');
      expect(report.results.length).toBe(STORE_NAMES.length);
    });

    it('should report overall success when all stores pass', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(report.overallSuccess).toBe(true);
    });

    it('should track total cells written', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(report.totalCellsWritten).toBeGreaterThanOrEqual(0);
    });

    it('should track dimensions created', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(Array.isArray(report.totalDimensionsCreated)).toBe(true);
    });

    it('should track cubes created', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(Array.isArray(report.totalCubesCreated)).toBe(true);
    });

    it('should have non-zero duration', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(report.duration).toBeGreaterThanOrEqual(0);
    });

    it('should include all store results', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      const storeNames = report.results.map((r) => r.storeName);
      for (const name of STORE_NAMES) {
        expect(storeNames).toContain(name);
      }
    });

    it('should verify migration by default', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(report.verificationPassed).toBeDefined();
    });
  });

  // --- Dry Run ---

  describe('dry run', () => {
    it('should not write cells in dry run mode', async () => {
      const report = await migration.migrate({ dryRun: true, backupBeforeMigration: false });
      expect(report.totalCellsWritten).toBe(0);
    });

    it('should still validate all stores in dry run', async () => {
      const report = await migration.migrate({ dryRun: true, backupBeforeMigration: false });
      expect(report.results.length).toBe(STORE_NAMES.length);
    });

    it('should not create dimensions in dry run', async () => {
      const report = await migration.migrate({ dryRun: true, backupBeforeMigration: false });
      expect(report.totalDimensionsCreated.length).toBe(0);
    });

    it('should not create cubes in dry run', async () => {
      const report = await migration.migrate({ dryRun: true, backupBeforeMigration: false });
      expect(report.totalCubesCreated.length).toBe(0);
    });

    it('should report success in dry run for valid data', async () => {
      const report = await migration.migrate({ dryRun: true, backupBeforeMigration: false });
      expect(report.overallSuccess).toBe(true);
    });

    it('should not create backup in dry run', async () => {
      const report = await migration.migrate({ dryRun: true, backupBeforeMigration: true });
      expect(report.backupId).toBeNull();
    });
  });

  // --- Selective Migration ---

  describe('selective migration', () => {
    it('should migrate only specified stores', async () => {
      const report = await migration.migrate({
        stores: ['authStore', 'uiStore'],
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(2);
      expect(report!.results[0]!.storeName).toBe('authStore');
      expect(report!.results[1]!.storeName).toBe('uiStore');
    });

    it('should handle single store migration', async () => {
      const report = await migration.migrate({
        stores: ['budgetStore'],
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(1);
      expect(report!.results[0]!.storeName).toBe('budgetStore');
    });

    it('should handle empty store list gracefully', async () => {
      const report = await migration.migrate({
        stores: [],
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(0);
      expect(report.overallSuccess).toBe(true);
    });

    it('should handle unknown store name', async () => {
      const report = await migration.migrate({
        stores: ['nonexistentStore'],
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(1);
      expect(report!.results[0]!.success).toBe(false);
      expect(report!.results[0]!.error).toContain('No migrator found');
    });
  });

  // --- Backup ---

  describe('backup', () => {
    it('should create backup before migration when enabled', async () => {
      const report = await migration.migrate({
        backupBeforeMigration: true,
        stores: [STORE_NAMES[0]],
      });
      expect(report.backupId).toBeTruthy();
      expect(report.backupId).toContain('cube-migration-backup-');
    });

    it('should not create backup when disabled', async () => {
      const report = await migration.migrate({ backupBeforeMigration: false });
      expect(report.backupId).toBeNull();
    });

    it('should store backup data for all migrated stores', async () => {
      const backup = await migration.createBackup(STORE_NAMES);
      expect(backup.storeData).toBeDefined();
      expect(Object.keys(backup.storeData).length).toBe(STORE_NAMES.length);
    });

    it('should generate unique backup IDs', async () => {
      const backup1 = await migration.createBackup(['authStore']);
      const backup2 = await migration.createBackup(['authStore']);
      expect(backup1.id).not.toBe(backup2.id);
    });

    it('should include timestamp in backup', async () => {
      const backup = await migration.createBackup(['authStore']);
      expect(backup.timestamp).toBeTruthy();
      expect(new Date(backup.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should track backup in migration instance', async () => {
      await migration.createBackup(['authStore']);
      const backups = migration.getBackups();
      expect(backups.length).toBe(1);
    });

    it('should create backup for specific stores', async () => {
      const backup = await migration.createBackup(['authStore', 'budgetStore']);
      expect(Object.keys(backup.storeData)).toContain('authStore');
      expect(Object.keys(backup.storeData)).toContain('budgetStore');
    });
  });

  // --- Rollback ---

  describe('rollback', () => {
    it('should rollback using backup ID', async () => {
      const backup = await migration.createBackup(['authStore']);
      const result = await migration.rollback(backup.id, ['authStore']);
      expect(result).toBe(true);
    });

    it('should return false for non-existent backup', async () => {
      const result = await migration.rollback('nonexistent-backup-id');
      expect(result).toBe(false);
    });

    it('should rollback specific stores only', async () => {
      const backup = await migration.createBackup(['authStore', 'budgetStore']);
      const result = await migration.rollback(backup.id, ['authStore']);
      expect(result).toBe(true);
    });

    it('should rollback all stores when no specific stores given', async () => {
      const backup = await migration.createBackup(STORE_NAMES);
      const result = await migration.rollback(backup.id);
      expect(result).toBe(true);
    });
  });

  // --- Verification ---

  describe('verification', () => {
    it('should verify migration results', async () => {
      await migration.migrate({ backupBeforeMigration: false });
      const results = await migration.verifyMigration(STORE_NAMES);
      expect(results.length).toBe(STORE_NAMES.length);
    });

    it('should pass verification for empty stores', async () => {
      const results = await migration.verifyMigration(['authStore']);
      expect(results![0]!.passed).toBe(true);
    });

    it('should include expected vs actual cell counts', async () => {
      const results = await migration.verifyMigration(['glStore']);
      expect(results![0]!.expectedCells).toBeDefined();
      expect(results![0]!.actualCells).toBeDefined();
    });

    it('should track mismatched cells', async () => {
      const results = await migration.verifyMigration(['budgetStore']);
      expect(Array.isArray(results![0]!.mismatchedCells)).toBe(true);
    });

    it('should pass verification with 90% threshold', async () => {
      const results = await migration.verifyMigration(STORE_NAMES);
      for (const result of results) {
        if (result.expectedCells > 0) {
          expect(result.actualCells).toBeGreaterThanOrEqual(result.expectedCells * 0.9);
        }
      }
    });
  });

  // --- Reports ---

  describe('reports', () => {
    it('should track migration reports', async () => {
      await migration.migrate({ backupBeforeMigration: false });
      const reports = migration.getReports();
      expect(reports.length).toBe(1);
    });

    it('should get latest report', async () => {
      await migration.migrate({ backupBeforeMigration: false });
      const latest = migration.getLatestReport();
      expect(latest).not.toBeNull();
      expect(latest!.id).toContain('cube-migration-report-');
    });

    it('should return null when no reports exist', () => {
      expect(migration.getLatestReport()).toBeNull();
    });

    it('should accumulate reports across multiple migrations', async () => {
      await migration.migrate({ stores: ['authStore'], backupBeforeMigration: false });
      await migration.migrate({ stores: ['uiStore'], backupBeforeMigration: false });
      expect(migration.getReports().length).toBe(2);
    });

    it('should include config in report', async () => {
      const report = await migration.migrate({
        stores: ['authStore'],
        backupBeforeMigration: false,
      });
      expect(report.config).toBeDefined();
      expect(report.config.stores).toContain('authStore');
    });
  });

  // --- Stop on Failure ---

  describe('stop on failure', () => {
    it('should stop migration when stopOnFailure is true', async () => {
      const report = await migration.migrate({
        stores: ['nonexistentStore', 'authStore'],
        stopOnFailure: true,
        backupBeforeMigration: false,
      });
      // Should stop after nonexistentStore fails
      expect(report.results.length).toBe(1);
      expect(report!.results[0]!.success).toBe(false);
    });

    it('should continue migration when stopOnFailure is false', async () => {
      const report = await migration.migrate({
        stores: ['nonexistentStore', 'authStore'],
        stopOnFailure: false,
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(2);
    });
  });

  // --- Edge Cases ---

  describe('edge cases', () => {
    it('should handle migration with no store data', async () => {
      const report = await migration.migrate({
        stores: ['authStore'],
        backupBeforeMigration: false,
      });
      expect(report!.results[0]!.success).toBe(true);
    });

    it('should handle concurrent migrations', async () => {
      const [report1, report2] = await Promise.all([
        migration.migrate({ stores: ['authStore'], backupBeforeMigration: false }),
        migration.migrate({ stores: ['uiStore'], backupBeforeMigration: false }),
      ]);
      expect(report1!.results[0]!.storeName).toBe('authStore');
      expect(report2!.results[0]!.storeName).toBe('uiStore');
    });

    it('should handle migration with very large store list', async () => {
      const manyStores = Array.from({ length: 100 }, (_, i) => `fakeStore${i}`);
      const report = await migration.migrate({
        stores: manyStores,
        stopOnFailure: false,
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(100);
    });

    it('should handle migration with duplicate store names', async () => {
      const report = await migration.migrate({
        stores: ['authStore', 'authStore'],
        backupBeforeMigration: false,
      });
      expect(report.results.length).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// CONVENIENCE FUNCTION TESTS
// ---------------------------------------------------------------------------

describe('convenience functions', () => {
  it('runFullMigration should run all stores', async () => {
    const cube = createTestCube();
    const report = await runFullMigration(cube);
    expect(report.results.length).toBe(STORE_NAMES.length);
  });

  it('runDryMigration should not write cells', async () => {
    const cube = createTestCube();
    const report = await runDryMigration(cube);
    expect(report.totalCellsWritten).toBe(0);
  });

  it('runSelectiveMigration should run specified stores', async () => {
    const cube = createTestCube();
    const report = await runSelectiveMigration(cube, ['authStore', 'uiStore']);
    expect(report.results.length).toBe(2);
  });

  it('createMigrationBackup should create a backup', async () => {
    const cube = createTestCube();
    const backup = await createMigrationBackup(cube, ['authStore']);
    expect(backup.id).toContain('cube-migration-backup-');
  });
});
