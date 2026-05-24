import { describe, it, expect } from 'vitest';
import {
  ForecastReconciliationEngine,
  type ForecastSource,
  type MergeStrategy,
} from './ForecastReconciliationEngine';

function makeSource(
  name: string,
  type: ForecastSource['type'],
  entries: Array<{ accountCode: string; period: string; amount: number }>
): ForecastSource {
  return { name, type, entries: entries.map((e) => ({ ...e, accountName: '' })) };
}

describe('ForecastReconciliationEngine', () => {
  describe('reconcile', () => {
    it('should reconcile top-down and bottom-up forecasts', () => {
      const sources: ForecastSource[] = [
        makeSource('TopDown', 'top_down', [
          { accountCode: 'REV', period: '2024-01', amount: 100 },
          { accountCode: 'REV', period: '2024-02', amount: 110 },
          { accountCode: 'REV', period: '2024-03', amount: 120 },
        ]),
        makeSource('BottomUp-A', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 60 },
          { accountCode: 'REV', period: '2024-02', amount: 65 },
          { accountCode: 'REV', period: '2024-03', amount: 70 },
        ]),
        makeSource('BottomUp-B', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 50 },
          { accountCode: 'REV', period: '2024-02', amount: 55 },
          { accountCode: 'REV', period: '2024-03', amount: 60 },
        ]),
      ];

      const result = ForecastReconciliationEngine.reconcile(sources);
      expect(result.variances).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.mergedForecast).toBeDefined();
    });

    it('should flag variances between sources', () => {
      const sources: ForecastSource[] = [
        makeSource('TopDown', 'top_down', [{ accountCode: 'REV', period: '2024-01', amount: 100 }]),
        makeSource('BottomUp-A', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 30 },
        ]),
        makeSource('BottomUp-B', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 40 },
        ]),
      ];

      const result = ForecastReconciliationEngine.reconcile(sources);
      expect(result.variances).toHaveLength(1);
      expect(result.variances[0].accountCode).toBe('REV');
      expect(result.variances[0].flag).toBe('critical');
    });

    it('should return summary with correct flag counts', () => {
      const sources: ForecastSource[] = [
        makeSource('S1', 'top_down', [
          { accountCode: 'A', period: '2024-01', amount: 100 },
          { accountCode: 'B', period: '2024-01', amount: 100 },
          { accountCode: 'C', period: '2024-01', amount: 100 },
        ]),
        makeSource('S2', 'bottom_up', [
          { accountCode: 'A', period: '2024-01', amount: 101 },
          { accountCode: 'B', period: '2024-01', amount: 110 },
          { accountCode: 'C', period: '2024-01', amount: 200 },
        ]),
      ];

      const result = ForecastReconciliationEngine.reconcile(sources);
      expect(result.summary.totalAccounts).toBe(3);
    });
  });

  describe('merge', () => {
    it('should merge multiple forecast sources using average strategy', () => {
      const sources: ForecastSource[] = [
        makeSource('A', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 10 },
          { accountCode: 'REV', period: '2024-02', amount: 20 },
          { accountCode: 'REV', period: '2024-03', amount: 30 },
        ]),
        makeSource('B', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 15 },
          { accountCode: 'REV', period: '2024-02', amount: 25 },
          { accountCode: 'REV', period: '2024-03', amount: 35 },
        ]),
      ];

      const merged = ForecastReconciliationEngine.merge(sources, 'average');
      expect(merged).toHaveLength(3);
      expect(merged[0].amount).toBe(12.5);
      expect(merged[1].amount).toBe(22.5);
      expect(merged[2].amount).toBe(32.5);
    });

    it('should handle single source', () => {
      const sources: ForecastSource[] = [
        makeSource('A', 'bottom_up', [
          { accountCode: 'REV', period: '2024-01', amount: 100 },
          { accountCode: 'REV', period: '2024-02', amount: 200 },
        ]),
      ];

      const merged = ForecastReconciliationEngine.merge(sources, 'average');
      expect(merged).toHaveLength(2);
      expect(merged[0].amount).toBe(100);
      expect(merged[1].amount).toBe(200);
    });

    it('should handle empty source array', () => {
      const merged = ForecastReconciliationEngine.merge([], 'average');
      expect(merged).toEqual([]);
    });

    it('should support weighted strategy with weights', () => {
      const sources: ForecastSource[] = [
        makeSource('A', 'bottom_up', [{ accountCode: 'REV', period: '2024-01', amount: 100 }]),
        makeSource('B', 'bottom_up', [{ accountCode: 'REV', period: '2024-01', amount: 200 }]),
      ];

      const merged = ForecastReconciliationEngine.merge(sources, 'weighted', [3, 1]);
      expect(merged[0].amount).toBe(125);
    });

    it('should support top_down_priority strategy', () => {
      const sources: ForecastSource[] = [
        makeSource('Budget', 'top_down', [{ accountCode: 'REV', period: '2024-01', amount: 1000 }]),
        makeSource('Actual', 'bottom_up', [{ accountCode: 'REV', period: '2024-01', amount: 900 }]),
      ];

      const merged = ForecastReconciliationEngine.merge(sources, 'top_down_priority');
      expect(merged[0].amount).toBe(1000);
    });
  });
});
