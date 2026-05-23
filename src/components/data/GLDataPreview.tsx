import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GLDataPreviewProps {
  data: Record<string, unknown>[];
  mappings: Record<string, string>;
  accounts?: { code: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function GLDataPreview({
  data,
  mappings,
  accounts,
  onConfirm,
  onCancel,
}: GLDataPreviewProps) {
  const validationResults = useMemo(() => {
    let errorCount = 0;
    const rows = data.slice(0, 20).map((row, _index) => {
      const errors: string[] = [];

      // Validate Account Code
      const acctCol = mappings['accountCode'];
      const acctValue = acctCol ? row[acctCol] : null;
      if (!acctValue) {
        errors.push('Missing account code');
      } else if (accounts && !accounts.some((a) => a.code === String(acctValue))) {
        errors.push('Account code not in list');
      }

      // Validate Date
      const dateCol = mappings['postDate'];
      const dateValue = dateCol ? row[dateCol] : null;
      if (!dateValue) {
        errors.push('Missing date');
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue))) {
        errors.push('Invalid date format (YYYY-MM-DD)');
      }

      // Validate Amount (Debit/Credit)
      const drCol = mappings['debit'];
      const crCol = mappings['credit'];
      const drValue = drCol ? parseFloat(String(row[drCol])) : 0;
      const crValue = crCol ? parseFloat(String(row[crCol])) : 0;

      if (drCol && isNaN(drValue)) errors.push('Invalid debit amount');
      if (crCol && isNaN(crValue)) errors.push('Invalid credit amount');
      if (!drCol && !crCol) errors.push('Missing amount column');

      if (errors.length > 0) errorCount++;
      return { row, errors };
    });

    return { rows, errorCount, totalCount: data.length };
  }, [data, mappings, accounts]);

  const hasErrors = validationResults.errorCount > 0;

  return (
    <div className="space-y-4">
      {/* Error Summary Bar */}
      <div
        className={cn(
          'p-3 rounded-lg flex items-center justify-between',
          hasErrors
            ? 'bg-red-500/10 border border-red-500/30 text-red-500'
            : 'bg-green-500/10 border border-green-500/30 text-green-500'
        )}
      >
        <div className="flex items-center space-x-2">
          {hasErrors ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span className="font-bold">
            {validationResults.errorCount} errors detected in {validationResults.totalCount} rows
          </span>
        </div>
        <span className="text-xs uppercase tracking-widest font-bold">Validation Result</span>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 font-bold text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Row</th>
              {Object.keys(mappings).map((k) => (
                <th key={k} className="px-4 py-3">
                  {k}
                </th>
              ))}
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {validationResults.rows.map(({ row, errors }, i) => (
              <tr
                key={i}
                className={cn('hover:bg-slate-900/50', errors.length > 0 && 'bg-red-500/5')}
              >
                <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                {Object.entries(mappings).map(([field, col]) => (
                  <td key={field} className="px-4 py-3 text-slate-200">
                    {String(row[col] || '')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  {errors.length > 0 ? (
                    <span className="text-red-400 text-xs font-medium">{errors.join(', ')}</span>
                  ) : (
                    <span className="text-green-500 text-xs font-medium">Valid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={hasErrors}>
          {hasErrors ? 'Fix Errors to Continue' : 'Confirm & Import Data'}
        </Button>
      </div>
    </div>
  );
}
