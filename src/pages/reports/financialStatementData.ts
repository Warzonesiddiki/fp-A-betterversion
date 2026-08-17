/**
 * Financial statement derivation from General Ledger entries.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All arithmetic is decimal.js via `@/utils/money`. No IEEE-754 money math.
 * 2. A line is emitted ONLY when it is derivable from the posted GL. Lines that
 *    would require account-level classification the GL does not carry (cash vs
 *    receivables, D&A, cash-flow categories) are OMITTED, not estimated. The
 *    renderer prints an em dash for absent keys, so an omitted line reads as
 *    "not available" instead of a plausible-looking invention.
 * 3. Nothing is ever derived from a hardcoded ratio, growth factor, or seeded
 *    variance. Budget figures come from posted budget line items or are absent.
 *
 * Account-code prefixes follow the chart-of-accounts convention used across the
 * app (see `src/domain/chartOfAccounts.ts`):
 *   1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx
 *   7 Interest · 8 Income tax
 */

import Decimal from 'decimal.js';
import { sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

/** Minimal shape this module needs from a posted GL entry. */
export interface StatementGLEntry {
  readonly accountCode?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
}

/** Minimal shape this module needs from a posted budget line item. */
export interface StatementBudgetLine {
  readonly accountCode?: string;
  readonly amount?: number | string | Decimal | null;
}

/** A statement line that could not be derived, plus why. */
export interface UnavailableLine {
  readonly label: string;
  readonly reason: string;
}

export interface StatementDataResult {
  /** Keys consumed by the renderer (`<normalisedLabel>_<columnKey>`). */
  readonly data: Record<string, number>;
  /** Lines deliberately not emitted, surfaced to the user as a disclosure. */
  readonly unavailable: readonly UnavailableLine[];
  /** True when posted budget line items backed the Budget-vs-Actual columns. */
  readonly hasBudget: boolean;
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

/** Signed movement for debit-normal accounts: debit − credit. */
function debitNormal(entries: readonly StatementGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.debit).minus(money(e.credit))));
}

/** Signed movement for credit-normal accounts: credit − debit. */
function creditNormal(entries: readonly StatementGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.credit).minus(money(e.debit))));
}

function withPrefix(
  entries: readonly StatementGLEntry[],
  prefix: string
): readonly StatementGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

function hasPrefix(entries: readonly StatementGLEntry[], prefix: string): boolean {
  return entries.some((e) => (e.accountCode ?? '').startsWith(prefix));
}

/** Margin as a percentage; undefined when the base is zero (never 0-by-default). */
function marginPct(numerator: Decimal, base: Decimal): Decimal | undefined {
  if (base.isZero()) return undefined;
  return numerator.div(base).times(100);
}

function put(target: Record<string, number>, key: string, value: Decimal | undefined): void {
  if (value === undefined) return;
  target[key] = value.toNumber();
}

/**
 * Derive every statement value the posted GL genuinely supports.
 *
 * Emits P&L, balance-sheet, cash-flow and budget-vs-actual keys into one record
 * because the renderer looks all four up from a single `data` map.
 */
export function deriveStatementData(
  entries: readonly StatementGLEntry[],
  budgetLines: readonly StatementBudgetLine[] = []
): StatementDataResult {
  const data: Record<string, number> = {};
  const unavailable: UnavailableLine[] = [];

  const note = (label: string, reason: string): void => {
    unavailable.push({ label, reason });
  };

  // ---------------------------------------------------------------- P&L ----
  const revenue = creditNormal(withPrefix(entries, '4'));
  const cogs = debitNormal(withPrefix(entries, '5'));
  const opex = debitNormal(withPrefix(entries, '6'));
  const grossProfit = revenue.minus(cogs);
  const ebitda = grossProfit.minus(opex);

  put(data, 'totalrevenue_actual', revenue);
  put(data, 'totalcogs_actual', cogs);
  put(data, 'grossprofit_actual', grossProfit);
  put(data, 'grossmargin_actual', marginPct(grossProfit, revenue));
  put(data, 'totaloperatingexpenses_actual', opex);
  put(data, 'ebitda_actual', ebitda);
  put(data, 'ebitdamargin_actual', marginPct(ebitda, revenue));

  // Interest and tax only when those accounts were actually posted.
  const hasInterest = hasPrefix(entries, '7');
  const hasTax = hasPrefix(entries, '8');
  const interest = hasInterest ? debitNormal(withPrefix(entries, '7')) : ZERO;
  const tax = hasTax ? debitNormal(withPrefix(entries, '8')) : ZERO;

  if (hasInterest) put(data, 'interestexpense_actual', interest);
  if (hasTax) put(data, 'incometax_actual', tax);

  const pretaxIncome = ebitda.minus(interest);
  const netIncome = pretaxIncome.minus(tax);
  put(data, 'pretaxincome_actual', pretaxIncome);
  put(data, 'netincome_actual', netIncome);
  put(data, 'netmargin_actual', marginPct(netIncome, revenue));

  note(
    'Depreciation & Amortisation / Operating Income',
    'The GL does not tag a depreciation account, so D&A cannot be separated from operating expenses. EBITDA is therefore shown before any D&A that may sit inside OpEx.'
  );
  note(
    'Revenue and cost breakdowns (product/service, material/labour/overhead, S&M, R&D, G&A)',
    'These splits require account-level classification that the imported chart of accounts does not provide. Only the posted totals are shown.'
  );
  if (!hasInterest) note('Interest income / expense', 'No interest accounts (prefix 7) are posted.');
  if (!hasTax) note('Income tax', 'No income-tax accounts (prefix 8) are posted.');

  // ------------------------------------------------------ Balance sheet ----
  const assets = debitNormal(withPrefix(entries, '1'));
  const liabilities = creditNormal(withPrefix(entries, '2'));
  const equity = creditNormal(withPrefix(entries, '3'));

  put(data, 'totalassets_current', assets);
  put(data, 'totalliabilities_current', liabilities);
  put(data, 'totalstockholdersequity_current', equity);
  put(data, 'totalliabilitiesequity_current', liabilities.plus(equity));

  note(
    'Balance-sheet detail (cash, receivables, inventory, PP&E, payables, debt, equity components)',
    'Splitting assets, liabilities and equity into individual captions requires per-account balance-sheet mapping. Only the posted control totals are shown.'
  );

  // ---------------------------------------------------------- Cash flow ----
  // An indirect cash-flow statement needs each account mapped to an operating,
  // investing or financing activity. Prefix codes cannot supply that, so only
  // the articulating figure (net income) is published.
  put(data, 'netincome_fy', netIncome);
  note(
    'Cash flow statement',
    'An indirect cash-flow statement requires each account to be mapped to an operating, investing or financing activity, plus opening and closing cash balances. Only net income is derivable from the posted GL.'
  );

  // ----------------------------------------------- Budget vs Actual (BvA) ----
  const budgetFor = (prefix: string): Decimal | undefined => {
    const lines = budgetLines.filter((l) => (l.accountCode ?? '').startsWith(prefix));
    if (lines.length === 0) return undefined;
    return sumMoney(lines.map((l) => money(l.amount)));
  };

  const budgetRevenue = budgetFor('4');
  const budgetCogs = budgetFor('5');
  const budgetOpex = budgetFor('6');
  const hasBudget =
    budgetRevenue !== undefined || budgetCogs !== undefined || budgetOpex !== undefined;

  if (hasBudget) {
    /**
     * `higherIsBetter` encodes the accounting direction: more revenue is
     * favourable, more cost is not. Status is only emitted when a budget exists.
     */
    const bva = (
      key: string,
      actual: Decimal,
      budget: Decimal | undefined,
      higherIsBetter: boolean
    ): void => {
      if (budget === undefined) return;
      const variance = actual.minus(budget);
      put(data, `${key}_actual`, actual);
      put(data, `${key}_budget`, budget);
      put(data, `${key}_variance`, variance);
      const pct = marginPct(variance, budget.abs());
      put(data, `${key}_variancePct`, pct);
      const favourable = higherIsBetter ? variance.gte(0) : variance.lte(0);
      data[`${key}_status`] = favourable ? 1 : -1;
    };

    bva('totalrevenue', revenue, budgetRevenue, true);
    bva('costofgoodssold', cogs, budgetCogs, false);
    bva('totalopex', opex, budgetOpex, false);

    if (budgetRevenue !== undefined && budgetCogs !== undefined) {
      const budgetGross = budgetRevenue.minus(budgetCogs);
      bva('grossprofit', grossProfit, budgetGross, true);
      const budgetGrossMargin = marginPct(budgetGross, budgetRevenue);
      const actualGrossMargin = marginPct(grossProfit, revenue);
      if (budgetGrossMargin !== undefined && actualGrossMargin !== undefined) {
        put(data, 'grossmargin_actual', actualGrossMargin);
        put(data, 'grossmargin_budget', budgetGrossMargin);
      }

      if (budgetOpex !== undefined) {
        const budgetEbitda = budgetGross.minus(budgetOpex);
        bva('ebitda', ebitda, budgetEbitda, true);
        const budgetEbitdaMargin = marginPct(budgetEbitda, budgetRevenue);
        const actualEbitdaMargin = marginPct(ebitda, revenue);
        if (budgetEbitdaMargin !== undefined && actualEbitdaMargin !== undefined) {
          put(data, 'ebitdamargin_actual', actualEbitdaMargin);
          put(data, 'ebitdamargin_budget', budgetEbitdaMargin);
        }
        // Net income budget only holds when interest/tax are also budgeted;
        // they are not, so it is deliberately not published.
      }
    }
  } else {
    note(
      'Budget vs Actual',
      'No budget line items are posted for the revenue, COGS or operating-expense accounts, so budget, variance and status columns are unavailable.'
    );
  }

  return { data, unavailable, hasBudget };
}
