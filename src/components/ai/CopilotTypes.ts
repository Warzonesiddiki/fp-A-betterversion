import type { GLState, BudgetState } from '@/types';

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
  return prefix ? PAGE_CONTEXTS[prefix] : DEFAULT_CONTEXT;
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
    const totalRevenue = gl.entries.reduce((s, e) => s + e.credit, 0);
    const totalExpense = gl.entries.reduce((s, e) => s + e.debit, 0);

    if (totalExpense > totalRevenue && totalRevenue > 0) {
      alerts.push({
        id: 'expense-exceeds',
        type: 'forecast',
        severity: 'high',
        message: 'Expenses exceed revenue in current period',
        detail: `Net: $${((totalRevenue - totalExpense) / 1000).toFixed(0)}K — action needed`,
        metric: 'Net Income',
        value: totalRevenue - totalExpense,
      });
    }

    if (totalRevenue > 0) {
      const largeEntries = gl.entries.filter(
        (e) => e.amount > totalRevenue * threshold && e.debit > 0
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
