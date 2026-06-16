import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { cn } from '@/utils/cn';
import {
  type ReconciliationReport,
  type ReconciliationLine,
  type ToleranceSettings,
} from '@/engines/ICMatchingEngine';

// =============================================================================
// IC RECONCILIATION REPORT
// =============================================================================

interface ICReconciliationReportProps {
  report: ReconciliationReport;
  tolerance?: ToleranceSettings;
  onExport?: (report: ReconciliationReport) => void;
  onGenerateEliminations?: () => void;
  className?: string;
}

export function ICReconciliationReport({
  report,
  tolerance = { amountTolerance: 100, percentageTolerance: 5, dateToleranceDays: 5 },
  onExport,
  onGenerateEliminations,
  className,
}: ICReconciliationReportProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [sortField, setSortField] = useState<'difference' | 'entity' | 'account'>('difference');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted lines
  const displayLines = useMemo(() => {
    let lines = report.entityPairs;

    if (filterStatus === 'matched') {
      lines = lines.filter((l) => l.withinTolerance);
    } else if (filterStatus === 'unmatched') {
      lines = lines.filter((l) => !l.withinTolerance && l.difference > 0);
    }

    const sorted = [...lines].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'difference':
          return (a.difference - b.difference) * dir;
        case 'entity':
          return a.entityA.localeCompare(b.entityA) * dir;
        case 'account':
          return a.accountCode.localeCompare(b.accountCode) * dir;
        default:
          return 0;
      }
    });

    return sorted;
  }, [report.entityPairs, filterStatus, sortField, sortDir]);

  // Summary stats
  const unmatchedLines = report.entityPairs.filter((l) => !l.withinTolerance && l.difference > 0);
  const totalDifference = report.entityPairs.reduce((s, l) => s + l.difference, 0);

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="ICReconciliationReport">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">IC Reconciliation Report</h2>
          <p className="text-sm text-muted-foreground">
            Period: {report.period} | Generated: {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <Button variant="outline" onClick={() => onExport(report)}>
              Export Report
            </Button>
          )}
          {onGenerateEliminations && (
            <Button onClick={onGenerateEliminations}>Generate Eliminations</Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="Total Pairs" value={report.entityPairs.length} />
        <MetricCard
          label="Within Tolerance"
          value={report.withinToleranceCount}
          variant="success"
        />
        <MetricCard
          label="Outside Tolerance"
          value={report.outsideToleranceCount}
          variant="error"
        />
        <MetricCard
          label="Total Differences"
          value={formatAmount(totalDifference)}
          variant={totalDifference > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          label="Match Rate"
          value={`${report.entityPairs.length > 0 ? ((report.withinToleranceCount / report.entityPairs.length) * 100).toFixed(1) : 0}%`}
          variant="info"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'matched', 'unmatched'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Reconciliation Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th
                    className="cursor-pointer p-2 text-left hover:text-foreground"
                    scope="col"
                    onClick={() => {
                      setSortField('entity');
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Entity A {sortField === 'entity' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2 text-left" scope="col">
                    Entity B
                  </th>
                  <th
                    className="cursor-pointer p-2 text-left hover:text-foreground"
                    scope="col"
                    onClick={() => {
                      setSortField('account');
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Account {sortField === 'account' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Balance A
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Balance B
                  </th>
                  <th
                    className="cursor-pointer p-2 text-right hover:text-foreground"
                    scope="col"
                    onClick={() => {
                      setSortField('difference');
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Difference {sortField === 'difference' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-2 text-right" scope="col">
                    Diff %
                  </th>
                  <th className="p-2 text-center" scope="col">
                    Status
                  </th>
                  <th className="p-2 text-center" scope="col">
                    Tolerance
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayLines.map((line, i) => (
                  <ReconciliationRow key={i} line={line} tolerance={tolerance} />
                ))}
                {displayLines.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No reconciliation lines to display.
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Totals Row */}
              {displayLines.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 font-semibold">
                    <td colSpan={3} className="p-2">
                      Totals ({displayLines.length} pairs)
                    </td>
                    <td className="p-2 text-right">
                      {formatAmount(displayLines.reduce((s, l) => s + l.balanceA, 0))}
                    </td>
                    <td className="p-2 text-right">
                      {formatAmount(displayLines.reduce((s, l) => s + l.balanceB, 0))}
                    </td>
                    <td className="p-2 text-right">
                      {formatAmount(displayLines.reduce((s, l) => s + l.difference, 0))}
                    </td>
                    <td className="p-2 text-right">
                      {displayLines.length > 0
                        ? (
                            displayLines.reduce((s, l) => s + l.percentageDifference, 0) /
                            displayLines.length
                          ).toFixed(1)
                        : 0}
                      %
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Unmatched Items Detail */}
      {unmatchedLines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="fin-negative dark:text-red-400">
              Items Requiring Attention ({unmatchedLines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unmatchedLines.map((line, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
                >
                  {' '}
                  <div>
                    <span className="font-medium">
                      {line.entityA} ↔ {line.entityB}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      Account: {line.accountCode} ({line.accountName})
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold fin-negative">
                      {formatAmount(line.difference)} difference
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {line.percentageDifference.toFixed(2)}% off
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ReconciliationRow({
  line,
  tolerance,
}: {
  line: ReconciliationLine;
  tolerance: ToleranceSettings;
}) {
  const diffExceedsTolerance =
    line.difference > tolerance.amountTolerance ||
    line.percentageDifference > tolerance.percentageTolerance;

  return (
    <tr
      className={cn(
        'border-b hover:bg-muted/50',
        diffExceedsTolerance && line.difference > 0 && 'bg-red-50 dark:bg-red-950/20',
        !diffExceedsTolerance && line.difference > 0 && 'bg-green-50 dark:bg-green-950/20'
      )}
    >
      <td className="p-2">{line.entityA}</td>
      <td className="p-2">{line.entityB}</td>
      <td className="p-2">
        <span className="font-mono text-xs">{line.accountCode}</span>
        <span className="ml-1 text-xs text-muted-foreground">{line.accountName}</span>
      </td>
      <td className="p-2 text-right font-mono">{formatAmount(line.balanceA)}</td>
      <td className="p-2 text-right font-mono">{formatAmount(line.balanceB)}</td>
      <td className="p-2 text-right font-mono font-semibold">{formatAmount(line.difference)}</td>
      <td className="p-2 text-right font-mono text-xs">{line.percentageDifference.toFixed(2)}%</td>
      <td className="p-2 text-center">
        <Badge variant={line.withinTolerance ? 'default' : 'destructive'}>{line.matchStatus}</Badge>
      </td>
      <td className="p-2 text-center">
        {line.withinTolerance ? (
          <span className="fin-positive">✓</span>
        ) : (
          <span className="fin-negative">✗</span>
        )}
      </td>
    </tr>
  );
}

function MetricCard({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}) {
  const colors = {
    default: '',
    success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30',
    warning: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
  };

  return (
    <Card className={colors[variant]}>
      <CardContent className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
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
