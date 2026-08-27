import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ChartArea, FileText, Table as TableIcon } from 'lucide-react';
import { ExportEngine } from '@/engines/ExportEngine';
import { ManufacturingEngine, type ProductionLine } from '@/engines/ManufacturingEngine';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

export default function ProductionDashboardPage() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — Production Dashboard';
  }, []);

  // All figures below are measured from posted GL data via the engine.
  const stats = useMemo(() => ManufacturingEngine.calculateStats(entries), [entries]);
  const trend = useMemo(() => ManufacturingEngine.getMonthlyTrend(entries), [entries]);

  // Production-line identity comes from GL department tags (config/master
  // data). Without tags there is no line-level attribution, so the table
  // discloses its absence instead of rendering invented rows.
  const lineConfigs = useMemo(() => {
    const departments = new Set<string>();
    for (const e of entries) {
      const dept = e.department?.trim();
      if (dept) departments.add(dept);
    }
    return [...departments].sort().map((name) => ({ name }));
  }, [entries]);

  const lines = useMemo(
    () => ManufacturingEngine.getProductionLines(entries, lineConfigs),
    [entries, lineConfigs]
  );

  const handleExportPDF = () => {
    if (lines.length === 0) return;
    void ExportEngine.exportToPDF(
      {
        headers: ['Line', 'Allocated Cost'],
        rows: lines.map((l) => [l.line, fmt.currency0(l.costShare)]),
      },
      { title: 'Production Dashboard Report', companyName: 'FinPlan Pro' }
    ).catch(reportExportFailure);
  };

  const handleExportExcel = () => {
    if (lines.length === 0) return;
    void ExportEngine.exportToExcel(
      {
        headers: ['Line', 'Allocated Cost'],
        rows: lines.map((l) => [l.line, fmt.currency0(l.costShare)]),
      },
      { title: 'Production_Dashboard_Report' }
    ).catch(reportExportFailure);
  };

  const columns: Column<ProductionLine>[] = [
    { key: 'line', header: 'Production Line', sortable: true },
    {
      key: 'costShare',
      header: 'Allocated Cost',
      align: 'right',
      render: (_, r) => fmt.currency0(r.costShare),
      sortable: true,
    },
  ];

  if (entries.length === 0)
    return (
      <main className="p-12 text-center" role="main" aria-label="Production Dashboard - No Data">
        <ChartArea className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-xl font-semibold mb-2">No Production Data</h1>
        <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
          Import general ledger data with production and cost-of-goods accounts to see output, yield
          and variance.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="Production Dashboard"
        actions={
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
        }
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIValue label="Revenue" value={fmt.currency0(stats.revenue)} />
        <KPIValue label="COGS" value={fmt.currency0(stats.cogs)} />
        <KPIValue label="Gross Margin" value={`${formatPercent(stats.grossMargin, 1)}`} />
        <KPIValue label="Material Cost" value={fmt.currency0(stats.materialCost)} />
      </div>
      {trend.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Production Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="productionCost"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    name="Production Cost"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16A34A"
                    strokeWidth={2}
                    name="Revenue"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
      {lines.length > 0 ? (
        <DataTable
          columns={columns}
          data={lines}
          caption="Production line cost allocation"
          ariaLabel="Production line cost allocation table"
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium mb-2">No production line configuration</p>
            <p className="text-[var(--text-muted)] max-w-md mx-auto">
              Tag GL entries with a department to derive per-line production cost allocation.
              Efficiency, downtime and defect metrics require line-level telemetry and are not
              inferred from ledger data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
