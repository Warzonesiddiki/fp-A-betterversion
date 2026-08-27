import type { SectorConfig } from './index';

export const realestateConfig: SectorConfig = {
  id: 'realestate',
  name: 'Real Estate / PropTech',
  description: 'RE metrics: NOI, Cap Rate, Occupancy, WALT',
  defaultKPIs: [
    { id: 'noi', label: 'Net Operating Income', format: 'currency', target: 15000000 },
    { id: 'cap_rate', label: 'Capitalization Rate', format: 'percent', target: 6.5 },
    { id: 'occupancy', label: 'Portfolio Occupancy', format: 'percent', target: 95 },
    { id: 'walt', label: 'WALT (Years)', format: 'number', target: 7.2 },
    { id: 'ltv', label: 'Loan to Value', format: 'percent', target: 60, lowerIsBetter: true },
    { id: 'nav_per_share', label: 'Net Asset Value per Share', format: 'currency', target: 24.5 },
  ],
  enabledModules: ['realestate', 'lease', 'capex', 'tax'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'realestate',
    'lease',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
