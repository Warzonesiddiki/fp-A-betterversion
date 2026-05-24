import { describe, it, expect } from 'vitest';
import {
  MONTHS,
  MONTHS_FULL,
  QUARTERS,
  QUARTER_MONTHS,
  BUDGET_STATUSES,
  FORECAST_TYPES,
  ACCOUNT_TYPES,
  ROLES,
  VAR_STATUSES,
  THRESHOLD_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  IMPORT_STATUSES,
  SCENARIO_TYPES,
  VARIANCE_THRESHOLDS,
  CURRENCIES,
  INDUSTRIES,
} from '../constants';

describe('constants', () => {
  it('MONTHS has 12 entries', () => {
    expect(MONTHS).toHaveLength(12);
    expect(MONTHS[0]).toBe('Jan');
  });

  it('MONTHS_FULL has 12 entries', () => {
    expect(MONTHS_FULL).toHaveLength(12);
    expect(MONTHS_FULL[0]).toBe('January');
  });

  it('QUARTERS are defined', () => {
    expect(QUARTERS).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });

  it('QUARTER_MONTHS maps quarters to month indices', () => {
    expect(QUARTER_MONTHS.Q1).toEqual([0, 1, 2]);
    expect(QUARTER_MONTHS.Q4).toEqual([9, 10, 11]);
  });

  it('BUDGET_STATUSES has correct values', () => {
    expect(BUDGET_STATUSES).toContain('Draft');
    expect(BUDGET_STATUSES).toContain('Approved');
  });

  it('FORECAST_TYPES has correct values', () => {
    expect(FORECAST_TYPES).toContain('Rolling');
  });

  it('ACCOUNT_TYPES has all types', () => {
    expect(ACCOUNT_TYPES).toContain('Revenue');
    expect(ACCOUNT_TYPES).toContain('Equity');
  });

  it('ROLES has all roles', () => {
    expect(ROLES).toContain('Admin');
    expect(ROLES).toContain('Viewer');
  });

  it('VAR_STATUSES has all statuses', () => {
    expect(VAR_STATUSES).toContain('Favorable');
  });

  it('THRESHOLD_STATUSES has all thresholds', () => {
    expect(THRESHOLD_STATUSES).toContain('Within');
  });

  it('TASK_STATUSES and TASK_PRIORITIES', () => {
    expect(TASK_STATUSES).toContain('Done');
    expect(TASK_PRIORITIES).toContain('Critical');
  });

  it('IMPORT_STATUSES and SCENARIO_TYPES', () => {
    expect(IMPORT_STATUSES).toContain('Completed');
    expect(SCENARIO_TYPES).toContain('Base');
  });

  it('VARIANCE_THRESHOLDS has correct values', () => {
    expect(VARIANCE_THRESHOLDS.WITHIN).toBe(5);
    expect(VARIANCE_THRESHOLDS.WATCH).toBe(10);
  });

  it('CURRENCIES has common currencies', () => {
    expect(CURRENCIES).toContain('USD');
    expect(CURRENCIES).toContain('EUR');
  });

  it('INDUSTRIES has various industries', () => {
    expect(INDUSTRIES).toContain('Technology');
    expect(INDUSTRIES).toContain('Healthcare');
  });
});
