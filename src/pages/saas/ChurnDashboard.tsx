/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { Download, Users, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

const MONTHLY_CHURN = [
  { month: 'Jan', customerChurn: 3.2, revenueChurn: 2.8, saveRate: 42 },
  { month: 'Feb', customerChurn: 3.5, revenueChurn: 3.1, saveRate: 38 },
  { month: 'Mar', customerChurn: 2.9, revenueChurn: 2.5, saveRate: 45 },
  { month: 'Apr', customerChurn: 3.1, revenueChurn: 2.7, saveRate: 40 },
  { month: 'May', customerChurn: 2.7, revenueChurn: 2.3, saveRate: 48 },
  { month: 'Jun', customerChurn: 2.4, revenueChurn: 2.0, saveRate: 52 },
];

const SEGMENT_CHURN = [
  { segment: 'Enterprise', churn: 1.2, customers: 45, mrr: 125000 },
  { segment: 'Mid-Market', churn: 2.8, customers: 120, mrr: 85000 },
  { segment: 'SMB', churn: 4.5, customers: 380, mrr: 42000 },
  { segment: 'Startup', churn: 6.1, customers: 210, mrr: 18000 },
];

const AT_RISK = [
  { name: 'Acme Corp', segment: 'Enterprise', mrr: 25000, riskScore: 85, lastLogin: '14 days ago' },
  {
    name: 'TechStart Inc',
    segment: 'Mid-Market',
    mrr: 8500,
    riskScore: 72,
    lastLogin: '21 days ago',
  },
  {
    name: 'GlobalRetail',
    segment: 'Enterprise',
    mrr: 18000,
    riskScore: 68,
    lastLogin: '7 days ago',
  },
  { name: 'DataFlow Ltd', segment: 'SMB', mrr: 3200, riskScore: 91, lastLogin: '30 days ago' },
  { name: 'CloudFirst', segment: 'Mid-Market', mrr: 6800, riskScore: 78, lastLogin: '18 days ago' },
];

export default function ChurnDashboard() {
  const { entries } = useGLStore();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'FinPlan Pro — Churn Dashboard';
  }, []);

  const metrics = useMemo(() => {
    const latest = MONTHLY_CHURN[MONTHLY_CHURN.length - 1];
    const totalAtRiskMRR = AT_RISK.reduce((s, c) => s + c.mrr, 0);
    return {
      customerChurn: latest!.customerChurn,
      revenueChurn: latest!.revenueChurn,
      saveRate: latest!.saveRate,
      atRiskCount: AT_RISK.length,
      totalAtRiskMRR,
    };
  }, []);

  const handleExport = () => {
    ExportEngine.exportToExcel(
      {
        headers: ['Customer', 'Segment', 'MRR', 'Risk Score', 'Last Login'],
        rows: AT_RISK.map((c) => [c.name, c.segment, c.mrr, c.riskScore, c.lastLogin]),
      },
      { title: 'Churn_At_Risk_Customers' }
    );
  };

  if (entries.length === 0)
    return (
      <div className="p-12 text-center">
        <Users className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No SaaS Data</h2>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Churn Dashboard</h1>
          <p className="text-sm text-slate-400">Customer retention and churn analysis</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <KPIValue
          label="Customer Churn"
          value={formatPct(metrics.customerChurn)}
          icon={<TrendingDown className="h-4 w-4" />}
          trend="down"
        />
        <KPIValue
          label="Revenue Churn"
          value={formatPct(metrics.revenueChurn)}
          icon={<TrendingDown className="h-4 w-4" />}
          trend="down"
        />
        <KPIValue
          label="Save Rate"
          value={formatPct(metrics.saveRate)}
          icon={<RefreshCw className="h-4 w-4" />}
          trend="up"
        />
        <KPIValue
          label="At-Risk Customers"
          value={metrics.atRiskCount.toString()}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KPIValue
          label="At-Risk MRR"
          value={formatCurrency(metrics.totalAtRiskMRR)}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend="down"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Churn Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={MONTHLY_CHURN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v: any) => `${v}%`}
                />
                <Legend />
                <Line
                  dataKey="customerChurn"
                  name="Customer Churn"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
                <Line
                  dataKey="revenueChurn"
                  name="Revenue Churn"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Churn by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={SEGMENT_CHURN}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="segment" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  formatter={(v: any) => `${v}%`}
                />
                <Bar dataKey="churn" name="Churn %" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>At-Risk Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Customer</th>
                  <th className="text-left py-2 px-3 text-slate-400 font-medium">Segment</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">MRR</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Risk Score</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {AT_RISK.map((c) => (
                  <tr key={c.name} className="border-b border-slate-800">
                    <td className="py-2 px-3 font-medium">{c.name}</td>
                    <td className="py-2 px-3">{c.segment}</td>
                    <td className="text-right py-2 px-3">{formatCurrency(c.mrr)}</td>
                    <td className="text-right py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${c.riskScore >= 80 ? 'bg-red-900/50 text-red-300' : c.riskScore >= 60 ? 'bg-yellow-900/50 text-yellow-300' : 'bg-green-900/50 text-green-300'}`}
                      >
                        {c.riskScore}
                      </span>
                    </td>
                    <td className="text-right py-2 px-3 text-slate-400">{c.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
