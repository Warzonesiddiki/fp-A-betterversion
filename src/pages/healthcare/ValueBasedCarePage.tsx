import { useMemo } from 'react';
import { HeartPulse, Download, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { useHealthcareStore } from '@/store/healthcareStore';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter, formatPercent } from '@/utils/financialFormatting';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { deriveValueBasedCare } from './valueBasedCareData';

function currency(value: number): string {
  return currencyFormatter(reportingCurrency(), { minDecimals: 0 })(value);
}

const programColumns: Column[] = [
  { key: 'program', header: 'Incentive Program', sortable: true },
  { key: 'population', header: 'Patient Population (as recorded)', align: 'right' },
  { key: 'qualityScore', header: 'Quality Score (as recorded)', align: 'right' },
  {
    key: 'sharedSavings',
    header: 'Shared Savings (as recorded)',
    align: 'right',
    render: (v) => (
      <span
        className={
          String(v).startsWith('+') ? 'text-green-600 font-bold' : 'text-red-600 font-bold'
        }
      >
        {String(v)}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (v) => (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
          String(v) === 'High'
            ? 'bg-green-100 text-green-700'
            : String(v) === 'Watch'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
        }`}
      >
        {String(v)}
      </span>
    ),
  },
];

export default function ValueBasedCarePage() {
  const qualityMetrics = useHealthcareStore((s) => s.qualityMetrics);
  const savingsData = useHealthcareStore((s) => s.savingsData);
  const programs = useHealthcareStore((s) => s.programs);

  const data = useMemo(
    () => deriveValueBasedCare(qualityMetrics, savingsData, programs),
    [qualityMetrics, savingsData, programs]
  );

  if (!data) {
    return (
      <main className="p-12 text-center max-w-lg mx-auto" role="main" aria-label="Value-Based Care">
        <HeartPulse className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">No Value-Based Care Data</h1>
        <p className="text-[var(--text-muted)]">
          Record quality metrics, bundled-payment episodes or incentive programs to track
          performance-based reimbursement here. Until data is recorded, no score, savings figure or
          program row is displayed.
        </p>
      </main>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader
          title="Value-Based Care"
          purpose="Recorded quality scores and bundled-payment performance — every figure derived from data entered in this workspace."
        />
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          VBC Summary
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <KPIValue
          label="Aggregate Quality Score"
          value={
            data.aggregateQualityScore === null ? '—' : formatPercent(data.aggregateQualityScore, 2)
          }
          changeLabel="Σ recorded scores ÷ Σ full marks"
          trend="neutral"
        />
        <KPIValue
          label="Net Episode Savings"
          value={data.netSharedSavings === null ? '—' : currency(data.netSharedSavings)}
          changeLabel="Σ (target − actual) across recorded bundles"
          trend={data.netSharedSavings !== null && data.netSharedSavings >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Clinical Quality Dimensions</CardTitle>
            <CardDescription>Recorded score vs. recorded benchmark</CardDescription>
          </CardHeader>
          <CardContent>
            {data.qualityMetrics.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No quality metrics recorded yet.
              </p>
            ) : (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={data.qualityMetrics.map((m) => ({ ...m }))}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
                    <Radar
                      name="Recorded Score"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                    <Radar
                      name="Recorded Benchmark"
                      dataKey="B"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.1}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bundled Payment Performance</CardTitle>
            <CardDescription>Recorded target price vs. actual episode cost</CardDescription>
          </CardHeader>
          <CardContent>
            {data.savingsRows.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                No bundled-payment episodes recorded yet.
              </p>
            ) : (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.savingsRows.map((r) => ({ ...r }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="target" name="Target Cost" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actual" name="Actual Cost" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {data.savingsRows.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.actual > entry.target ? '#ef4444' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data.programs.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Managed Care &amp; Incentive Programs</CardTitle>
              <CardDescription>
                Programs recorded in this workspace, shown as recorded
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={programColumns}
              data={data.programs.map((p) => ({ ...p }))}
              caption="Recorded value-based care program performance"
              ariaLabel="Value-based care performance table"
            />
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs flex items-start gap-1" style={{ color: 'var(--text-secondary)' }}>
        <Info className="h-3 w-3 mt-0.5 shrink-0" />
        Population health ROI, compliance status and period-over-period changes are not derived from
        the recorded data, so no figure is displayed for them.
      </p>
    </div>
  );
}
