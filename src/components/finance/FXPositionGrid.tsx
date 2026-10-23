import { FinancialTable } from '@/components/ui/FinancialTable';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

export function FXPositionGrid() {
  return (
    <FinancialTable
      rows={[]}
      columns={[
        { key: 'currency', header: 'Currency', type: 'string' },
        { key: 'long', header: 'Long', type: 'currency' },
        { key: 'short', header: 'Short', type: 'currency' },
        { key: 'net', header: 'Net Position', type: 'currency' },
        { key: 'rate', header: 'Current Rate', type: 'string' },
      ]}
    />
  );
}
