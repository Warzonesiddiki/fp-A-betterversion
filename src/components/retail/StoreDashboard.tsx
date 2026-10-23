import { FinancialTable } from '@/components/ui/FinancialTable';

export function StoreDashboard() {
  return (
    <FinancialTable
      rows={[]}
      columns={[
        { key: 'storeName', header: 'Store', type: 'string' },
        { key: 'sales', header: 'Sales', type: 'currency' },
        { key: 'traffic', header: 'Traffic', type: 'number' },
        { key: 'conversion', header: 'Conv %', type: 'percent' },
        { key: 'basketSize', header: 'Basket', type: 'currency' },
      ]}
    />
  );
}
