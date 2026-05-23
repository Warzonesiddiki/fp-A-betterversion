import { FinancialTable } from '@/components/ui/FinancialTable';

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
