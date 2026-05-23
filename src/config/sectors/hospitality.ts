import type { SectorConfig } from './index';

export const hospitalityConfig: SectorConfig = {
  id: 'hospitality',
  name: 'Hospitality / Leisure',
  description: 'Hotel metrics: RevPAR, ADR, Occupancy, GOPPAR',
  defaultKPIs: [
    { id: 'revpar', label: 'Revenue Per Available Room', format: 'currency', target: 145 },
    { id: 'adr', label: 'Average Daily Rate', format: 'currency', target: 180 },
    { id: 'occupancy', label: 'Room Occupancy Rate', format: 'percent', target: 82 },
    { id: 'goppar', label: 'GOP Per Available Room', format: 'currency', target: 65 },
    { id: 'f_and_b_margin', label: 'F&B Margin', format: 'percent', target: 30 },
    {
      id: 'labor_cost_pct',
      label: 'Labor Cost % of Revenue',
      format: 'percent',
      target: 25,
      lowerIsBetter: true,
    },
    { id: 'guest_satisfaction', label: 'Guest Satisfaction Score', format: 'number', target: 9.0 },
  ],
  enabledModules: ['hospitality', 'revenue', 'workforce', 'marketing'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'hospitality',
    'revenue',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
