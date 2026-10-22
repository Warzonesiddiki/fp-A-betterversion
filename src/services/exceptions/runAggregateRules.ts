/**
 * Aggregate catalogue rules R-001…R-004 (Phase 4 slice): monthly baselines
 * now exist, so these rules get real evaluators. R-005 remains PROPOSED in
 * the catalogue and is deliberately not run — a rule that cannot run is
 * never presented as running.
 *
 * Semantics follow each rule's catalogue formula exactly:
 * - R-001 revenue variance: |actual − baseline| / baseline > 0.20, where
 *   baseline is the mean of all prior present months; actual ≥ 10,000.
 * - R-002 opex spike: (actual − prior) / prior > 0.50 month-over-month
 *   (previous present month); actual ≥ 5,000.
 * - R-003 revenue drop: (actual − priorYear) / priorYear < −0.30 with a
 *   prior-year base ≥ 10,000.
 * - R-004 movement outlier: per account, |x − mean| / std > 3.0 against
 *   the account's prior present months (population std, ≥ 3 baseline
 *   months, std > 0).
 * Every month with a computable baseline is evaluated (DEC-017); figures
 * are Decimal-exact; findings are sorted by findingKey (deterministic).
 */
import Decimal from 'decimal.js';
import { toDecimal, type MoneyInput } from '@/utils/money';
import {
  entriesForClass,
  signedClassAmount,
  type AccountClass,
} from '@/utils/accountClassification';
import {
  createFinding,
  EXCEPTION_RULES,
  type ExceptionFinding,
} from '@/store/exceptionRuleCatalogue';

export interface AggregateEntryInput {
  readonly id: string;
  readonly date: string;
  readonly period?: string;
  readonly accountCode: string;
  readonly accountType?:
    | 'Revenue'
    | 'COGS'
    | 'OpEx'
    | 'CapEx'
    | 'Asset'
    | 'Liability'
    | 'Equity'
    | 'Unknown'
    | null;
  readonly debit: MoneyInput;
  readonly credit: MoneyInput;
}

function rule(ruleId: string) {
  const found = EXCEPTION_RULES.find((r) => r.ruleId === ruleId && r.status === 'ACCEPTED');
  if (!found) throw new Error(`Aggregate rule ${ruleId} is not ACCEPTED in the catalogue`);
  return found;
}

function monthOf(entry: AggregateEntryInput): string {
  return entry.period || entry.date.slice(0, 7);
}

/** Monthly signed totals for one statement class, ascending by month. */
function monthlyClassTotals(
  entries: readonly AggregateEntryInput[],
  cls: AccountClass
): { month: string; total: Decimal }[] {
  const totals = new Map<string, Decimal>();
  for (const entry of entriesForClass(entries, cls)) {
    const month = monthOf(entry);
    totals.set(month, (totals.get(month) ?? new Decimal(0)).plus(signedClassAmount(entry, cls)));
  }
  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

function priorYearMonth(month: string): string {
  return `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;
}

export function runAggregateRules(entries: readonly AggregateEntryInput[]): ExceptionFinding[] {
  const findings: ExceptionFinding[] = [];

  // ---- R-001 / R-003 over monthly revenue --------------------------------
  const revenue = monthlyClassTotals(entries, 'revenue');
  const revenueByMonth = new Map(revenue.map((r) => [r.month, r.total]));
  revenue.forEach(({ month, total }, index) => {
    if (index >= 1) {
      const priors = revenue.slice(0, index).map((r) => r.total);
      const baseline = priors
        .reduce((sum, v) => sum.plus(v), new Decimal(0))
        .dividedBy(priors.length);
      if (!baseline.isZero() && total.greaterThanOrEqualTo(10_000)) {
        const deviationRatio = total.minus(baseline).abs().dividedBy(baseline.abs());
        if (deviationRatio.greaterThan(0.2)) {
          findings.push(
            createFinding({
              rule: rule('R-001'),
              targetId: 'revenue',
              periodKey: month,
              observedValue: total.toNumber(),
              expectedValue: baseline.toNumber(),
              deviation: deviationRatio.toNumber(),
              message: `Revenue ${total.toString()} deviates ${deviationRatio.times(100).toString()}% from the ${priors.length}-month baseline average ${baseline.toString()}. Worth a second look — not a confirmed error.`,
            })
          );
        }
      }
    }
    const priorYear = revenueByMonth.get(priorYearMonth(month));
    if (priorYear && priorYear.greaterThanOrEqualTo(10_000) && !priorYear.isZero()) {
      const change = total.minus(priorYear).dividedBy(priorYear.abs());
      if (change.lessThan(-0.3)) {
        findings.push(
          createFinding({
            rule: rule('R-003'),
            targetId: 'revenue',
            periodKey: month,
            observedValue: total.toNumber(),
            expectedValue: priorYear.toNumber(),
            deviation: change.toNumber(),
            message: `Revenue ${total.toString()} is down ${change.times(-100).toString()}% vs ${priorYearMonth(month)} (${priorYear.toString()}). Worth a second look — not a confirmed error.`,
          })
        );
      }
    }
  });

  // ---- R-002 over monthly operating expenses (opex+interest+tax) ---------
  const opexMonths = new Map<string, Decimal>();
  for (const cls of ['opex', 'interest', 'tax'] as AccountClass[]) {
    for (const { month, total } of monthlyClassTotals(entries, cls)) {
      opexMonths.set(month, (opexMonths.get(month) ?? new Decimal(0)).plus(total));
    }
  }
  const opex = [...opexMonths.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
  opex.forEach(({ month, total }, index) => {
    if (index === 0) return;
    const prior = opex[index - 1]!.total;
    if (prior.isZero() || !total.greaterThanOrEqualTo(5_000)) return;
    const change = total.minus(prior).dividedBy(prior.abs());
    if (change.greaterThan(0.5)) {
      findings.push(
        createFinding({
          rule: rule('R-002'),
          targetId: 'cost',
          periodKey: month,
          observedValue: total.toNumber(),
          expectedValue: prior.toNumber(),
          deviation: change.toNumber(),
          message: `Operating expenses ${total.toString()} are up ${change.times(100).toString()}% vs the prior month (${prior.toString()}). Worth a second look — not a confirmed error.`,
        })
      );
    }
  });

  // ---- R-004 per-account monthly movement z-score -------------------------
  const byAccountMonth = new Map<string, Map<string, Decimal>>();
  for (const entry of entries) {
    const month = monthOf(entry);
    let perMonth = byAccountMonth.get(entry.accountCode);
    if (!perMonth) {
      perMonth = new Map();
      byAccountMonth.set(entry.accountCode, perMonth);
    }
    const movement = toDecimal(entry.debit).minus(toDecimal(entry.credit)).abs();
    perMonth.set(month, (perMonth.get(month) ?? new Decimal(0)).plus(movement));
  }
  for (const [accountCode, perMonth] of [...byAccountMonth.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  )) {
    const series = [...perMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }));
    series.forEach(({ month, total }, index) => {
      if (index < 3) return;
      const priors = series.slice(0, index).map((s) => s.total);
      const mean = priors.reduce((sum, v) => sum.plus(v), new Decimal(0)).dividedBy(priors.length);
      const variance = priors
        .reduce((sum, v) => sum.plus(v.minus(mean).pow(2)), new Decimal(0))
        .dividedBy(priors.length);
      const std = variance.sqrt();
      if (std.isZero()) return;
      const z = total.minus(mean).abs().dividedBy(std);
      if (z.greaterThan(3)) {
        findings.push(
          createFinding({
            rule: rule('R-004'),
            targetId: accountCode,
            periodKey: month,
            observedValue: total.toNumber(),
            expectedValue: mean.toNumber(),
            deviation: z.toNumber(),
            message: `Account ${accountCode} moved ${total.toString()} in ${month}, ${z.toString()} standard deviations from its ${priors.length}-month mean ${mean.toString()}. Worth a second look — not a confirmed error.`,
          })
        );
      }
    });
  }

  findings.sort((a, b) => a.findingKey.localeCompare(b.findingKey));
  return findings;
}
