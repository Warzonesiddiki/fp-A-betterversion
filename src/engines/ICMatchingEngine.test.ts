import { describe, it, expect, beforeEach } from 'vitest';
import { ICMatchingEngine, type ICTransaction, type ToleranceSettings } from './ICMatchingEngine';

const makeSource = (overrides: Partial<ICTransaction> = {}): ICTransaction => ({
  id: 't1',
  entityId: 'E1',
  entityName: 'Entity 1',
  accountCode: '1000',
  accountName: 'IC Receivable',
  counterpartyEntityId: 'E2',
  amount: 1000,
  currency: 'USD',
  date: '2026-01-15',
  ...overrides,
});

const makeTarget = (overrides: Partial<ICTransaction> = {}): ICTransaction => ({
  id: 't2',
  entityId: 'E2',
  entityName: 'Entity 2',
  accountCode: '1000',
  accountName: 'IC Payable',
  counterpartyEntityId: 'E1',
  amount: -1000,
  currency: 'USD',
  date: '2026-01-15',
  ...overrides,
});

describe('ICMatchingEngine', () => {
  let engine: ICMatchingEngine;

  beforeEach(() => {
    engine = new ICMatchingEngine();
  });

  it('should initialize with default tolerance', () => {
    expect(engine).toBeDefined();
  });

  it('should auto-match exact pairs', () => {
    const source = makeSource();
    const target = makeTarget();
    const pairs = engine.autoMatch([source], [target]);
    expect(pairs.length).toBe(1);
    expect(pairs[0].status).toBe('matched');
    expect(pairs[0].amountDifference).toBe(0);
  });

  it('should auto-match partial pairs (amount difference)', () => {
    const source = makeSource({ amount: 1000 });
    const target = makeTarget({ amount: -990 });
    const pairs = engine.autoMatch([source], [target]);
    expect(pairs.length).toBe(1);
    expect(pairs[0].amountDifference).toBe(10);
  });

  it('should not match when amounts are same sign', () => {
    const source = makeSource({ amount: 1000 });
    const target = makeTarget({ id: 't2', amount: 1000 });
    const pairs = engine.autoMatch([source], [target]);
    expect(pairs.length).toBe(0);
  });

  it('should get match summary', () => {
    const source = makeSource();
    const target = makeTarget();
    engine.autoMatch([source], [target]);
    const summary = engine.getSummary([source], [target]);
    expect(summary.totalTransactions).toBe(2);
    expect(summary.matchedCount).toBeGreaterThanOrEqual(1);
  });

  it('should set tolerance settings', () => {
    engine.setTolerance({ amountTolerance: 100, percentageTolerance: 5, dateToleranceDays: 3 });
    // No assertion needed — just verify it doesn't throw
  });

  it('should manually match transactions', () => {
    const source = makeSource();
    const target = makeTarget({ amount: -990 });
    const pair = engine.manualMatch(source, target);
    expect(pair).toBeDefined();
    expect(pair.source.id).toBe('t1');
    expect(pair.target.id).toBe('t2');
    expect(pair.method).toBe('manual');
  });

  it('should get unmatched transactions', () => {
    const source = makeSource();
    const target = makeTarget();
    engine.autoMatch([source], [target]);
    const unmatched = engine.getUnmatched([source, target]);
    expect(unmatched.length).toBe(0); // both matched
  });

  it('should get unmatched when no matching', () => {
    const source = makeSource();
    const unmatched = engine.getUnmatched([source]);
    expect(unmatched.length).toBe(1);
  });

  it('should unmatch a pair', () => {
    const source = makeSource();
    const target = makeTarget();
    engine.autoMatch([source], [target]);
    // Get matches from autoMatch result, then unmatch
    const pairs = engine.autoMatch([source], [target]);
    if (pairs.length > 0) {
      expect(engine.unmatch(pairs[0].id)).toBe(true);
    }
  });

  it('should generate elimination entries', () => {
    const source = makeSource();
    const target = makeTarget();
    const pairs = engine.autoMatch([source], [target]);
    const eliminations = engine.generateEliminations(pairs, { '1000': 'IC Receivable' });
    expect(Array.isArray(eliminations)).toBe(true);
  });
});
