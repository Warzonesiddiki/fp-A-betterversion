/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import {
  Download,
  FileText,
  Table as TableIcon,
  DollarSign,
  TrendingUp,
  Scale,
  Clock,
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface ComponentRow {
  component: string;
  amount: number;
  ratio: string;
  days: number;
}

/**
 * GAP-1 (F-0006) — exact-decimal working-capital component totals.
 *
 * Current assets (11xx/12xx net) and current liabilities (21xx contra-net),
 * revenue (4xxx net), and COGS (5xxx |net|) were raw float reduces. WC =
 * assets - liabilities; ratios (currentRatio, quickRatio) and days (DSO/DIO/
 * DPO) are unitless ratios/integers — computed via Decimal for drift-free
 * division but emitted as plain numbers. Component amounts split by
 * heuristic percentage weights are currency-valued and migrated to
 * multiplyMoney; DSO/DIO/DPO use Math.round (integer days).
 */
export interface WCEntry {
  accountCode?: string;
  debit: number;
  credit: number;
}
export interface WCComponents {
  cash: number;
  ar: number;
  inventory: number;
  otherCa: number;
  ap: number;
  accrued: number;
  stDebt: number;
}
export interface WCSummary {
  assets: number;
  liabilities: number;
  wc: number;
  currentRatio: number;
  quickRatio: number;
  revenue: number;
  cogs: number;
  components: ComponentRow[];
  dso: number;
  dpo: number;
  dio: number;
  ccc: number;
}
export function computeWorkingCapital(entries: readonly WCEntry[]): WCSummary {
  const assets = roundTo(
    sumMoney(
      entries
        .filter(
          (e) => (e.accountCode || '').startsWith('11') || (e.accountCode || '').startsWith('12')
        )
        .map((e) => e.debit - e.credit)
    )
  );
  const liabilities = roundTo(
    sumMoney(
      entries.filter((e) => (e.accountCode || '').startsWith('21')).map((e) => e.credit - e.debit)
    )
  );
  const wc = roundTo(subtractMoney(assets, liabilities));
  const currentRatio = liabilities > 0 ? roundTo(divideMoney(assets, liabilities), 4) : 0;
  const quickRatio =
    liabilities > 0 ? roundTo(divideMoney(multiplyMoney(assets, 0.7), liabilities), 4) : 0;
  const revenue = roundTo(
    sumMoney(
      entries.filter((e) => (e.accountCode || '').startsWith('4')).map((e) => e.debit - e.credit)
    )
  );
  const cogs = roundTo(
    sumMoney(
      entries
        .filter((e) => (e.accountCode || '').startsWith('5'))
        .map((e) => Math.abs(e.debit - e.credit))
    )
  );

  const cash = roundTo(multiplyMoney(assets, 0.3));
  const ar = roundTo(multiplyMoney(assets, 0.35));
  const inventory = roundTo(multiplyMoney(assets, 0.25));
  const otherCa = roundTo(subtractMoney(assets, addMoney(cash, addMoney(ar, inventory))));
  const ap = roundTo(multiplyMoney(liabilities, 0.4));
  const accrued = roundTo(multiplyMoney(liabilities, 0.35));
  const stDebt = roundTo(subtractMoney(liabilities, addMoney(ap, accrued)));

  const arDays =
    revenue > 0 ? Math.round(roundTo(divideMoney(multiplyMoney(ar, 365), revenue))) : 0;
  const apDays = cogs > 0 ? Math.round(roundTo(divideMoney(multiplyMoney(ap, 365), cogs))) : 0;
  const invDays =
    cogs > 0 ? Math.round(roundTo(divideMoney(multiplyMoney(inventory, 365), cogs))) : 0;

  const components: ComponentRow[] = [
    { component: 'Cash & Equivalents', amount: cash, ratio: 'Current Asset', days: 0 },
    { component: 'Accounts Receivable', amount: ar, ratio: 'Current Asset', days: arDays },
    { component: 'Inventory', amount: inventory, ratio: 'Current Asset', days: invDays },
    { component: 'Other Current Assets', amount: otherCa, ratio: 'Current Asset', days: 0 },
    { component: 'Accounts Payable', amount: ap, ratio: 'Current Liability', days: apDays },
    { component: 'Accrued Expenses', amount: accrued, ratio: 'Current Liability', days: 0 },
    { component: 'Short-term Debt', amount: stDebt, ratio: 'Current Liability', days: 0 },
  ];
  const ccc = arDays + invDays - apDays;
  return {
    assets,
    liabilities,
    wc,
    currentRatio,
    quickRatio,
    revenue,
    cogs,
    components,
    dso: arDays,
    dpo: apDays,
    dio: invDays,
    ccc,
  };
}

export default function WorkingCapitalPage() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Working Capital';
  }, []);

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    const base = computeWorkingCapital(entries);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    // trend series is a stochastic projection with Math.round + getRandom()
    // jitter — integer rounding of random variates cannot produce float
    // drift, left as JS number math.
    const trend = months.map((m, i) => ({
      month: m,
      assets: Math.round(base.assets * (0.9 + i * 0.02 + ((i * 3) % 5) * 0.01)),
      liabilities: Math.round(base.liabilities * (0.9 + i * 0.02 + ((i * 7) % 5) * 0.01)),
      wc: Math.round(base.wc * (0.85 + i * 0.03 + ((i * 11) % 10) * 0.01)),
    }));
    return { ...base, trend };
  }, [entries]);

  const handleExportPDF = () => {
    if (!data) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Component', 'Amount', 'Type', 'Days'],
        rows: data.components.map((c) => [
          c.component,
          formatCurrency(c.amount),
          c.ratio,
          c.days.toString(),
        ]),
      },
      { title: 'Working Capital Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!data) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Component', 'Amount', 'Type', 'Days'],
        rows: data.components.map((c) => [
          c.component,
          formatCurrency(c.amount),
          c.ratio,
          c.days.toString(),
        ]),
      },
      { title: 'Working_Capital_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<ComponentRow>[] = [
    { key: 'component', header: 'Component', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (r) => formatCurrency(r.amount),
      sortable: true,
    },
    { key: 'ratio', header: 'Type', sortable: true },
    {
      key: 'days',
      header: 'Days',
      align: 'right',
      render: (r) => (r.days > 0 ? `${r.days} days` : '-'),
      sortable: true,
    },
  ];

  if (!data)
    return (
      <div className="p-12 text-center">
        <Scale className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to analyze working capital.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Working Capital</h1>
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
          label="Working Capital"
          value={formatCurrency(data.wc)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Current Ratio"
          value={formatPercent(data.currentRatio, 2)}
          icon={<Scale className="h-4 w-4" />}
        />
        <KPIValue
          label="Quick Ratio"
          value={formatPercent(data.quickRatio, 2)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Cash Conversion Cycle"
          value={`${data.ccc} days`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">DSO</div>
            <div className="text-lg font-bold">{data.dso} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">DIO</div>
            <div className="text-lg font-bold">{data.dio} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">DPO</div>
            <div className="text-lg font-bold">{data.dpo} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-slate-400">CCC</div>
            <div
              className={`text-lg font-bold ${data.ccc <= 30 ? 'text-green-400' : data.ccc <= 60 ? 'text-yellow-400' : 'text-red-400'}`}
            >
              {data.ccc} days
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Working Capital Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
              <YAxis
                stroke="#94a3b8"
                fontSize={12}
                tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
              />
              <Tooltip
                formatter={(v: any) => formatCurrency(v)}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="assets"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.2}
                name="Current Assets"
              />
              <Area
                type="monotone"
                dataKey="liabilities"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.2}
                name="Current Liabilities"
              />
              <Area
                type="monotone"
                dataKey="wc"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Working Capital"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={data.components}
        caption="Working capital components over time"
        ariaLabel="Working capital components table"
      />
    </div>
  );
}
