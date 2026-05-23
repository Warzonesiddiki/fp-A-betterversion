// =============================================================================
// STORE MIGRATORS — Transform each store's data to cube-backed format
// Each migrator converts store-specific data into CubeEngine cells
// =============================================================================

import { CubeEngine } from '@/engines/CubeEngine';
import type {
  CubeCell,
  CubeDefinition,
  DimensionDefinition,
  MeasureDefinition,
} from '@/types/cube-types';
import type { PersistStorage } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MigrationResult {
  success: boolean;
  storeName: string;
  cellsWritten: number;
  dimensionsCreated: string[];
  cubesCreated: string[];
  error?: string;
  duration: number;
}

export interface RollbackResult {
  success: boolean;
  storeName: string;
  error?: string;
}

export type StoreData = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cellKey(cube: string, coords: Record<string, string>, measure: string): string {
  const sortedCoords = Object.keys(coords)
    .sort()
    .map((k) => `${k}=${coords[k]}`)
    .join('|');
  return `${cube}|${sortedCoords}|${measure}`;
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// AUTH STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateAuthStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    // Register User dimension if not exists
    if (!cube.getDimension('User')) {
      cube.registerDimension('User', 'user', [
        { name: 'default', levels: ['user'], effectiveDating: false },
      ]);
      dimsCreated.push('User');
    }

    // Ensure Scenario dimension exists
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    // Register Auth cube
    if (!cube.getCube('Auth')) {
      cube.registerCube(
        'Auth',
        ['User', 'Scenario'],
        [
          { name: 'isAuthenticated', dataType: 'boolean', aggregation: 'none' },
          { name: 'mfaRequired', dataType: 'boolean', aggregation: 'none' },
          { name: 'activeEntityId', dataType: 'text', aggregation: 'none' },
        ]
      );
      cubesCreated.push('Auth');
    }

    // Migrate user data
    const user = data.user as Record<string, unknown> | null;
    if (user && typeof user === 'object') {
      const userId = String(user.id ?? 'current');
      if (!cube.getMember('User', `User:${userId}`)) {
        cube.addMember('User', {
          code: userId,
          name: String(user.email ?? 'Unknown'),
          hierarchy: 'default',
          level: 0,
          isLeaf: true,
          isActive: true,
          attributes: {},
        });
      }

      const coords = { User: `User:${userId}`, Scenario: 'Scenario:base' };

      cube.writeCell('Auth', {
        coords,
        measure: 'isAuthenticated',
        value: Boolean(data.isAuthenticated),
        dataType: 'input',
      });
      cellsWritten++;

      cube.writeCell('Auth', {
        coords,
        measure: 'mfaRequired',
        value: Boolean(data.mfaRequired),
        dataType: 'input',
      });
      cellsWritten++;

      cube.writeCell('Auth', {
        coords,
        measure: 'activeEntityId',
        value: String(data.activeEntityId ?? ''),
        dataType: 'input',
      });
      cellsWritten++;
    }

    return {
      success: true,
      storeName: 'authStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'authStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// SETTINGS STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateSettingsStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    // Register Settings dimension
    if (!cube.getDimension('Settings')) {
      cube.registerDimension('Settings', 'user', [
        { name: 'default', levels: ['setting'], effectiveDating: false },
      ]);
      dimsCreated.push('Settings');
    }

    // Ensure Scenario dimension exists
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    // Register Settings cube
    if (!cube.getCube('Settings')) {
      cube.registerCube(
        'Settings',
        ['Settings', 'Scenario'],
        [
          { name: 'fiscalYear', dataType: 'numeric', aggregation: 'none' },
          { name: 'baseCurrency', dataType: 'text', aggregation: 'none' },
          { name: 'decimalPlaces', dataType: 'numeric', aggregation: 'none' },
          { name: 'calendarType', dataType: 'text', aggregation: 'none' },
          { name: 'timezone', dataType: 'text', aggregation: 'none' },
          { name: 'dateFormat', dataType: 'text', aggregation: 'none' },
          { name: 'activeSector', dataType: 'text', aggregation: 'none' },
        ]
      );
      cubesCreated.push('Settings');
    }

    const org = data.organization as Record<string, unknown> | undefined;
    if (org) {
      if (!cube.getMember('Settings', 'Settings:org')) {
        cube.addMember('Settings', {
          code: 'org',
          name: 'Organization',
          hierarchy: 'default',
          level: 0,
          isLeaf: true,
          isActive: true,
          attributes: {},
        });
      }

      const coords = { Settings: 'Settings:org', Scenario: 'Scenario:base' };
      const settingsFields = [
        { measure: 'fiscalYear', value: Number(org.fiscalYear ?? 2024) },
        { measure: 'baseCurrency', value: String(org.baseCurrency ?? 'USD') },
        { measure: 'decimalPlaces', value: Number(org.decimalPlaces ?? 2) },
        { measure: 'calendarType', value: String(org.calendarType ?? 'Standard') },
        { measure: 'timezone', value: String(org.timezone ?? '') },
        { measure: 'dateFormat', value: String(org.dateFormat ?? 'MM/DD/YYYY') },
      ];

      for (const field of settingsFields) {
        cube.writeCell('Settings', {
          coords,
          measure: field.measure,
          value: field.value,
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    // Migrate preferences
    const prefs = data.preferences as Record<string, unknown> | undefined;
    if (prefs) {
      if (!cube.getMember('Settings', 'Settings:prefs')) {
        cube.addMember('Settings', {
          code: 'prefs',
          name: 'Preferences',
          hierarchy: 'default',
          level: 0,
          isLeaf: true,
          isActive: true,
          attributes: {},
        });
      }

      const coords = { Settings: 'Settings:prefs', Scenario: 'Scenario:base' };
      cube.writeCell('Settings', {
        coords,
        measure: 'activeSector',
        value: String(prefs.activeSector ?? 'technology'),
        dataType: 'input',
      });
      cellsWritten++;
    }

    // Migrate users array
    const users = data.users as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(users)) {
      for (const user of users) {
        const uid = String(user.id ?? generateId('usr'));
        if (!cube.getMember('User', `User:${uid}`)) {
          if (!cube.getDimension('User')) {
            cube.registerDimension('User', 'user', [
              { name: 'default', levels: ['user'], effectiveDating: false },
            ]);
            dimsCreated.push('User');
          }
          cube.addMember('User', {
            code: uid,
            name: String(user.email ?? 'Unknown'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {
              firstName: String(user.firstName ?? ''),
              lastName: String(user.lastName ?? ''),
              role: String(user.role ?? 'Viewer'),
              department: String(user.department ?? ''),
              status: String(user.status ?? 'Pending'),
            },
          });
        }
      }
    }

    return {
      success: true,
      storeName: 'settingsStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'settingsStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// BUDGET STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateBudgetStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    // Ensure Account dimension exists
    if (!cube.getDimension('Account')) {
      cube.registerDimension('Account', 'system', [
        { name: 'reporting', levels: ['category', 'account'], effectiveDating: false },
      ]);
      dimsCreated.push('Account');
    }

    // Ensure Scenario dimension exists
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    // Register Budget cube
    if (!cube.getCube('Budget')) {
      cube.registerCube(
        'Budget',
        ['Account', 'Scenario'],
        [
          { name: 'amount', dataType: 'numeric', precision: 2, aggregation: 'sum', currency: true },
          { name: 'isLocked', dataType: 'boolean', aggregation: 'none' },
          { name: 'version', dataType: 'numeric', aggregation: 'none' },
        ]
      );
      cubesCreated.push('Budget');
    }

    // Migrate line items
    const lineItems = data.lineItems as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(lineItems)) {
      for (const item of lineItems) {
        const accountId = String(item.accountId ?? '');
        const accountCode = String(item.accountCode ?? '');
        const accountName = String(item.accountName ?? '');
        const budgetId = String(item.budgetId ?? 'default');

        // Add account member
        const memberId = `Account:${accountId}`;
        if (!cube.getMember('Account', memberId)) {
          cube.addMember('Account', {
            code: accountId,
            name: accountName || accountCode,
            hierarchy: 'reporting',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: { code: accountCode },
          });
        }

        // Add budget scenario member
        const scenarioId = `budget-${budgetId}`;
        if (!cube.getMember('Scenario', `Scenario:${scenarioId}`)) {
          cube.addMember('Scenario', {
            code: scenarioId,
            name: `Budget ${budgetId}`,
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = {
          Account: memberId,
          Scenario: `Scenario:${scenarioId}`,
        };

        cube.writeCell('Budget', {
          coords,
          measure: 'amount',
          value: Number(item.amount ?? 0),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('Budget', {
          coords,
          measure: 'isLocked',
          value: Boolean(item.isLocked),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('Budget', {
          coords,
          measure: 'version',
          value: Number(item.version ?? 1),
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    return {
      success: true,
      storeName: 'budgetStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'budgetStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// FORECAST STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateForecastStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Account')) {
      cube.registerDimension('Account', 'system', [
        { name: 'reporting', levels: ['category', 'account'], effectiveDating: false },
      ]);
      dimsCreated.push('Account');
    }

    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    if (!cube.getCube('Forecast')) {
      cube.registerCube(
        'Forecast',
        ['Account', 'Scenario'],
        [
          { name: 'baseValue', dataType: 'numeric', precision: 2, aggregation: 'sum' },
          { name: 'currentValue', dataType: 'numeric', precision: 2, aggregation: 'sum' },
          { name: 'confidenceLevel', dataType: 'text', aggregation: 'none' },
          { name: 'rollingWindowMonths', dataType: 'numeric', aggregation: 'none' },
        ]
      );
      cubesCreated.push('Forecast');
    }

    // Migrate drivers
    const drivers = data.drivers as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(drivers)) {
      for (const driver of drivers) {
        const driverId = String(driver.id ?? generateId('drv'));
        if (!cube.getMember('Scenario', `Scenario:${driverId}`)) {
          cube.addMember('Scenario', {
            code: driverId,
            name: String(driver.name ?? 'Driver'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: { driverType: String(driver.driverType ?? 'Custom') },
          });
        }

        const affectedIds = driver.affectedAccountIds as string[] | undefined;
        if (Array.isArray(affectedIds)) {
          for (const acctId of affectedIds) {
            if (!cube.getMember('Account', `Account:${acctId}`)) {
              cube.addMember('Account', {
                code: acctId,
                name: acctId,
                hierarchy: 'reporting',
                level: 0,
                isLeaf: true,
                isActive: true,
                attributes: {},
              });
            }

            const coords = {
              Account: `Account:${acctId}`,
              Scenario: `Scenario:${driverId}`,
            };

            cube.writeCell('Forecast', {
              coords,
              measure: 'baseValue',
              value: Number(driver.baseValue ?? 0),
              dataType: 'input',
            });
            cellsWritten++;

            cube.writeCell('Forecast', {
              coords,
              measure: 'currentValue',
              value: Number(driver.currentValue ?? 0),
              dataType: 'input',
            });
            cellsWritten++;
          }
        }
      }
    }

    return {
      success: true,
      storeName: 'forecastStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'forecastStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// GL STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateGlStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Account')) {
      cube.registerDimension('Account', 'system', [
        { name: 'reporting', levels: ['category', 'account'], effectiveDating: false },
      ]);
      dimsCreated.push('Account');
    }

    if (!cube.getDimension('Time')) {
      cube.registerDimension('Time', 'system', [
        { name: 'calendar', levels: ['year', 'quarter', 'month', 'day'], effectiveDating: false },
      ]);
      dimsCreated.push('Time');
    }

    if (!cube.getDimension('Entity')) {
      cube.registerDimension('Entity', 'system', [
        { name: 'legal', levels: ['group', 'entity'], effectiveDating: false },
      ]);
      dimsCreated.push('Entity');
    }

    if (!cube.getDimension('DataSource')) {
      cube.registerDimension('DataSource', 'system', [
        { name: 'default', levels: ['source'], effectiveDating: false },
      ]);
      dimsCreated.push('DataSource');
    }

    if (!cube.getCube('GL')) {
      cube.registerCube(
        'GL',
        ['Account', 'Time', 'Entity', 'DataSource'],
        [
          { name: 'debit', dataType: 'numeric', precision: 2, aggregation: 'sum', currency: true },
          { name: 'credit', dataType: 'numeric', precision: 2, aggregation: 'sum', currency: true },
          {
            name: 'netChange',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
        ]
      );
      cubesCreated.push('GL');
    }

    // Migrate GL entries
    const entries = data.entries as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const accountId = String(entry.accountId ?? '');
        const accountCode = String(entry.accountCode ?? '');
        const accountName = String(entry.accountName ?? '');
        const period = String(entry.period ?? '');
        const entityId = String(entry.entityId ?? 'default');

        // Add account member
        if (!cube.getMember('Account', `Account:${accountId}`)) {
          cube.addMember('Account', {
            code: accountId,
            name: accountName || accountCode,
            hierarchy: 'reporting',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: { code: accountCode },
          });
        }

        // Add time member
        if (period && !cube.getMember('Time', `Time:${period}`)) {
          cube.addMember('Time', {
            code: period,
            name: period,
            hierarchy: 'calendar',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        // Add entity member
        if (!cube.getMember('Entity', `Entity:${entityId}`)) {
          cube.addMember('Entity', {
            code: entityId,
            name: entityId,
            hierarchy: 'legal',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        // Add data source
        if (!cube.getMember('DataSource', 'DataSource:gl')) {
          cube.addMember('DataSource', {
            code: 'gl',
            name: 'GL Import',
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = {
          Account: `Account:${accountId}`,
          Time: `Time:${period}`,
          Entity: `Entity:${entityId}`,
          DataSource: 'DataSource:gl',
        };

        cube.writeCell('GL', {
          coords,
          measure: 'debit',
          value: Number(entry.debit ?? 0),
          dataType: 'imported',
        });
        cellsWritten++;

        cube.writeCell('GL', {
          coords,
          measure: 'credit',
          value: Number(entry.credit ?? 0),
          dataType: 'imported',
        });
        cellsWritten++;

        cube.writeCell('GL', {
          coords,
          measure: 'netChange',
          value: Number(entry.netChange ?? 0),
          dataType: 'imported',
        });
        cellsWritten++;
      }
    }

    return {
      success: true,
      storeName: 'glStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'glStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// SCENARIO STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateScenarioStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    if (!cube.getCube('ScenarioData')) {
      cube.registerCube(
        'ScenarioData',
        ['Scenario'],
        [
          { name: 'probability', dataType: 'numeric', aggregation: 'none' },
          {
            name: 'revenue',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          { name: 'ebitda', dataType: 'numeric', precision: 2, aggregation: 'sum', currency: true },
          {
            name: 'netIncome',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          {
            name: 'cashFlow',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          { name: 'headcount', dataType: 'numeric', aggregation: 'sum' },
          {
            name: 'burnRate',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          { name: 'runway', dataType: 'numeric', aggregation: 'none' },
          { name: 'grossMargin', dataType: 'numeric', aggregation: 'none' },
          { name: 'ebitdaMargin', dataType: 'numeric', aggregation: 'none' },
        ]
      );
      cubesCreated.push('ScenarioData');
    }

    const scenarios = data.scenarios as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(scenarios)) {
      for (const scenario of scenarios) {
        const scenarioId = String(scenario.id ?? generateId('scn'));
        if (!cube.getMember('Scenario', `Scenario:${scenarioId}`)) {
          cube.addMember('Scenario', {
            code: scenarioId,
            name: String(scenario.name ?? 'Scenario'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: Boolean(scenario.isActive),
            attributes: { type: String(scenario.type ?? 'Custom') },
          });
        }

        const coords = { Scenario: `Scenario:${scenarioId}` };

        cube.writeCell('ScenarioData', {
          coords,
          measure: 'probability',
          value: Number(scenario.probability ?? 0),
          dataType: 'input',
        });
        cellsWritten++;

        const metrics = scenario.calculatedMetrics as Record<string, unknown> | undefined;
        if (metrics) {
          const metricFields = [
            'revenue',
            'ebitda',
            'netIncome',
            'cashFlow',
            'headcount',
            'burnRate',
            'runway',
            'grossMargin',
            'ebitdaMargin',
          ];
          for (const field of metricFields) {
            cube.writeCell('ScenarioData', {
              coords,
              measure: field,
              value: Number(metrics[field] ?? 0),
              dataType: 'calculated',
            });
            cellsWritten++;
          }
        }
      }
    }

    return {
      success: true,
      storeName: 'scenarioStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'scenarioStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// REPORT STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateReportStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Report')) {
      cube.registerDimension('Report', 'user', [
        { name: 'default', levels: ['report'], effectiveDating: false },
      ]);
      dimsCreated.push('Report');
    }

    // Ensure Scenario dimension exists
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    if (!cube.getCube('ReportData')) {
      cube.registerCube(
        'ReportData',
        ['Report', 'Scenario'],
        [
          { name: 'reportType', dataType: 'text', aggregation: 'none' },
          { name: 'format', dataType: 'text', aggregation: 'none' },
          { name: 'frequency', dataType: 'text', aggregation: 'none' },
          { name: 'isActive', dataType: 'boolean', aggregation: 'none' },
        ]
      );
      cubesCreated.push('ReportData');
    }

    const reports = data.reports as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(reports)) {
      for (const report of reports) {
        const reportId = String(report.id ?? generateId('rpt'));
        if (!cube.getMember('Report', `Report:${reportId}`)) {
          cube.addMember('Report', {
            code: reportId,
            name: String(report.name ?? 'Report'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = { Report: `Report:${reportId}`, Scenario: 'Scenario:base' };
        cube.writeCell('ReportData', {
          coords,
          measure: 'reportType',
          value: String(report.type ?? ''),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('ReportData', {
          coords,
          measure: 'format',
          value: String(report.format ?? ''),
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    const scheduled = data.scheduledReports as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(scheduled)) {
      for (const sched of scheduled) {
        const schedId = String(sched.id ?? generateId('sch'));
        if (!cube.getMember('Report', `Report:${schedId}`)) {
          cube.addMember('Report', {
            code: schedId,
            name: `Scheduled: ${schedId}`,
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: Boolean(sched.isActive),
            attributes: {},
          });
        }

        const coords = { Report: `Report:${schedId}`, Scenario: 'Scenario:base' };
        cube.writeCell('ReportData', {
          coords,
          measure: 'frequency',
          value: String(sched.frequency ?? ''),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('ReportData', {
          coords,
          measure: 'isActive',
          value: Boolean(sched.isActive),
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    return {
      success: true,
      storeName: 'reportStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'reportStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// VARIANCE STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateVarianceStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Account')) {
      cube.registerDimension('Account', 'system', [
        { name: 'reporting', levels: ['category', 'account'], effectiveDating: false },
      ]);
      dimsCreated.push('Account');
    }

    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    if (!cube.getCube('Variance')) {
      cube.registerCube(
        'Variance',
        ['Account', 'Scenario'],
        [
          {
            name: 'budgetAmount',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          {
            name: 'actualAmount',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          {
            name: 'forecastAmount',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          {
            name: 'dollarVariance',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          { name: 'percentVariance', dataType: 'numeric', aggregation: 'none' },
          {
            name: 'rateVariance',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
          {
            name: 'volumeVariance',
            dataType: 'numeric',
            precision: 2,
            aggregation: 'sum',
            currency: true,
          },
        ]
      );
      cubesCreated.push('Variance');
    }

    const analyses = data.analyses as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(analyses)) {
      for (const analysis of analyses) {
        const accountId = String(analysis.accountId ?? '');
        const analysisId = String(analysis.id ?? generateId('var'));

        if (!cube.getMember('Account', `Account:${accountId}`)) {
          cube.addMember('Account', {
            code: accountId,
            name: String(analysis.accountName ?? ''),
            hierarchy: 'reporting',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: { code: String(analysis.accountCode ?? '') },
          });
        }

        const scenarioId = `var-${analysisId}`;
        if (!cube.getMember('Scenario', `Scenario:${scenarioId}`)) {
          cube.addMember('Scenario', {
            code: scenarioId,
            name: `Variance ${analysisId}`,
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = {
          Account: `Account:${accountId}`,
          Scenario: `Scenario:${scenarioId}`,
        };

        const fields = [
          'budgetAmount',
          'actualAmount',
          'forecastAmount',
          'dollarVariance',
          'percentVariance',
          'rateVariance',
          'volumeVariance',
        ];
        for (const field of fields) {
          cube.writeCell('Variance', {
            coords,
            measure: field,
            value: Number(analysis[field] ?? 0),
            dataType: 'calculated',
          });
          cellsWritten++;
        }
      }
    }

    return {
      success: true,
      storeName: 'varianceStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'varianceStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// NOTIFICATION STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateNotificationStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Notification')) {
      cube.registerDimension('Notification', 'user', [
        { name: 'default', levels: ['notification'], effectiveDating: false },
      ]);
      dimsCreated.push('Notification');
    }

    if (!cube.getCube('NotificationData')) {
      cube.registerCube(
        'NotificationData',
        ['Notification'],
        [
          { name: 'type', dataType: 'text', aggregation: 'none' },
          { name: 'title', dataType: 'text', aggregation: 'none' },
          { name: 'message', dataType: 'text', aggregation: 'none' },
          { name: 'isRead', dataType: 'boolean', aggregation: 'none' },
        ]
      );
      cubesCreated.push('NotificationData');
    }

    const notifications = data.notifications as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(notifications)) {
      for (const notif of notifications) {
        const notifId = String(notif.id ?? generateId('notif'));
        if (!cube.getMember('Notification', `Notification:${notifId}`)) {
          cube.addMember('Notification', {
            code: notifId,
            name: String(notif.title ?? 'Notification'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = { Notification: `Notification:${notifId}` };
        cube.writeCell('NotificationData', {
          coords,
          measure: 'type',
          value: String(notif.type ?? 'info'),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('NotificationData', {
          coords,
          measure: 'title',
          value: String(notif.title ?? ''),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('NotificationData', {
          coords,
          measure: 'isRead',
          value: Boolean(notif.isRead),
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    return {
      success: true,
      storeName: 'notificationStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'notificationStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// COLLABORATION STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateCollaborationStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Collaboration')) {
      cube.registerDimension('Collaboration', 'user', [
        { name: 'default', levels: ['item'], effectiveDating: false },
      ]);
      dimsCreated.push('Collaboration');
    }

    // Ensure Scenario dimension exists
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    if (!cube.getCube('CollaborationData')) {
      cube.registerCube(
        'CollaborationData',
        ['Collaboration', 'Scenario'],
        [
          { name: 'itemType', dataType: 'text', aggregation: 'none' },
          { name: 'status', dataType: 'text', aggregation: 'none' },
          { name: 'priority', dataType: 'text', aggregation: 'none' },
        ]
      );
      cubesCreated.push('CollaborationData');
    }

    // Migrate comments
    const comments = data.comments as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(comments)) {
      for (const comment of comments) {
        const commentId = String(comment.id ?? generateId('cmt'));
        if (!cube.getMember('Collaboration', `Collaboration:${commentId}`)) {
          cube.addMember('Collaboration', {
            code: commentId,
            name: `Comment: ${commentId}`,
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = { Collaboration: `Collaboration:${commentId}`, Scenario: 'Scenario:base' };
        cube.writeCell('CollaborationData', {
          coords,
          measure: 'itemType',
          value: 'comment',
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    // Migrate tasks
    const tasks = data.tasks as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(tasks)) {
      for (const task of tasks) {
        const taskId = String(task.id ?? generateId('tsk'));
        if (!cube.getMember('Collaboration', `Collaboration:${taskId}`)) {
          cube.addMember('Collaboration', {
            code: taskId,
            name: String(task.title ?? 'Task'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = { Collaboration: `Collaboration:${taskId}`, Scenario: 'Scenario:base' };
        cube.writeCell('CollaborationData', {
          coords,
          measure: 'itemType',
          value: 'task',
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('CollaborationData', {
          coords,
          measure: 'status',
          value: String(task.status ?? 'Todo'),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('CollaborationData', {
          coords,
          measure: 'priority',
          value: String(task.priority ?? 'Medium'),
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    return {
      success: true,
      storeName: 'collaborationStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'collaborationStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// DATA STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateDataStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Account')) {
      cube.registerDimension('Account', 'system', [
        { name: 'reporting', levels: ['category', 'account'], effectiveDating: false },
      ]);
      dimsCreated.push('Account');
    }

    if (!cube.getCube('AccountData')) {
      cube.registerCube(
        'AccountData',
        ['Account'],
        [
          { name: 'accountType', dataType: 'text', aggregation: 'none' },
          { name: 'category', dataType: 'text', aggregation: 'none' },
          { name: 'level', dataType: 'numeric', aggregation: 'none' },
          { name: 'isActive', dataType: 'boolean', aggregation: 'none' },
          { name: 'isCalculated', dataType: 'boolean', aggregation: 'none' },
        ]
      );
      cubesCreated.push('AccountData');
    }

    const accounts = data.accounts as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(accounts)) {
      const migrateAccountList = (list: Array<Record<string, unknown>>) => {
        for (const acct of list) {
          const acctId = String(acct.id ?? generateId('acct'));
          if (!cube.getMember('Account', `Account:${acctId}`)) {
            cube.addMember('Account', {
              code: acctId,
              name: String(acct.name ?? ''),
              hierarchy: 'reporting',
              level: Number(acct.level ?? 0),
              isLeaf: !Array.isArray(acct.children) || (acct.children as unknown[]).length === 0,
              isActive: Boolean(acct.isActive ?? true),
              attributes: {
                code: String(acct.code ?? ''),
                type: String(acct.type ?? ''),
                category: String(acct.category ?? ''),
              },
            });
          }

          const coords = { Account: `Account:${acctId}` };
          cube.writeCell('AccountData', {
            coords,
            measure: 'accountType',
            value: String(acct.type ?? ''),
            dataType: 'input',
          });
          cellsWritten++;

          cube.writeCell('AccountData', {
            coords,
            measure: 'level',
            value: Number(acct.level ?? 0),
            dataType: 'input',
          });
          cellsWritten++;

          cube.writeCell('AccountData', {
            coords,
            measure: 'isActive',
            value: Boolean(acct.isActive ?? true),
            dataType: 'input',
          });
          cellsWritten++;

          // Recurse into children
          const children = acct.children as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(children) && children.length > 0) {
            migrateAccountList(children);
          }
        }
      };

      migrateAccountList(accounts);
    }

    return {
      success: true,
      storeName: 'dataStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'dataStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// TOUR STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateTourStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Tour')) {
      cube.registerDimension('Tour', 'user', [
        { name: 'default', levels: ['tour'], effectiveDating: false },
      ]);
      dimsCreated.push('Tour');
    }

    if (!cube.getCube('TourData')) {
      cube.registerCube(
        'TourData',
        ['Tour'],
        [
          { name: 'isActive', dataType: 'boolean', aggregation: 'none' },
          { name: 'currentStep', dataType: 'numeric', aggregation: 'none' },
          { name: 'totalSteps', dataType: 'numeric', aggregation: 'none' },
        ]
      );
      cubesCreated.push('TourData');
    }

    // Migrate completed tours
    const completedTours = data.completedTours as string[] | undefined;
    if (Array.isArray(completedTours)) {
      for (const tourId of completedTours) {
        if (!cube.getMember('Tour', `Tour:${tourId}`)) {
          cube.addMember('Tour', {
            code: tourId,
            name: `Tour: ${tourId}`,
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = { Tour: `Tour:${tourId}` };
        cube.writeCell('TourData', {
          coords,
          measure: 'isActive',
          value: false,
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    // Migrate active tour state
    if (data.isActive && Array.isArray(data.steps) && (data.steps as unknown[]).length > 0) {
      const activeTourId = 'active-tour';
      if (!cube.getMember('Tour', `Tour:${activeTourId}`)) {
        cube.addMember('Tour', {
          code: activeTourId,
          name: 'Active Tour',
          hierarchy: 'default',
          level: 0,
          isLeaf: true,
          isActive: true,
          attributes: {},
        });
      }

      const coords = { Tour: `Tour:${activeTourId}` };
      cube.writeCell('TourData', {
        coords,
        measure: 'isActive',
        value: true,
        dataType: 'input',
      });
      cellsWritten++;

      cube.writeCell('TourData', {
        coords,
        measure: 'currentStep',
        value: Number(data.currentStepIndex ?? 0),
        dataType: 'input',
      });
      cellsWritten++;

      cube.writeCell('TourData', {
        coords,
        measure: 'totalSteps',
        value: (data.steps as unknown[]).length,
        dataType: 'input',
      });
      cellsWritten++;
    }

    return {
      success: true,
      storeName: 'tourStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'tourStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// ANALYTICS STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateAnalyticsStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('Analytics')) {
      cube.registerDimension('Analytics', 'user', [
        { name: 'default', levels: ['chart'], effectiveDating: false },
      ]);
      dimsCreated.push('Analytics');
    }

    // Ensure Scenario dimension exists
    if (!cube.getDimension('Scenario')) {
      cube.registerDimension('Scenario', 'system', [
        { name: 'default', levels: ['scenario'], effectiveDating: false },
      ]);
      dimsCreated.push('Scenario');
    }

    if (!cube.getCube('AnalyticsData')) {
      cube.registerCube(
        'AnalyticsData',
        ['Analytics', 'Scenario'],
        [
          { name: 'chartType', dataType: 'text', aggregation: 'none' },
          { name: 'title', dataType: 'text', aggregation: 'none' },
          { name: 'colorScheme', dataType: 'text', aggregation: 'none' },
          { name: 'showLegend', dataType: 'boolean', aggregation: 'none' },
        ]
      );
      cubesCreated.push('AnalyticsData');
    }

    const charts = data.charts as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(charts)) {
      for (const chart of charts) {
        const chartId = String(chart.id ?? generateId('chart'));
        if (!cube.getMember('Analytics', `Analytics:${chartId}`)) {
          cube.addMember('Analytics', {
            code: chartId,
            name: String(chart.title ?? 'Chart'),
            hierarchy: 'default',
            level: 0,
            isLeaf: true,
            isActive: true,
            attributes: {},
          });
        }

        const coords = { Analytics: `Analytics:${chartId}`, Scenario: 'Scenario:base' };
        cube.writeCell('AnalyticsData', {
          coords,
          measure: 'chartType',
          value: String(chart.type ?? 'bar'),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('AnalyticsData', {
          coords,
          measure: 'title',
          value: String(chart.title ?? ''),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('AnalyticsData', {
          coords,
          measure: 'colorScheme',
          value: String(chart.colorScheme ?? 'default'),
          dataType: 'input',
        });
        cellsWritten++;

        cube.writeCell('AnalyticsData', {
          coords,
          measure: 'showLegend',
          value: Boolean(chart.showLegend),
          dataType: 'input',
        });
        cellsWritten++;
      }
    }

    return {
      success: true,
      storeName: 'analyticsStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'analyticsStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// UI STORE MIGRATOR
// ---------------------------------------------------------------------------

export function migrateUiStore(cube: CubeEngine, data: StoreData): MigrationResult {
  const start = Date.now();
  const dimsCreated: string[] = [];
  const cubesCreated: string[] = [];
  let cellsWritten = 0;

  try {
    if (!cube.getDimension('UI')) {
      cube.registerDimension('UI', 'user', [
        { name: 'default', levels: ['setting'], effectiveDating: false },
      ]);
      dimsCreated.push('UI');
    }

    if (!cube.getCube('UIData')) {
      cube.registerCube(
        'UIData',
        ['UI'],
        [
          { name: 'sidebarCollapsed', dataType: 'boolean', aggregation: 'none' },
          { name: 'theme', dataType: 'text', aggregation: 'none' },
          { name: 'dateRangeStart', dataType: 'text', aggregation: 'none' },
          { name: 'dateRangeEnd', dataType: 'text', aggregation: 'none' },
        ]
      );
      cubesCreated.push('UIData');
    }

    if (!cube.getMember('UI', 'UI:main')) {
      cube.addMember('UI', {
        code: 'main',
        name: 'Main UI',
        hierarchy: 'default',
        level: 0,
        isLeaf: true,
        isActive: true,
        attributes: {},
      });
    }

    const coords = { UI: 'UI:main' };

    cube.writeCell('UIData', {
      coords,
      measure: 'sidebarCollapsed',
      value: Boolean(data.sidebarCollapsed),
      dataType: 'input',
    });
    cellsWritten++;

    cube.writeCell('UIData', {
      coords,
      measure: 'theme',
      value: String(data.theme ?? 'dark'),
      dataType: 'input',
    });
    cellsWritten++;

    const dateRange = data.globalDateRange as Record<string, string> | undefined;
    if (dateRange) {
      cube.writeCell('UIData', {
        coords,
        measure: 'dateRangeStart',
        value: String(dateRange.start ?? ''),
        dataType: 'input',
      });
      cellsWritten++;

      cube.writeCell('UIData', {
        coords,
        measure: 'dateRangeEnd',
        value: String(dateRange.end ?? ''),
        dataType: 'input',
      });
      cellsWritten++;
    }

    return {
      success: true,
      storeName: 'uiStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      duration: Date.now() - start,
    };
  } catch (err) {
    return {
      success: false,
      storeName: 'uiStore',
      cellsWritten,
      dimensionsCreated: dimsCreated,
      cubesCreated,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: Date.now() - start,
    };
  }
}

// ---------------------------------------------------------------------------
// REGISTRY — All migrators in order
// ---------------------------------------------------------------------------

export const STORE_MIGRATORS: Record<
  string,
  (cube: CubeEngine, data: StoreData) => MigrationResult
> = {
  authStore: migrateAuthStore,
  settingsStore: migrateSettingsStore,
  budgetStore: migrateBudgetStore,
  forecastStore: migrateForecastStore,
  glStore: migrateGlStore,
  scenarioStore: migrateScenarioStore,
  reportStore: migrateReportStore,
  varianceStore: migrateVarianceStore,
  notificationStore: migrateNotificationStore,
  collaborationStore: migrateCollaborationStore,
  dataStore: migrateDataStore,
  tourStore: migrateTourStore,
  analyticsStore: migrateAnalyticsStore,
  uiStore: migrateUiStore,
};

export const STORE_NAMES = Object.keys(STORE_MIGRATORS);
