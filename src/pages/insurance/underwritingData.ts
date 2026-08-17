/**
 * Underwriting figures the posted General Ledger can actually support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`.
 * 2. A figure is emitted ONLY when the posted GL supports it.
 * 3. Rate adequacy, indicated-vs-filed rates, loss picks, credibility scores,
 *    named state filings (CA-2026-012 / +8.4%) and "8 approved / 4 pending"
 *    are NEVER invented. Those require a rating / filing feed the GL does not
 *    carry. InsuranceEngine.calculateStats is not used: it abs's every amount,
 *    invents net written as 85% of gross, and invents policy count as
 *    premium / 360.
 * 4. Per-entry `Math.abs` is never used.
 *
 * Account-code prefixes follow the convention used across the app:
 *   4 Revenue / premium · 5 Claims / COGS · 6 Underwriting expense
 * Construction-specific 41/42/51/52/53, when present, are subsets of those.
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface UnderwritingGLEntry {
  readonly accountCode?: string;
  readonly accountName?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface UnderwritingDerivation {
  readonly premium: number;
  readonly claims: number;
  readonly expense: number;
  readonly underwritingIncome: number;
  readonly lossRatioPct: number | null;
  readonly expenseRatioPct: number | null;
  readonly combinedRatioPct: number | null;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: UnderwritingGLEntry): boolean {
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

function debitNormal(entry: UnderwritingGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: UnderwritingGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function withPrefix(
  entries: readonly UnderwritingGLEntry[],
  prefix: string
): readonly UnderwritingGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

function ratioPct(numer: Decimal, denom: Decimal): Decimal | null {
  if (denom.isZero()) return null;
  return divideMoney(numer, denom).times(100);
}

/**
 * Derive every underwriting figure the posted GL genuinely supports.
 *
 * Does not invent a rate-adequacy trend, a loss-pick table, a credibility
 * score or a state filing pipeline.
 */
export function deriveUnderwriting(
  entries: readonly UnderwritingGLEntry[]
): UnderwritingDerivation {
  const unavailable: UnavailableLine[] = [];
  const note = (label: string, reason: string): void => {
    unavailable.push({ label, reason });
  };

  const premium = sumMoney(withPrefix(entries, '4').map(creditNormal));
  const claims = sumMoney(withPrefix(entries, '5').map(debitNormal));
  const expense = sumMoney(withPrefix(entries, '6').map(debitNormal));
  const underwritingIncome = premium.minus(claims).minus(expense);

  const lossRatioPct = ratioPct(claims, premium);
  const expenseRatioPct = ratioPct(expense, premium);
  const combinedRatioPct =
    lossRatioPct === null || expenseRatioPct === null ? null : lossRatioPct.plus(expenseRatioPct);

  note(
    'Rate adequacy',
    'Indicated vs filed vs adequate rate levels need a rating indication. They are not a GL account and are not filled with a placeholder trend.'
  );
  note(
    'Loss picks',
    'Selected vs ultimate loss picks and credibility scores need an actuarial triangle. They are omitted rather than scored as High for every line.'
  );
  note(
    'Rate filings',
    'State filing IDs, approval status and requested rate changes are not posted as journal entries. A California / Florida / Texas / New York pipeline is not invented.'
  );

  return {
    premium: premium.toDecimalPlaces(2).toNumber(),
    claims: claims.toDecimalPlaces(2).toNumber(),
    expense: expense.toDecimalPlaces(2).toNumber(),
    underwritingIncome: underwritingIncome.toDecimalPlaces(2).toNumber(),
    lossRatioPct: lossRatioPct === null ? null : lossRatioPct.toDecimalPlaces(4).toNumber(),
    expenseRatioPct:
      expenseRatioPct === null ? null : expenseRatioPct.toDecimalPlaces(4).toNumber(),
    combinedRatioPct:
      combinedRatioPct === null ? null : combinedRatioPct.toDecimalPlaces(4).toNumber(),
    unavailable,
  };
}
