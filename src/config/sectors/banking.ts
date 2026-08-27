import type { SectorConfig } from './index';

export const bankingConfig: SectorConfig = {
  id: 'banking',
  name: 'Banking / Financial Services',
  description:
    'Banking metrics: NIM and efficiency ratio derived from classified GL; ROA and cost of funds tracked as targets.',
  defaultKPIs: [
    { id: 'nim', label: 'Net Interest Margin', format: 'percent', target: 3.2 },
    {
      id: 'efficiency_ratio',
      label: 'Efficiency Ratio',
      format: 'percent',
      target: 55,
      lowerIsBetter: true,
    },
    { id: 'roa', label: 'Return on Assets', format: 'percent', target: 1.2 },
    {
      id: 'cost_of_funds',
      label: 'Cost of Funds',
      format: 'percent',
      target: 2.5,
      lowerIsBetter: true,
    },
  ],
  enabledModules: ['banking', 'treasury', 'compliance', 'tax'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'banking',
    'treasury',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
