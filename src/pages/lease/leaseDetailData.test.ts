import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LeaseEngine } from '@/engines/LeaseEngine';
import { liabilityAmortization, meanRate, rouDepreciation } from '@/pages/lease/leaseDetailData';

const contract = {
  id: 'L-KA',
  assetDescription: 'Fixture',
  commencementDate: '2026-01-01',
  leaseTerm: 12,
  leasePayments: Array(12).fill(5000),
  discountRate: 0.05,
};

describe('leaseDetailData', () => {
  it('mirrors the engine liability schedule without re-rounding', () => {
    const rows = liabilityAmortization(contract);
    const engine = LeaseEngine.calculateLeaseLiability(contract).slice(0, 12);
    expect(rows).toHaveLength(12);
    expect(rows[0]!.payment).toBe(engine[0]!.payment);
    expect(rows[0]!.principal).toBe(engine[0]!.reduction);
    expect(rows[0]!.interest).toBe(engine[0]!.interest);
    expect(rows[0]!.balance).toBe(engine[0]!.closingBalance);
  });

  it('accumulated depreciation is opening ROU minus remaining book', () => {
    const disclosure = LeaseEngine.generateDisclosure(contract);
    const years = rouDepreciation(contract, disclosure.rightOfUseAsset);
    expect(years.length).toBeGreaterThan(0);
    const last = years.at(-1)!;
    expect(last.accumulated).toBe(
      Math.round((disclosure.rightOfUseAsset - last.bookValue) * 100) / 100
    );
  });

  it('meanRate is null on an empty set', () => {
    expect(meanRate([])).toBeNull();
    expect(meanRate([6, 5])).toBe(5.5);
  });
});

describe('leaseDetailData source guards', () => {
  const src = readFileSync('src/pages/lease/leaseDetailData.ts', 'utf8');
  const page = readFileSync('src/pages/lease/LeaseDetailPage.tsx', 'utf8');

  it('does not Math.round money', () => {
    expect(src).not.toMatch(/Math\.round\(/);
    expect(page).not.toMatch(/Math\.round\(/);
  });

  it('does not subtract ROU in float', () => {
    expect(src).not.toMatch(/rouAsset\s*-\s*bookValue/);
  });
});
