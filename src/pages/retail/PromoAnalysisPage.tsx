import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useRetailStore } from '@/store/retailStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileText, Table as TableIcon, Tag } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
import { derivePromoAnalysis } from '@/pages/retail/promoAnalysisData';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Promotion analysis.
 *
 * Figures come from `@/pages/retail/promoAnalysisData` over promotions the user
 * recorded in `retailStore`. This page previously hardcoded five campaigns
 * (Summer Sale, Back to School, Holiday Bundle …), computed every KPI from
 * them, exported them to PDF and Excel, and read the ledger only to throw it
 * away (`const { entries: _entries } = useGLStore()`).
 */
export default function PromoAnalysisPage() {
  const fmt = useCurrencyFormatter();
  const promotions = useRetailStore((s) => s.promotions);

  useEffect(() => {
    document.title = 'FinPlan Pro — Promo Analysis';
  }, []);

  const analysis = useMemo(() => derivePromoAnalysis(promotions), [promotions]);

  const beforeAfterData = useMemo(
    () =>
      (analysis?.promotions ?? [])
        .filter((p) => p.status === 'completed')
        .map((p) => ({ name: p.name, before: p.baselineRevenue, after: p.revenue })),
    [analysis]
  );

  const scatterData = useMemo(
    () =>
      (analysis?.promotions ?? []).map((p) => ({
        cost: p.cost,
        revenue: p.revenue,
        name: p.name,
      })),
    [analysis]
  );

  const columns: Column[] = useMemo(
    () => [
      { key: 'id', header: 'ID', width: '100px' },
      { key: 'name', header: 'Promotion', sortable: true },
      { key: 'type', header: 'Type', sortable: true },
      {
        key: 'discountPercent',
        header: 'Discount',
        align: 'right',
        render: (v) => formatPercent(v as number, 0),
      },
      { key: 'cost', header: 'Cost', align: 'right', render: (v) => fmt.currency0(v as number) },
      {
        key: 'revenue',
        header: 'Revenue',
        align: 'right',
        render: (v) => fmt.currency0(v as number),
      },
      {
        key: 'baselineRevenue',
        header: 'Baseline',
        align: 'right',
        render: (v) => fmt.currency0(v as number),
      },
      {
        key: 'liftPercent',
        header: 'Lift',
        align: 'right',
        render: (v) => {
          const lift = v as number | null;
          if (lift === null) return <span className="text-[var(--text-muted)]">—</span>;
          // A lift can be negative; the old table hardcoded a leading '+'.
          return (
            <span className={lift >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatPercent(lift, 0)}
            </span>
          );
        },
      },
      {
        key: 'roiPercent',
        header: 'Return on Spend',
        align: 'right',
        render: (v, row) => {
          const roi = v as number | null;
          if (roi === null) return <span className="text-[var(--text-muted)]">—</span>;
          return (
            <span
              className={roi >= 0 ? 'text-green-400' : 'text-red-400'}
              title={
                row.roiBasis === 'gross-margin'
                  ? 'Incremental gross margin less spend, over spend.'
                  : 'Incremental REVENUE less spend, over spend — not profit.'
              }
            >
              {formatPercent(roi, 0)}
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (v) => {
          const status = v as string;
          const colors = {
            completed: 'text-green-400',
            active: 'text-blue-400',
            planned: 'text-yellow-400',
          };
          return (
            <span
              className={(colors as Record<string, string>)[status] || 'text-[var(--text-muted)]'}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          );
        },
      },
    ],
    [fmt]
  );

  const handleExportPDF = () => {
    if (!analysis) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Promotion', 'Type', 'Cost', 'Revenue', 'Baseline', 'Return on Spend'],
        rows: analysis.promotions.map((p) => [
          p.name,
          p.type,
          fmt.currency0(p.cost),
          fmt.currency0(p.revenue),
          fmt.currency0(p.baselineRevenue),
          formatPercent(p.roiPercent, 0),
        ]),
      },
      { title: 'Promotion Analysis' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (!analysis) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['ID', 'Name', 'Type', 'Discount', 'Cost', 'Revenue', 'Baseline', 'Status'],
        rows: analysis.promotions.map((p) => [
          p.id,
          p.name,
          p.type,
          p.discountPercent,
          p.cost,
          p.revenue,
          p.baselineRevenue,
          p.status,
        ]),
      },
      { title: 'Promotion_Analysis' }
    ).catch(reportExportFailure);
  };

  if (!analysis) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <Tag className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Promotions Recorded</h2>
        <p className="text-[var(--text-muted)]">
          Record a campaign — spend, revenue in the promotion window and the baseline you would have
          expected — to see lift and return on spend. The general ledger records revenue by account
          and period, not by campaign, so this workspace will not attribute one for you.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Promotion Analysis"
        purpose="Promotional performance and ROI tracking"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleExportPDF}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExportExcel}>
              <TableIcon className="h-3.5 w-3.5 mr-1.5" />
              Excel
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        <KPIValue label="Total Promo Spend" value={fmt.currency0(analysis.totalCost)} />
        <KPIValue
          label="Incremental Revenue"
          value={fmt.currency0(analysis.incrementalRevenue)}
          trend={analysis.incrementalRevenue >= 0 ? 'up' : 'down'}
        />
        <KPIValue
          label={
            analysis.roiBasis === 'gross-margin'
              ? 'Return on Spend (margin)'
              : 'Return on Spend (revenue basis)'
          }
          value={formatPercent(analysis.roiPercent, 0)}
          changeLabel={`${analysis.marginCoverage} of ${analysis.promotions.length} campaigns record a margin`}
          trend={analysis.roiPercent !== null && analysis.roiPercent >= 0 ? 'up' : 'down'}
        />
        <KPIValue
          label="Lift vs Baseline"
          value={formatPercent(analysis.liftPercent, 0)}
          trend={analysis.liftPercent !== null && analysis.liftPercent >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Before vs After</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={beforeAfterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(v) => fmt.compact(Number(v))} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: unknown) => fmt.currency0(Number(v))}
                />
                <Legend />
                <Bar dataKey="before" fill="#64748b" name="Baseline" />
                <Bar dataKey="after" fill="#3b82f6" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[...analysis.revenueByType]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analysis.revenueByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  formatter={(v: unknown) => fmt.currency0(Number(v))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost vs Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="cost"
                name="Cost"
                stroke="#94a3b8"
                tickFormatter={(v) => fmt.compact(Number(v))}
              />
              <YAxis
                dataKey="revenue"
                name="Revenue"
                stroke="#94a3b8"
                tickFormatter={(v) => fmt.compact(Number(v))}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                formatter={(v: unknown) => fmt.currency0(Number(v))}
              />
              <Scatter data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Promotion Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={analysis.promotions as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="Promotion performance table"
            ariaLabel="Promotion performance data table for retail promo analysis"
          />
        </CardContent>
      </Card>

      {analysis.unavailable.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>How to read these figures</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {analysis.unavailable.map((u) => (
                <li key={u.label}>
                  <span className="font-semibold">{u.label}</span>
                  <span className="text-[var(--text-muted)]"> — {u.reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
