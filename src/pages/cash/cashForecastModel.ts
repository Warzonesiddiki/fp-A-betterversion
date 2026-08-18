/**
 * Cash position and posted cash history — only what the General Ledger supports.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **Cash means cash accounts.** Movement is read from accounts with a cash
 *    prefix (10 / 11) only. The previous implementation summed
 *    `debit − credit` over EVERY entry in the ledger and called the positive
 *    half "inflows", so a payroll expense (a debit to 6xxx) counted as cash
 *    coming in. That figure was then exported to PDF and Excel.
 *
 * 2. **No invented category mix.** The old page split inflows 70% "Revenue" /
 *    30% "Other Income" and outflows 40% Payroll / 35% OpEx / 15% CapEx /
 *    residual Debt Service. Those six numbers were weights typed by a
 *    developer, not facts, and a "known answer" test had pinned
 *    `300.20 * 0.7 = 210.14` as if it meant something.
 *    Categories here come from double entry: for each cash line, the cash
 *    amount is allocated across the NON-CASH lines of the same journal, in
 *    proportion to their amounts, and classified by their account prefix.
 *    Cash lines with no identifiable counter-line are `Unclassified` — never
 *    silently folded into a named category.
 *
 * 3. **No invented forward forecast.** The old "13-Week Cash Forecast" was
 *    `(inflows / 13) * (0.8 + ((i * 13) % 40) * 0.01)` — a deterministic
 *    sawtooth presented as a weekly projection, with a balance line ramped by
 *    `net + weekNet * (i + 1)`. A forward 13-week forecast needs A/R and A/P
 *    aging, a payroll calendar and a debt-service schedule. The GL carries
 *    none of them, so this module returns posted history and declares the
 *    forecast unavailable.
 *
 * 4. **No burn-rate divisor invention.** `outflows / 4` is gone. The average
 *    is taken over the number of periods actually posted, and that count is
 *    returned so the UI can state it.
 *
 * 5. All arithmetic is decimal.js via `@/utils/money`; allocations are
 *    penny-exact (the residual lands on the largest share), so category totals
 *    sum back to the receipt and disbursement totals exactly.
 *
 * Account-code prefixes: 1 Asset · 2 Liability · 3 Equity · 4 Revenue ·
 * 5 COGS · 6 OpEx · 7 Interest · 8 Income tax. Cash: 10 / 11.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface CashGLEntry {
  readonly accountCode?: string | null;
  readonly accountName?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
  readonly period?: string | null;
  readonly date?: string | null;
  readonly journalId?: string | null;
}

export interface CashPeriodRow {
  readonly period: string;
  readonly receipts: number;
  readonly disbursements: number;
  readonly net: number;
  /** Cumulative posted cash movement through the end of this period. */
  readonly runningBalance: number;
}

export interface CashCategoryRow {
  readonly category: string;
  readonly receipts: number;
  readonly disbursements: number;
  readonly net: number;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface CashPosition {
  readonly receipts: number;
  readonly disbursements: number;
  readonly netMovement: number;
  /**
   * Posted cash balance = cumulative movement over every posted cash entry.
   * Equal to `netMovement` by construction; both are reported so no caller has
   * to assume an opening balance the ledger does not carry.
   */
  readonly postedBalance: number;
  readonly periods: readonly CashPeriodRow[];
  readonly periodCount: number;
  /** `null` when no period can be identified. */
  readonly averageNetPerPeriod: number | null;
  readonly categories: readonly CashCategoryRow[];
  /** Share of cash movement that carried an identifiable counter-line, 0..100. */
  readonly classifiedPercent: number | null;
  readonly cashAccountCodes: readonly string[];
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;

/** Cash and cash-equivalent account prefixes. */
export const CASH_PREFIXES = ['10', '11'] as const;

const CATEGORY_BY_PREFIX: Record<string, string> = {
  '1': 'Other Assets',
  '2': 'Liabilities',
  '3': 'Equity',
  '4': 'Revenue',
  '5': 'Cost of Sales',
  '6': 'Operating Expenses',
  '7': 'Interest',
  '8': 'Income Tax',
};

const UNCLASSIFIED = 'Unclassified';

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(entry: CashGLEntry): string {
  return entry.accountCode ?? '';
}

export function isCashAccount(accountCode: string): boolean {
  return CASH_PREFIXES.some((p) => accountCode.startsWith(p));
}

function hasDebitCredit(entry: CashGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

/** Cash is debit-normal: a debit is a receipt, a credit is a disbursement. */
export function movement(entry: CashGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function periodKey(entry: CashGLEntry): string | null {
  const p = entry.period;
  if (p) return p;
  const d = entry.date;
  return d ? d.slice(0, 7) : null;
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

function categoryFor(entry: CashGLEntry): string {
  const c = code(entry);
  if (!c) return UNCLASSIFIED;
  if (isCashAccount(c)) return 'Cash Transfers';
  return CATEGORY_BY_PREFIX[c[0] ?? ''] ?? UNCLASSIFIED;
}

/**
 * Split `total` across `weights` proportionally, to the cent, with the rounding
 * residual assigned to the largest weight so the parts sum to `total` exactly.
 */
function allocate(total: Decimal, weights: readonly Decimal[]): Decimal[] {
  const weightSum = sumMoney(weights);
  if (weights.length === 0 || weightSum.isZero()) return weights.map(() => ZERO);

  const parts = weights.map((w) =>
    divideMoney(total.times(w), weightSum).toDecimalPlaces(CURRENCY_PLACES)
  );
  const residual = total.toDecimalPlaces(CURRENCY_PLACES).minus(sumMoney(parts));
  if (!residual.isZero()) {
    let largest = 0;
    for (let i = 1; i < weights.length; i += 1) {
      if (weights[i]!.greaterThan(weights[largest]!)) largest = i;
    }
    parts[largest] = parts[largest]!.plus(residual);
  }
  return parts;
}

interface Bucket {
  receipts: Decimal;
  disbursements: Decimal;
}

function emptyBucket(): Bucket {
  return { receipts: ZERO, disbursements: ZERO };
}

/**
 * Classify cash movement by the counter-side of its own journal entry.
 *
 * Returns the category rows plus the amount of cash movement that could be
 * attributed, so the caller can state how much of the picture is explained.
 */
function classify(
  entries: readonly CashGLEntry[],
  cashRows: readonly CashGLEntry[]
): { rows: CashCategoryRow[]; classified: Decimal; total: Decimal } {
  const byJournal = new Map<string, CashGLEntry[]>();
  for (const e of entries) {
    const j = e.journalId;
    if (!j) continue;
    const list = byJournal.get(j);
    if (list) list.push(e);
    else byJournal.set(j, [e]);
  }

  const buckets = new Map<string, Bucket>();
  const add = (category: string, amount: Decimal, isReceipt: boolean): void => {
    const bucket = buckets.get(category) ?? emptyBucket();
    if (isReceipt) bucket.receipts = bucket.receipts.plus(amount);
    else bucket.disbursements = bucket.disbursements.plus(amount);
    buckets.set(category, bucket);
  };

  let classified = ZERO;
  let total = ZERO;

  for (const row of cashRows) {
    const m = movement(row);
    if (m.isZero()) continue;
    const magnitude = m.abs();
    const isReceipt = m.greaterThan(0);
    total = total.plus(magnitude);

    const journal = row.journalId ? byJournal.get(row.journalId) : undefined;
    const counterLines = (journal ?? []).filter((l) => l !== row && !isCashAccount(code(l)));
    const weights = counterLines.map((l) => movement(l).abs());

    if (counterLines.length === 0 || sumMoney(weights).isZero()) {
      add(UNCLASSIFIED, magnitude, isReceipt);
      continue;
    }

    const parts = allocate(magnitude, weights);
    counterLines.forEach((line, i) => add(categoryFor(line), parts[i]!, isReceipt));
    classified = classified.plus(magnitude);
  }

  const rows = [...buckets.entries()]
    .map(([category, b]) => ({
      category,
      receipts: cash(b.receipts),
      disbursements: cash(b.disbursements),
      net: cash(b.receipts.minus(b.disbursements)),
    }))
    .sort((a, b) => {
      if (a.category === UNCLASSIFIED) return 1;
      if (b.category === UNCLASSIFIED) return -1;
      return Math.abs(b.net) - Math.abs(a.net) || a.category.localeCompare(b.category);
    });

  return { rows, classified, total };
}

/**
 * Derive the cash position from posted entries.
 *
 * Returns `null` when the ledger posts no cash-account activity at all — the
 * page must then empty-state rather than present a zeroed cash statement.
 */
export function deriveCashPosition(entries: readonly CashGLEntry[]): CashPosition | null {
  const cashRows = entries.filter((e) => isCashAccount(code(e)));
  if (cashRows.length === 0) return null;

  const movements = cashRows.map(movement);
  const receipts = sumMoney(movements.filter((m) => m.greaterThan(0)));
  const disbursements = sumMoney(movements.filter((m) => m.lessThan(0))).abs();
  const netMovement = receipts.minus(disbursements);

  const periodTotals = new Map<string, { receipts: Decimal; disbursements: Decimal }>();
  for (const row of cashRows) {
    const key = periodKey(row);
    if (!key) continue;
    const bucket = periodTotals.get(key) ?? { receipts: ZERO, disbursements: ZERO };
    const m = movement(row);
    if (m.greaterThan(0)) bucket.receipts = bucket.receipts.plus(m);
    else bucket.disbursements = bucket.disbursements.plus(m.abs());
    periodTotals.set(key, bucket);
  }

  let running = ZERO;
  const periods: CashPeriodRow[] = [...periodTotals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, b]) => {
      const net = b.receipts.minus(b.disbursements);
      running = running.plus(net);
      return {
        period,
        receipts: cash(b.receipts),
        disbursements: cash(b.disbursements),
        net: cash(net),
        runningBalance: cash(running),
      };
    });

  const { rows: categories, classified, total } = classify(entries, cashRows);

  const cashAccountCodes = [...new Set(cashRows.map(code).filter(Boolean))].sort();

  const unavailable: UnavailableLine[] = [
    {
      label: 'Forward 13-week cash forecast',
      reason:
        'Requires A/R and A/P aging, a payroll calendar and a debt-service schedule. The general ledger records what has been posted, not what is scheduled to settle.',
    },
    {
      label: 'Opening cash balance',
      reason:
        'Shown here as cumulative posted movement. A true opening balance requires a prior-period close the workspace has not been given.',
    },
  ];
  if (!classified.equals(total)) {
    unavailable.push({
      label: 'Complete category attribution',
      reason:
        'Some cash lines carry no journal reference or no non-cash counter-line, so their movement is reported as Unclassified rather than assigned to a category.',
    });
  }

  return {
    receipts: cash(receipts),
    disbursements: cash(disbursements),
    netMovement: cash(netMovement),
    postedBalance: cash(netMovement),
    periods,
    periodCount: periods.length,
    averageNetPerPeriod: periods.length > 0 ? cash(divideMoney(netMovement, periods.length)) : null,
    categories,
    classifiedPercent: total.isZero()
      ? null
      : divideMoney(classified, total).times(100).toDecimalPlaces(2).toNumber(),
    cashAccountCodes,
    unavailable,
  };
}
