// =============================================================================
// REPORT DATA BUILDER — real-data report rows for ReportBookEngine
// -----------------------------------------------------------------------------
// Replaces the previous hardcoded "mock" report rows ('Revenue 1,250,000 …')
// with rows computed from actual GL entries + budget line items, using the
// SAME chart-of-accounts conventions and money primitives as the live
// statement pages (ProfitLossPage / BalanceSheetPage / CashFlowPage /
// BudgetVsActualPage): account-code prefixes 1=Assets 2=Liabilities 3=Equity
// 4=Revenue 5=COGS 6=Expenses; exact decimal arithmetic via @/utils/money.
//
// When no data exists for an entity the builder returns an explicit, honest
// "no data" row set (zeros + footer) — never fabricated figures.
// =============================================================================

import type { ExportData } from './ExportEngine';
import {
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
} from '@/utils/money';

// ---------------------------------------------------------------------------
// Input shapes (structural — accept the live store types)
// ---------------------------------------------------------------------------

export interface GlLikeEntry {
  readonly accountCode?: string;
  readonly accountName?: string;
  readonly debit: number;
  readonly credit: number;
  readonly period?: string;
  readonly date: string;
  readonly description?: string;
  readonly entityId?: string;
}

export interface BudgetLikeItem {
  readonly accountCode: string;
  readonly accountName?: string;
  readonly amount: number;
  readonly entityId?: string;
}

export interface ReportDataInput {
  /** GL entries (pre-filtered by entity when the caller has entity scoping). */
  readonly entries: readonly GlLikeEntry[];
  /** Budget line items (pre-filtered by entity when applicable). */
  readonly budgetItems?: readonly BudgetLikeItem[];
  readonly entityName: string;
  readonly currency: string;
  readonly periodLabel: string;
}

// ---------------------------------------------------------------------------
// Helpers — money-exact sums by account-code prefix
// ---------------------------------------------------------------------------

/** Sum `debit − credit` for entries whose account code starts with any prefix. */
function sumDebit(entries: readonly GlLikeEntry[], prefixes: readonly string[]): number {
  const values = entries
    .filter((e) => prefixes.some((p) => (e.accountCode || '').startsWith(p)))
    .map((e) => subtractMoney(e.debit, e.credit));
  return roundTo(sumMoney(values), 2);
}

/** Sum `credit − debit` (liability/equity/revenue sign convention). */
function sumCredit(entries: readonly GlLikeEntry[], prefixes: readonly string[]): number {
  const values = entries
    .filter((e) => prefixes.some((p) => (e.accountCode || '').startsWith(p)))
    .map((e) => subtractMoney(e.credit, e.debit));
  return roundTo(sumMoney(values), 2);
}

/** Sum `|debit − credit|` (expense magnitude convention). */
function sumAbs(entries: readonly GlLikeEntry[], prefixes: readonly string[]): number {
  const values = entries
    .filter((e) => prefixes.some((p) => (e.accountCode || '').startsWith(p)))
    .map((e) => Math.abs(roundTo(subtractMoney(e.debit, e.credit), 2)));
  return roundTo(sumMoney(values), 2);
}

/** Sum budget amounts for the given account-code prefixes. */
function sumBudget(budgetItems: readonly BudgetLikeItem[], prefixes: readonly string[]): number {
  return roundTo(
    sumMoney(
      budgetItems
        .filter((b) => prefixes.some((p) => b.accountCode.startsWith(p)))
        .map((b) => b.amount)
    ),
    2
  );
}

/** Variance % (actual vs budget) — null-safe, money-exact. */
function variancePercent(actual: number, budget: number): number | null {
  if (budget === 0) return null;
  return roundTo(multiplyMoney(divideMoney(toDecimal(actual).minus(budget), budget), 100), 2);
}

function formatPct(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}

// ---------------------------------------------------------------------------
// P&L (preset-pl) — mirrors ProfitLossPage.computeProfitLoss + budget variance
// ---------------------------------------------------------------------------

export function buildPnlRows(input: ReportDataInput): ExportData {
  const { entries, budgetItems = [], entityName, currency, periodLabel } = input;

  const revenue = sumCredit(entries, ['4']);
  const cogs = sumAbs(entries, ['5']);
  const opex = sumAbs(entries, ['6']);
  const grossProfit = roundTo(subtractMoney(revenue, cogs), 2);
  const ebitda = roundTo(subtractMoney(grossProfit, opex), 2);

  const budgetRevenue = sumBudget(budgetItems, ['4']);
  const budgetCogs = sumBudget(budgetItems, ['5']);
  const budgetOpex = sumBudget(budgetItems, ['6']);
  const budgetGrossProfit = roundTo(subtractMoney(budgetRevenue, budgetCogs), 2);
  const budgetEbitda = roundTo(subtractMoney(budgetGrossProfit, budgetOpex), 2);

  const line = (label: string, actual: number, budget: number): (string | number | null)[] => {
    const variance = roundTo(subtractMoney(actual, budget), 2);
    return [label, actual, budget, variance, formatPct(variancePercent(actual, budget))];
  };

  return {
    headers: ['Line Item', 'Actual', 'Budget', 'Variance', 'Var %'],
    rows: [
      [`${entityName} — Profit & Loss`, '', '', '', ''],
      line('Revenue', revenue, budgetRevenue),
      line('Cost of Goods Sold', cogs, budgetCogs),
      line('Gross Profit', grossProfit, budgetGrossProfit),
      line('Operating Expenses', opex, budgetOpex),
      line('EBITDA', ebitda, budgetEbitda),
    ],
    footers: [
      `${periodLabel} | ${currency} | Derived from GL trial balance + budget`,
      hasAnyData(entries, budgetItems)
        ? `${entries.length} GL entries · ${budgetItems.length} budget lines`
        : 'No GL or budget data imported — all figures are zero.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Balance Sheet (preset-bs) — mirrors BalanceSheetPage.computeBalanceSheet
// ---------------------------------------------------------------------------

export function buildBalanceSheetRows(input: ReportDataInput): ExportData {
  const { entries, entityName, currency, periodLabel } = input;

  const assets = sumDebit(entries, ['1']);
  const liabilities = sumCredit(entries, ['2']);
  const equity = sumCredit(entries, ['3']);
  const totalLiabilityEquity = roundTo(sumMoney([liabilities, equity]), 2);
  const diff = roundTo(subtractMoney(assets, totalLiabilityEquity), 2);
  const isBalanced = Math.abs(diff) < 0.01;

  return {
    headers: ['Line Item', 'Current Period', 'Prior Period', 'Change', 'Change %'],
    rows: [
      [`${entityName} — Balance Sheet`, '', '', '', ''],
      ['Total Assets', assets, 0, assets, formatPct(variancePercent(assets, 0))],
      [
        'Total Liabilities',
        liabilities,
        0,
        liabilities,
        formatPct(variancePercent(liabilities, 0)),
      ],
      ['Total Equity', equity, 0, equity, formatPct(variancePercent(equity, 0))],
      [
        'Total Liabilities + Equity',
        totalLiabilityEquity,
        0,
        totalLiabilityEquity,
        formatPct(variancePercent(totalLiabilityEquity, 0)),
      ],
      [isBalanced ? 'A = L + E ✓' : 'A = L + E ✗', diff, '', '', ''],
    ],
    footers: [
      `${periodLabel} | ${currency} | Derived from GL trial balance`,
      hasAnyData(entries, [])
        ? `Balanced: ${isBalanced ? 'yes' : `no (diff ${diff})`}`
        : 'No GL data imported — all figures are zero.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Cash Flow (preset-cf) — indirect method, mirrors CashFlowPage
// ---------------------------------------------------------------------------

export function buildCashFlowRows(input: ReportDataInput): ExportData {
  const { entries, entityName, currency, periodLabel } = input;
  const hasData = hasAnyData(entries, []);

  const netIncome = (() => {
    const rev = sumCredit(entries, ['4']);
    const exp = sumDebit(entries, ['5', '6']);
    return roundTo(subtractMoney(rev, exp), 2);
  })();

  const operating = netIncome;
  const capex = sumDebit(entries, ['15']);
  const investing = roundTo(multiplyMoney(capex, -1), 2);
  const debtChange = sumCredit(entries, ['22']);
  const dividends = sumDebit(entries, ['31']);
  const financing = roundTo(subtractMoney(debtChange, dividends), 2);
  const netChange = roundTo(sumMoney([operating, investing, financing]), 2);
  const endingCash = sumDebit(entries, ['11']);

  return {
    headers: ['Line Item', 'Actual', 'Budget', 'Variance'],
    rows: [
      [`${entityName} — Cash Flow (indirect)`, '', '', ''],
      ['Net Income', netIncome, '', ''],
      ['Operating Cash Flow', operating, '', ''],
      ['Capital Expenditure', capex, '', ''],
      ['Investing Cash Flow', investing, '', ''],
      ['Debt Financing', debtChange, '', ''],
      ['Dividends', dividends, '', ''],
      ['Financing Cash Flow', financing, '', ''],
      ['Net Change in Cash', netChange, '', ''],
      ['Ending Cash', endingCash, '', ''],
    ],
    footers: [
      `${periodLabel} | ${currency} | Simplified indirect method from GL trial balance`,
      hasData ? 'Derived from GL actuals.' : 'No GL data imported — all figures are zero.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Budget vs Actual (preset-bva) — mirrors BudgetVsActualPage (account level)
// ---------------------------------------------------------------------------

export function buildBudgetVsActualRows(input: ReportDataInput): ExportData {
  const { entries, budgetItems = [], entityName, periodLabel } = input;

  const budgetMap = new Map<string, number>();
  const accountNames = new Map<string, string>();
  for (const b of budgetItems) {
    budgetMap.set(b.accountCode, (budgetMap.get(b.accountCode) ?? 0) + b.amount);
    if (b.accountName) accountNames.set(b.accountCode, b.accountName);
  }

  const actualMap = new Map<string, number>();
  for (const e of entries) {
    const code = e.accountCode || '';
    if (!code) continue;
    const amount = Math.abs(roundTo(subtractMoney(e.debit, e.credit), 2));
    actualMap.set(code, roundTo(sumMoney([actualMap.get(code) ?? 0, amount]), 2));
    if (e.accountName) accountNames.set(code, e.accountName);
  }

  const allCodes = new Set([...budgetMap.keys(), ...actualMap.keys()]);
  const rows: (string | number | null)[][] = [
    [`${entityName} — Budget vs Actual`, '', '', '', '', ''],
  ];

  for (const code of allCodes) {
    const budget = budgetMap.get(code) ?? 0;
    const actual = actualMap.get(code) ?? 0;
    const variance = roundTo(subtractMoney(actual, budget), 2);
    const pct = variancePercent(actual, budget);
    const isRevenue = code.startsWith('4');
    const status =
      pct === null
        ? actual > 0
          ? 'Unbudgeted'
          : '—'
        : isRevenue
          ? variance >= 0
            ? 'Favorable'
            : 'Unfavorable'
          : variance <= 0
            ? 'Favorable'
            : 'Unfavorable';
    rows.push([
      accountNames.get(code) ?? `Account ${code}`,
      actual,
      budget,
      variance,
      formatPct(pct),
      status,
    ]);
  }

  return {
    headers: ['Account', 'Actual', 'Budget', 'Variance $', 'Variance %', 'Status'],
    rows,
    footers: [
      `${periodLabel} | ${entityName}`,
      hasAnyData(entries, budgetItems)
        ? `${allCodes.size} account(s) with budget or actual activity`
        : 'No GL or budget data imported — no rows.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Dispatch + empty-state
// ---------------------------------------------------------------------------

function hasAnyData(
  entries: readonly GlLikeEntry[],
  budgetItems: readonly BudgetLikeItem[]
): boolean {
  return entries.length > 0 || budgetItems.length > 0;
}

export type ReportPresetId = 'preset-pl' | 'preset-bs' | 'preset-cf' | 'preset-bva';

export function buildReportData(input: ReportDataInput, presetId: string): ExportData {
  switch (presetId) {
    case 'preset-pl':
      return buildPnlRows(input);
    case 'preset-bs':
      return buildBalanceSheetRows(input);
    case 'preset-cf':
      return buildCashFlowRows(input);
    case 'preset-bva':
      return buildBudgetVsActualRows(input);
    default:
      // Unknown/kpi/headcount presets have no GL-derived definition: return an
      // explicit no-data layout instead of fabricating figures.
      return {
        headers: ['Line Item', 'Value'],
        rows: [[`${input.entityName} — ${presetId}`, 'No data source defined']],
        footers: ['This template has no GL/budget mapping — configure a custom report instead.'],
      };
  }
}
