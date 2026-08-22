// =============================================================================
// IC ELIMINATION PAGE — intercompany matching & elimination client surface
// -----------------------------------------------------------------------------
// K30 four-states rewrite. The previous revision fabricated four demo IC pairs
// (`mockPairs`, amounts 50,000 / 50,000 / 25,000 / 24,800) in component state
// and rendered them as if they were posted balances — a K17/K18 violation
// (no invented financial values). This page renders ONLY what the real
// IntercompanyMatchingEngine holds:
//   - empty engine   → shared EmptyState under the page h1 (nothing invented)
//   - action failure → shared ErrorState (role=alert) whose retry re-runs the
//                      exact failed action (PeriodClosePage idiom)
//   - engine data    → reconciliation table + status stats, amounts formatted
//                      from each transaction's own currency
// Loading skeleton: deliberately ABSENT. Every read and every action here is
// synchronous (engine module state, no fetch); a hydrate skeleton would fake an
// asynchrony that does not exist — same honesty test as ScenarioBuilderPage,
// which ships without one for exactly this reason.
// =============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { GitCompare, CheckCircle2, AlertCircle, Wand2, Layers } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  IntercompanyMatchingEngine,
  type ICTransaction,
} from '@/engines/IntercompanyMatchingEngine';
import { formatMoney } from '@/utils/money';
import { useAuthStore } from '@/store/authStore';

/** One display row: an owned snapshot copy of an engine transaction leg. */
interface ICPairRow {
  id: string;
  fromEntity: string;
  toEntity: string;
  accountCode: string;
  amount: number;
  currency: string;
  status: 'Unmatched' | 'Matched' | 'Eliminated';
}

/** The two actions this page can run against the matching engine. */
type ICAction = 'auto-match' | 'post-eliminations';

function rowFromTransaction(tx: ICTransaction, status: ICPairRow['status']): ICPairRow {
  return {
    id: tx.id,
    fromEntity: tx.fromEntity,
    toEntity: tx.toEntity,
    accountCode: tx.accountCode,
    amount: tx.amount,
    currency: tx.currency,
    status,
  };
}

/**
 * Snapshot the engine's module state into owned plain rows. Reads are
 * synchronous; matched/eliminated legs carry their live status on the
 * transaction objects held by each match (createEliminations mutates them).
 */
function readEngineRows(): ICPairRow[] {
  const rows: ICPairRow[] = [];
  for (const tx of IntercompanyMatchingEngine.getUnmatched()) {
    rows.push(rowFromTransaction(tx, 'Unmatched'));
  }
  for (const match of IntercompanyMatchingEngine.getMatches()) {
    const debit = match.debitTransaction;
    const credit = match.creditTransaction;
    const status =
      debit.status === 'eliminated' || credit.status === 'eliminated'
        ? ('Eliminated' as const)
        : ('Matched' as const);
    rows.push(rowFromTransaction(debit, status), rowFromTransaction(credit, status));
  }
  return rows;
}

export default function ICEliminationPage() {
  const user = useAuthStore((s) => s.user);

  const [rows, setRows] = useState<ICPairRow[]>(readEngineRows);
  const [actionError, setActionError] = useState<string | null>(null);
  // K30 four-states: remembers which action failed so the ErrorState retry
  // control re-runs exactly that action.
  const [lastFailedAction, setLastFailedAction] = useState<ICAction | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Intercompany Elimination';
  }, []);

  const refresh = useCallback(() => setRows(readEngineRows()), []);

  const runAction = useCallback(
    (action: ICAction) => {
      setActionError(null);
      setLastFailedAction(action);
      try {
        if (action === 'auto-match') {
          IntercompanyMatchingEngine.autoMatch();
        } else {
          // Real clock period label (same convention the engine uses
          // internally); attribution uses the signed-in user, never a stub.
          const period = new Date().toISOString().slice(0, 7);
          IntercompanyMatchingEngine.createEliminations(period, user?.id ?? 'anonymous');
        }
        refresh();
        setLastFailedAction(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Intercompany action failed');
      }
    },
    [refresh, user]
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      matched: rows.filter((r) => r.status === 'Matched').length,
      eliminated: rows.filter((r) => r.status === 'Eliminated').length,
      unmatched: rows.filter((r) => r.status === 'Unmatched').length,
    }),
    [rows]
  );

  if (rows.length === 0 && !actionError) {
    // K30 four-states: honest empty state under the page-level h1 — the
    // matching engine holds no IC transactions, so none are displayed or
    // invented here. The CTA re-reads the engine (a real refresh affordance),
    // mirroring how ScenarioBuilderPage routes users toward importing data.
    return (
      <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="ic-elimination-heading">
        <PageHeader
          title="Intercompany Elimination"
          titleId="ic-elimination-heading"
          purpose="Reconcile and eliminate intercompany balances across the group."
        />
        <EmptyState
          variant="no-data"
          title="No intercompany transactions loaded"
          description="Intercompany transactions appear here once consolidation data with IC legs is imported into the matching engine. No demo balances are invented on this page."
          action={
            <Button onClick={refresh} data-testid="ic-empty-recheck">
              Re-check for transactions
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl" aria-labelledby="ic-elimination-heading">
      {actionError && (
        /* K30 four-states: shared ErrorState (role=alert) whose retry control
           re-runs exactly the failed action. */
        <ErrorState
          title="Intercompany action failed"
          message={actionError}
          errorCode="IC-ELIMINATION-ACTION"
          className="py-8"
          onRetry={lastFailedAction ? () => runAction(lastFailedAction) : undefined}
          retryLabel={
            lastFailedAction === 'post-eliminations'
              ? 'Retry posting eliminations'
              : 'Retry auto-match'
          }
        />
      )}

      <PageHeader
        title="Intercompany Elimination"
        titleId="ic-elimination-heading"
        purpose="Reconcile and eliminate intercompany balances across the group."
        actions={
          <div className="flex gap-2" role="group" aria-label="Intercompany elimination actions">
            <Button onClick={() => runAction('auto-match')} data-testid="ic-auto-match">
              <Wand2 className="h-4 w-4 mr-2" aria-hidden="true" /> Auto-Match
            </Button>
            {/* Engine semantics: createEliminations posts EVERY currently
                matched pair, so this is an explicit batch control rather than
                a per-row button that would claim narrower scope than it has. */}
            <Button
              variant="outline"
              disabled={stats.matched === 0}
              onClick={() => runAction('post-eliminations')}
              data-testid="ic-post-eliminations"
            >
              <Layers className="h-4 w-4 mr-2" aria-hidden="true" /> Post Eliminations
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="ic-kpis">
        <Card className="bg-[var(--bg-surface)] border-[var(--border-subtle)]">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)]">Total Pairs</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/10">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)] text-emerald-400">Matched</div>
            <div className="text-2xl font-bold text-emerald-400">{stats.matched}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/10">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)] text-blue-400">Eliminated</div>
            <div className="text-2xl font-bold text-blue-400">{stats.eliminated}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/5 border-red-500/10">
          <CardContent className="p-4">
            <div className="text-xs text-[var(--text-secondary)] text-red-400">Unmatched</div>
            <div className="text-2xl font-bold text-red-400">{stats.unmatched}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <CardHeader>
          <CardTitle>Reconciliation Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums" data-testid="ic-pairs-table">
              <thead className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium">
                <tr>
                  <th className="py-3 px-4" scope="col">
                    From Entity
                  </th>
                  <th className="py-3 px-4 text-center" scope="col">
                    <GitCompare className="h-4 w-4 mx-auto opacity-40" aria-hidden="true" />
                    <span className="sr-only">Direction</span>
                  </th>
                  <th className="py-3 px-4" scope="col">
                    To Entity
                  </th>
                  <th className="py-3 px-4" scope="col">
                    Account
                  </th>
                  <th className="py-3 px-4 text-right" scope="col">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-center" scope="col">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)]">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                    <td className="py-3 px-4 font-medium">{row.fromEntity}</td>
                    <td className="py-3 px-4 text-center" aria-hidden="true">
                      →
                    </td>
                    <td className="py-3 px-4 font-medium">{row.toEntity}</td>
                    <td className="py-3 px-4 font-mono text-xs">{row.accountCode}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {formatMoney(row.amount, { currency: row.currency })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.status === 'Matched' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3 mr-1" aria-hidden="true" /> Matched
                        </Badge>
                      ) : row.status === 'Eliminated' ? (
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          Eliminated
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                          <AlertCircle className="h-3 w-3 mr-1" aria-hidden="true" /> Unmatched
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
