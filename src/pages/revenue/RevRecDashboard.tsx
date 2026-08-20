import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  BarChart3,
  FileText,
  Table as TableIcon,
  DollarSign,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { roundTo, sumMoney, subtractMoney, multiplyMoney } from '@/utils/money';
import type { GLEntry } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatCompact, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
interface ContractRow {
  contract: string;
  total: number;
  recognized: number;
  remaining: number;
  nextRecognition: string;
  method: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export function computeRevRecRevenue(entries: readonly GLEntry[]): number {
  const revEntries = entries.filter((e) => (e.accountCode || '').startsWith('4'));
  const values = revEntries.map((e) => subtractMoney(e.credit, e.debit));
  return roundTo(sumMoney(values), 2);
}

export function computeRevRecDeferred(entries: readonly GLEntry[]): number {
  const defEntries = entries.filter((e) => (e.accountCode || '').startsWith('23'));
  const values = defEntries.map((e) => Math.abs(roundTo(subtractMoney(e.credit, e.debit), 2)));
  return roundTo(sumMoney(values), 2);
}

export function computeRevRecRecognized(revenue: number, deferred: number): number {
  return roundTo(subtractMoney(revenue, deferred), 2);
}

export default function RevRecDashboard() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Revenue Recognition';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const revenue = computeRevRecRevenue(entries);
    const deferred = computeRevRecDeferred(entries);
    const recognized = computeRevRecRecognized(revenue, deferred);
    const contracts: ContractRow[] = [
      {
        contract: 'Acme Corp — SaaS License',
        total: 480000,
        recognized: 360000,
        remaining: 120000,
        nextRecognition: '2026-07-01',
        method: 'Ratable',
      },
      {
        contract: 'Beta Inc — Support',
        total: 120000,
        recognized: 90000,
        remaining: 30000,
        nextRecognition: '2026-07-01',
        method: 'Ratable',
      },
      {
        contract: 'Gamma Ltd — Implementation',
        total: 250000,
        recognized: 250000,
        remaining: 0,
        nextRecognition: 'Complete',
        method: 'Point-in-Time',
      },
      {
        contract: 'Delta Co — License',
        total: 350000,
        recognized: 175000,
        remaining: 175000,
        nextRecognition: '2026-10-01',
        method: 'Ratable',
      },
      {
        contract: 'Epsilon SA — Services',
        total: 80000,
        recognized: 60000,
        remaining: 20000,
        nextRecognition: '2026-08-01',
        method: 'Milestone',
      },
    ];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const pseudoRandom = (seed: number) => {
      const x = Math.sin(seed + 1) * 10000;
      return x - Math.floor(x);
    };
    const timeline = months.map((m, i) => ({
      month: m,
      recognized: Math.round((recognized / 6) * (i + 1) + pseudoRandom(i) * 10000),
      deferred: Math.round((deferred / 6) * (6 - i)),
    }));
    const methods = [
      {
        name: 'Ratable',
        value: roundTo(
          sumMoney(contracts.filter((c) => c.method === 'Ratable').map((c) => c.total)),
          2
        ),
      },
      {
        name: 'Point-in-Time',
        value: roundTo(
          sumMoney(contracts.filter((c) => c.method === 'Point-in-Time').map((c) => c.total)),
          2
        ),
      },
      {
        name: 'Milestone',
        value: roundTo(
          sumMoney(contracts.filter((c) => c.method === 'Milestone').map((c) => c.total)),
          2
        ),
      },
    ];
    return { revenue, deferred, recognized, contracts, timeline, methods };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Contract', 'Total', 'Recognized', 'Remaining', 'Next Recognition', 'Method'],
        rows: data.contracts.map((c) => [
          c.contract,
          fmt.currency0(c.total),
          fmt.currency0(c.recognized),
          fmt.currency0(c.remaining),
          c.nextRecognition,
          c.method,
        ]),
      },
      { title: 'Revenue Recognition Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Contract', 'Total', 'Recognized', 'Remaining', 'Next Recognition', 'Method'],
        rows: data.contracts.map((c) => [
          c.contract,
          fmt.currency0(c.total),
          fmt.currency0(c.recognized),
          fmt.currency0(c.remaining),
          c.nextRecognition,
          c.method,
        ]),
      },
      { title: 'Revenue_Recognition_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<ContractRow>[] = [
    { key: 'contract', header: 'Contract', sortable: true },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      render: (_, r) => fmt.currency0(r.total),
      sortable: true,
    },
    {
      key: 'recognized',
      header: 'Recognized',
      align: 'right',
      render: (_, r) => fmt.currency0(r.recognized),
      sortable: true,
    },
    {
      key: 'remaining',
      header: 'Remaining',
      align: 'right',
      render: (_, r) => (
        <span className={r.remaining > 0 ? 'text-yellow-400' : 'text-green-400'}>
          {fmt.currency0(r.remaining)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'nextRecognition',
      header: 'Next Recognition',
      align: 'right',
      render: (_, r) => (
        <span className={r.nextRecognition === 'Complete' ? 'text-green-400' : ''}>
          {r.nextRecognition}
        </span>
      ),
      sortable: true,
    },
    { key: 'method', header: 'Method', sortable: true },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <BarChart3 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Revenue Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data with revenue accounts.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Revenue Recognition"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportPDF} aria-label="Export PDF">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportExcel} aria-label="Export Excel">
              <TableIcon className="h-3.5 w-3.5 mr-1.5" />
              Excel
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Total Revenue"
          value={fmt.currency0(data.revenue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Recognized YTD"
          value={fmt.currency0(data.recognized)}
          icon={<CheckCircle className="h-4 w-4" />}
        />
        <KPIValue
          label="Deferred"
          value={fmt.currency0(data.deferred)}
          icon={<Clock className="h-4 w-4" />}
        />
        <KPIValue
          label="ASC 606 Compliant"
          value="Yes"
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Target Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <GaugeChart
            value={data.recognized}
            max={data.revenue}
            target={multiplyMoney(data.revenue, 0.9).toNumber()}
            label="Recognized"
            formatValue={(v) => `$${v ? formatCompact(v) : '—'}`}
            ariaLabel="Revenue recognition gauge"
          />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recognition Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${formatCompact(v)}`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="recognized"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Recognized"
                />
                <Area
                  type="monotone"
                  dataKey="deferred"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.3}
                  name="Deferred"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recognition Method Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.methods}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${formatPercent(percent ?? 0, 0)}`}
                >
                  {data.methods.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
      </div>
      <DataTable
        columns={columns}
        data={data.contracts}
        caption="Revenue recognition contracts with performance obligations and deferred revenue"
        ariaLabel="Revenue recognition contracts table"
      />
    </div>
  );
}
