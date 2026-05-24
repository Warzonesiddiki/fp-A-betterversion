import { FileDropZone } from '@/components/ui/FileDropZone';

export function GLDropZone() {
  return (
    <div className="space-y-4">
      <FileDropZone
        accept=".csv,.xlsx"
        onFile={() => {
          /* handled by parent */
        }}
      />
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400 mb-2">Expected columns:</p>
        <p>accountCode, postDate, debit, credit, entityId, departmentId, description</p>
      </div>
    </div>
  );
}
