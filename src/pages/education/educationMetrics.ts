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

// W-FAB (fleet wave 2, lane N4): inputs are `number | null` — `null` means the
// quantity was never posted to the GL (no tagged account). The pages feeding
// this model previously hard-coded an entire fictional institution (12,000
// students, $24M tuition, 800 faculty, $100M→$108M endowment, 60-of-250
// grants), which fabricated measured-looking KPIs. A KPI whose inputs were
// never posted is now `null` — never estimated.
export interface EducationMetricsInput {
  /** Students at the start of the academic year; `null` when not posted. */
  totalStudents: number | null;
  /** Students retained into the following year; `null` when not posted. */
  retainedStudents: number | null;
  /** Tuition & fee revenue recognized; `null` when not posted. */
  tuitionRevenue: number | null;
  /** Total operating expense; `null` when not posted. */
  totalExpenses: number | null;
  /** Full-time-equivalent faculty count; `null` when not posted. */
  facultyCount: number | null;
  /** Research grants won; `null` when not posted. */
  researchGrantsWon: number | null;
  /** Research grants applied for; `null` when not posted. */
  researchGrantsApplied: number | null;
  /** Endowment value at period start; `null` when not posted. */
  endowmentStart: number | null;
  /** Endowment value at period end; `null` when not posted. */
  endowmentEnd: number | null;
}

export interface EducationMetrics {
  /** `null` unless retention and enrollment counts are both posted. */
  studentRetentionRatePct: number | null;
  /** `null` unless tuition revenue and enrollment are both posted. */
  revenuePerStudent: number | null;
  /** `null` unless enrollment and faculty counts are both posted. */
  facultyToStudentRatio: number | null;
  /** `null` unless won and applied grant counts are both posted. */
  researchGrantWinRatePct: number | null;
  /** End dollar growth; `null` unless both endowment balances are posted. */
  endowmentGrowth: number | null;
  /** `null` unless growth is derivable from a positive opening balance. */
  endowmentGrowthRatePct: number | null;
  /** Tuition − expenses; `null` unless both are posted. */
  netIncome: number | null;
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
  const studentRetentionRatePct =
    input.retainedStudents !== null &&
    input.totalStudents !== null &&
    toDecimal(input.totalStudents).gt(0)
      ? computeRatioPct(input.retainedStudents, input.totalStudents)
      : null;
  const revenuePerStudent =
    input.tuitionRevenue !== null &&
    input.totalStudents !== null &&
    toDecimal(input.totalStudents).gt(0)
      ? computeRevenuePerStudent(input.tuitionRevenue, input.totalStudents)
      : null;
  const facultyToStudentRatio =
    input.totalStudents !== null &&
    input.facultyCount !== null &&
    toDecimal(input.facultyCount).gt(0)
      ? computeFacultyToStudentRatio(input.totalStudents, input.facultyCount)
      : null;
  const researchGrantWinRatePct =
    input.researchGrantsWon !== null &&
    input.researchGrantsApplied !== null &&
    toDecimal(input.researchGrantsApplied).gt(0)
      ? computeRatioPct(input.researchGrantsWon, input.researchGrantsApplied)
      : null;
  const endowmentGrowth =
    input.endowmentEnd !== null && input.endowmentStart !== null
      ? roundTo(subtractMoney(input.endowmentEnd, input.endowmentStart), 2)
      : null;
  const endowmentGrowthRatePct =
    endowmentGrowth !== null &&
    input.endowmentStart !== null &&
    toDecimal(input.endowmentStart).gt(0)
      ? computeRatioPct(endowmentGrowth, input.endowmentStart)
      : null;
  const netIncome =
    input.tuitionRevenue !== null && input.totalExpenses !== null
      ? roundTo(subtractMoney(input.tuitionRevenue, input.totalExpenses), 2)
      : null;

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
