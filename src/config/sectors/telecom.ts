import type { SectorConfig } from './index';

export const telecomConfig: SectorConfig = {
  id: 'telecom',
  name: 'Telecommunications',
  description:
    'Telecom: posted revenue, CAPEX/revenue ratio and operating surplus from classified GL; ARPU and churn need billing feeds.',
  defaultKPIs: [
    { id: 'arpu', label: 'Average Revenue Per User', format: 'currency', target: 45 },
    {
      id: 'network_availability',
      label: 'Network Availability',
      format: 'percent',
      target: 99.99,
    },
    {
      id: 'capex_to_revenue',
      label: 'CapEx/Revenue Ratio',
      format: 'percent',
      target: 15,
      lowerIsBetter: true,
    },
    { id: 'data_usage', label: 'Avg Data Usage (GB)', format: 'number', target: 18 },
    { id: 'ebitda_per_user', label: 'EBITDA Per User', format: 'currency', target: 12 },
  ],
  enabledModules: ['telecom', 'saas', 'capex', 'workforce'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'telecom',
    'capex',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
