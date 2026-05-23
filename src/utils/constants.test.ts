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
} from './constants';

describe('MONTHS', () => {
  it('should have 12 entries', () => {
    expect(MONTHS).toHaveLength(12);
  });

  it('should start with Jan and end with Dec', () => {
    expect(MONTHS[0]).toBe('Jan');
    expect(MONTHS[11]).toBe('Dec');
  });

  it('should contain all expected abbreviations', () => {
    const expected = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    expect(MONTHS).toEqual(expected);
  });
});

describe('MONTHS_FULL', () => {
  it('should have 12 entries', () => {
    expect(MONTHS_FULL).toHaveLength(12);
  });

  it('should start with January and end with December', () => {
    expect(MONTHS_FULL[0]).toBe('January');
    expect(MONTHS_FULL[11]).toBe('December');
  });

  it('should have full month names (May has 3 chars)', () => {
    for (const month of MONTHS_FULL) {
      expect(month.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('QUARTERS', () => {
  it('should have 4 entries', () => {
    expect(QUARTERS).toHaveLength(4);
  });

  it('should be Q1 through Q4', () => {
    expect(QUARTERS).toEqual(['Q1', 'Q2', 'Q3', 'Q4']);
  });
});

describe('QUARTER_MONTHS', () => {
  it('should map each quarter to 3 months', () => {
    for (const quarter of QUARTERS) {
      expect(QUARTER_MONTHS[quarter]).toHaveLength(3);
    }
  });

  it('should map Q1 to months 0,1,2', () => {
    expect(QUARTER_MONTHS.Q1).toEqual([0, 1, 2]);
  });

  it('should map Q2 to months 3,4,5', () => {
    expect(QUARTER_MONTHS.Q2).toEqual([3, 4, 5]);
  });

  it('should map Q3 to months 6,7,8', () => {
    expect(QUARTER_MONTHS.Q3).toEqual([6, 7, 8]);
  });

  it('should map Q4 to months 9,10,11', () => {
    expect(QUARTER_MONTHS.Q4).toEqual([9, 10, 11]);
  });

  it('should cover all 12 months exactly once', () => {
    const allMonths = [
      ...QUARTER_MONTHS.Q1,
      ...QUARTER_MONTHS.Q2,
      ...QUARTER_MONTHS.Q3,
      ...QUARTER_MONTHS.Q4,
    ];
    expect(allMonths.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('BUDGET_STATUSES', () => {
  it('should have 5 statuses', () => {
    expect(BUDGET_STATUSES).toHaveLength(5);
  });

  it('should include Draft, InReview, Approved, Locked, Rejected', () => {
    expect(BUDGET_STATUSES).toContain('Draft');
    expect(BUDGET_STATUSES).toContain('InReview');
    expect(BUDGET_STATUSES).toContain('Approved');
    expect(BUDGET_STATUSES).toContain('Locked');
    expect(BUDGET_STATUSES).toContain('Rejected');
  });
});

describe('FORECAST_TYPES', () => {
  it('should have 3 types', () => {
    expect(FORECAST_TYPES).toHaveLength(3);
  });

  it('should include Rolling, Quarterly, Annual', () => {
    expect(FORECAST_TYPES).toEqual(['Rolling', 'Quarterly', 'Annual']);
  });
});

describe('ACCOUNT_TYPES', () => {
  it('should have 7 account types', () => {
    expect(ACCOUNT_TYPES).toHaveLength(7);
  });

  it('should include all financial statement categories', () => {
    expect(ACCOUNT_TYPES).toContain('Revenue');
    expect(ACCOUNT_TYPES).toContain('COGS');
    expect(ACCOUNT_TYPES).toContain('OpEx');
    expect(ACCOUNT_TYPES).toContain('CapEx');
    expect(ACCOUNT_TYPES).toContain('Asset');
    expect(ACCOUNT_TYPES).toContain('Liability');
    expect(ACCOUNT_TYPES).toContain('Equity');
  });
});

describe('ROLES', () => {
  it('should have 5 roles', () => {
    expect(ROLES).toHaveLength(5);
  });

  it('should include all expected roles', () => {
    expect(ROLES).toContain('Admin');
    expect(ROLES).toContain('FP&A_Manager');
    expect(ROLES).toContain('Analyst');
    expect(ROLES).toContain('Department_Head');
    expect(ROLES).toContain('Viewer');
  });
});

describe('VAR_STATUSES', () => {
  it('should have 3 variance statuses', () => {
    expect(VAR_STATUSES).toEqual(['Favorable', 'Unfavorable', 'Neutral']);
  });
});

describe('THRESHOLD_STATUSES', () => {
  it('should have 3 threshold statuses', () => {
    expect(THRESHOLD_STATUSES).toEqual(['Within', 'Watch', 'Significant']);
  });
});

describe('TASK_STATUSES', () => {
  it('should have 3 task statuses', () => {
    expect(TASK_STATUSES).toEqual(['Todo', 'InProgress', 'Done']);
  });
});

describe('TASK_PRIORITIES', () => {
  it('should have 4 priority levels', () => {
    expect(TASK_PRIORITIES).toEqual(['Low', 'Medium', 'High', 'Critical']);
  });
});

describe('IMPORT_STATUSES', () => {
  it('should have 4 import statuses', () => {
    expect(IMPORT_STATUSES).toEqual(['Pending', 'Processing', 'Completed', 'Failed']);
  });
});

describe('SCENARIO_TYPES', () => {
  it('should have 4 scenario types', () => {
    expect(SCENARIO_TYPES).toEqual(['Base', 'Optimistic', 'Pessimistic', 'Custom']);
  });
});

describe('VARIANCE_THRESHOLDS', () => {
  it('should define WITHIN threshold at 5%', () => {
    expect(VARIANCE_THRESHOLDS.WITHIN).toBe(5);
  });

  it('should define WATCH threshold at 10%', () => {
    expect(VARIANCE_THRESHOLDS.WATCH).toBe(10);
  });

  it('should have WATCH > WITHIN', () => {
    expect(VARIANCE_THRESHOLDS.WATCH).toBeGreaterThan(VARIANCE_THRESHOLDS.WITHIN);
  });
});

describe('CURRENCIES', () => {
  it('should have 10 currencies', () => {
    expect(CURRENCIES).toHaveLength(10);
  });

  it('should include major world currencies', () => {
    expect(CURRENCIES).toContain('USD');
    expect(CURRENCIES).toContain('EUR');
    expect(CURRENCIES).toContain('GBP');
    expect(CURRENCIES).toContain('JPY');
  });

  it('should all be 3-letter codes', () => {
    for (const currency of CURRENCIES) {
      expect(currency).toMatch(/^[A-Z]{3}$/);
    }
  });
});

describe('INDUSTRIES', () => {
  it('should have 12 industries', () => {
    expect(INDUSTRIES).toHaveLength(12);
  });

  it('should include key sectors', () => {
    expect(INDUSTRIES).toContain('Technology');
    expect(INDUSTRIES).toContain('Healthcare');
    expect(INDUSTRIES).toContain('Financial Services');
    expect(INDUSTRIES).toContain('Manufacturing');
  });
});
