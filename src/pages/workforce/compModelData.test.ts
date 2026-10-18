import { describe, it, expect } from 'vitest';
import { derivePositionComp, applyMeritIncrease } from './compModelData';

/**
 * Phase 10 decontamination oracle: every number on the compensation
 * modelling page must come from actual employee records.
 */

const EMPLOYEES = [
  { position: 'Engineer', salary: 100000, status: 'active' },
  { position: 'Engineer', salary: 120000, status: 'active' },
  { position: 'Designer', salary: 80000, status: 'active' },
  { position: 'Engineer', salary: 999999, status: 'terminated' }, // excluded
  { position: '', salary: 50000, status: 'active' }, // unspecified position
];

describe('derivePositionComp', () => {
  it('groups ACTUAL active employees by position with real salary stats', () => {
    const rows = derivePositionComp(EMPLOYEES);
    expect(rows).toEqual([
      {
        position: 'Engineer',
        headcount: 2,
        minSalary: 100000,
        maxSalary: 120000,
        avgSalary: 110000,
        totalCost: 220000,
      },
      {
        position: 'Designer',
        headcount: 1,
        minSalary: 80000,
        maxSalary: 80000,
        avgSalary: 80000,
        totalCost: 80000,
      },
      {
        position: 'Unspecified position',
        headcount: 1,
        minSalary: 50000,
        maxSalary: 50000,
        avgSalary: 50000,
        totalCost: 50000,
      },
    ]);
  });

  it('no employees -> no rows (nothing invented)', () => {
    expect(derivePositionComp([])).toEqual([]);
  });
});

describe('applyMeritIncrease', () => {
  it('applies the scenario percentage to actual cost', () => {
    const [row] = applyMeritIncrease(derivePositionComp(EMPLOYEES), 10);
    expect(row).toMatchObject({
      position: 'Engineer',
      totalCost: 220000,
      newCost: 242000,
      increase: 22000,
    });
  });
});
