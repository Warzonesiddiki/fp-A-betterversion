/**
 * Telecom-dashboard figures derivable from the recorded telecom workspace.
 *
 * CORRECTNESS CONTRACT (K18 — wrong numbers are Severity-0):
 *
 * 1. ARPU is money: it is aggregated with decimal.js via `@/utils/money`
 *    (`sumMoney` then `divideMoney`), never with float `+` / `/`.
 * 2. Every displayed figure comes from recorded store data — subscribers,
 *    network metrics or ARPU trend rows the user actually imported. There is
 *    NO demo fallback: when nothing is recorded the page empty-states.
 * 3. Metrics this workspace does not record — segment revenue, network
 *    CapEx, churn events, EBITDA, coverage, acquisition cost — are not shown
 *    at all. A missing metric renders as disclosure, never as a literal.
 */

import { divideMoney, sumMoney } from '@/utils/money';

export interface TelecomSubscriberInput {
  readonly monthlyRevenue: number;
  readonly churnRisk: 'Low' | 'Medium' | 'High';
  readonly status: 'Active' | 'Suspended' | 'Churned';
}

export interface TelecomNetworkMetricInput {
  readonly region: string;
  /** Percent, as recorded. */
  readonly uptime: number;
  readonly avgSpeed: number;
  readonly subscribers: number;
}

export interface TelecomArpuTrendInput {
  readonly month: string;
  readonly arpu: number;
  readonly subscribers: number;
}

export interface TelecomDashboardData {
  readonly activeSubscribers: number;
  /** Mean monthly revenue of ACTIVE subscribers. `null` when none active. */
  readonly arpu: number | null;
  /** Recorded churn-risk mix over active subscribers. */
  readonly churnRisk: { low: number; medium: number; high: number };
  readonly networkMetrics: readonly TelecomNetworkMetricInput[];
  readonly arpuTrends: readonly TelecomArpuTrendInput[];
  /** Recorded subscriber counts by month (from the ARPU trend rows). */
  readonly subscriberHistory: readonly { month: string; subscribers: number }[];
}

/**
 * Returns `null` when the workspace has recorded nothing — the page must
 * empty-state instead of rendering a fictional operator.
 */
export function deriveTelecomDashboard(
  subscribers: readonly TelecomSubscriberInput[],
  networkMetrics: readonly TelecomNetworkMetricInput[],
  arpuTrends: readonly TelecomArpuTrendInput[]
): TelecomDashboardData | null {
  if (subscribers.length === 0 && networkMetrics.length === 0 && arpuTrends.length === 0) {
    return null;
  }

  const active = subscribers.filter((s) => s.status === 'Active');
  const arpu =
    active.length > 0
      ? divideMoney(sumMoney(active.map((s) => s.monthlyRevenue)), active.length)
          .toDecimalPlaces(2)
          .toNumber()
      : null;

  return {
    activeSubscribers: active.length,
    arpu,
    churnRisk: {
      low: active.filter((s) => s.churnRisk === 'Low').length,
      medium: active.filter((s) => s.churnRisk === 'Medium').length,
      high: active.filter((s) => s.churnRisk === 'High').length,
    },
    networkMetrics,
    arpuTrends,
    subscriberHistory: arpuTrends.map((t) => ({ month: t.month, subscribers: t.subscribers })),
  };
}
