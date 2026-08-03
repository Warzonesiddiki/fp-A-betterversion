/**
 * GAP-1 (F-0006) known-answer tests for AggregateTableEngine's money migration.
 *
 * Aggregates debit/credit/net from GL-like rows into pre-aggregated buckets
 * (monthly/quarterly/yearly/YTD). These feed reporting surfaces. Each case is
 * a FIXED input → EXACT expected decimal asserted with `toBe` (Object.is);
 * the pre-migration float literal is recorded inline where it differed.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AggregateTableEngine } from './AggregateTableEngine';

describe('AggregateTableEngine — money known answers (GAP-1 / F-0006)', () => {
  beforeEach(() => {
    AggregateTableEngine.invalidate();
  });

  const sampleData = [
    { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 0.1, credit: 0 },
    { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 0.2, credit: 0 },
  ];

  it('sums debits exactly (float gave 0.30000000000000004)', () => {
    AggregateTableEngine.aggregate(sampleData, 'monthly');
    const entry = AggregateTableEngine.query('E1', 'A1', '2026-01', 'monthly');
    expect(entry).toBeDefined();
    expect(entry!.debit).toBe(0.3);
    expect(entry!.net).toBe(0.3);
  });

  it('computes net exactly after credit (float gave 799.9999999999999 or similar)', () => {
    const data = [
      { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 1000.1, credit: 200.05 },
      { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 1500.2, credit: 300.03 },
    ];
    AggregateTableEngine.aggregate(data, 'monthly');
    const entry = AggregateTableEngine.query('E1', 'A1', '2026-01', 'monthly');
    // net = (1000.1 + 1500.2) - (200.05 + 300.03) = 2500.3 - 500.08 = 2000.22
    expect(entry!.debit).toBe(2500.3);
    expect(entry!.credit).toBe(500.08);
    expect(entry!.net).toBe(2000.22);
  });

  it('aggregates quarterly without drift', () => {
    const data = [
      { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 0.1, credit: 0 },
      { entityId: 'E1', accountId: 'A1', period: '2026-02', debit: 0.2, credit: 0 },
    ];
    AggregateTableEngine.aggregate(data, 'quarterly');
    const entry = AggregateTableEngine.query('E1', 'A1', '2026-Q1', 'quarterly');
    expect(entry!.debit).toBe(0.3);
  });

  it('handles multiple accounts and entities exactly', () => {
    const data = [
      { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 100.1, credit: 10.01 },
      { entityId: 'E1', accountId: 'A2', period: '2026-01', debit: 200.2, credit: 20.02 },
      { entityId: 'E2', accountId: 'A1', period: '2026-01', debit: 50.05, credit: 5.005 },
    ];
    AggregateTableEngine.aggregate(data, 'monthly');
    expect(AggregateTableEngine.query('E1', 'A1', '2026-01', 'monthly')!.debit).toBe(100.1);
    expect(AggregateTableEngine.query('E1', 'A2', '2026-01', 'monthly')!.net).toBe(180.18);
    // pre-migration: 50.05 - 5.005 = 45.045; now rounded to cents via money: 45.04
    expect(AggregateTableEngine.query('E2', 'A1', '2026-01', 'monthly')!.net).toBe(45.04);
  });

  it('returns exact values for YTD rollup', () => {
    const data = [
      { entityId: 'E1', accountId: 'A1', period: '2026-01', debit: 1.1, credit: 0.1 },
      { entityId: 'E1', accountId: 'A1', period: '2026-03', debit: 2.2, credit: 0.2 },
    ];
    AggregateTableEngine.aggregate(data, 'ytd');
    const entry = AggregateTableEngine.query('E1', 'A1', '2026-YTD', 'ytd');
    expect(entry!.debit).toBe(3.3);
    expect(entry!.net).toBe(3);
  });

  it('handles empty input without NaN', () => {
    AggregateTableEngine.aggregate([], 'monthly');
    const stats = AggregateTableEngine.getStats();
    expect(stats.totalEntries).toBe(0);
  });
});
