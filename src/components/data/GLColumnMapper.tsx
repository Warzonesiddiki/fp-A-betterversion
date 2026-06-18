import { useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface GLColumnMapperProps {
  csvColumns: string[];
  mappings: Record<string, string>;
  onMap: (field: string, csvCol: string) => void;
  onAutoMap?: (newMappings: Record<string, string>) => void;
}

const targetFields = [
  { key: 'accountCode', label: 'Account Code', required: true },
  { key: 'postDate', label: 'Posting Date', required: true },
  { key: 'debit', label: 'Debit', required: false },
  { key: 'credit', label: 'Credit', required: false },
  { key: 'entityId', label: 'Entity ID', required: false },
  { key: 'departmentId', label: 'Department ID', required: false },
  { key: 'description', label: 'Description', required: false },
];

function autoDetect(csvColumn: string): string | null {
  const lower = csvColumn.toLowerCase().trim();
  const fieldMap: Record<string, string> = {
    account: 'accountCode',
    code: 'accountCode',
    'account code': 'accountCode',
    acct: 'accountCode',
    date: 'postDate',
    'post date': 'postDate',
    'posting date': 'postDate',
    period: 'postDate',
    debit: 'debit',
    dr: 'debit',
    'amount dr': 'debit',
    credit: 'credit',
    cr: 'credit',
    'amount cr': 'credit',
    entity: 'entityId',
    company: 'entityId',
    'entity code': 'entityId',
    org: 'entityId',
    department: 'departmentId',
    dept: 'departmentId',
    'cost center': 'departmentId',
    cc: 'departmentId',
    description: 'description',
    desc: 'description',
    memo: 'description',
    narrative: 'description',
  };
  return fieldMap[lower] || null;
}

export function GLColumnMapper({ csvColumns, mappings, onMap, onAutoMap }: GLColumnMapperProps) {
  useEffect(() => {
    if (onAutoMap && Object.keys(mappings).length === 0 && csvColumns.length > 0) {
      const newMappings: Record<string, string> = {};
      csvColumns.forEach((col) => {
        const field = autoDetect(col);
        if (field && !Object.values(newMappings).includes(col)) {
          newMappings[field] = col;
        }
      });
      if (Object.keys(newMappings).length > 0) {
        onAutoMap(newMappings);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on mount when no mappings exist
  }, [csvColumns, onAutoMap]);

  const options = [
    { value: '', label: '-- Skip Column --' },
    ...csvColumns.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="space-y-4" role="region" aria-label="GLColumnMapper">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {targetFields.map((f) => {
          const isMapped = !!mappings[f.key];
          return (
            <div
              key={f.key}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                isMapped
                  ? 'bg-green-50/10 border-green-500/30'
                  : f.required
                    ? 'bg-red-50/10 border-red-500/30'
                    : 'bg-slate-900 border-slate-800'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-200">{f.label}</span>
                  {f.required && <span className="text-red-600 text-xs">*Required</span>}
                </div>
                {isMapped ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  f.required && <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <Select
                value={mappings[f.key] || ''}
                onChange={(val) => onMap(f.key, val)}
                options={options}
                className="w-full"
              />
            </div>
          );
        })}
      </div>

      {csvColumns.length === 0 && (
        <div className="text-center py-8 bg-slate-900 rounded-lg border border-dashed border-slate-800">
          <p className="text-slate-400 text-sm">
            No columns detected. Please upload a valid CSV file.
          </p>
        </div>
      )}
    </div>
  );
}
