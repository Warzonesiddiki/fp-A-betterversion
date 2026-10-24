import { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { parseGLRows } from '@/services/import/parseGLRows';

/**
 * Data rows rendered in the preview table. This is a DISPLAY window only —
 * every row is validated (see below). The previous implementation validated
 * only these rows while the banner claimed the error count covered the whole
 * file, so a broken row past row 20 left Confirm enabled and imported a file
 * the preview had never checked.
 */
const DISPLAY_LIMIT = 20;

/** Source-file row of the first data row: the header occupies row 1. */
const FIRST_DATA_ROW = 2;

export interface GLDataPreviewProps {
  data: readonly Readonly<Record<string, string | undefined>>[];
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
  const validation = useMemo(() => {
    // One source of truth: the import path rejects rows through `parseGLRows`,
    // so the preview asks the SAME function instead of re-implementing a
    // second, disagreeing rule set (it used to parse amounts with parseFloat
    // and reject blank cells the importer accepts as 0).
    const { rejections } = parseGLRows(data, mappings);

    const reasonsByRow = new Map<number, string[]>();
    const reject = (sourceRow: number, reason: string): void => {
      const reasons = reasonsByRow.get(sourceRow);
      if (reasons) {
        if (!reasons.includes(reason)) reasons.push(reason);
      } else {
        reasonsByRow.set(sourceRow, [reason]);
      }
    };
    for (const rejection of rejections) reject(rejection.row, rejection.reason);

    // Optional advisory, not part of the import contract: `GLUploadPage`
    // does not pass `accounts`, so this only fires for callers that supply a
    // chart of accounts and want unknown codes surfaced before import.
    if (accounts) {
      const known = new Set(accounts.map((a) => a.code));
      const accountColumn = mappings['accountCode'];
      data.forEach((row, index) => {
        const code = accountColumn ? String(row[accountColumn] ?? '').trim() : '';
        if (code && !known.has(code)) {
          reject(index + FIRST_DATA_ROW, 'Account code not in list');
        }
      });
    }

    const total = data.length;
    const rows = data.slice(0, DISPLAY_LIMIT).map((row, index) => {
      const sourceRow = index + FIRST_DATA_ROW;
      return { row, sourceRow, errors: reasonsByRow.get(sourceRow) ?? [] };
    });
    const rejectedRows = [...reasonsByRow.keys()].sort((a, b) => a - b);
    // Rows past the display window are invisible in the table, so they need a
    // named list; rows inside the window carry their reasons in the status
    // cell and are not repeated here.
    const lastDisplayedRow = DISPLAY_LIMIT + FIRST_DATA_ROW - 1;
    const offWindowRejectedRows = rejectedRows.filter((row) => row > lastDisplayedRow);

    return {
      rows,
      reasonsByRow,
      rejectedRows,
      offWindowRejectedRows,
      errorCount: rejectedRows.length,
      total,
    };
  }, [data, mappings, accounts]);

  const hasErrors = validation.errorCount > 0;

  return (
    <div className="space-y-4" role="region" aria-label="GLDataPreview">
      {/* Error Summary Bar */}
      <div
        className={cn(
          'p-3 rounded-lg flex items-center justify-between',
          hasErrors
            ? 'bg-red-500/10 border border-red-500/30 text-red-600'
            : 'bg-green-500/10 border border-green-500/30 text-green-600'
        )}
      >
        <div className="flex items-center space-x-2">
          {hasErrors ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span className="font-bold">
            {validation.errorCount} errors detected in {validation.total} rows
          </span>
        </div>
        <span className="text-xs uppercase tracking-widest font-bold">Validation Result</span>
      </div>

      {/* Validation scope: every row is checked; only the table is windowed. */}
      <p className="text-xs text-[var(--text-muted)]">
        All {validation.total} data rows checked against the import rules ·{' '}
        {validation.total > DISPLAY_LIMIT
          ? `Showing the first ${DISPLAY_LIMIT} of ${validation.total} data rows`
          : `Showing all ${validation.total} data rows`}
      </p>

      {/* Rejected rows outside the display window must still be nameable. */}
      {validation.offWindowRejectedRows.length > 0 && (
        <div
          role="group"
          aria-label="Rejected rows"
          className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] p-3"
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            {validation.offWindowRejectedRows.length} rejected row
            {validation.offWindowRejectedRows.length === 1 ? '' : 's'} outside the preview window —
            correct the source and re-upload.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
            {validation.offWindowRejectedRows.slice(0, DISPLAY_LIMIT).map((sourceRow) => (
              <li key={sourceRow} className="font-mono">
                Row {sourceRow}: {validation.reasonsByRow.get(sourceRow)!.join('; ')}
              </li>
            ))}
            {validation.offWindowRejectedRows.length > DISPLAY_LIMIT && (
              <li>… and {validation.offWindowRejectedRows.length - DISPLAY_LIMIT} more rows</li>
            )}
          </ul>
        </div>
      )}

      <div className="border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-900 text-slate-400 font-bold text-xs uppercase">
            <tr>
              <th className="px-4 py-3" scope="col">
                Row
              </th>
              {Object.keys(mappings).map((k) => (
                <th key={k} className="px-4 py-3" scope="col">
                  {k}
                </th>
              ))}
              <th className="px-4 py-3" scope="col">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {validation.rows.map(({ row, sourceRow, errors }) => (
              <tr
                key={sourceRow}
                className={cn('hover:bg-slate-900/50', errors.length > 0 && 'bg-red-500/5')}
              >
                <td className="px-4 py-3 text-[var(--text-muted)]">{sourceRow}</td>
                {Object.entries(mappings).map(([field, col]) => (
                  <td key={field} className="px-4 py-3 text-slate-200">
                    {String(row[col] || '')}
                  </td>
                ))}
                <td className="px-4 py-3">
                  {errors.length > 0 ? (
                    <span className="text-red-400 text-xs font-medium">{errors.join(', ')}</span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium">Valid</span>
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
