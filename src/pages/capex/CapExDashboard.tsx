/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import {
  Download,
  Building2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ExportEngine } from '@/engines/ExportEngine';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface CapExProject {
  id: string;
  name: string;
  category: string;
  budget: number;
  actual: number;
  variance: number;
  status: 'Approved' | 'In Progress' | 'Pending' | 'Completed';
  approvalDate: string;
  completionDate: string;
}

const mockProjects: CapExProject[] = [
  {
    id: 'CE001',
    name: 'Server Room Expansion',
    category: 'IT Infrastructure',
    budget: 500000,
    actual: 485000,
    variance: 15000,
    status: 'Completed',
    approvalDate: '2026-01-15',
    completionDate: '2026-04-30',
  },
  {
    id: 'CE002',
    name: 'Manufacturing Line B',
    category: 'Equipment',
    budget: 1200000,
    actual: 980000,
    variance: 220000,
    status: 'In Progress',
    approvalDate: '2026-02-01',
    completionDate: '2026-08-31',
  },
  {
    id: 'CE003',
    name: 'Office Renovation - 3rd Floor',
    category: 'Building',
    budget: 350000,
    actual: 320000,
    variance: 30000,
    status: 'Completed',
    approvalDate: '2025-11-01',
    completionDate: '2026-03-15',
  },
  {
    id: 'CE004',
    name: 'Fleet Vehicle Replacement',
    category: 'Vehicles',
    budget: 280000,
    actual: 0,
    variance: 280000,
    status: 'Pending',
    approvalDate: '',
    completionDate: '',
  },
  {
    id: 'CE005',
    name: 'Warehouse Automation',
    category: 'Equipment',
    budget: 800000,
    actual: 450000,
    variance: 350000,
    status: 'In Progress',
    approvalDate: '2026-03-01',
    completionDate: '2026-09-30',
  },
  {
    id: 'CE006',
    name: 'Data Center UPS Upgrade',
    category: 'IT Infrastructure',
    budget: 180000,
    actual: 175000,
    variance: 5000,
    status: 'Completed',
    approvalDate: '2026-01-10',
    completionDate: '2026-02-28',
  },
  {
    id: 'CE007',
    name: 'Lab Equipment Refresh',
    category: 'Equipment',
    budget: 420000,
    actual: 0,
    variance: 420000,
    status: 'Pending',
    approvalDate: '',
    completionDate: '',
  },
];

const categoryData = [
  { name: 'IT Infrastructure', budget: 680000, actual: 660000 },
  { name: 'Equipment', budget: 2420000, actual: 1430000 },
  { name: 'Building', budget: 350000, actual: 320000 },
  { name: 'Vehicles', budget: 280000, actual: 0 },
];

const _COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function CapExDashboard() {
  const { entries } = useGLStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro - Capital Expenditures';
  }, []);

  const _glCapex = useMemo(() => {
    if (entries.length === 0) return 0;
    return entries
      .filter((e) => (e.accountCode || '').startsWith('1'))
      .reduce((s, e) => s + Math.abs(e.debit - e.credit), 0);
  }, [entries]);

  const totalBudget = mockProjects.reduce((s, p) => s + p.budget, 0);
  const totalActual = mockProjects.reduce((s, p) => s + p.actual, 0);
  const totalVariance = totalBudget - totalActual;
  const ytdSpend = totalActual;
  const budgetUtilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const pendingCount = mockProjects.filter((p) => p.status === 'Pending').length;
  const inProgressCount = mockProjects.filter((p) => p.status === 'In Progress').length;
  const completedCount = mockProjects.filter((p) => p.status === 'Completed').length;

  const projectColumns: Column<CapExProject>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Project', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'budget', header: 'Budget', render: (r) => formatCurrency(r.budget), sortable: true },
    { key: 'actual', header: 'Actual', render: (r) => formatCurrency(r.actual), sortable: true },
    {
      key: 'variance',
      header: 'Variance',
      render: (r) => {
        const v = r.budget - r.actual;
        return (
          <span className={v >= 0 ? 'text-green-400' : 'text-red-400'}>{formatCurrency(v)}</span>
        );
      },
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const colors = {
          Approved: 'bg-blue-900/50 text-blue-400',
          'In Progress': 'bg-yellow-900/50 text-yellow-400',
          Pending: 'bg-slate-700 text-slate-400',
          Completed: 'bg-green-900/50 text-green-400',
        };
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${colors[r.status as keyof typeof colors] ?? 'bg-slate-700 text-slate-400'}`}
          >
            {r.status}
          </span>
        );
      },
    },
    { key: 'completionDate', header: 'Completion', render: (r) => r.completionDate || '-' },
  ];

  const handleExport = () => {
    ExportEngine.exportToPDF(
      {
        headers: ['ID', 'Project', 'Category', 'Budget', 'Actual', 'Variance', 'Status'],
        rows: mockProjects.map((p) => [
          p.id,
          p.name,
          p.category,
          p.budget,
          p.actual,
          p.budget - p.actual,
          p.status,
        ]),
      },
      { title: 'Capital Expenditures Report' }
    );
  };

  const hasData = entries.length > 0 || mockProjects.length > 0;

  if (!hasData) {
    return (
      <div className="p-12 text-center">
        <Building2 className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No CapEx Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to track capital expenditures.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Capital Expenditures</h1>
          <p className="text-sm text-slate-400">
            {mockProjects.length} projects | {entries.length.toLocaleString()} GL entries
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPIValue
          label="Total Budget"
          value={formatCurrency(totalBudget)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="YTD Spend"
          value={formatCurrency(ytdSpend)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Budget Utilization"
          value={`${budgetUtilization.toFixed(1)}%`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <KPIValue
          label="Variance"
          value={formatCurrency(totalVariance)}
          icon={<DollarSign className="h-4 w-4" />}
          status={totalVariance >= 0 ? 'good' : 'warning'}
        />
        <KPIValue
          label="Pending Approvals"
          value={String(pendingCount)}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CapEx by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(v: any) => formatCurrency(v)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
                <Legend />
                <Bar dataKey="budget" fill="#3b82f6" name="Budget" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" name="Actual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Completed', value: completedCount },
                    { name: 'In Progress', value: inProgressCount },
                    { name: 'Pending', value: pendingCount },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#94a3b8" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approval Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockProjects
                .filter((p) => p.status === 'Pending' || p.status === 'In Progress')
                .map((project) => (
                  <div key={project.id} className="p-3 bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{project.name}</div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === 'Pending'
                            ? 'bg-slate-700 text-slate-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{formatCurrency(project.budget)}</span>
                      <span>|</span>
                      <span>{project.category}</span>
                    </div>
                    {project.status === 'In Progress' && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-yellow-500"
                            style={{ width: `${(project.actual / project.budget) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {((project.actual / project.budget) * 100).toFixed(0)}% spent
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable data={mockProjects} columns={projectColumns} pageSize={8} caption="Capital expenditure projects table" ariaLabel="Capital expenditure projects" />
        </CardContent>
      </Card>
    </div>
  );
}
