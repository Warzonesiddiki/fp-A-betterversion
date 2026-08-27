import type { SectorConfig } from './index';

export const retailConfig: SectorConfig = {
  id: 'retail',
  name: 'Retail / Commerce',
  description:
    'Retail metrics: SSS, conversion, GMROI, inventory turnover; gross margin derived from classified GL.',
  defaultKPIs: [
    { id: 'sss', label: 'Same-Store Sales Growth', format: 'percent', target: 5 },
    { id: 'conversion_rate', label: 'Conversion Rate', format: 'percent', target: 3.5 },
    { id: 'gmroi', label: 'Gross Margin ROI', format: 'number', target: 2.5 },
    {
      id: 'inventory_shrink',
      label: 'Inventory Shrink',
      format: 'percent',
      target: 1.2,
      lowerIsBetter: true,
    },
    { id: 'sales_per_sqft', label: 'Sales per Sq. Ft.', format: 'currency', target: 400 },
    {
      id: 'cac',
      label: 'Customer Acquisition Cost',
      format: 'currency',
      target: 45,
      lowerIsBetter: true,
    },
    { id: 'inventory_turnover', label: 'Inventory Turnover', format: 'number', target: 6 },
    { id: 'basket_size', label: 'Average Basket Size', format: 'number', target: 3.2 },
  ],
  enabledModules: ['retail', 'inventory', 'marketing', 'workforce'],
  sidebarOrder: [
    'dashboard',
    'budgets',
    'forecasts',
    'reports',
    'variance',
    'scenarios',
    'analytics',
    'retail',
    'inventory',
    'data',
    'collaboration',
    'settings',
  ],
  defaultCurrency: 'USD',
};
