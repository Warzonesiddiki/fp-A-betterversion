/**
 * AutoCommentaryEngine — management commentary from posted actuals and budget.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. All money arithmetic is decimal.js via `@/utils/money`. No IEEE-754
 *    `actual - budget` or `reduce((s, i) => s + i.actual)`.
 * 2. A variance *percentage* is omitted when the base is zero. Returning 0%
 *    would read as "on budget" when the budget does not exist.
 * 3. Commentary never labels a variance "favorable" or "unfavorable" without
 *    an account-class sign. Revenue above budget is good; expense above
 *    budget is not. The engine does not know the class, so it says
 *    above/below budget.
 * 4. The full-year "outlook" is not a forecast. It states the mechanical
 *    identity: if the remaining budget is delivered in full, FY variance
 *    equals YTD variance.
 * 5. `interpolate` currency-formats only keys that are money (`amount`,
 *    `budget`). A growth rate or period count must not become `$15`.
 */

import { formatMoney, subtractMoney, sumMoney, toDecimal, type MoneyInput } from '../utils/money';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';

interface LineItem {
  name: string;
  actual: number;
  budget: number;
  priorYear?: number;
}

interface CommentaryTemplate {
  id: string;
  name: string;
  template: string;
  category: 'variance' | 'trend' | 'summary' | 'outlook';
}

interface VarianceContext {
  priorYear?: number;
  drivers?: string[];
  threshold?: number;
}

const MONEY_INTERPOLATION_KEYS = new Set(['amount', 'budget', 'start', 'end']);

function fmtCurrency(value: MoneyInput): string {
  return currencyFormatter(reportingCurrency(), { maxDecimals: 0 })(toDecimal(value).toNumber());
}

function fmtPct(value: MoneyInput): string {
  return formatMoney(toDecimal(value).abs(), { places: 1 });
}

/**
 * (actual − base) / |base| × 100. `null` when base is zero — never 0-by-default.
 */
function varianceMagnitudePct(actual: MoneyInput, base: MoneyInput) {
  const b = toDecimal(base);
  if (b.isZero()) return null;
  return subtractMoney(actual, base).div(b.abs()).times(100);
}

export class AutoCommentaryEngine {
  private static readonly SIGNIFICANCE_THRESHOLD = 5;

  static generateVarianceCommentary(
    actual: number,
    budget: number,
    category: string,
    period: string,
    context?: VarianceContext
  ): string {
    const variance = subtractMoney(actual, budget);
    const variancePct = varianceMagnitudePct(actual, budget);
    const direction = variance.gte(0) ? 'above' : 'below';
    const parts: string[] = [];

    if (variancePct === null) {
      parts.push(
        `${category} for ${period} was ${fmtCurrency(actual)}. A variance percentage is not defined because the budget is zero.`
      );
    } else {
      const threshold = context?.threshold ?? this.SIGNIFICANCE_THRESHOLD;
      const absPct = variancePct.abs();
      if (absPct.lt(threshold)) {
        parts.push(
          `${category} for ${period} was broadly in line with budget at ${fmtCurrency(actual)}, representing a ${fmtPct(absPct)}% variance.`
        );
      } else {
        parts.push(
          `${category} for ${period} was ${fmtCurrency(actual)}, ${direction} budget by ${fmtCurrency(variance.abs())} (${fmtPct(absPct)}%).`
        );
      }
    }

    if (context?.drivers && context.drivers.length > 0) {
      const driverText =
        context.drivers.length === 1
          ? `This was primarily driven by ${context.drivers[0]}.`
          : `Key drivers include ${context.drivers.slice(0, -1).join(', ')} and ${context.drivers[context.drivers.length - 1]}.`;
      parts.push(driverText);
    }

    if (context?.priorYear !== undefined) {
      const yoyChange = subtractMoney(actual, context.priorYear);
      const yoyPct = varianceMagnitudePct(actual, context.priorYear);
      const yoyDirection = yoyChange.gte(0) ? 'an increase' : 'a decrease';
      if (yoyPct === null) {
        parts.push(
          `Compared to prior year, a year-over-year percentage is not defined because the prior-year base is zero.`
        );
      } else {
        parts.push(
          `Compared to prior year (${fmtCurrency(context.priorYear)}), this represents ${yoyDirection} of ${fmtCurrency(yoyChange.abs())} (${fmtPct(yoyPct)}%).`
        );
      }
    }

    return parts.join(' ');
  }

  static generateSectionNarrative(section: string, lineItems: LineItem[], period: string): string {
    if (lineItems.length === 0) return `No data available for ${section} in ${period}.`;

    const totalActual = sumMoney(lineItems.map((item) => item.actual));
    const totalBudget = sumMoney(lineItems.map((item) => item.budget));
    const totalVariance = subtractMoney(totalActual, totalBudget);
    const totalVariancePct = varianceMagnitudePct(totalActual, totalBudget);
    const direction = totalVariance.gte(0) ? 'above' : 'below';

    const parts: string[] = [];
    if (totalVariancePct === null) {
      parts.push(
        `Total ${section} for ${period} was ${fmtCurrency(totalActual)}. A variance percentage is not defined because the budget is zero.`
      );
    } else {
      parts.push(
        `Total ${section} for ${period} was ${fmtCurrency(totalActual)}, ${direction} budget by ${fmtCurrency(totalVariance.abs())} (${fmtPct(totalVariancePct)}%).`
      );
    }

    const ranked = [...lineItems]
      .map((item) => ({
        name: item.name,
        variance: subtractMoney(item.actual, item.budget),
        variancePct: varianceMagnitudePct(item.actual, item.budget),
      }))
      .filter((row) => row.variancePct !== null && row.variancePct.abs().gt(3))
      .sort((a, b) => b.variancePct!.abs().comparedTo(a.variancePct!.abs()));

    const top = ranked.slice(0, 3);
    if (top.length > 0) {
      const varianceLines = top.map((row) => {
        const vDir = row.variance.gte(0) ? 'above budget' : 'below budget';
        return `${row.name} (${vDir} ${fmtCurrency(row.variance.abs())})`;
      });
      parts.push(`Notable variances include ${varianceLines.join(', ')}.`);
    }

    const itemsWithPY = lineItems.filter((item) => item.priorYear !== undefined);
    if (itemsWithPY.length === lineItems.length && lineItems.length > 0) {
      const totalPY = sumMoney(itemsWithPY.map((item) => item.priorYear ?? 0));
      const yoyChange = subtractMoney(totalActual, totalPY);
      const yoyPct = varianceMagnitudePct(totalActual, totalPY);
      const yoyDir = yoyChange.gte(0) ? 'increase' : 'decrease';
      if (yoyPct === null) {
        parts.push(
          `Year-over-year, a percentage change is not defined because the prior-year total is zero.`
        );
      } else {
        parts.push(
          `Year-over-year, ${section} showed a ${yoyDir} of ${fmtCurrency(yoyChange.abs())} (${fmtPct(yoyPct)}%).`
        );
      }
    }

    return parts.join(' ');
  }

  static interpolate(template: string, variables: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `[${key}]`;
      let formatted: string;
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
          formatted = '—';
        } else if (MONEY_INTERPOLATION_KEYS.has(key)) {
          formatted = fmtCurrency(value);
        } else {
          formatted = String(value);
        }
      } else {
        formatted = String(value ?? '');
      }
      result = result.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        formatted
      );
    }
    return result;
  }

  static getTemplates(): CommentaryTemplate[] {
    return [
      {
        id: 'variance-positive',
        name: 'Favorable Variance',
        template: '[category] for [period] was [amount], [variance]% above budget. [drivers]',
        category: 'variance',
      },
      {
        id: 'variance-negative',
        name: 'Unfavorable Variance',
        template: '[category] for [period] was [amount], [variance]% below budget. [drivers]',
        category: 'variance',
      },
      {
        id: 'trend-improving',
        name: 'Improving Trend',
        template:
          '[category] has shown improvement over the last [periods] periods, with [metric] improving from [start] to [end].',
        category: 'trend',
      },
      {
        id: 'trend-deteriorating',
        name: 'Deteriorating Trend',
        template:
          '[category] has deteriorated over the last [periods] periods, with [metric] declining from [start] to [end].',
        category: 'trend',
      },
      {
        id: 'summary-period',
        name: 'Period Summary',
        template:
          'Total [category] for [period] was [amount], representing a [variance]% variance to budget of [budget].',
        category: 'summary',
      },
      {
        id: 'outlook-neutral',
        name: 'Neutral Outlook',
        template:
          'Based on current trends, [category] is expected to remain broadly in line with budget for the remainder of [fiscal_year].',
        category: 'outlook',
      },
      {
        id: 'outlook-positive',
        name: 'Positive Outlook',
        template:
          'Based on [drivers], [category] is expected to outperform budget by approximately [amount] for the full year.',
        category: 'outlook',
      },
      {
        id: 'outlook-negative',
        name: 'Negative Outlook',
        template:
          'Due to [drivers], [category] is at risk of underperforming budget by approximately [amount] for the full year.',
        category: 'outlook',
      },
    ];
  }

  static generateOutlook(
    category: string,
    ytdActual: number,
    ytdBudget: number,
    fullYearBudget: number,
    _remainingPeriods: number,
    drivers?: string[]
  ): string {
    const ytdVariance = subtractMoney(ytdActual, ytdBudget);
    const ytdPct = varianceMagnitudePct(ytdActual, ytdBudget);
    const remainingBudget = subtractMoney(fullYearBudget, ytdBudget);
    // Identity, not a forecast: remaining budget delivered in full ⇒ FY Δ = YTD Δ.
    const projectedFullYear = toDecimal(ytdActual).plus(remainingBudget);
    const projectedVariance = subtractMoney(projectedFullYear, fullYearBudget);
    const projectedPct = varianceMagnitudePct(projectedFullYear, fullYearBudget);

    const ytdClause =
      ytdPct === null
        ? `Based on year-to-date actuals of ${fmtCurrency(ytdActual)} (variance % undefined — YTD budget is zero)`
        : `Based on year-to-date performance of ${fmtCurrency(ytdActual)} (${fmtPct(ytdPct)}% ${ytdVariance.gte(0) ? 'above' : 'below'} budget)`;

    let outlook: string;
    if (projectedPct === null) {
      outlook = `${ytdClause}, a full-year variance percentage is not defined because the full-year budget is zero.`;
    } else if (projectedPct.abs().lt(3)) {
      outlook = `${ytdClause}, if the remaining budget is delivered in full, ${category} finishes broadly in line with the full-year budget of ${fmtCurrency(fullYearBudget)}.`;
    } else if (projectedVariance.gt(0)) {
      outlook = `${ytdClause}, if the remaining budget is delivered in full, ${category} finishes ${fmtCurrency(projectedVariance.abs())} (${fmtPct(projectedPct)}%) above the full-year budget. This is the year-to-date variance carried forward, not a forecast of remaining periods.`;
    } else {
      outlook = `${ytdClause}, if the remaining budget is delivered in full, ${category} finishes ${fmtCurrency(projectedVariance.abs())} (${fmtPct(projectedPct)}%) below the full-year budget. This is the year-to-date variance carried forward, not a forecast of remaining periods.`;
    }

    if (drivers && drivers.length > 0) {
      outlook += ` Key factors: ${drivers.join(', ')}.`;
    }

    return outlook;
  }
}
