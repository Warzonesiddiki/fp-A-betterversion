import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useGLStore } from '@/store/glStore';
import { useShallow } from 'zustand/react/shallow';
import { PivotTableEngine, type PivotConfig, type PivotField } from '@/engines/PivotTableEngine';
import { PivotBuilder, PivotTable } from '@/components/ui/PivotTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { subtractMoney } from '@/utils/money';

export default function PivotExplorerPage() {
  const { entries, accounts } = useGLStore(
    useShallow((s) => ({ entries: s.entries, accounts: s.accounts }))
  );

  const [config, setConfig] = useState<PivotConfig>({
    rows: ['accountType', 'accountName'],
    columns: ['period'],
    values: [{ field: 'netAmount', aggregation: 'sum' }],
    filters: {},
    showTotals: true,
    showSubtotals: true,
  });

  const availableFields: PivotField[] = [
    { name: 'accountType', label: 'Account Type', type: 'dimension', dataType: 'string' },
    { name: 'accountName', label: 'Account Name', type: 'dimension', dataType: 'string' },
    { name: 'period', label: 'Period (Month)', type: 'dimension', dataType: 'string' },
    { name: 'entityId', label: 'Entity', type: 'dimension', dataType: 'string' },
    { name: 'debit', label: 'Debit', type: 'measure', dataType: 'number' },
    { name: 'credit', label: 'Credit', type: 'measure', dataType: 'number' },
    { name: 'netAmount', label: 'Net Amount', type: 'measure', dataType: 'number' },
  ];

  // Enrich GL entries with account types and net amount
  const data = useMemo(() => {
    return entries.map((e) => {
      const acct = accounts.find((a) => a.id === e.accountId || a.code === e.accountCode);
      return {
        ...e,
        accountType: acct?.type || 'Unknown',
        accountName: acct?.name || 'Unknown',
        netAmount: subtractMoney(e.debit, e.credit).toNumber(),
      };
    });
  }, [entries, accounts]);

  const pivotResult = useMemo(() => {
    if (data.length === 0) return null;
    const engine = new PivotTableEngine();
    return engine.createPivot(data as Record<string, unknown>[], config);
  }, [data, config]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Pivot Explorer" purpose="Slice and dice your financial data" />

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <PivotBuilder availableFields={availableFields} config={config} onChange={setConfig} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-t border-[var(--border-subtle)]">
          <PivotTable
            data={pivotResult}
            className="border-0 shadow-none rounded-none max-h-[600px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}
