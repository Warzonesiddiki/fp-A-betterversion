import { HelpPanel } from '@/components/ui/HelpPanel';
import { PAGE_HELP } from '@/pages/_docs';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPICard } from '@/components/dashboard/KPICard';
import { ChartWrapper } from '@/components/analytics/ChartWrapper';
import { DataGrid } from '@/components/ui/DataGrid';
import { Landmark, ShieldCheck, Download } from 'lucide-react';
import { ExportEngine, BankingEngine } from '@/engines';

export default function CapitalAdequacyPage() {
  const { pathname } = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Capital Adequacy';
  }, []);

  const { entries } = useGLStore();
  const navigate = useNavigate();
  const [period] = useState('2024-Q1');

  const stats = useMemo(() => {
    return BankingEngine.calculateCapitalStats(entries);
  }, [entries]);

  const rwaBreakdown = useMemo(() => {
    // Break down RWA by asset class
    const assetClasses = [
      { prefix: '11', name: 'Cash & Equivalents', weight: 0 },
      { prefix: '12', name: 'Government Securities', weight: 0 },
      { prefix: '131', name: 'Residential Mortgages', weight: 0.5 },
      { prefix: '132', name: 'Corporate Loans', weight: 1.0 },
    ];

    return assetClasses
      .map((ac) => {
        const balance = entries
          .filter((e) => e.accountCode.startsWith(ac.prefix))
          .reduce((acc, e) => acc + e.amount, 0);

        const rwa = balance * ac.weight;

        return {
          category: ac.name,
          amount: balance,
          weight: `${ac.weight * 100}%`,
          charge: rwa * 0.08, // 8% minimum capital charge
        };
      })
      .filter((a) => a.amount !== 0);
  }, [entries]);

  const columns = [
    { field: 'category', headerName: 'Risk Category', flex: 1 },
    { field: 'amount', headerName: 'Exposure Amount', type: 'currency' as const, flex: 1 },
    { field: 'weight', headerName: 'RWA Weight', flex: 1 },
    { field: 'charge', headerName: 'Capital Charge', type: 'currency' as const, flex: 1 },
  ];

  const handleExport = () => {
    const data = {
      headers: ['Risk Category', 'Exposure Amount', 'RWA Weight', 'Capital Charge'],
      rows: rwaBreakdown.map((r) => [r.category, r.amount, r.weight, r.charge]),
    };
    ExportEngine.exportToPDF(data, {
      title: 'Capital Adequacy Report',
      subtitle: `Reporting Period: ${period}`,
    });
  };

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Landmark className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Regulatory Data</h2>
        <p className="text-slate-400 mb-6">
          Import General Ledger and Risk data to monitor capital adequacy.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="h-6 w-6 text-blue-400" />
              Capital Adequacy
            </h1>
            <p className="text-sm text-slate-400 mt-1">Basel III Regulatory Capital Monitoring</p>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors ml-4"
            aria-label="Help"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Button size="sm">Regulatory Submission</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tier 1 Capital Ratio"
          value={stats.tier1Ratio}
          format="percent"
          trend="up"
          change={0.34}
          sparklineData={stats.trendData.map((d) => d.tier1)}
        />
        <KPICard
          title="Total Capital Ratio"
          value={stats.totalRatio}
          format="percent"
          trend="neutral"
          change={0.05}
        />
        <KPICard title="Common Equity Tier 1" value={stats.tier1Capital} format="currency" />
        <KPICard
          title="Leverage Ratio"
          value={stats.leverageRatio}
          format="percent"
          trend="up"
          change={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartWrapper
            title="Capital Ratio Trends"
            subtitle="Regulatory compliance over last 4 quarters"
            height={400}
          >
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stats.trendData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[10, 16]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total Capital Ratio"
                />
                <Area
                  type="monotone"
                  dataKey="tier1"
                  stroke="#10b981"
                  fill="transparent"
                  name="Tier 1 Ratio"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-400" />
              Compliance Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-xs font-bold text-green-400 uppercase">
                Status: Well Capitalized
              </div>
              <p className="text-xs text-slate-400 mt-1">
                All ratios exceed Basel III and local regulatory requirements.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">CET1 Min Requirement</span>
                <span className="font-semibold">4.50%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Capital Conservation Buffer</span>
                <span className="font-semibold text-green-400">2.50%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Countercyclical Buffer</span>
                <span className="font-semibold">0.00%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Risk-Weighted Assets Breakdown</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-400">
            View Methodology
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DataGrid rows={rwaBreakdown} columns={columns} className="h-64 border-none" />
        </CardContent>
      </Card>

      <HelpPanel
        title={PAGE_HELP[pathname]?.title || 'Capital Adequacy Help'}
        sections={PAGE_HELP[pathname]?.sections || []}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </div>
  );
}
