import { FinancialTable } from '@/components/ui/FinancialTable';
import { Badge } from '@/components/ui/Badge';
import type { VarianceAnalysis } from '@/types';

export interface VarianceTableProps {
  analyses: VarianceAnalysis[];
  onSelect: (accountId: string) => void;
  onCommentaryEdit: (accountId: string, commentary: string) => void;
  selectedAccountId?: string;
}

export function VarianceTable({
  analyses,
  onSelect,
  onCommentaryEdit,
  selectedAccountId,
}: VarianceTableProps) {
  if (analyses.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-lg border border-slate-800">
        No variance data
      </div>
    );
  }

  return (
    <FinancialTable
      rows={analyses}
      columns={[
        { key: 'accountName', header: 'Account', type: 'string', width: 200 },
        { key: 'budget', header: 'Budget', type: 'currency' },
        { key: 'actual', header: 'Actual', type: 'currency' },
        {
          key: 'variance',
          header: 'Var $',
          type: 'currency',
          color: (val) => ((val as number) >= 0 ? 'text-green-400' : 'text-red-400'),
        },
        {
          key: 'variancePercent',
          header: 'Var %',
          type: 'percent',
          color: (val) => ((val as number) >= 0 ? 'text-green-400' : 'text-red-400'),
        },
        {
          key: 'status',
          header: 'Status',
          type: 'badge',
          render: (val) => (
            <Badge variant={val === 'Within' ? 'success' : val === 'Watch' ? 'warning' : 'danger'}>
              {String(val ?? '')}
            </Badge>
          ),
        },
        {
          key: 'commentary',
          header: 'Commentary',
          type: 'string',
          render: (val, row) => (
            <input
              defaultValue={val as string}
              onBlur={(e) => onCommentaryEdit(row.accountId, e.target.value)}
              className="bg-transparent border-none outline-none text-slate-400 text-sm w-full focus:text-white"
            />
          ),
        },
      ]}
    />
  );
}
