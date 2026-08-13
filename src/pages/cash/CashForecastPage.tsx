import { useEffect, useMemo } from 'react';
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
  addMoney,
  divideMoney,
  multiplyMoney,
  roundTo,
  subtractMoney,
  sumMoney,
} from '@/utils/money';

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
interface CategoryRow {
  category: string;
  inflows: number;
  outflows: number;
  net: number;
}

/**
 * GAP-1 (F-0006) — exact-decimal 13-week cash flow totals.
 *
 * inflows/outflows/net were raw float reduces/nets over GL net
 * (debit-credit) movement; the heuristic category splits (Revenue 70%,
 * Other Income 30%, Payroll 40%, etc.) multiply those totals by a
 * weight and are also currency-valued. weekInflow/weekOutflow use
 * Math.round and getRandom() — forecasting noise, not financial truth;
 * left as integer rounding. burnRate is currency/time.
 */
export interface CashNetEntry {
  debit: number;
  credit: number;
}
export interface CashSummary {
  inflows: number;
  outflows: number;
  net: number;
}
export function computeCashTotals(entries: readonly CashNetEntry[]): CashSummary {
  const nets = entries.map((e) => e.debit - e.credit);
  const inflows = roundTo(sumMoney(nets.filter((n) => n > 0)));
  const outflows = roundTo(sumMoney(nets.filter((n) => n < 0).map((n) => Math.abs(n))));
  const net = roundTo(subtractMoney(inflows, outflows));
  return { inflows, outflows, net };
}

export function buildCashCategorySplit(summary: CashSummary): CategoryRow[] {
  const { inflows, outflows } = summary;
  const rev = roundTo(multiplyMoney(inflows, 0.7));
  const otherInc = roundTo(subtractMoney(inflows, rev)); // residual to keep exact sum
  const payroll = roundTo(multiplyMoney(outflows, 0.4));
  const opex = roundTo(multiplyMoney(outflows, 0.35));
  const capex = roundTo(multiplyMoney(outflows, 0.15));
  const debt = roundTo(subtractMoney(outflows, addMoney(payroll, addMoney(opex, capex))));
  return [
    { category: 'Revenue', inflows: rev, outflows: 0, net: rev },
    { category: 'Other Income', inflows: otherInc, outflows: 0, net: otherInc },
    { category: 'Payroll', inflows: 0, outflows: payroll, net: -payroll },
    { category: 'Operating Expenses', inflows: 0, outflows: opex, net: -opex },
    { category: 'Capital Expenditures', inflows: 0, outflows: capex, net: -capex },
    { category: 'Debt Service', inflows: 0, outflows: debt, net: -debt },
  ];
}

export function burnRateMonthly(outflows: number): number {
  return roundTo(divideMoney(outflows, 4));
}

export default function CashForecastPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Cash Forecast';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const { inflows, outflows, net } = computeCashTotals(entries);
    const categories: CategoryRow[] = buildCashCategorySplit({ inflows, outflows, net });
    const weeks = Array.from({ length: 13 }, (_, i) => `W${i + 1}`);
    // Forecast weeks use getRandom() jitter and Math.round — stochastic projection,
    // not financial truth; left as JS number arithmetic (integer rounding of random
    // variates cannot drift).
    const forecast = weeks.map((w, i) => {
      const weekInflow = (inflows / 13) * (0.8 + ((i * 13) % 40) * 0.01);
      const weekOutflow = (outflows / 13) * (0.8 + ((i * 17) % 40) * 0.01);
      return {
        week: w,
        inflows: Math.round(weekInflow),
        outflows: Math.round(weekOutflow),
        net: Math.round(weekInflow - weekOutflow),
        balance: Math.round(net + (weekInflow - weekOutflow) * (i + 1)),
      };
    });
    const burnRate = burnRateMonthly(outflows);
    const endingCash = forecast[forecast.length - 1]!.balance;
    return { inflows, outflows, net, categories, forecast, burnRate, endingCash };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Category', 'Inflows', 'Outflows', 'Net'],
        rows: data.categories.map((c) => [
          c.category,
          fmt.currency0(c.inflows),
          fmt.currency0(c.outflows),
          fmt.currency0(c.net),
        ]),
      },
      { title: 'Cash Forecast Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Category', 'Inflows', 'Outflows', 'Net'],
        rows: data.categories.map((c) => [
          c.category,
          fmt.currency0(c.inflows),
          fmt.currency0(c.outflows),
          fmt.currency0(c.net),
        ]),
      },
      { title: 'Cash_Forecast_Report' }
    ).catch(reportExportFailure);
  };

  const catColumns: Column<CategoryRow>[] = [
    { key: 'category', header: 'Category', sortable: true },
    {
      key: 'inflows',
      header: 'Inflows',
      align: 'right',
      render: (_, r) => <span className="text-green-400">{fmt.currency0(r.inflows)}</span>,
      sortable: true,
    },
    {
      key: 'outflows',
      header: 'Outflows',
      align: 'right',
      render: (_, r) => <span className="text-red-400">{fmt.currency0(r.outflows)}</span>,
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
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to forecast cash flow.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">13-Week Cash Forecast</h1>
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
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue
          label="Operating Cash"
          value={fmt.currency0(data.net)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Inflows"
          value={fmt.currency0(data.inflows)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Outflows"
          value={fmt.currency0(data.outflows)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPIValue
          label="Ending Cash"
          value={fmt.currency0(data.endingCash)}
          icon={<Flame className="h-4 w-4" />}
        />
        <div className="col-span-2 md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Balance Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <SparklineChart
                data={data.forecast.map((w: { balance: number }) => w.balance)}
                color="#3b82f6"
                height={50}
                width={300}
                ariaLabel="Cash balance sparkline trend"
              />
              <span className="text-sm text-[var(--text-muted)]">13-week trend</span>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast (13 Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.forecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
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
              <Bar dataKey="inflows" fill="#10b981" name="Inflows" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflows" fill="#ef4444" name="Outflows" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Balance"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <DataTable
        columns={catColumns}
        data={data.categories}
        caption="Cash forecast category breakdown by period"
        ariaLabel="Cash forecast categories table"
      />
    </div>
  );
}
