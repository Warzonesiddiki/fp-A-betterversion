import { Badge } from '@/components/ui/Badge';
import { Database } from 'lucide-react';

interface ImportJob {
  id: string;
  filename: string;
  fileType: string;
  rowCount: number;
  status: string;
  startedAt: string;
}

interface ImportJobHistoryProps {
  jobs: ImportJob[];
}

export function ImportJobHistory({ jobs }: ImportJobHistoryProps) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-purple-400" aria-hidden="true" />
        <h3 className="font-semibold">Import Job History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="grid" aria-label="Import job history">
          <thead>
            <tr
              className="text-left text-slate-400 text-xs uppercase border-b border-slate-800"
              role="row"
            >
              <th className="pb-3 pr-4" role="columnheader" scope="col">
                File
              </th>
              <th className="pb-3 pr-4" role="columnheader" scope="col">
                Type
              </th>
              <th className="pb-3 pr-4" role="columnheader" scope="col">
                Rows
              </th>
              <th className="pb-3 pr-4" role="columnheader" scope="col">
                Status
              </th>
              <th className="pb-3" role="columnheader" scope="col">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {jobs.slice(0, 10).map((job) => (
              <tr key={job.id} className="hover:bg-slate-900/50" role="row">
                <td className="py-2 pr-4 font-mono text-xs" role="gridcell">
                  {job.filename}
                </td>
                <td className="py-2 pr-4" role="gridcell">
                  {job.fileType}
                </td>
                <td className="py-2 pr-4" role="gridcell">
                  {job.rowCount.toLocaleString()}
                </td>
                <td className="py-2 pr-4" role="gridcell">
                  <Badge
                    variant={
                      job.status === 'Completed'
                        ? 'default'
                        : job.status === 'Failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {job.status}
                  </Badge>
                </td>
                <td className="py-2 text-xs text-slate-400" role="gridcell">
                  {new Date(job.startedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
