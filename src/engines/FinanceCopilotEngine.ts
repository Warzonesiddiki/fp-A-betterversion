/**
 * FinanceCopilotEngine — AI copilot for financial analysis
 * Answers natural language questions about financial data
 */

import type { GLState, BudgetState } from '@/types';

interface CopilotQuestion {
  question: string;
  context: 'budget' | 'forecast' | 'actual' | 'variance' | 'general';
  entity?: string;
  period?: string;
}

interface CopilotAnswer {
  answer: string;
  confidence: number;
  data?: unknown;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
  sources: string[];
}

export class FinanceCopilotEngine {
  /**
   * Answer a natural language financial question
   */
  static answer(question: string, stores: { gl?: GLState; budget?: BudgetState }): CopilotAnswer {
    const q = question.toLowerCase();

    // Revenue questions
    if (q.includes('revenue') || q.includes('sales')) {
      return this.answerRevenue(question, stores);
    }

    // Expense questions
    if (q.includes('expense') || q.includes('cost') || q.includes('spend')) {
      return this.answerExpense(question, stores);
    }

    // Variance questions
    if (q.includes('variance') || q.includes('difference') || q.includes('vs')) {
      return this.answerVariance(question, stores);
    }

    // Budget questions
    if (q.includes('budget') || q.includes('plan') || q.includes('forecast')) {
      return this.answerBudget(question, stores);
    }

    return {
      answer:
        'I can help with revenue, expenses, variance, and budget questions. Try asking about specific metrics.',
      confidence: 0.5,
      sources: [],
    };
  }

  private static answerRevenue(q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries?.filter((e) => e.credit > 0) ?? [];
    const total = entries.reduce((sum, e) => sum + e.amount, 0);

    return {
      answer: `Total revenue: $${(total / 1000).toFixed(0)}K across ${entries.length} entries.`,
      confidence: 0.9,
      data: { total, count: entries.length },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  private static answerExpense(q: string, stores: { gl?: GLState }): CopilotAnswer {
    const entries = stores.gl?.entries?.filter((e) => e.debit > 0) ?? [];
    const total = entries.reduce((sum, e) => sum + e.amount, 0);

    return {
      answer: `Total expenses: $${(total / 1000).toFixed(0)}K across ${entries.length} entries.`,
      confidence: 0.9,
      data: { total, count: entries.length },
      chartType: 'bar',
      sources: ['GL Entries'],
    };
  }

  private static answerVariance(
    q: string,
    stores: { gl?: GLState; budget?: BudgetState }
  ): CopilotAnswer {
    return {
      answer:
        'Variance analysis compares actual vs budget. Positive = favorable for revenue, unfavorable for expenses.',
      confidence: 0.7,
      sources: ['GL Entries', 'Budget Store'],
    };
  }

  private static answerBudget(q: string, stores: { budget?: BudgetState }): CopilotAnswer {
    const budgets = stores.budget?.budgets ?? [];
    return {
      answer: `${budgets.length} budgets loaded. Status: ${budgets.map((b) => b.status).join(', ')}.`,
      confidence: 0.8,
      data: { count: budgets.length },
      sources: ['Budget Store'],
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
    if (q.includes('breakdown') || q.includes('by category')) {
      return { type: 'pie', config: { nameKey: 'category', valueKey: 'value' } };
    }
    if (q.includes('compare') || q.includes('vs')) {
      return { type: 'bar', config: { xAxis: 'name', yAxis: ['actual', 'budget'] } };
    }

    return null;
  }
}
