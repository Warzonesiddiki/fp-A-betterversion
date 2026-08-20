import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AlertTriangle, Calendar, Download, FileText } from 'lucide-react';
import {
  addMoney,
  roundTo,
  sumMoney,
  subtractMoney,
  divideMoney,
  multiplyMoney,
} from '@/utils/money';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { formatPercent } from '@/utils/financialFormatting';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/**
 * Deferred Revenue Schedule (session 028, replaces fabricated session-022 version).
 *
 * Pre-session-028 page rendered five named contracts (Acme Corp, TechStart
 * Inc, Global Solutions, DataFlow LLC, …) with hand-typed contract value,
 * deferred balance, recognized YTD and monthly recognition — none backed by a
 * contract ledger.
 *
 * The general ledger does carry deferred revenue as 23xx accounts (ASC 606
 * liability). The page now reports the GL-derived deferred balance and the
 * period movement. Per-contract breakdowns require a contract-management
 * feed and are disclosed as not derivable.
 */
export default function DeferredSchedulePage() {
  const navigate = useNavigate();
  const { entries } = useGLStore();
  const fmt = useCurrencyFormatter();
  // Per-contract expansion is disabled: the per-contract list was removed
  // because it relied on hand-typed fixture data. Keep the state hook so
  // future contract-feed integration can re-enable expansion without a
  // signature change.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro - Deferred Revenue Schedule';
  }, []);

  // Real: 23xx is the deferred revenue liability per the standard chart of
  // accounts. We sum the credit balance minus debit (reversals).
  const totalDeferred = useMemo(
    () =>
      roundTo(
        sumMoney(
          entries
            .filter((e) => (e.accountCode ?? '').startsWith('23'))
            .map((e) => subtractMoney(e.credit, e.debit))
        ),
        2
      ),
    [entries]
  );

  // Real: 42xx is earned/deferred revenue. The portion NOT yet earned is
  // roughly the deferred balance; we report 42xx credits as a proxy for
  // earned-to-date revenue. (A full ASC 606 contract-by-contract waterfall
  // requires a contract feed — disclosed below.)
  const totalEarned42 = useMemo(
    () =>
      roundTo(
        sumMoney(
          entries.filter((e) => (e.accountCode ?? '').startsWith('42')).map((e) => e.credit)
        ),
        2
      ),
    [entries]
  );

  // Recognition-rate ratio. Both numerator and denominator come from the GL;
  // the ratio is dimensionless, so we use divideMoney + multiplyMoney(100).
  const totalPool = addMoney(totalEarned42, totalDeferred);
  const recognitionRate = totalPool.greaterThan(0)
    ? roundTo(multiplyMoney(divideMoney(totalEarned42, totalPool), 100), 2)
    : 0;

  // Real: deferred balance by period from the GL, bucketed by month. Only
  // periods with a non-zero 23xx movement are emitted.
  const deferredTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      if (!(e.accountCode ?? '').startsWith('23')) continue;
      const month = e.period || (e.date ?? '').slice(0, 7);
      if (!month) continue;
      const d = roundTo(subtractMoney(e.credit, e.debit), 2);
      const prior = map.get(month) ?? 0;
      map.set(month, roundTo(prior + d, 2));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, balance]) => ({ month, balance }));
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center">
        <Calendar className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Deferred Revenue Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data with deferred revenue accounts (23xx) to populate this schedule.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Deferred Revenue Schedule"
        purpose="ASC 606 deferred-revenue liability and period movement from the GL."
        actions={
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Deferred (23xx)"
          value={totalDeferred > 0 ? fmt.currency0(totalDeferred) : '—'}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPIValue
          label="Earned Revenue (42xx)"
          value={totalEarned42 > 0 ? fmt.currency0(totalEarned42) : '—'}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPIValue
          label="Recognition Rate"
          value={`${formatPercent(recognitionRate, 1)}`}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPIValue
          label="GL Entries"
          value={String(entries.length)}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deferred Revenue Movement by Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {deferredTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deferredTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="23xx net (credit − debit)"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="No 23xx movements in the GL." />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Contract Detail</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-[var(--text-muted)] space-y-3">
              <p>
                <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                Per-contract deferred balance, recognized-to-date, monthly recognition and remaining
                months require a contract-management feed. The GL carries the aggregate 23xx
                liability but does not carry the contract-by-contract allocation.
              </p>
              <p>Connect a contract ledger to populate the per-contract schedule below.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPIValue({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-sm text-[var(--text-muted)]">
      <div className="text-center max-w-sm">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-[var(--text-muted)]" />
        <p>{message}</p>
      </div>
    </div>
  );
}
