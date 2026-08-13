import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, Zap, TrendingUp, Gauge, DollarSign } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { roundTo, sumMoney } from '@/utils/money';
import { formatCompact, formatNumber, formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
const COLORS = ['#f59e0b', '#3b82f6', '#06b6d4', '#6b7280'];

const SOURCES = [
  { name: 'Solar', value: 4200, cost: 28, revenue: 168000 },
  { name: 'Wind', value: 3800, cost: 22, revenue: 152000 },
  { name: 'Hydro', value: 2100, cost: 15, revenue: 84000 },
  { name: 'Gas', value: 1900, cost: 45, revenue: 95000 },
];

const MONTHLY = [
  { month: 'Jan', solar: 3200, wind: 3500, hydro: 1800, gas: 2000 },
  { month: 'Feb', solar: 3400, wind: 3300, hydro: 1900, gas: 1900 },
  { month: 'Mar', solar: 3800, wind: 3600, hydro: 2000, gas: 1800 },
  { month: 'Apr', solar: 4200, wind: 3400, hydro: 2100, gas: 1700 },
  { month: 'May', solar: 4600, wind: 3800, hydro: 2200, gas: 1600 },
  { month: 'Jun', solar: 4800, wind: 3900, hydro: 2300, gas: 1500 },
];

export default function EnergyProductionDashboard() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'FinPlan Pro — Energy Production';
  }, []);

  const totalProduction = roundTo(sumMoney(SOURCES.map((src) => src.value)), 2);
  const totalRevenue = roundTo(sumMoney(SOURCES.map((src) => src.revenue)), 2);
  const totalCost = SOURCES.reduce((s, src) => s + src.cost * src.value, 0);
  const avgCostPerMWh = totalCost / totalProduction;
  const capacityFactor = (totalProduction / (15000 * 6)) * 100;

  const costVsRevenue = SOURCES.map((s) => ({
    name: s.name,
    cost: s.cost * s.value,
    revenue: s.revenue,
  }));

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['Source', 'MWh', 'Cost/MWh', 'Revenue'],
        rows: SOURCES.map((s) => [s.name, s.value, `$${s.cost}`, fmt.currency0(s.revenue)]),
      },
      { title: 'Energy Production Dashboard' }
    ).catch(reportExportFailure);
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Zap className="h-10 w-10 text-yellow-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Energy Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Energy Production</h1>
          <p className="text-sm text-[var(--text-muted)]">Track production and commodity metrics</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KPIValue
          label="Total Production"
          value={`${formatNumber(totalProduction / 1000, 1)}GWh`}
          icon={<Zap className="h-4 w-4" />}
        />
        <KPIValue
          label="Capacity Factor"
          value={`${formatPercent(capacityFactor, 1)}`}
          icon={<Gauge className="h-4 w-4" />}
        />
        <KPIValue
          label="Avg Cost/MWh"
          value={`$${formatNumber(avgCostPerMWh, 0)}`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="Total Revenue"
          value={fmt.currency0(totalRevenue)}
          icon={<TrendingUp className="h-4 w-4" />}
          trend="up"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={SOURCES}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${formatPercent(percent ?? 0, 0)}`}
                >
                  {SOURCES.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Cost by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={costVsRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `$${v ? formatCompact(v) : '—'}`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v) => fmt.currency0(Number(v))}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generation Output (MWh)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 8,
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="solar"
                name="Solar"
                stackId="1"
                fill="#f59e0b"
                fillOpacity={0.6}
                stroke="#f59e0b"
              />
              <Area
                type="monotone"
                dataKey="wind"
                name="Wind"
                stackId="1"
                fill="#3b82f6"
                fillOpacity={0.6}
                stroke="#3b82f6"
              />
              <Area
                type="monotone"
                dataKey="hydro"
                name="Hydro"
                stackId="1"
                fill="#06b6d4"
                fillOpacity={0.6}
                stroke="#06b6d4"
              />
              <Area
                type="monotone"
                dataKey="gas"
                name="Gas"
                stackId="1"
                fill="#6b7280"
                fillOpacity={0.6}
                stroke="#6b7280"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
