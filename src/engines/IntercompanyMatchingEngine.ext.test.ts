/**
 * IntercompanyMatchingEngine.ext.test.ts — matching, eliminations, netting,
 * minority interest, reconciliation, validation (MISSION D wave 2,
 * 2026-08-07). Static state is cleared between tests.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { IntercompanyMatchingEngine, type ICTransaction } from './IntercompanyMatchingEngine';

const tx = (over: Partial<ICTransaction> & { id: string }): ICTransaction => ({
  fromEntity: 'A',
  toEntity: 'B',
  amount: 100,
  currency: 'USD',
  accountCode: '4400',
  description: '',
  date: '2026-08-01',
  status: 'pending',
  ...over,
});

beforeEach(() => IntercompanyMatchingEngine.clear());

describe('IntercompanyMatchingEngine — matching', () => {
  it('autoMatch pairs mirror transactions within tolerance', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
      tx({ id: 'c1', fromEntity: 'B', toEntity: 'A', amount: -100 }),
      tx({ id: 'unmatched', fromEntity: 'A', toEntity: 'C', amount: 999 }),
    ]);
    const matches = IntercompanyMatchingEngine.autoMatch();
    expect(matches).toHaveLength(1);
    expect(matches[0]!.status).toBe('auto_matched');
    expect(matches[0]!.matchedAmount).toBe(-100); // Math.min(100, -100)
    expect(matches[0]!.variance).toBe(200);
    expect(IntercompanyMatchingEngine.getUnmatched().map((t) => t.id)).toEqual(['unmatched']);
    // already-matched transactions are not re-matched
    expect(IntercompanyMatchingEngine.autoMatch()).toHaveLength(0);
  });

  it('manualMatch requires both pending and records the user', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 50 }),
      tx({ id: 'c1', fromEntity: 'B', toEntity: 'A', amount: -50 }),
    ]);
    const m = IntercompanyMatchingEngine.manualMatch('d1', 'c1', 'controller')!;
    expect(m.status).toBe('manual_matched');
    expect(m.matchedBy).toBe('controller');
    expect(m.tolerance).toBe(0);
    expect(IntercompanyMatchingEngine.manualMatch('d1', 'c1', 'x')).toBeNull(); // no longer pending
    IntercompanyMatchingEngine.clear();
    IntercompanyMatchingEngine.addTransactions([tx({ id: 'd1' })]);
    expect(IntercompanyMatchingEngine.manualMatch('d1', 'nope', 'x')).toBeNull();
    expect(IntercompanyMatchingEngine.manualMatch('nope', 'nope', 'x')).toBeNull();
  });

  it('createEliminations once per match and flips status to eliminated', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
      tx({ id: 'c1', fromEntity: 'B', toEntity: 'A', amount: -100 }),
    ]);
    IntercompanyMatchingEngine.autoMatch();
    const elims = IntercompanyMatchingEngine.createEliminations('2026-08', 'u1');
    expect(elims).toHaveLength(1);
    expect(elims[0]!.period).toBe('2026-08');
    expect(elims[0]!.entityPair).toEqual(['A', 'B']);
    expect(IntercompanyMatchingEngine.createEliminations('2026-09', 'u1')).toHaveLength(0);
    expect(IntercompanyMatchingEngine.getEliminations()).toHaveLength(1);
    expect(IntercompanyMatchingEngine.getUnmatched()).toHaveLength(0);
  });
});

describe('IntercompanyMatchingEngine — analytics', () => {
  it('getSummaryByPair aggregates debits/credits by status', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
      tx({ id: 'c1', fromEntity: 'B', toEntity: 'A', amount: -100 }),
      tx({ id: 'd2', fromEntity: 'A', toEntity: 'B', amount: 50 }),
    ]);
    const summary = IntercompanyMatchingEngine.getSummaryByPair();
    const pair = summary.get('A↔B')!;
    expect(pair.totalDebits).toBe(150);
    expect(pair.totalCredits).toBe(-100);
    expect(pair.unmatched).toBe(3);
  });

  it('netICBalances computes the net position', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
      tx({ id: 'd2', fromEntity: 'B', toEntity: 'A', amount: 40 }),
    ]);
    const net = IntercompanyMatchingEngine.netICBalances('A', 'B');
    expect(net.netAmount).toBe('60.00');
    expect(net.currency).toBe('USD');
    expect(net.transactions).toHaveLength(2);
    // empty pair → zero
    expect(IntercompanyMatchingEngine.netICBalances('X', 'Y').netAmount).toBe('0.00');
  });

  it('calculateICInterest on the absolute principal', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
      tx({ id: 'd2', fromEntity: 'B', toEntity: 'A', amount: 40 }),
    ]);
    const i = IntercompanyMatchingEngine.calculateICInterest('A', 'B', 0.05, 365);
    expect(i.principal).toBe(60);
    expect(i.interestAmount).toBeCloseTo(3, 6); // 60 * 0.05
    expect(i.rate).toBe(0.05);
  });

  it('allocateMinorityInterest splits exactly with residual', () => {
    const split = IntercompanyMatchingEngine.allocateMinorityInterest(1000, 70, 'P', 'S');
    expect(split.parentShare).toBe(700);
    expect(split.minorityShare).toBe(300);
    expect(split.parentShare + split.minorityShare).toBe(1000);
    expect(split.ownershipPct).toBe(70);
  });

  it('eliminateICProfit records a profit elimination', () => {
    const e = IntercompanyMatchingEngine.eliminateICProfit(
      'Seller',
      'Buyer',
      500,
      'Inventory',
      'u1'
    );
    expect(e.eliminationAmount).toBe(500);
    expect(e.debitAccount).toBe('Cost of Goods Sold');
    expect(e.entityPair).toEqual(['Buyer', 'Seller']);
    expect(IntercompanyMatchingEngine.getEliminations()).toHaveLength(1);
  });
});

describe('IntercompanyMatchingEngine — reconciliation & validation', () => {
  it('reconcileICAccounts reports discrepancies over a cent', () => {
    const ok = IntercompanyMatchingEngine.reconcileICAccounts([
      { entityId: 'A', accountCode: '4400', balance: 100 },
      { entityId: 'B', accountCode: '4400', balance: -100 },
    ]);
    expect(ok.reconciled).toBe(true);
    const bad = IntercompanyMatchingEngine.reconcileICAccounts([
      { entityId: 'A', accountCode: '4400', balance: 100 },
      { entityId: 'B', accountCode: '4400', balance: -90 },
    ]);
    expect(bad.reconciled).toBe(false);
    expect(bad.discrepancies[0]!.variance).toBe(10);
    expect(bad.discrepancies[0]!.entityBalances).toEqual({ A: 100, B: -90 });
    // single-entity accounts are skipped
    const single = IntercompanyMatchingEngine.reconcileICAccounts([
      { entityId: 'A', accountCode: '9999', balance: 5 },
    ]);
    expect(single.reconciled).toBe(true);
  });

  it('generateICTransactions creates every ordered pair', () => {
    const txs = IntercompanyMatchingEngine.generateICTransactions(
      [
        { id: 'A', name: 'Alpha' },
        { id: 'B', name: 'Beta' },
        { id: 'C', name: 'Gamma' },
      ],
      { accountCode: '4400', description: 'IC Sale', baseAmount: 100 }
    );
    expect(txs).toHaveLength(3); // A→B, A→C, B→C
    expect(txs[0]!.description).toBe('IC Sale - Alpha → Beta');
    expect(IntercompanyMatchingEngine.getUnmatched()).toHaveLength(3);
  });

  it('matchICTransactions scores confidence and sorts', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 't1', fromEntity: 'A', toEntity: 'B', amount: 100, accountCode: '4400' }),
    ]);
    const matches = IntercompanyMatchingEngine.matchICTransactions([
      { id: 'g1', entityId: 'A', amount: 100, accountCode: '4400' }, // full match
      { id: 'g2', entityId: 'B', amount: 100, accountCode: '9999' }, // amount only
      { id: 'g3', entityId: 'C', amount: 100, accountCode: '4400' }, // wrong entity
    ]);
    expect(matches.map((m) => m.confidence).sort((a, b) => b - a)).toEqual([1, 0.5]);
    expect(matches[0]!.glEntry.id).toBe('g1');
  });

  it('validateICBalance nets to zero across entities and flags eliminations', () => {
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
      tx({ id: 'c1', fromEntity: 'B', toEntity: 'A', amount: 100 }),
    ]);
    const valid = IntercompanyMatchingEngine.validateICBalance();
    expect(valid.valid).toBe(true);
    // unbalanced pair
    IntercompanyMatchingEngine.clear();
    IntercompanyMatchingEngine.addTransactions([
      tx({ id: 'd1', fromEntity: 'A', toEntity: 'B', amount: 100 }),
    ]);
    const bad = IntercompanyMatchingEngine.validateICBalance();
    expect(bad.valid).toBe(false);
    expect(bad.imbalances.map((i) => i.entity).sort()).toEqual(['A', 'B']);
    expect(bad.totalImbalance).toBe(200);
  });
});
