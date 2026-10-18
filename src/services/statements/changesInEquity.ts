import { toDecimal, sumMoney, roundTo } from '@/utils/money';
import type { ThreeStatementGLEntry } from '@/pages/reports/threeStatementData';

/**
 * Phase 9 — statement of changes in equity (checklist row 11).
 *
 * Derived from the same GL entries and sign conventions as
 * `deriveThreeStatement`, so the closing figure ties to the balance
 * sheet's total equity by construction — and the test proves it
 * against the balance sheet itself:
 *
 *   closing = opening (posted equity + all prior earnings)
 *           + this period's net income
 *           + this period's per-account equity movements
 *             (contributions positive, dividends/distributions negative)
 *
 * Equity movements are listed per account rather than forced into
 * invented categories: the GL carries the account, not the legal
 * nature of the movement, so the statement shows what the ledger
 * actually says.
 */

export interface EquityMovement {
  accountCode: string;
  /** Credit-normal signed amount: positive increases equity. */
  amount: number;
}

export interface ChangesInEquity {
  period: string;
  openingEquity: number;
  netIncome: number;
  equityMovements: EquityMovement[];
  totalEquityMovements: number;
  closingEquity: number;
}

function entryPeriod(entry: ThreeStatementGLEntry): string {
  return entry.period || (entry.date ?? '').slice(0, 7);
}

function creditNormal(entries: readonly ThreeStatementGLEntry[]) {
  return sumMoney(entries.map((e) => toDecimal(e.credit ?? 0).minus(toDecimal(e.debit ?? 0))));
}

function debitNormal(entries: readonly ThreeStatementGLEntry[]) {
  return sumMoney(entries.map((e) => toDecimal(e.debit ?? 0).minus(toDecimal(e.credit ?? 0))));
}

function withPrefix(entries: readonly ThreeStatementGLEntry[], prefix: string) {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

function netIncomeOf(entries: readonly ThreeStatementGLEntry[]) {
  const revenue = creditNormal(withPrefix(entries, '4'));
  const costs = ['5', '6', '7', '8'].reduce(
    (acc, p) => acc.plus(debitNormal(withPrefix(entries, p))),
    toDecimal(0)
  );
  return revenue.minus(costs);
}

export function deriveChangesInEquity(
  entries: readonly ThreeStatementGLEntry[],
  period: string
): ChangesInEquity {
  const before = entries.filter((e) => entryPeriod(e) < period);
  const during = entries.filter((e) => entryPeriod(e) === period);

  const openingEquity = creditNormal(withPrefix(before, '3')).plus(netIncomeOf(before));
  const netIncome = netIncomeOf(during);

  const movementByAccount = new Map<string, ReturnType<typeof toDecimal>>();
  for (const e of withPrefix(during, '3')) {
    const code = e.accountCode ?? '';
    const signed = toDecimal(e.credit ?? 0).minus(toDecimal(e.debit ?? 0));
    movementByAccount.set(code, (movementByAccount.get(code) ?? toDecimal(0)).plus(signed));
  }
  const equityMovements: EquityMovement[] = [...movementByAccount.entries()]
    .map(([accountCode, amount]) => ({ accountCode, amount: roundTo(amount, 2) }))
    .filter((m) => m.amount !== 0)
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));

  const totalEquityMovements = equityMovements.reduce(
    (acc, m) => acc.plus(toDecimal(m.amount)),
    toDecimal(0)
  );

  return {
    period,
    openingEquity: roundTo(openingEquity, 2),
    netIncome: roundTo(netIncome, 2),
    equityMovements,
    totalEquityMovements: roundTo(totalEquityMovements, 2),
    closingEquity: roundTo(openingEquity.plus(netIncome).plus(totalEquityMovements), 2),
  };
}
