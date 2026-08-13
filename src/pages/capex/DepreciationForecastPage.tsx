import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import Decimal from 'decimal.js';
import { divideMoney, roundTo, subtractMoney, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
/**
 * GAP-1 (F-0006) — exact-decimal depreciation forecast totals.
 *
 * totalCost/totalNBV/totalAnnualDep were raw float reduces over the asset
 * list; avgAge divides accumulated depreciation (cost-nbv) by annualDep
 * and is a time-in-years metric (divides currency/currency → unitless
 * years), accumulated on Decimal for precision then emitted as a number
 * at 1 decimal place. The _glTotal cross-check over GL 14xx/15xx entries
 * is migrated identically.
 */
export interface DeprAssetLike {
  cost: number;
  nbv: number;
  annualDep: number;
}
export interface DeprForecastTotals {
  totalCost: number;
  totalNBV: number;
  totalAnnualDep: number;
  avgAge: number;
}
export function computeDeprForecastTotals(assets: readonly DeprAssetLike[]): DeprForecastTotals {
  const totalCost = roundTo(sumMoney(assets.map((a) => a.cost)));
  const totalNBV = roundTo(sumMoney(assets.map((a) => a.nbv)));
  const totalAnnualDep = roundTo(sumMoney(assets.map((a) => a.annualDep)));
  let ageSum = new Decimal(0);
  for (const a of assets) {
    const accumulated = subtractMoney(a.cost, a.nbv); // cost - nbv
    ageSum = ageSum.add(divideMoney(accumulated, a.annualDep));
  }
  const avgAge = assets.length > 0 ? roundTo(divideMoney(ageSum, assets.length), 1) : 0;
  return { totalCost, totalNBV, totalAnnualDep, avgAge };
}

export function sumGLFixedAssetMovement(
  entries: readonly { accountCode?: string; debit: number; credit: number }[]
): number {
  const fixed = entries.filter(
    (e) => (e.accountCode || '').startsWith('14') || (e.accountCode || '').startsWith('15')
  );
  return roundTo(
    sumMoney(
      fixed.map((e) =>
        // absolute net movement per entry
        new Decimal(e.debit).sub(e.credit).abs().toNumber()
      )
    )
  );
}

const ASSETS = [
  {
    id: 'A001',
    name: 'Office Building',
    category: 'Real Estate',
    cost: 5000000,
    usefulLife: 39,
    method: 'straight-line',
    nbv: 4200000,
    annualDep: 128205,
  },
  {
    id: 'A002',
    name: 'Manufacturing Equipment',
    category: 'Machinery',
    cost: 1200000,
    usefulLife: 10,
    method: 'straight-line',
    nbv: 720000,
    annualDep: 120000,
  },
  {
    id: 'A003',
    name: 'Delivery Vehicles',
    category: 'Vehicles',
    cost: 450000,
    usefulLife: 5,
    method: 'declining-balance',
    nbv: 162000,
    annualDep: 64800,
  },
  {
    id: 'A004',
    name: 'IT Infrastructure',
    category: 'Technology',
    cost: 800000,
    usefulLife: 5,
    method: 'straight-line',
    nbv: 320000,
    annualDep: 160000,
  },
  {
    id: 'A005',
    name: 'Office Furniture',
    category: 'Furniture',
    cost: 250000,
    usefulLife: 7,
    method: 'straight-line',
    nbv: 142857,
    annualDep: 35714,
  },
  {
    id: 'A006',
    name: 'Warehouse Facility',
    category: 'Real Estate',
    cost: 2800000,
    usefulLife: 30,
    method: 'straight-line',
    nbv: 2240000,
    annualDep: 93333,
  },
];

const ANNUAL_DEP = [
  { year: '2022', expense: 380000, capex: 500000 },
  { year: '2023', expense: 420000, capex: 800000 },
  { year: '2024', expense: 450000, capex: 350000 },
  { year: '2025', expense: 480000, capex: 600000 },
  { year: '2026', expense: 502052, capex: 450000 },
  { year: '2027', expense: 510000, capex: 300000 },
];

const NBV_TREND = [
  { year: '2022', nbv: 9200000 },
  { year: '2023', nbv: 9580000 },
  { year: '2024', nbv: 9480000 },
  { year: '2025', nbv: 9600000 },
  { year: '2026', nbv: 7782857 },
  { year: '2027', nbv: 7572857 },
];

export default function DepreciationForecastPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [method, setMethod] = useState<string>('all');
  useEffect(() => {
    document.title = 'FinPlan Pro — Depreciation Forecast';
  }, []);

  const filteredAssets = useMemo(
    () => (method === 'all' ? ASSETS : ASSETS.filter((a) => a.method === method)),
    [method]
  );

  const totals = useMemo(() => computeDeprForecastTotals(filteredAssets), [filteredAssets]);

  const _glTotal = useMemo(() => sumGLFixedAssetMovement(entries), [entries]);

  const handleExport = () => {
    void ExportEngine.exportToExcel(
      {
        headers: [
          'ID',
          'Asset',
          'Category',
          'Cost',
          'Useful Life',
          'Method',
          'NBV',
          'Annual Depreciation',
        ],
        rows: filteredAssets.map((a) => [
          a.id,
          a.name,
          a.category,
          a.cost,
          a.usefulLife,
          a.method,
          a.nbv,
          a.annualDep,
        ]),
      },
      { title: 'Depreciation_Forecast' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <TrendingDown className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Depreciation Forecast</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Asset depreciation schedules and forecasts
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Asset Cost"
          value={fmt.currency0(totals.totalCost)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Net Book Value"
          value={fmt.currency0(totals.totalNBV)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Annual Depreciation"
          value={fmt.currency0(totals.totalAnnualDep)}
          icon={<TrendingDown className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Asset Age"
          value={`${formatPercent(totals.avgAge)} years`}
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--text-muted)]">Method:</span>
        {['all', 'straight-line', 'declining-balance', 'units-of-production'].map((m) => (
          <Button
            key={m}
            variant={method === m ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMethod(m)}
          >
            {m === 'all'
              ? 'All'
              : m === 'straight-line'
                ? 'Straight-Line'
                : m === 'declining-balance'
                  ? 'Declining Balance'
                  : 'Units of Production'}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Asset Depreciation Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Depreciation forecast by asset">
              <caption className="sr-only">
                Depreciation schedule showing cost basis, useful life, method, and annual
                depreciation per asset
              </caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Asset
                  </th>
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Cost
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Life (Yr)
                  </th>
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Method
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    NBV
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Annual Dep
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((a) => (
                  <tr key={a.id} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{a.name}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300">
                        {a.category}
                      </span>
                    </td>
                    <td className="text-right py-2 px-3">{fmt.currency0(a.cost)}</td>
                    <td className="text-right py-2 px-3">{a.usefulLife}</td>
                    <td className="py-2 px-3 text-xs text-[var(--text-muted)]">{a.method}</td>
                    <td className="text-right py-2 px-3">{fmt.currency0(a.nbv)}</td>
                    <td className="text-right py-2 px-3 text-yellow-400">
                      {fmt.currency0(a.annualDep)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-slate-600">
                  <td className="py-2 px-3" colSpan={2}>
                    Total
                  </td>
                  <td className="text-right py-2 px-3">{fmt.currency0(totals.totalCost)}</td>
                  <td></td>
                  <td></td>
                  <td className="text-right py-2 px-3">{fmt.currency0(totals.totalNBV)}</td>
                  <td className="text-right py-2 px-3 text-yellow-400">
                    {fmt.currency0(totals.totalAnnualDep)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Annual Depreciation vs CapEx</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={ANNUAL_DEP}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${Math.round(v / 100000) / 10}M`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => fmt.currency0(Number(v))}
                />
                <Legend />
                <Bar dataKey="expense" name="Depreciation" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="capex" name="CapEx" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Book Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={NBV_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${Math.round(v / 100000) / 10}M`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => fmt.currency0(Number(v))}
                />
                <Line
                  type="monotone"
                  dataKey="nbv"
                  name="NBV"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
