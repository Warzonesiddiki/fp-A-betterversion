import React from 'react';
import type { ParsedSheet } from '@/engines/ExcelImportEngine';

interface ImportPreviewProps {
  sheet: ParsedSheet;
  selectedSheet: string;
  onSheetChange: (name: string) => void;
  sheetNames: string[];
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({
  sheet = { name: '', rows: [], rowCount: 0, columns: [], headers: [] } as unknown as ParsedSheet,
  selectedSheet = '',
  onSheetChange = () => {},
  sheetNames = [],
}) => {
  const previewRows = sheet.rows.slice(0, 10);

  return (
    <div className="space-y-3" role="region" aria-label="ImportPreview">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Data Preview</h3>
        {sheetNames.length > 1 && (
          <select
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
            value={selectedSheet}
            onChange={(e) => onSheetChange(e.target.value)}
          >
            {sheetNames.map((name) => (
              <option key={name} value={name}>
                {name} ({sheet.rowCount} rows)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="text-xs text-slate-400">
        Showing {previewRows.length} of {sheet.rowCount.toLocaleString()} rows ·{' '}
        {sheet.headers.length} columns
      </div>

      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/50 text-left text-slate-400 uppercase">
              <th className="px-3 py-2 text-slate-500 font-mono" scope="col">
                #
              </th>
              {sheet.headers.map((h) => (
                <th key={h} className="px-3 py-2 whitespace-nowrap" scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {previewRows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-900/30">
                <td className="px-3 py-1.5 text-slate-500 font-mono">{i + 2}</td>
                {sheet.headers.map((h) => {
                  const val = row[h];
                  const isNum =
                    typeof val === 'number' ||
                    (typeof val === 'string' && /^-?[\d,]+\.?\d*$/.test(val.trim()));
                  return (
                    <td
                      key={h}
                      className={`px-3 py-1.5 whitespace-nowrap max-w-[150px] truncate ${
                        isNum ? 'text-blue-300 tabular-nums' : 'text-slate-300'
                      }`}
                    >
                      {val === '' || val == null ? (
                        <span className="text-slate-600 italic">empty</span>
                      ) : (
                        String(val)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
