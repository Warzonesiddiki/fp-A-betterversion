/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import {
  ICMatchingEngine,
  type ICTransaction,
  type MatchPair,
  type MatchSummary,
  type ToleranceSettings,
} from '@/engines/ICMatchingEngine';
import type { GLEntry } from '@/types';

// =============================================================================
// IC MATCHING PANEL
// Auto-detect IC pairs across entities with tolerance, manual override,
// and elimination journal entry generation
// =============================================================================

interface ICMatchingPanelProps {
  entries: GLEntry[];
  entityNames: Record<string, string>;
  period: string;
  onEliminationsGenerated?: (
    eliminations: ReturnType<ICMatchingEngine['generateEliminations']>
  ) => void;
  className?: string;
}

export function ICMatchingPanel({
  entries = [],
  entityNames = {},
  period = '',
  onEliminationsGenerated,
  className,
}: ICMatchingPanelProps) {
  const [engine] = useState(() => new ICMatchingEngine());
  const [tolerance, setTolerance] = useState<ToleranceSettings>(engine.getTolerance());
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [selectedSource, setSelectedSource] = useState<ICTransaction | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ICTransaction | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  // Auto-detect IC transactions from GL entries
  const icTransactions = useMemo(
    () => ICMatchingEngine.detectICTransactions(entries, entityNames, tolerance),
    [entries, entityNames, tolerance]
  );

  // Split into source (positive) and target (negative) by amount sign
  const sourceTransactions = useMemo(
    () => icTransactions.filter((t) => t.amount > 0),
    [icTransactions]
  );
  const targetTransactions = useMemo(
    () => icTransactions.filter((t) => t.amount < 0),
    [icTransactions]
  );

  // Matching summary
  const summary = useMemo<MatchSummary>(
    () => engine.getSummary(sourceTransactions, targetTransactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, sourceTransactions, targetTransactions, matches]
  );

  // Unmatched transactions
  const unmatched = useMemo(
    () => engine.getUnmatched(icTransactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, icTransactions, matches]
  );

  // Run auto-matching
  const handleAutoMatch = useCallback(() => {
    setIsMatching(true);
    engine.setTolerance(tolerance);
    const newMatches = engine.autoMatch(sourceTransactions, targetTransactions);
    setMatches([...newMatches]);
    setIsMatching(false);
  }, [engine, sourceTransactions, targetTransactions, tolerance]);

  // Manual match override
  const handleManualMatch = useCallback(() => {
    if (!selectedSource || !selectedTarget) return;
    engine.manualMatch(selectedSource, selectedTarget);
    setMatches([...engine.getMatches()]);
    setSelectedSource(null);
    setSelectedTarget(null);
  }, [engine, selectedSource, selectedTarget]);

  // Unmatch a pair
  const handleUnmatch = useCallback(
    (matchId: string) => {
      engine.unmatch(matchId);
      setMatches([...engine.getMatches()]);
    },
    [engine]
  );

  // Generate elimination journal entries
  const handleGenerateEliminations = useCallback(() => {
    const accountNames: Record<string, string> = {};
    for (const t of icTransactions) {
      accountNames[t.accountCode] = t.accountName;
    }
    const eliminations = engine.generateEliminations(matches, accountNames);
    onEliminationsGenerated?.(eliminations);
  }, [engine, matches, icTransactions, onEliminationsGenerated]);

  // Unique entities for the unmatched panels
  const entities = useMemo(() => {
    const set = new Set(icTransactions.map((t) => t.entityId));
    return Array.from(set);
  }, [icTransactions]);

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="ICMatchingPanel">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Detected IC Pairs" value={icTransactions.length} />
        <StatCard label="Matched" value={summary.matchedCount} variant="success" />
        <StatCard label="Partial" value={summary.partiallyMatchedCount} variant="warning" />
        <StatCard label="Match Rate" value={`${summary.matchRate.toFixed(1)}%`} variant="info" />
      </div>

      {/* Tolerance & Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <ToleranceInput
              label="Amount Tolerance ($)"
              value={tolerance.amountTolerance}
              onChange={(v) => setTolerance({ ...tolerance, amountTolerance: v })}
            />
            <ToleranceInput
              label="% Tolerance"
              value={tolerance.percentageTolerance}
              onChange={(v) => setTolerance({ ...tolerance, percentageTolerance: v })}
            />
            <ToleranceInput
              label="Date Tolerance (days)"
              value={tolerance.dateToleranceDays}
              onChange={(v) => setTolerance({ ...tolerance, dateToleranceDays: v })}
            />
            <Button onClick={handleAutoMatch} disabled={isMatching}>
              {isMatching ? 'Matching...' : 'Auto-Match'}
            </Button>
            <Button
              variant="outline"
              onClick={handleManualMatch}
              disabled={!selectedSource || !selectedTarget}
            >
              Manual Override
            </Button>
            <Button
              variant="outline"
              onClick={handleGenerateEliminations}
              disabled={matches.length === 0}
            >
              Generate Eliminations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Matched Pairs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matched Pairs ({matches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2" scope="col">
                    Status
                  </th>
                  <th className="p-2" scope="col">
                    Source Entity
                  </th>
                  <th className="p-2" scope="col">
                    Target Entity
                  </th>
                  <th className="p-2" scope="col">
                    Account
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Source Amt
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Target Amt
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Difference
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Confidence
                  </th>
                  <th className="p-2" scope="col">
                    Method
                  </th>
                  <th className="p-2" scope="col">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr
                    key={match.id}
                    className={cn(
                      'border-b hover:bg-muted/50',
                      match.status === 'matched' && 'bg-green-50 dark:bg-green-950/20',
                      match.status === 'partial' && 'bg-yellow-50 dark:bg-yellow-950/20'
                    )}
                  >
                    <td className="p-2">
                      <StatusBadge status={match.status} />
                    </td>
                    <td className="p-2">{match.source.entityName}</td>
                    <td className="p-2">{match.target.entityName}</td>
                    <td className="p-2 font-mono text-xs">{match.source.accountCode}</td>
                    <td className="p-2 text-right font-mono">
                      {formatCurrency(match.source.amount)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatCurrency(match.target.amount)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatCurrency(match.amountDifference)}
                    </td>
                    <td className="p-2 text-right">{(match.confidence * 100).toFixed(0)}%</td>
                    <td className="p-2 text-xs capitalize">{match.method.replace('_', ' ')}</td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => handleUnmatch(match.id)}>
                        Unmatch
                      </Button>
                    </td>
                  </tr>
                ))}
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      No matches yet. Adjust tolerance and run Auto-Match, or select two
                      transactions for Manual Override.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unmatched Panels for Manual Override */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnmatchedPanel
          label="Source Transactions (Debit)"
          transactions={sourceTransactions}
          unmatched={unmatched.filter((t) => sourceTransactions.some((s) => s.id === t.id))}
          selected={selectedSource}
          onSelect={setSelectedSource}
          entityNames={entityNames}
        />
        <UnmatchedPanel
          label="Target Transactions (Credit)"
          transactions={targetTransactions}
          unmatched={unmatched.filter((t) => targetTransactions.some((s) => s.id === t.id))}
          selected={selectedTarget}
          onSelect={setSelectedTarget}
          entityNames={entityNames}
        />
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StatCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  const border = {
    default: '',
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
  };
  return (
    <Card className={border[variant]}>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ToleranceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-28"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    matched: 'default',
    partial: 'secondary',
    unmatched: 'destructive',
  };
  return <Badge variant={variant[status] ?? 'outline'}>{status}</Badge>;
}

function UnmatchedPanel({
  label,
  transactions,
  unmatched,
  selected,
  onSelect,
  entityNames,
}: {
  label: string;
  transactions: ICTransaction[];
  unmatched: ICTransaction[];
  selected: ICTransaction | null;
  onSelect: (t: ICTransaction | null) => void;
  entityNames: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {label} — {unmatched.length} unmatched / {transactions.length} total
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2" scope="col">
                  Entity
                </th>
                <th className="p-2" scope="col">
                  Account
                </th>
                <th className="p-2 text-right" scope="col">
                  Amount
                </th>
                <th className="p-2" scope="col">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {unmatched.map((t) => (
                <tr
                  key={t.id}
                  className={cn(
                    'cursor-pointer border-b hover:bg-muted/50',
                    selected?.id === t.id && 'bg-blue-50 dark:bg-blue-950/20'
                  )}
                  onClick={() => onSelect(selected?.id === t.id ? null : t)}
                >
                  <td className="p-2">{entityNames[t.entityId] ?? t.entityId}</td>
                  <td className="p-2 font-mono text-xs">{t.accountCode}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(t.amount)}</td>
                  <td className="p-2 text-xs">{t.date}</td>
                </tr>
              ))}
              {unmatched.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    All transactions matched
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
