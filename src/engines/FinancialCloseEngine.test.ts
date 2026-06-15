import { describe, it, expect } from 'vitest';
import {
  FinancialCloseEngine,
  type CloseTask,
  type CloseTaskInstance,
  type ClosePlan,
  type ClosePeriod,
} from './FinancialCloseEngine';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeTask(overrides: Partial<CloseTask> = {}): CloseTask {
  return {
    id: 't1',
    name: 'Test task',
    description: 'Test',
    category: 'preparation',
    priority: 'medium',
    dependencies: [],
    assigneeRole: 'preparer',
    estimatedHours: 4,
    regulatoryFlag: false,
    ...overrides,
  };
}

function makePlan(tasks: CloseTask[], overrides: Partial<ClosePlan> = {}): ClosePlan {
  return {
    id: 'plan-1',
    period: 'monthly' as ClosePeriod,
    fiscalYear: 2026,
    fiscalPeriod: 6,
    jurisdiction: 'US-GAAP',
    tasks,
    deadline: '2026-12-31T23:59:59Z',
    ...overrides,
  };
}

function makeInstance(overrides: Partial<CloseTaskInstance> = {}): CloseTaskInstance {
  return {
    taskId: 't1',
    status: 'not-started',
    assignee: null,
    startedAt: null,
    completedAt: null,
    notes: '',
    ...overrides,
  };
}

// =============================================================================
// TESTS (15 tests, ≥10 minimum per Leader spec)
// =============================================================================

describe('FinancialCloseEngine', () => {
  it('1. validatePlan returns valid for clean plan', () => {
    const plan = makePlan([makeTask({ id: 'a' }), makeTask({ id: 'b', dependencies: ['a'] })]);
    const result = FinancialCloseEngine.validatePlan(plan);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('2. validatePlan detects self-dependency', () => {
    const plan = makePlan([makeTask({ id: 'a', dependencies: ['a'] })]);
    const result = FinancialCloseEngine.validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('depends on itself'))).toBe(true);
  });

  it('3. validatePlan detects duplicate task ids', () => {
    const plan = makePlan([makeTask({ id: 'a' }), makeTask({ id: 'a' })]);
    const result = FinancialCloseEngine.validatePlan(plan);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('4. detectCircularDependencies finds cycle', () => {
    const plan = makePlan([
      makeTask({ id: 'a', dependencies: ['b'] }),
      makeTask({ id: 'b', dependencies: ['a'] }),
    ]);
    const cycles = FinancialCloseEngine.detectCircularDependencies(plan);
    expect(cycles.length).toBeGreaterThan(0);
  });

  it('5. detectCircularDependencies returns empty for DAG', () => {
    const plan = makePlan([
      makeTask({ id: 'a' }),
      makeTask({ id: 'b', dependencies: ['a'] }),
      makeTask({ id: 'c', dependencies: ['a', 'b'] }),
    ]);
    expect(FinancialCloseEngine.detectCircularDependencies(plan)).toEqual([]);
  });

  it('6. getReadyTasks returns tasks with all deps complete', () => {
    const plan = makePlan([makeTask({ id: 'a' }), makeTask({ id: 'b', dependencies: ['a'] })]);
    const instances = [makeInstance({ taskId: 'a', status: 'complete' })];
    const ready = FinancialCloseEngine.getReadyTasks(plan, instances);
    expect(ready).toContain('b');
    expect(ready).not.toContain('a'); // already complete
  });

  it('7. getReadyTasks does NOT return blocked tasks', () => {
    const plan = makePlan([makeTask({ id: 'a' }), makeTask({ id: 'b', dependencies: ['a'] })]);
    const instances: CloseTaskInstance[] = []; // nothing complete
    const ready = FinancialCloseEngine.getReadyTasks(plan, instances);
    expect(ready).toContain('a');
    expect(ready).not.toContain('b');
  });

  it('8. assignApprover moves not-started to in-progress', () => {
    const inst = makeInstance({ taskId: 'a', status: 'not-started' });
    const result = FinancialCloseEngine.assignApprover(inst, 'alice');
    expect(result.assignee).toBe('alice');
    expect(result.status).toBe('in-progress');
    expect(result.startedAt).not.toBeNull();
  });

  it('9. markComplete sets status and completedAt', () => {
    const inst = makeInstance({ taskId: 'a', status: 'in-progress' });
    const result = FinancialCloseEngine.markComplete(inst);
    expect(result.status).toBe('complete');
    expect(result.completedAt).not.toBeNull();
  });

  it('10. isPeriodLockable returns true when all critical tasks complete', () => {
    const plan = makePlan([
      makeTask({ id: 'crit1', priority: 'critical' }),
      makeTask({ id: 'norm1', priority: 'low' }),
    ]);
    const instances = [
      makeInstance({ taskId: 'crit1', status: 'complete' }),
      makeInstance({ taskId: 'norm1', status: 'not-started' }),
    ];
    expect(FinancialCloseEngine.isPeriodLockable(plan, instances)).toBe(true);
  });

  it('11. isPeriodLockable returns false when critical task incomplete', () => {
    const plan = makePlan([makeTask({ id: 'crit1', priority: 'critical' })]);
    const instances: CloseTaskInstance[] = [];
    expect(FinancialCloseEngine.isPeriodLockable(plan, instances)).toBe(false);
  });

  it('12. computeProgress returns correct percentages', () => {
    const plan = makePlan([makeTask({ id: 'a' }), makeTask({ id: 'b' }), makeTask({ id: 'c' })]);
    const instances = [makeInstance({ taskId: 'a', status: 'complete' })];
    const progress = FinancialCloseEngine.computeProgress(plan, instances);
    expect(progress.totalTasks).toBe(3);
    expect(progress.completedTasks).toBe(1);
    expect(progress.percentComplete).toBe(33);
  });

  it('13. generateChecklist returns monthly tasks (9 default)', () => {
    const checklist = FinancialCloseEngine.generateChecklist('monthly', 'US-GAAP');
    expect(checklist.length).toBe(9);
    expect(checklist.find((t) => t.id === 'accruals')).toBeDefined();
  });

  it('14. generateChecklist returns quarterly tasks (10 with 10-Q)', () => {
    const checklist = FinancialCloseEngine.generateChecklist('quarterly', 'US-GAAP');
    expect(checklist.length).toBe(10);
    expect(checklist.find((t) => t.id === '10q')).toBeDefined();
  });

  it('15. generateChecklist returns yearly tasks (11 with 10-K and audit)', () => {
    const checklist = FinancialCloseEngine.generateChecklist('yearly', 'US-GAAP');
    expect(checklist.length).toBe(11);
    expect(checklist.find((t) => t.id === '10k')).toBeDefined();
    expect(checklist.find((t) => t.id === 'audit')).toBeDefined();
  });
});
