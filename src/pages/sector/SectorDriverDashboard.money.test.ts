// =============================================================================
// SectorDriverDashboard model tests — W-FAB-002 part-1 remediation
// -----------------------------------------------------------------------------
// Pins the HONEST model: signed prefix-first classification (no absEntryAmount
// magnitudes), no invented bases, no target×factor filler, null-with-
// disclosure for ratios whose denominator class is absent, and a separate
// labeled simulator surface for driver arithmetic.
// =============================================================================

import { describe, expect, it } from 'vitest';
import { getSectorConfig } from '@/config/sectors';
import {
  computeSectorDriverModel,
  type SectorDriverId,
  type SectorLedgerEntry,
} from './SectorDriverDashboard';

const baseDrivers = { growthPct: 0, efficiencyPct: 100, capacityPct: 100, riskPct: 0 };

function config(id: SectorDriverId) {
  const sectorConfig = getSectorConfig(id);
  if (!sectorConfig) throw new Error(`missing sector config ${id}`);
  return sectorConfig;
}

function entry(overrides: Partial<SectorLedgerEntry> & { accountCode: string }): SectorLedgerEntry {
  return { accountName: '', debit: 0, credit: 0, ...overrides };
}

/** Prefix-classified ledger: rev 1.2M / COGS 420k / assets 3.5M / liabs 1M / equity 1.8M. */
const classifiedEntries: SectorLedgerEntry[] = [
  entry({ accountCode: '4000', accountName: 'subscription revenue', credit: 1_200_000 }),
  entry({ accountCode: '5000', accountName: 'cogs', debit: 420_000 }),
  entry({ accountCode: '1000', accountName: 'cash', debit: 3_500_000 }),
  entry({ accountCode: '2000', accountName: 'debt', credit: 1_000_000 }),
  entry({ accountCode: '3000', accountName: 'equity', credit: 1_800_000 }),
];

describe('computeSectorDriverModel — classification honesty', () => {
  it('sums decimal revenue exactly (0.1 + 0.2 = 0.3)', () => {
    const result = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [
        entry({ accountCode: '4000', accountName: 'subscription revenue', credit: 0.1 }),
        entry({ accountCode: '4000', accountName: 'subscription revenue', credit: 0.2 }),
      ],
      drivers: baseDrivers,
    });

    expect(result.totalRevenue).toBe(0.3);
    expect(result.modeledRevenue).toBe(0.3);
  });

  it('rounds modeled revenue half-up exactly (0.335 × 3 = 1.01)', () => {
    const result = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [entry({ accountCode: '4000', accountName: 'revenue', credit: 0.335 })],
      drivers: { ...baseDrivers, growthPct: 200 },
    });

    expect(result.modeledRevenue).toBe(1.01);
  });

  it('SIGN SENSITIVITY: a debited revenue row reduces revenue instead of flipping positive', () => {
    // The retired absEntryAmount aggregator took max(|d−c|, |net|), so a
    // mis-posted DEBIT on a revenue account counted as POSITIVE activity.
    const clean = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [
        entry({ accountCode: '4000', accountName: 'revenue', credit: 500 }),
        entry({ accountCode: '4000', accountName: 'revenue', credit: 300 }),
      ],
      drivers: baseDrivers,
    });
    const withReversal = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [
        entry({ accountCode: '4000', accountName: 'revenue', credit: 500 }),
        entry({ accountCode: '4000', accountName: 'revenue', debit: 300 }),
      ],
      drivers: baseDrivers,
    });

    expect(clean.totalRevenue).toBe(800);
    expect(withReversal.totalRevenue).toBe(200);
    expect(withReversal.modeledRevenue).toBeLessThan(clean.modeledRevenue);
  });

  it('classifies by prefix even when the account name matches nothing', () => {
    const result = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [
        entry({ accountCode: '4000', accountName: 'zzz-unhelpful-name', credit: 900 }),
        entry({ accountCode: '5000', accountName: 'zzz-unhelpful-name', debit: 400 }),
      ],
      drivers: baseDrivers,
    });
    expect(result.totalRevenue).toBe(900);
    expect(result.totalExpenses).toBe(400);
    expect(result.grossProfit).toBe(500);
  });

  it('counts unmatched rows nowhere instead of guessing a bucket', () => {
    const withoutNoise = computeSectorDriverModel({
      sectorId: 'banking',
      config: config('banking'),
      entries: [entry({ accountCode: '4000', accountName: 'fee income', credit: 700 })],
      drivers: baseDrivers,
    });
    const withNoise = computeSectorDriverModel({
      sectorId: 'banking',
      config: config('banking'),
      entries: [
        entry({ accountCode: '4000', accountName: 'fee income', credit: 700 }),
        entry({ accountCode: '9999', accountName: 'clearing suspense', debit: 5_000 }),
      ],
      drivers: baseDrivers,
    });

    expect(withoutNoise.totalExpenses).toBe(0);
    expect(withNoise.totalExpenses).toBe(0);
    // The suspense row must not leak into any classified signal.
    expect(withNoise.totalRevenue).toBe(700);
  });

  it('name fallback stays signed: keyword expense rows outside classes count as OpEx', () => {
    const result = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [
        entry({ accountCode: '7100', accountName: 'payroll expense', debit: 250 }),
        entry({ accountCode: '7200', accountName: 'payroll expense', credit: 50 }),
      ],
      drivers: baseDrivers,
    });
    expect(result.totalExpenses).toBe(200);
  });
});

describe('computeSectorDriverModel — derived vs simulator separation', () => {
  it.each([
    ['technology', ['gross_margin'], ['arr', 'nrr', 'churn', 'quick_ratio']],
    [
      'manufacturing',
      ['inventory_turnover', 'gross_margin'],
      ['oee', 'scrap_rate', 'unit_cost', 'yield_rate'],
    ],
    ['banking', ['nim', 'efficiency_ratio'], ['cet1', 'npl_ratio', 'loan_deposit_ratio']],
    ['retail', ['inventory_turnover', 'gross_margin'], ['sss', 'conversion_rate', 'atv', 'gmroi']],
    ['energy', ['gross_margin'], ['production_volume', 'boe_per_day', 'carbon_intensity']],
    [
      'construction',
      ['gross_margin'],
      ['backlog', 'wip', 'completion_percent', 'change_order_ratio'],
    ],
    [
      'logistics',
      ['gross_margin'],
      ['cost_per_mile', 'warehousing_cost_pct', 'on_time_delivery', 'empty_miles_pct'],
    ],
    ['healthcare', ['ebitdar'], ['occupancy', 'denial_rate', 'ar_days', 'case_mix_index']],
    [
      'government',
      [],
      [
        'cost_per_citizen',
        'revenue_collection_gap',
        'budget_utilization',
        'compliance_audit_score',
      ],
    ],
    ['education', [], ['revenue_per_student', 'faculty_to_student_ratio', 'endowment_growth_rate']],
    ['insurance', ['loss_ratio'], ['retention_ratio', 'solvency_ratio']],
    ['realestate', ['noi', 'cap_rate', 'ltv'], ['ffo', 'dscr']],
  ] as Array<[SectorDriverId, string[], string[]]>)(
    '%s: derived ids present, fabricated ids absent from measured KPIs',
    (sectorId, expectedDerived, bannedIds) => {
      const result = computeSectorDriverModel({
        sectorId,
        config: config(sectorId),
        entries: classifiedEntries,
        drivers: baseDrivers,
      });

      const metricIds = result.metrics.map((m) => m.id);
      for (const id of expectedDerived) {
        expect(metricIds).toContain(id);
      }
      for (const id of bannedIds) {
        expect(metricIds).not.toContain(id);
      }
      const simulatorIds = result.simulator.map((m) => m.id);
      for (const id of bannedIds) {
        if (expectedDerived.includes(id)) continue;
        // Fabricated metrics are gone entirely OR survive only as labeled
        // simulator projections — never as measured KPIs.
        if (simulatorIds.includes(id)) {
          expect(metricIds).not.toContain(id);
        }
      }
    }
  );

  it('every non-null metric is finite; every null metric discloses why', () => {
    for (const sectorId of [
      'technology',
      'manufacturing',
      'banking',
      'retail',
      'energy',
      'construction',
      'logistics',
      'healthcare',
      'government',
      'education',
      'insurance',
      'realestate',
    ] as SectorDriverId[]) {
      // Ledger WITHOUT balance-sheet classes: forces disclosure paths.
      const result = computeSectorDriverModel({
        sectorId,
        config: config(sectorId),
        entries: [
          entry({ accountCode: '4000', accountName: 'revenue', credit: 10_000 }),
          entry({ accountCode: '5000', accountName: 'cogs', debit: 4_000 }),
          entry({ accountCode: '6000', accountName: 'salaries expense', debit: 2_000 }),
        ],
        drivers: baseDrivers,
      });
      for (const metric of result.metrics) {
        if (metric.value === null) {
          expect(typeof metric.note === 'string' && metric.note.length > 0).toBe(true);
          expect(metric.varianceToTargetPct).toBeNull();
        } else {
          expect(Number.isFinite(metric.value)).toBe(true);
        }
      }
      for (const sim of result.simulator) {
        expect(Number.isFinite(sim.value)).toBe(true);
        expect(sim.basis.length).toBeGreaterThan(0);
      }
    }
  });

  it('no fabricated filler appears when a branch yields fewer than five metrics', () => {
    const result = computeSectorDriverModel({
      sectorId: 'government',
      config: config('government'),
      entries: [entry({ accountCode: '4000', accountName: 'tax revenue', credit: 1 })],
      drivers: baseDrivers,
    });
    // The retired filledMetrics path would have manufactured exactly these
    // five from config targets (target × growthFactor × efficiencyFactor,
    // which at neutral drivers equals target itself). They must now be either
    // absent or null-with-disclosure — never a number.
    const byId = new Map(result.metrics.map((m) => [m.id, m]));
    const retiredFiller = [
      'budget_utilization',
      'service_efficiency',
      'grant_disbursement_rate',
      'compliance_audit_score',
      'cost_per_citizen',
    ];
    for (const id of retiredFiller) {
      expect(byId.get(id)?.value ?? null).toBeNull();
      const note = byId.get(id)?.note;
      if (byId.has(id)) expect(note).toBeTruthy();
    }
  });
});

describe('computeSectorDriverModel — insurance identity', () => {
  it('combined ratio = loss ratio + expense ratio from real premiums/claims/opex', () => {
    const result = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config('insurance'),
      entries: [
        entry({ accountCode: '4000', accountName: 'written premium', credit: 100_000 }),
        entry({ accountCode: '5000', accountName: 'claims incurred', debit: 60_000 }),
        entry({ accountCode: '6000', accountName: 'underwriting expense', debit: 25_000 }),
      ],
      drivers: baseDrivers,
    });

    const byId = new Map(result.metrics.map((m) => [m.id, m]));
    expect(byId.get('gwp')?.value).toBe(100_000);
    expect(byId.get('loss_ratio')?.value).toBe(60);
    expect(byId.get('expense_ratio')?.value).toBe(25);
    expect(byId.get('combined_ratio')?.value).toBe(85);
  });

  it('discloses instead of inventing claims via the retired ×0.62 fallback', () => {
    const result = computeSectorDriverModel({
      sectorId: 'insurance',
      config: config('insurance'),
      entries: [entry({ accountCode: '4000', accountName: 'written premium', credit: 100_000 })],
      drivers: baseDrivers,
    });

    const byId = new Map(result.metrics.map((m) => [m.id, m]));
    expect(byId.get('loss_ratio')?.value).toBeNull();
    expect(byId.get('loss_ratio')?.note).toMatch(/claim/i);
    expect(byId.get('combined_ratio')?.value).toBeNull();
  });
});

describe('computeSectorDriverModel — driver response', () => {
  it('responds to driver changes without mutating GL-derived actuals', () => {
    const conservative = computeSectorDriverModel({
      sectorId: 'retail',
      config: config('retail'),
      entries: classifiedEntries,
      drivers: { growthPct: 0, efficiencyPct: 80, capacityPct: 80, riskPct: 10 },
    });
    const upside = computeSectorDriverModel({
      sectorId: 'retail',
      config: config('retail'),
      entries: classifiedEntries,
      drivers: { growthPct: 20, efficiencyPct: 100, capacityPct: 100, riskPct: 0 },
    });

    expect(conservative.totalRevenue).toBe(upside.totalRevenue);
    expect(upside.modeledRevenue).toBeGreaterThan(conservative.modeledRevenue);
    expect(upside.ebitda).toBeGreaterThan(conservative.ebitda);
    // Simulator projections respond to sliders…
    const consSim = new Map(conservative.simulator.map((m) => [m.id, m]));
    const upSim = new Map(upside.simulator.map((m) => [m.id, m]));
    expect(upSim.get('sss')?.value).toBeGreaterThan(consSim.get('sss')?.value ?? 0);
    // …while measured gross margin does not move.
    const consGm = conservative.metrics.find((m) => m.id === 'gross_margin');
    const upGm = upside.metrics.find((m) => m.id === 'gross_margin');
    expect(consGm?.value).toBe(upGm?.value);
  });
});
