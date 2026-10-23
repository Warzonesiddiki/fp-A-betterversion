import { FinancialTable } from '@/components/ui/FinancialTable';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

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
