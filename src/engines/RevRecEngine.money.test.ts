/**
 * GAP-1 (F-0006) known-answer tests for RevRecEngine's residual money
 * drift.
 *
 * `handleContractModification` adjusts the contract total value (ASC 606
 * revenue-recognition currency) with raw `+`/`+=` over IEEE-754 doubles.
 * Each fixed input asserts the exact cent result with `toBe`; the
 * pre-migration float output is recorded inline.
 */

import { describe, expect, it } from 'vitest';
import { RevRecEngine, type Contract, type ContractModification } from './RevRecEngine';

function contract(totalValue: number): Contract {
  return {
    id: 'c1',
    customerId: 'cust-1',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalValue,
    performanceObligations: [],
    paymentTerms: 'net-30',
    contractModifications: [],
  };
}

function mod(type: ContractModification['type'], value: number): ContractModification {
  return { date: '2026-03-01', type, value };
}

describe('RevRecEngine — money known answers (GAP-1 / F-0006)', () => {
  it('adds additional goods value exactly (old float: 0.30000000000000004)', () => {
    const updated = RevRecEngine.handleContractModification(
      contract(0.1),
      mod('additional_goods', 0.2)
    );

    expect(updated.totalValue).toBe(0.3);
  });

  it('extends contracts with exact decimal sums (old float: 0.30000000000000004)', () => {
    const updated = RevRecEngine.handleContractModification(contract(0.1), mod('extension', 0.2));

    expect(updated.totalValue).toBe(0.3);
  });

  it('terminates with exact decimal subtraction (old float: 0.09999999999999998)', () => {
    const updated = RevRecEngine.handleContractModification(
      contract(0.3),
      mod('termination', -0.2)
    );

    expect(updated.totalValue).toBe(0.1);
  });

  it('applies discounts with exact decimals and clamps at zero (old float: 0.19999999999999998)', () => {
    const updated = RevRecEngine.handleContractModification(contract(0.5), mod('discount', -0.3));

    expect(updated.totalValue).toBe(0.2);

    const floor = RevRecEngine.handleContractModification(contract(0.1), mod('discount', -0.3));
    expect(floor.totalValue).toBe(0);
  });
});
