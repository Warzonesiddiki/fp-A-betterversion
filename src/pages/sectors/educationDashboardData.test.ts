import { describe, it, expect } from 'vitest';
import {
  deriveEducationDashboard,
  type EducationBudgetLine,
  type EducationGLEntry,
  type EducationEnrollmentRow,
} from './educationDashboardData';

/**
 * Known-answer tests for the education dashboard derivation.
 *
 * Seeded ledger (hand-computed):
 *   4010 Tuition        credit 800,000, debit 50,000 (refunds) -> 750,000
 *   4020 Research Grant credit 250,000                          -> 250,000
 *   6010 Faculty Pay    debit  400,000                          -> 400,000
 *   6020 Facilities     debit  100,000, credit 25,000 (rebate)  ->  75,000
 *   revenue 1,000,000 · expense 475,000 · net 525,000
 *   revenue shares 75% / 25%; expense shares 84.21% / 15.79%
 */
function entry(
  accountCode: string,
  accountName: string,
  debit: number,
  credit: number
): EducationGLEntry {
  return { accountCode, accountName, debit, credit };
}

const LEDGER: EducationGLEntry[] = [
  entry('4010', 'Tuition', 0, 800000),
  entry('4010', 'Tuition', 50000, 0),
  entry('4020', 'Research Grant', 0, 250000),
  entry('6010', 'Faculty Pay', 400000, 0),
  entry('6020', 'Facilities', 100000, 0),
  entry('6020', 'Facilities', 0, 25000),
];

const BUDGET: EducationBudgetLine[] = [
  { accountCode: '4010', accountName: 'Tuition', amount: 700000 },
  { accountCode: '6010', accountName: 'Faculty Pay', amount: 380000 },
  { accountCode: '9999', accountName: 'Unposted Programme', amount: 50000 },
];

const ENROLLMENT: EducationEnrollmentRow[] = [
  { semester: 'Fall 2025', undergraduate: 800, graduate: 200, total: 1000 },
];

describe('deriveEducationDashboard — totals', () => {
  it('reads the ledger instead of a fictional university', () => {
    const d = deriveEducationDashboard(LEDGER)!;
    expect(d.totalRevenue).toBe(1000000);
    expect(d.totalExpense).toBe(475000);
    expect(d.netResult).toBe(525000);
  });

  it('nets contra entries by natural balance', () => {
    const d = deriveEducationDashboard(LEDGER)!;
    const tuition = d.revenueBySource.find((r) => r.accountCode === '4010')!;
    const facilities = d.expenseDistribution.find((r) => r.accountCode === '6020')!;
    // Math.abs would give 850,000 and 125,000.
    expect(tuition.value).toBe(750000);
    expect(facilities.value).toBe(75000);
  });

  it('groups by account with shares that sum to 100', () => {
    const d = deriveEducationDashboard(LEDGER)!;
    expect(d.revenueBySource.map((r) => [r.accountName, r.value, r.sharePercent])).toEqual([
      ['Tuition', 750000, 75],
      ['Research Grant', 250000, 25],
    ]);
    expect(d.expenseDistribution.map((r) => r.sharePercent)).toEqual([84.21, 15.79]);
  });

  it('returns null when nothing is posted to revenue or cost', () => {
    expect(deriveEducationDashboard([])).toBeNull();
    expect(deriveEducationDashboard([entry('1000', 'Cash', 10, 0)])).toBeNull();
  });
});

describe('deriveEducationDashboard — budget vs actual', () => {
  it('joins by account code and never invents a category label', () => {
    const d = deriveEducationDashboard(LEDGER, BUDGET)!;
    expect(d.budgetVsActual.map((r) => r.accountCode)).toEqual(['4010', '6010']);
    expect(d.budgetVsActual[0]).toEqual({
      accountCode: '4010',
      accountName: 'Tuition',
      budget: 700000,
      actual: 750000,
      variance: 50000,
      variancePercent: 7.14,
      favorable: true,
    });
  });

  it('treats cost over budget as unfavourable and revenue over budget as favourable', () => {
    const d = deriveEducationDashboard(LEDGER, BUDGET)!;
    const faculty = d.budgetVsActual.find((r) => r.accountCode === '6010')!;
    expect(faculty.variance).toBe(20000);
    // The old page decided favourability by searching the label for "Revenue".
    expect(faculty.favorable).toBe(false);
  });

  it('drops budget lines with no posted actual instead of showing a 100% shortfall', () => {
    const d = deriveEducationDashboard(LEDGER, BUDGET)!;
    expect(d.budgetVsActual.find((r) => r.accountCode === '9999')).toBeUndefined();
  });

  it('emits a null variance percent rather than dividing by a zero budget', () => {
    const d = deriveEducationDashboard(LEDGER, [
      { accountCode: '4010', accountName: 'Tuition', amount: 0 },
    ])!;
    expect(d.budgetVsActual[0]!.variancePercent).toBeNull();
  });
});

describe('deriveEducationDashboard — non-ledger facts', () => {
  it('declares enrolment unavailable when none was recorded', () => {
    const d = deriveEducationDashboard(LEDGER)!;
    expect(d.enrollment).toEqual([]);
    expect(d.latestEnrollment).toBeNull();
    expect(d.costPerStudent).toBeNull();
    expect(d.unavailable.map((u) => u.label)).toContain(
      'Enrolment, cost per student and student-faculty ratio'
    );
  });

  it('computes cost per student only from recorded enrolment', () => {
    const d = deriveEducationDashboard(LEDGER, [], ENROLLMENT)!;
    expect(d.latestEnrollment).toBe(1000);
    expect(d.costPerStudent).toBe(475); // 475,000 / 1,000
    expect(d.unavailable.map((u) => u.label)).not.toContain(
      'Enrolment, cost per student and student-faculty ratio'
    );
  });

  it('always declares endowment utilisation unavailable', () => {
    const d = deriveEducationDashboard(LEDGER, BUDGET, ENROLLMENT)!;
    expect(d.unavailable.map((u) => u.label)).toContain('Endowment utilisation');
  });

  it('uses decimal arithmetic — no IEEE-754 drift', () => {
    const pennies: EducationGLEntry[] = [
      entry('4010', 'Tuition', 0, 0.1),
      entry('4010', 'Tuition', 0, 0.2),
      entry('6010', 'Pay', 0.3, 0),
    ];
    const d = deriveEducationDashboard(pennies)!;
    expect(d.totalRevenue).toBe(0.3);
    expect(d.netResult).toBe(0);
  });
});
