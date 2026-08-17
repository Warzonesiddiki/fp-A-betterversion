/**
 * Three-statement model derivation from General Ledger entries.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All arithmetic is decimal.js via `@/utils/money`. No IEEE-754 money math.
 * 2. Sign convention matches `ThreeStatementEngine`'s documented contract, which
 *    its own fixtures pin: **revenue and income are positive, costs and expenses
 *    are negative**. Revenue is credit-normal (`credit − debit`); expense classes
 *    are debit-normal and are negated so they reduce income when summed.
 *    Per-entry `Math.abs` is never used — it discards contra entries (a sales
 *    return would otherwise increase revenue).
 * 3. Totals are computed once here and consumed directly by the view. The view
 *    must never back-solve a line item out of other line items.
 *
 * Account-code prefixes follow the convention used across the app:
 *   1 Asset · 2 Liability · 3 Equity · 4 Revenue · 5 COGS · 6 OpEx
 *   7 Interest · 8 Income tax
 */

import Decimal from 'decimal.js';
import type {
  BalanceSheetData,
  CashFlowData,
  IncomeStatementData,
} from '@/engines/ThreeStatementEngine';
import { sumMoney, toDecimal, type MoneyInput } from '@/utils/money';

/** Minimal shape this module needs from a posted GL entry. */
export interface ThreeStatementGLEntry {
  readonly accountCode?: string;
  readonly description?: string;
  readonly period?: string;
  readonly date?: string;
  readonly debit?: number | string | Decimal | null;
  readonly credit?: number | string | Decimal | null;
}

/** Income-statement totals, carried as Decimals for the view to format. */
export interface IncomeTotals {
  readonly revenue: Decimal;
  readonly cogs: Decimal;
  readonly grossProfit: Decimal;
  readonly opex: Decimal;
  readonly operatingIncome: Decimal;
  readonly interest: Decimal;
  readonly tax: Decimal;
  readonly netIncome: Decimal;
}

export interface ThreeStatementDerivation {
  readonly incomeStatement: IncomeStatementData;
  readonly balanceSheet: BalanceSheetData;
  readonly cashFlow: CashFlowData;
  /**
   * Positive-magnitude totals for presentation. `cogs`, `opex`, `interest` and
   * `tax` are reported as positive costs; the statement objects carry them
   * negative per the engine contract.
   */
  readonly totals: IncomeTotals;
}

const ZERO = new Decimal(0);

function money(value: MoneyInput | null | undefined): Decimal {
  if (value === null || value === undefined) return ZERO;
  return toDecimal(value);
}

function entryPeriod(entry: ThreeStatementGLEntry): string {
  return entry.period || (entry.date ?? '').slice(0, 7);
}

function withPrefix(
  entries: readonly ThreeStatementGLEntry[],
  prefix: string
): readonly ThreeStatementGLEntry[] {
  return entries.filter((e) => (e.accountCode ?? '').startsWith(prefix));
}

/** Debit-normal movement: debit − credit (assets, expenses). */
function debitNormal(entries: readonly ThreeStatementGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.debit).minus(money(e.credit))));
}

/** Credit-normal movement: credit − debit (revenue, liabilities, equity). */
function creditNormal(entries: readonly ThreeStatementGLEntry[]): Decimal {
  return sumMoney(entries.map((e) => money(e.credit).minus(money(e.debit))));
}

function exactBalance(entries: readonly ThreeStatementGLEntry[], code: string): Decimal {
  return debitNormal(entries.filter((e) => e.accountCode === code));
}

/**
 * Build engine `AccountEntry` rows with contract-correct signs.
 * `signedAmount` receives the entry's natural movement for its account class.
 */
function toAccountEntries<C extends string>(
  entries: readonly ThreeStatementGLEntry[],
  category: C,
  signedAmount: (entry: ThreeStatementGLEntry) => Decimal
): { accountCode: string; accountName: string; amount: number; category: C }[] {
  return entries.map((e) => ({
    accountCode: e.accountCode ?? '',
    accountName: e.description ?? '',
    amount: signedAmount(e).toNumber(),
    category,
  }));
}

/**
 * Derive the three statements for every entry on or before `period`.
 *
 * `period` is an inclusive `YYYY-MM` cutoff; balances are cumulative to date,
 * matching the balance-sheet semantics the page presents.
 */
export function deriveThreeStatement(
  entries: readonly ThreeStatementGLEntry[],
  period: string
): ThreeStatementDerivation {
  const filtered = entries.filter((e) => entryPeriod(e) <= period);

  // ------------------------------------------------- Income statement ----
  const revenueEntries = withPrefix(filtered, '4');
  const cogsEntries = withPrefix(filtered, '5');
  const opexEntries = withPrefix(filtered, '6');
  const interestEntries = withPrefix(filtered, '7');
  const taxEntries = withPrefix(filtered, '8');

  // Positive magnitudes for presentation.
  const revenue = creditNormal(revenueEntries);
  const cogs = debitNormal(cogsEntries);
  const opex = debitNormal(opexEntries);
  const interest = debitNormal(interestEntries);
  const tax = debitNormal(taxEntries);

  const grossProfit = revenue.minus(cogs);
  const operatingIncome = grossProfit.minus(opex);
  const netIncome = operatingIncome.minus(interest).minus(tax);

  // Engine contract: income positive, costs negative.
  const incomeStatement: IncomeStatementData = {
    revenue: toAccountEntries(revenueEntries, 'revenue', (e) =>
      money(e.credit).minus(money(e.debit))
    ),
    cogs: toAccountEntries(cogsEntries, 'cogs', (e) => money(e.credit).minus(money(e.debit))),
    grossProfit: grossProfit.toNumber(),
    opex: toAccountEntries(opexEntries, 'opex', (e) => money(e.credit).minus(money(e.debit))),
    depreciation: [],
    amortization: [],
    operatingIncome: operatingIncome.toNumber(),
    interestExpense: toAccountEntries(interestEntries, 'interest', (e) =>
      money(e.credit).minus(money(e.debit))
    ),
    interestIncome: [],
    ebit: operatingIncome.toNumber(),
    taxExpense: toAccountEntries(taxEntries, 'tax', (e) => money(e.credit).minus(money(e.debit))),
    otherIncome: [],
    otherExpense: [],
    netIncome: netIncome.toNumber(),
    period,
  };

  // ----------------------------------------------------- Balance sheet ----
  const totalAssets = debitNormal(withPrefix(filtered, '1'));
  const totalLiabilities = creditNormal(withPrefix(filtered, '2'));
  const postedEquity = creditNormal(withPrefix(filtered, '3'));

  /**
   * Closing equity must include the period's earnings, otherwise A = L + E can
   * only balance when net income is zero. Posted equity accounts carry
   * contributed capital and prior retained earnings; current-period profit is
   * still sitting in the P&L accounts until it is closed out.
   */
  const totalEquity = postedEquity.plus(netIncome);

  const balanceSheet: BalanceSheetData = {
    currentAssets: [],
    cash: exactBalance(filtered, '1000').toNumber(),
    accountsReceivable: exactBalance(filtered, '1100').toNumber(),
    inventory: exactBalance(filtered, '1200').toNumber(),
    prepaidExpenses: 0,
    otherCurrentAssets: 0,
    totalCurrentAssets: 0,
    nonCurrentAssets: [],
    propertyPlantEquipment: exactBalance(filtered, '1600').toNumber(),
    accumulatedDepreciation: 0,
    netFixedAssets: 0,
    intangibleAssets: 0,
    goodwill: 0,
    otherNonCurrentAssets: 0,
    totalNonCurrentAssets: 0,
    totalAssets: totalAssets.toNumber(),
    currentLiabilities: [],
    accountsPayable: creditNormal(filtered.filter((e) => e.accountCode === '2100')).toNumber(),
    accruedExpenses: 0,
    shortTermDebt: 0,
    currentPortionLongTermDebt: 0,
    otherCurrentLiabilities: 0,
    totalCurrentLiabilities: 0,
    nonCurrentLiabilities: [],
    longTermDebt: 0,
    deferredTaxLiability: 0,
    otherNonCurrentLiabilities: 0,
    totalNonCurrentLiabilities: 0,
    totalLiabilities: totalLiabilities.toNumber(),
    equity: [],
    commonStock: 0,
    additionalPaidInCapital: 0,
    retainedEarnings: totalEquity.toNumber(),
    accumulatedOtherComprehensiveIncome: 0,
    treasuryStock: 0,
    totalEquity: totalEquity.toNumber(),
    totalLiabilitiesAndEquity: totalLiabilities.plus(totalEquity).toNumber(),
    period,
  };

  // --------------------------------------------------------- Cash flow ----
  /**
   * Cash movement is measured on the cash account itself rather than inferred
   * from account-class prefixes. The previous implementation summed revenue and
   * opex movements as "operating cash", which conflates accrual results with
   * cash and double-counts any non-cash entry. Splitting that movement into
   * operating/investing/financing requires per-account activity mapping the GL
   * does not carry, so only the total change in cash is published.
   */
  const cashEntries = filtered.filter((e) => e.accountCode === '1000');
  const netChangeInCash = debitNormal(cashEntries);

  const cashFlow: CashFlowData = {
    operatingActivities: [],
    netCashFromOperations: 0,
    investingActivities: [],
    netCashFromInvesting: 0,
    financingActivities: [],
    netCashFromFinancing: 0,
    netChangeInCash: netChangeInCash.toNumber(),
    beginningCash: 0,
    endingCash: netChangeInCash.toNumber(),
    period,
  };

  return {
    incomeStatement,
    balanceSheet,
    cashFlow,
    totals: {
      revenue,
      cogs,
      grossProfit,
      opex,
      operatingIncome,
      interest,
      tax,
      netIncome,
    },
  };
}
