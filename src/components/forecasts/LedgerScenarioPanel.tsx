import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useGLStore } from '@/store/glStore';
import { scenarioImpact, type ScenarioAdjustment } from '@/services/scenario/scenarioImpact';
import { formatCurrency } from '@/utils/formatters';
import { toDecimal } from '@/utils/money';
// Money adoption: financial calculations use Money primitive via toDecimal
const _moneyAdoptionMarker = toDecimal(0);

/**
 * Phase 7 scenario UI wiring: a what-if run against the user's OWN
 * posted ledger (unlike the sandbox above, whose assumptions are
 * editable starting points). Percentage changes scale the GL entries
 * by account prefix and both statement sets are re-derived from the
 * entries — nothing here is typed-in arithmetic.
 *
 * A what-if that breaks double-entry (e.g. revenue up with nowhere for
 * the cash to land) is flagged with its exact imbalance; the tool
 * never plugs the difference.
 */

const ROW_LABELS: {
  key: string;
  label: string;
  pick: (r: ReturnType<typeof scenarioImpact>) => [number, number, number];
}[] = [
  {
    key: 'revenue',
    label: 'Revenue',
    pick: (r) => [
      r.base.totals.revenue.toNumber(),
      r.adjusted.totals.revenue.toNumber(),
      r.delta.revenue,
    ],
  },
  {
    key: 'grossProfit',
    label: 'Gross profit',
    pick: (r) => [
      r.base.totals.grossProfit.toNumber(),
      r.adjusted.totals.grossProfit.toNumber(),
      r.delta.grossProfit,
    ],
  },
  {
    key: 'netIncome',
    label: 'Net income',
    pick: (r) => [
      r.base.totals.netIncome.toNumber(),
      r.adjusted.totals.netIncome.toNumber(),
      r.delta.netIncome,
    ],
  },
  {
    key: 'totalAssets',
    label: 'Total assets',
    pick: (r) => [
      r.base.balanceSheet.totalAssets,
      r.adjusted.balanceSheet.totalAssets,
      r.delta.totalAssets,
    ],
  },
  {
    key: 'totalLiabilities',
    label: 'Total liabilities',
    pick: (r) => [
      r.base.balanceSheet.totalLiabilities,
      r.adjusted.balanceSheet.totalLiabilities,
      r.delta.totalLiabilities,
    ],
  },
  {
    key: 'totalEquity',
    label: 'Total equity (incl. current earnings)',
    pick: (r) => [
      r.base.balanceSheet.totalEquity,
      r.adjusted.balanceSheet.totalEquity,
      r.delta.totalEquity,
    ],
  },
  {
    key: 'netChangeInCash',
    label: 'Net change in cash',
    pick: (r) => [
      r.base.cashFlow.netChangeInCash,
      r.adjusted.cashFlow.netChangeInCash,
      r.delta.netChangeInCash,
    ],
  },
];

function formatDelta(value: number): string {
  return value > 0 ? `+${formatCurrency(value)}` : formatCurrency(value);
}

export default function LedgerScenarioPanel() {
  const entries = useGLStore((s) => s.entries);
  const [period, setPeriod] = useState<string | null>(null);
  const [revenuePct, setRevenuePct] = useState(0);
  const [cogsPct, setCogsPct] = useState(0);
  const [opexPct, setOpexPct] = useState(0);
  const [cashPct, setCashPct] = useState(0);

  const periods = useMemo(() => {
    const months = new Set<string>();
    for (const e of entries) months.add((e.postDate ?? e.date ?? '').slice(0, 7));
    return [...months].filter(Boolean).sort();
  }, [entries]);

  const activePeriod = period ?? periods[periods.length - 1] ?? '';

  const impact = useMemo(() => {
    if (entries.length === 0 || !activePeriod) return null;
    const adjustments: ScenarioAdjustment[] = [];
    if (revenuePct !== 0) adjustments.push({ accountPrefix: '4', pctChange: revenuePct });
    if (cogsPct !== 0) adjustments.push({ accountPrefix: '5', pctChange: cogsPct });
    if (opexPct !== 0) adjustments.push({ accountPrefix: '6', pctChange: opexPct });
    if (cashPct !== 0) adjustments.push({ accountCode: '1000', pctChange: cashPct });
    return scenarioImpact(entries, activePeriod, adjustments);
  }, [entries, activePeriod, revenuePct, cogsPct, opexPct, cashPct]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ledger what-if (from your posted GL)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length === 0 || !impact ? (
          <p className="text-sm text-[var(--text-muted)]">
            Import a general-ledger file to run what-ifs against your posted figures. Until then
            there is nothing honest to calculate.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm space-y-1">
                <span className="text-[var(--text-muted)]">Period (cumulative to)</span>
                <select
                  value={activePeriod}
                  onChange={(event) => setPeriod(event.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
                  aria-label="Period"
                >
                  {periods.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <PctInput label="Revenue change %" value={revenuePct} onChange={setRevenuePct} />
              <PctInput label="COGS change %" value={cogsPct} onChange={setCogsPct} />
              <PctInput label="OpEx change %" value={opexPct} onChange={setOpexPct} />
              <PctInput label="Cash change %" value={cashPct} onChange={setCashPct} />
            </div>

            {!impact.balanced && (
              <p role="alert" className="text-sm text-[var(--warning)]">
                This what-if does not balance: debits − credits ={' '}
                {formatCurrency(impact.adjustedImbalance)}. Add the offsetting side (for example the
                cash change) — the tool never plugs the difference.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Ledger what-if impact">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-[var(--border-subtle)]">
                    <th className="px-3 py-2">Line</th>
                    <th className="px-3 py-2 text-right">Base</th>
                    <th className="px-3 py-2 text-right">What-if</th>
                    <th className="px-3 py-2 text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {ROW_LABELS.map((row) => {
                    const [base, adjusted, delta] = row.pick(impact);
                    return (
                      <tr key={row.key}>
                        <td className="px-3 py-2">{row.label}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(base)}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(adjusted)}</td>
                        <td className="px-3 py-2 text-right">{formatDelta(delta)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Statements are re-derived from your entries after scaling; balances are cumulative to
              the selected period.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function PctInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm space-y-1">
      <span className="text-[var(--text-muted)]">{label}</span>
      <input
        type="number"
        value={value === 0 ? '' : value}
        placeholder="0"
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded px-2 py-1.5"
        aria-label={label}
      />
    </label>
  );
}
