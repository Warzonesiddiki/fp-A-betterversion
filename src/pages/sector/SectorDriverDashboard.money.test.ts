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

const sectorEntries: SectorLedgerEntry[] = [
  {
    accountCode: '4000',
    accountName: 'subscription revenue sales',
    credit: 1_200_000,
    debit: 0,
    netChange: -1_200_000,
  },
  {
    accountCode: '5000',
    accountName: 'cogs cost expense payroll',
    debit: 420_000,
    credit: 0,
    netChange: 420_000,
  },
  {
    accountCode: '1000',
    accountName: 'cash asset inventory property loan',
    debit: 3_500_000,
    credit: 0,
    netChange: 3_500_000,
  },
  {
    accountCode: '2000',
    accountName: 'debt liability deposit payable',
    credit: 1_000_000,
    debit: 0,
    netChange: -1_000_000,
  },
  {
    accountCode: '3000',
    accountName: 'equity capital retained',
    credit: 1_800_000,
    debit: 0,
    netChange: -1_800_000,
  },
  {
    accountCode: '9000',
    accountName: 'production units shipments patients students citizens miles beds stores',
    debit: 24_000,
    credit: 0,
    netChange: 24_000,
  },
];

describe('computeSectorDriverModel', () => {
  it('sums decimal revenue exactly (0.1 + 0.2 = 0.3)', () => {
    const result = computeSectorDriverModel({
      sectorId: 'technology',
      config: config('technology'),
      entries: [
        { accountName: 'subscription revenue', credit: 0.1, debit: 0, netChange: -0.1 },
        { accountName: 'subscription revenue', credit: 0.2, debit: 0, netChange: -0.2 },
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
      entries: [
        { accountName: 'subscription revenue', credit: 0.335, debit: 0, netChange: -0.335 },
      ],
      drivers: { ...baseDrivers, growthPct: 200 },
    });

    expect(result.modeledRevenue).toBe(1.01);
  });

  it.each([
    ['technology', ['arr', 'nrr', 'churn', 'quick_ratio', 'gross_margin']],
    ['manufacturing', ['oee', 'scrap_rate', 'inventory_turnover', 'unit_cost', 'yield_rate']],
    ['banking', ['nim', 'cet1', 'npl_ratio', 'efficiency_ratio', 'loan_deposit_ratio']],
    ['retail', ['sss', 'conversion_rate', 'atv', 'gmroi', 'inventory_turnover']],
    [
      'energy',
      [
        'production_volume',
        'boe_per_day',
        'lifting_cost',
        'carbon_intensity',
        'availability_factor',
      ],
    ],
    [
      'construction',
      [
        'backlog',
        'completion_percent',
        'gross_margin_per_project',
        'change_order_ratio',
        'utilization',
      ],
    ],
    [
      'logistics',
      [
        'cost_per_mile',
        'on_time_delivery',
        'fleet_utilization',
        'warehousing_cost_pct',
        'empty_miles_pct',
      ],
    ],
    ['healthcare', ['occupancy', 'denial_rate', 'ar_days', 'ebitdar', 'readmission_rate']],
    [
      'government',
      [
        'budget_utilization',
        'service_efficiency',
        'grant_disbursement_rate',
        'compliance_audit_score',
        'cost_per_citizen',
      ],
    ],
    [
      'education',
      [
        'student_retention_rate',
        'revenue_per_student',
        'faculty_to_student_ratio',
        'research_grant_win_rate',
        'endowment_growth_rate',
      ],
    ],
    ['realestate', ['noi', 'cap_rate', 'occupancy', 'ltv', 'ffo']],
    [
      'insurance',
      ['combined_ratio', 'loss_ratio', 'expense_ratio', 'gwp', 'retention_ratio', 'solvency_ratio'],
    ],
  ] as Array<[SectorDriverId, string[]]>)(
    'computes data-driven KPI set for %s',
    (sectorId, expectedIds) => {
      const result = computeSectorDriverModel({
        sectorId,
        config: config(sectorId),
        entries: sectorEntries,
        drivers: { growthPct: 8.5, efficiencyPct: 91.5, capacityPct: 87.5, riskPct: 4.5 },
      });

      expect(result.totalRevenue).toBe(1_200_000);
      expect(result.totalExpenses).toBe(420_000);
      expect(result.metrics.map((metric) => metric.id)).toEqual(
        expect.arrayContaining(expectedIds)
      );
      expect(result.metrics.length).toBeGreaterThanOrEqual(5);
      for (const metric of result.metrics) {
        expect(Number.isFinite(metric.value)).toBe(true);
        expect(Number.isFinite(metric.varianceToTargetPct)).toBe(true);
      }
    }
  );

  it('responds to driver changes without mutating GL-derived actual revenue', () => {
    const conservative = computeSectorDriverModel({
      sectorId: 'retail',
      config: config('retail'),
      entries: sectorEntries,
      drivers: { growthPct: 0, efficiencyPct: 80, capacityPct: 80, riskPct: 10 },
    });
    const upside = computeSectorDriverModel({
      sectorId: 'retail',
      config: config('retail'),
      entries: sectorEntries,
      drivers: { growthPct: 20, efficiencyPct: 100, capacityPct: 100, riskPct: 0 },
    });

    expect(conservative.totalRevenue).toBe(upside.totalRevenue);
    expect(upside.modeledRevenue).toBeGreaterThan(conservative.modeledRevenue);
    expect(upside.ebitda).toBeGreaterThan(conservative.ebitda);
  });
});
