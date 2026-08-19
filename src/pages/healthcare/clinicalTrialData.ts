/**
 * Clinical-trial cost analysis from trials the user has actually recorded.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **No fixture trials.** The page hardcoded five studies at named
 *    institutions — Onco-Shield Ph III at Mayo Clinic ($5.2M budget / $4.8M
 *    actual), Neuro-Restore Ph II at Johns Hopkins, Cardio-Flow Ph I at
 *    Cleveland Clinic, Immuno-Boost Ph III at Cedars-Sinai, RareDisease-7 at
 *    Stanford Med — plus six months of budget/actual/enrolment. Every tenant
 *    saw the same portfolio. Trials now come from
 *    `healthcareStore.clinicalTrials`, which defaults to empty.
 * 2. **No literal KPI strip.** `$24.8M` total budget, `$18.5k` cost per
 *    patient, `92.4%` enrolment and `$3.2M` of R&D tax credits were strings,
 *    each with an invented delta (`+12.4% — 4 new trials in Q1`) and a
 *    seven-point sparkline "history". The first three are now derived; R&D tax
 *    credits are disclosed as needing a tax computation the workspace does not
 *    run.
 * 3. **Cost per patient needs patients.** It is `null` when no trial has
 *    enrolled anyone — never a divide-by-zero stand-in.
 * 4. Enrolment rate is enrolled ÷ target, and a trial with no target has no
 *    rate rather than a 0% one.
 * 5. All arithmetic is decimal.js via `@/utils/money`.
 */

import Decimal from 'decimal.js';
import { compareMoney, divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface ClinicalTrialInput {
  readonly id: string;
  readonly name: string;
  readonly site: string;
  readonly phase: string;
  readonly budget: number;
  readonly actualSpend: number;
  readonly targetEnrollment: number;
  readonly enrolled: number;
  readonly status: 'planned' | 'enrolling' | 'active' | 'completed';
}

export interface TrialRow {
  readonly id: string;
  readonly name: string;
  readonly site: string;
  readonly phase: string;
  readonly status: ClinicalTrialInput['status'];
  readonly budget: number;
  readonly actualSpend: number;
  readonly variance: number;
  /** Spend over budget, percent. `null` when no budget is recorded. */
  readonly variancePercent: number | null;
  readonly enrolled: number;
  readonly targetEnrollment: number;
  /** Enrolled ÷ target, percent. `null` without a target. */
  readonly enrollmentPercent: number | null;
  /** Spend ÷ patients enrolled. `null` until someone is enrolled. */
  readonly costPerPatient: number | null;
  readonly overBudget: boolean;
}

export interface PhaseRow {
  readonly phase: string;
  readonly count: number;
  readonly budget: number;
  readonly spend: number;
  /** Share of recorded budget; `null` when nothing is budgeted. */
  readonly sharePercent: number | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface ClinicalTrialAnalysis {
  readonly trials: readonly TrialRow[];
  readonly totalBudget: number;
  readonly totalSpend: number;
  readonly totalVariance: number;
  readonly totalEnrolled: number;
  readonly totalTarget: number;
  readonly enrollmentPercent: number | null;
  readonly costPerPatient: number | null;
  readonly overBudgetCount: number;
  readonly phases: readonly PhaseRow[];
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

function percentOf(numer: Decimal, denom: Decimal): number | null {
  if (!denom.greaterThan(0)) return null;
  return divideMoney(numer, denom).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber();
}

function perUnit(total: Decimal, units: number): number | null {
  if (units <= 0) return null;
  return divideMoney(total, units).toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

/**
 * Derive trial cost analysis.
 *
 * Returns `null` when no trial has been recorded — the page must ask for a
 * study rather than demonstrate five.
 */
export function deriveClinicalTrialAnalysis(
  trials: readonly ClinicalTrialInput[]
): ClinicalTrialAnalysis | null {
  if (trials.length === 0) return null;

  const rows: TrialRow[] = trials.map((t) => {
    const budget = money(t.budget);
    const spend = money(t.actualSpend);
    const variance = spend.minus(budget);
    return {
      id: t.id,
      name: t.name,
      site: t.site,
      phase: t.phase,
      status: t.status,
      budget: cash(budget),
      actualSpend: cash(spend),
      variance: cash(variance),
      variancePercent: percentOf(variance, budget),
      enrolled: t.enrolled,
      targetEnrollment: t.targetEnrollment,
      enrollmentPercent:
        t.targetEnrollment > 0
          ? divideMoney(t.enrolled, t.targetEnrollment)
              .times(100)
              .toDecimalPlaces(PERCENT_PLACES)
              .toNumber()
          : null,
      costPerPatient: perUnit(spend, t.enrolled),
      overBudget: variance.greaterThan(0),
    };
  });

  const totalBudget = sumMoney(rows.map((r) => r.budget));
  const totalSpend = sumMoney(rows.map((r) => r.actualSpend));
  const totalEnrolled = rows.reduce((a, r) => a + r.enrolled, 0);
  const totalTarget = rows.reduce((a, r) => a + r.targetEnrollment, 0);

  const phaseTotals = new Map<string, { budget: Decimal; spend: Decimal; count: number }>();
  for (const r of rows) {
    const bucket = phaseTotals.get(r.phase) ?? { budget: ZERO, spend: ZERO, count: 0 };
    phaseTotals.set(r.phase, {
      budget: bucket.budget.plus(money(r.budget)),
      spend: bucket.spend.plus(money(r.actualSpend)),
      count: bucket.count + 1,
    });
  }
  const phases: PhaseRow[] = [...phaseTotals.entries()]
    .map(([phase, v]) => ({
      phase,
      count: v.count,
      budget: cash(v.budget),
      spend: cash(v.spend),
      sharePercent: percentOf(v.budget, totalBudget),
    }))
    // Ordering only: compareMoney keeps the comparison exact and out of raw
    // float subtraction on currency values.
    .sort((a, b) => compareMoney(b.budget, a.budget) || a.phase.localeCompare(b.phase));

  const unavailable: UnavailableLine[] = [];
  if (totalEnrolled === 0) {
    unavailable.push({
      label: 'Cost per patient',
      reason: 'No trial has enrolled a patient yet, so there is nothing to divide spend by.',
    });
  }
  unavailable.push(
    {
      label: 'R&D tax credits',
      reason:
        'Qualifying-expenditure tests and credit rates are a tax computation this workspace does not run. Record the credit once it is claimed.',
    },
    {
      label: 'Month-by-month trial spend',
      reason:
        'Trial records carry a budget and spend to date, not a monthly profile. Import per-period trial costs to see a spend curve.',
    }
  );

  return {
    trials: rows,
    totalBudget: cash(totalBudget),
    totalSpend: cash(totalSpend),
    totalVariance: cash(totalSpend.minus(totalBudget)),
    totalEnrolled,
    totalTarget,
    enrollmentPercent:
      totalTarget > 0
        ? divideMoney(totalEnrolled, totalTarget)
            .times(100)
            .toDecimalPlaces(PERCENT_PLACES)
            .toNumber()
        : null,
    costPerPatient: perUnit(totalSpend, totalEnrolled),
    overBudgetCount: rows.filter((r) => r.overBudget).length,
    phases,
    unavailable,
  };
}
