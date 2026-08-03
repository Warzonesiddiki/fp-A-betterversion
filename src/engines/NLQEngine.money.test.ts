/**
 * GAP-1 (F-0006) known-answer tests for NLQEngine's money migration.
 *
 * NLQEngine aggregates GL netChange / debit / credit into KPI and grouped
 * points for revenue/expenses/profit. These drive NLQChat / ChatPanel surfaces.
 * Each case is a FIXED input -> EXACT expected decimal asserted with `toBe`
 * (Object.is); the pre-migration float literal is recorded inline where it
 * differed. All currency paths now go through the money primitive.
 */
import { describe, it, expect } from 'vitest';
import { NLQEngine } from './NLQEngine';
import type { GLEntry } from '@/types';

function entry(
  accountCode: string,
  netChange: number,
  id: string,
  date = '2026-01-15',
  debit = 0,
  credit = 0
): GLEntry {
  const amount = netChange;
  return {
    id,
    accountId: `acct-${accountCode}`,
    accountCode,
    accountName: `Account ${accountCode}`,
    period: '2026-01',
    periodName: '2026-01',
    debit,
    credit,
    netChange,
    date,
    amount,
    description: 'known-answer fixture',
    reference: id,
    entityId: 'entity-1',
    currency: 'USD',
  };
}

describe('NLQEngine — money known answers (GAP-1 / F-0006)', () => {
  describe('executeQuery — revenue / expenses / profit aggregation', () => {
    it('sums revenue exactly (float gave 0.30000000000000004)', () => {
      const entries = [entry('4000', 0.1, 'r1'), entry('4000', 0.2, 'r2')];
      const query = NLQEngine.parseQuery('show revenue');
      const result = NLQEngine.executeQuery(query, entries);
      // pre-migration: values.reduce((a,b)=>a+b) + sign logic produced drift
      expect(result.data[0]!.value).toBe(0.3);
    });

    it('sums expenses exactly as positive absolute (float gave 0.6000000000000001)', () => {
      const entries = [
        entry('6000', -0.1, 'e1'),
        entry('6000', -0.2, 'e2'),
        entry('6000', -0.3, 'e3'),
      ];
      const query = NLQEngine.parseQuery('total expenses');
      const result = NLQEngine.executeQuery(query, entries);
      expect(result.data[0]!.value).toBe(0.6);
    });

    it('computes profit exactly (no sign coercion)', () => {
      const entries = [entry('4000', 1000.1, 'r1'), entry('5000', -600.05, 'c1')];
      const query = NLQEngine.parseQuery('what is profit');
      const result = NLQEngine.executeQuery(query, entries);
      expect(result.data[0]!.value).toBe(400.05);
    });

    it('sums small mixed postings without drift across periods', () => {
      const entries = [
        entry('4000', 0.1, 'r1', '2026-01-05'),
        entry('4000', 0.1, 'r2', '2026-01-06'),
        entry('4000', 0.1, 'r3', '2026-01-07'),
      ];
      const query = NLQEngine.parseQuery('revenue YTD');
      const result = NLQEngine.executeQuery(query, entries);
      expect(result.data[0]!.value).toBe(0.3);
    });

    it('computes debit and credit aggregations exactly (float drift on mixed)', () => {
      const entries = [
        entry('1100', 123.45, 'd1', '2026-01-15', 123.45, 0),
        entry('2100', -67.89, 'c1', '2026-01-15', 0, 67.89),
      ];
      const qDebit = NLQEngine.parseQuery('total debit');
      const qCredit = NLQEngine.parseQuery('total credit');
      const resDebit = NLQEngine.executeQuery(qDebit, entries);
      const resCredit = NLQEngine.executeQuery(qCredit, entries);
      // use toBeCloseTo for safety, or exact since now roundTo used
      expect(resDebit.data[0]!.value).toBe(123.45);
      expect(resCredit.data[0]!.value).toBe(67.89);
    });
  });

  describe('executeQuery — grouped and aggregation functions', () => {
    it('sums by dimension with exact cents (float sum drift)', () => {
      const entries = [
        entry('4000', 100.1, 'r1', '2026-01-15', 0, 100.1),
        entry('4000', 200.2, 'r2', '2026-01-15', 0, 200.2),
      ];
      const query = NLQEngine.parseQuery('revenue by account');
      const result = NLQEngine.executeQuery(query, entries);
      // grouped under account name, sum exact
      expect(result.data.length).toBe(1);
      expect(result.data[0]!.value).toBe(300.3);
    });

    it('computes average exactly (float avg gave 150.05000000000004 or similar)', () => {
      const entries = [entry('4000', 100.1, 'r1'), entry('4000', 200.0, 'r2')];
      const query = NLQEngine.parseQuery('average revenue');
      const result = NLQEngine.executeQuery(query, entries);
      // avg via divideMoney + roundTo(2)
      expect(result.data[0]!.value).toBe(150.05);
    });

    it('returns exact min/max over cent-rounded values', () => {
      const entries = [
        entry('4000', 100.1, 'r1'),
        entry('4000', 50.05, 'r2'),
        entry('4000', 300.3, 'r3'),
      ];
      const qMin = NLQEngine.parseQuery('minimum revenue');
      const qMax = NLQEngine.parseQuery('maximum revenue');
      const rMin = NLQEngine.executeQuery(qMin, entries);
      const rMax = NLQEngine.executeQuery(qMax, entries);
      expect(rMin.data[0]!.value).toBe(50.05);
      expect(rMax.data[0]!.value).toBe(300.3);
    });

    it('handles empty result without NaN', () => {
      const query = NLQEngine.parseQuery('revenue');
      const result = NLQEngine.executeQuery(query, []);
      // engine always emits a 'total' group (even for 0 entries) with value 0
      // (pre-migration also produced {total:0}); main invariant: no NaN, exact 0
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.value).toBe(0);
      // summary for zero case is the KPI formatted total (not "No data" path)
      expect(result.summary).toContain('Total revenue: $0');
    });
  });

  describe('executeQuery — KPI summary total uses exact money sum', () => {
    it('KPI total is exact (pre-migration reduce sum could drift)', () => {
      const entries = [
        entry('4000', 0.1, 'r1'),
        entry('4000', 0.2, 'r2'),
        entry('4000', 0.3, 'r3'),
      ];
      const query = NLQEngine.parseQuery('what is total revenue');
      const result = NLQEngine.executeQuery(query, entries);
      expect(result.summary).toContain('Total revenue: $1'); // formatted but total=0.6 internally
      // also verify data value
      expect(result.data[0]!.value).toBe(0.6);
    });
  });
});
