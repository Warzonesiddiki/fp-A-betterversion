/**
 * Natural Language Query (NLQ) Engine
 *
 * Parses natural language queries into structured financial data requests.
 * Supports: charts, tables, KPIs, comparisons, trends.
 *
 * Competitive advantage: First offline FP&A tool with NLQ (Vena, Cube, Oracle, SAP, Mosaic have it).
 */

import type { GLEntry, GLAccount } from '@/types';
import { divideMoney, roundTo, sumMoney, toDecimal } from '../utils/money';

/**
 * MONEY MIGRATION (2026-08-03): All currency-bearing paths (netChange, debit,
 * credit, revenue/expense/profit aggregations from GL) now use the canonical
 * money primitive (src/utils/money.ts, decimal.js, ROUND_HALF_UP). Amounts
 * round to cents (2 dp); no raw + - * / or Math.abs on currency values.
 * Ratios/aggregations that are not money (e.g. counts) remain numeric.
 * >0 guards use Decimal.greaterThan(0) (decimal.js isPositive() returns true for 0).
 */
const CURRENCY_PLACES = 2;

// ─── Types ──────────────────────────────────────────────────────────────────

export type NLQIntent = 'chart' | 'table' | 'kpi' | 'comparison' | 'trend';
export type NLQChartType = 'bar' | 'line' | 'area' | 'pie' | 'composed';
export type NLQTimeGranularity = 'month' | 'quarter' | 'year';

export interface NLQEntities {
  metrics: string[];
  dimensions: string[];
  timePeriod: NLQTimePeriod | null;
  filters: NLQFilter[];
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface NLQTimePeriod {
  type: 'quarter' | 'month' | 'year' | 'range';
  value: string; // "Q3", "2026", "Jan", "Q1-Q3"
  year?: number;
}

export interface NLQFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: string | number;
}

export interface NLQQuery {
  raw: string;
  intent: NLQIntent;
  entities: NLQEntities;
  chartType: NLQChartType;
  confidence: number;
}

export interface NLQResult {
  query: NLQQuery;
  data: NLQDataPoint[];
  summary: string;
  chartConfig: NLQChartConfig | null;
}

export interface NLQDataPoint {
  label: string;
  value: number;
  dimension?: string;
  period?: string;
}

export interface NLQChartConfig {
  type: NLQChartType;
  dataKey: string;
  labelKey: string;
  title: string;
  colors?: string[];
}

// ─── Pattern Definitions ────────────────────────────────────────────────────

const METRIC_PATTERNS: Record<string, string[]> = {
  revenue: ['revenue', 'sales', 'income', 'top line', 'gross revenue'],
  expenses: ['expenses', 'costs', 'spending', 'expenditure', 'outgoings', 'opex'],
  profit: ['profit', 'earnings', 'net income', 'bottom line', 'margin', 'net profit'],
  'gross profit': ['gross profit', 'gross margin', 'cost of goods'],
  ebitda: ['ebitda', 'operating income', 'operating profit'],
  budget: ['budget', 'planned', 'allocated', 'forecast'],
  actual: ['actual', 'realized', 'actuals'],
  variance: ['variance', 'difference', 'delta', 'deviation', 'gap'],
  assets: ['assets', 'total assets', 'fixed assets', 'current assets'],
  liabilities: ['liabilities', 'debts', 'obligations', 'payables'],
  equity: ['equity', 'shareholders equity', 'retained earnings'],
  cashflow: ['cash flow', 'cashflow', 'cash', 'free cash flow'],
  headcount: ['headcount', 'employees', 'staff', 'fte', 'workforce'],
  arr: ['arr', 'annual recurring revenue'],
  mrr: ['mrr', 'monthly recurring revenue'],
  churn: ['churn', 'attrition', 'retention', 'logo churn'],
  customers: ['customers', 'accounts', 'clients', 'subscribers'],
  pipeline: ['pipeline', 'deal value', 'bookings'],
  debit: ['debit'],
  credit: ['credit'],
};

const DIMENSION_PATTERNS: Record<string, string[]> = {
  region: ['region', 'territory', 'area', 'geography', 'country', 'market'],
  department: ['department', 'dept', 'division', 'business unit', 'team'],
  product: ['product', 'line', 'offering', 'service', 'sku'],
  entity: ['entity', 'subsidiary', 'company', 'business unit'],
  account: ['account', 'gl', 'ledger', 'account code'],
  period: ['period', 'month', 'quarter', 'year', 'fiscal year'],
  customer: ['customer', 'client', 'account', 'buyer'],
  vendor: ['vendor', 'supplier', 'provider'],
  project: ['project', 'initiative', 'program'],
};

const TIME_PATTERNS = {
  quarters: /Q([1-4])/i,
  months: /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b/i,
  years: /\b(20\d{2})\b/,
  fy: /\bFY\s*(20\d{2})\b/i,
  lastQuarter: /\blast\s+quarter\b/i,
  thisQuarter: /\bthis\s+quarter\b/i,
  thisYear: /\bthis\s+year\b/i,
  lastYear: /\blast\s+year\b/i,
  ytd: /\bYTD\b/i,
  mtd: /\bMTD\b/i,
  qtd: /\bQTD\b/i,
};

const INTENT_PATTERNS: { pattern: RegExp; intent: NLQIntent; chartType: NLQChartType }[] = [
  { pattern: /\b(compare|vs|versus|against)\b/i, intent: 'comparison', chartType: 'bar' },
  { pattern: /\b(trend|over time|history|historical)\b/i, intent: 'trend', chartType: 'line' },
  { pattern: /\b(show|display|visualize|chart|graph)\b/i, intent: 'chart', chartType: 'bar' },
  { pattern: /\b(what is|total|sum|how much|amount)\b/i, intent: 'kpi', chartType: 'bar' },
  { pattern: /\b(list|table|details|breakdown)\b/i, intent: 'table', chartType: 'bar' },
  { pattern: /\b(by|per|across|grouped)\b/i, intent: 'chart', chartType: 'bar' },
];

const CHART_TYPE_PATTERNS: { pattern: RegExp; type: NLQChartType }[] = [
  { pattern: /\b(pie|donut)\b/i, type: 'pie' },
  { pattern: /\b(line|trend)\b/i, type: 'line' },
  { pattern: /\b(area|stacked)\b/i, type: 'area' },
  { pattern: /\b(bar|column)\b/i, type: 'bar' },
];

// ─── Parser ─────────────────────────────────────────────────────────────────

export class NLQEngine {
  /**
   * Parse natural language query into structured NLQQuery.
   */
  static parseQuery(text: string): NLQQuery {
    const normalized = text.toLowerCase().trim();
    const intent = this.classifyIntent(normalized);
    const entities = this.extractEntities(normalized);
    const chartType = this.detectChartType(normalized) || this.defaultChartType(intent);
    const confidence = this.calculateConfidence(intent, entities);

    return { raw: text, intent, entities, chartType, confidence };
  }

  /**
   * Classify query intent.
   */
  static classifyIntent(text: string): NLQIntent {
    for (const { pattern, intent } of INTENT_PATTERNS) {
      if (pattern.test(text)) return intent;
    }
    // Default: if has dimension → chart, else → kpi
    return this.hasDimensionKeyword(text) ? 'chart' : 'kpi';
  }

  /**
   * Extract entities: metrics, dimensions, time period, filters.
   */
  static extractEntities(text: string): NLQEntities {
    return {
      metrics: this.extractMetrics(text),
      dimensions: this.extractDimensions(text),
      timePeriod: this.extractTimePeriod(text),
      filters: this.extractFilters(text),
      aggregation: this.detectAggregation(text),
    };
  }

  /**
   * Execute query against GL entries and return data points.
   */
  static executeQuery(
    query: NLQQuery,
    entries: readonly GLEntry[],
    accounts?: readonly GLAccount[]
  ): NLQResult {
    const { metrics, dimensions, timePeriod, filters, aggregation } = query.entities;

    // Filter entries by time period
    let filtered = this.filterByTimePeriod(entries, timePeriod);

    // Apply additional filters
    filtered = this.applyFilters(filtered, filters);

    // Group by dimension
    const grouped = this.groupEntries(filtered, dimensions, accounts);

    // Aggregate
    const data = this.aggregateGrouped(grouped, metrics, aggregation);

    // Generate summary
    const summary = this.generateSummary(query, data);

    // Generate chart config
    const chartConfig = query.intent === 'kpi' ? null : this.generateChartConfig(query, data);

    return { query, data, summary, chartConfig };
  }

  // ─── Metric Extraction ──────────────────────────────────────────────────

  private static extractMetrics(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const [metric, patterns] of Object.entries(METRIC_PATTERNS)) {
      if (patterns.some((p) => lower.includes(p))) {
        found.push(metric);
      }
    }
    return found.length > 0 ? found : ['revenue']; // default
  }

  // ─── Dimension Extraction ───────────────────────────────────────────────

  private static extractDimensions(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];
    for (const [dim, patterns] of Object.entries(DIMENSION_PATTERNS)) {
      if (patterns.some((p) => lower.includes(p))) {
        found.push(dim);
      }
    }
    return found;
  }

  private static hasDimensionKeyword(text: string): boolean {
    return /\b(by|per|across|grouped|for each)\b/i.test(text);
  }

  // ─── Time Period Extraction ─────────────────────────────────────────────

  private static extractTimePeriod(text: string): NLQTimePeriod | null {
    // Quarter
    const qMatch = text.match(TIME_PATTERNS.quarters);
    if (qMatch) {
      const yearMatch = text.match(TIME_PATTERNS.years);
      return {
        type: 'quarter',
        value: `Q${qMatch[1]}`,
        year: yearMatch ? parseInt(yearMatch[1]!) : undefined,
      };
    }

    // FY year
    const fyMatch = text.match(TIME_PATTERNS.fy);
    if (fyMatch) return { type: 'year', value: fyMatch[1]!, year: parseInt(fyMatch[1]!) };

    // Year
    const yMatch = text.match(TIME_PATTERNS.years);
    if (yMatch && !text.match(TIME_PATTERNS.quarters)) {
      return { type: 'year', value: yMatch[1]!, year: parseInt(yMatch[1]!) };
    }

    // Month
    const mMatch = text.match(TIME_PATTERNS.months);
    if (mMatch) {
      const months = [
        'jan',
        'feb',
        'mar',
        'apr',
        'may',
        'jun',
        'jul',
        'aug',
        'sep',
        'oct',
        'nov',
        'dec',
      ];
      const _idx = months.indexOf(mMatch[1]!.toLowerCase());
      return {
        type: 'month',
        value: mMatch[1]!.charAt(0).toUpperCase() + mMatch[1]!.slice(1, 3),
        year: undefined,
      };
    }

    // Relative
    if (TIME_PATTERNS.thisYear.test(text)) return { type: 'year', value: 'thisYear' };
    if (TIME_PATTERNS.lastYear.test(text)) return { type: 'year', value: 'lastYear' };
    if (TIME_PATTERNS.thisQuarter.test(text)) return { type: 'quarter', value: 'thisQuarter' };
    if (TIME_PATTERNS.lastQuarter.test(text)) return { type: 'quarter', value: 'lastQuarter' };
    if (TIME_PATTERNS.ytd.test(text)) return { type: 'year', value: 'YTD' };
    if (TIME_PATTERNS.mtd.test(text)) return { type: 'month', value: 'MTD' };
    if (TIME_PATTERNS.qtd.test(text)) return { type: 'quarter', value: 'QTD' };

    return null;
  }

  // ─── Filter Extraction ──────────────────────────────────────────────────

  private static extractFilters(text: string): NLQFilter[] {
    const filters: NLQFilter[] = [];

    // "where field = value" or "for field value"
    const whereMatch = text.match(/\bwhere\s+(\w+)\s*(=|is|equals?)\s*(\w[\w\s]*)/i);
    if (whereMatch) {
      filters.push({ field: whereMatch[1]!, operator: 'eq', value: whereMatch[3]!.trim() });
    }

    // "department sales" or "region north"
    for (const [dim, patterns] of Object.entries(DIMENSION_PATTERNS)) {
      if (patterns.some((p) => text.includes(p))) {
        // Check if there's a value after the dimension keyword
        const dimPattern = new RegExp(`\\b${patterns[0]}\\s+(\\w+)`, 'i');
        const match = text.match(dimPattern);
        if (match && !['by', 'per', 'in', 'for'].includes(match[1]!.toLowerCase())) {
          filters.push({ field: dim, operator: 'eq', value: match[1]! });
        }
      }
    }

    return filters;
  }

  // ─── Aggregation Detection ──────────────────────────────────────────────

  private static detectAggregation(text: string): 'sum' | 'avg' | 'count' | 'min' | 'max' {
    if (/\b(average|avg|mean)\b/i.test(text)) return 'avg';
    if (/\b(count|number|how many)\b/i.test(text)) return 'count';
    if (/\b(min|minimum|lowest|smallest)\b/i.test(text)) return 'min';
    if (/\b(max|maximum|highest|largest|biggest)\b/i.test(text)) return 'max';
    return 'sum';
  }

  // ─── Chart Type Detection ───────────────────────────────────────────────

  private static detectChartType(text: string): NLQChartType | null {
    for (const { pattern, type } of CHART_TYPE_PATTERNS) {
      if (pattern.test(text)) return type;
    }
    return null;
  }

  private static defaultChartType(intent: NLQIntent): NLQChartType {
    switch (intent) {
      case 'trend':
        return 'line';
      case 'comparison':
        return 'bar';
      case 'chart':
        return 'bar';
      case 'table':
        return 'bar';
      case 'kpi':
        return 'bar';
    }
  }

  // ─── Confidence ─────────────────────────────────────────────────────────

  private static calculateConfidence(intent: NLQIntent, entities: NLQEntities): number {
    let confidence = 0.4;

    // Metric detection (0-0.25)
    if (entities.metrics.length === 1) confidence += 0.2;
    if (entities.metrics.length >= 2) confidence += 0.25;

    // Dimension detection (0-0.15)
    if (entities.dimensions.length > 0) confidence += 0.15;

    // Time period specificity (0-0.15)
    if (entities.timePeriod) {
      const tv = entities.timePeriod.value;
      // Specific periods get higher confidence
      if (tv === 'YTD' || tv === 'MTD' || tv === 'QTD') confidence += 0.15;
      else if (tv.startsWith('Q') || entities.timePeriod.year) confidence += 0.12;
      else confidence += 0.08;
    }

    // Filter presence (0-0.05)
    if (entities.filters.length > 0) confidence += 0.05;

    // Intent clarity (0-0.05)
    if (intent === 'comparison' || intent === 'trend') confidence += 0.05;

    return Math.min(confidence, 1);
  }

  // ─── Filtering ──────────────────────────────────────────────────────────

  private static filterByTimePeriod(
    entries: readonly GLEntry[],
    period: NLQTimePeriod | null
  ): readonly GLEntry[] {
    if (!period) return entries;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQuarter = Math.ceil(currentMonth / 3);

    return entries.filter((e) => {
      const entryDate = new Date(e.date);
      const entryYear = entryDate.getFullYear();
      const entryMonth = entryDate.getMonth() + 1;
      const entryQuarter = Math.ceil(entryMonth / 3);

      switch (period.value) {
        case 'thisYear':
          return entryYear === currentYear;
        case 'lastYear':
          return entryYear === currentYear - 1;
        case 'YTD':
          return entryYear === currentYear;
        case 'MTD':
          return entryYear === currentYear && entryMonth === currentMonth;
        case 'QTD':
          return entryYear === currentYear && entryQuarter === currentQuarter;
        case 'thisQuarter':
          return entryYear === currentYear && entryQuarter === currentQuarter;
        case 'lastQuarter': {
          const lastQ = currentQuarter === 1 ? 4 : currentQuarter - 1;
          const lastQYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
          return entryYear === lastQYear && entryQuarter === lastQ;
        }
        default: {
          // Specific quarter or year
          if (period.type === 'quarter') {
            const q = parseInt(period.value.replace('Q', ''));
            return entryQuarter === q && (!period.year || entryYear === period.year);
          }
          if (period.type === 'year') {
            const y = parseInt(period.value);
            return entryYear === y;
          }
          return true;
        }
      }
    });
  }

  private static applyFilters(
    entries: readonly GLEntry[],
    filters: readonly NLQFilter[]
  ): readonly GLEntry[] {
    return entries.filter((e) => {
      return filters.every((f) => {
        const value = this.getEntryField(e, f.field);
        if (value === undefined) return true;
        switch (f.operator) {
          case 'eq':
            return String(value).toLowerCase() === String(f.value).toLowerCase();
          case 'neq':
            return String(value).toLowerCase() !== String(f.value).toLowerCase();
          case 'gt':
            return Number(value) > Number(f.value);
          case 'lt':
            return Number(value) < Number(f.value);
          case 'gte':
            return Number(value) >= Number(f.value);
          case 'lte':
            return Number(value) <= Number(f.value);
          case 'contains':
            return String(value).toLowerCase().includes(String(f.value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  private static getEntryField(entry: GLEntry, field: string): string | number | undefined {
    switch (field) {
      case 'account':
      case 'accountName':
        return entry.accountName;
      case 'accountCode':
        return entry.accountCode;
      case 'description':
        return entry.description;
      case 'period':
        return entry.period;
      case 'amount':
      case 'netChange':
        return entry.netChange;
      case 'debit':
        return entry.debit;
      case 'credit':
        return entry.credit;
      case 'entityId':
        return entry.entityId;
      case 'departmentId':
        return entry.departmentId;
      default:
        return undefined;
    }
  }

  // ─── Grouping ───────────────────────────────────────────────────────────

  private static groupEntries(
    entries: readonly GLEntry[],
    dimensions: readonly string[],
    _accounts?: readonly GLAccount[]
  ): Map<string, GLEntry[]> {
    const groups = new Map<string, GLEntry[]>();

    if (dimensions.length === 0) {
      groups.set('total', [...entries]);
      return groups;
    }

    const dim = dimensions[0]; // primary dimension

    for (const entry of entries) {
      let key: string;
      switch (dim) {
        case 'region':
        case 'entity':
          key = entry.entityId || 'Unknown';
          break;
        case 'department':
          key = entry.departmentId || 'Unknown';
          break;
        case 'account':
          key = entry.accountName;
          break;
        case 'period':
          key = entry.periodName || entry.period;
          break;
        case 'product':
          key = entry.accountName || 'General';
          break;
        default:
          key = entry.accountName;
      }

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(entry);
    }

    return groups;
  }

  // ─── Aggregation ────────────────────────────────────────────────────────

  private static aggregateGrouped(
    grouped: Map<string, GLEntry[]>,
    metrics: readonly string[],
    aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  ): NLQDataPoint[] {
    const points: NLQDataPoint[] = [];
    const useMetric = metrics[0] || 'revenue';

    for (const [key, entries] of grouped) {
      // Map metric to entry field using money-safe extraction.
      // All currency values go through toDecimal + roundTo(2); non-currency
      // (count) stay as-is. Use greaterThan(0) for sign guards (decimal.js
      // isPositive() is true for 0).
      const values = entries.map((e) => {
        let raw: number;
        switch (useMetric) {
          case 'revenue':
          case 'sales':
          case 'income':
            raw = toDecimal(e.netChange).greaterThan(0) ? toDecimal(e.netChange).toNumber() : 0;
            return roundTo(raw, CURRENCY_PLACES);
          case 'expenses':
          case 'costs':
            raw = toDecimal(e.netChange).lessThan(0) ? toDecimal(e.netChange).abs().toNumber() : 0;
            return roundTo(raw, CURRENCY_PLACES);
          case 'profit':
            return roundTo(e.netChange, CURRENCY_PLACES);
          case 'debit':
            return roundTo(e.debit, CURRENCY_PLACES);
          case 'credit':
            return roundTo(e.credit, CURRENCY_PLACES);
          default:
            return roundTo(e.netChange, CURRENCY_PLACES);
        }
      });

      let value: number;
      switch (aggregation) {
        case 'sum':
          value = roundTo(sumMoney(values), CURRENCY_PLACES);
          break;
        case 'avg':
          if (values.length === 0) {
            value = 0;
          } else {
            const sum = sumMoney(values);
            value = roundTo(divideMoney(sum, values.length), CURRENCY_PLACES);
          }
          break;
        case 'count':
          value = values.length;
          break;
        case 'min':
          if (values.length === 0) {
            value = 0;
          } else {
            // min of already-rounded cents is still safe as number for display
            value = Math.min(...values.map((v) => roundTo(v, CURRENCY_PLACES)));
          }
          break;
        case 'max':
          if (values.length === 0) {
            value = 0;
          } else {
            value = Math.max(...values.map((v) => roundTo(v, CURRENCY_PLACES)));
          }
          break;
      }

      points.push({ label: key, value, dimension: key });
    }

    return points.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  // ─── Summary Generation ─────────────────────────────────────────────────

  private static generateSummary(query: NLQQuery, data: readonly NLQDataPoint[]): string {
    if (data.length === 0) return 'No data found for this query.';

    // Total is a money sum; use sumMoney + roundTo to keep exact cents.
    const total = roundTo(sumMoney(data.map((d) => d.value)), CURRENCY_PLACES);
    const metric = query.entities.metrics[0] || 'value';
    const top = data[0];

    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(total);

    switch (query.intent) {
      case 'kpi':
        return `Total ${metric}: ${formatted}`;
      case 'comparison':
        return `${metric}: ${data.length} items. Top: ${top!.label} (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(top!.value)})`;
      case 'trend':
        return `${metric} trend over ${data.length} periods. Total: ${formatted}`;
      case 'chart':
        return `${metric} by ${query.entities.dimensions[0] || 'category'}. Total: ${formatted}. ${data.length} items.`;
      case 'table':
        return `${data.length} rows of ${metric} data. Total: ${formatted}`;
      default:
        return `Found ${data.length} results. Total: ${formatted}`;
    }
  }

  // ─── Chart Config ───────────────────────────────────────────────────────

  static generateChartConfig(query: NLQQuery, _data: readonly NLQDataPoint[]): NLQChartConfig {
    const metric = query.entities.metrics[0] || 'value';
    const dim = query.entities.dimensions[0] || 'category';

    return {
      type: query.chartType,
      dataKey: 'value',
      labelKey: 'label',
      title: `${metric} by ${dim}`,
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    };
  }
}
