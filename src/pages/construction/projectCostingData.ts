/**
 * Project-costing derivation from the posted General Ledger.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`.
 * 2. A figure is emitted ONLY when the posted GL supports it.
 * 3. Change orders, CSI cost-code budgets, CPI/SPI, budget utilisation and
 *    named projects (Downtown Plaza, Skyway Bridge, …) are NEVER invented.
 *    Those require operational / project-control feeds the GL does not carry.
 * 4. Per-entry `Math.abs` is never used — it discards contra entries.
 * 5. ConstructionEngine.calculateStats is not used: it multiplies revenue by
 *    1.5 to invent a backlog and abs's every amount.
 *
 * Account-code prefixes follow the convention used across the app:
 *   4 Revenue · 5 COGS · 6 OpEx · 13 WIP (asset) · 46 Progress billings
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

/** Minimal shape this module needs from a posted GL entry. */
export interface ProjectCostingGLEntry {
  readonly accountCode?: string;
  readonly accountName?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
  readonly entityId?: string;
  readonly departmentId?: string;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface CostAccountRow {
  readonly id: string;
  readonly code: string;
  readonly category: string;
  readonly actual: number;
}

export interface CostByProjectRow {
  readonly id: string;
  readonly name: string;
  readonly actual: number;
}

export interface ProjectCostingDerivation {
  readonly revenue: number;
  readonly constructionCosts: number;
  readonly wip: number | null;
  readonly billings: number | null;
  readonly overUnderBilled: number | null;
  readonly grossMarginPct: number | null;
  readonly costAccounts: readonly CostAccountRow[];
  readonly costByProject: readonly CostByProjectRow[];
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: ProjectCostingGLEntry): boolean {
  const debit = entry.debit;
  const credit = entry.credit;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

function debitNormal(entry: ProjectCostingGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: ProjectCostingGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function withPrefix(
  entries: readonly ProjectCostingGLEntry[],
  prefix: string
): readonly ProjectCostingGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

/** Prefix 4 excluding 46 — progress billings are contra, not contract revenue. */
function contractRevenueEntries(
  entries: readonly ProjectCostingGLEntry[]
): readonly ProjectCostingGLEntry[] {
  return entries.filter((e) => {
    const code = e.accountCode ?? '';
    return code.startsWith('4') && !code.startsWith('46');
  });
}

function hasPrefix(entries: readonly ProjectCostingGLEntry[], prefix: string): boolean {
  return entries.some((e) => (e.accountCode ?? '').startsWith(prefix));
}

function projectKey(entry: ProjectCostingGLEntry): string {
  return entry.departmentId || entry.entityId || '';
}

/**
 * Derive every project-costing figure the posted GL genuinely supports.
 *
 * Does not invent a CSI ledger, a change-order pipeline, a CPI, or a budget
 * utilisation. Those require inputs the GL does not carry.
 */
export function deriveProjectCosting(
  entries: readonly ProjectCostingGLEntry[]
): ProjectCostingDerivation {
  const unavailable: UnavailableLine[] = [];
  const note = (label: string, reason: string): void => {
    unavailable.push({ label, reason });
  };

  const revenue = sumMoney(contractRevenueEntries(entries).map(creditNormal));
  const constructionCosts = sumMoney([
    ...withPrefix(entries, '5').map(debitNormal),
    ...withPrefix(entries, '6').map(debitNormal),
  ]);

  const hasWip = hasPrefix(entries, '13');
  const hasBillings = hasPrefix(entries, '46');
  const wip = hasWip ? sumMoney(withPrefix(entries, '13').map(debitNormal)) : null;
  const billings = hasBillings ? sumMoney(withPrefix(entries, '46').map(creditNormal)) : null;
  const overUnderBilled = wip !== null && billings !== null ? billings.minus(wip) : null;

  const grossMarginPct = revenue.isZero()
    ? null
    : divideMoney(revenue.minus(constructionCosts), revenue).times(100);

  if (!hasWip) {
    note(
      'WIP',
      'No WIP accounts (prefix 13) are posted. A work-in-progress balance is omitted rather than estimated from revenue.'
    );
  }
  if (!hasBillings) {
    note(
      'Progress billings',
      'No progress-billing accounts (prefix 46) are posted. Over/under-billing is omitted rather than assumed to be zero.'
    );
  }
  note(
    'Change orders',
    'Change-order status, amounts and named projects are not a GL account. A pending-CO pipeline is not invented.'
  );
  note(
    'CSI cost-code budget',
    'Budget vs actual by CSI division needs a project-control budget the posted ledger does not carry. Only posted actuals are shown.'
  );
  note(
    'Cost performance index',
    'CPI = earned value / actual cost. Earned value is not a posted account. The index is omitted rather than filled with a placeholder.'
  );

  const byAccount = new Map<string, { name: string; actual: Decimal }>();
  for (const entry of [...withPrefix(entries, '5'), ...withPrefix(entries, '6')]) {
    const code = entry.accountCode ?? 'unmapped';
    const existing = byAccount.get(code) ?? { name: entry.accountName || code, actual: ZERO };
    existing.actual = existing.actual.plus(debitNormal(entry));
    if (entry.accountName) existing.name = entry.accountName;
    byAccount.set(code, existing);
  }
  const costAccounts: CostAccountRow[] = [...byAccount.entries()]
    .map(([code, row]) => ({
      id: code,
      code,
      category: row.name,
      actual: row.actual.toDecimalPlaces(2).toNumber(),
    }))
    .filter((row) => row.actual !== 0)
    .sort((a, b) => a.code.localeCompare(b.code));

  const byProject = new Map<string, Decimal>();
  for (const entry of [...withPrefix(entries, '5'), ...withPrefix(entries, '6')]) {
    const key = projectKey(entry);
    if (!key) continue;
    byProject.set(key, (byProject.get(key) ?? ZERO).plus(debitNormal(entry)));
  }
  const costByProject: CostByProjectRow[] = [...byProject.entries()]
    .map(([id, actual]) => ({
      id,
      name: id,
      actual: actual.toDecimalPlaces(2).toNumber(),
    }))
    .filter((row) => row.actual !== 0)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (costByProject.length === 0) {
    note(
      'Project split',
      'Posted cost entries have no entity or department tag, so a project breakdown is omitted rather than labelled with invented job names.'
    );
  }

  return {
    revenue: revenue.toDecimalPlaces(2).toNumber(),
    constructionCosts: constructionCosts.toDecimalPlaces(2).toNumber(),
    wip: wip === null ? null : wip.toDecimalPlaces(2).toNumber(),
    billings: billings === null ? null : billings.toDecimalPlaces(2).toNumber(),
    overUnderBilled:
      overUnderBilled === null ? null : overUnderBilled.toDecimalPlaces(2).toNumber(),
    grossMarginPct: grossMarginPct === null ? null : grossMarginPct.toDecimalPlaces(4).toNumber(),
    costAccounts,
    costByProject,
    unavailable,
  };
}
