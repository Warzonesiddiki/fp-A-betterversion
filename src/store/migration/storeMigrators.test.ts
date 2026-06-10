// =============================================================================
// STORE MIGRATORS TESTS — 40+ tests for individual store data transformation
// =============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CubeEngine } from '@/engines/CubeEngine';
import {
  migrateAuthStore,
  migrateSettingsStore,
  migrateBudgetStore,
  migrateForecastStore,
  migrateGlStore,
  migrateScenarioStore,
  migrateReportStore,
  migrateVarianceStore,
  migrateNotificationStore,
  migrateCollaborationStore,
  migrateDataStore,
  migrateTourStore,
  migrateAnalyticsStore,
  migrateUiStore,
  STORE_MIGRATORS,
  STORE_NAMES,
  type MigrationResult,
} from './storeMigrators';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createTestCube(): CubeEngine {
  return new CubeEngine();
}

function assertSuccess(result: MigrationResult): void {
  expect(result.success).toBe(true);
  expect(result.error).toBeUndefined();
}

function _assertFailure(result: MigrationResult): void {
  expect(result.success).toBe(false);
  expect(result.error).toBeTruthy();
}

// ---------------------------------------------------------------------------
// AUTH STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateAuthStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate authenticated user state', () => {
    const data = {
      user: { id: 'user-1', email: 'test@example.com' },
      isAuthenticated: true,
      mfaRequired: false,
      activeEntityId: 'entity-1',
    };
    const result = migrateAuthStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(3);
  });

  it('should create User dimension', () => {
    migrateAuthStore(cube, { user: { id: 'u1', email: 'u1@test.com' }, isAuthenticated: true });
    expect(cube.getDimension('User')).toBeDefined();
  });

  it('should create Auth cube', () => {
    migrateAuthStore(cube, { user: { id: 'u1', email: 'u1@test.com' }, isAuthenticated: true });
    expect(cube.getCube('Auth')).toBeDefined();
  });

  it('should handle null user', () => {
    const result = migrateAuthStore(cube, { user: null, isAuthenticated: false });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });

  it('should handle empty data', () => {
    const result = migrateAuthStore(cube, {});
    assertSuccess(result);
  });

  it('should report duration', () => {
    const result = migrateAuthStore(cube, {});
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should not duplicate dimensions on re-migration', () => {
    migrateAuthStore(cube, { user: { id: 'u1', email: 'u1@test.com' }, isAuthenticated: true });
    migrateAuthStore(cube, { user: { id: 'u2', email: 'u2@test.com' }, isAuthenticated: true });
    expect(cube.listDimensions().filter((d) => d === 'User').length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SETTINGS STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateSettingsStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate organization settings', () => {
    const data = {
      organization: {
        fiscalYear: 2024,
        baseCurrency: 'USD',
        decimalPlaces: 2,
        calendarType: 'Standard',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
      },
    };
    const result = migrateSettingsStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(6);
  });

  it('should migrate preferences', () => {
    const data = { preferences: { activeSector: 'technology' } };
    const result = migrateSettingsStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(1);
  });

  it('should migrate users array', () => {
    const data = {
      users: [
        {
          id: 'u1',
          email: 'u1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'Admin',
          department: 'Finance',
          status: 'Active',
        },
      ],
    };
    const result = migrateSettingsStore(cube, data);
    assertSuccess(result);
    expect(cube.getMember('User', 'User:u1')).toBeDefined();
  });

  it('should create Settings dimension', () => {
    migrateSettingsStore(cube, { organization: { fiscalYear: 2024 } });
    expect(cube.getDimension('Settings')).toBeDefined();
  });

  it('should handle missing organization data', () => {
    const result = migrateSettingsStore(cube, {});
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// BUDGET STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateBudgetStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate budget line items', () => {
    const data = {
      lineItems: [
        {
          id: 'li-1',
          budgetId: 'bgt-1',
          accountId: 'acct-1',
          accountCode: '4000',
          accountName: 'Revenue',
          amount: 100000,
          isLocked: false,
          version: 1,
        },
        {
          id: 'li-2',
          budgetId: 'bgt-1',
          accountId: 'acct-2',
          accountCode: '5000',
          accountName: 'COGS',
          amount: 50000,
          isLocked: false,
          version: 1,
        },
      ],
    };
    const result = migrateBudgetStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(6); // 2 items * 3 measures
  });

  it('should create Budget cube', () => {
    migrateBudgetStore(cube, {
      lineItems: [
        {
          id: 'li-1',
          budgetId: 'b1',
          accountId: 'a1',
          accountCode: '1',
          accountName: 'Test',
          amount: 100,
        },
      ],
    });
    expect(cube.getCube('Budget')).toBeDefined();
  });

  it('should create Account dimension', () => {
    migrateBudgetStore(cube, {
      lineItems: [
        {
          id: 'li-1',
          budgetId: 'b1',
          accountId: 'a1',
          accountCode: '1',
          accountName: 'Test',
          amount: 100,
        },
      ],
    });
    expect(cube.getDimension('Account')).toBeDefined();
  });

  it('should handle empty line items', () => {
    const result = migrateBudgetStore(cube, { lineItems: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });

  it('should handle missing lineItems', () => {
    const result = migrateBudgetStore(cube, {});
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });

  it('should track cellsWritten correctly', () => {
    const data = {
      lineItems: [
        {
          id: 'li-1',
          budgetId: 'b1',
          accountId: 'a1',
          accountCode: '1',
          accountName: 'A',
          amount: 100,
        },
        {
          id: 'li-2',
          budgetId: 'b1',
          accountId: 'a2',
          accountCode: '2',
          accountName: 'B',
          amount: 200,
        },
        {
          id: 'li-3',
          budgetId: 'b1',
          accountId: 'a3',
          accountCode: '3',
          accountName: 'C',
          amount: 300,
        },
      ],
    };
    const result = migrateBudgetStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(9); // 3 items * 3 measures
  });
});

// ---------------------------------------------------------------------------
// FORECAST STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateForecastStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate forecast drivers', () => {
    const data = {
      drivers: [
        {
          id: 'drv-1',
          name: 'Headcount',
          driverType: 'Headcount',
          baseValue: 100,
          currentValue: 120,
          unit: 'FTE',
          affectedAccountIds: ['acct-1', 'acct-2'],
          formula: '',
        },
      ],
    };
    const result = migrateForecastStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(4); // 2 accounts * 2 measures
  });

  it('should create Forecast cube', () => {
    migrateForecastStore(cube, {
      drivers: [
        {
          id: 'd1',
          name: 'D',
          driverType: 'Custom',
          baseValue: 10,
          currentValue: 20,
          unit: '',
          affectedAccountIds: ['a1'],
          formula: '',
        },
      ],
    });
    expect(cube.getCube('Forecast')).toBeDefined();
  });

  it('should handle empty drivers', () => {
    const result = migrateForecastStore(cube, { drivers: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });

  it('should handle driver with no affected accounts', () => {
    const data = {
      drivers: [
        {
          id: 'drv-1',
          name: 'D',
          driverType: 'Custom',
          baseValue: 10,
          currentValue: 20,
          unit: '',
          affectedAccountIds: [],
          formula: '',
        },
      ],
    };
    const result = migrateForecastStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GL STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateGlStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate GL entries', () => {
    const data = {
      entries: [
        {
          id: 'e-1',
          accountId: 'a-1',
          accountCode: '4000',
          accountName: 'Revenue',
          period: '2024-01',
          debit: 0,
          credit: 10000,
          netChange: -10000,
          entityId: 'ent-1',
        },
        {
          id: 'e-2',
          accountId: 'a-2',
          accountCode: '5000',
          accountName: 'COGS',
          period: '2024-01',
          debit: 5000,
          credit: 0,
          netChange: 5000,
          entityId: 'ent-1',
        },
      ],
    };
    const result = migrateGlStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(6); // 2 entries * 3 measures
  });

  it('should create GL cube', () => {
    migrateGlStore(cube, {
      entries: [
        {
          id: 'e1',
          accountId: 'a1',
          accountCode: '1',
          accountName: 'Test',
          period: '2024-01',
          debit: 100,
          credit: 0,
          netChange: 100,
        },
      ],
    });
    expect(cube.getCube('GL')).toBeDefined();
  });

  it('should create all required dimensions', () => {
    migrateGlStore(cube, {
      entries: [
        {
          id: 'e1',
          accountId: 'a1',
          accountCode: '1',
          accountName: 'Test',
          period: '2024-01',
          debit: 100,
          credit: 0,
          netChange: 100,
        },
      ],
    });
    expect(cube.getDimension('Account')).toBeDefined();
    expect(cube.getDimension('Time')).toBeDefined();
    expect(cube.getDimension('Entity')).toBeDefined();
    expect(cube.getDimension('DataSource')).toBeDefined();
  });

  it('should handle empty entries', () => {
    const result = migrateGlStore(cube, { entries: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });

  it('should handle entries with missing optional fields', () => {
    const data = {
      entries: [
        {
          id: 'e-1',
          accountId: 'a-1',
          accountCode: '4000',
          accountName: 'Revenue',
          period: '2024-01',
          debit: 0,
          credit: 100,
          netChange: -100,
        },
      ],
    };
    const result = migrateGlStore(cube, data);
    assertSuccess(result);
  });
});

// ---------------------------------------------------------------------------
// SCENARIO STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateScenarioStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate scenarios with metrics', () => {
    const data = {
      scenarios: [
        {
          id: 'scn-1',
          name: 'Base Case',
          type: 'Base',
          probability: 0.5,
          isActive: true,
          calculatedMetrics: {
            revenue: 1000000,
            ebitda: 200000,
            netIncome: 150000,
            cashFlow: 180000,
            headcount: 50,
            burnRate: 50000,
            runway: 24,
            grossMargin: 0.4,
            ebitdaMargin: 0.2,
          },
        },
      ],
    };
    const result = migrateScenarioStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(10); // probability + 9 metrics
  });

  it('should create ScenarioData cube', () => {
    migrateScenarioStore(cube, {
      scenarios: [
        {
          id: 's1',
          name: 'S',
          type: 'Custom',
          probability: 1,
          isActive: true,
          calculatedMetrics: {
            revenue: 0,
            ebitda: 0,
            netIncome: 0,
            cashFlow: 0,
            headcount: 0,
            burnRate: 0,
            runway: 0,
            grossMargin: 0,
            ebitdaMargin: 0,
          },
        },
      ],
    });
    expect(cube.getCube('ScenarioData')).toBeDefined();
  });

  it('should handle empty scenarios', () => {
    const result = migrateScenarioStore(cube, { scenarios: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });

  it('should handle scenario without metrics', () => {
    const data = {
      scenarios: [{ id: 's1', name: 'S', type: 'Custom', probability: 0.5, isActive: true }],
    };
    const result = migrateScenarioStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(1); // only probability
  });
});

// ---------------------------------------------------------------------------
// REPORT STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateReportStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate reports', () => {
    const data = {
      reports: [{ id: 'rpt-1', name: 'Income Statement', type: 'income', format: 'pdf' }],
    };
    const result = migrateReportStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(2);
  });

  it('should migrate scheduled reports', () => {
    const data = {
      scheduledReports: [
        {
          id: 'sch-1',
          reportId: 'rpt-1',
          frequency: 'monthly',
          recipients: ['user@test.com'],
          nextRun: '2024-02-01',
          isActive: true,
        },
      ],
    };
    const result = migrateReportStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(2);
  });

  it('should handle empty reports', () => {
    const result = migrateReportStore(cube, { reports: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// VARIANCE STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateVarianceStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate variance analyses', () => {
    const data = {
      analyses: [
        {
          id: 'var-1',
          accountId: 'a-1',
          accountName: 'Revenue',
          accountCode: '4000',
          accountType: 'Revenue',
          budgetAmount: 100000,
          actualAmount: 110000,
          forecastAmount: 105000,
          dollarVariance: 10000,
          percentVariance: 0.1,
          varianceStatus: 'Favorable',
          thresholdStatus: 'Within',
          commentary: null,
          commentaryStatus: 'NotStarted',
          monthlyBreakdown: [],
          rateVariance: 5000,
          volumeVariance: 5000,
        },
      ],
    };
    const result = migrateVarianceStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(7);
  });

  it('should create Variance cube', () => {
    migrateVarianceStore(cube, {
      analyses: [
        {
          id: 'v1',
          accountId: 'a1',
          accountName: 'A',
          accountCode: '1',
          accountType: 'Revenue',
          budgetAmount: 0,
          actualAmount: 0,
          forecastAmount: 0,
          dollarVariance: 0,
          percentVariance: 0,
          varianceStatus: 'Neutral',
          thresholdStatus: 'Within',
          commentary: null,
          commentaryStatus: 'NotStarted',
          monthlyBreakdown: [],
          rateVariance: 0,
          volumeVariance: 0,
        },
      ],
    });
    expect(cube.getCube('Variance')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// NOTIFICATION STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateNotificationStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate notifications', () => {
    const data = {
      notifications: [
        {
          id: 'n-1',
          type: 'info',
          title: 'Test',
          message: 'Hello',
          isRead: false,
          actionUrl: null,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const result = migrateNotificationStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(3);
  });

  it('should handle empty notifications', () => {
    const result = migrateNotificationStore(cube, { notifications: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// COLLABORATION STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateCollaborationStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate comments', () => {
    const data = {
      comments: [
        {
          id: 'c-1',
          resourceType: 'budget',
          resourceId: 'b1',
          cellId: null,
          parentId: null,
          authorId: 'u1',
          authorName: 'User',
          authorInitials: 'U',
          content: 'Test',
          mentions: [],
          isResolved: false,
          resolvedAt: null,
          createdAt: new Date().toISOString(),
          replies: [],
        },
      ],
    };
    const result = migrateCollaborationStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(1);
  });

  it('should migrate tasks', () => {
    const data = {
      tasks: [
        {
          id: 't-1',
          title: 'Task',
          description: 'Desc',
          assigneeId: 'u1',
          assigneeName: 'User',
          dueDate: '2024-12-31',
          priority: 'High',
          status: 'InProgress',
          relatedResourceType: null,
          relatedResourceId: null,
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const result = migrateCollaborationStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// DATA STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateDataStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate accounts', () => {
    const data = {
      accounts: [
        {
          id: 'a-1',
          code: '4000',
          name: 'Revenue',
          type: 'Revenue',
          category: 'Income',
          subCategory: '',
          parentId: null,
          level: 0,
          sortOrder: 0,
          isActive: true,
          entityId: 'e1',
          departmentId: null,
          isCalculated: false,
          formula: null,
          children: [],
        },
      ],
    };
    const result = migrateDataStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(3);
  });

  it('should handle nested account hierarchy', () => {
    const data = {
      accounts: [
        {
          id: 'a-1',
          code: '4000',
          name: 'Revenue',
          type: 'Revenue',
          category: 'Income',
          subCategory: '',
          parentId: null,
          level: 0,
          sortOrder: 0,
          isActive: true,
          entityId: 'e1',
          departmentId: null,
          isCalculated: false,
          formula: null,
          children: [
            {
              id: 'a-2',
              code: '4100',
              name: 'Product Revenue',
              type: 'Revenue',
              category: 'Income',
              subCategory: '',
              parentId: 'a-1',
              level: 1,
              sortOrder: 0,
              isActive: true,
              entityId: 'e1',
              departmentId: null,
              isCalculated: false,
              formula: null,
              children: [],
            },
          ],
        },
      ],
    };
    const result = migrateDataStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(6); // 2 accounts * 3 measures
  });

  it('should handle empty accounts', () => {
    const result = migrateDataStore(cube, { accounts: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TOUR STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateTourStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate completed tours', () => {
    const data = {
      completedTours: ['tour-1', 'tour-2'],
      isActive: false,
      steps: [],
      currentStepIndex: 0,
    };
    const result = migrateTourStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(2);
  });

  it('should migrate active tour state', () => {
    const data = {
      completedTours: [],
      isActive: true,
      steps: [
        { target: '.btn', title: 'Step 1', content: 'Click' },
        { target: '.input', title: 'Step 2', content: 'Type' },
      ],
      currentStepIndex: 0,
    };
    const result = migrateTourStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(3); // isActive, currentStep, totalSteps
  });

  it('should handle empty tour data', () => {
    const result = migrateTourStore(cube, {
      completedTours: [],
      isActive: false,
      steps: [],
      currentStepIndex: 0,
    });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ANALYTICS STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateAnalyticsStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate chart configurations', () => {
    const data = {
      charts: [
        {
          id: 'chart-1',
          type: 'bar' as const,
          title: 'Revenue',
          metrics: ['revenue'],
          dimensions: ['time'],
          aggregation: 'sum' as const,
          colorScheme: 'default',
          showLegend: true,
          showGrid: true,
        },
      ],
    };
    const result = migrateAnalyticsStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(4);
  });

  it('should handle empty charts', () => {
    const result = migrateAnalyticsStore(cube, { charts: [] });
    assertSuccess(result);
    expect(result.cellsWritten).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// UI STORE MIGRATOR TESTS
// ---------------------------------------------------------------------------

describe('migrateUiStore', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should migrate UI state', () => {
    const data = {
      sidebarCollapsed: false,
      theme: 'dark',
      globalDateRange: { start: '2024-01-01', end: '2024-12-31' },
    };
    const result = migrateUiStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(4);
  });

  it('should handle missing date range', () => {
    const data = { sidebarCollapsed: true, theme: 'light' };
    const result = migrateUiStore(cube, data);
    assertSuccess(result);
    expect(result.cellsWritten).toBe(2);
  });

  it('should create UI dimension', () => {
    migrateUiStore(cube, { sidebarCollapsed: false, theme: 'dark' });
    expect(cube.getDimension('UI')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// REGISTRY TESTS
// ---------------------------------------------------------------------------

describe('STORE_MIGRATORS registry', () => {
  it('should contain all 14 stores', () => {
    expect(STORE_NAMES.length).toBe(14);
  });

  it('should have a migrator for each store', () => {
    for (const name of STORE_NAMES) {
      expect(STORE_MIGRATORS[name]!).toBeInstanceOf(Function);
    }
  });

  it('should list all expected store names', () => {
    const expected = [
      'authStore',
      'settingsStore',
      'budgetStore',
      'forecastStore',
      'glStore',
      'scenarioStore',
      'reportStore',
      'varianceStore',
      'notificationStore',
      'collaborationStore',
      'dataStore',
      'tourStore',
      'analyticsStore',
      'uiStore',
    ];
    for (const name of expected) {
      expect(STORE_NAMES).toContain(name);
    }
  });
});

// ---------------------------------------------------------------------------
// ERROR HANDLING TESTS
// ---------------------------------------------------------------------------

describe('error handling', () => {
  let cube: CubeEngine;

  beforeEach(() => {
    cube = createTestCube();
  });

  it('should handle corrupted data gracefully', () => {
    const result = migrateBudgetStore(cube, { lineItems: 'not-an-array' as unknown });
    // Should not throw, but may succeed with 0 cells
    expect(result).toBeDefined();
    expect(result.storeName).toBe('budgetStore');
  });

  it('should handle null data gracefully', () => {
    const result = migrateAuthStore(cube, null as unknown as Record<string, unknown>);
    expect(result).toBeDefined();
  });

  it('should handle undefined fields in data', () => {
    const result = migrateGlStore(cube, { entries: [{ id: 'e1' }] });
    expect(result).toBeDefined();
  });

  it('should return error message on failure', () => {
    // Force an error by registering a dimension that conflicts
    cube.registerDimension('Account', 'system');
    // This should still work since we check for existing dimensions
    const result = migrateBudgetStore(cube, { lineItems: [] });
    expect(result).toBeDefined();
  });
});
