/**
 * Property valuation figures the posted General Ledger can support.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. **A per-property cap rate must be that property's cap rate.** The page
 *    previously assigned the PORTFOLIO cap rate (`dashStats.capRate`) to every
 *    row under the column header "Implied Cap Rate", so five properties showed
 *    one identical number as if each had been measured. Worse, the summary
 *    then computed a value-weighted average of that constant —
 *    `Σ(capRate × value) / Σ value` — which returns the constant back and was
 *    displayed as "Weighted Cap Rate". Here each property's cap rate is its own
 *    NOI over its own appraised value, or `null`.
 * 2. **No invented deltas.** `+8.4% vs prior period`, `+15.2% since
 *    acquisition`, `+2.1% above market avg` and `−0.15 compression` were typed
 *    constants on the KPI tiles. A period-over-period change needs a prior
 *    valuation the workspace does not store.
 * 3. **No invented property attributes.** `RealEstateEngine.getPropertyBreakdown`
 *    returns `yield: 6.2` (mocked), `location: 'TBD'` and a `status` of
 *    Core/Value-Add decided by `cost > 10_000_000`. None of them is a ledger
 *    fact and none is surfaced here. `avgHoldingPeriod: 4.2` and
 *    `occupancy: 94.8` from the same engine are likewise not displayed.
 * 4. **A property name is a property name.** The engine labels each entity with
 *    `entries[0].accountName`, which is whichever account happened to sort
 *    first — "Cash" for many ledgers. This module prefers the entity id and
 *    exposes the account-name guess separately so the UI never presents it as
 *    authoritative.
 * 5. All arithmetic is decimal.js via `@/utils/money`; a ratio is emitted only
 *    when its denominator is genuinely positive.
 *
 * Account prefixes used (RealEstateEngine's documented convention):
 *   15xx property acquisition cost · 16xx property appraised value
 *   40xx rental income · 50xx property operating expense
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

export interface ValuationGLEntry {
  readonly accountCode?: string | null;
  readonly accountName?: string | null;
  readonly entityId?: string | null;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
  readonly amount?: number | string | Decimal | null;
}

export interface PropertyValuationRow {
  readonly id: string;
  readonly name: string;
  readonly costBasis: number;
  readonly appraisedValue: number;
  readonly unrealizedGain: number;
  /** Appreciation percent; `null` when no cost basis is posted. */
  readonly appreciationPercent: number | null;
  /** NOI for this property; `null` when it posts no rental income or opex. */
  readonly noi: number | null;
  /** NOI ÷ appraised value; `null` unless both exist. */
  readonly capRatePercent: number | null;
}

export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface ValuationDerivation {
  readonly properties: readonly PropertyValuationRow[];
  readonly totalCostBasis: number;
  readonly totalAppraisedValue: number;
  readonly totalUnrealizedGain: number;
  /** Portfolio gain ÷ portfolio cost. Value-weighted, not a mean of means. */
  readonly portfolioAppreciationPercent: number | null;
  /** Σ NOI ÷ Σ appraised value over properties that post both. */
  readonly weightedCapRatePercent: number | null;
  /** Σ NOI over properties that post rental income or opex; `null` if none. */
  readonly totalNoi: number | null;
  /** Posted real-estate debt (25xx), credit-normal. `null` when none is posted. */
  readonly totalDebt: number | null;
  /** Debt ÷ appraised value; `null` unless both exist. */
  readonly loanToValuePercent: number | null;
  /** How many properties contributed to the weighted cap rate. */
  readonly capRateCoverage: number;
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);
const CURRENCY_PLACES = 2;
const PERCENT_PLACES = 2;

const DEBT_PREFIX = '25';
const COST_PREFIX = '15';
const VALUE_PREFIX = '16';
const RENTAL_PREFIX = '40';
const OPEX_PREFIX = '50';

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function code(entry: ValuationGLEntry): string {
  return entry.accountCode ?? '';
}

function hasDebitCredit(entry: ValuationGLEntry): boolean {
  const { debit, credit } = entry;
  if (debit == null && credit == null) return false;
  const debitN = debit == null ? 0 : Number(debit);
  const creditN = credit == null ? 0 : Number(credit);
  if (debitN === 0 && creditN === 0 && entry.amount != null && Number(entry.amount) !== 0) {
    return false;
  }
  return true;
}

/** Assets and expenses are debit-normal. */
function debitNormal(entry: ValuationGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.debit).minus(money(entry.credit));
  return money(entry.amount);
}

/** Rental income is credit-normal. */
function creditNormal(entry: ValuationGLEntry): Decimal {
  if (hasDebitCredit(entry)) return money(entry.credit).minus(money(entry.debit));
  return money(entry.amount);
}

function sumPrefix(
  entries: readonly ValuationGLEntry[],
  prefix: string,
  sign: (e: ValuationGLEntry) => Decimal
): Decimal {
  return sumMoney(entries.filter((e) => code(e).startsWith(prefix)).map(sign));
}

function hasPrefix(entries: readonly ValuationGLEntry[], prefix: string): boolean {
  return entries.some((e) => code(e).startsWith(prefix));
}

function cash(value: Decimal): number {
  return value.toDecimalPlaces(CURRENCY_PLACES).toNumber();
}

function percentOf(numer: Decimal, denom: Decimal): number | null {
  if (!denom.greaterThan(0)) return null;
  return divideMoney(numer, denom).times(100).toDecimalPlaces(PERCENT_PLACES).toNumber();
}

/**
 * Derive per-property and portfolio valuation from posted entries.
 *
 * Returns `null` when no property cost or appraised value is posted at all.
 */
export function deriveValuation(entries: readonly ValuationGLEntry[]): ValuationDerivation | null {
  const entityIds = [...new Set(entries.map((e) => e.entityId).filter((id): id is string => !!id))];

  const properties: PropertyValuationRow[] = [];
  for (const id of entityIds) {
    const rows = entries.filter((e) => e.entityId === id);
    const cost = sumPrefix(rows, COST_PREFIX, debitNormal);
    const value = sumPrefix(rows, VALUE_PREFIX, debitNormal);
    if (!cost.greaterThan(0) && !value.greaterThan(0)) continue;

    const postsRental = hasPrefix(rows, RENTAL_PREFIX);
    const postsOpex = hasPrefix(rows, OPEX_PREFIX);
    const noi =
      postsRental || postsOpex
        ? sumPrefix(rows, RENTAL_PREFIX, creditNormal).minus(
            sumPrefix(rows, OPEX_PREFIX, debitNormal)
          )
        : null;

    // Prefer a non-cash-looking account name only as a hint; the entity id is
    // the identifier the ledger actually guarantees.
    const nameHint = rows.find(
      (r) => code(r).startsWith(VALUE_PREFIX) || code(r).startsWith(COST_PREFIX)
    )?.accountName;

    properties.push({
      id,
      name: nameHint ? `${id} · ${nameHint}` : id,
      costBasis: cash(cost),
      appraisedValue: cash(value),
      unrealizedGain: cash(value.minus(cost)),
      appreciationPercent: percentOf(value.minus(cost), cost),
      noi: noi === null ? null : cash(noi),
      capRatePercent: noi === null ? null : percentOf(noi, value),
    });
  }

  if (properties.length === 0) return null;

  const totalCost = sumMoney(properties.map((p) => p.costBasis));
  const totalValue = sumMoney(properties.map((p) => p.appraisedValue));
  const totalGain = totalValue.minus(totalCost);

  const noiProperties = properties.filter((p) => p.noi !== null);
  const totalNoi =
    noiProperties.length === 0 ? null : sumMoney(noiProperties.map((p) => p.noi ?? 0));

  const postsDebt = hasPrefix(entries, DEBT_PREFIX);
  const totalDebt = postsDebt ? sumPrefix(entries, DEBT_PREFIX, creditNormal) : null;

  const withCapRate = properties.filter((p) => p.noi !== null && p.appraisedValue > 0);
  const noiSum = sumMoney(withCapRate.map((p) => p.noi ?? 0));
  const valueSum = sumMoney(withCapRate.map((p) => p.appraisedValue));

  const unavailable: UnavailableLine[] = [];
  if (withCapRate.length === 0) {
    unavailable.push({
      label: 'Cap rate',
      reason:
        'No property posts both rental income (40xx) and an appraised value (16xx), so no capitalisation rate can be derived.',
    });
  } else if (withCapRate.length < properties.length) {
    unavailable.push({
      label: 'Cap rate for every property',
      reason: `${withCapRate.length} of ${properties.length} properties post the rental income needed for a cap rate; the rest are shown blank rather than given the portfolio figure.`,
    });
  }
  if (totalNoi === null) {
    unavailable.push({
      label: 'Net operating income',
      reason: 'No rental income (40xx) or property operating expense (50xx) is posted.',
    });
  }
  if (totalDebt === null) {
    unavailable.push({
      label: 'Loan-to-value',
      reason: 'No real-estate debt (25xx) is posted, so no LTV can be computed.',
    });
  }
  unavailable.push(
    {
      label: 'Period-over-period change',
      reason:
        'Appraisals are held as a single posted balance. Comparing periods needs a valuation history the workspace does not store.',
    },
    {
      label: 'Occupancy, holding period and property yield',
      reason:
        'Lease-level occupancy, acquisition dates and stabilised yield are not ledger facts. They need a rent roll and an asset register, so they are omitted rather than estimated.',
    }
  );

  return {
    properties,
    totalCostBasis: cash(totalCost),
    totalAppraisedValue: cash(totalValue),
    totalUnrealizedGain: cash(totalGain),
    portfolioAppreciationPercent: percentOf(totalGain, totalCost),
    weightedCapRatePercent: withCapRate.length === 0 ? null : percentOf(noiSum, valueSum),
    totalNoi: totalNoi === null ? null : cash(totalNoi),
    totalDebt: totalDebt === null ? null : cash(totalDebt),
    loanToValuePercent: totalDebt === null ? null : percentOf(totalDebt, totalValue),
    capRateCoverage: withCapRate.length,
    unavailable,
  };
}
