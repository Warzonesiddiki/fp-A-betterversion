/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Leaf, Users, Shield, FileText, Table as TableIcon } from 'lucide-react';
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
} from 'recharts';

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const mockESG = {
  environmental: [
    { metric: 'Scope 1 Emissions', unit: 'tCO2e', current: 12400, target: 10000, trend: -8 },
    { metric: 'Scope 2 Emissions', unit: 'tCO2e', current: 8200, target: 6500, trend: -12 },
    { metric: 'Energy Consumption', unit: 'MWh', current: 45000, target: 40000, trend: -5 },
    { metric: 'Water Usage', unit: 'm3', current: 125000, target: 110000, trend: -3 },
    { metric: 'Waste Recycled', unit: '%', current: 72, target: 85, trend: 4 },
  ],
  social: [
    { metric: 'Total Employees', unit: 'headcount', current: 2840, target: 3000, trend: 6 },
    { metric: 'Gender Diversity', unit: '%', current: 42, target: 50, trend: 3 },
    { metric: 'Training Hours', unit: 'hours/employee', current: 32, target: 40, trend: 8 },
    { metric: 'Safety Incidents', unit: 'count', current: 4, target: 0, trend: -25 },
    { metric: 'Employee Satisfaction', unit: '/10', current: 7.8, target: 8.5, trend: 5 },
  ],
  governance: [
    { metric: 'Board Independence', unit: '%', current: 67, target: 75, trend: 0 },
    { metric: 'Ethics Training', unit: '%', current: 98, target: 100, trend: 2 },
    { metric: 'Data Breaches', unit: 'count', current: 0, target: 0, trend: 0 },
    { metric: 'Supplier Audits', unit: '%', current: 85, target: 100, trend: 10 },
  ],
};

const trendData = [
  { year: '2022', scope1: 15200, scope2: 10800, energy: 52000 },
  { year: '2023', scope1: 14100, scope2: 9600, energy: 49000 },
  { year: '2024', scope1: 13200, scope2: 8800, energy: 47000 },
  { year: '2025', scope1: 12400, scope2: 8200, energy: 45000 },
];

const pieData = [
  { name: 'Environmental', value: 35 },
  { name: 'Social', value: 40 },
  { name: 'Governance', value: 25 },
];

export default function CSRDReportPage() {
  const { entries } = useGLStore();
  const _navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'env' | 'social' | 'gov'>('env');

  useEffect(() => {
    document.title = 'FinPlan Pro — CSRD Report';
  }, []);

  const columns: Column[] = useMemo(
    () => [
      { key: 'metric', header: 'Metric', sortable: true },
      { key: 'unit', header: 'Unit', width: '100px' },
      {
        key: 'current',
        header: 'Current',
        align: 'right',
        render: (v) => formatNumber(v as number),
      },
      { key: 'target', header: 'Target', align: 'right', render: (v) => formatNumber(v as number) },
      {
        key: 'trend',
        header: 'Trend',
        align: 'right',
        render: (v) => {
          const val = v as number;
          return (
            <span
              className={val > 0 ? 'text-green-400' : val < 0 ? 'text-red-400' : 'text-slate-400'}
            >
              {val > 0 ? '+' : ''}
              {val}%
            </span>
          );
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (_v, row) => {
          const current = row.current as number;
          const target = row.target as number;
          const pct = target > 0 ? (current / target) * 100 : 100;
          const color =
            pct >= 90 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400';
          return (
            <span className={color}>
              {pct >= 90 ? 'On Track' : pct >= 70 ? 'In Progress' : 'Behind'}
            </span>
          );
        },
      },
    ],
    []
  );

  const activeData =
    activeTab === 'env'
      ? mockESG.environmental
      : activeTab === 'social'
        ? mockESG.social
        : mockESG.governance;

  const handleExportPDF = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['Metric', 'Unit', 'Current', 'Target', 'Trend'],
        rows: activeData.map((d) => [d.metric, d.unit, d.current, d.target, `${d.trend}%`]),
      },
      { title: 'CSRD Sustainability Report', subtitle: activeTab.toUpperCase() }
    );
  };

  const handleExportExcel = () => {
    ExportEngine.exportToExcel(
      {
        headers: ['Metric', 'Unit', 'Current', 'Target', 'Trend'],
        rows: activeData.map((d) => [d.metric, d.unit, d.current, d.target, d.trend]),
      },
      { title: 'CSRD_Sustainability_Report' }
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">CSRD Sustainability Report</h1>
          <p className="text-sm text-slate-400 mt-1">
            Corporate Sustainability Reporting Directive
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KPIValue label="Environmental Score" value="78/100" change={5} trend="up" />
        <KPIValue label="Social Score" value="82/100" change={8} trend="up" />
        <KPIValue label="Governance Score" value="85/100" change={2} trend="up" />
      </div>

      <div className="flex gap-2">
        {(
          [
            ['env', 'Environmental', Leaf],
            ['social', 'Social', Users],
            ['gov', 'Governance', Shield],
          ] as const
        ).map(([key, label, Icon]) => (
          <Button
            key={key}
            size="sm"
            variant={activeTab === key ? 'default' : 'ghost'}
            onClick={() => setActiveTab(key as typeof activeTab)}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Emissions Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="scope1" fill="#ef4444" name="Scope 1" />
                <Bar dataKey="scope2" fill="#f59e0b" name="Scope 2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reporting Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'env'
              ? 'Environmental'
              : activeTab === 'social'
                ? 'Social'
                : 'Governance'}{' '}
            Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={activeData as unknown as Record<string, unknown>[]}
            pageSize={10}
            caption="ESRS metrics table"
            ariaLabel="ESRS metrics data table for CSRD sustainability report"
          />
        </CardContent>
      </Card>
    </div>
  );
}
