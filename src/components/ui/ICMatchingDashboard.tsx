/* eslint-disable jsx-a11y/label-has-associated-control */
import { useCallback, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { Select } from './Select';
import { Input } from './Input';

import { cn } from '@/utils/cn';
import {
  ICMatchingEngine,
  type ICTransaction,
  type MatchPair,
  type MatchSummary,
  type ToleranceSettings,
} from '@/engines/ICMatchingEngine';

// =============================================================================
// IC MATCHING DASHBOARD
// =============================================================================

interface ICMatchingDashboardProps {
  sourceTransactions: ICTransaction[];
  targetTransactions: ICTransaction[];
  allTransactions: ICTransaction[];
  entityNames: Record<string, string>;
  onMatch?: (match: MatchPair) => void;
  onUnmatch?: (matchId: string) => void;
  onAutoMatch?: (matches: MatchPair[]) => void;
  onGenerateEliminations?: (matches: MatchPair[]) => void;
  className?: string;
}

export function ICMatchingDashboard({
  sourceTransactions,
  targetTransactions,
  allTransactions,
  entityNames,
  onMatch,
  onUnmatch,
  onAutoMatch,
  onGenerateEliminations,
  className,
}: ICMatchingDashboardProps) {
  const [engine] = useState(() => new ICMatchingEngine());
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [tolerance, setTolerance] = useState<ToleranceSettings>(engine.getTolerance());
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isMatching, setIsMatching] = useState(false);
  const [selectedSource, setSelectedSource] = useState<ICTransaction | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<ICTransaction | null>(null);

  // Unique entities and accounts for filters
  const entities = useMemo(() => {
    const set = new Set(allTransactions.map((t) => t.entityId));
    return Array.from(set);
  }, [allTransactions]);

  const accounts = useMemo(() => {
    const set = new Set(allTransactions.map((t) => t.accountCode));
    return Array.from(set).sort();
  }, [allTransactions]);

  // Summary stats
  const summary = useMemo<MatchSummary>(
    () => engine.getSummary(sourceTransactions, targetTransactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, sourceTransactions, targetTransactions, matches]
  );

  // Unmatched transactions
  const unmatched = useMemo(
    () => engine.getUnmatched(allTransactions),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [engine, allTransactions, matches]
  );

  // Filtered matches
  const filteredMatches = useMemo(() => {
    let filtered = matches;
    if (filterEntity !== 'all') {
      filtered = filtered.filter(
        (m) => m.source.entityId === filterEntity || m.target.entityId === filterEntity
      );
    }
    if (filterAccount !== 'all') {
      filtered = filtered.filter((m) => m.source.accountCode === filterAccount);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((m) => m.status === filterStatus);
    }
    return filtered;
  }, [matches, filterEntity, filterAccount, filterStatus]);

  // Auto-match handler
  const handleAutoMatch = useCallback(() => {
    setIsMatching(true);
    engine.setTolerance(tolerance);
    const newMatches = engine.autoMatch(sourceTransactions, targetTransactions);
    setMatches([...newMatches]);
    onAutoMatch?.(newMatches);
    setIsMatching(false);
  }, [engine, sourceTransactions, targetTransactions, tolerance, onAutoMatch]);

  // Manual match handler
  const handleManualMatch = useCallback(() => {
    if (!selectedSource || !selectedTarget) return;
    const match = engine.manualMatch(selectedSource, selectedTarget);
    setMatches([...engine.getMatches()]);
    onMatch?.(match);
    setSelectedSource(null);
    setSelectedTarget(null);
  }, [engine, selectedSource, selectedTarget, onMatch]);

  // Unmatch handler
  const handleUnmatch = useCallback(
    (matchId: string) => {
      engine.unmatch(matchId);
      setMatches([...engine.getMatches()]);
      onUnmatch?.(matchId);
    },
    [engine, onUnmatch]
  );

  // Generate eliminations
  const handleGenerateEliminations = useCallback(() => {
    const accountNames: Record<string, string> = {};
    for (const t of allTransactions) {
      accountNames[t.accountCode] = t.accountName;
    }
    const _eliminations = engine.generateEliminations(matches, accountNames);
    onGenerateEliminations?.(matches);
  }, [engine, matches, allTransactions, onGenerateEliminations]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Matched"
          count={summary.matchedCount}
          amount={summary.matchedAmount}
          variant="success"
        />
        <SummaryCard
          label="Partial"
          count={summary.partiallyMatchedCount}
          amount={summary.partiallyMatchedAmount}
          variant="warning"
        />
        <SummaryCard
          label="Unmatched"
          count={summary.unmatchedCount}
          amount={summary.unmatchedAmount}
          variant="error"
        />
        <SummaryCard
          label="Match Rate"
          count={null}
          amount={null}
          value={`${summary.matchRate.toFixed(1)}%`}
          variant="info"
        />
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {/* Tolerance Settings */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Amount Tolerance</label>
              <Input
                type="number"
                value={tolerance.amountTolerance}
                onChange={(e) =>
                  setTolerance({ ...tolerance, amountTolerance: Number(e.target.value) })
                }
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">% Tolerance</label>
              <Input
                type="number"
                value={tolerance.percentageTolerance}
                onChange={(e) =>
                  setTolerance({ ...tolerance, percentageTolerance: Number(e.target.value) })
                }
                className="w-24"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date Tolerance (days)</label>
              <Input
                type="number"
                value={tolerance.dateToleranceDays}
                onChange={(e) =>
                  setTolerance({ ...tolerance, dateToleranceDays: Number(e.target.value) })
                }
                className="w-24"
              />
            </div>

            <Button onClick={handleAutoMatch} disabled={isMatching}>
              {isMatching ? 'Matching...' : 'Auto-Match'}
            </Button>
            <Button
              variant="outline"
              onClick={handleManualMatch}
              disabled={!selectedSource || !selectedTarget}
            >
              Manual Match
            </Button>
            <Button variant="outline" onClick={handleGenerateEliminations}>
              Generate Eliminations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          value={filterEntity}
          onChange={setFilterEntity}
          options={[
            { value: 'all', label: 'All Entities' },
            ...entities.map((id) => ({ value: id, label: entityNames[id] ?? id })),
          ]}
        />
        <Select
          value={filterAccount}
          onChange={setFilterAccount}
          options={[
            { value: 'all', label: 'All Accounts' },
            ...accounts.map((code) => ({ value: code, label: code })),
          ]}
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'matched', label: 'Matched' },
            { value: 'partial', label: 'Partial' },
            { value: 'unmatched', label: 'Unmatched' },
          ]}
        />
      </div>

      {/* Matched Pairs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matched Pairs ({filteredMatches.length})</CardTitle>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((match) => (
                  <tr
                    key={match.id}
                    className={cn(
                      'border-b hover:bg-muted/50',
                      match.status === 'matched' && 'bg-green-50 dark:bg-green-950/20',
                      match.status === 'partial' && 'bg-yellow-50 dark:bg-yellow-950/20'
                    )}
                  >
                    <td className="p-2">
                      <MatchStatusBadge status={match.status} />
                    </td>
                    <td className="p-2">{match.source.entityName}</td>
                    <td className="p-2">{match.target.entityName}</td>
                    <td className="p-2 font-mono text-xs">{match.source.accountCode}</td>
                    <td className="p-2 text-right font-mono">
                      {formatAmount(match.source.amount)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatAmount(match.target.amount)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {formatAmount(match.amountDifference)}
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
                {filteredMatches.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      No matches found. Run Auto-Match or select transactions for Manual Match.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unmatched Transactions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UnmatchedPanel
          title="Source Transactions"
          transactions={sourceTransactions}
          unmatched={unmatched.filter((t) => sourceTransactions.some((s) => s.id === t.id))}
          selected={selectedSource}
          onSelect={setSelectedSource}
          entityNames={entityNames}
        />
        <UnmatchedPanel
          title="Target Transactions"
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

function SummaryCard({
  label,
  count,
  amount,
  value,
  variant,
}: {
  label: string;
  count: number | null;
  amount: number | null;
  value?: string;
  variant: 'success' | 'warning' | 'error' | 'info';
}) {
  const colors = {
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
  };

  return (
    <Card className={colors[variant]}>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value ?? count ?? 0}</p>
        {amount !== null && <p className="text-sm text-muted-foreground">{formatAmount(amount)}</p>}
      </CardContent>
    </Card>
  );
}

function MatchStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    matched: 'default',
    partial: 'secondary',
    unmatched: 'destructive',
  };
  return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>;
}

function UnmatchedPanel({
  title,
  transactions,
  unmatched,
  selected,
  onSelect,
  entityNames,
}: {
  title: string;
  transactions: ICTransaction[];
  unmatched: ICTransaction[];
  selected: ICTransaction | null;
  onSelect: (t: ICTransaction | null) => void;
  entityNames: Record<string, string>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title} — {unmatched.length} unmatched / {transactions.length} total
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
                  <td className="p-2 text-right font-mono">{formatAmount(t.amount)}</td>
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

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
