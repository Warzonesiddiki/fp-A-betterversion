interface DataSummary {
  totalEntries: number;
  totalAccounts: number;
  totalDebit: number;
  totalCredit: number;
  lastImport: { filename: string; timestamp: string } | null;
}

interface DataSummaryCardProps {
  summary: DataSummary;
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

export function DataSummaryCard({ summary }: DataSummaryCardProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Current Data Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-slate-400">Total Entries</div>
          <div className="text-lg font-bold">{summary.totalEntries.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total Accounts</div>
          <div className="text-lg font-bold">{summary.totalAccounts}</div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total Debits</div>
          <div className="text-lg font-bold text-blue-400">
            {currencyFmt.format(summary.totalDebit)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-400">Total Credits</div>
          <div className="text-lg font-bold text-green-400">
            {currencyFmt.format(summary.totalCredit)}
          </div>
        </div>
      </div>
      {summary.lastImport && (
        <div className="mt-2 text-xs text-slate-500">
          Last import: {summary.lastImport.filename} on{' '}
          {new Date(summary.lastImport.timestamp).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
