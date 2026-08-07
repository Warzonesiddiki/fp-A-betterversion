import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { formatPercent } from '@/utils/financialFormatting';
import { addMoney, roundTo, sumMoney } from '@/utils/money';
import type {
  ReconciliationReport,
  ReconciliationLine,
  ToleranceSettings,
} from '@/engines/ICMatchingEngine';

// =============================================================================
// GAP-1 (F-0006) — exact-decimal IC reconciliation totals
//
// Previously raw float `reduce +` / `+` aggregated `difference`, `balanceA`,
// `balanceB` and the per-row `balanceA + balanceB` net. These feed the "Total
// Differences" metric card (which changes the warning/success variant), the
// footer totals row, and the expanded-row "Net (A+B)" detail — display AND
// logic. Percentages are a metric (%) and stay float per GAP-1 exclusions.
// =============================================================================

export interface ICFooterView {
  totalBalanceA: number;
  totalBalanceB: number;
  totalDifference: number;
  avgPercentageDifference: number;
}

export function computeICTotals(
  lines: readonly Pick<
    ReconciliationLine,
    'balanceA' | 'balanceB' | 'difference' | 'percentageDifference'
  >[]
): ICFooterView {
  if (lines.length === 0) {
    return {
      totalBalanceA: 0,
      totalBalanceB: 0,
      totalDifference: 0,
      avgPercentageDifference: 0,
    };
  }
  const totalBalanceA = roundTo(sumMoney(lines.map((l) => l.balanceA)));
  const totalBalanceB = roundTo(sumMoney(lines.map((l) => l.balanceB)));
  const totalDifference = roundTo(sumMoney(lines.map((l) => l.difference)));
  const avgPercentageDifference =
    lines.reduce((s, l) => s + l.percentageDifference, 0) / lines.length;
  return { totalBalanceA, totalBalanceB, totalDifference, avgPercentageDifference };
}

export function computeICPairNet(line: Pick<ReconciliationLine, 'balanceA' | 'balanceB'>): number {
  return roundTo(addMoney(line.balanceA, line.balanceB));
}

export function computeICGrandTotalDifference(
  lines: readonly Pick<ReconciliationLine, 'difference'>[]
): number {
  return roundTo(sumMoney(lines.map((l) => l.difference)));
}

// =============================================================================
// IC RECONCILIATION
// Reconciliation report with tolerance checking, sort/filter, and detail view
// =============================================================================

interface ICReconciliationProps {
  report: ReconciliationReport;
  tolerance?: ToleranceSettings;
  onExport?: (report: ReconciliationReport) => void;
  onAdjustTolerance?: (tolerance: ToleranceSettings) => void;
  className?: string;
}

export function ICReconciliation({
  report = {
    entityPairs: [],
    period: '',
    summary: { matchedCount: 0, unmatchedCount: 0, totalDifference: 0 },
  } as unknown as ReconciliationReport,
  tolerance: externalTolerance,
  onExport = () => {},
  onAdjustTolerance,
  className,
}: ICReconciliationProps) {
  const [tolerance, setTolerance] = useState<ToleranceSettings>(
    externalTolerance ?? { amountTolerance: 100, percentageTolerance: 5, dateToleranceDays: 5 }
  );
  const [filterStatus, setFilterStatus] = useState<'all' | 'matched' | 'unmatched'>('all');
  const [sortField, setSortField] = useState<'difference' | 'entity' | 'account'>('difference');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filtered and sorted lines
  const displayLines = useMemo(() => {
    let lines = report.entityPairs;

    if (filterStatus === 'matched') {
      lines = lines.filter((l) => l.withinTolerance);
    } else if (filterStatus === 'unmatched') {
      lines = lines.filter((l) => !l.withinTolerance && l.difference > 0);
    }

    return [...lines].sort((a, b) => {
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
  }, [report.entityPairs, filterStatus, sortField, sortDir]);

  // Stats
  const totalDifference = useMemo(
    () => computeICGrandTotalDifference(report.entityPairs),
    [report.entityPairs]
  );

  const matchRate = useMemo(
    () =>
      report.entityPairs.length > 0
        ? (report.withinToleranceCount / report.entityPairs.length) * 100
        : 0,
    [report.entityPairs.length, report.withinToleranceCount]
  );

  const handleToleranceUpdate = (field: keyof ToleranceSettings, value: number) => {
    const updated = { ...tolerance, [field]: value };
    setTolerance(updated);
    onAdjustTolerance?.(updated);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className={cn('space-y-6', className)} role="region" aria-label="ICReconciliation">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">IC Reconciliation Report</h2>
          <p className="text-sm text-muted-foreground">
            Period: {report.period} | Generated: {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>
        {onExport && (
          <Button variant="outline" onClick={() => onExport(report)}>
            Export Report
          </Button>
        )}
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
          value={formatCurrency(totalDifference)}
          variant={totalDifference > 0 ? 'warning' : 'success'}
        />
        <MetricCard label="Match Rate" value={formatPercent(matchRate, 1)} variant="info" />
      </div>

      {/* Tolerance Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tolerance Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount ($)
              </label>
              <Input
                id="amount"
                type="number"
                value={tolerance.amountTolerance}
                onChange={(e) => handleToleranceUpdate('amountTolerance', Number(e.target.value))}
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="percentage" className="text-sm font-medium">
                Percentage (%)
              </label>
              <Input
                id="percentage"
                type="number"
                value={tolerance.percentageTolerance}
                onChange={(e) =>
                  handleToleranceUpdate('percentageTolerance', Number(e.target.value))
                }
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
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
                  <SortHeader
                    label="Entity A"
                    field="entity"
                    active={sortField === 'entity'}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="p-2 text-left">Entity B</th>
                  <SortHeader
                    label="Account"
                    field="account"
                    active={sortField === 'account'}
                    dir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="p-2 text-right">Balance A</th>
                  <th className="p-2 text-right">Balance B</th>
                  <SortHeader
                    label="Difference"
                    field="difference"
                    active={sortField === 'difference'}
                    dir={sortDir}
                    onSort={toggleSort}
                    className="text-right"
                  />
                  <th className="p-2 text-right">Diff %</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayLines.map((line) => (
                  <ReconciliationRow
                    key={`${line.entityA}:${line.entityB}:${line.accountCode}`}
                    line={line}
                    tolerance={tolerance}
                    expanded={expandedRow === `${line.entityA}:${line.entityB}:${line.accountCode}`}
                    onToggle={() => {
                      const key = `${line.entityA}:${line.entityB}:${line.accountCode}`;
                      setExpandedRow(expandedRow === key ? null : key);
                    }}
                  />
                ))}
                {displayLines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No reconciliation lines to display.
                    </td>
                  </tr>
                )}
              </tbody>
              {displayLines.length > 0 &&
                (() => {
                  const footers = computeICTotals(displayLines);
                  return (
                    <tfoot>
                      <tr className="border-t-2 font-semibold">
                        <td colSpan={3} className="p-2">
                          Totals ({displayLines.length} pairs)
                        </td>
                        <td className="p-2 text-right">{formatCurrency(footers.totalBalanceA)}</td>
                        <td className="p-2 text-right">{formatCurrency(footers.totalBalanceB)}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(footers.totalDifference)}
                        </td>
                        <td className="p-2 text-right">
                          {formatPercent(footers.avgPercentageDifference, 1)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  );
                })()}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Items Requiring Attention */}
      {report.outsideToleranceCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Items Requiring Attention ({report.outsideToleranceCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.entityPairs
                .filter((l) => !l.withinTolerance && l.difference > 0)
                .map((line) => (
                  <div
                    key={`${line.entityA}:${line.entityB}:${line.accountCode}`}
                    role="alert"
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/20"
                  >
                    <div>
                      <span className="font-medium">
                        {line.entityA} ↔ {line.entityB}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        Account: {line.accountCode} ({line.accountName})
                      </span>
                    </div>
                    <div className="text-right">
                      <div
                        role="alert"
                        className="font-mono font-semibold text-red-600 dark:text-red-400"
                      >
                        {formatCurrency(line.difference)} difference
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPercent(line.percentageDifference, 2)} off
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
  expanded,
  onToggle,
}: {
  line: ReconciliationLine;
  tolerance: ToleranceSettings;
  expanded: boolean;
  onToggle: () => void;
}) {
  const exceeds =
    line.difference > tolerance.amountTolerance ||
    line.percentageDifference > tolerance.percentageTolerance;

  return (
    <>
      <tr
        className={cn(
          'cursor-pointer border-b hover:bg-muted/50',
          exceeds && line.difference > 0 && 'bg-red-50 dark:bg-red-950/20',
          !exceeds && line.difference > 0 && 'bg-green-50 dark:bg-green-950/20'
        )}
        onClick={onToggle}
      >
        <td className="p-2">{line.entityA}</td>
        <td className="p-2">{line.entityB}</td>
        <td className="p-2">
          <span className="font-mono text-xs">{line.accountCode}</span>
          <span className="ml-1 text-xs text-muted-foreground">{line.accountName}</span>
        </td>
        <td className="p-2 text-right font-mono">{formatCurrency(line.balanceA)}</td>
        <td className="p-2 text-right font-mono">{formatCurrency(line.balanceB)}</td>
        <td className="p-2 text-right font-mono font-semibold">
          {formatCurrency(line.difference)}
        </td>
        <td className="p-2 text-right font-mono text-xs">
          {formatPercent(line.percentageDifference, 2)}
        </td>
        <td className="p-2 text-center">
          <Badge variant={line.withinTolerance ? 'default' : 'destructive'}>
            {line.matchStatus}
          </Badge>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/30">
          <td colSpan={8} className="p-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Balance A:</span>{' '}
                {formatCurrency(line.balanceA)}
              </div>
              <div>
                <span className="text-muted-foreground">Balance B:</span>{' '}
                {formatCurrency(line.balanceB)}
              </div>
              <div>
                <span className="text-muted-foreground">Net (A+B):</span>{' '}
                {formatCurrency(computeICPairNet(line))}
              </div>
              <div>
                <span className="text-muted-foreground">Abs Diff:</span>{' '}
                {formatCurrency(line.difference)}
              </div>
              <div>
                <span className="text-muted-foreground">Diff %:</span>{' '}
                {formatPercent(line.percentageDifference, 2)}
              </div>
              <div>
                <span className="text-muted-foreground">Tolerance:</span>{' '}
                {exceeds ? 'Exceeded' : 'Within'}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SortHeader({
  label,
  field,
  active,
  dir,
  onSort,
  className,
}: {
  label: string;
  field: 'difference' | 'entity' | 'account';
  active: boolean;
  dir: 'asc' | 'desc';
  onSort: (f: 'difference' | 'entity' | 'account') => void;
  className?: string;
}) {
  return (
    <th
      className={cn('cursor-pointer p-2 text-left hover:text-foreground', className)}
      onClick={() => onSort(field)}
      scope="col"
    >
      {label} {active && (dir === 'asc' ? '\u2191' : '\u2193')}
    </th>
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
