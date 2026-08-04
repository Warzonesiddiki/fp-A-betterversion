import type { GLState, BudgetState } from '@/types';
import {
  compareMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
} from '@/utils/money';

// ─── Context-aware suggestion map ───────────────────────────────────────────

export interface PageContext {
  label: string;
  suggestions: string[];
  alertThreshold: number;
}

export const PAGE_CONTEXTS: Record<string, PageContext> = {
  '/dashboard': {
    label: 'Dashboard',
    suggestions: [
      'Show me a revenue vs expense summary',
      'What are the top 5 variance items this period?',
      'Generate a quick P&L overview',
    ],
    alertThreshold: 0.1,
  },
  '/budgets': {
    label: 'Budgets',
    suggestions: [
      'Suggest a budget allocation formula',
      'Show budget utilization by department',
      'What is the remaining budget headroom?',
    ],
    alertThreshold: 0.1,
  },
  '/budgets/bva': {
    label: 'Budget vs Actuals',
    suggestions: [
      'Which line items have the largest variance?',
      'Show variance percentage by category',
      'Explain the unfavorable variance in OpEx',
    ],
    alertThreshold: 0.1,
  },
  '/forecasts': {
    label: 'Forecasts',
    suggestions: [
      'Suggest a growth rate formula for next quarter',
      'Show forecast confidence intervals',
      'What assumptions drive this forecast?',
    ],
    alertThreshold: 0.15,
  },
  '/variance': {
    label: 'Variance Analysis',
    suggestions: [
      'Show all variances above 10%',
      'Explain the variance formula being used',
      'Compare favorable vs unfavorable totals',
    ],
    alertThreshold: 0.1,
  },
  '/reports': {
    label: 'Reports',
    suggestions: [
      'Help me build a custom report formula',
      'Summarize key metrics for this report',
      'Suggest chart types for this data',
    ],
    alertThreshold: 0.1,
  },
  '/analytics': {
    label: 'Analytics',
    suggestions: [
      'What trends do you see in this data?',
      'Suggest a CAGR calculation',
      'Show YoY growth analysis',
    ],
    alertThreshold: 0.12,
  },
  '/scenarios': {
    label: 'Scenarios',
    suggestions: [
      'What if revenue drops 15%?',
      'Show best/worst/base case comparison',
      'Suggest NPV for this scenario',
    ],
    alertThreshold: 0.15,
  },
};

export const DEFAULT_CONTEXT: PageContext = {
  label: 'General',
  suggestions: [
    'Help me write a financial formula',
    'Explain how variance percentage works',
    'What can you help me with?',
  ],
  alertThreshold: 0.1,
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  chartType?: string;
  formula?: string;
}

export interface CopilotAlert {
  id: string;
  type: 'variance' | 'budget' | 'forecast' | 'info';
  severity: 'high' | 'medium' | 'low';
  message: string;
  detail: string;
  metric?: string;
  value?: number;
  threshold?: number;
}

export interface CopilotSidebarProps {
  gl?: GLState;
  budget?: BudgetState;
  className?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

let msgCounter = 0;
export function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${++msgCounter}`;
}

export function getContextForPath(pathname: string): PageContext {
  const exact = PAGE_CONTEXTS[pathname];
  if (exact) return exact;
  const prefix = Object.keys(PAGE_CONTEXTS).find((k) => k !== '/' && pathname.startsWith(k));
  return prefix ? PAGE_CONTEXTS[prefix]! : DEFAULT_CONTEXT;
}

/**
 * GAP-1 (F-0006): compact display helper for currency totals shown as "$Nk"
 * in the copilot quick stats. GL debit/credit amounts are aggregated with
 * the money primitive (no float drift) and converted to thousands of dollars
 * with exact decimal division, rounded half-up at the display boundary.
 * Display only — never used for financial truth.
 */
export function compactThousandsMoney(total: ReturnType<typeof sumMoney>): string {
  return `$${roundTo(divideMoney(total, 1000), 0)}K`;
}

export function generateAlerts(
  gl?: GLState,
  budget?: BudgetState,
  threshold = 0.1
): CopilotAlert[] {
  const alerts: CopilotAlert[] = [];

  if (budget?.budgets) {
    const inReview = budget.budgets.filter((b) => b.status === 'InReview');
    if (inReview.length > 0) {
      alerts.push({
        id: 'budget-pending',
        type: 'budget',
        severity: 'medium',
        message: `${inReview.length} budget(s) awaiting approval`,
        detail: 'InReview budgets need action before period close',
        metric: 'Budgets',
      });
    }

    const draft = budget.budgets.filter((b) => b.status === 'Draft');
    if (draft.length > 0) {
      alerts.push({
        id: 'budget-draft',
        type: 'budget',
        severity: 'low',
        message: `${draft.length} draft budget(s) not yet submitted`,
        detail: 'Complete and submit for review',
        metric: 'Budgets',
      });
    }
  }

  if (gl?.entries) {
    // GAP-1 (F-0006): GL debit/credit totals drive alert LOGIC (not just
    // display), so they run on the money primitive — previously raw float
    // `reduce +`, `-`, and `totalRevenue * threshold` over IEEE-754 doubles.
    // Float drift could flip the expense-exceeds comparison at equal sums
    // (0.1 + 0.2 = 0.30000000000000004 > 0.3) and could drop an expense
    // sitting exactly on the threshold (0.24 > 2.4 * 0.1 =
    // 0.24000000000000002 was false). Decimals compare exact cent values.
    const totalRevenue = sumMoney(gl.entries.map((e) => e.credit));
    const totalExpense = sumMoney(gl.entries.map((e) => e.debit));

    if (compareMoney(totalExpense, totalRevenue) > 0 && compareMoney(totalRevenue, 0) > 0) {
      const net = subtractMoney(totalRevenue, totalExpense);
      alerts.push({
        id: 'expense-exceeds',
        type: 'forecast',
        severity: 'high',
        message: 'Expenses exceed revenue in current period',
        // Negative half-dollars at the K boundary now round half-up away from
        // zero (−0.5 → −1); the old Math.round-style toFixed(0) yielded −0.
        detail: `Net: ${compactThousandsMoney(net)} — action needed`,
        metric: 'Net Income',
        value: roundTo(net),
      });
    }

    if (compareMoney(totalRevenue, 0) > 0) {
      const limit = multiplyMoney(totalRevenue, threshold);
      const largeEntries = gl.entries.filter(
        (e) => compareMoney(e.amount, limit) > 0 && compareMoney(e.debit, 0) > 0
      );
      if (largeEntries.length > 0) {
        alerts.push({
          id: 'large-entries',
          type: 'variance',
          severity: 'medium',
          message: `${largeEntries.length} expense(s) exceed ${threshold * 100}% of revenue`,
          detail: 'Review for budget alignment',
          metric: 'Expenses',
          value: largeEntries.length,
          threshold,
        });
      }
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      type: 'info',
      severity: 'low',
      message: 'No critical alerts',
      detail: 'All metrics are within expected ranges',
    });
  }

  return alerts;
}
