/**
 * Executive-summary figures from the posted General Ledger.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`.
 * 2. A figure is emitted ONLY when the posted GL supports it.
 * 3. NEVER invent $4.2M / $1.1M / $850k KPIs, +12% / +4% / −2% budget
 *    variances, a five-point sparkline, an EBITDA number (D&A is not a
 *    prefix), or a management narrative about SaaS bookings.
 * 4. Per-entry `Math.abs` is never used.
 *
 * Account-code prefixes: 4 Revenue · 5 COGS · 6 OpEx. Cash is account 1000
 * (same contract as threeStatementData). Activity-split cash flow and EBITDA
 * are not derivable.
 */

import Decimal from 'decimal.js';
import { sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface ExecutiveSummaryGLEntry {
  readonly accountCode?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface ExecutiveSummaryDerivation {
  readonly revenue: number;
  readonly cogs: number;
  readonly opex: number;
  readonly operatingIncome: number;
  readonly cash: number | null;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: ExecutiveSummaryGLEntry): boolean {
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

function debitNormal(entry: ExecutiveSummaryGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: ExecutiveSummaryGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function withPrefix(
  entries: readonly ExecutiveSummaryGLEntry[],
  prefix: string
): readonly ExecutiveSummaryGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

export function deriveExecutiveSummary(
  entries: readonly ExecutiveSummaryGLEntry[]
): ExecutiveSummaryDerivation {
  const revenue = sumMoney(withPrefix(entries, '4').map(creditNormal));
  const cogs = sumMoney(withPrefix(entries, '5').map(debitNormal));
  const opex = sumMoney(withPrefix(entries, '6').map(debitNormal));
  const operatingIncome = revenue.minus(cogs).minus(opex);

  const cashRows = entries.filter((e) => (e.accountCode ?? '') === '1000');
  const hasCash = cashRows.length > 0;
  const cash = hasCash ? sumMoney(cashRows.map(debitNormal)) : null;

  const unavailable: UnavailableLine[] = [
    {
      label: 'EBITDA',
      reason:
        'EBITDA needs depreciation and amortisation isolated from other operating expense. That split is not a GL prefix, so operating income (revenue − COGS − opex) is shown instead.',
    },
    {
      label: 'Budget variance',
      reason:
        'A vs-budget percentage needs posted budget lines. A placeholder trio is not assumed.',
    },
    {
      label: 'Cash-flow activity split',
      reason:
        'Operating / investing / financing cash flow needs an activity map. Only the posted cash-account balance is shown when account 1000 exists.',
    },
    {
      label: 'Management commentary',
      reason:
        'A narrative about bookings, marketing spend or collections is not a posted account and is not generated.',
    },
  ];

  return {
    revenue: revenue.toDecimalPlaces(2).toNumber(),
    cogs: cogs.toDecimalPlaces(2).toNumber(),
    opex: opex.toDecimalPlaces(2).toNumber(),
    operatingIncome: operatingIncome.toDecimalPlaces(2).toNumber(),
    cash: cash === null ? null : cash.toDecimalPlaces(2).toNumber(),
    unavailable,
  };
}
