// =============================================================================
// STORE MIGRATORS — idempotency & guard-branch sweep
//
// Every migrator is written defensively: it only registers a dimension/cube or
// adds a member "if not exists", and it guards each data field. The happy-path
// tests exercise the first run; these tests run EVERY migrator TWICE on the
// same cube (covering all the already-exists false branches) and with sparse
// data (covering the field guards).
// =============================================================================

import { describe, it, expect } from 'vitest';
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
} from './storeMigrators';

function createTestCube(): CubeEngine {
  return new CubeEngine();
}

// One rich fixture that touches every data field each migrator reads.
function richData() {
  return {
    user: { id: 'u1', email: 'u1@test.com' },
    isAuthenticated: true,
    mfaRequired: true,
    activeEntityId: 'ent-1',
    organization: {
      fiscalYear: 2024,
      baseCurrency: 'USD',
      decimalPlaces: 2,
      calendarType: 'Standard',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
    },
    preferences: { activeSector: 'technology', theme: 'dark' },
    users: [
      {
        id: 'u1',
        email: 'u1@test.com',
        firstName: 'A',
        lastName: 'B',
        role: 'Admin',
        department: 'Finance',
        status: 'Active',
      },
      {
        id: 'u2',
        email: 'u2@test.com',
        firstName: 'C',
        lastName: 'D',
        role: 'Analyst',
        department: 'Ops',
        status: 'Inactive',
      },
    ],
    lineItems: [
      { id: 'li-1', accountCode: '4000', period: '2024-01', amount: 100, scenario: 'base' },
      { id: 'li-2', accountCode: '5000', period: '2024-02', amount: 50, scenario: 'budget' },
    ],
    drivers: [
      {
        id: 'drv-1',
        name: 'Volume',
        category: 'revenue',
        currentValue: 100,
        affectedAccounts: ['4000', '4100'],
      },
      { id: 'drv-2', name: 'Price', category: 'revenue', currentValue: 50, affectedAccounts: [] },
    ],
    entries: [
      {
        id: 'e1',
        accountCode: '4000',
        accountName: 'Revenue',
        debit: 100,
        credit: 0,
        period: '2024-01',
        date: '2024-01-15',
        description: 'd',
        reference: 'r',
      },
      {
        id: 'e2',
        accountCode: '5000',
        accountName: 'COGS',
        debit: 0,
        credit: 40,
        period: '2024-01',
        date: '2024-01-16',
        description: 'd2',
        reference: 'r2',
        entityId: 'ent-1',
        departmentId: 'dept-1',
      },
    ],
    scenarios: [
      {
        id: 'scn-1',
        name: 'Base',
        type: 'Base',
        probability: 0.6,
        assumptions: [
          { id: 'a1', name: 'Growth', driverType: 'revenue', baseValue: 10, currentValue: 12 },
        ],
        calculatedMetrics: {
          revenue: 1000,
          ebitda: 200,
          netIncome: 100,
          cashFlow: 150,
          headcount: 10,
          burnRate: 5,
          runway: 12,
          grossMargin: 0.4,
          ebitdaMargin: 0.2,
        },
      },
      {
        id: 'scn-2',
        name: 'No Metrics',
        type: 'Custom',
        probability: 0.4,
        assumptions: [],
        calculatedMetrics: null,
      },
    ],
    reports: [{ id: 'rpt-1', name: 'Income Statement', type: 'income', format: 'pdf' }],
    scheduledReports: [
      {
        id: 'sch-1',
        reportId: 'rpt-1',
        frequency: 'monthly',
        recipients: ['x@y.z'],
        nextRun: '2024-02-01',
        isActive: true,
      },
    ],
    analyses: [
      {
        id: 'var-1',
        accountId: 'acct-1',
        accountName: 'Rev',
        accountCode: '4000',
        budgetAmount: 1000,
        actualAmount: 1200,
        dollarVariance: 200,
        percentVariance: 20,
        varianceStatus: 'Favorable',
        thresholdStatus: 'Significant',
        monthlyBreakdown: [
          { month: 1, monthName: 'Jan', budget: 100, actual: 120, variance: 20, percent: 20 },
        ],
        rateVariance: 10,
        volumeVariance: 190,
      },
    ],
    notifications: [
      {
        id: 'n1',
        type: 'approval',
        title: 'Approve',
        message: 'msg',
        isRead: false,
        actionUrl: '/x',
        createdAt: '2024-01-01',
      },
      {
        id: 'n2',
        type: 'info',
        title: 'Info',
        message: 'msg2',
        isRead: true,
        actionUrl: '/y',
        createdAt: '2024-01-02',
      },
    ],
    comments: [
      {
        id: 'c1',
        resourceType: 'budget',
        resourceId: 'b1',
        authorId: 'u1',
        authorName: 'A',
        body: 'body',
        createdAt: '2024-01-01',
      },
    ],
    tasks: [
      {
        id: 't1',
        title: 'Task',
        assigneeId: 'u1',
        status: 'Open',
        priority: 'High',
        createdAt: '2024-01-01',
      },
    ],
    accounts: [
      {
        id: 'acct-1',
        code: '4000',
        name: 'Revenue',
        type: 'Revenue',
        parentId: null,
        children: [],
      },
      {
        id: 'acct-2',
        code: '4100',
        name: 'Sub',
        type: 'Revenue',
        parentId: 'acct-1',
        children: [
          {
            id: 'acct-3',
            code: '4110',
            name: 'SubSub',
            type: 'Revenue',
            parentId: 'acct-2',
            children: [],
          },
        ],
      },
    ],
    completedTours: ['onboarding', 'budgets'],
    currentStepIndex: 3,
    steps: [
      { id: 's1', title: 'Step 1' },
      { id: 's2', title: 'Step 2' },
    ],
    charts: [
      { id: 'ch-1', title: 'Rev Trend', type: 'line', config: { x: 'month', y: 'revenue' } },
    ],
    globalDateRange: { start: '2024-01-01', end: '2024-12-31' },
    theme: 'dark',
    sidebarCollapsed: true,
    isActive: true,
  };
}

const ALL_MIGRATORS = [
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
];

describe('storeMigrators — idempotency sweep', () => {
  it('every migrator succeeds on a rich data payload', () => {
    const cube = createTestCube();
    for (const migrator of ALL_MIGRATORS) {
      const result = migrator(cube, richData());
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.storeName).toBeTruthy();
    }
  });

  it('running each migrator twice registers no duplicate dimensions/cubes', () => {
    const cube = createTestCube();
    for (const migrator of ALL_MIGRATORS) {
      const first = migrator(cube, richData());
      const second = migrator(cube, richData());

      expect(second.success).toBe(true);
      // Second run creates no new dimensions or cubes (all already exist)
      expect(second.dimensionsCreated).toEqual([]);
      expect(second.cubesCreated).toEqual([]);
      // cellsWritten still counts the writes (idempotent writes, not skipped)
      expect(second.cellsWritten).toBe(first.cellsWritten);
    }
  });

  it('every migrator tolerates empty data without throwing', () => {
    const cube = createTestCube();
    for (const migrator of ALL_MIGRATORS) {
      const result = migrator(cube, {});
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it('every migrator tolerates null-valued fields without throwing', () => {
    const cube = createTestCube();
    const sparse = Object.fromEntries(Object.keys(richData()).map((k) => [k, null]));
    for (const migrator of ALL_MIGRATORS) {
      const result = migrator(cube, sparse);
      expect(result.success).toBe(true);
    }
  });

  it('STORE_MIGRATORS registry covers every exported migrator', () => {
    expect(STORE_NAMES.length).toBe(ALL_MIGRATORS.length);
    for (const migrator of ALL_MIGRATORS) {
      expect(Object.values(STORE_MIGRATORS)).toContain(migrator);
    }
    expect(STORE_NAMES).toContain('authStore');
    expect(STORE_NAMES).toContain('uiStore');
  });

  it('migrators share a cube without cross-store collisions', () => {
    const cube = createTestCube();
    // Run all migrators on ONE cube, twice — no thrown errors at any point
    for (let round = 0; round < 2; round++) {
      for (const migrator of ALL_MIGRATORS) {
        const result = migrator(cube, richData());
        expect(result.success).toBe(true);
      }
    }
  });

  it('results carry per-store names and metric counts', () => {
    const cube = createTestCube();
    const results = ALL_MIGRATORS.map((m) => m(cube, richData()));
    for (const r of results) {
      expect(typeof r.cellsWritten).toBe('number');
      expect(Array.isArray(r.dimensionsCreated)).toBe(true);
      expect(Array.isArray(r.cubesCreated)).toBe(true);
    }
  });
});
