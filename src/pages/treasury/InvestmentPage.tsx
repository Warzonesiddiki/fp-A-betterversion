// @money-ast-allow Reason: Weighted yield ratio: weightedSum / totalValue produces a dimensionless yield percentage
import { useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, TrendingUp, DollarSign, Calendar, PieChart as PieIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { sumMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
const INVESTMENTS = [
  {
    instrument: 'US Treasury 10Y',
    type: 'Government',
    issuer: 'US Treasury',
    maturity: '2036-05-15',
    yield: 4.25,
    value: 2500000,
    rating: 'AAA',
  },
  {
    instrument: 'Corp Bond AAPL',
    type: 'Corporate',
    issuer: 'Apple Inc',
    maturity: '2030-02-08',
    yield: 3.85,
    value: 1800000,
    rating: 'AA+',
  },
  {
    instrument: 'Corp Bond MSFT',
    type: 'Corporate',
    issuer: 'Microsoft',
    maturity: '2031-11-03',
    yield: 3.72,
    value: 1500000,
    rating: 'AAA',
  },
  {
    instrument: 'Municipal Bond CA',
    type: 'Municipal',
    issuer: 'State of CA',
    maturity: '2034-06-01',
    yield: 3.15,
    value: 1200000,
    rating: 'AA',
  },
  {
    instrument: 'Corp Bond JPM',
    type: 'Corporate',
    issuer: 'JPMorgan Chase',
    maturity: '2029-10-01',
    yield: 4.1,
    value: 900000,
    rating: 'A+',
  },
  {
    instrument: 'CD 12-month',
    type: 'Cash',
    issuer: 'Wells Fargo',
    maturity: '2027-01-15',
    yield: 4.8,
    value: 500000,
    rating: 'N/A',
  },
];

const ALLOCATION = [
  { name: 'Government', value: 2500000 },
  { name: 'Corporate', value: 4200000 },
  { name: 'Municipal', value: 1200000 },
  { name: 'Cash', value: 500000 },
];

const MATURITY_LADDER = [
  { bucket: '<1Y', value: 500000 },
  { bucket: '1-3Y', value: 900000 },
  { bucket: '3-5Y', value: 3300000 },
  { bucket: '5-10Y', value: 4300000 },
  { bucket: '>10Y', value: 0 },
];

const YIELD_CURVE = [
  { tenor: '3M', yield: 4.9 },
  { tenor: '6M', yield: 4.8 },
  { tenor: '1Y', yield: 4.6 },
  { tenor: '2Y', yield: 4.4 },
  { tenor: '5Y', yield: 4.1 },
  { tenor: '10Y', yield: 4.25 },
  { tenor: '30Y', yield: 4.35 },
];

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#6b7280'];

/** Money-primitive investment portfolio totals (GAP-1 F-0006). */
export interface InvestmentTotals {
  totalValue: number;
  weightedYield: number;
}

export function computeInvestmentTotals(
  investments: readonly { value: number; yield: number }[]
): InvestmentTotals {
  const totalValue = roundTo(sumMoney(investments.map((i) => i.value)), 2);
  // weightedYield is a percentage ratio — computed via money to avoid drift
  // in the numerator (yield × value), then divided
  const weightedSum = roundTo(sumMoney(investments.map((i) => i.yield * i.value)), 2);
  const weightedYield = totalValue !== 0 ? weightedSum / totalValue : 0;
  return { totalValue, weightedYield };
}

export default function InvestmentPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'FinPlan Pro — Investment Dashboard';
  }, []);

  const { totalValue, weightedYield } = computeInvestmentTotals(INVESTMENTS);

  const handleExport = () => {
    void ExportEngine.exportToExcel(
      {
        headers: ['Instrument', 'Type', 'Issuer', 'Maturity', 'Yield', 'Value', 'Rating'],
        rows: INVESTMENTS.map((i) => [
          i.instrument,
          i.type,
          i.issuer,
          i.maturity,
          `${i.yield}%`,
          i.value,
          i.rating,
        ]),
      },
      { title: 'Investment_Portfolio' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <TrendingUp className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data</h2>
        <p className="text-[var(--text-muted)] mb-6">Import treasury data.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Investment Dashboard"
        purpose="Track investment portfolio performance"
        actions={
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Portfolio"
          value={fmt.currency0(totalValue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Weighted Avg Yield"
          value={formatPercent(weightedYield)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="up"
        />
        <KPIValue
          label="Holdings"
          value={INVESTMENTS.length.toString()}
          icon={<PieIcon className="h-4 w-4" />}
        />
        <KPIValue label="Avg Maturity" value="5.2 years" icon={<Calendar className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={ALLOCATION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`}
                >
                  {ALLOCATION.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => fmt.currency0(Number(v))}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yield Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={YIELD_CURVE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="tenor" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => `${v}%`}
                />
                <Line
                  type="monotone"
                  dataKey="yield"
                  name="Yield"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maturity Ladder</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MATURITY_LADDER}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="bucket" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${Math.round(v / 100000) / 10}M`} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
                formatter={(v) => fmt.currency0(Number(v))}
              />
              <Bar dataKey="value" name="Value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Investment portfolio by instrument">
              <caption className="sr-only">
                Detailed breakdown of investment portfolio by instrument
              </caption>
              <thead>
                <tr className="border-b border-slate-700">
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Instrument
                  </th>
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Issuer
                  </th>
                  <th
                    scope="col"
                    className="text-left py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Maturity
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Yield
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 px-3 text-[var(--text-muted)] font-medium"
                  >
                    Rating
                  </th>
                </tr>
              </thead>
              <tbody>
                {INVESTMENTS.map((inv) => (
                  <tr key={inv.instrument} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{inv.instrument}</td>
                    <td className="py-2 px-3">{inv.issuer}</td>
                    <td className="py-2 px-3">{inv.maturity}</td>
                    <td className="text-right py-2 px-3 text-green-400">
                      {formatPercent(inv.yield)}
                    </td>
                    <td className="text-right py-2 px-3">{fmt.currency0(inv.value)}</td>
                    <td className="text-right py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-900/50 text-blue-300">
                        {inv.rating}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-slate-600">
                  <td className="py-2 px-3" colSpan={4}>
                    Total
                  </td>
                  <td className="text-right py-2 px-3">{fmt.currency0(totalValue)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
