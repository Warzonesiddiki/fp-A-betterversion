// =============================================================================
// REPORT DATA BUILDER — real-data report rows for ReportBookEngine
// -----------------------------------------------------------------------------
// Replaces the previous hardcoded "mock" report rows ('Revenue 1,250,000 …')
// with rows computed from actual GL entries + budget line items. Statement
// figures delegate to the SAME canonical computations as the live statement
// pages (Phase 2 contract, docs/product/STATEMENT_SIGN_CONTRACT.md):
// computeProfitLoss / computeBalanceSheet classify by account type with the
// documented prefix fallback, sign naturally and never absolutise, so an
// exported statement can never disagree with its screen (ZC-07). Sub-account
// layout lines (cash 11, capex 15, debt 22, dividends 31) keep the two-digit
// layout convention of the cash-flow page. Exact decimals via @/utils/money.
//
// When no data exists for an entity the builder returns an explicit, honest
// "no data" row set (zeros + footer) — never fabricated figures.
// =============================================================================

import type { ExportData } from './ExportEngine';
import { computeProfitLoss } from '@/pages/reports/profitLossData';
import { computeBalanceSheet } from '@/pages/reports/balanceSheetData';
import {
  entriesForClass,
  signedClassAmount,
  type AccountClass,
} from '@/utils/accountClassification';
import type { AccountType } from '@/types';
import {
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
  toDecimal,
  type MoneyInput,
  addMoney,
} from '@/utils/money';

// ---------------------------------------------------------------------------
// Input shapes (structural — accept the live store types)
// ---------------------------------------------------------------------------

export interface GlLikeEntry {
  readonly accountId?: string;
  readonly accountCode?: string;
  readonly accountName?: string;
  readonly accountType?: AccountType | 'Unknown' | null;
  readonly debit: MoneyInput;
  readonly credit: MoneyInput;
  readonly period?: string;
  readonly date: string;
  readonly description?: string;
  readonly entityId?: string;
}

export interface BudgetLikeItem {
  readonly accountCode: string;
  readonly accountName?: string;
  readonly amount: MoneyInput;
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

/* Phase 2: the old `sumAbs` magnitude helper was deleted — statement sums
   are signed through `classTotal`; absolutising an expense is F-P2-02. */

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

/** Signed canonical class total (Phase 2 resolver; never absolutised). */
function classTotal(entries: readonly GlLikeEntry[], cls: AccountClass): number {
  return roundTo(sumMoney(entriesForClass(entries, cls).map((e) => signedClassAmount(e, cls))), 2);
}

// ---------------------------------------------------------------------------
// P&L (preset-pl) — mirrors ProfitLossPage.computeProfitLoss + budget variance
// ---------------------------------------------------------------------------

export function buildPnlRows(input: ReportDataInput): ExportData {
  const { entries, budgetItems = [], entityName, currency, periodLabel } = input;

  const revenue = classTotal(entries, 'revenue');
  const cogs = classTotal(entries, 'cogs');
  const opex = classTotal(entries, 'opex');
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

  // Canonical balance sheet: closing equity includes current-period
  // earnings and the balance check is exact (no tolerance window), so the
  // exported sheet articulates with the live Balance Sheet page.
  const sheet = computeBalanceSheet(entries);
  const assets = sheet.totalAssets;
  const liabilities = sheet.totalLiabilities;
  const equity = sheet.totalEquity;
  const totalLiabilityEquity = sheet.totalLiabilitiesAndEquity;
  const diff = sheet.diff;
  const isBalanced = sheet.isBalanced;

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

  // Canonical P&L net income (includes interest/tax, signed) — the export
  // articulates with both the P&L and Cash Flow pages.
  const netIncome = computeProfitLoss(entries).netIncome;

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
    // Exact decimal accumulation — `amount` is a MoneyInput after Q5 stage 4.
    budgetMap.set(b.accountCode, roundTo(addMoney(budgetMap.get(b.accountCode) ?? 0, b.amount)));
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
