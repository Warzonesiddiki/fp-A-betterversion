import { describe, it, expect } from 'vitest';
import { deriveHeadcountPlan } from './headcountPlanData';

/**
 * Phase 10 decontamination oracle for the headcount plan page:
 * headcounts, costs and trend all from actual employee records.
 */

const EMPLOYEES = [
  { department: 'Engineering', salary: 100000, status: 'active', startDate: '2025-11-15' },
  { department: 'Engineering', salary: 120000, status: 'active', startDate: '2026-02-01' },
  { department: 'Sales', salary: 80000, status: 'active', startDate: '2026-03-10' },
  { department: 'Sales', salary: 1, status: 'terminated', startDate: '2025-01-01' },
];

describe('deriveHeadcountPlan', () => {
  it('derives department headcount and salary cost from active employees', () => {
    const plan = deriveHeadcountPlan(EMPLOYEES, '2026-03');
    expect(plan.departments).toEqual([
      { department: 'Engineering', current: 2, cost: 220000 },
      { department: 'Sales', current: 1, cost: 80000 },
    ]);
    expect(plan.totalHeadcount).toBe(3);
    expect(plan.totalCost).toBe(300000);
    expect(plan.avgCostPerHead).toBe(100000);
  });

  it('trend counts active employees started on or before each month end', () => {
    const plan = deriveHeadcountPlan(EMPLOYEES, '2026-03');
    expect(plan.trend).toEqual([
      { month: '2025-10', headcount: 0 },
      { month: '2025-11', headcount: 1 },
      { month: '2025-12', headcount: 1 },
      { month: '2026-01', headcount: 1 },
      { month: '2026-02', headcount: 2 },
      { month: '2026-03', headcount: 3 },
    ]);
  });
});
