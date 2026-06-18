/**
 * @fileoverview Forecast Reconciliation Engine — Reconcile top-down vs bottom-up forecasts (variance analysis, convergence tracking, merge strategies)
 * @purity-tier 1 PURE
 * @iron-rule C1✓ No I/O | C2✓ No DOM | C3✓ Deterministic | C4✓ No global mutation
 * @category Forecasting
 * @sector 16 (Cross-sector — forecast reconciliation)
 * @since 1.0.0
 * @author Metis (purity audit 2026-06-18, T-3.26.6 JSDoc bulk — 30th engine)
 * @see docs/CAVEMAN_PERSIST/CYCLE_25_TURN_381_PLUS_METIS_T3_26_180_PLUS_ENGINES_PURE_FUNCTION_AUDIT_2ND_WITNESS_v0_2.md
 */

export interface ForecastSource {
  name: string;
  type: 'top_down' | 'bottom_up' | 'statistical' | 'driver_based';
  entries: ForecastEntry[];
}

export interface ForecastEntry {
  accountCode: string;
  accountName: string;
  period: string;
  amount: number;
}

export interface ReconciliationVariance {
  accountCode: string;
  accountName: string;
  period: string;
  sources: Array<{ name: string; amount: number }>;
  maxVariance: number;
  maxVariancePercent: number;
  flag: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReconciliationResult {
  variances: ReconciliationVariance[];
  summary: {
    totalAccounts: number;
    lowFlag: number;
    mediumFlag: number;
    highFlag: number;
    criticalFlag: number;
    averageVariancePercent: number;
  };
  mergedForecast: ForecastEntry[];
}

export type MergeStrategy =
  | 'average'
  | 'weighted'
  | 'top_down_priority'
  | 'bottom_up_priority'
  | 'most_recent';

export class ForecastReconciliationEngine {
  /**
   * Reconcile multiple forecast sources and identify variances.
   */
  static reconcile(sources: ForecastSource[]): ReconciliationResult {
    // Build account/period map
    const accountMap = new Map<string, Map<string, Array<{ name: string; amount: number }>>>();

    for (const source of sources) {
      for (const entry of source.entries) {
        const key = entry.accountCode;
        if (!accountMap.has(key)) accountMap.set(key, new Map());
        const periodMap = accountMap.get(key)!;
        if (!periodMap.has(entry.period)) periodMap.set(entry.period, []);
        periodMap.get(entry.period)!.push({ name: source.name, amount: entry.amount });
      }
    }

    const variances: ReconciliationVariance[] = [];

    for (const [accountCode, periodMap] of accountMap) {
      for (const [period, sourceAmounts] of periodMap) {
        if (sourceAmounts.length < 2) continue;

        const amounts = sourceAmounts.map((s) => s.amount);
        const max = Math.max(...amounts);
        const min = Math.min(...amounts);
        const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        const maxVariance = max - min;
        const maxVariancePercent = avg !== 0 ? (maxVariance / Math.abs(avg)) * 100 : 0;

        let flag: 'low' | 'medium' | 'high' | 'critical';
        if (maxVariancePercent < 5) flag = 'low';
        else if (maxVariancePercent < 15) flag = 'medium';
        else if (maxVariancePercent < 30) flag = 'high';
        else flag = 'critical';

        variances.push({
          accountCode,
          accountName: '',
          period,
          sources: sourceAmounts,
          maxVariance,
          maxVariancePercent,
          flag,
        });
      }
    }

    const summary = {
      totalAccounts: variances.length,
      lowFlag: variances.filter((v) => v.flag === 'low').length,
      mediumFlag: variances.filter((v) => v.flag === 'medium').length,
      highFlag: variances.filter((v) => v.flag === 'high').length,
      criticalFlag: variances.filter((v) => v.flag === 'critical').length,
      averageVariancePercent:
        variances.length > 0
          ? variances.reduce((s, v) => s + v.maxVariancePercent, 0) / variances.length
          : 0,
    };

    const mergedForecast = this.merge(sources, 'average');

    return { variances, summary, mergedForecast };
  }

  /**
   * Merge multiple forecast sources using a strategy.
   */
  static merge(
    sources: ForecastSource[],
    strategy: MergeStrategy,
    weights?: number[]
  ): ForecastEntry[] {
    const accountMap = new Map<string, Map<string, number[]>>();

    for (const source of sources) {
      for (const entry of source.entries) {
        if (!accountMap.has(entry.accountCode)) accountMap.set(entry.accountCode, new Map());
        const periodMap = accountMap.get(entry.accountCode)!;
        if (!periodMap.has(entry.period)) periodMap.set(entry.period, []);
        periodMap.get(entry.period)!.push(entry.amount);
      }
    }

    const result: ForecastEntry[] = [];

    for (const [accountCode, periodMap] of accountMap) {
      for (const [period, amounts] of periodMap) {
        let merged: number;
        switch (strategy) {
          case 'average':
            merged = amounts.reduce((s, a) => s + a, 0) / amounts.length;
            break;
          case 'weighted':
            if (weights && weights.length === amounts.length) {
              const totalWeight = weights.reduce((s, w) => s + w, 0);
              merged = amounts.reduce((s, a, i) => s + a * weights![i]!, 0) / totalWeight;
            } else {
              merged = amounts.reduce((s, a) => s + a, 0) / amounts.length;
            }
            break;
          case 'top_down_priority':
            merged = amounts[0] ?? 0;
            break;
          case 'bottom_up_priority':
            merged = amounts[amounts.length - 1] ?? 0;
            break;
          case 'most_recent':
            merged = amounts[amounts.length - 1] ?? 0;
            break;
          default:
            merged = amounts.reduce((s, a) => s + a, 0) / amounts.length;
        }
        result.push({ accountCode, accountName: '', period, amount: merged });
      }
    }

    return result;
  }
}
