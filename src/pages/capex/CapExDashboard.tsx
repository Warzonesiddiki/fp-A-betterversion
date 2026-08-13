import { useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useCapExStore } from '@/store/capexStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Download, Building2, DollarSign, TrendingUp, Clock, Plus } from 'lucide-react';
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
import { reportExportFailure } from '@/utils/exportErrorHandler';
import { addMoney, sumMoney, subtractMoney, divideMoney, roundTo } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';
interface CapExProject {
  id: string;
  name: string;
  category: string;
  budget: number;
  actual: number;
  variance: number;
  status: 'Approved' | 'In Progress' | 'Pending' | 'Completed' | 'Cancelled';
  approvalDate: string;
  completionDate: string;
}

// WIRED (C-3): projects come from the real capexStore (persisted, RBAC-gated);
// statuses are adapted from the store's canonical status set. categoryData is
// derived from the wired projects with money-exact sums — no fabricated chart
// figures. The page keeps its honest empty state when no GL data is imported.
const STORE_STATUS_MAP: Record<string, CapExProject['status']> = {
  planned: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const _COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export interface CapExProjectLike {
  budget: number;
  actual: number;
}

/** Money-primitive CapEx totals (GAP-1 F-0006).
 *  totalBudget/totalActual were raw reduce `+`; totalVariance was
 *  a − b. Routing through sumMoney/subtractMoney+roundTo keeps the
 *  dashboard totals exact to the cent. */
export interface CapExTotals {
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  budgetUtilization: number;
}

export function computeCapExTotals(projects: readonly CapExProjectLike[]): CapExTotals {
  const totalBudget = roundTo(sumMoney(projects.map((p) => p.budget)), 2);
  const totalActual = roundTo(sumMoney(projects.map((p) => p.actual)), 2);
  const totalVariance = roundTo(subtractMoney(totalBudget, totalActual), 2);
  // Use divideMoney so 0.3/0.4*100 lands on 75 exactly (raw 0.3/0.4 = 0.74999…).
  const budgetUtilization =
    totalBudget > 0 ? roundTo(divideMoney(totalActual, totalBudget).times(100), 2) : 0;
  return { totalBudget, totalActual, totalVariance, budgetUtilization };
}

/** Per-project variance (budget − actual) — exact decimal (GAP-1 F-0006). */
export function projectVarianceLike(p: CapExProjectLike): number {
  return roundTo(subtractMoney(p.budget, p.actual), 2);
}

/** Sum of |debit − credit| for GL entries whose account code starts with
 *  the given prefix (CapEx = '1'). Exact decimal (GAP-1 F-0006). */
export function sumGLCapexMovement(
  entries: ReadonlyArray<{ accountCode?: string; debit: number; credit: number }>,
  prefix = '1'
): number {
  if (entries.length === 0) return 0;
  return roundTo(
    sumMoney(
      entries
        .filter((e) => (e.accountCode || '').startsWith(prefix))
        .map((e) => Math.abs(subtractMoney(e.debit, e.credit).toNumber()))
    ),
    2
  );
}

export default function CapExDashboard() {
  const fmt = useCurrencyFormatter();
  const { entries } = useGLStore();
  const storeProjects = useCapExStore((s) => s.projects);
  const navigate = useNavigate();

  // WIRED (C-3): real projects from capexStore; variance computed money-exact.
  const projects: CapExProject[] = storeProjects.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    budget: p.budget,
    actual: p.actual,
    variance: roundTo(subtractMoney(p.budget, p.actual), 2),
    status: STORE_STATUS_MAP[p.status] ?? 'Pending',
    approvalDate: p.startDate,
    completionDate: p.endDate,
  }));

  // categoryData derived from wired projects — exact sums, never fabricated.
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; budget: number; actual: number }>();
    for (const p of projects) {
      const cur = map.get(p.category) ?? { name: p.category, budget: 0, actual: 0 };
      cur.budget = roundTo(addMoney(cur.budget, p.budget), 2);
      cur.actual = roundTo(addMoney(cur.actual, p.actual), 2);
      map.set(p.category, cur);
    }
    return Array.from(map.values());
  }, [projects]);

  useEffect(() => {
    document.title = 'FinPlan Pro - Capital Expenditures';
  }, []);

  const _glCapex = useMemo(() => sumGLCapexMovement(entries), [entries]);

  const { totalBudget, totalActual, totalVariance, budgetUtilization } =
    computeCapExTotals(projects);
  const ytdSpend = totalActual;
  const pendingCount = projects.filter((p) => p.status === 'Pending').length;
  const inProgressCount = projects.filter((p) => p.status === 'In Progress').length;
  const completedCount = projects.filter((p) => p.status === 'Completed').length;

  const projectColumns: Column<CapExProject>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Project', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'budget', header: 'Budget', render: (_, r) => fmt.currency0(r.budget), sortable: true },
    { key: 'actual', header: 'Actual', render: (_, r) => fmt.currency0(r.actual), sortable: true },
    {
      key: 'variance',
      header: 'Variance',
      render: (_, r) => {
        const v = r.budget - r.actual;
        return (
          <span className={v >= 0 ? 'text-green-400' : 'text-red-400'}>{fmt.currency0(v)}</span>
        );
      },
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, r) => {
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
    { key: 'completionDate', header: 'Completion', render: (_, r) => r.completionDate || '-' },
  ];

  const handleExport = () => {
    void ExportEngine.exportToPDF(
      {
        headers: ['ID', 'Project', 'Category', 'Budget', 'Actual', 'Variance', 'Status'],
        rows: projects.map((p) => [
          p.id,
          p.name,
          p.category,
          p.budget,
          p.actual,
          roundTo(subtractMoney(p.budget, p.actual), 2),
          p.status,
        ]),
      },
      { title: 'Capital Expenditures Report' }
    ).catch(reportExportFailure);
  };

  const hasData = entries.length > 0 || projects.length > 0;

  if (!hasData) {
    return (
      <div className="p-12 text-center">
        <Building2 className="h-10 w-10 text-[var(--text-muted)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No CapEx Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Import GL data to track capital expenditures.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Capital Expenditures"
        purpose={
          <>
            {projects.length}projects | {entries.length.toLocaleString()}GL entries
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New Project
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPIValue
          label="Total Budget"
          value={fmt.currency0(totalBudget)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KPIValue
          label="YTD Spend"
          value={fmt.currency0(ytdSpend)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPIValue
          label="Budget Utilization"
          value={formatPercent(budgetUtilization)}
          icon={<Building2 className="h-4 w-4" />}
        />
        <KPIValue
          label="Variance"
          value={fmt.currency0(totalVariance)}
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
                  tickFormatter={(v) => `$${Math.round(v / 100000) / 10}M`}
                />
                <Tooltip
                  formatter={(v) => fmt.currency0(Number(v))}
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
              {projects
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
                      <span>{fmt.currency0(project.budget)}</span>
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
                          {Math.round((project.actual / project.budget) * 100)}% spent
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
          <DataTable
            data={projects}
            columns={projectColumns}
            pageSize={8}
            caption="Capital expenditure projects table"
            ariaLabel="Capital expenditure projects"
          />
        </CardContent>
      </Card>
    </div>
  );
}
