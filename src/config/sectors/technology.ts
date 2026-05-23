import type { SectorConfig } from './index';

export const technologyConfig: SectorConfig = {
  id: 'technology',
  name: 'Technology / SaaS',
  description: 'SaaS metrics: ARR, NRR, Churn, LTV/CAC',
  defaultKPIs: [
    { id: 'arr', label: 'Annual Recurring Revenue', format: 'currency', target: 50000000 },
    { id: 'nrr', label: 'Net Revenue Retention', format: 'percent', target: 120 },
    { id: 'churn', label: 'Logo Churn Rate', format: 'percent', target: 5, lowerIsBetter: true },
    { id: 'ltv_cac', label: 'LTV/CAC Ratio', format: 'number', target: 3 },
    { id: 'magic_number', label: 'Magic Number', format: 'number', target: 0.75 },
    { id: 'quick_ratio', label: 'Quick Ratio', format: 'number', target: 4 },
    { id: 'gross_margin', label: 'Gross Margin', format: 'percent', target: 75 },
    { id: 'rule_of_40', label: 'Rule of 40', format: 'number', target: 40 },
  ],
  enabledModules: ['saas', 'revenue', 'workforce', 'cash'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'saas',
    'revenue',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
