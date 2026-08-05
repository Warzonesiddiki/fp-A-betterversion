import React from 'react';
import type { AutoColumnMapping, TargetField } from '@/engines/ExcelImportEngine';
import { formatPercent } from '@/utils/financialFormatting';

interface ColumnMapperProps {
  mappings: AutoColumnMapping[];
  onChange: (mappings: AutoColumnMapping[]) => void;
}

const TARGET_FIELDS: { value: TargetField; label: string }[] = [
  { value: 'skip', label: '-- Skip --' },
  { value: 'date', label: 'Date' },
  { value: 'accountCode', label: 'Account Code' },
  { value: 'accountName', label: 'Account Name' },
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
  { value: 'amount', label: 'Amount' },
  { value: 'description', label: 'Description' },
  { value: 'reference', label: 'Reference' },
  { value: 'department', label: 'Department' },
  { value: 'entity', label: 'Entity' },
  { value: 'period', label: 'Period' },
];

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-400';
  if (confidence >= 0.5) return 'text-yellow-400';
  return 'text-red-400';
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-900/30 border-green-800/40';
  if (confidence >= 0.5) return 'bg-yellow-900/30 border-yellow-800/40';
  return 'bg-red-900/30 border-red-800/40';
}

export const ColumnMapper: React.FC<ColumnMapperProps> = ({
  mappings = [],
  onChange = () => {},
}) => {
  const handleChange = (index: number, newField: TargetField) => {
    const updated = [...mappings];
    updated[index] = { ...updated[index]!, targetField: newField };
    onChange(updated);
  };

  const mappedCount = mappings.filter((m) => m.targetField !== 'skip').length;
  const requiredFields: TargetField[] = ['date', 'accountCode'];
  const mappedTargets = new Set(
    mappings.filter((m) => m.targetField !== 'skip').map((m) => m.targetField)
  );
  const missingRequired = requiredFields.filter((f) => !mappedTargets.has(f));

  return (
    <div className="space-y-4" role="region" aria-label="ColumnMapper">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Column Mappings</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {mappedCount}/{mappings.length} columns mapped
          </span>
          {missingRequired.length > 0 && (
            <span className="text-xs text-red-400 px-2 py-0.5 bg-red-900/30 rounded border border-red-800/40">
              Missing: {missingRequired.join(', ')}
            </span>
          )}
        </div>
      </div>

      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50 text-left text-xs text-slate-400 uppercase">
              <th className="px-4 py-2" scope="col">
                Source Column
              </th>
              <th className="px-4 py-2" scope="col">
                Map To
              </th>
              <th className="px-4 py-2" scope="col">
                Confidence
              </th>
              <th className="px-4 py-2" scope="col">
                Reason
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {mappings.map((m, i) => (
              <tr key={m.sourceColumn} className="hover:bg-slate-900/30">
                <td className="px-4 py-2 font-mono text-xs text-slate-300">{m.sourceColumn}</td>
                <td className="px-4 py-2">
                  <select
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white w-full"
                    value={m.targetField}
                    onChange={(e) => handleChange(i, e.target.value as TargetField)}
                  >
                    {TARGET_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${confidenceBadge(m.confidence)} ${confidenceColor(m.confidence)}`}
                  >
                    {formatPercent(m.confidence * 100, 0)}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-500 max-w-[200px] truncate">
                  {m.reason || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
