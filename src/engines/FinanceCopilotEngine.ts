/**
 * FinanceCopilotEngine — AI copilot for financial analysis
 * Answers natural language questions about financial data
 *
 * Enhanced: margin, cash, burn rate, top expenses, period comparison,
 * variance calculation, department breakdown, budget utilization.
 *
 * MONEY MIGRATION (2026-08-03, GAP-1 F-0006): All currency-bearing values
 * (revenue, cogs, opex, cash, expenses, netIncome, budget totals, variances,
 * burn/runway etc.) now use the canonical money primitive
 * (src/utils/money.ts / ../utils/money, decimal.js, ROUND_HALF_UP).
 * Raw + - * / on currency values eliminated. Ratios/percentages remain float.
 * Use greaterThan(0) for >0 guards on money. roundTo(x,2) for cents.
 */

import type { GLState, BudgetState } from '@/types';
import { useFinancialContextStore } from '@/store/financialContextStore';
import { currencySymbol } from '@/utils/financialFormatting';
import {
  addMoney,
  subtractMoney,
  divideMoney,
  sumMoney,
  roundTo,
  toDecimal,
  formatMoney,
} from '../utils/money';

interface CopilotAnswer {
  answer: string;
  confidence: number;
  data?: unknown;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  sources: string[];
}

// Revenue account codes typically start with 4xxx or 5xxx
const REVENUE_CODES = /^(4\d{3}|5\d{3})/;
// COGS account codes typically start with 5xxx
const COGS_CODES = /^5\d{3}/;
// Expense account codes typically start with 6xxx
const EXPENSE_CODES = /^6\d{3}/;
// Cash account codes typically start with 10xx
const CASH_CODES = /^10\d{2}/;

/**
 * Abbreviated money for copilot narration.
 *
 * This engine runs outside React, so it cannot use `useCurrencyFormatter()`.
 * It reads the reporting currency non-reactively via `getState()` — engine
 * output is generated on demand, so there is nothing to re-render. Display
 * only: the symbol changes, the amount is never converted.
 */
function formatCurrency(amount: number): string {
  const symbol = currencySymbol(useFinancialContextStore.getState().context.currency.code);
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `${symbol}${formatMoney(amount / 1_000_000, { places: 1 })}M`;
  if (abs >= 1_000) return `${symbol}${formatMoney(amount / 1_000, { places: 0 })}K`;
  return `${symbol}${formatMoney(amount, { places: 0 })}`;
}

function formatPct(value: number): string {
  return `${formatMoney(value * 100, { places: 1 })}%`;
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    if (!result[k]) result[k] = [];
    result[k]!.push(item);
  }
  return result;
}

function topN(items: Array<{ label: string; value: number }>, n: number): string {
  return items
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .map((item) => `${item.label}: ${formatCurrency(item.value)}`)
    .join(', ');
}

export class FinanceCopilotEngine {
  /**
   * Answer a natural language financial question
   */
  static answer(question: string, stores: { gl?: GLState; budget?: BudgetState }): CopilotAnswer {
    const q = question.toLowerCase();

    // Margin questions (check before revenue/expense to catch "gross margin" etc.)
    if (q.includes('margin') || q.includes('profitability')) {
      return this.answerMargin(question, stores);
    }

    // Cash questions
    if (
      q.includes('cash') &&
      (q.includes('position') || q.includes('balance') || q.includes('on hand'))
    ) {
      return this.answerCashPosition(question, stores);
    }

    // Burn rate
    if (q.includes('burn rate') || q.includes('burn') || q.includes('runway')) {
      return this.answerBurnRate(question, stores);
    }

    // Top expenses
    if (
      (q.includes('top') || q.includes('largest') || q.includes('biggest')) &&
      (q.includes('expense') || q.includes('cost') || q.includes('spend'))
    ) {
      return this.answerTopExpenses(question, stores);
    }

    // Department breakdown
    if (q.includes('department') || q.includes('by department') || q.includes('dept')) {
      return this.answerByDepartment(question, stores);
    }

    // Period comparison
    if (
      q.includes('compare') ||
      q.includes('vs') ||
      q.includes('versus') ||
      q.includes('q1 vs') ||
      q.includes('q2 vs') ||
      q.includes('q3 vs') ||
      q.includes('q4 vs') ||
      q.includes('last month') ||
      q.includes('last quarter') ||
      q.includes('yoy') ||
      q.includes('year over year')
    ) {
      return this.answerPeriodComparison(question, stores);
    }

    // Variance questions (check before generic revenue/expense)
    if (
      q.includes('variance') ||
      q.includes('difference') ||
      q.includes('over budget') ||
      q.includes('under budget')
    ) {
      return this.answerVariance(question, stores);
    }

    // Budget utilization
    if (
      q.includes('utilization') ||
      q.includes('remaining') ||
      q.includes('headroom') ||
      q.includes('used') ||
      q.includes('left')
    ) {
      return this.answerBudgetUtilization(question, stores);
    }

    // Net income (check before revenue/expense to catch "net income" etc.)
    if (
      q.includes('net income') ||
      q.includes('net profit') ||
      q.includes('bottom line') ||
      q.includes('net loss')
    ) {
      return this.answerNetIncome(question, stores);
    }

    // Revenue questions
    if (q.includes('revenue') || q.includes('sales') || q.includes('income')) {
      return this.answerRevenue(question, stores);
    }

    // Expense questions
    if (
      q.includes('expense') ||
      q.includes('cost') ||
      q.includes('spend') ||
      q.includes('outgoing')
    ) {
      return this.answerExpense(question, stores);
    }

    // Budget questions
    if (q.includes('budget') || q.includes('plan') || q.includes('forecast')) {
      return this.answerBudget(question, stores);
    }

    return {
      answer:
        'I can help with revenue, expenses, margin, cash position, burn rate, variance, budget utilization, and period comparisons. Try asking about specific metrics.',
      confidence: 0.5,
      sources: [],
    };
  }

  // ─── Margin ──────────────────────────────────────────────────────────────

  private static answerMargin(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to analyze margins.',
        confidence: 0.9,
        sources: [],
      };
    }

    const revenueEntries = entries.filter((e) => REVENUE_CODES.test(e.accountCode));
    const revenue = roundTo(sumMoney(revenueEntries.map((e) => e.credit)));

    const cogsEntries = entries.filter((e) => COGS_CODES.test(e.accountCode));
    const cogs = roundTo(sumMoney(cogsEntries.map((e) => e.debit)));

    const opexEntries = entries.filter((e) => EXPENSE_CODES.test(e.accountCode));
    const opex = roundTo(sumMoney(opexEntries.map((e) => e.debit)));

    const grossProfit = subtractMoney(revenue, cogs);
    const grossMargin = toDecimal(revenue).greaterThan(0)
      ? divideMoney(grossProfit, revenue).toNumber()
      : 0;

    const netProfit = subtractMoney(grossProfit, opex);
    const netMargin = toDecimal(revenue).greaterThan(0)
      ? divideMoney(netProfit, revenue).toNumber()
      : 0;

    const parts = [
      `Gross margin: ${formatPct(grossMargin)} (${formatCurrency(grossProfit.toNumber())} on ${formatCurrency(revenue)} revenue)`,
    ];

    if (toDecimal(opex).greaterThan(0)) {
      parts.push(
        `Net margin: ${formatPct(netMargin)} (${formatCurrency(netProfit.toNumber())} after OpEx)`
      );
    }

    return {
      answer: parts.join('. ') + '.',
      confidence: 0.9,
      data: { revenue, cogs, opex, grossMargin, netMargin },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  // ─── Cash Position ───────────────────────────────────────────────────────

  private static answerCashPosition(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to check cash position.',
        confidence: 0.9,
        sources: [],
      };
    }

    const cashEntries = entries.filter((e) => CASH_CODES.test(e.accountCode));
    let cashBal = toDecimal(0);
    for (const e of cashEntries) {
      cashBal = addMoney(cashBal, e.credit);
      cashBal = subtractMoney(cashBal, e.debit);
    }
    const cashBalance = roundTo(cashBal);

    return {
      answer: `Cash position: ${formatCurrency(cashBalance)} across ${cashEntries.length} entries.`,
      confidence: 0.9,
      data: { cashBalance, entryCount: cashEntries.length },
      sources: ['GL Entries'],
    };
  }

  // ─── Burn Rate ───────────────────────────────────────────────────────────

  private static answerBurnRate(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to calculate burn rate.',
        confidence: 0.9,
        sources: [],
      };
    }

    const expenseEntries = entries.filter((e) => toDecimal(e.debit).greaterThan(0));
    const totalExpenses = roundTo(sumMoney(expenseEntries.map((e) => e.debit)));

    // Find unique periods to calculate monthly average
    const periods = [...new Set(entries.map((e) => e.period))].sort();
    const monthCount = Math.max(periods.length, 1);
    const monthlyBurn = roundTo(divideMoney(totalExpenses, monthCount));

    // Cash for runway calculation
    const cashEntries = entries.filter((e) => CASH_CODES.test(e.accountCode));
    let cashBal = toDecimal(0);
    for (const e of cashEntries) {
      cashBal = addMoney(cashBal, e.credit);
      cashBal = subtractMoney(cashBal, e.debit);
    }
    const cashBalance = roundTo(cashBal);
    const runwayMonths = toDecimal(monthlyBurn).greaterThan(0)
      ? divideMoney(cashBalance, monthlyBurn).toNumber()
      : Infinity;

    const parts = [
      `Monthly burn rate: ${formatCurrency(monthlyBurn)}`,
      `Based on ${monthCount} period(s) of data`,
    ];

    if (toDecimal(cashBalance).greaterThan(0) && runwayMonths < Infinity) {
      parts.push(
        `Runway: ${formatMoney(runwayMonths, { places: 1 })} months at current spend (${formatCurrency(cashBalance)} cash)`
      );
    }

    return {
      answer: parts.join('. ') + '.',
      confidence: 0.8,
      data: { monthlyBurn, monthCount, cashBalance, runwayMonths },
      sources: ['GL Entries'],
    };
  }

  // ─── Top Expenses ────────────────────────────────────────────────────────

  private static answerTopExpenses(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to analyze expenses.',
        confidence: 0.9,
        sources: [],
      };
    }

    const expenseEntries = entries.filter((e) => toDecimal(e.debit).greaterThan(0));
    if (expenseEntries.length === 0) {
      return {
        answer: 'No expense entries found in GL data.',
        confidence: 0.9,
        sources: ['GL Entries'],
      };
    }

    // Group by account and sum
    const byAccount = groupBy(expenseEntries, (e) => e.accountName || e.accountCode);
    const rankedRaw = Object.entries(byAccount).map(([name, items]) => ({
      label: name,
      value: roundTo(sumMoney(items.map((e) => e.debit))),
    }));
    const ranked = [...rankedRaw].sort((a, b) => b.value - a.value);

    const total = roundTo(sumMoney(ranked.map((r) => r.value)));
    const top5 = ranked.slice(0, 5);

    const lines = top5.map(
      (r, i) =>
        `${i + 1}. ${r.label}: ${formatCurrency(r.value)} (${formatPct(r.value / total)} of total)`
    );

    return {
      answer: `Top 5 expenses (${formatCurrency(total)} total):\n${lines.join('\n')}`,
      confidence: 0.9,
      data: { total, top5: ranked },
      chartType: 'pie',
      sources: ['GL Entries'],
    };
  }

  // ─── Department Breakdown ────────────────────────────────────────────────

  private static answerByDepartment(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to analyze by department.',
        confidence: 0.9,
        sources: [],
      };
    }

    const withDept = entries.filter((e) => e.department || e.departmentId);
    if (withDept.length === 0) {
      return {
        answer: 'No department data found in GL entries. Check your import mapping.',
        confidence: 0.8,
        sources: ['GL Entries'],
      };
    }

    const byDept = groupBy(withDept, (e) => e.department || e.departmentId || 'Unknown');
    const deptSummaryRaw = Object.entries(byDept).map(([dept, items]) => {
      let net = toDecimal(0);
      for (const e of items) {
        net = addMoney(net, e.credit);
        net = subtractMoney(net, e.debit);
      }
      return { label: dept, value: roundTo(net) };
    });
    const deptSummary = [...deptSummaryRaw].sort((a, b) => b.value - a.value);

    const lines = deptSummary.map((d) => `${d.label}: ${formatCurrency(d.value)} net`);

    return {
      answer: `Department breakdown (${withDept.length} entries with dept data):\n${lines.join('\n')}`,
      confidence: 0.8,
      data: { departments: deptSummary },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  // ─── Period Comparison ───────────────────────────────────────────────────

  private static answerPeriodComparison(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to compare periods.',
        confidence: 0.9,
        sources: [],
      };
    }

    const periods = [...new Set(entries.map((e) => e.period))].sort();
    if (periods.length < 2) {
      return {
        answer: `Only ${periods.length} period(s) available. Need at least 2 for comparison.`,
        confidence: 0.9,
        sources: ['GL Entries'],
      };
    }

    const lastPeriod = periods[periods.length - 1]!;
    const prevPeriod = periods[periods.length - 2]!;

    const lastEntries = entries.filter((e) => e.period === lastPeriod);
    const prevEntries = entries.filter((e) => e.period === prevPeriod);

    const lastRevenue = roundTo(sumMoney(lastEntries.map((e) => e.credit)));
    const prevRevenue = roundTo(sumMoney(prevEntries.map((e) => e.credit)));

    const lastExpense = roundTo(sumMoney(lastEntries.map((e) => e.debit)));
    const prevExpense = roundTo(sumMoney(prevEntries.map((e) => e.debit)));

    const revenueChange = toDecimal(prevRevenue).greaterThan(0)
      ? divideMoney(subtractMoney(lastRevenue, prevRevenue), prevRevenue).toNumber()
      : 0;
    const expenseChange = toDecimal(prevExpense).greaterThan(0)
      ? divideMoney(subtractMoney(lastExpense, prevExpense), prevExpense).toNumber()
      : 0;

    const parts = [
      `Comparing ${lastPeriod} vs ${prevPeriod}:`,
      `Revenue: ${formatCurrency(lastRevenue)} (${revenueChange >= 0 ? '+' : ''}${formatPct(revenueChange)})`,
      `Expenses: ${formatCurrency(lastExpense)} (${expenseChange >= 0 ? '+' : ''}${formatPct(expenseChange)})`,
    ];

    return {
      answer: parts.join('\n'),
      confidence: 0.85,
      data: {
        lastPeriod,
        prevPeriod,
        lastRevenue,
        prevRevenue,
        lastExpense,
        prevExpense,
        revenueChange,
        expenseChange,
      },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  // ─── Variance (with actual calculation) ──────────────────────────────────

  private static answerVariance(
    _q: string,
    stores: { gl?: GLState; budget?: BudgetState }
  ): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    const lineItems = stores.budget?.lineItems ?? [];

    if (entries.length === 0 && lineItems.length === 0) {
      return {
        answer: 'No GL or budget data loaded. Import data to calculate variance.',
        confidence: 0.9,
        sources: [],
      };
    }

    // If we have both GL and budget data, calculate actual variance
    if (entries.length > 0 && lineItems.length > 0) {
      const budgetByAccount = new Map<string, number>();
      for (const item of lineItems) {
        const current = budgetByAccount.get(item.accountId) ?? 0;
        budgetByAccount.set(item.accountId, roundTo(addMoney(current, item.amount)));
      }

      const actualByAccount = new Map<string, number>();
      for (const entry of entries) {
        const current = actualByAccount.get(entry.accountId) ?? 0;
        actualByAccount.set(entry.accountId, roundTo(addMoney(current, entry.netChange)));
      }

      const variances: Array<{
        account: string;
        actual: number;
        budget: number;
        variance: number;
        pct: number;
      }> = [];

      for (const [accountId, budgetAmount] of budgetByAccount) {
        const actualAmount = actualByAccount.get(accountId) ?? 0;
        const variance = roundTo(subtractMoney(actualAmount, budgetAmount));
        const pct = toDecimal(budgetAmount).greaterThan(0)
          ? divideMoney(variance, budgetAmount).toNumber()
          : 0;
        const accountName =
          lineItems.find((i) => i.accountId === accountId)?.accountName ?? accountId;
        variances.push({
          account: accountName,
          actual: actualAmount,
          budget: budgetAmount,
          variance,
          pct,
        });
      }

      const unfavorable = variances.filter((v) => Math.abs(v.pct) > 0.1);

      const parts = [`Variance analysis (${variances.length} accounts):`];

      if (unfavorable.length > 0) {
        parts.push(`Material variances (>10%): ${unfavorable.length}`);
        const top3 = unfavorable.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 3);
        for (const v of top3) {
          const dir = v.variance > 0 ? 'over' : 'under';
          parts.push(
            `  • ${v.account}: ${formatCurrency(Math.abs(v.variance))} ${dir} budget (${formatPct(Math.abs(v.pct))})`
          );
        }
      } else {
        parts.push('All accounts within 10% of budget.');
      }

      return {
        answer: parts.join('\n'),
        confidence: 0.85,
        data: { variances, unfavorableCount: unfavorable.length },
        chartType: 'bar',
        sources: ['GL Entries', 'Budget Line Items'],
      };
    }

    // Fallback to static explanation
    return {
      answer:
        'Variance analysis compares actual vs budget. Positive = favorable for revenue, unfavorable for expenses. Import both GL and budget data for detailed variance.',
      confidence: 0.7,
      sources: ['GL Entries', 'Budget Store'],
    };
  }

  // ─── Budget Utilization ──────────────────────────────────────────────────

  private static answerBudgetUtilization(
    _q: string,
    stores: { gl?: GLState; budget?: BudgetState }
  ): CopilotAnswer {
    const lineItems = stores.budget?.lineItems ?? [];
    const budgets = stores.budget?.budgets ?? [];

    if (budgets.length === 0) {
      return {
        answer: 'No budgets loaded. Create a budget to check utilization.',
        confidence: 0.9,
        sources: [],
      };
    }

    const totalBudget = roundTo(sumMoney(budgets.map((b) => b.totalAmount)));
    const activeBudgets = budgets.filter((b) => b.status === 'Draft' || b.status === 'InReview');

    const parts = [
      `${budgets.length} budget(s) loaded, ${activeBudgets.length} active`,
      `Total budget: ${formatCurrency(totalBudget)}`,
    ];

    if (lineItems.length > 0) {
      const budgetByAccount = new Map<string, number>();
      for (const item of lineItems) {
        const current = budgetByAccount.get(item.accountId) ?? 0;
        budgetByAccount.set(item.accountId, roundTo(addMoney(current, item.amount)));
      }

      const totalLineItems = roundTo(sumMoney(lineItems.map((i) => i.amount)));
      parts.push(`${lineItems.length} line items totaling ${formatCurrency(totalLineItems)}`);
    }

    return {
      answer: parts.join('. ') + '.',
      confidence: 0.8,
      data: { budgetCount: budgets.length, totalBudget, lineItemCount: lineItems.length },
      sources: ['Budget Store'],
    };
  }

  // ─── Revenue (enhanced) ──────────────────────────────────────────────────

  private static answerRevenue(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to analyze revenue.',
        confidence: 0.9,
        sources: [],
      };
    }

    const revenueEntries = entries.filter(
      (e) => REVENUE_CODES.test(e.accountCode) || toDecimal(e.credit).greaterThan(0)
    );
    const total = roundTo(sumMoney(revenueEntries.map((e) => e.credit)));

    // Breakdown by account if available
    const byAccount = groupBy(revenueEntries, (e) => e.accountName || e.accountCode);
    const rankedRaw = Object.entries(byAccount).map(([name, items]) => ({
      label: name,
      value: roundTo(sumMoney(items.map((e) => e.credit))),
    }));
    const ranked = [...rankedRaw].sort((a, b) => b.value - a.value);

    const parts = [
      `Total revenue: ${formatCurrency(total)} across ${revenueEntries.length} entries.`,
    ];

    if (ranked.length > 1) {
      const top3 = ranked.slice(0, 3);
      parts.push(`Top sources: ${topN(top3, 3)}`);
    }

    return {
      answer: parts.join(' '),
      confidence: 0.9,
      data: { total, count: revenueEntries.length, breakdown: ranked },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  // ─── Expense (enhanced) ──────────────────────────────────────────────────

  private static answerExpense(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to analyze expenses.',
        confidence: 0.9,
        sources: [],
      };
    }

    const expenseEntries = entries.filter(
      (e) => EXPENSE_CODES.test(e.accountCode) || toDecimal(e.debit).greaterThan(0)
    );
    const total = roundTo(sumMoney(expenseEntries.map((e) => e.debit)));

    // Breakdown by account
    const byAccount = groupBy(expenseEntries, (e) => e.accountName || e.accountCode);
    const rankedRaw = Object.entries(byAccount).map(([name, items]) => ({
      label: name,
      value: roundTo(sumMoney(items.map((e) => e.debit))),
    }));
    const ranked = [...rankedRaw].sort((a, b) => b.value - a.value);

    const parts = [
      `Total expenses: ${formatCurrency(total)} across ${expenseEntries.length} entries.`,
    ];

    if (ranked.length > 1) {
      const top3 = ranked.slice(0, 3);
      parts.push(`Top categories: ${topN(top3, 3)}`);
    }

    return {
      answer: parts.join(' '),
      confidence: 0.9,
      data: { total, count: expenseEntries.length, breakdown: ranked },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  // ─── Budget ──────────────────────────────────────────────────────────────

  private static answerBudget(_q: string, stores: { budget?: BudgetState }): CopilotAnswer {
    const budgets = stores.budget?.budgets ?? [];
    if (budgets.length === 0) {
      return {
        answer: 'No budgets loaded. Create a budget to get started.',
        confidence: 0.9,
        sources: [],
      };
    }

    const byStatus = groupBy(budgets, (b) => b.status);
    const statusSummary = Object.entries(byStatus)
      .map(([status, items]) => `${items.length} ${status}`)
      .join(', ');

    const totalAmount = roundTo(sumMoney(budgets.map((b) => b.totalAmount)));

    return {
      answer: `${budgets.length} budget(s) loaded (${statusSummary}). Total: ${formatCurrency(totalAmount)}.`,
      confidence: 0.8,
      data: { count: budgets.length, totalAmount, byStatus },
      sources: ['Budget Store'],
    };
  }

  // ─── Net Income ──────────────────────────────────────────────────────────

  private static answerNetIncome(_q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries ?? [];
    if (entries.length === 0) {
      return {
        answer: 'No GL data loaded. Import data to calculate net income.',
        confidence: 0.9,
        sources: [],
      };
    }

    const totalCredit = roundTo(sumMoney(entries.map((e) => e.credit)));
    const totalDebit = roundTo(sumMoney(entries.map((e) => e.debit)));
    const netIncome = roundTo(subtractMoney(totalCredit, totalDebit));

    const label = toDecimal(netIncome).greaterThanOrEqualTo(0) ? 'Net income' : 'Net loss';

    return {
      answer: `${label}: ${formatCurrency(netIncome)} (${formatCurrency(totalCredit)} revenue - ${formatCurrency(totalDebit)} expenses).`,
      confidence: 0.9,
      data: { netIncome, totalCredit, totalDebit },
      sources: ['GL Entries'],
    };
  }

  /**
   * Generate chart suggestion from question
   */
  static suggestChart(question: string): { type: string; config: unknown } | null {
    const q = question.toLowerCase();

    if (q.includes('trend') || q.includes('over time')) {
      return { type: 'line', config: { xAxis: 'period', yAxis: 'value' } };
    }
    if (q.includes('breakdown') || q.includes('by category') || q.includes('by department')) {
      return { type: 'pie', config: { nameKey: 'category', valueKey: 'value' } };
    }
    if (q.includes('compare') || q.includes('vs')) {
      return { type: 'bar', config: { xAxis: 'name', yAxis: ['actual', 'budget'] } };
    }
    if (q.includes('margin') || q.includes('profitability')) {
      return { type: 'bar', config: { xAxis: 'metric', yAxis: 'value' } };
    }

    return null;
  }
}
