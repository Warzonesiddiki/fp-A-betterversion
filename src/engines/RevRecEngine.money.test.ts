import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { RevRecEngine, type Contract } from './RevRecEngine';

/**
 * Money-discipline probe for RevRecEngine (session 024 / L1 FP&A Controller
 * lens). ASC 606 allocation and contract-asset/liability balances are
 * money: pre-session-024 the standalone-price total used float `reduce`,
 * the allocation percentage used float `/`, and the billed/recognized
 * running totals used `+=` and float subtraction — so a contract asset of
 * 10.10 + 20.20 emitted 30.299999999999997 instead of 30.30.
 */

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');
}

const BASE_CONTRACT: Contract = {
  id: 'ct-1',
  customerId: 'cust-1',
  startDate: '2025-01-01',
  endDate: '2025-03-31',
  totalValue: 120000,
  paymentTerms: 'Net 30',
  performanceObligations: [
    {
      id: 'po-1',
      description: 'License',
      standalonePrice: 80000,
      allocationPercentage: 0,
      recognitionMethod: 'point_in_time',
      recognitionDate: '2025-01-15',
      completionMetric: 1,
    },
    {
      id: 'po-2',
      description: 'Support',
      standalonePrice: 40000,
      allocationPercentage: 0,
      recognitionMethod: 'over_time',
      recognitionPattern: 'straight_line',
    },
  ],
};

describe('RevRecEngine — source guards', () => {
  const src = stripComments(fs.readFileSync(path.resolve(__dirname, './RevRecEngine.ts'), 'utf8'));

  it('no float accumulation or division over standalone prices remains', () => {
    expect(src).not.toMatch(/acc \+ \(Number\.isFinite/);
    expect(src).not.toMatch(/standalonePrice \/ totalStandalone/);
    expect(src).not.toMatch(/weights\.reduce/);
  });

  it('no float accumulation or subtraction in contract asset/liability', () => {
    expect(src).not.toMatch(/cumulativeBilled \+= billed/);
    expect(src).not.toMatch(/cumulativeRecognized - cumulativeBilled/);
    expect(src).not.toMatch(/contractAsset - contractLiability/);
  });

  it('routes the flagged arithmetic through @/utils/money', () => {
    expect(src).toMatch(/sumMoney/);
    expect(src).toMatch(/divideMoney/);
    expect(src).toMatch(/addMoney/);
  });
});

describe('RevRecEngine — decimal known answers', () => {
  it('allocation percentages derive from a decimal money division', () => {
    const result = RevRecEngine.allocateTransactionPrice(BASE_CONTRACT);
    // 80,000 / 120,000 and 40,000 / 120,000 — exact weights.
    expect(result[0]!.allocationPercentage).toBeCloseTo(2 / 3, 10);
    expect(result[1]!.allocationPercentage).toBeCloseTo(1 / 3, 10);
  });

  it('contract asset accumulates decimally: 10.10 + 20.20 is 30.30, not 30.299999999999997', () => {
    const schedules = [
      { period: '2025-01', amount: 10.1, recognizedToDate: 10.1, remainingToRecognize: 20.2 },
      { period: '2025-02', amount: 20.2, recognizedToDate: 30.3, remainingToRecognize: 0 },
    ];
    const result = RevRecEngine.getContractAssetLiability(
      'ct-1',
      schedules,
      new Map(), // nothing billed -> everything recognized is a contract asset
      ['2025-01', '2025-02']
    );
    // Float path emitted 30.299999999999997 here before session 024.
    expect(result[1]!.contractAsset).toBe(30.3);
    expect(result[1]!.netPosition).toBe(30.3);
    expect(result[1]!.contractLiability).toBe(0);
  });

  it('contract liability nets decimally when billing outruns recognition', () => {
    const schedules = [
      { period: '2025-01', amount: 1.1, recognizedToDate: 1.1, remainingToRecognize: 2.2 },
    ];
    const result = RevRecEngine.getContractAssetLiability(
      'ct-1',
      schedules,
      new Map([['2025-01', 4.4]]),
      ['2025-01']
    );
    // 4.4 billed − 1.1 recognized = 3.3 deferred revenue, exactly.
    expect(result[0]!.contractLiability).toBe(3.3);
    expect(result[0]!.contractAsset).toBe(0);
    expect(result[0]!.netPosition).toBe(-3.3);
  });
});
