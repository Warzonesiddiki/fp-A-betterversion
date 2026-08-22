/**
 * GAP-1 / F-0006 known-answer tests for the Education exact-money model
 * (Wave 9 Phase 3 — Sector Depth).
 *
 * Falsifiability: fails under naive float math and old placeholder logic.
 */
import { describe, expect, it } from 'vitest';
import {
  computeEducationMetrics,
  computeFacultyToStudentRatio,
  computeRatioPct,
  computeRevenuePerStudent,
  growthByRate,
  modelTuitionRevenue,
  sumIncome,
  sumTuition,
} from './educationMetrics';

describe('educationMetrics — known answers (GAP-1)', () => {
  it('sums fractional tuition exactly (0.1 + 0.2 = 0.3)', () => {
    expect(sumTuition([0.1, 0.2])).toBe(0.3);
  });

  it('0.335 × 3 rounds half-up to 1.01 (endowment growth)', () => {
    expect(growthByRate(0.335, 200)).toBe(1.01);
  });

  it('sumIncome avoids IEEE-754 drift', () => {
    expect(sumIncome(0.1, 0.2)).toBe(0.3);
    expect(sumIncome(0.05, 0.05)).toBe(0.1);
  });

  it('computes revenue per student exactly', () => {
    expect(computeRevenuePerStudent(24_000_000, 12_000)).toBe(2000);
    expect(computeRevenuePerStudent(0.3, 2)).toBe(0.15);
  });

  it('returns 0 revenue per student for zero students', () => {
    expect(computeRevenuePerStudent(1000, 0)).toBe(0);
  });

  it('returns 0 ratio for zero denominator', () => {
    expect(computeRatioPct(10, 0)).toBe(0);
    expect(computeFacultyToStudentRatio(1000, 0)).toBe(0);
  });

  it('full metric model produces deterministic known answer', () => {
    const m = computeEducationMetrics({
      totalStudents: 12_000,
      retainedStudents: 11_400,
      tuitionRevenue: 24_000_000,
      totalExpenses: 21_600_000,
      facultyCount: 800,
      researchGrantsWon: 60,
      researchGrantsApplied: 250,
      endowmentStart: 100_000_000,
      endowmentEnd: 108_000_000,
    });
    expect(m.studentRetentionRatePct).toBe(95);
    expect(m.revenuePerStudent).toBe(2000);
    expect(m.facultyToStudentRatio).toBe(15);
    expect(m.researchGrantWinRatePct).toBe(24);
    expect(m.endowmentGrowth).toBe(8_000_000);
    expect(m.endowmentGrowthRatePct).toBe(8);
    expect(m.netIncome).toBe(2_400_000);
  });

  it('handles expense-over-revenue (negative net income) exactly', () => {
    const m = computeEducationMetrics({
      totalStudents: 5000,
      retainedStudents: 4600,
      tuitionRevenue: 8_000_000,
      totalExpenses: 9_000_000,
      facultyCount: 400,
      researchGrantsWon: 20,
      researchGrantsApplied: 100,
      endowmentStart: 50_000_000,
      endowmentEnd: 50_000_000,
    });
    expect(m.netIncome).toBe(-1_000_000);
    expect(m.endowmentGrowthRatePct).toBe(0);
  });

  // W-FAB lane N4: quantities the ledger never posted are `null` in and
  // `null` out — the previous pages hard-coded a 12,000-student institution
  // with a $100M endowment to keep every KPI populated.
  it('returns null KPIs when their inputs were never posted (W-FAB)', () => {
    const m = computeEducationMetrics({
      totalStudents: null,
      retainedStudents: null,
      tuitionRevenue: null,
      totalExpenses: null,
      facultyCount: null,
      researchGrantsWon: null,
      researchGrantsApplied: null,
      endowmentStart: null,
      endowmentEnd: null,
    });
    expect(m.studentRetentionRatePct).toBeNull();
    expect(m.revenuePerStudent).toBeNull();
    expect(m.facultyToStudentRatio).toBeNull();
    expect(m.researchGrantWinRatePct).toBeNull();
    expect(m.endowmentGrowth).toBeNull();
    expect(m.endowmentGrowthRatePct).toBeNull();
    expect(m.netIncome).toBeNull();
  });

  it('keeps partial coverage honest (grants posted, students missing)', () => {
    const m = computeEducationMetrics({
      totalStudents: null,
      retainedStudents: null,
      tuitionRevenue: null,
      totalExpenses: 900_000,
      facultyCount: null,
      researchGrantsWon: 50,
      researchGrantsApplied: 200,
      endowmentStart: 50_000_000,
      endowmentEnd: 55_000_000,
    });
    expect(m.researchGrantWinRatePct).toBe(25);
    expect(m.endowmentGrowth).toBe(5_000_000);
    expect(m.endowmentGrowthRatePct).toBe(10);
    expect(m.studentRetentionRatePct).toBeNull();
    expect(m.revenuePerStudent).toBeNull();
    expect(m.facultyToStudentRatio).toBeNull();
    expect(m.netIncome).toBeNull(); // tuition missing → not derivable
  });

  it('modelTuitionRevenue is exact', () => {
    expect(modelTuitionRevenue(12000, 2000)).toBe(24_000_000);
    expect(modelTuitionRevenue(0.1, 0.3)).toBe(0.03);
  });
});
