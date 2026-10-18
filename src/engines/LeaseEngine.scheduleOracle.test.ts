import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import { LeaseEngine, type LeaseContract } from './LeaseEngine';

/**
 * Phase 8 gate (checklist row 17): ROU / lease-liability schedule
 * oracles. Every figure below is recomputed independently with raw
 * decimal.js annuity mathematics — the engine must match the textbook,
 * and both schedules must foot over the lease life:
 *   liability: closing ends at exactly 0; payment = interest + reduction
 *              on the REPORTED figures, every period.
 *   ROU:       total depreciation over the life equals the initial
 *              asset (the opening balance), to the cent.
 */

const cents = (n: number) => Math.round(n * 100);

function lease(overrides: Partial<LeaseContract>): LeaseContract {
  return {
    id: 'L-1',
    assetDescription: 'Office lease',
    commencementDate: '2026-01-01',
    leaseTerm: 12,
    leasePayments: new Array(12).fill(1000),
    // (1 + a)^(1/12) - 1 = 1% monthly, exactly the textbook setup.
    discountRate: Math.pow(1.01, 12) - 1,
    ...overrides,
  };
}

/** Independent PV: 1000 x a-angle-12 at 1% per month. */
function oraclePV(): Decimal {
  let pv = new Decimal(0);
  for (let i = 1; i <= 12; i += 1) pv = pv.plus(new Decimal(1000).div(new Decimal('1.01').pow(i)));
  return pv;
}

describe('LeaseEngine — schedule oracles', () => {
  it('liability matches the textbook annuity schedule and extinguishes exactly', () => {
    const pv = oraclePV();
    const schedule = LeaseEngine.calculateLeaseLiability(lease({}));
    expect(schedule).toHaveLength(12);
    expect(schedule[0]!.openingBalance).toBe(Number(pv.toFixed(2)));
    expect(schedule[0]!.interest).toBe(Number(pv.times('0.01').toFixed(2)));
    expect(schedule[0]!.payment).toBe(1000);
    // Reported-figure identity, every period.
    for (const row of schedule) {
      expect(cents(row.interest) + cents(row.reduction)).toBe(cents(row.payment));
    }
    expect(schedule[11]!.closingBalance).toBe(0);
    // Total interest over the life = total payments - PV (within the
    // half-cent-per-period rounding bound).
    const totalInterest = schedule.reduce((a, r) => a + cents(r.interest), 0);
    expect(Math.abs(totalInterest - (1200000 - cents(Number(pv.toFixed(2)))))).toBeLessThanOrEqual(
      6
    );
  });

  it('ROU depreciates to exactly zero and total depreciation equals the initial asset', () => {
    const pv = oraclePV();
    const schedule = LeaseEngine.calculateROUAsset(lease({}));
    expect(schedule).toHaveLength(12);
    expect(schedule[0]!.openingBalance).toBe(Number(pv.toFixed(2)));
    expect(schedule[11]!.closingBalance).toBe(0);
    const totalDepreciation = schedule.reduce((a, r) => a + cents(r.depreciation), 0);
    expect(totalDepreciation).toBe(cents(Number(pv.toFixed(2))));
    // Straight line: months differ by at most a cent.
    const deps = schedule.map((r) => cents(r.depreciation));
    expect(Math.max(...deps) - Math.min(...deps)).toBeLessThanOrEqual(1);
  });

  it('zero discount rate: no interest, liability is the undiscounted sum', () => {
    const schedule = LeaseEngine.calculateLeaseLiability(
      lease({ leaseTerm: 3, leasePayments: [5000, 0, 5000], discountRate: 0 })
    );
    expect(schedule[0]!.openingBalance).toBe(10000);
    expect(schedule.every((r) => r.interest === 0)).toBe(true);
    expect(schedule[1]!.payment).toBe(0);
    expect(schedule[1]!.closingBalance).toBe(5000);
    expect(schedule[2]!.closingBalance).toBe(0);
  });
});
