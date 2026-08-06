/**
 * Education exact-money metric model (Wave 9 Phase 3 — Sector Depth).
 *
 * Pure KPIs for enrollment/retention, tuition revenue and research grants,
 * computed exclusively through the canonical money primitives. Every ratio
 * guards its denominator; none fabricates a value on missing input.
 */
import {
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

export interface EducationMetricsInput {
  /** Students at the start of the academic year. */
  totalStudents: number;
  /** Students retained into the following year. */
  retainedStudents: number;
  /** Tuition & fee revenue recognized. */
  tuitionRevenue: number;
  /** Total operating expense. */
  totalExpenses: number;
  /** Full-time-equivalent faculty count. */
  facultyCount: number;
  /** Research grants won. */
  researchGrantsWon: number;
  /** Research grants applied for. */
  researchGrantsApplied: number;
  /** Endowment value at period start. */
  endowmentStart: number;
  /** Endowment value at period end. */
  endowmentEnd: number;
}

export interface EducationMetrics {
  studentRetentionRatePct: number;
  revenuePerStudent: number;
  facultyToStudentRatio: number;
  researchGrantWinRatePct: number;
  endowmentGrowthRatePct: number;
  endowmentGrowth: number;
  netIncome: number;
}

export function sumTuition(amounts: readonly number[]): number {
  return roundTo(sumMoney(amounts), 2);
}

/** Exact revenue per student; 0 when no students. */
export function computeRevenuePerStudent(tuitionRevenue: number, totalStudents: number): number {
  if (!toDecimal(totalStudents).gt(0)) return 0;
  return roundTo(divideMoney(tuitionRevenue, totalStudents), 2);
}

/** Exact percentage share, guarding zero denominator. */
export function computeRatioPct(numerator: number, denominator: number): number {
  if (!toDecimal(denominator).gt(0)) return 0;
  return roundTo(divideMoney(numerator, denominator).times(100), 2);
}

/** Exact students-per-faculty ratio; 0 when no faculty. */
export function computeFacultyToStudentRatio(totalStudents: number, facultyCount: number): number {
  if (!toDecimal(facultyCount).gt(0)) return 0;
  return roundTo(divideMoney(totalStudents, facultyCount), 2);
}

export function computeEducationMetrics(input: EducationMetricsInput): EducationMetrics {
  const studentRetentionRatePct = computeRatioPct(input.retainedStudents, input.totalStudents);
  const revenuePerStudent = computeRevenuePerStudent(input.tuitionRevenue, input.totalStudents);
  const facultyToStudentRatio = computeFacultyToStudentRatio(
    input.totalStudents,
    input.facultyCount
  );
  const researchGrantWinRatePct = computeRatioPct(
    input.researchGrantsWon,
    input.researchGrantsApplied
  );
  const endowmentGrowth = roundTo(subtractMoney(input.endowmentEnd, input.endowmentStart), 2);
  const endowmentGrowthRatePct = computeRatioPct(endowmentGrowth, input.endowmentStart);
  const netIncome = roundTo(subtractMoney(input.tuitionRevenue, input.totalExpenses), 2);

  return {
    studentRetentionRatePct,
    revenuePerStudent,
    facultyToStudentRatio,
    researchGrantWinRatePct,
    endowmentGrowthRatePct,
    endowmentGrowth,
    netIncome,
  };
}

/** Model tuition revenue from enrollment and per-student fee (exact). */
export function modelTuitionRevenue(totalStudents: number, perStudentFee: number): number {
  return roundTo(multiplyMoney(totalStudents, perStudentFee), 2);
}

/** Growth of a base amount by a driver percentage (exact, half-up). */
export function growthByRate(base: number, ratePct: number): number {
  return roundTo(multiplyMoney(base, toDecimal(1).plus(toDecimal(ratePct).div(100))), 2);
}

/** Sum two income lines exactly (e.g. tuition + grants). */
export function sumIncome(a: number, b: number): number {
  return roundTo(addMoney(a, b), 2);
}
