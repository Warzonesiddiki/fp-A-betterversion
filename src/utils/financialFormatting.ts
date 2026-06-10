/**
 * Financial Number Formatting Engine
 * Used across ALL grids, charts, KPI cards, reports
 */

interface FormatConfig {
  locale: string;
  currency: string;
  negativeStyle: 'parentheses' | 'minus' | 'color';
  zeroDisplay: string;
  nullDisplay: string;
}

const defaultConfig: FormatConfig = {
  locale: 'en-US',
  currency: 'USD',
  negativeStyle: 'parentheses',
  zeroDisplay: '—',
  nullDisplay: '—',
};

export function formatCurrency(
  value: number | null | undefined,
  config: Partial<FormatConfig> = {}
): string {
  const cfg = { ...defaultConfig, ...config };
  if (value == null) return cfg.nullDisplay;
  if (value === 0) return cfg.zeroDisplay;

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  const formatted = new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency: cfg.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);

  if (isNegative) {
    switch (cfg.negativeStyle) {
      case 'parentheses':
        return `(${formatted})`;
      case 'minus':
        return `-${formatted}`;
      case 'color':
        return formatted;
    }
  }
  return formatted;
}

export function formatCompact(value: number | null | undefined, currency = 'USD'): string {
  if (value == null || value === 0) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return formatCurrency(value, { currency });
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatVariance(
  actual: number,
  budget: number
): { text: string; className: string; percentage: string } {
  const diff = actual - budget;
  const pct = budget !== 0 ? (diff / Math.abs(budget)) * 100 : 0;
  const text = formatCurrency(diff, { negativeStyle: 'minus' });
  const percentage = `(${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`;
  let className = 'fin-neutral';
  if (Math.abs(pct) > 0.01) {
    className = pct > 0 ? 'fin-positive font-medium' : 'fin-negative font-medium';
  }
  return { text, className, percentage };
}

export function parseFinancialInput(input: string): number | null {
  if (!input || input.trim() === '' || input.trim() === '—') return null;
  let cleaned = input.trim();
  const isParens = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isParens) cleaned = cleaned.slice(1, -1);
  cleaned = cleaned.replace(/[$€£¥,]/g, '');
  const compactMatch = cleaned.match(/^([\d.]+)\s*([KMB])$/i);
  if (compactMatch) {
    const num = parseFloat(compactMatch[1]!);
    const multiplier: Record<string, number> = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
    return (isParens ? -1 : 1) * num * multiplier![compactMatch[2]!.toUpperCase()]!;
  }
  const pctMatch = cleaned.match(/^([\d.]+)%$/);
  if (pctMatch) return (isParens ? -1 : 1) * parseFloat(pctMatch[1]!);
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isParens ? -num : num;
}

export function useFinancialFormatter() {
  return {
    currency: (v: number | null) => formatCurrency(v),
    compact: (v: number | null) => formatCompact(v),
    percent: (v: number | null) => formatPercent(v),
    number: (v: number | null) => formatNumber(v),
    variance: (actual: number, budget: number) => formatVariance(actual, budget),
    parse: parseFinancialInput,
  };
}
