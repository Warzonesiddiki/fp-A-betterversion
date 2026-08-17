/**
 * Tax provision derivation from General Ledger entries.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All arithmetic is decimal.js via `@/utils/money`. No IEEE-754 money math.
 * 2. A figure is emitted ONLY when it is derivable from the posted GL.
 * 3. Jurisdiction splits, statutory rates, deferred/current splits and
 *    quarterly seasonality are NEVER invented. An ASC 740 / IAS 12 provision
 *    requires tax rates, permanent/temporary differences and credits that a
 *    standard GL does not carry. `TaxEngine.computeProvision` is the engine
 *    for that calculation; this module does not call it with assumed inputs.
 * 4. Posted income-tax expense (account-code prefix 8) is reported when
 *    present. It is the book tax expense, not a computed statutory provision.
 * 5. Per-entry `Math.abs` is never used — it discards contra entries.
 *
 * Account-code prefixes follow the convention used across the app:
 *   4 Revenue · 5 COGS · 6 OpEx · 7 Interest · 8 Income tax
 */

import Decimal from 'decimal.js';
import { divideMoney, sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

/** Minimal shape this module needs from a posted GL entry. */
export interface TaxProvisionGLEntry {
  readonly accountCode?: string;
  readonly period?: string;
  readonly date?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
}

/** A statement line that could not be derived, plus why. */
export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

/** One book-tax caption. `amount` is null when the GL cannot support it. */
export interface TaxProvisionLine {
  readonly key: string;
  readonly label: string;
  readonly amount: Decimal | null;
}

/** Honest quarterly totals — only quarters that actually have P&L activity. */
export interface QuarterlyTaxPoint {
  readonly quarter: string;
  readonly pretaxIncome: Decimal;
  readonly postedTaxExpense: Decimal | null;
  readonly effectiveRatePct: Decimal | null;
}

/** Additive waterfall step. Values are already signed for the chart. */
export interface TaxWaterfallStep {
  readonly name: string;
  readonly value: number;
}

export interface TaxProvisionDerivation {
  readonly revenue: Decimal;
  readonly cogs: Decimal;
  readonly opex: Decimal;
  readonly interest: Decimal;
  readonly pretaxIncome: Decimal;
  readonly hasInterest: boolean;
  readonly hasPostedTax: boolean;
  readonly postedTaxExpense: Decimal | null;
  readonly effectiveRatePct: Decimal | null;
  readonly netIncome: Decimal | null;
  readonly lines: readonly TaxProvisionLine[];
  readonly quarters: readonly QuarterlyTaxPoint[];
  readonly waterfall: readonly TaxWaterfallStep[];
  readonly unavailable: readonly UnavailableLine[];
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function debitNormal(entries: readonly TaxProvisionGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.debit).minus(money(e.credit))));
}

function creditNormal(entries: readonly TaxProvisionGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.credit).minus(money(e.debit))));
}

function withPrefix(
  entries: readonly TaxProvisionGLEntry[],
  prefix: string
): readonly TaxProvisionGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

function hasPrefix(entries: readonly TaxProvisionGLEntry[], prefix: string): boolean {
  return entries.some((e) => (e.accountCode ?? '').startsWith(prefix));
}

function entryPeriod(entry: TaxProvisionGLEntry): string {
  return entry.period || (entry.date ?? '').slice(0, 7);
}

/** `YYYY-MM` → `YYYY-Qn`, or null when the period is not a calendar month. */
export function periodToQuarter(period: string): string | null {
  const match = /^(\d{4})-(\d{2})/.exec(period);
  if (!match) return null;
  const month = Number(match[2]);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return `${match[1]}-Q${Math.ceil(month / 3)}`;
}

function effectiveRate(tax: Decimal, pretax: Decimal): Decimal | null {
  if (pretax.isZero()) return null;
  return divideMoney(tax, pretax).times(100);
}

function totalsFor(entries: readonly TaxProvisionGLEntry[]): {
  revenue: Decimal;
  cogs: Decimal;
  opex: Decimal;
  interest: Decimal;
  pretaxIncome: Decimal;
  hasInterest: boolean;
  hasPostedTax: boolean;
  postedTaxExpense: Decimal | null;
} {
  const hasInterest = hasPrefix(entries, '7');
  const hasPostedTax = hasPrefix(entries, '8');
  const revenue = creditNormal(withPrefix(entries, '4'));
  const cogs = debitNormal(withPrefix(entries, '5'));
  const opex = debitNormal(withPrefix(entries, '6'));
  const interest = hasInterest ? debitNormal(withPrefix(entries, '7')) : ZERO;
  const pretaxIncome = revenue.minus(cogs).minus(opex).minus(interest);
  const postedTaxExpense = hasPostedTax ? debitNormal(withPrefix(entries, '8')) : null;
  return {
    revenue,
    cogs,
    opex,
    interest,
    pretaxIncome,
    hasInterest,
    hasPostedTax,
    postedTaxExpense,
  };
}

/**
 * Derive every tax-provision figure the posted GL genuinely supports.
 *
 * Does not invent a multi-jurisdiction table, a statutory rate, a deferred
 * split, or a quarterly seasonality curve. Those require inputs the GL does
 * not carry.
 */
export function deriveTaxProvision(
  entries: readonly TaxProvisionGLEntry[]
): TaxProvisionDerivation {
  const unavailable: UnavailableLine[] = [];
  const note = (label: string, reason: string): void => {
    unavailable.push({ label, reason });
  };

  const {
    revenue,
    cogs,
    opex,
    interest,
    pretaxIncome,
    hasInterest,
    hasPostedTax,
    postedTaxExpense,
  } = totalsFor(entries);

  const effectiveRatePct =
    postedTaxExpense === null ? null : effectiveRate(postedTaxExpense, pretaxIncome);
  const netIncome = postedTaxExpense === null ? null : pretaxIncome.minus(postedTaxExpense);

  if (!hasInterest) {
    note(
      'Interest expense',
      'No interest accounts (prefix 7) are posted, so pre-tax income is revenue − COGS − operating expenses.'
    );
  }
  if (!hasPostedTax) {
    note(
      'Income tax expense',
      'No income-tax accounts (prefix 8) are posted. Book tax, effective rate and net income are omitted rather than assumed to be zero.'
    );
  }
  note(
    'Jurisdiction split',
    'The posted GL does not tag entries with a tax jurisdiction. Allocating pre-tax income across assumed geographies at assumed statutory rates would invent a provision.'
  );
  note(
    'Current vs deferred tax',
    'Separating current tax from deferred tax (DTA/DTL) requires temporary differences, enacted rates and a valuation-allowance judgement. None of those live on a standard GL. TaxEngine.computeProvision can compute them when those inputs are supplied.'
  );
  note(
    'Statutory ASC 740 / IAS 12 provision',
    'A statutory provision also needs permanent differences, tax credits and loss carryforwards. This page reports book tax from posted accounts only.'
  );

  const lines: TaxProvisionLine[] = [
    { key: 'revenue', label: 'Revenue', amount: revenue },
    { key: 'cogs', label: 'Cost of goods sold', amount: cogs },
    { key: 'opex', label: 'Operating expenses', amount: opex },
    { key: 'interest', label: 'Interest expense', amount: hasInterest ? interest : null },
    { key: 'pretax', label: 'Pre-tax income', amount: pretaxIncome },
    {
      key: 'tax',
      label: 'Income tax expense (posted)',
      amount: postedTaxExpense,
    },
    { key: 'netIncome', label: 'Net income', amount: netIncome },
  ];

  const waterfall: TaxWaterfallStep[] = [
    { name: 'Pre-Tax Income', value: pretaxIncome.toNumber() },
  ];
  if (postedTaxExpense !== null) {
    // Tax is a use of pretax. The chart accumulates steps; do not also add
    // net income as a third step — that would double-count the residual.
    waterfall.push({ name: 'Income Tax', value: postedTaxExpense.neg().toNumber() });
  }

  const byQuarter = new Map<string, TaxProvisionGLEntry[]>();
  for (const entry of entries) {
    const quarter = periodToQuarter(entryPeriod(entry));
    if (!quarter) continue;
    const bucket = byQuarter.get(quarter);
    if (bucket) bucket.push(entry);
    else byQuarter.set(quarter, [entry]);
  }

  const quarters: QuarterlyTaxPoint[] = [...byQuarter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([quarter, rows]) => {
      const q = totalsFor(rows);
      const tax = q.postedTaxExpense;
      return {
        quarter,
        pretaxIncome: q.pretaxIncome,
        postedTaxExpense: tax,
        effectiveRatePct: tax === null ? null : effectiveRate(tax, q.pretaxIncome),
      };
    })
    .filter((q) => !q.pretaxIncome.isZero() || q.postedTaxExpense !== null);

  return {
    revenue,
    cogs,
    opex,
    interest,
    pretaxIncome,
    hasInterest,
    hasPostedTax,
    postedTaxExpense,
    effectiveRatePct,
    netIncome,
    lines,
    quarters,
    waterfall,
    unavailable,
  };
}
