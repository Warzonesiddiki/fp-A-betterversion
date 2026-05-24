import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { BankingEngine } from '@/engines/BankingEngine';
import { ExportEngine } from '@/engines/ExportEngine';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  Download,
  Landmark,
  ArrowRight,
  DollarSign,
  Shield,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import type { GLEntry } from '@/types';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

/** Bridge glStore entries to the GLEntry shape the engines expect. */
function toSectorEntries(entries: readonly GLEntry[]): GLEntry[] {
  return entries.map((e) => ({
    ...e,
    currency: e.currency ?? 'USD',
    entityId: e.entityId ?? 'default',
  }));
}

export default function BankingDashboard() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro - Banking Dashboard';
  }, []);

  const sectorEntries = useMemo(() => toSectorEntries(entries), [entries]);

  const loanStats = useMemo(
    () => BankingEngine.calculateLoanLossStats(sectorEntries),
    [sectorEntries]
  );

  const capitalStats = useMemo(
    () => BankingEngine.calculateCapitalStats(sectorEntries),
    [sectorEntries]
  );

  const nimStats = useMemo(() => BankingEngine.calculateNIMStats(sectorEntries), [sectorEntries]);

  const handleExport = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Value'],
        rows: [
          ['Gross Loans', formatCurrency(loanStats.grossLoans)],
          ['Loan Loss Reserve', formatCurrency(loanStats.reserveBalance)],
          ['NPL Ratio', formatPercent(loanStats.nplRatio)],
          ['Coverage Ratio', formatPercent(loanStats.coverageRatio)],
          ['Provision Expense', formatCurrency(loanStats.provisionExpense)],
          ['Tier 1 Capital', formatCurrency(capitalStats.tier1Capital)],
          ['Total Capital', formatCurrency(capitalStats.totalCapital)],
          ['RWA', formatCurrency(capitalStats.rwa)],
          ['Tier 1 Ratio', formatPercent(capitalStats.tier1Ratio)],
          ['Total Capital Ratio', formatPercent(capitalStats.totalRatio)],
          ['Leverage Ratio', formatPercent(capitalStats.leverageRatio)],
        ],
      },
      { title: 'Banking Dashboard Report' }
    );
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" aria-label="Banking Dashboard - No Data">
        <Landmark className="h-10 w-10 text-slate-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">No Banking Data</h2>
        <p className="text-slate-400 mb-6">
          Import GL data with banking account codes to view dashboard.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" aria-label="Banking Dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banking Dashboard</h1>
          <p className="text-sm text-slate-400">
            Loan loss, capital adequacy, and net interest margin analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            aria-label="Export banking report"
          >
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/banking/loan-loss')}
            aria-label="View loan loss details"
          >
            Loan Loss <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* KPI Section */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        aria-label="Banking Key Performance Indicators"
      >
        <KPIValue
          label="Gross Loans"
          value={formatCurrency(loanStats.grossLoans)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="NPL Ratio"
          value={formatPercent(loanStats.nplRatio)}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <KPIValue
          label="Tier 1 Ratio"
          value={formatPercent(capitalStats.tier1Ratio)}
          icon={<Shield className="h-4 w-4" />}
        />
        <KPIValue
          label="Net Interest Margin"
          value={formatPercent(nimStats.netInterestMargin ?? nimStats.netInterestMargin ?? 0)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Loss Card */}
        <Card>
          <CardHeader>
            <CardTitle id="loan-loss-title">Loan Loss Reserves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Reserve Balance</span>
                <span className="font-semibold">{formatCurrency(loanStats.reserveBalance)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">NPL Balance</span>
                <span className="font-semibold">{formatCurrency(loanStats.nplBalance)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Coverage Ratio</span>
                <span className="font-semibold">{formatPercent(loanStats.coverageRatio)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Provision Expense</span>
                <span className="font-semibold">{formatCurrency(loanStats.provisionExpense)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capital Adequacy Card */}
        <Card>
          <CardHeader>
            <CardTitle id="capital-title">Capital Adequacy (Basel III)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Tier 1 Capital</span>
                <span className="font-semibold">{formatCurrency(capitalStats.tier1Capital)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Tier 2 Capital</span>
                <span className="font-semibold">{formatCurrency(capitalStats.tier2Capital)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Risk-Weighted Assets</span>
                <span className="font-semibold">{formatCurrency(capitalStats.rwa)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Total Capital Ratio</span>
                <span className="font-semibold">{formatPercent(capitalStats.totalRatio)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                <span className="text-sm text-slate-300">Leverage Ratio</span>
                <span className="font-semibold">{formatPercent(capitalStats.leverageRatio)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NIM Card */}
      <Card>
        <CardHeader>
          <CardTitle id="nim-title">Net Interest Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-slate-800 rounded-lg text-center">
              <div className="text-xs text-slate-400 mb-1">Interest Income</div>
              <div className="font-semibold">{formatCurrency(nimStats.interestIncome ?? 0)}</div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg text-center">
              <div className="text-xs text-slate-400 mb-1">Interest Expense</div>
              <div className="font-semibold">
                {formatCurrency(nimStats.interestExpense ?? nimStats.interestExpense ?? 0)}
              </div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg text-center">
              <div className="text-xs text-slate-400 mb-1">Net Interest Income</div>
              <div className="font-semibold">{formatCurrency(nimStats.netInterestMargin ?? 0)}</div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg text-center">
              <div className="text-xs text-slate-400 mb-1">NIM</div>
              <div className="font-semibold">{formatPercent(nimStats.netInterestMargin ?? 0)}</div>
            </div>
          </div>

          {capitalStats.trendData.length > 0 && (
            <div
              role="img"
              aria-labelledby="nim-title"
              aria-label="Line chart showing capital ratio trends"
            >
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={capitalStats.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v.toFixed(1)}%`} />
                  <Tooltip
                    formatter={(v: any) => `${v.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tier1"
                    stroke="#3b82f6"
                    name="Tier 1 Ratio"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    name="Total Capital Ratio"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
