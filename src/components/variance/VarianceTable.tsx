import { FinancialTable, type FinancialTableRow } from '@/components/ui/FinancialTable';
import { Badge } from '@/components/ui/Badge';
import type { VarianceAnalysis } from '@/types';

export interface VarianceTableProps {
  analyses: VarianceAnalysis[];
  onSelect: (accountId: string) => void;
  onCommentaryEdit: (accountId: string, commentary: string) => void;
  selectedAccountId?: string;
}

export function VarianceTable({ analyses, onCommentaryEdit }: VarianceTableProps) {
  if (analyses.length === 0) {
    return (
      <div
        className="p-12 text-center text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-default)]"
        role="region"
        aria-label="VarianceTable"
      >
        No variance data
      </div>
    );
  }

  return (
    <FinancialTable
      rows={analyses as unknown as FinancialTableRow[]}
      columns={[
        { key: 'accountName', header: 'Account', type: 'string', width: '200px' },
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
          render: (val) => {
            const badgeVariant =
              val === 'Within' ? 'success' : val === 'Watch' ? 'warning' : 'danger';
            return (
              <Badge variant={badgeVariant as 'default' | 'secondary' | 'destructive' | 'outline'}>
                {String(val ?? '')}
              </Badge>
            );
          },
        },
        {
          key: 'commentary',
          header: 'Commentary',
          type: 'string',
          render: (val, row) => (
            <input
              defaultValue={val as string}
              onBlur={(e) => onCommentaryEdit(row.accountId as string, e.target.value)}
              className="bg-transparent border-none outline-none text-[var(--text-muted)] text-sm w-full focus:text-[var(--text-primary)]"
            />
          ),
        },
      ]}
    />
  );
}
