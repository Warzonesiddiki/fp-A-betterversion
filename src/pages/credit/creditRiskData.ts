/**
 * Credit-risk figures the posted General Ledger can actually support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`.
 * 2. A ratio is emitted ONLY when both sides exist on the posted GL.
 * 3. NEVER invent:
 *    - interest as 5% of opex (`(rev − opex) / (opex * 0.05)`);
 *    - current-ratio / D/E / coverage / ROA / CF-to-debt fallbacks
 *      (2.5, 1.5, 2.0, 0.5, 3.0, 0.05, 0.3);
 *    - years-in-business from the entity id (`5 + id % 15`);
 *    - collateral = currentRatio × 1e6 × ROA × 10;
 *    - exposure / commitment / drawn as 1.2× / 0.7× of that invention;
 *    - a CCF of 0.5.
 *    CreditRiskEngine.creditScore / expectedLoss are not called with those
 *    inputs — that would launder a fabrication through a trusted API.
 * 4. Per-entry `Math.abs` is never used.
 *
 * Account-code prefixes follow the convention used across the app:
 *   1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx · 7 Interest
 *   10–12 current assets · 20–21 current liabilities
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface CreditRiskGLEntry {
  readonly accountCode?: string;
  readonly accountName?: string;
  readonly entityId?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface CreditEntityRow {
  readonly id: string;
  readonly name: string;
  readonly assets: number;
  readonly liabilities: number;
  readonly equity: number;
  readonly revenue: number;
  readonly cogs: number;
  readonly opex: number;
  readonly interest: number | null;
  readonly netIncome: number;
  readonly currentAssets: number | null;
  readonly currentLiabilities: number | null;
  readonly currentRatio: number | null;
  readonly debtToEquity: number | null;
  readonly interestCoverage: number | null;
  readonly returnOnAssets: number | null;
}

export interface CreditRiskDerivation {
  readonly entities: readonly CreditEntityRow[];
  readonly totalAssets: number;
  readonly totalLiabilities: number;
  readonly totalRevenue: number;
  readonly totalNetIncome: number;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function hasDebitCredit(entry: CreditRiskGLEntry): boolean {
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

function debitNormal(entry: CreditRiskGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

function creditNormal(entry: CreditRiskGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function withPrefix(
  entries: readonly CreditRiskGLEntry[],
  prefix: string
): readonly CreditRiskGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

function hasPrefix(entries: readonly CreditRiskGLEntry[], prefix: string): boolean {
  return entries.some((e) => (e.accountCode ?? '').startsWith(prefix));
}

function ratio(numer: Decimal, denom: Decimal): Decimal | null {
  if (denom.isZero()) return null;
  return divideMoney(numer, denom);
}

function totalsFor(entries: readonly CreditRiskGLEntry[]): {
  assets: Decimal;
  liabilities: Decimal;
  equity: Decimal;
  revenue: Decimal;
  cogs: Decimal;
  opex: Decimal;
  hasInterest: boolean;
  interest: Decimal;
  netIncome: Decimal;
  hasCurrentAssets: boolean;
  hasCurrentLiabilities: boolean;
  currentAssets: Decimal;
  currentLiabilities: Decimal;
} {
  const assets = sumMoney(withPrefix(entries, '1').map(debitNormal));
  const liabilities = sumMoney(withPrefix(entries, '2').map(creditNormal));
  const equity = sumMoney(withPrefix(entries, '3').map(creditNormal));
  const revenue = sumMoney(withPrefix(entries, '4').map(creditNormal));
  const cogs = sumMoney(withPrefix(entries, '5').map(debitNormal));
  const opex = sumMoney(withPrefix(entries, '6').map(debitNormal));
  const hasInterest = hasPrefix(entries, '7');
  const interest = hasInterest ? sumMoney(withPrefix(entries, '7').map(debitNormal)) : ZERO;
  const netIncome = revenue.minus(cogs).minus(opex).minus(interest);

  const currentAssetRows = [
    ...withPrefix(entries, '10'),
    ...withPrefix(entries, '11'),
    ...withPrefix(entries, '12'),
  ];
  const currentLiabRows = [...withPrefix(entries, '20'), ...withPrefix(entries, '21')];
  const hasCurrentAssets = currentAssetRows.length > 0;
  const hasCurrentLiabilities = currentLiabRows.length > 0;

  return {
    assets,
    liabilities,
    equity,
    revenue,
    cogs,
    opex,
    hasInterest,
    interest,
    netIncome,
    hasCurrentAssets,
    hasCurrentLiabilities,
    currentAssets: hasCurrentAssets ? sumMoney(currentAssetRows.map(debitNormal)) : ZERO,
    currentLiabilities: hasCurrentLiabilities ? sumMoney(currentLiabRows.map(creditNormal)) : ZERO,
  };
}

function rowFor(id: string, name: string, entries: readonly CreditRiskGLEntry[]): CreditEntityRow {
  const t = totalsFor(entries);
  const ebit = t.revenue.minus(t.cogs).minus(t.opex);
  return {
    id,
    name,
    assets: t.assets.toDecimalPlaces(2).toNumber(),
    liabilities: t.liabilities.toDecimalPlaces(2).toNumber(),
    equity: t.equity.toDecimalPlaces(2).toNumber(),
    revenue: t.revenue.toDecimalPlaces(2).toNumber(),
    cogs: t.cogs.toDecimalPlaces(2).toNumber(),
    opex: t.opex.toDecimalPlaces(2).toNumber(),
    interest: t.hasInterest ? t.interest.toDecimalPlaces(2).toNumber() : null,
    netIncome: t.netIncome.toDecimalPlaces(2).toNumber(),
    currentAssets: t.hasCurrentAssets ? t.currentAssets.toDecimalPlaces(2).toNumber() : null,
    currentLiabilities: t.hasCurrentLiabilities
      ? t.currentLiabilities.toDecimalPlaces(2).toNumber()
      : null,
    currentRatio:
      t.hasCurrentAssets && t.hasCurrentLiabilities
        ? (ratio(t.currentAssets, t.currentLiabilities)?.toDecimalPlaces(4).toNumber() ?? null)
        : null,
    debtToEquity: ratio(t.liabilities, t.equity)?.toDecimalPlaces(4).toNumber() ?? null,
    interestCoverage: t.hasInterest
      ? (ratio(ebit, t.interest)?.toDecimalPlaces(4).toNumber() ?? null)
      : null,
    returnOnAssets: ratio(t.netIncome, t.assets)?.toDecimalPlaces(6).toNumber() ?? null,
  };
}

/**
 * Derive every credit-relevant figure the posted GL genuinely supports.
 *
 * Does not invent a rating, PD, LGD, EAD, expected loss, collateral value or
 * years-in-business. Those need a credit-facility book the GL does not carry.
 */
export function deriveCreditRisk(entries: readonly CreditRiskGLEntry[]): CreditRiskDerivation {
  const unavailable: UnavailableLine[] = [
    {
      label: 'Probability of default / rating',
      reason:
        'A PD or agency-style rating needs a calibrated scorecard and, usually, years in business. Those are not posted accounts and are not filled from the entity id.',
    },
    {
      label: 'LGD / EAD / expected loss',
      reason:
        'Loss-given-default and exposure-at-default need collateral, commitment, drawn balance and a credit-conversion factor. Inventing those as multiples of a ratio would fabricate a provision.',
    },
    {
      label: 'Cash-flow-to-debt',
      reason:
        'Cash flow from operations is not an account-code prefix. Using earnings over liabilities as a stand-in would invent a coverage ratio.',
    },
  ];

  const byEntity = new Map<string, CreditRiskGLEntry[]>();
  for (const entry of entries) {
    const key = entry.entityId || '';
    const bucket = byEntity.get(key);
    if (bucket) bucket.push(entry);
    else byEntity.set(key, [entry]);
  }

  const entities: CreditEntityRow[] = [...byEntity.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, rows]) => rowFor(id || 'posted', id || 'Posted ledger', rows));

  if (!entries.some((e) => (e.accountCode ?? '').startsWith('7'))) {
    unavailable.push({
      label: 'Interest coverage',
      reason:
        'No interest accounts (prefix 7) are posted. Coverage is omitted rather than computed from an assumed fraction of operating expense.',
    });
  }

  const all = totalsFor(entries);
  return {
    entities,
    totalAssets: all.assets.toDecimalPlaces(2).toNumber(),
    totalLiabilities: all.liabilities.toDecimalPlaces(2).toNumber(),
    totalRevenue: all.revenue.toDecimalPlaces(2).toNumber(),
    totalNetIncome: all.netIncome.toDecimalPlaces(2).toNumber(),
    unavailable,
  };
}
