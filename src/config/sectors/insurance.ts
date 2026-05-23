import type { SectorConfig } from './index';

export const insuranceConfig: SectorConfig = {
  id: 'insurance',
  name: 'Insurance',
  description: 'Underwriting metrics: Combined Ratio, Loss Ratio, GWP',
  defaultKPIs: [
    {
      id: 'combined_ratio',
      label: 'Combined Ratio',
      format: 'percent',
      target: 92,
      lowerIsBetter: true,
    },
    { id: 'loss_ratio', label: 'Loss Ratio', format: 'percent', target: 65, lowerIsBetter: true },
    { id: 'gwp', label: 'Gross Written Premium', format: 'currency', target: 500000000 },
    { id: 'retention_ratio', label: 'Policy Retention Ratio', format: 'percent', target: 88 },
    {
      id: 'expense_ratio',
      label: 'Expense Ratio',
      format: 'percent',
      target: 27,
      lowerIsBetter: true,
    },
    { id: 'solvency_ratio', label: 'Solvency II Ratio', format: 'percent', target: 180 },
    { id: 'yield_on_investments', label: 'Investment Yield', format: 'percent', target: 4.5 },
  ],
  enabledModules: ['insurance', 'treasury', 'compliance', 'tax'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'insurance',
    'treasury',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
