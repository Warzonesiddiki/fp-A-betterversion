/**
 * Anomaly Explainer — Context-aware anomaly explanation
 */

import { formatMoney } from '../utils/money';

export interface Anomaly {
  id: string;
  type: 'variance' | 'spike' | 'drop' | 'trend_break' | 'outlier';
  metric: string;
  value: number;
  expected: number;
  deviation: number;
  period: string;
  entityId?: string;
  accountId?: string;
}

export interface Explanation {
  anomalyId: string;
  summary: string;
  possibleCauses: string[];
  relatedEvents: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface FinancialContext {
  journalEntries?: Array<{ date: string; description: string; amount: number }>;
  approvals?: Array<{ date: string; action: string; user: string }>;
  calendarEvents?: Array<{ date: string; event: string }>;
  priorPeriods?: Array<{ period: string; value: number }>;
}

export class AnomalyExplainer {
  static explainAnomaly(anomaly: Anomaly, context: FinancialContext): Explanation {
    const causes: string[] = [];
    const events: string[] = [];
    const actions: string[] = [];

    // Analyze based on anomaly type
    switch (anomaly.type) {
      case 'spike':
        causes.push('Large one-time transaction', 'Timing difference', 'Error in data entry');
        actions.push('Review journal entries for the period', 'Check for duplicate entries');
        break;
      case 'drop':
        causes.push('Revenue shortfall', 'Delayed recognition', 'Business discontinuation');
        actions.push('Verify completeness of data', 'Check for cutoff errors');
        break;
      case 'variance':
        if (anomaly.deviation > 0) {
          causes.push('Higher than expected activity', 'Price increase', 'Volume growth');
        } else {
          causes.push('Lower than expected activity', 'Market decline', 'Customer churn');
        }
        actions.push('Compare to prior year', 'Review budget assumptions');
        break;
      case 'trend_break':
        causes.push('Change in business model', 'New product launch', 'Market shift');
        actions.push(
          'Analyze root cause with business team',
          'Update forecast if trend is permanent'
        );
        break;
      case 'outlier':
        causes.push('Data entry error', 'One-time event', 'Related party transaction');
        actions.push('Verify data accuracy', 'Check for supporting documentation');
        break;
    }

    // Cross-reference with journal entries
    if (context.journalEntries?.length) {
      const related = context.journalEntries.filter(
        (j) => Math.abs(j.amount - anomaly.value) / anomaly.value < 0.1
      );
      if (related.length > 0) {
        events.push(`Found ${related.length} journal entries with similar amounts`);
        causes.push('Specific journal entry identified — review for accuracy');
      }
    }

    // Cross-reference with approvals
    if (context.approvals?.length) {
      const recent = context.approvals.filter((a) => {
        const daysDiff = (Date.now() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff < 30;
      });
      if (recent.length > 0) {
        events.push(`${recent.length} recent approval(s) may be related`);
      }
    }

    // Cross-reference with calendar
    if (context.calendarEvents?.length) {
      for (const event of context.calendarEvents) {
        events.push(`Calendar: ${event.event} on ${event.date}`);
      }
    }

    // Compare to prior periods
    if (context.priorPeriods?.length) {
      const avg =
        context.priorPeriods.reduce((s, p) => s + p.value, 0) / context.priorPeriods.length;
      if (Math.abs(anomaly.value - avg) / avg > 0.2) {
        causes.push(
          `Value is ${formatMoney((anomaly.value / avg - 1) * 100, { places: 0 })}% different from historical average`
        );
      }
    }

    const summary = `${anomaly.metric} of ${formatMoney(anomaly.value, { places: 0 })} in ${anomaly.period} is ${formatMoney(Math.abs(anomaly.deviation), { places: 1 })}% ${anomaly.deviation > 0 ? 'above' : 'below'} expected (${formatMoney(anomaly.expected, { places: 0 })}).`;

    return {
      anomalyId: anomaly.id,
      summary,
      possibleCauses: causes,
      relatedEvents: events,
      recommendedActions: actions,
      confidence: events.length > 0 ? 0.8 : 0.5,
    };
  }

  static crossReference(anomaly: Anomaly, context: FinancialContext): string[] {
    const findings: string[] = [];
    if (context.journalEntries) {
      const matching = context.journalEntries.filter(
        (j) => Math.abs(j.amount - anomaly.value) < anomaly.value * 0.05
      );
      if (matching.length > 0) {
        findings.push(`${matching.length} journal entries within 5% of anomaly amount`);
      }
    }
    return findings;
  }

  static rankBySeverity(anomalies: Anomaly[]): Anomaly[] {
    return [...anomalies].sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  }
}
