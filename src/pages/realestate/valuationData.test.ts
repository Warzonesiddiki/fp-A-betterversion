import { describe, it, expect } from 'vitest';
import { deriveValuation, type ValuationGLEntry } from './valuationData';

/**
 * Known-answer tests for property valuation.
 *
 * Seeded ledger (hand-computed):
 *   P1  1500 cost   4,000,000    1600 value 5,000,000
 *       4000 rent     400,000    5000 opex    100,000  -> NOI 300,000
 *   P2  1500 cost   2,000,000    1600 value 2,200,000   (no rent posted)
 *   debt 2500 credit 3,000,000
 *
 *   P1 gain 1,000,000 (+25.00%)   cap rate 300,000 / 5,000,000 = 6.00%
 *   P2 gain   200,000 (+10.00%)   cap rate null
 *   portfolio cost 6,000,000 value 7,200,000 gain 1,200,000 (+20.00%)
 *   weighted cap rate 300,000 / 5,000,000 = 6.00% (P2 excluded, no NOI)
 *   LTV 3,000,000 / 7,200,000 = 41.67%
 */
function e(
  accountCode: string,
  entityId: string,
  debit: number,
  credit: number,
  accountName = accountCode
): ValuationGLEntry {
  return { accountCode, accountName, entityId, debit, credit };
}

const LEDGER: ValuationGLEntry[] = [
  e('1500', 'P1', 4000000, 0, 'Riverside Cost'),
  e('1600', 'P1', 5000000, 0, 'Riverside Appraisal'),
  e('4000', 'P1', 0, 400000, 'Rental Income'),
  e('5000', 'P1', 100000, 0, 'Property Opex'),
  e('1500', 'P2', 2000000, 0, 'Hillcrest Cost'),
  e('1600', 'P2', 2200000, 0, 'Hillcrest Appraisal'),
  e('2500', 'P1', 0, 3000000, 'Mortgage'),
];

describe('deriveValuation — per property', () => {
  it('derives gain and appreciation from posted cost and value', () => {
    const v = deriveValuation(LEDGER)!;
    const p1 = v.properties.find((p) => p.id === 'P1')!;
    expect(p1.costBasis).toBe(4000000);
    expect(p1.appraisedValue).toBe(5000000);
    expect(p1.unrealizedGain).toBe(1000000);
    expect(p1.appreciationPercent).toBe(25);
  });

  it("uses each property's OWN noi for its cap rate", () => {
    const v = deriveValuation(LEDGER)!;
    const p1 = v.properties.find((p) => p.id === 'P1')!;
    const p2 = v.properties.find((p) => p.id === 'P2')!;
    expect(p1.noi).toBe(300000);
    expect(p1.capRatePercent).toBe(6);
    // The old page stamped the portfolio cap rate onto every row; P2 posts no
    // rental income, so it has no cap rate of its own.
    expect(p2.noi).toBeNull();
    expect(p2.capRatePercent).toBeNull();
  });

  it('does not surface the engine placeholders', () => {
    const v = deriveValuation(LEDGER)!;
    // Assert against the DATA, not the whole object: the disclosure text names
    // the placeholders on purpose, and a guard that reads its own prose is the
    // session-011 mistake.
    const data = JSON.stringify(v.properties);
    expect(data).not.toContain('6.2'); // mocked yield
    expect(data).not.toContain('94.8'); // mocked occupancy
    expect(data).not.toContain('TBD');
    expect(data).not.toContain('Value-Add');
    expect(Object.keys(v.properties[0]!)).not.toContain('yield');
    expect(Object.keys(v.properties[0]!)).not.toContain('status');
    expect(Object.keys(v.properties[0]!)).not.toContain('location');
  });

  it('emits a null appreciation rather than dividing by a zero cost basis', () => {
    const valueOnly = [e('1600', 'P3', 900000, 0)];
    const v = deriveValuation(valueOnly)!;
    expect(v.properties[0]!.costBasis).toBe(0);
    expect(v.properties[0]!.appreciationPercent).toBeNull();
  });

  it('returns null when no property cost or value is posted', () => {
    expect(deriveValuation([])).toBeNull();
    expect(deriveValuation([e('4000', 'P1', 0, 500)])).toBeNull();
  });
});

describe('deriveValuation — portfolio', () => {
  it('weights appreciation by value, not by property count', () => {
    const v = deriveValuation(LEDGER)!;
    expect(v.totalCostBasis).toBe(6000000);
    expect(v.totalAppraisedValue).toBe(7200000);
    expect(v.totalUnrealizedGain).toBe(1200000);
    // A mean of the two percentages would be 17.5%; the value-weighted figure
    // is 1,200,000 / 6,000,000 = 20%.
    expect(v.portfolioAppreciationPercent).toBe(20);
  });

  it('weights the cap rate over properties that actually post NOI', () => {
    const v = deriveValuation(LEDGER)!;
    expect(v.weightedCapRatePercent).toBe(6);
    expect(v.capRateCoverage).toBe(1);
    expect(v.unavailable.map((u) => u.label)).toContain('Cap rate for every property');
  });

  it('derives LTV from posted debt', () => {
    const v = deriveValuation(LEDGER)!;
    expect(v.totalDebt).toBe(3000000);
    expect(v.loanToValuePercent).toBe(41.67);
  });

  it('declares LTV and NOI unavailable when nothing supports them', () => {
    const bare = [e('1500', 'P1', 100, 0), e('1600', 'P1', 150, 0)];
    const v = deriveValuation(bare)!;
    expect(v.totalDebt).toBeNull();
    expect(v.loanToValuePercent).toBeNull();
    expect(v.totalNoi).toBeNull();
    const labels = v.unavailable.map((u) => u.label);
    expect(labels).toContain('Loan-to-value');
    expect(labels).toContain('Net operating income');
    expect(labels).toContain('Cap rate');
  });

  it('always declares period-over-period change unavailable', () => {
    expect(deriveValuation(LEDGER)!.unavailable.map((u) => u.label)).toContain(
      'Period-over-period change'
    );
  });

  it('uses decimal arithmetic — no IEEE-754 drift', () => {
    const pennies = [e('1500', 'P1', 0.1, 0), e('1500', 'P1', 0.2, 0), e('1600', 'P1', 0.3, 0)];
    const v = deriveValuation(pennies)!;
    expect(v.totalCostBasis).toBe(0.3);
    expect(v.totalUnrealizedGain).toBe(0);
  });
});
