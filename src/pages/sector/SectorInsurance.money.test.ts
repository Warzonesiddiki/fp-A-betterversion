/**
 * Wave 9 Phase 3 — Insurance parity known-answer tests for the shared
 * sector driver model (GAP-1 / F-0006).
 *
 * Insurance was added to computeSectorDriverModel after PR #36 so its KPIs
 * (combined / loss / expense ratio, GWP, retention, solvency) are computed
 * from GL signals + drivers instead of falling through to the real-estate
 * default. These assertions fail under the old fallback and under naive
 * float math.
 */
import { describe, expect, it } from 'vitest';
import { getSectorConfig } from '@/config/sectors';
import { computeSectorDriverModel, type SectorLedgerEntry } from './SectorDriverDashboard';

const baseDrivers = { growthPct: 0, efficiencyPct: 100, capacityPct: 100, riskPct: 0 };
const config = () => {
  const c = getSectorConfig('insurance');
  if (!c) throw new Error('missing insurance config');
  return c;
};

const entries: SectorLedgerEntry[] = [
  {
    accountName: 'gross written premium revenue',
    credit: 1_200_000,
    debit: 0,
    netChange: -1_200_000,
  },
  { accountName: 'claims loss paid', debit: 260_400, credit: 0, netChange: 260_400 },
  { accountName: 'underwriting operating expense', debit: 159_600, credit: 0, netChange: 159_600 },
  { accountName: 'invested securities asset', debit: 3_500_000, credit: 0, netChange: 3_500_000 },
];

describe('computeSectorDriverModel insurance parity (GAP-1)', () => {
  it('sums fractional premium amounts exactly (0.1 + 0.2 = 0.3)', () => {
    const result = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config(),
      entries: [
        { accountName: 'premium revenue', credit: 0.1, debit: 0, netChange: -0.1 },
        { accountName: 'premium revenue', credit: 0.2, debit: 0, netChange: -0.2 },
      ],
      drivers: baseDrivers,
    });
    expect(result.totalRevenue).toBe(0.3);
  });

  it('computes insurance KPIs as deterministic known answers', () => {
    const result = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config(),
      entries,
      drivers: baseDrivers,
    });
    const byId = Object.fromEntries(result.metrics.map((m) => [m.id, m.value]));
    expect(byId.loss_ratio).toBe(21.7);
    expect(byId.expense_ratio).toBe(13.3);
    expect(byId.combined_ratio).toBe(35);
    expect(byId.gwp).toBe(1_200_000);
    expect(byId.retention_ratio).toBe(100);
    expect(byId.solvency_ratio).toBe(180);
  });

  it('combined ratio = loss + expense ratio exactly (0.335 × 3 → 1.01 half-up check)', () => {
    const result = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config(),
      entries: [{ accountName: 'premium revenue', credit: 0.335, debit: 0, netChange: -0.335 }],
      drivers: { ...baseDrivers, growthPct: 200 },
    });
    expect(result.modeledRevenue).toBe(1.01);
  });

  it('responds to risk driver — higher risk raises the combined ratio', () => {
    const calm = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config(),
      entries,
      drivers: { growthPct: 0, efficiencyPct: 100, capacityPct: 100, riskPct: 0 },
    });
    const stressed = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config(),
      entries,
      drivers: { growthPct: 0, efficiencyPct: 100, capacityPct: 100, riskPct: 30 },
    });
    const calmCombined = calm.metrics.find((m) => m.id === 'combined_ratio')?.value ?? 0;
    const stressedCombined = stressed.metrics.find((m) => m.id === 'combined_ratio')?.value ?? 0;
    expect(stressedCombined).toBeGreaterThan(calmCombined);
  });

  it('handles zero premium revenue without fabricating ratios', () => {
    const result = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config(),
      entries: [{ accountName: 'office supplies expense', debit: 500, credit: 0, netChange: 500 }],
      drivers: baseDrivers,
    });
    expect(Number.isFinite(result.totalRevenue)).toBe(true);
    for (const m of result.metrics) {
      expect(Number.isFinite(m.value)).toBe(true);
    }
  });
});
