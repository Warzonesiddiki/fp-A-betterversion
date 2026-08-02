import { describe, it, expect } from 'vitest';
import { ForecastReconciliationEngine, type ForecastSource } from './ForecastReconciliationEngine';

const sources: ForecastSource[] = [
  {
    name: 'TopDown',
    type: 'top_down',
    entries: [{ accountCode: '4000', accountName: 'Rev', period: '2026-06', amount: 1200000 }],
  },
  {
    name: 'BottomUp',
    type: 'bottom_up',
    entries: [{ accountCode: '4000', accountName: 'Rev', period: '2026-06', amount: 1180000 }],
  },
];

describe('ForecastReconciliationEngine (money migration)', () => {
  it('reconcile returns exact cents on variances', () => {
    const result = ForecastReconciliationEngine.reconcile(sources);
    expect(result.variances[0].maxVariance).toBe(20000.00);
  });

  it('merge average returns exact cents', () => {
    const merged = ForecastReconciliationEngine.merge(sources, 'average');
    expect(merged[0].amount).toBe(1190000.00);
  });
});