import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { ConsolidationEngine } from '@/engines/ConsolidationEngine';
import type {
  EntityData,
  OwnershipStructure,
  ICPair,
  ConsolidationAdjustment,
  ConsolidatedResult,
  ConsolidationWorksheet as WS,
  EliminationEntry,
  MinorityInterestDetail,
  FXRate,
  VIENotification,
} from '@/engines/ConsolidationEngine';

export interface ConsolidationWorksheetProps {
  entities: EntityData[];
  ownerships: OwnershipStructure[];
  icPairs?: ICPair[];
  fxRates?: FXRate[];
  adjustments?: ConsolidationAdjustment[];
  vieNotifications?: VIENotification[];
  onExport?: (result: ConsolidatedResult) => void;
  className?: string;
}

type Tab = 'summary' | 'eliminations' | 'nci' | 'worksheet';

export function ConsolidationWorksheet({
  entities = [],
  ownerships = [],
  icPairs = [],
  fxRates = [],
  adjustments = [],
  vieNotifications = [],
  onExport,
  className,
}: ConsolidationWorksheetProps) {
  const [tab, setTab] = useState<Tab>('summary');

  const result = useMemo<ConsolidatedResult | null>(() => {
    if (!entities.length || !ownerships.length) return null;
    try {
      return ConsolidationEngine.consolidate(
        entities,
        ownerships,
        icPairs,
        fxRates,
        adjustments,
        vieNotifications
      );
    } catch {
      return null;
    }
  }, [entities, ownerships, icPairs, fxRates, adjustments, vieNotifications]);

  const validation = useMemo(
    () =>
      result ? ConsolidationEngine.validate(result) : { valid: false, errors: [] as string[] },
    [result]
  );

  if (!result)
    return (
      <Card className={className}>
        <CardContent className="p-12 text-center">
          <p className="text-[var(--text-secondary)]">
            Add entities and ownership structures to generate the worksheet.
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className={cn('space-y-4', className)}>
      <Card
        className={cn(
          'border',
          result.isBalanced
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
            : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
        )}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant={result.isBalanced ? 'default' : 'destructive'}>
              {result.isBalanced ? 'BALANCED' : 'OUT OF BALANCE'}
            </Badge>
            <span className="text-sm text-[var(--text-secondary)]">
              {result.isBalanced
                ? 'Assets = Liabilities + Equity + NCI'
                : `Imbalance: $${Math.abs(result.imbalanceAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
          {validation.errors.length > 0 && (
            <span className="text-xs text-red-500">{validation.errors.length} error(s)</span>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-[var(--border-subtle)]" role="tablist">
        {(
          [
            ['summary', 'Summary'],
            ['eliminations', 'Eliminations'],
            ['nci', 'NCI'],
            ['worksheet', 'Worksheet'],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === k
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1'
            )}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'summary' && <SummaryView r={result} />}
      {tab === 'eliminations' && <EliminationsView entries={result.eliminations} />}
      {tab === 'nci' && <NCIView details={result.minorityInterestDetails} />}
      {tab === 'worksheet' && <WorksheetView ws={result.worksheet} />}

      {onExport && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onExport(result)}>
            Export Worksheet
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryView({ r }: { r: ConsolidatedResult }) {
  const metrics: [string, number][] = [
    ['Total Assets', r.totalAssets],
    ['Total Liabilities', r.totalLiabilities],
    ['Total Equity', r.totalEquity],
    ['Net Income', r.netIncome],
    ['Total Revenue', r.totalRevenue],
    ['Total Expenses', Math.abs(r.totalExpenses)],
    ['Goodwill', r.goodwill],
    ['NCI Balance', r.minorityInterest],
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map(([l, v]) => (
          <MC key={l} l={l} v={v} hl={l === 'Net Income'} />
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Consolidation Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b text-left text-[var(--text-secondary)]">
                <th className="p-2">Item</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              <TR l="Combined Revenue" v={r.totalRevenue} />
              <TR l="Combined Expenses" v={r.totalExpenses} neg />
              <TR
                l="IC Eliminations"
                v={r.eliminations.reduce((s, e) => s + e.eliminatedAmount, 0)}
                neg
              />
              <TR l="Goodwill Adjustments" v={r.goodwill} />
              <TR l="Minority Interest (NCI)" v={r.minorityInterest} />
              <tr className="font-bold bg-[var(--bg-muted)]">
                <td className="p-2">Consolidated Net Income</td>
                <td
                  className={cn(
                    'p-2 text-right',
                    r.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {fmt(r.netIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function EliminationsView({ entries }: { entries: EliminationEntry[] }) {
  const typeBadge: Record<string, string> = {
    ic_receivable: 'IC Recv',
    ic_payable: 'IC Pay',
    ic_revenue: 'IC Rev',
    ic_expense: 'IC Exp',
    ic_investment: 'IC Inv',
    ic_dividend: 'IC Div',
    ic_loan: 'IC Loan',
    auto: 'Auto',
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Intercompany Eliminations ({entries.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-8">No eliminations recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b text-left text-[var(--text-secondary)]">
                  <th className="p-2">Type</th>
                  <th className="p-2">From</th>
                  <th className="p-2">To</th>
                  <th className="p-2">Account</th>
                  <th className="p-2 text-right">Debit</th>
                  <th className="p-2 text-right">Credit</th>
                  <th className="p-2">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {entries.map((e, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-muted)]">
                    <td className="p-2">
                      <Badge
                        variant="outline"
                        className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                      >
                        {typeBadge[e.type] ?? e.type}
                      </Badge>
                    </td>
                    <td className="p-2 font-mono text-xs">{e.fromEntityId}</td>
                    <td className="p-2 font-mono text-xs">{e.toEntityId}</td>
                    <td className="p-2 font-mono text-xs">{e.accountCode}</td>
                    <td className="p-2 text-right font-mono">
                      {e.debitAmount > 0 ? fmt(e.debitAmount) : '-'}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {e.creditAmount > 0 ? fmt(e.creditAmount) : '-'}
                    </td>
                    <td className="p-2 text-xs text-[var(--text-secondary)]">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NCIView({ details }: { details: MinorityInterestDetail[] }) {
  if (!details.length)
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-[var(--text-secondary)]">
            No minority interests. All subsidiaries are 100% owned or use equity/cost method.
          </p>
        </CardContent>
      </Card>
    );
  const total = details.reduce((s, d) => s + d.endingBalance, 0);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Non-Controlling Interest (NCI) Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b text-left text-[var(--text-secondary)]">
                  <th className="p-2">Entity</th>
                  <th className="p-2 text-right">Own %</th>
                  <th className="p-2 text-right">NCI %</th>
                  <th className="p-2 text-right">Beginning</th>
                  <th className="p-2 text-right">Net Income</th>
                  <th className="p-2 text-right">Dividends</th>
                  <th className="p-2 text-right font-bold">Ending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {details.map((d) => (
                  <tr key={d.entityId} className="hover:bg-[var(--bg-muted)]">
                    <td className="p-2 font-medium">{d.entityName}</td>
                    <td className="p-2 text-right">{d.ownershipPct.toFixed(1)}%</td>
                    <td className="p-2 text-right">{d.minorityPct.toFixed(1)}%</td>
                    <td className="p-2 text-right font-mono">{fmt(d.beginningBalance)}</td>
                    <td className="p-2 text-right font-mono">{fmt(d.netIncome)}</td>
                    <td className="p-2 text-right font-mono">{fmt(d.dividends)}</td>
                    <td className="p-2 text-right font-mono font-bold">{fmt(d.endingBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold bg-[var(--bg-muted)]">
                  <td className="p-2" colSpan={6}>
                    Total NCI
                  </td>
                  <td className="p-2 text-right font-mono">{fmt(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="p-4">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
            ASC 810 - NCI Calculation (Net Income Method)
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            NCI = Minority % x (Subsidiary Net Income - Dividends). Multi-tier: NCI at each level =
            Direct minority % x Effective net income attribution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function WorksheetView({ ws }: { ws: WS }) {
  const [expanded, setExpanded] = useState<string | null>('combined');
  const sections: {
    key: string;
    label: string;
    entries: readonly {
      accountCode: string;
      accountName: string;
      entityId?: string;
      debit: number;
      credit: number;
      amount: number;
    }[];
  }[] = [
    { key: 'parent', label: 'Parent Entries', entries: ws.parentEntries },
    { key: 'sub', label: 'Subsidiary Entries', entries: ws.subsidiaryEntries },
    { key: 'combined', label: 'Combined Entries', entries: ws.combinedEntries },
    { key: 'consolidated', label: 'Consolidated Entries', entries: ws.consolidatedEntries },
  ];
  const totals: [string, number][] = [
    ['Assets', ws.totalAssets],
    ['Liabilities', ws.totalLiabilities],
    ['Equity + NCI', ws.totalEquity],
    ['Revenue', ws.totalRevenue],
    ['Expenses', ws.totalExpenses],
    ['Net Income', ws.netIncome],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ['Parent', ws.parentEntries.length],
          ['Subsidiary', ws.subsidiaryEntries.length],
          ['Eliminations', ws.eliminations.length],
          ['Adjustments', ws.adjustments.length],
          ['Consolidated', ws.consolidatedEntries.length],
        ].map(([l, v]) => (
          <Card key={String(l)}>
            <CardContent className="p-2 text-center">
              <p className="text-[10px] text-[var(--text-secondary)]">{l}</p>
              <p className="text-sm font-bold">{String(v)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {sections.map((s) => (
        <Card key={s.key}>
          <CardHeader
            className="cursor-pointer hover:bg-[var(--bg-muted)] transition-colors"
            onClick={() => setExpanded(expanded === s.key ? null : s.key)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                {s.label} ({s.entries.length})
              </CardTitle>
              <Badge variant="outline">{s.entries.length} entries</Badge>
            </div>
          </CardHeader>
          {expanded === s.key && (
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs" role="table">
                  <thead className="sticky top-0 bg-[var(--bg-surface)]">
                    <tr className="border-b text-left text-[var(--text-secondary)]">
                      <th className="p-1.5">Code</th>
                      <th className="p-1.5">Name</th>
                      <th className="p-1.5">Entity</th>
                      <th className="p-1.5 text-right">Debit</th>
                      <th className="p-1.5 text-right">Credit</th>
                      <th className="p-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {s.entries.slice(0, 100).map((e, i) => (
                      <tr key={i} className="hover:bg-[var(--bg-muted)]">
                        <td className="p-1.5 font-mono">{e.accountCode}</td>
                        <td className="p-1.5">{e.accountName}</td>
                        <td className="p-1.5 font-mono text-[var(--text-secondary)]">
                          {e.entityId ?? '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono">
                          {e.debit > 0 ? fmt(e.debit) : '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono">
                          {e.credit > 0 ? fmt(e.credit) : '-'}
                        </td>
                        <td className="p-1.5 text-right font-mono">{fmt(e.amount)}</td>
                      </tr>
                    ))}
                    {s.entries.length > 100 && (
                      <tr>
                        <td colSpan={6} className="p-2 text-center text-[var(--text-secondary)]">
                          Showing 100 of {s.entries.length}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {totals.map(([l, v]) => (
              <div key={l} className={cn(l === 'Net Income' && 'font-bold')}>
                <p className="text-xs text-[var(--text-secondary)]">{l}</p>
                <p
                  className={cn(
                    'text-sm font-mono',
                    v >= 0 ? 'text-[var(--text-primary)]' : 'text-red-600'
                  )}
                >
                  {fmt(v)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MC({ l, v, hl }: { l: string; v: number; hl?: boolean }) {
  return (
    <Card
      className={cn(hl && 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30')}
    >
      <CardContent className="p-3">
        <p className="text-xs text-[var(--text-secondary)]">{l}</p>
        <p
          className={cn(
            'text-lg font-bold',
            v >= 0 ? 'text-[var(--text-primary)]' : 'text-red-600'
          )}
        >
          {fmt(v)}
        </p>
      </CardContent>
    </Card>
  );
}

function TR({ l, v, neg }: { l: string; v: number; neg?: boolean }) {
  return (
    <tr className="hover:bg-[var(--bg-muted)]">
      <td className="p-2">{l}</td>
      <td className={cn('p-2 text-right font-mono', neg && 'text-red-500')}>{fmt(v)}</td>
    </tr>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
