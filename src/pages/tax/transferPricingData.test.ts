import { describe, it, expect, beforeEach } from 'vitest';
import {
  deriveTPTransactions,
  computeMethodDistribution,
  classifyMethodFromText,
} from './transferPricingData';
import { IntercompanyMatchingEngine } from '@/engines/IntercompanyMatchingEngine';
import type { GLEntry } from '@/types';

/**
 * Phase 8 (row 16) transfer-pricing honesty: transactions are DERIVED
 * from the ledger, but a margin and an arm's-length range cannot be —
 * they need a cost base and a benchmark study, neither of which a GL
 * entry carries. Derived rows therefore report margin as not
 * derivable and status as 'review': nothing the tool derives may call
 * itself compliant, and no benchmark numbers may be invented.
 */

const ENTRIES = [
  {
    id: 'gl-1',
    accountCode: '4800',
    accountName: 'Royalty income',
    description: 'Royalty — license to SubCo',
    debit: 0,
    credit: 120000,
    amount: 120000,
    entityId: 'ParentCo',
  },
  {
    id: 'gl-2',
    accountCode: '1800',
    accountName: 'Due from SubCo',
    description: 'Intercompany management fee',
    debit: 45000,
    credit: 0,
    amount: 45000,
    entityId: 'ParentCo',
  },
  {
    id: 'gl-3',
    accountCode: '6010',
    accountName: 'Rent',
    description: 'Office rent (third party)',
    debit: 9000,
    credit: 0,
    amount: 9000,
    entityId: 'ParentCo',
  },
] as unknown as GLEntry[];

describe('deriveTPTransactions — derived, never fabricated', () => {
  beforeEach(() => {
    IntercompanyMatchingEngine.clear();
  });

  it('finds the intercompany postings and skips third-party entries', () => {
    const txs = deriveTPTransactions(ENTRIES);
    expect(txs.map((t) => t.id).sort()).toEqual(['gl-1', 'gl-2']);
    expect(txs.find((t) => t.id === 'gl-1')!.method).toBe('RPM'); // royalty
    expect(txs.find((t) => t.id === 'gl-2')!.amount).toBe(45000);
  });

  it('never invents a margin, a benchmark range, or a compliant status', () => {
    const txs = deriveTPTransactions(ENTRIES);
    for (const t of txs) {
      expect(t.margin).toBeNull();
      expect(t.armRange).toBe('Not benchmarked');
      expect(t.status).toBe('review');
    }
  });

  it('method distribution foots to the derived transactions', () => {
    const txs = deriveTPTransactions(ENTRIES);
    const dist = computeMethodDistribution(txs);
    expect(dist.reduce((a, d) => a + d.count, 0)).toBe(txs.length);
    expect(dist.reduce((a, d) => a + d.amount, 0)).toBe(165000);
  });

  it('classifies methods from service text', () => {
    expect(classifyMethodFromText('Royalty license')).toBe('RPM');
    expect(classifyMethodFromText('Manufacturing COGS recharge')).toBe('CPM');
    expect(classifyMethodFromText('Commodity benchmark sale')).toBe('CUP');
    expect(classifyMethodFromText('Joint profit split arrangement')).toBe('PSM');
    expect(classifyMethodFromText('Management services')).toBe('TNMM');
  });
});
