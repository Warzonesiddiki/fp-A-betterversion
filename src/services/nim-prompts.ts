/**
 * NIM Prompt Templates — Structured prompts for financial analysis via LLM.
 *
 * Each template produces a system + user message pair optimized for
 * financial reasoning with Llama 3.1 / Mistral models.
 *
 * Designed for: variance analysis, forecasting, formula explanation,
 * budget summaries, and natural language financial Q&A.
 */

export interface PromptTemplate {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}

export interface VarianceParams {
  metric: string;
  actual: number;
  budget: number;
  period: string;
  historical?: Array<{ period: string; actual: number; budget: number }>;
}

export interface ForecastParams {
  metric: string;
  historicalData: Array<{ period: string; value: number }>;
  forecastPeriods: number;
  assumptions?: string[];
}

export interface BudgetSummaryParams {
  name: string;
  totalRevenue: number;
  totalExpenses: number;
  lineItemCount: number;
  period: string;
  departments?: string[];
}

export interface FormulaExplanationParams {
  formula: string;
  context?: string;
  dataType?: 'revenue' | 'expense' | 'balance' | 'general';
}

export interface FinancialQAParams {
  question: string;
  context: {
    revenue?: number;
    expenses?: number;
    budget?: number;
    period?: string;
    previousPeriod?: { revenue?: number; expenses?: number };
  };
}

// ─── System Prompt ────────────────────────────────────────────────────────

const BASE_SYSTEM = `You are a senior FP&A analyst assistant embedded in FinPlan Pro, an offline-first financial planning tool.

Core rules:
- Use precise financial terminology
- Format numbers with commas and appropriate decimal places
- Flag material variances (>10%)
- Consider both favorable and unfavorable scenarios
- Reference period-over-period trends when relevant
- Be concise but thorough
- Always provide actionable recommendations
- Never fabricate data — if information is insufficient, say so`;

// ─── Variance Analysis ────────────────────────────────────────────────────

export function variancePrompt(params: VarianceParams): PromptTemplate {
  const variance = params.actual - params.budget;
  const variancePct = params.budget !== 0 ? (variance / params.budget) * 100 : 0;

  let historicalContext = '';
  if (params.historical && params.historical.length > 0) {
    historicalContext =
      '\nHistorical context:\n' +
      params.historical
        .map((h) => `  ${h.period}: actual=${h.actual}, budget=${h.budget}`)
        .join('\n');
  }

  return {
    system: BASE_SYSTEM,
    user: `Analyze this variance for "${params.metric}" in ${params.period}:

Actual: ${params.actual.toLocaleString()}
Budget: ${params.budget.toLocaleString()}
Variance: ${variance.toLocaleString()} (${variancePct.toFixed(1)}%)
${historicalContext}

Provide:
1) Root cause analysis (why this variance occurred)
2) Impact assessment (financial and operational impact)
3) Recommended actions (specific, actionable steps)
4) Risk factors (what could make this worse)
5) Confidence level (high/medium/low based on data quality)`,
    temperature: 0.3,
    maxTokens: 800,
  };
}

// ─── Forecast Insight ─────────────────────────────────────────────────────

export function forecastPrompt(params: ForecastParams): PromptTemplate {
  const dataStr = params.historicalData
    .map((d) => `  ${d.period}: ${d.value.toLocaleString()}`)
    .join('\n');

  const assumptionsStr = params.assumptions
    ? '\nKey assumptions:\n' + params.assumptions.map((a) => `  - ${a}`).join('\n')
    : '';

  return {
    system: BASE_SYSTEM,
    user: `Based on this historical data for "${params.metric}":
${dataStr}
${assumptionsStr}

Provide a ${params.forecastPeriods}-period forecast insight including:
1) Trend direction and strength (with confidence)
2) Seasonality patterns (if detectable)
3) Key assumptions underlying the forecast
4) Risk factors that could deviate from forecast
5) Recommended monitoring metrics`,
    temperature: 0.4,
    maxTokens: 1000,
  };
}

// ─── Formula Explanation ──────────────────────────────────────────────────

export function formulaExplanationPrompt(params: FormulaExplanationParams): PromptTemplate {
  const contextStr = params.context ? `\nContext: ${params.context}` : '';
  const dataTypeStr = params.dataType ? `\nData type: ${params.dataType}` : '';

  return {
    system: BASE_SYSTEM,
    user: `Explain this financial formula in plain language:
${params.formula}
${contextStr}${dataTypeStr}

Include:
1) What it measures (business meaning)
2) When to use it (common use cases)
3) What good/bad values look like (benchmarks)
4) Common pitfalls or edge cases
5) Related formulas or alternatives`,
    temperature: 0.2,
    maxTokens: 500,
  };
}

// ─── Budget Summary ───────────────────────────────────────────────────────

export function budgetSummaryPrompt(params: BudgetSummaryParams): PromptTemplate {
  const deptStr = params.departments ? `\nDepartments: ${params.departments.join(', ')}` : '';

  return {
    system: BASE_SYSTEM,
    user: `Summarize this budget for executive review:
Name: ${params.name}
Period: ${params.period}
Total Revenue: ${params.totalRevenue.toLocaleString()}
Total Expenses: ${params.totalExpenses.toLocaleString()}
Net: ${(params.totalRevenue - params.totalExpenses).toLocaleString()}
Line Items: ${params.lineItemCount}${deptStr}

Provide a concise executive summary with:
1) Key highlights (top 3 takeaways)
2) Risk areas (items requiring attention)
3) Recommendations (specific actions)
4) Outlook (positive/neutral/cautious with rationale)`,
    temperature: 0.3,
    maxTokens: 600,
  };
}

// ─── Financial Q&A ────────────────────────────────────────────────────────

export function financialQAPrompt(params: FinancialQAParams): PromptTemplate {
  const ctx = params.context;
  const parts: string[] = [];

  if (ctx.revenue !== undefined) parts.push(`Revenue: ${ctx.revenue.toLocaleString()}`);
  if (ctx.expenses !== undefined) parts.push(`Expenses: ${ctx.expenses.toLocaleString()}`);
  if (ctx.budget !== undefined) parts.push(`Budget: ${ctx.budget.toLocaleString()}`);
  if (ctx.period) parts.push(`Period: ${ctx.period}`);

  if (ctx.previousPeriod) {
    parts.push('\nPrevious period:');
    if (ctx.previousPeriod.revenue !== undefined)
      parts.push(`  Revenue: ${ctx.previousPeriod.revenue.toLocaleString()}`);
    if (ctx.previousPeriod.expenses !== undefined)
      parts.push(`  Expenses: ${ctx.previousPeriod.expenses.toLocaleString()}`);
  }

  return {
    system: BASE_SYSTEM,
    user: `Question: ${params.question}

Financial context:
${parts.join('\n')}

Provide a clear, data-driven answer with:
1) Direct answer to the question
2) Supporting data and calculations
3) Contextual insight (trends, comparisons)
4) Actionable recommendation`,
    temperature: 0.3,
    maxTokens: 600,
  };
}

// ─── All Templates ────────────────────────────────────────────────────────

export const templates = {
  variance: variancePrompt,
  forecast: forecastPrompt,
  formulaExplanation: formulaExplanationPrompt,
  budgetSummary: budgetSummaryPrompt,
  financialQA: financialQAPrompt,
} as const;
