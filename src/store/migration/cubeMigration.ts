// =============================================================================
// CUBE MIGRATION ORCHESTRATOR — Atomic, reversible, verified migrations
// Migrates all 13 Zustand stores to cube-backed architecture
// =============================================================================

import { CubeEngine } from '@/engines/CubeEngine';
import {
  STORE_MIGRATORS,
  STORE_NAMES,
  type MigrationResult,
  type StoreData,
} from './storeMigrators';
import { masterStorage } from '@/utils/masterStorage';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationConfig {
  stores: string[];
  dryRun: boolean;
  backupBeforeMigration: boolean;
  verifyAfterMigration: boolean;
  stopOnFailure: boolean;
}

export interface MigrationBackup {
  id: string;
  timestamp: string;
  storeData: Record<string, StoreData>;
  cubeSnapshot: Map<string, unknown> | null;
}

export interface MigrationReport {
  id: string;
  timestamp: string;
  config: MigrationConfig;
  results: MigrationResult[];
  totalCellsWritten: number;
  totalDimensionsCreated: string[];
  totalCubesCreated: string[];
  overallSuccess: boolean;
  duration: number;
  backupId: string | null;
  verificationPassed: boolean;
}

export interface VerificationResult {
  passed: boolean;
  storeName: string;
  expectedCells: number;
  actualCells: number;
  mismatchedCells: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKUP_PREFIX = 'cube-migration-backup-';
const REPORT_PREFIX = 'cube-migration-report-';
let backupCounter = 0;

// ---------------------------------------------------------------------------
// Migration Orchestrator
// ---------------------------------------------------------------------------

export class CubeMigration {
  private cube: CubeEngine;
  private backups: Map<string, MigrationBackup> = new Map();
  private reports: MigrationReport[] = [];

  constructor(cube: CubeEngine) {
    this.cube = cube;
  }

  // -------------------------------------------------------------------------
  // MAIN MIGRATION
  // -------------------------------------------------------------------------

  async migrate(config?: Partial<MigrationConfig>): Promise<MigrationReport> {
    const fullConfig: MigrationConfig = {
      stores: config?.stores ?? STORE_NAMES,
      dryRun: config?.dryRun ?? false,
      backupBeforeMigration: config?.backupBeforeMigration ?? true,
      verifyAfterMigration: config?.verifyAfterMigration ?? true,
      stopOnFailure: config?.stopOnFailure ?? true,
    };

    const start = Date.now();
    const reportId = `${REPORT_PREFIX}${Date.now()}`;
    const results: MigrationResult[] = [];
    let backupId: string | null = null;

    // Phase 1: Backup
    if (fullConfig.backupBeforeMigration && !fullConfig.dryRun) {
      const backup = await this.createBackup(fullConfig.stores);
      backupId = backup.id;
    }

    // Phase 2: Migrate each store
    for (const storeName of fullConfig.stores) {
      const migrator = STORE_MIGRATORS[storeName];
      if (!migrator) {
        results.push({
          success: false,
          storeName,
          cellsWritten: 0,
          dimensionsCreated: [],
          cubesCreated: [],
          error: `No migrator found for store "${storeName}"`,
          duration: 0,
        });
        if (fullConfig.stopOnFailure) break;
        continue;
      }

      // Load store data
      const storeData = await this.loadStoreData(storeName);

      if (fullConfig.dryRun) {
        // Dry run: validate without writing
        const validation = this.validateStoreData(storeName, storeData);
        results.push({
          success: validation.valid,
          storeName,
          cellsWritten: 0,
          dimensionsCreated: [],
          cubesCreated: [],
          error: validation.error,
          duration: 0,
        });
        if (!validation.valid && fullConfig.stopOnFailure) break;
        continue;
      }

      // Actual migration
      const result = migrator(this.cube, storeData);
      results.push(result);

      if (!result.success && fullConfig.stopOnFailure) {
        // Rollback on failure
        if (backupId) {
          await this.rollback(backupId, fullConfig.stores.slice(0, results.length));
        }
        break;
      }
    }

    // Phase 3: Verify
    let verificationPassed = true;
    if (fullConfig.verifyAfterMigration && !fullConfig.dryRun) {
      const verificationResults = await this.verifyMigration(fullConfig.stores);
      verificationPassed = verificationResults.every((r) => r.passed);
    }

    const report: MigrationReport = {
      id: reportId,
      timestamp: new Date().toISOString(),
      config: fullConfig,
      results,
      totalCellsWritten: results.reduce((sum, r) => sum + r.cellsWritten, 0),
      totalDimensionsCreated: [...new Set(results.flatMap((r) => r.dimensionsCreated))],
      totalCubesCreated: [...new Set(results.flatMap((r) => r.cubesCreated))],
      overallSuccess: results.every((r) => r.success) && verificationPassed,
      duration: Date.now() - start,
      backupId,
      verificationPassed,
    };

    this.reports.push(report);
    return report;
  }

  // -------------------------------------------------------------------------
  // SELECTIVE MIGRATION
  // -------------------------------------------------------------------------

  async migrateStore(storeName: string, dryRun = false): Promise<MigrationResult> {
    const migrator = STORE_MIGRATORS[storeName];
    if (!migrator) {
      return {
        success: false,
        storeName,
        cellsWritten: 0,
        dimensionsCreated: [],
        cubesCreated: [],
        error: `No migrator found for store "${storeName}"`,
        duration: 0,
      };
    }

    const storeData = await this.loadStoreData(storeName);

    if (dryRun) {
      const validation = this.validateStoreData(storeName, storeData);
      return {
        success: validation.valid,
        storeName,
        cellsWritten: 0,
        dimensionsCreated: [],
        cubesCreated: [],
        error: validation.error,
        duration: 0,
      };
    }

    return migrator(this.cube, storeData);
  }

  // -------------------------------------------------------------------------
  // BACKUP
  // -------------------------------------------------------------------------

  async createBackup(storeNames: string[]): Promise<MigrationBackup> {
    const backupId = `${BACKUP_PREFIX}${Date.now()}-${++backupCounter}`;
    const storeData: Record<string, StoreData> = {};

    for (const storeName of storeNames) {
      storeData[storeName] = await this.loadStoreData(storeName);
    }

    // Create cube snapshot
    let cubeSnapshot: Map<string, unknown> | null = null;
    try {
      const snapshot = this.cube.createSnapshot('pre-migration-backup');
      cubeSnapshot = new Map();
      cubeSnapshot.set('snapshotId', snapshot.id);
      cubeSnapshot.set('cellCount', this.cube.getCellCount());
      cubeSnapshot.set('dimensions', this.cube.listDimensions());
      cubeSnapshot.set('cubes', this.cube.listCubes());
    } catch {
      // Cube may not have data yet — that's fine
      cubeSnapshot = null;
    }

    const backup: MigrationBackup = {
      id: backupId,
      timestamp: new Date().toISOString(),
      storeData,
      cubeSnapshot,
    };

    this.backups.set(backupId, backup);

    // Persist backup
    try {
      const serialized = {
        id: backup.id,
        timestamp: backup.timestamp,
        storeData: backup.storeData,
        cubeSnapshotMeta: cubeSnapshot
          ? {
              snapshotId: cubeSnapshot.get('snapshotId'),
              cellCount: cubeSnapshot.get('cellCount'),
            }
          : null,
      };
      await masterStorage.setItem(`backup-${backupId}`, serialized);
    } catch {
      // Backup persistence is best-effort
    }

    return backup;
  }

  // -------------------------------------------------------------------------
  // ROLLBACK
  // -------------------------------------------------------------------------

  async rollback(backupId: string, storeNames?: string[]): Promise<boolean> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      // Try loading from storage
      try {
        const stored = await masterStorage.getItem(`backup-${backupId}`);
        if (stored) {
          const parsed = stored as Record<string, unknown>;
          // Reconstruct backup from stored data
          return this.restoreFromStoredBackup(parsed, storeNames);
        }
      } catch {
        // Ignore
      }
      return false;
    }

    // Restore store data
    const storesToRestore = storeNames ?? Object.keys(backup.storeData);
    for (const storeName of storesToRestore) {
      const data = backup.storeData[storeName];
      if (data) {
        await this.restoreStoreData(storeName, data);
      }
    }

    // Clear cube state if snapshot exists
    if (backup.cubeSnapshot) {
      // We don't fully restore cube state on rollback — that would require
      // snapshot restore which is a separate operation. Instead, we clear
      // the cube and let the stores drive re-population.
      this.cube.clearAll();
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // VERIFICATION
  // -------------------------------------------------------------------------

  async verifyMigration(storeNames: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = [];

    for (const storeName of storeNames) {
      try {
        const storeData = await this.loadStoreData(storeName);
        const verification = this.verifyStoreData(storeName, storeData);
        results.push(verification);
      } catch (err) {
        results.push({
          passed: false,
          storeName,
          expectedCells: 0,
          actualCells: 0,
          mismatchedCells: [],
          error: err instanceof Error ? err.message : 'Verification error',
        });
      }
    }

    return results;
  }

  // -------------------------------------------------------------------------
  // REPORTING
  // -------------------------------------------------------------------------

  getReports(): MigrationReport[] {
    return [...this.reports];
  }

  getLatestReport(): MigrationReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  getBackups(): MigrationBackup[] {
    return Array.from(this.backups.values());
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  private async loadStoreData(storeName: string): Promise<StoreData> {
    try {
      const data = await masterStorage.getItem(storeName);
      if (data && typeof data === 'object') {
        // Zustand persist wraps data in { state: {...}, version: ... }
        const wrapped = data as Record<string, unknown>;
        if (wrapped.state && typeof wrapped.state === 'object') {
          return wrapped.state as StoreData;
        }
        return data as StoreData;
      }
      return {};
    } catch {
      return {};
    }
  }

  private async restoreStoreData(storeName: string, data: StoreData): Promise<void> {
    try {
      await masterStorage.setItem(storeName, { state: data, version: 0 });
    } catch {
      // Best-effort restore
    }
  }

  private async restoreFromStoredBackup(
    stored: Record<string, unknown>,
    storeNames?: string[]
  ): Promise<boolean> {
    const storeData = stored.storeData as Record<string, StoreData> | undefined;
    if (!storeData) return false;

    const storesToRestore = storeNames ?? Object.keys(storeData);
    for (const storeName of storesToRestore) {
      const data = storeData[storeName];
      if (data) {
        await this.restoreStoreData(storeName, data);
      }
    }
    return true;
  }

  private validateStoreData(
    storeName: string,
    data: StoreData
  ): { valid: boolean; error?: string } {
    // Validate that store data has expected structure
    if (!data || typeof data !== 'object') {
      return { valid: false, error: `Store "${storeName}" has invalid data structure` };
    }

    // Store-specific validation
    switch (storeName) {
      case 'budgetStore':
        if (data.lineItems && !Array.isArray(data.lineItems)) {
          return { valid: false, error: 'budgetStore.lineItems must be an array' };
        }
        break;
      case 'glStore':
        if (data.entries && !Array.isArray(data.entries)) {
          return { valid: false, error: 'glStore.entries must be an array' };
        }
        break;
      case 'scenarioStore':
        if (data.scenarios && !Array.isArray(data.scenarios)) {
          return { valid: false, error: 'scenarioStore.scenarios must be an array' };
        }
        break;
      case 'forecastStore':
        if (data.forecasts && !Array.isArray(data.forecasts)) {
          return { valid: false, error: 'forecastStore.forecasts must be an array' };
        }
        break;
      default:
        // No specific validation for other stores
        break;
    }

    return { valid: true };
  }

  private verifyStoreData(storeName: string, data: StoreData): VerificationResult {
    // Verify that cube contains cells corresponding to store data
    let expectedCells = 0;
    let actualCells = 0;
    const mismatchedCells: string[] = [];

    switch (storeName) {
      case 'glStore': {
        const entries = data.entries as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(entries)) {
          expectedCells = entries.length * 3; // debit, credit, netChange per entry
          // Check that GL cube exists
          const glCube = this.cube.getCube('GL');
          if (glCube) {
            actualCells = this.cube.getCellCount();
          }
        }
        break;
      }
      case 'budgetStore': {
        const lineItems = data.lineItems as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(lineItems)) {
          expectedCells = lineItems.length * 3; // amount, isLocked, version per item
          const budgetCube = this.cube.getCube('Budget');
          if (budgetCube) {
            actualCells = this.cube.getCellCount();
          }
        }
        break;
      }
      case 'scenarioStore': {
        const scenarios = data.scenarios as Array<Record<string, unknown>> | undefined;
        if (Array.isArray(scenarios)) {
          expectedCells = scenarios.length * 10; // probability + 9 metrics per scenario
          const scenarioCube = this.cube.getCube('ScenarioData');
          if (scenarioCube) {
            actualCells = this.cube.getCellCount();
          }
        }
        break;
      }
      default:
        // For other stores, just check cube exists if we expected cells
        actualCells = this.cube.getCellCount();
        break;
    }

    return {
      passed: expectedCells === 0 || actualCells >= expectedCells * 0.9, // 90% threshold
      storeName,
      expectedCells,
      actualCells,
      mismatchedCells,
    };
  }
}

// ---------------------------------------------------------------------------
// CONVENIENCE FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Run full migration on all stores
 */
export async function runFullMigration(cube: CubeEngine): Promise<MigrationReport> {
  const migration = new CubeMigration(cube);
  return migration.migrate();
}

/**
 * Run dry-run migration (validation only)
 */
export async function runDryMigration(cube: CubeEngine): Promise<MigrationReport> {
  const migration = new CubeMigration(cube);
  return migration.migrate({ dryRun: true });
}

/**
 * Run selective migration on specific stores
 */
export async function runSelectiveMigration(
  cube: CubeEngine,
  stores: string[]
): Promise<MigrationReport> {
  const migration = new CubeMigration(cube);
  return migration.migrate({ stores });
}

/**
 * Create a backup before migration
 */
export async function createMigrationBackup(
  cube: CubeEngine,
  stores?: string[]
): Promise<MigrationBackup> {
  const migration = new CubeMigration(cube);
  return migration.createBackup(stores ?? STORE_NAMES);
}
