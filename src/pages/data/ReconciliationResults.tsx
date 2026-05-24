import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertTriangle, XCircle, Download } from 'lucide-react';

interface RecResult {
  matching: number;
  mismatches: number;
  missing: number;
  details: { key: string; expected: number; actual: number; diff: number }[];
}

interface ReconciliationResultsProps {
  result: RecResult;
}

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
});

const currencySignFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  signDisplay: 'exceptZero',
});

export function ReconciliationResults({ result }: ReconciliationResultsProps) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Reconciliation Results</h3>
      <div className="grid grid-cols-3 gap-4 mb-4" role="group" aria-label="Reconciliation summary">
        <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30 text-center">
          <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto mb-1" aria-hidden="true" />
          <div
            className="text-xl font-bold text-green-400"
            aria-label={`${result.matching} matching`}
          >
            {result.matching}
          </div>
          <div className="text-xs text-green-400/70">Matching</div>
        </div>
        <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30 text-center">
          <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" aria-hidden="true" />
          <div
            className="text-xl font-bold text-red-400"
            aria-label={`${result.mismatches} mismatches`}
          >
            {result.mismatches}
          </div>
          <div className="text-xs text-red-400/70">Mismatches</div>
        </div>
        <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30 text-center">
          <AlertTriangle className="h-5 w-5 text-yellow-400 mx-auto mb-1" aria-hidden="true" />
          <div
            className="text-xl font-bold text-yellow-400"
            aria-label={`${result.missing} missing`}
          >
            {result.missing}
          </div>
          <div className="text-xs text-yellow-400/70">Missing</div>
        </div>
      </div>
      <div className="overflow-x-auto" aria-live="polite">
        <table className="w-full text-sm" role="grid" aria-label="Reconciliation details">
          <thead>
            <tr
              className="text-left text-slate-400 text-xs uppercase border-b border-slate-800"
              role="row"
            >
              <th className="pb-3 pr-4" role="columnheader" scope="col">
                Account Key
              </th>
              <th className="pb-3 pr-4 text-right" role="columnheader" scope="col">
                Expected (GL)
              </th>
              <th className="pb-3 pr-4 text-right" role="columnheader" scope="col">
                Actual (File)
              </th>
              <th className="pb-3 pr-4 text-right" role="columnheader" scope="col">
                Difference
              </th>
              <th className="pb-3" role="columnheader" scope="col">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {result.details
              .filter((d) => d.expected !== 0 || d.actual !== 0)
              .map((d) => {
                const status =
                  d.expected === 0 ? 'missing' : Math.abs(d.diff) < 0.01 ? 'match' : 'mismatch';
                return (
                  <tr
                    key={d.key}
                    className={`hover:bg-slate-900/50 ${
                      status === 'mismatch'
                        ? 'bg-red-900/10'
                        : status === 'missing'
                          ? 'bg-yellow-900/10'
                          : ''
                    }`}
                  >
                    <td className="py-3 pr-4 font-mono text-xs">{d.key}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {currencyFmt.format(d.expected)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {currencyFmt.format(d.actual)}
                    </td>
                    <td
                      className={`py-3 pr-4 text-right tabular-nums font-medium ${
                        Math.abs(d.diff) < 0.01
                          ? 'text-slate-400'
                          : d.diff > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                      }`}
                    >
                      {currencySignFmt.format(d.diff)}
                    </td>
                    <td className="py-3">
                      {status === 'match' && (
                        <Badge variant="default" className="text-[10px]">
                          Match
                        </Badge>
                      )}
                      {status === 'mismatch' && (
                        <Badge variant="destructive" className="text-[10px]">
                          Mismatch
                        </Badge>
                      )}
                      {status === 'missing' && (
                        <Badge variant="secondary" className="text-[10px]">
                          Missing
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button size="sm" variant="ghost" aria-label="Export differences to file">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export Differences
        </Button>
      </div>
    </div>
  );
}
