import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  DollarSign,
  FileText,
  Table as TableIcon,
  TrendingUp,
  TrendingDown,
  Flame,
} from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  deriveCashPosition,
  type CashCategoryRow,
  type CashPeriodRow,
} from '@/pages/cash/cashForecastModel';

import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from 'recharts';
import { SparklineChart } from '@/components/charts/SparklineChart';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/**
 * Cash position page. Every figure is derived by
 * `@/pages/cash/cashForecastModel` from posted cash-account activity; see that
 * module's correctness contract. This page previously treated every ledger
 * entry as cash, split the totals with hardcoded 70/30/40/35/15 weights, and
 * projected 13 weeks from a deterministic sawtooth — then exported all of it.
 */
export default function CashForecastPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Cash Position';
  }, []);

  const data = useMemo(() => deriveCashPosition(entries), [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Category', 'Receipts', 'Disbursements', 'Net'],
        rows: data.categories.map((c) => [
          c.category,
          fmt.currency0(c.receipts),
          fmt.currency0(c.disbursements),
          fmt.currency0(c.net),
        ]),
      },
      { title: 'Posted Cash Position', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Category', 'Receipts', 'Disbursements', 'Net'],
        rows: data.categories.map((c) => [
          c.category,
          fmt.currency0(c.receipts),
          fmt.currency0(c.disbursements),
          fmt.currency0(c.net),
        ]),
      },
      { title: 'Posted_Cash_Position' }
    ).catch(reportExportFailure);
  };

  const catColumns: Column<CashCategoryRow>[] = [
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'receipts',
      header: 'Receipts',
      align: 'right',
      render: (_, r) => <span className="text-green-400">{fmt.currency0(r.receipts)}</span>,
      sortable: true,
    },
    {
      key: 'disbursements',
      header: 'Disbursements',
      align: 'right',
      render: (_, r) => <span className="text-red-400">{fmt.currency0(r.disbursements)}</span>,
      sortable: true,
    },
    {
      key: 'net',
      header: 'Net',
      align: 'right',
      render: (_, r) => (
        <span className={r.net >= 0 ? 'text-green-400' : 'text-red-400'}>
          {fmt.currency0(r.net)}
        </span>
      ),
      sortable: true,
    },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <DollarSign className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Cash Activity</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import general-ledger data that posts to cash accounts (codes beginning 10 or 11) to see
          your cash position.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Cash Position"
        purpose={`Posted cash-account activity across ${data.periodCount} period${
          data.periodCount === 1 ? '' : 's'
        } · accounts ${data.cashAccountCodes.join(', ')}`}
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
          label="Posted Cash Balance"
          value={fmt.currency0(data.postedBalance)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Cash Receipts"
          value={fmt.currency0(data.receipts)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Cash Disbursements"
          value={fmt.currency0(data.disbursements)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Net per Period"
          value={
            data.averageNetPerPeriod === null ? '\u2014' : fmt.currency0(data.averageNetPerPeriod)
          }
          icon={<Flame className="h-4 w-4" />}
        />
        <div className="col-span-2 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Posted Cash Balance Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <SparklineChart
                data={data.periods.map((p: CashPeriodRow) => p.runningBalance)}
                color="#3b82f6"
                height={50}
                width={300}
                ariaLabel="Posted cash balance sparkline trend"
              />
              <span className="text-sm text-[var(--text-muted)]">
                {data.periodCount} posted period{data.periodCount === 1 ? '' : 's'}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Posted Cash Flow by Period</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.periods}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v) => fmt.currency0(Number(v))}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              />
              <Legend />
              <Bar dataKey="receipts" fill="#10b981" name="Receipts" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="disbursements"
                fill="#ef4444"
                name="Disbursements"
                radius={[4, 4, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="runningBalance"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Posted balance"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cash Movement by Counter-Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-[var(--text-muted)]">
            Each cash line is attributed to the non-cash side of its own journal entry.
            {data.classifiedPercent !== null &&
              ` ${data.classifiedPercent}% of cash movement carried an identifiable counter-line.`}
          </p>
          <DataTable
            columns={catColumns}
            data={[...data.categories]}
            caption="Cash movement attributed to counter-accounts"
            ariaLabel="Cash movement by counter-account table"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Not derivable from the general ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {data.unavailable.map((u) => (
              <li key={u.label}>
                <span className="font-semibold">{u.label}</span>
                <span className="text-[var(--text-muted)]"> — {u.reason}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
