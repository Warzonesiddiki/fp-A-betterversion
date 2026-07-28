/**
 * AutoCommentaryEngine — Auto-generate management commentary
 * Part 6 #2: Turns report production from days to hours
 */

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
  threshold?: number; // percentage threshold for significance
}

export class AutoCommentaryEngine {
  private static readonly SIGNIFICANCE_THRESHOLD = 5; // 5% variance threshold

  /**
   * Generate variance commentary for a single line item
   */
  static generateVarianceCommentary(
    actual: number,
    budget: number,
    category: string,
    period: string,
    context?: VarianceContext
  ): string {
    const variance = actual - budget;
    const variancePct = budget !== 0 ? (variance / Math.abs(budget)) * 100 : 0;
    const direction = variance >= 0 ? 'above' : 'below';
    const absVariance = Math.abs(variance);
    const absPct = Math.abs(variancePct);

    const fmt = (v: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v);

    // Skip commentary for immaterial variances
    const threshold = context?.threshold ?? this.SIGNIFICANCE_THRESHOLD;
    if (absPct < threshold) {
      return `${category} for ${period} was broadly in line with budget at ${fmt(actual)}, representing a ${absPct.toFixed(1)}% variance.`;
    }

    let commentary = `${category} for ${period} was ${fmt(actual)}, ${direction} budget by ${fmt(absVariance)} (${absPct.toFixed(1)}%).`;

    // Add driver context if available
    if (context?.drivers && context.drivers.length > 0) {
      const driverText =
        context.drivers.length === 1
          ? `This was primarily driven by ${context.drivers[0]}.`
          : `Key drivers include ${context.drivers.slice(0, -1).join(', ')} and ${context.drivers[context.drivers.length - 1]}.`;
      commentary += ` ${driverText}`;
    }

    // Add prior year comparison if available
    if (context?.priorYear !== undefined) {
      const yoyChange = actual - context.priorYear;
      const yoyPct = context.priorYear !== 0 ? (yoyChange / Math.abs(context.priorYear)) * 100 : 0;
      const yoyDirection = yoyChange >= 0 ? 'increase' : 'decrease';
      commentary += ` Compared to prior year (${fmt(context.priorYear)}), this represents a ${yoyDirection} of ${fmt(Math.abs(yoyChange))} (${Math.abs(yoyPct).toFixed(1)}%).`;
    }

    return commentary;
  }

  /**
   * Generate section narrative for a group of line items
   */
  static generateSectionNarrative(section: string, lineItems: LineItem[], period: string): string {
    if (lineItems.length === 0) return `No data available for ${section} in ${period}.`;

    const totalActual = lineItems.reduce((sum, item) => sum + item.actual, 0);
    const totalBudget = lineItems.reduce((sum, item) => sum + item.budget, 0);
    const totalVariance = totalActual - totalBudget;
    const totalVariancePct = totalBudget !== 0 ? (totalVariance / Math.abs(totalBudget)) * 100 : 0;

    const fmt = (v: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v);

    const direction = totalVariance >= 0 ? 'above' : 'below';

    // Find top variances
    const sortedByVariance = [...lineItems]
      .map((item) => ({
        ...item,
        variance: item.actual - item.budget,
        variancePct:
          item.budget !== 0 ? ((item.actual - item.budget) / Math.abs(item.budget)) * 100 : 0,
      }))
      .sort((a, b) => Math.abs(b.variancePct) - Math.abs(a.variancePct));

    const topVariances = sortedByVariance.slice(0, 3).filter((v) => Math.abs(v.variancePct) > 3);

    let narrative = `Total ${section} for ${period} was ${fmt(totalActual)}, ${direction} budget by ${fmt(Math.abs(totalVariance))} (${Math.abs(totalVariancePct).toFixed(1)}%).`;

    if (topVariances.length > 0) {
      const varianceLines = topVariances.map((v) => {
        const vDir = v.variance >= 0 ? 'favorable' : 'unfavorable';
        return `${v.name} (${vDir} ${fmt(Math.abs(v.variance))})`;
      });
      narrative += ` Notable variances include ${varianceLines.join(', ')}.`;
    }

    // Add prior year comparison if available for all items
    const itemsWithPY = lineItems.filter((item) => item.priorYear !== undefined);
    if (itemsWithPY.length === lineItems.length) {
      const totalPY = itemsWithPY.reduce((sum, item) => sum + (item.priorYear ?? 0), 0);
      const yoyChange = totalActual - totalPY;
      const yoyPct = totalPY !== 0 ? (yoyChange / Math.abs(totalPY)) * 100 : 0;
      const yoyDir = yoyChange >= 0 ? 'increase' : 'decrease';
      narrative += ` Year-over-year, ${section} showed a ${yoyDir} of ${fmt(Math.abs(yoyChange))} (${Math.abs(yoyPct).toFixed(1)}%).`;
    }

    return narrative;
  }

  /**
   * Interpolate template with variables
   * Supports: [period], [amount], [variance], [category], etc.
   */
  static interpolate(template: string, variables: Record<string, unknown>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `[${key}]`;
      const formatted =
        typeof value === 'number'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              maximumFractionDigits: 0,
            }).format(value)
          : String(value ?? '');
      result = result.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        formatted
      );
    }
    return result;
  }

  /**
   * Get standard commentary templates
   */
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

  /**
   * Generate outlook commentary based on year-to-date performance
   */
  static generateOutlook(
    category: string,
    ytdActual: number,
    ytdBudget: number,
    fullYearBudget: number,
    _remainingPeriods: number,
    drivers?: string[]
  ): string {
    const ytdVariance = ytdActual - ytdBudget;
    const ytdPct = ytdBudget !== 0 ? (ytdVariance / Math.abs(ytdBudget)) * 100 : 0;

    const fmt = (v: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(v);

    const projectedFullYear = ytdActual + (fullYearBudget - ytdBudget); // simple projection
    const projectedVariance = projectedFullYear - fullYearBudget;
    const projectedPct =
      fullYearBudget !== 0 ? (projectedVariance / Math.abs(fullYearBudget)) * 100 : 0;

    let outlook = `Based on year-to-date performance of ${fmt(ytdActual)} (${Math.abs(ytdPct).toFixed(1)}% ${ytdVariance >= 0 ? 'above' : 'below'} budget), `;

    if (Math.abs(projectedPct) < 3) {
      outlook += `${category} is expected to finish broadly in line with the full-year budget of ${fmt(fullYearBudget)}.`;
    } else if (projectedPct > 0) {
      outlook += `${category} is projected to outperform budget by approximately ${fmt(Math.abs(projectedVariance))} (${Math.abs(projectedPct).toFixed(1)}%) for the full year.`;
    } else {
      outlook += `${category} is at risk of underperforming budget by approximately ${fmt(Math.abs(projectedVariance))} (${Math.abs(projectedPct).toFixed(1)}%) for the full year.`;
    }

    if (drivers && drivers.length > 0) {
      outlook += ` Key factors: ${drivers.join(', ')}.`;
    }

    return outlook;
  }
}
