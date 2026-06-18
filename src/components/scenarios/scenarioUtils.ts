import type { Scenario, ScenarioMetrics } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricDef {
  key: keyof ScenarioMetrics;
  label: string;
  format: 'currency' | 'percent' | 'number';
  higherIsBetter: boolean;
}

export interface CategoryMetricDef extends MetricDef {
  category: 'profitability' | 'liquidity' | 'efficiency';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const METRICS: MetricDef[] = [
  { key: 'revenue', label: 'Revenue', format: 'currency', higherIsBetter: true },
  { key: 'ebitda', label: 'EBITDA', format: 'currency', higherIsBetter: true },
  { key: 'netIncome', label: 'Net Income', format: 'currency', higherIsBetter: true },
  { key: 'cashFlow', label: 'Cash Flow', format: 'currency', higherIsBetter: true },
  { key: 'grossMargin', label: 'Gross Margin', format: 'percent', higherIsBetter: true },
  { key: 'ebitdaMargin', label: 'EBITDA Margin', format: 'percent', higherIsBetter: true },
  { key: 'headcount', label: 'Headcount', format: 'number', higherIsBetter: true },
  { key: 'burnRate', label: 'Burn Rate', format: 'currency', higherIsBetter: false },
  { key: 'runway', label: 'Runway (mo)', format: 'number', higherIsBetter: true },
];

export const CATEGORIZED_METRICS: CategoryMetricDef[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    format: 'currency',
    higherIsBetter: true,
    category: 'profitability',
  },
  {
    key: 'ebitda',
    label: 'EBITDA',
    format: 'currency',
    higherIsBetter: true,
    category: 'profitability',
  },
  {
    key: 'netIncome',
    label: 'Net Income',
    format: 'currency',
    higherIsBetter: true,
    category: 'profitability',
  },
  {
    key: 'cashFlow',
    label: 'Cash Flow',
    format: 'currency',
    higherIsBetter: true,
    category: 'liquidity',
  },
  {
    key: 'grossMargin',
    label: 'Gross Margin',
    format: 'percent',
    higherIsBetter: true,
    category: 'profitability',
  },
  {
    key: 'ebitdaMargin',
    label: 'EBITDA Margin',
    format: 'percent',
    higherIsBetter: true,
    category: 'efficiency',
  },
  {
    key: 'headcount',
    label: 'Headcount',
    format: 'number',
    higherIsBetter: true,
    category: 'efficiency',
  },
  {
    key: 'burnRate',
    label: 'Burn Rate',
    format: 'currency',
    higherIsBetter: false,
    category: 'liquidity',
  },
  {
    key: 'runway',
    label: 'Runway (mo)',
    format: 'number',
    higherIsBetter: true,
    category: 'liquidity',
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  profitability: 'Profitability',
  liquidity: 'Liquidity',
  efficiency: 'Efficiency',
};

export const BAR_COLORS = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600'];

export const TYPE_BADGE: Record<string, string> = {
  Base: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  Optimistic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Pessimistic: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Custom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function fmtValue(value: number, format: MetricDef['format']): string {
  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}

// ---------------------------------------------------------------------------
// Variance helpers
// ---------------------------------------------------------------------------

export function variancePct(current: number, base: number): number {
  if (base === 0) return 0;
  return ((current - base) / Math.abs(base)) * 100;
}

export function isFavorable(current: number, base: number, higherIsBetter: boolean): boolean {
  const diff = current - base;
  if (Math.abs(diff) < 0.001) return true;
  return higherIsBetter ? diff >= 0 : diff <= 0;
}

export function barWidth(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.max(2, (Math.abs(value) / Math.abs(max)) * 100));
}

// ---------------------------------------------------------------------------
// Merge strategy helpers
// ---------------------------------------------------------------------------

export type MergeStrategy = 'best' | 'average' | 'worst';

export const STRATEGY_LABELS: Record<MergeStrategy, string> = {
  best: 'Best-of (optimal each metric)',
  average: 'Weighted Average',
  worst: 'Worst-case (conservative)',
};

export function pickBest(
  scenarios: Scenario[],
  key: keyof ScenarioMetrics,
  higherIsBetter: boolean
): { value: number; sourceId: string } {
  let best = scenarios[0]!;
  for (const s of scenarios) {
    const current = s.calculatedMetrics[key];
    const bestVal = best.calculatedMetrics[key];
    if (higherIsBetter ? current > bestVal : current < bestVal) {
      best = s;
    }
  }
  return { value: best.calculatedMetrics[key]!, sourceId: best.id };
}

export function pickWorst(
  scenarios: Scenario[],
  key: keyof ScenarioMetrics,
  higherIsBetter: boolean
): { value: number; sourceId: string } {
  let worst = scenarios[0]!;
  for (const s of scenarios) {
    const current = s.calculatedMetrics[key];
    const worstVal = worst.calculatedMetrics[key];
    if (higherIsBetter ? current < worstVal : current > worstVal) {
      worst = s;
    }
  }
  return { value: worst.calculatedMetrics[key]!, sourceId: worst.id };
}

export function averageValue(scenarios: Scenario[], key: keyof ScenarioMetrics): number {
  const sum = scenarios.reduce((acc, s) => acc + s.calculatedMetrics[key]!, 0);
  return sum / scenarios.length;
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

export type Severity = 'high' | 'medium' | 'low';

export function severityOf(pctChange: number): Severity {
  const abs = Math.abs(pctChange);
  if (abs >= 20) return 'high';
  if (abs >= 5) return 'medium';
  return 'low';
}

export function severityColor(severity: Severity): string {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'medium':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'low':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
}
