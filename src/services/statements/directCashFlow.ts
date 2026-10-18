import { toDecimal, sumMoney, roundTo } from '@/utils/money';
import type { ThreeStatementGLEntry } from '@/pages/reports/threeStatementData';

/**
 * Phase 9 — direct-method operating cash flow (checklist row 11).
 *
 * The two operating lines a direct-method statement leads with are
 * exact conversions of accrual figures using balance movements:
 *
 *   receipts from customers    = revenue − Δ accounts receivable
 *   payments (suppliers/staff) = operating expenses (COGS, opex,
 *                                interest, tax as expensed)
 *                                + Δ inventory − Δ accounts payable
 *
 * Everything else that moved cash — capex, borrowings, equity — is
 * reported as ONE disclosed combined residual: the posted ledger
 * carries no per-activity mapping that would justify splitting it
 * further, so the statement foots to the cash account by construction
 * instead of by estimation. Balances are debit/credit-normal
 * cumulative movements on the same account conventions as
 * `deriveThreeStatement` (cash 1000, receivables 1100, inventory 1200,
 * payables 2100).
 */

export interface DirectCashFlow {
  period: string;
  receiptsFromCustomers: number;
  paymentsToSuppliersAndEmployees: number;
  netCashFromOperations: number;
  /** Residual: every non-operating cash movement, combined and disclosed. */
  investingAndFinancingCombined: number;
  beginningCash: number;
  netChangeInCash: number;
  endingCash: number;
}

function entryPeriod(entry: ThreeStatementGLEntry): string {
  return entry.period || (entry.date ?? '').slice(0, 7);
}

function debitNormal(entries: readonly ThreeStatementGLEntry[]) {
  return sumMoney(entries.map((e) => toDecimal(e.debit ?? 0).minus(toDecimal(e.credit ?? 0))));
}

function creditNormal(entries: readonly ThreeStatementGLEntry[]) {
  return sumMoney(entries.map((e) => toDecimal(e.credit ?? 0).minus(toDecimal(e.debit ?? 0))));
}

function byCode(entries: readonly ThreeStatementGLEntry[], code: string) {
  return entries.filter((e) => e.accountCode === code);
}

function byPrefix(entries: readonly ThreeStatementGLEntry[], prefix: string) {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

export function deriveDirectCashFlow(
  entries: readonly ThreeStatementGLEntry[],
  period: string
): DirectCashFlow {
  const before = entries.filter((e) => entryPeriod(e) < period);
  const during = entries.filter((e) => entryPeriod(e) === period);
  const toEnd = [...before, ...during];

  // Operating receipts: revenue earned minus what is still owed to us.
  const revenue = creditNormal(byPrefix(during, '4'));
  const arChange = debitNormal(byCode(toEnd, '1100')).minus(debitNormal(byCode(before, '1100')));
  const receipts = revenue.minus(arChange);

  // Operating payments: expenses incurred, adjusted for stock bought
  // but not yet expensed and bills incurred but not yet paid.
  const operatingExpenses = ['5', '6', '7', '8'].reduce(
    (acc, p) => acc.plus(debitNormal(byPrefix(during, p))),
    toDecimal(0)
  );
  const inventoryChange = debitNormal(byCode(toEnd, '1200')).minus(
    debitNormal(byCode(before, '1200'))
  );
  const payablesChange = creditNormal(byCode(toEnd, '2100')).minus(
    creditNormal(byCode(before, '2100'))
  );
  const payments = operatingExpenses.plus(inventoryChange).minus(payablesChange);

  const netOperating = receipts.minus(payments);

  const beginningCash = debitNormal(byCode(before, '1000'));
  const endingCash = debitNormal(byCode(toEnd, '1000'));
  const netChange = endingCash.minus(beginningCash);

  return {
    period,
    receiptsFromCustomers: roundTo(receipts, 2),
    paymentsToSuppliersAndEmployees: roundTo(payments, 2),
    netCashFromOperations: roundTo(netOperating, 2),
    investingAndFinancingCombined: roundTo(netChange.minus(netOperating), 2),
    beginningCash: roundTo(beginningCash, 2),
    netChangeInCash: roundTo(netChange, 2),
    endingCash: roundTo(endingCash, 2),
  };
}
