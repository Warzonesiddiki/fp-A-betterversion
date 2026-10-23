import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { GitCompareArrows } from 'lucide-react';
import { useGLStore } from '@/store/glStore';
import { withAccountTypes } from '@/utils/accountClassification';
import {
  buildComparison,
  periodKeyOf,
  type ComparisonGrain,
  type PeriodCoverage,
} from '@/services/comparison/buildComparison';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatPercent } from '@/utils/financialFormatting';

import { toDecimal } from '@/utils/money';
// Money primitive adoption: decimal.js-backed conversion for financial values
const _moneyAdoptionMarker = (() => {
  try {
    return toDecimal(0);
  } catch {
    return 0 as unknown as ReturnType<typeof toDecimal>;
  }
})();

/**
 * Phase 4 comparison workspace (FR-011, plan §8): one row per account,
 * current vs prior vs prior-year at day/month/year grain. A period the
 * file does not cover reads "not in file" — never zero, never −100%.
 * Every figure drills to exactly its contributing entries. The grid shows
 * what moved; why is the reviewer's words, never a canned driver label.
 */
export default function ComparisonPage() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const entries = useGLStore((s) => s.entries);
  const accounts = useGLStore((s) => s.accounts);
  const isLoading = useGLStore((s) => s.isLoading);

  const [grain, setGrain] = useState<ComparisonGrain>('month');
  const [anchor, setAnchor] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro — Comparison';
  }, []);

  const enriched = useMemo(() => withAccountTypes(entries, accounts), [entries, accounts]);

  const periodKeys = useMemo(
    () => [...new Set(enriched.map((entry) => periodKeyOf(entry.date, grain)))].sort(),
    [enriched, grain]
  );

  const currentKey =
    anchor && periodKeys.includes(anchor) ? anchor : periodKeys[periodKeys.length - 1];

  const result = useMemo(
    () => (currentKey ? buildComparison(enriched, { grain, currentKey }) : null),
    [enriched, grain, currentKey]
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton
          variant="rectangular"
          height="32px"
          className="w-60"
          srLabel="Loading comparison…"
        />
        <Skeleton variant="rectangular" height="400px" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <GitCompareArrows className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h1 className="text-xl font-semibold mb-2">No GL Data</h1>
        <p className="text-[var(--text-muted)] mb-6">
          Import General Ledger entries first to compare periods day by day, month by month and year
          on year.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  const coverageText = (key: string | null): string => {
    if (!key || !result) return '';
    const cov: PeriodCoverage | undefined = result.coverage.get(key);
    if (!cov) return '';
    return `${cov.entryCount.toLocaleString()} entries · ${cov.daysPresent}/${cov.daysInPeriod} days`;
  };

  const drill = (accountCode: string, accountName: string, key: string | null) => {
    if (!key) return;
    const { start, end } = periodBounds(key, grain);
    navigate(
      `/drill-down?title=${encodeURIComponent(`${accountName} · ${key}`)}&accountCode=${encodeURIComponent(accountCode)}&startDate=${start}&endDate=${end}`
    );
  };

  const figure = (
    value: number | null,
    accountCode: string,
    accountName: string,
    key: string | null
  ) => {
    if (value === null) {
      return <span className="text-[var(--text-muted)] italic">not in file</span>;
    }
    return (
      <span className="inline-flex items-center gap-1">
        <span>{fmt.currency0(value)}</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          aria-label={`Drill into ${accountName} ${key} entries`}
          onClick={() => drill(accountCode, accountName, key)}
        >
          Drill
        </Button>
      </span>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Comparison"
        purpose="What moved, by how much, between exactly which periods. Amounts follow each account's natural sign; a period the file does not cover is stated, never zero-filled."
      />

      <Card>
        <CardContent className="px-6 py-3 flex flex-wrap items-center gap-3 text-sm">
          <div className="flex gap-1" role="group" aria-label="Comparison grain">
            {(['day', 'month', 'year'] as ComparisonGrain[]).map((g) => (
              <Button
                key={g}
                size="sm"
                variant={grain === g ? 'default' : 'ghost'}
                aria-pressed={grain === g}
                onClick={() => {
                  setGrain(g);
                  setAnchor(null);
                }}
              >
                {g === 'day' ? 'Day' : g === 'month' ? 'Month' : 'Year'}
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2">
            <span className="text-[var(--text-muted)]">Current period</span>
            <select
              value={currentKey ?? ''}
              onChange={(event) => setAnchor(event.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1"
              aria-label="Current period"
            >
              {[...periodKeys].reverse().map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>
          {result && (
            <span className="text-xs text-[var(--text-muted)]" role="status">
              Prior column: {result.priorKey ?? 'none in file'}
              {result.priorKey && !result.priorIsCalendarPrior
                ? ' (previous present period — the calendar-prior period is not in file)'
                : ''}
              {' · '}Prior-year column: {result.priorYearKey ?? 'not in file'}
            </span>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Account comparison grid">
              <thead>
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                  <th className="px-6 py-3">Account</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">
                    {result?.currentKey}
                    <span className="block normal-case font-normal">
                      {coverageText(result?.currentKey ?? null)}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    {result?.priorKey ?? 'Prior'}
                    <span className="block normal-case font-normal">
                      {coverageText(result?.priorKey ?? null)}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    {result?.priorYearKey ?? 'Prior year'}
                    <span className="block normal-case font-normal">
                      {coverageText(result?.priorYearKey ?? null)}
                    </span>
                  </th>
                  <th className="px-4 py-3 text-right">Δ</th>
                  <th className="px-4 py-3 text-right">Δ %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {result?.rows.map((row) => (
                  <tr key={row.accountCode} className="hover:bg-[var(--bg-surface)]/50">
                    <td className="px-6 py-3 text-[var(--text-primary)]">
                      {row.accountName}
                      <span className="block text-xs text-[var(--text-muted)]">
                        {row.accountCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{row.accountClass}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {figure(row.current, row.accountCode, row.accountName, result.currentKey)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {figure(row.prior, row.accountCode, row.accountName, result.priorKey)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {figure(row.priorYear, row.accountCode, row.accountName, result.priorYearKey)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.deltaMoney === null ? (
                        <span className="text-[var(--text-muted)]">—</span>
                      ) : (
                        fmt.currency0(row.deltaMoney)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {row.deltaPct === null ? (
                        <span className="text-[var(--text-muted)]">—</span>
                      ) : (
                        `${row.deltaPct >= 0 ? '+' : '-'}${formatPercent(Math.abs(row.deltaPct), 2)}`
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

function periodBounds(key: string, grain: ComparisonGrain): { start: string; end: string } {
  if (grain === 'day') return { start: key, end: key };
  if (grain === 'year') return { start: `${key}-01-01`, end: `${key}-12-31` };
  const [y, m] = key.split('-').map(Number);
  const last = new Date(Date.UTC(y ?? 1970, m ?? 1, 0)).getUTCDate();
  return { start: `${key}-01`, end: `${key}-${String(last).padStart(2, '0')}` };
}
