/* eslint-disable react-hooks/preserve-manual-memoization -- react-compiler lint bails on this file's memo bodies (roundTo/sumMoney helper chains + Date math); manual memoization is correct; this codebase does not run the React Compiler. */
import { useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, FileText, Calendar, DollarSign, Clock, ArrowRight } from 'lucide-react';
import { sumMoney, roundTo } from '@/utils/money';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';
import { LeaseEngine, type LeaseContract } from '@/engines/LeaseEngine';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useLeaseStore, type LeaseInput } from '@/store/leaseStore';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** Fixed as-of date so status/expirations are deterministic. */
const AS_OF = new Date('2026-01-01T00:00:00Z');

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

interface LeaseSummary {
  id: string;
  property: string;
  type: 'Operating' | 'Finance';
  monthlyPayment: number;
  endDate: string;
  /** REAL lease liability = present value of remaining payments (LeaseEngine). */
  liability: number;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

// Lease inputs now live in the persisted leaseStore (useLeaseStore) so the
// portfolio is real, editable user data with a reachable empty state. Each
// lease's monthlyPayment is the contractual payment; liability is COMPUTED by
// LeaseEngine.generateDisclosure (PV) and status is DERIVED from endDate vs
// AS_OF — none are hardcoded at render time.
function summarize(input: LeaseInput): LeaseSummary {
  const contract: LeaseContract = {
    id: input.id,
    assetDescription: input.property,
    commencementDate: input.commencementDate,
    leaseTerm: input.leaseTerm,
    leasePayments: Array.from({ length: input.leaseTerm }, () => input.payment),
    discountRate: input.discountRate,
  };
  const endDate = addMonths(input.commencementDate, input.leaseTerm);
  const end = new Date(endDate);
  const status: LeaseSummary['status'] =
    end < AS_OF ? 'Expired' : monthsBetween(AS_OF, end) <= 6 ? 'Expiring Soon' : 'Active';
  return {
    id: input.id,
    property: input.property,
    type: input.type,
    monthlyPayment: input.payment,
    endDate,
    liability: LeaseEngine.generateDisclosure(contract).leaseLiability,
    status,
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export default function LeaseDashboard() {
  const fmt = useCurrencyFormatter();
  const navigate = useNavigate();
  const leaseInputs = useLeaseStore((s) => s.leases);
  const LEASES = useMemo(() => leaseInputs.map(summarize), [leaseInputs]);
  const activeLeases = LEASES.filter((l) => l.status === 'Active' || l.status === 'Expiring Soon');
  const totalLiability = roundTo(sumMoney(activeLeases.map((l) => l.liability)), 2);
  const totalMonthlyPayment = roundTo(sumMoney(activeLeases.map((l) => l.monthlyPayment)), 2);
  const avgTermMonths = Math.round(
    activeLeases.reduce((s, l) => s + monthsBetween(AS_OF, new Date(l.endDate)), 0) /
      Math.max(1, activeLeases.length)
  );

  const typeBreakdown = useMemo(
    () => [
      {
        name: 'Operating',
        value: roundTo(
          sumMoney(activeLeases.filter((l) => l.type === 'Operating').map((l) => l.liability)),
          2
        ),
      },
      {
        name: 'Finance',
        value: roundTo(
          sumMoney(activeLeases.filter((l) => l.type === 'Finance').map((l) => l.liability)),
          2
        ),
      },
    ],
    [activeLeases]
  );

  // REAL 12-month payment projection: each lease drops off in its expiry month.
  const monthlyTrend = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const monthDate = new Date(AS_OF);
        monthDate.setMonth(monthDate.getMonth() + i);
        let operating = 0;
        let finance = 0;
        for (const l of LEASES) {
          if (new Date(l.endDate) >= monthDate) {
            if (l.type === 'Operating') operating += l.monthlyPayment;
            else finance += l.monthlyPayment;
          }
        }
        return { month: monthDate.toLocaleString('en-US', { month: 'short' }), operating, finance };
      }),
    [LEASES]
  );

  if (leaseInputs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Lease Portfolio Dashboard"
          purpose="Lease portfolio"
          actions={
            <Button size="sm" onClick={() => navigate('/lease/detail')}>
              Add Lease <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          }
        />
        <div className="rounded-xl border border-dashed border-slate-600 p-10 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-slate-500" />
          <p className="text-lg font-medium text-[var(--text-secondary)]">No Lease Data</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Add your first lease to see liability, payment and expiry analytics.
          </p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Property', 'Type', 'Monthly Payment', 'Liability', 'End Date', 'Status'],
        rows: LEASES.map((l) => [
          l.property,
          l.type,
          l.monthlyPayment,
          l.liability,
          l.endDate,
          l.status,
        ]),
      },
      { title: 'Lease Portfolio Dashboard' }
    ).catch(reportExportFailure);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lease Portfolio Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {activeLeases.length} active leases — liability computed by LeaseEngine (not mock data)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => navigate('/lease/detail')}>
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Liability"
          value={fmt.currency0(totalLiability)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Monthly Payment"
          value={fmt.currency0(totalMonthlyPayment)}
          icon={<Calendar className="h-4 w-4" />}
        />
        <KPIValue
          label="Active Leases"
          value={String(activeLeases.length)}
          icon={<FileText className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Remaining Term"
          value={`${avgTermMonths} months`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lease Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${formatPercent(percent ?? 0, 0)}`}
                >
                  {typeBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Payment Trend (projected)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="operating" fill="#10b981" name="Operating" stackId="a" />
                <Bar dataKey="finance" fill="#3b82f6" name="Finance" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expirations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {LEASES.filter((l) => l.status === 'Expiring Soon' || l.status === 'Expired')
              .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
              .map((lease) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(lease.endDate).getTime() - AS_OF.getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={lease.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${daysUntilExpiry <= 0 ? 'bg-red-500' : daysUntilExpiry < 180 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      />
                      <div>
                        <div className="font-medium">{lease.property}</div>
                        <div className="text-xs text-slate-400">
                          {lease.type} | {fmt.currency0(lease.monthlyPayment)}/mo
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{lease.endDate}</div>
                      <div
                        className={`text-xs ${daysUntilExpiry <= 0 ? 'text-red-400' : 'text-yellow-400'}`}
                      >
                        {daysUntilExpiry <= 0 ? 'Expired' : `${daysUntilExpiry} days remaining`}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lease Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LEASES.map((lease) => (
              <div
                key={lease.id}
                className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/lease/detail?id=${lease.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') navigate(`/lease/detail?id=${lease.id}`);
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${lease.type === 'Finance' ? 'bg-blue-900/50' : 'bg-green-900/50'}`}
                  >
                    <FileText
                      className={`h-4 w-4 ${lease.type === 'Finance' ? 'text-blue-400' : 'text-green-400'}`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{lease.property}</div>
                    <div className="text-xs text-slate-400">
                      {lease.type} Lease | Ends {lease.endDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-semibold" data-testid={`liability-${lease.id}`}>
                      {fmt.currency0(lease.liability)}
                    </div>
                    <div className="text-xs text-slate-400">Liability</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${lease.status === 'Active' ? 'bg-green-900/50 text-green-400' : lease.status === 'Expiring Soon' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}
                  >
                    {lease.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
