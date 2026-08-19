/**
 * Education-sector dashboard figures the posted GL (and posted budget) support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * This page previously read NOTHING. Every figure on it was a literal typed
 * for a fictional university: `$485.0M` tuition, `$18,240` cost per student,
 * `$105.0M` financial aid, `$95.0M` research funding, `4.8%` endowment
 * utilisation, a `15:1` student-faculty ratio, five semesters of enrolment
 * (28,400 undergraduates …), a six-slice expense pie (Faculty 312M, Admin
 * 145M …) and a six-row budget-vs-actual table — identical for every tenant,
 * every entity and every period. Removed in full.
 *
 * What replaces it:
 *
 * 1. **Revenue by source** = posted revenue accounts (prefix 4), grouped by
 *    account code, credit-normal. The chart of accounts IS the source
 *    breakdown; nothing is bucketed into invented names like "Donations".
 * 2. **Expense distribution** = posted cost accounts (prefixes 5–8),
 *    debit-normal, with each share computed against the posted total.
 * 3. **Budget vs actual** = budget line items joined to posted actuals BY
 *    ACCOUNT CODE. Only accounts that appear on both sides are shown, and
 *    favourability follows the account's natural balance (revenue over budget
 *    is favourable; cost over budget is not) rather than matching on the word
 *    "Revenue" in a hand-typed category label.
 * 4. **Enrolment, cost per student, student-faculty ratio, endowment
 *    utilisation** are NOT financial-ledger facts. They are reported only from
 *    data the user has actually entered (the education store) and otherwise
 *    declared unavailable. A ledger cannot count students.
 *
 * All arithmetic is decimal.js via `@/utils/money`. Natural balance decides
 * sign; per-entry `Math.abs` is never used.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface EducationGLEntry {
  readonly accountCode?: string | null;
  readonly accountName?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface EducationBudgetLine {
  readonly accountCode?: string | null;
  readonly accountName?: string | null;
  readonly amount?: number | null;
}

export interface EducationEnrollmentRow {
  readonly semester: string;
  readonly undergraduate: number;
  readonly graduate: number;
  readonly total: number;
}

export interface AccountAmountRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly value: number;
  /** Share of the posted total for this side, 0..100. */
  readonly sharePercent: number;
}

export interface BudgetVsActualRow {
  readonly accountCode: string;
  readonly accountName: string;
  readonly budget: number;
  readonly actual: number;
  readonly variance: number;
  /** `null` when the budget is zero — never a divide-by-zero stand-in. */
  readonly variancePercent: number | null;
  readonly favorable: boolean;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface EducationDashboard {
  readonly totalRevenue: number;
  readonly totalExpense: number;
  readonly netResult: number;
  readonly revenueBySource: readonly AccountAmountRow[];
  readonly expenseDistribution: readonly AccountAmountRow[];
  readonly budgetVsActual: readonly BudgetVsActualRow[];
  readonly enrollment: readonly EducationEnrollmentRow[];
  /** Posted cost per enrolled student; `null` unless enrolment was entered. */
  readonly costPerStudent: number | null;
  readonly latestEnrollment: number | null;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

const REVENUE_PREFIX = '4';
const COST_PREFIXES = ['5', '6', '7', '8'] as const;

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(row: { accountCode?: string | null }): string {
  return row.accountCode ?? '';
}

function hasDebitCredit(entry: EducationGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function debitNormal(entry: EducationGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: EducationGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function isRevenue(row: { accountCode?: string | null }): boolean {
  return code(row).startsWith(REVENUE_PREFIX);
}

function isCost(row: { accountCode?: string | null }): boolean {
  return COST_PREFIXES.some((p) => code(row).startsWith(p));
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

function groupByAccount(
  entries: readonly EducationGLEntry[],
  sign: (e: EducationGLEntry) => Decimal
): { rows: AccountAmountRow[]; total: Decimal } {
  const map = new Map<string, { name: string; value: Decimal }>();
  for (const entry of entries) {
    const key = code(entry);
    const existing = map.get(key) ?? { name: entry.accountName || key, value: ZERO };
    existing.value = existing.value.plus(sign(entry));
    map.set(key, existing);
  }

  const total = sumMoney([...map.values()].map((v) => v.value));
  const rows = [...map.entries()]
    .map(([accountCode, v]) => ({
      accountCode,
      accountName: v.name,
      value: cash(v.value),
      sharePercent: total.isZero()
        ? 0
        : divideMoney(v.value, total).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber(),
    }))
    .sort((a, b) => b.value - a.value || a.accountCode.localeCompare(b.accountCode));

  return { rows, total };
}

/**
 * Join budget line items to posted actuals by account code.
 *
 * Only accounts present on both sides are returned: a budget line with no
 * posting is not a zero actual, and a posting with no budget line is not a
 * 100% overrun.
 */
function joinBudget(
  entries: readonly EducationGLEntry[],
  budgetLines: readonly EducationBudgetLine[]
): BudgetVsActualRow[] {
  const budgetByAccount = new Map<string, { name: string; amount: Decimal }>();
  for (const line of budgetLines) {
    const key = code(line);
    if (!key) continue;
    const existing = budgetByAccount.get(key) ?? { name: line.accountName || key, amount: ZERO };
    existing.amount = existing.amount.plus(money(line.amount));
    budgetByAccount.set(key, existing);
  }

  const actualByAccount = new Map<string, { name: string; amount: Decimal }>();
  for (const entry of entries) {
    const key = code(entry);
    if (!key) continue;
    if (!isRevenue(entry) && !isCost(entry)) continue;
    const existing = actualByAccount.get(key) ?? { name: entry.accountName || key, amount: ZERO };
    existing.amount = existing.amount.plus(
      isRevenue(entry) ? creditNormal(entry) : debitNormal(entry)
    );
    actualByAccount.set(key, existing);
  }

  const rows: BudgetVsActualRow[] = [];
  for (const [accountCode, budget] of budgetByAccount) {
    const actual = actualByAccount.get(accountCode);
    if (!actual) continue;
    const variance = actual.amount.minus(budget.amount);
    const revenueLine = accountCode.startsWith(REVENUE_PREFIX);
    rows.push({
      accountCode,
      accountName: actual.name || budget.name,
      budget: cash(budget.amount),
      actual: cash(actual.amount),
      variance: cash(variance),
      variancePercent: budget.amount.isZero()
        ? null
        : divideMoney(variance, budget.amount.abs())
            .times(100)
            .toDecimalPlaces(PERCENT_PLACES)
            .toNumber(),
      // Revenue above budget is favourable; cost above budget is not.
      favorable: revenueLine ? variance.greaterThanOrEqualTo(0) : variance.lessThanOrEqualTo(0),
    });
  }

  return rows.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

/**
 * Derive the education dashboard.
 *
 * Returns `null` when the ledger posts no revenue or cost at all, so the page
 * empty-states instead of rendering a zeroed university.
 */
export function deriveEducationDashboard(
  entries: readonly EducationGLEntry[],
  budgetLines: readonly EducationBudgetLine[] = [],
  enrollment: readonly EducationEnrollmentRow[] = []
): EducationDashboard | null {
  const revenueEntries = entries.filter(isRevenue);
  const costEntries = entries.filter(isCost);
  if (revenueEntries.length === 0 && costEntries.length === 0) return null;

  const revenue = groupByAccount(revenueEntries, creditNormal);
  const expense = groupByAccount(costEntries, debitNormal);
  const netResult = revenue.total.minus(expense.total);

  const latest = enrollment.length > 0 ? enrollment[enrollment.length - 1]! : null;
  const latestTotal = latest ? latest.total : null;
  const costPerStudent =
    latestTotal !== null && latestTotal > 0
      ? divideMoney(expense.total, latestTotal).toDecimalPlaces(CURRENCY_PLACES).toNumber()
      : null;

  const unavailable: UnavailableLine[] = [];
  if (enrollment.length === 0) {
    unavailable.push({
      label: 'Enrolment, cost per student and student-faculty ratio',
      reason:
        'Student and faculty headcount are not ledger facts. Record enrolment in the education workspace to see these.',
    });
  }
  unavailable.push({
    label: 'Endowment utilisation',
    reason:
      'Requires endowment market value and the spending-policy rate, neither of which is posted to the general ledger.',
  });
  if (budgetLines.length === 0) {
    unavailable.push({
      label: 'Budget vs actual',
      reason: 'No budget line items are loaded for these accounts.',
    });
  }

  return {
    totalRevenue: cash(revenue.total),
    totalExpense: cash(expense.total),
    netResult: cash(netResult),
    revenueBySource: revenue.rows,
    expenseDistribution: expense.rows,
    budgetVsActual: joinBudget(entries, budgetLines),
    enrollment,
    costPerStudent,
    latestEnrollment: latestTotal,
    unavailable,
  };
}
