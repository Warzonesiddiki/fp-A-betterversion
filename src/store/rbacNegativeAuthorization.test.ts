/**
 * F-0026 — negative authorization tests.
 *
 * The positive-path fixtures (src/test/rbacFixtures.ts) prove an authorized role
 * CAN perform each action. On their own they would be worthless: a store with
 * enforcement deleted would also pass. These tests prove the other half — that
 * the guard actually DENIES, and denies on the specific permission claimed.
 *
 * Three denial classes are covered for every store under test:
 *   1. no session at all (logged-out / devtools-cleared state),
 *   2. an authenticated but under-privileged real role (Viewer),
 *   3. an otherwise-Admin user with exactly one permission withheld, which pins
 *      WHICH permission is checked rather than merely that something threw.
 *
 * Every denial also asserts the store state did not change, because an error
 * thrown after a mutation would still be data corruption.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { actAs, actAsRoleWithout, signOut, expectPermissionDenied } from '@/test/rbacFixtures';
import { useBudgetStore } from './budgetStore';
import { useCapExStore } from './capexStore';
import { useDriverStore, resetEngine } from './driverStore';
import { useEntityStore } from './entityStore';
import { useForecastStore } from './forecastStore';
import { useESGStore } from './esgStore';
import { useCollaborationStore } from './collaborationStore';

const budgetInput = (name: string) => ({
  name,
  description: 'Negative-authorization probe',
  fiscalYear: 2026,
  status: 'Draft' as const,
  template: 'Standard',
  departments: ['finance'],
  entities: ['entity-001'],
  baseCurrency: 'USD',
  totalAmount: 1000,
  createdByName: 'Test',
  submittedAt: null,
  approvedAt: null,
  approvedBy: null,
});

const driverInput = (name: string) => ({
  name,
  description: 'Negative-authorization probe',
  currentValue: 10,
  baseValue: 10,
  minValue: 0,
  maxValue: 100,
  step: 1,
  category: 'Revenue',
  unit: 'percentage',
  tags: ['probe'],
});

const capexProject = {
  id: 'capex-denied-1',
  name: 'Denied Project',
  category: 'IT',
  budget: 1000,
  actual: 0,
  status: 'planned' as const,
  startDate: '2026-01-01',
  endDate: '2026-12-31',
  paybackPeriod: 2,
  irr: 10,
};

interface DenialCase {
  readonly name: string;
  readonly permission: string;
  readonly run: () => void;
  readonly count: () => number;
}

const DENIAL_CASES: readonly DenialCase[] = [
  {
    name: 'budgetStore.createBudget',
    permission: 'budget:create',
    run: () => useBudgetStore.getState().createBudget(budgetInput('denied-budget')),
    count: () => useBudgetStore.getState().budgets.length,
  },
  {
    name: 'budgetStore.deleteBudget',
    permission: 'budget:delete',
    run: () => useBudgetStore.getState().deleteBudget('any-id'),
    count: () => useBudgetStore.getState().budgets.length,
  },
  {
    name: 'capexStore.addProject',
    permission: 'capex:create',
    run: () => useCapExStore.getState().addProject(capexProject),
    count: () => useCapExStore.getState().projects.length,
  },
  {
    name: 'capexStore.clearAll',
    permission: 'capex:delete',
    run: () => useCapExStore.getState().clearAll(),
    count: () => useCapExStore.getState().projects.length,
  },
  {
    name: 'driverStore.addDriver',
    permission: 'driver:create',
    run: () => useDriverStore.getState().addDriver(driverInput('denied-driver')),
    count: () => useDriverStore.getState().engine.listDrivers().length,
  },
  {
    name: 'entityStore.addEntity',
    permission: 'entity:create',
    run: () =>
      useEntityStore.getState().addEntity({
        name: 'Denied Entity',
        code: 'DEN',
        type: 'Subsidiary',
        parentId: null,
        currency: 'USD',
        ownershipPercentage: 100,
        isActive: true,
      } as never),
    count: () => useEntityStore.getState().entities.length,
  },
  {
    name: 'esgStore.addMetric',
    permission: 'analytics:create',
    run: () =>
      useESGStore.getState().addMetric({
        id: 'denied-metric',
        category: 'Environmental',
        name: 'Denied',
        value: 1,
        unit: 't',
        period: '2026-01',
      } as never),
    count: () => useESGStore.getState().metrics.length,
  },
  {
    name: 'collaborationStore.addComment',
    permission: 'collab:update',
    run: () =>
      useCollaborationStore.getState().addComment({
        author: 'probe',
        content: 'denied',
        cellRef: 'A1',
        resolved: false,
      } as never),
    count: () => useCollaborationStore.getState().comments.length,
  },
];

describe('F-0026 negative authorization — stores deny unauthorized writes', () => {
  beforeEach(() => {
    resetEngine();
    signOut();
  });
  afterEach(() => {
    signOut();
  });

  describe('class 1: no authenticated session', () => {
    for (const testCase of DENIAL_CASES) {
      it(`${testCase.name} throws PermissionError with no user`, () => {
        const before = testCase.count();
        const error = expectPermissionDenied(testCase.run);
        expect(error.message).toContain(testCase.permission);
        expect(error.message).toContain('no user');
        expect(testCase.count(), 'state must be unchanged after denial').toBe(before);
      });
    }
  });

  describe('class 2: authenticated Viewer (real under-privileged role)', () => {
    for (const testCase of DENIAL_CASES) {
      it(`${testCase.name} is denied for Viewer`, () => {
        actAs('Viewer');
        const before = testCase.count();
        const error = expectPermissionDenied(testCase.run);
        expect(error.message).toContain(testCase.permission);
        expect(testCase.count(), 'state must be unchanged after denial').toBe(before);
      });
    }
  });

  describe('class 3: Admin with exactly one permission withheld', () => {
    for (const testCase of DENIAL_CASES) {
      it(`${testCase.name} is denied when only ${testCase.permission} is missing`, () => {
        actAsRoleWithout('Admin', testCase.permission);
        const before = testCase.count();
        const error = expectPermissionDenied(testCase.run);
        expect(error.message).toContain(testCase.permission);
        expect(testCase.count(), 'state must be unchanged after denial').toBe(before);
      });

      it(`${testCase.name} succeeds for a full Admin (guard is not deny-all)`, () => {
        actAs('Admin');
        expect(() => testCase.run()).not.toThrow();
      });
    }
  });

  describe('approval authority is gated separately from edit authority', () => {
    it('updateApprovalStatus is denied for Analyst and allowed for FP&A_Manager', () => {
      useCollaborationStore.setState({
        approvals: [
          {
            id: 'apr-1',
            title: 'FY26 Budget',
            requestedBy: 'analyst',
            status: 'Pending',
            requestedAt: '2026-01-01T00:00:00.000Z',
          } as never,
        ],
      });

      // Analyst can comment (collab:update) but must not approve (workflow:approve).
      actAs('Analyst');
      expect(() =>
        useCollaborationStore
          .getState()
          .addComment({ author: 'a', content: 'c', cellRef: 'A1', resolved: false } as never)
      ).not.toThrow();
      const denied = expectPermissionDenied(() =>
        useCollaborationStore.getState().updateApprovalStatus('apr-1', 'Approved')
      );
      expect(denied.message).toContain('workflow:approve');
      expect(useCollaborationStore.getState().approvals[0]!.status).toBe('Pending');

      actAs('FP&A_Manager');
      expect(() =>
        useCollaborationStore.getState().updateApprovalStatus('apr-1', 'Approved')
      ).not.toThrow();
      expect(useCollaborationStore.getState().approvals[0]!.status).toBe('Approved');
    });
  });

  describe('reads stay available to legitimate readers', () => {
    it('Viewer can read budgets while being unable to write them', () => {
      actAs('Viewer');
      expect(Array.isArray(useBudgetStore.getState().budgets)).toBe(true);
      expectPermissionDenied(() => useBudgetStore.getState().createBudget(budgetInput('nope')));
    });

    it('forecast writes are allowed for Analyst and denied for Viewer', () => {
      actAs('Viewer');
      expectPermissionDenied(() => useForecastStore.getState().setForecasts([]));

      actAs('Analyst');
      expect(() => useForecastStore.getState().setForecasts([])).not.toThrow();
    });
  });
});
