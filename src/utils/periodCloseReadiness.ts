// =============================================================================
// PERIOD CLOSE READINESS — pre-close validation (SOX table stakes)
// -----------------------------------------------------------------------------
// Every check is derived from real stores/engines — never fabricated:
//   gl-data        GL entries exist inside the period's date range
//   tb-balanced    debits === credits over the period's entries (money-exact,
//                  via sumMoney — IEEE-754 drift cannot fake a balanced book)
//   budgets-approved  fiscal-year budgets are Approved/Locked (vacuously true
//                  when no budgets exist — an un-budgeted close is not blocked)
//   checklist-ready   all critical/regulatory close tasks complete
//                  (FinancialCloseEngine.isPeriodLockable)
//
// Which checks block which transition (mirrors PeriodCloseStateMachine's
// BALANCE_REQUIRED_TRANSITIONS + the product's certification semantics):
//   soft-close → gl-data + tb-balanced
//   hard-close / lock → all checks
//   reopen / force-reopen → none (approval-gated by RBAC)
// =============================================================================

import { sumMoney, roundTo, subtractMoney, moneyEquals, type MoneyInput } from './money';
import {
  FinancialCloseEngine,
  type ClosePlan,
  type CloseTaskInstance,
} from '@/engines/FinancialCloseEngine';
import type { Budget, FiscalPeriod, GLEntry } from '@/types';

export interface CloseCheck {
  readonly id: string;
  readonly label: string;
  readonly ok: boolean;
  readonly detail: string;
}

export interface CloseReadiness {
  readonly ready: boolean;
  readonly checks: readonly CloseCheck[];
  /** Money-exact TB totals (2-dp rounded numbers — display via formatMoney). */
  readonly totalDebits: number;
  readonly totalCredits: number;
  readonly difference: number;
  readonly entryCount: number;
}

export type CloseTransition = 'soft-close' | 'hard-close' | 'lock' | 'reopen' | 'force-reopen';

/** Which check ids gate each transition. */
const REQUIRED_CHECKS: Record<CloseTransition, readonly string[]> = {
  'soft-close': ['gl-data', 'tb-balanced'],
  'hard-close': ['gl-data', 'tb-balanced', 'budgets-approved', 'checklist-ready'],
  lock: ['gl-data', 'tb-balanced', 'budgets-approved', 'checklist-ready'],
  reopen: [],
  'force-reopen': [],
};

/** Entries belonging to a fiscal period (date within [startDate, endDate]). */
export function entriesForPeriod(
  entries: readonly GLEntry[],
  period: FiscalPeriod
): readonly GLEntry[] {
  const start = period.startDate.slice(0, 10);
  const end = period.endDate.slice(0, 10);
  return entries.filter((e) => {
    const d = String(e.date || e.postDate || '').slice(0, 10);
    return d >= start && d <= end;
  });
}

export function evaluateCloseReadiness(
  period: FiscalPeriod,
  entries: readonly GLEntry[],
  budgets: readonly Budget[],
  checklist: { plan: ClosePlan; instances: readonly CloseTaskInstance[] } | undefined
): CloseReadiness {
  const periodEntries = entriesForPeriod(entries, period);
  const entryCount = periodEntries.length;

  const debits = periodEntries.map((e) => e.debit as MoneyInput);
  const credits = periodEntries.map((e) => e.credit as MoneyInput);
  const totalDebits = roundTo(sumMoney(debits), 2);
  const totalCredits = roundTo(sumMoney(credits), 2);
  const difference = roundTo(subtractMoney(totalDebits, totalCredits), 2);

  const checks: CloseCheck[] = [];

  checks.push({
    id: 'gl-data',
    label: 'GL data present',
    ok: entryCount > 0,
    detail:
      entryCount > 0
        ? `${entryCount} journal entr${entryCount === 1 ? 'y' : 'ies'} in ${period.name} ${period.year}`
        : `No GL entries in ${period.name} ${period.year} — import data before closing`,
  });

  const balanced = moneyEquals(totalDebits, totalCredits);
  checks.push({
    id: 'tb-balanced',
    label: 'Trial balance in balance',
    ok: balanced,
    detail: balanced
      ? `Debits = Credits (${formatTb(totalDebits)})`
      : `Debits ${formatTb(totalDebits)} ≠ Credits ${formatTb(totalCredits)} (diff ${formatTb(difference)})`,
  });

  const yearBudgets = budgets.filter((b) => b.fiscalYear === period.year);
  const approved = yearBudgets.every((b) => b.status === 'Approved' || b.status === 'Locked');
  checks.push({
    id: 'budgets-approved',
    label: 'Fiscal-year budgets approved',
    ok: yearBudgets.length === 0 || approved,
    detail:
      yearBudgets.length === 0
        ? 'No budgets exist for this fiscal year (not blocking)'
        : approved
          ? `${yearBudgets.length} budget${yearBudgets.length === 1 ? '' : 's'} approved for ${period.year}`
          : `${yearBudgets.filter((b) => b.status !== 'Approved' && b.status !== 'Locked').length} budget(s) not yet approved for ${period.year}`,
  });

  const lockable = checklist
    ? FinancialCloseEngine.isPeriodLockable(checklist.plan, checklist.instances)
    : false;
  const incomplete = checklist
    ? FinancialCloseEngine.computeProgress(checklist.plan, checklist.instances)
    : null;
  checks.push({
    id: 'checklist-ready',
    label: 'Critical close tasks complete',
    ok: lockable,
    detail: lockable
      ? 'All critical/regulatory close tasks complete'
      : `Close checklist ${incomplete?.percentComplete ?? 0}% — complete critical tasks before final lock`,
  });

  return {
    ready: checks.every((c) => c.ok),
    checks,
    totalDebits,
    totalCredits,
    difference,
    entryCount,
  };
}

/** Blocking checks for a specific transition ('' = all). */
export function blockingChecksFor(
  readiness: CloseReadiness,
  transition: CloseTransition
): readonly CloseCheck[] {
  const required = REQUIRED_CHECKS[transition] ?? [];
  return readiness.checks.filter((c) => !c.ok && required.includes(c.id));
}

export function isTransitionAllowed(
  readiness: CloseReadiness,
  transition: CloseTransition
): boolean {
  return blockingChecksFor(readiness, transition).length === 0;
}

function formatTb(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
