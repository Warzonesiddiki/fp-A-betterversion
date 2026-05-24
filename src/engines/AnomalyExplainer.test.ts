import { describe, it, expect } from 'vitest';
import { AnomalyExplainer, type Anomaly, type FinancialContext } from './AnomalyExplainer';

describe('AnomalyExplainer', () => {
  const sampleAnomaly: Anomaly = {
    id: 'anomaly-1',
    type: 'variance',
    metric: 'revenue',
    value: 15000,
    expected: 10000,
    deviation: 0.5,
    period: '2024-03',
  };

  const sampleContext: FinancialContext = {
    priorPeriods: [
      { period: '2024-02', value: 9000 },
      { period: '2024-01', value: 9500 },
      { period: '2023-12', value: 10000 },
      { period: '2023-11', value: 10500 },
      { period: '2023-10', value: 11000 },
    ],
    journalEntries: [{ date: '2024-03-15', description: 'Large customer payment', amount: 14500 }],
  };

  describe('explainAnomaly', () => {
    it('should explain revenue spike anomaly', () => {
      const result = AnomalyExplainer.explainAnomaly(sampleAnomaly, sampleContext);
      expect(result.summary).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.possibleCauses).toBeInstanceOf(Array);
    });

    it('should explain cost anomaly', () => {
      const costAnomaly: Anomaly = {
        id: 'anomaly-2',
        type: 'spike',
        metric: 'cost',
        value: 8000,
        expected: 5000,
        deviation: 0.6,
        period: '2024-03',
      };
      const result = AnomalyExplainer.explainAnomaly(costAnomaly, sampleContext);
      expect(result.summary).toBeDefined();
    });

    it('should handle negative deviation (decrease)', () => {
      const decreaseAnomaly: Anomaly = {
        ...sampleAnomaly,
        value: 5000,
        expected: 10000,
        deviation: -0.5,
      };
      const result = AnomalyExplainer.explainAnomaly(decreaseAnomaly, sampleContext);
      expect(result.summary).toBeDefined();
    });
  });

  describe('crossReference', () => {
    it('should return findings when context has journal entries', () => {
      const findings = AnomalyExplainer.crossReference(sampleAnomaly, sampleContext);
      expect(findings).toBeInstanceOf(Array);
      expect(findings.length).toBeGreaterThan(0);
    });

    it('should return empty when context has no journal entries', () => {
      const findings = AnomalyExplainer.crossReference(sampleAnomaly, {});
      expect(findings).toHaveLength(0);
    });
  });

  describe('rankBySeverity', () => {
    it('should sort anomalies by absolute deviation descending', () => {
      const anomalies: Anomaly[] = [
        sampleAnomaly,
        {
          id: 'anomaly-3',
          type: 'variance',
          metric: 'cost',
          value: 8000,
          expected: 5000,
          deviation: 0.6,
          period: '2024-03',
        },
      ];
      const ranked = AnomalyExplainer.rankBySeverity(anomalies);
      expect(ranked).toHaveLength(2);
      expect(Math.abs(ranked[0].deviation)).toBeGreaterThanOrEqual(Math.abs(ranked[1].deviation));
    });

    it('should handle empty array', () => {
      const ranked = AnomalyExplainer.rankBySeverity([]);
      expect(ranked).toHaveLength(0);
    });
  });
});
