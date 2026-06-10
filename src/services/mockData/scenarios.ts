import type { Scenario, ScenarioAssumption, ScenarioMetrics } from '@/types';

const baseAssumptions: ScenarioAssumption[] = [
  {
    id: 'asmp-base-001',
    name: 'Revenue Growth',
    driverType: 'Revenue',
    baseValue: 15,
    currentValue: 15,
    minValue: 5,
    maxValue: 30,
    stepSize: 1,
    unit: '%',
    affectedAccountIds: ['acct-4100', 'acct-4200'],
  },
  {
    id: 'asmp-base-002',
    name: 'Headcount',
    driverType: 'Headcount',
    baseValue: 137,
    currentValue: 137,
    minValue: 120,
    maxValue: 160,
    stepSize: 1,
    unit: 'FTE',
    affectedAccountIds: ['acct-7100', 'acct-7200'],
  },
  {
    id: 'asmp-base-003',
    name: 'Churn Rate',
    driverType: 'Volume',
    baseValue: 2.5,
    currentValue: 2.5,
    minValue: 1,
    maxValue: 6,
    stepSize: 0.25,
    unit: '%',
    affectedAccountIds: ['acct-4100'],
  },
  {
    id: 'asmp-base-004',
    name: 'OpEx Growth',
    driverType: 'Rate',
    baseValue: 6,
    currentValue: 6,
    minValue: 2,
    maxValue: 12,
    stepSize: 1,
    unit: '%',
    affectedAccountIds: ['acct-7100', 'acct-7200', 'acct-7300', 'acct-7500'],
  },
  {
    id: 'asmp-base-005',
    name: 'Price Increase',
    driverType: 'Price',
    baseValue: 5,
    currentValue: 5,
    minValue: 0,
    maxValue: 15,
    stepSize: 1,
    unit: '%',
    affectedAccountIds: ['acct-4100'],
  },
];

const baseMetrics: ScenarioMetrics = {
  revenue: 42_000_000,
  ebitda: 11_200_000,
  netIncome: 7_800_000,
  cashFlow: 6_500_000,
  headcount: 137,
  burnRate: 3_700_000,
  runway: 18,
  grossMargin: 72.5,
  ebitdaMargin: 26.7,
};

export const scenarios: Scenario[] = [
  {
    id: 'scn-001',
    name: 'Base Case',
    description:
      'Current operating plan with approved budget assumptions and expected market conditions.',
    baseBudgetId: 'bgt-001',
    baseBudgetName: 'FY2024 Annual Operating Budget',
    type: 'Base',
    probability: 0.55,
    isActive: true,
    isLocked: false,
    assumptions: baseAssumptions,
    calculatedMetrics: baseMetrics,
    createdBy: 'usr-001',
    createdByName: 'Sarah Chen',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-11-15T14:00:00Z',
  },
  {
    id: 'scn-002',
    name: 'Best Case',
    description:
      'Upside scenario assuming accelerated growth, higher renewals, and faster time-to-market for new features.',
    baseBudgetId: 'bgt-001',
    baseBudgetName: 'FY2024 Annual Operating Budget',
    type: 'Optimistic',
    probability: 0.2,
    isActive: true,
    isLocked: false,
    assumptions: [
      { ...baseAssumptions[0]!, currentValue: 25 },
      { ...baseAssumptions[1]!, currentValue: 145 },
      { ...baseAssumptions[2]!, currentValue: 1.5, name: 'Churn Rate' },
      { ...baseAssumptions[3]!, currentValue: 5, name: 'OpEx Growth' },
      { ...baseAssumptions[4]!, currentValue: 8, name: 'Price Increase' },
    ],
    calculatedMetrics: {
      revenue: 48_500_000,
      ebitda: 15_200_000,
      netIncome: 11_100_000,
      cashFlow: 9_800_000,
      headcount: 145,
      burnRate: 4_100_000,
      runway: 24,
      grossMargin: 75.8,
      ebitdaMargin: 31.3,
    },
    createdBy: 'usr-001',
    createdByName: 'Sarah Chen',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-11-10T11:00:00Z',
  },
  {
    id: 'scn-003',
    name: 'Worst Case',
    description:
      'Downturn scenario with slower growth, increased churn, and macroeconomic headwinds.',
    baseBudgetId: 'bgt-001',
    baseBudgetName: 'FY2024 Annual Operating Budget',
    type: 'Pessimistic',
    probability: 0.15,
    isActive: true,
    isLocked: false,
    assumptions: [
      { ...baseAssumptions[0]!, currentValue: 5 },
      { ...baseAssumptions[1]!, currentValue: 125 },
      { ...baseAssumptions[2]!, currentValue: 4.5, name: 'Churn Rate' },
      { ...baseAssumptions[3]!, currentValue: 4, name: 'OpEx Growth' },
      { ...baseAssumptions[4]!, currentValue: 2, name: 'Price Increase' },
    ],
    calculatedMetrics: {
      revenue: 35_200_000,
      ebitda: 6_800_000,
      netIncome: 4_200_000,
      cashFlow: 3_100_000,
      headcount: 125,
      burnRate: 3_200_000,
      runway: 10,
      grossMargin: 68.2,
      ebitdaMargin: 19.3,
    },
    createdBy: 'usr-001',
    createdByName: 'Sarah Chen',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-11-12T16:00:00Z',
  },
  {
    id: 'scn-004',
    name: 'Cost Cutting',
    description:
      'Optimization scenario with targeted cost reductions including hiring freeze, vendor renegotiation, and T&E cuts.',
    baseBudgetId: 'bgt-001',
    baseBudgetName: 'FY2024 Annual Operating Budget',
    type: 'Custom',
    probability: 0.1,
    isActive: true,
    isLocked: false,
    assumptions: [
      { ...baseAssumptions[0]!, currentValue: 12 },
      { ...baseAssumptions[1]!, currentValue: 130 },
      { ...baseAssumptions[2]!, currentValue: 2.5, name: 'Churn Rate' },
      { ...baseAssumptions[3]!, currentValue: -2, name: 'OpEx Growth' },
      { ...baseAssumptions[4]!, currentValue: 5, name: 'Price Increase' },
    ],
    calculatedMetrics: {
      revenue: 40_800_000,
      ebitda: 13_500_000,
      netIncome: 9_600_000,
      cashFlow: 8_200_000,
      headcount: 130,
      burnRate: 3_100_000,
      runway: 26,
      grossMargin: 73.1,
      ebitdaMargin: 33.1,
    },
    createdBy: 'usr-003',
    createdByName: 'Jessica Park',
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-11-14T09:00:00Z',
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

import { ScenarioEngine } from '@/engines/ScenarioEngine';

export function getProbabilityWeightedMetrics(): ScenarioMetrics {
  return ScenarioEngine.probabilityWeighted(
    scenarios.map((s) => ({
      metrics: s.calculatedMetrics,
      probability: s.probability,
    }))
  );
}
