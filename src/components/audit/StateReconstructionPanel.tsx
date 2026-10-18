// src/components/audit/StateReconstructionPanel.tsx
// Phase 12 tail (R-009): rebuild cell state at any point in time from the
// audit trail alone. The trail's SHA-256 chain is re-verified before any
// value is shown (reconstructState fails closed) — a tampered trail
// produces a refusal, never reconstructed "data".

import { useState } from 'react';
import { History, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { reconstructState, type StateReconstruction } from '@/services/audit/reconstructState';
import { useAuditTrailStore } from '@/store/auditTrailStore';

const MAX_ROWS = 20;

export function StateReconstructionPanel() {
  const entries = useAuditTrailStore((s) => s.entries);
  const chainHead = useAuditTrailStore((s) => s.chainHead);
  const [asOfText, setAsOfText] = useState('');
  const [result, setResult] = useState<StateReconstruction | null>(null);

  const run = () => {
    const parsed = asOfText ? Date.parse(asOfText) : NaN;
    setResult(
      reconstructState(entries, {
        asOf: Number.isFinite(parsed) ? parsed : undefined,
        expectedHead: chainHead,
      })
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4" /> State reconstruction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Rebuilds cell values from the append-only audit trail. The integrity chain is verified
          first; a tampered trail is refused, not reconstructed.
        </p>
        {entries.length === 0 ? (
          <p className="text-sm">
            No audit entries recorded yet — nothing to reconstruct. Absence of a trail is shown as
            absence, never as zeroed state.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm">
                As of (optional)
                <input
                  type="datetime-local"
                  aria-label="As of"
                  value={asOfText}
                  onChange={(e) => setAsOfText(e.target.value)}
                  className="mt-1 block rounded-md border border-input bg-background px-2 py-1"
                />
              </label>
              <Button type="button" onClick={run}>
                Reconstruct state
              </Button>
            </div>
            {result && !result.ok && (
              <div role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Reconstruction refused — the audit trail failed integrity verification:{' '}
                  {result.breaks.map((b) => b.reason).join('; ')}
                </span>
              </div>
            )}
            {result?.ok && (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Chain verified · {result.cells.size} cell(s) rebuilt · {result.applied}{' '}
                  state-changing entr{result.applied === 1 ? 'y' : 'ies'} applied
                  {result.asOf !== null && ` · as of ${new Date(result.asOf).toLocaleString()}`}
                </p>
                {result.cells.size === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No cell state exists at that point in the trail.
                  </p>
                ) : (
                  <ul className="max-h-64 space-y-1 overflow-auto text-xs">
                    {[...result.cells.entries()].slice(0, MAX_ROWS).map(([key, value]) => (
                      <li key={key} className="rounded bg-muted/50 px-2 py-1 font-mono">
                        {key} = {JSON.stringify(value)}
                      </li>
                    ))}
                  </ul>
                )}
                {result.cells.size > MAX_ROWS && (
                  <p className="text-xs text-muted-foreground">
                    Showing first {MAX_ROWS} of {result.cells.size} cells.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default StateReconstructionPanel;
