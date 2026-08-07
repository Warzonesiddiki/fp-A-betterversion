import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useCapExStore } from '@/store/capexStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { HelpPanel } from '@/components/ui/HelpPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatCompactNumber } from '@/utils/formatters';
import { roundTo, subtractMoney, sumMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { Truck, DollarSign, Layers, TrendingUp, HelpCircle, Plus } from 'lucide-react';

/**
 * GAP-1 (F-0006) — exact-decimal CapEx page totals.
 *
 * The KPI cards (Total Budget, Total Actual, Net Asset Value) and per-row
 * variance were raw float reduce / subtraction. Budget/actual/cost/NBV are
 * currency. IRR/payback/useful-life are metrics and stay float.
 */
export interface CapExProjectLike {
  budget: number;
  actual: number;
}
export interface CapExAssetLike {
  cost: number;
  nbv: number;
}
export function sumProjectBudgets(projects: readonly CapExProjectLike[]): number {
  return roundTo(sumMoney(projects.map((p) => p.budget)));
}
export function sumProjectActuals(projects: readonly CapExProjectLike[]): number {
  return roundTo(sumMoney(projects.map((p) => p.actual)));
}
export function projectVariance(p: CapExProjectLike): number {
  return roundTo(subtractMoney(p.budget, p.actual));
}
export function sumAssetCosts(assets: readonly CapExAssetLike[]): number {
  return roundTo(sumMoney(assets.map((a) => a.cost)));
}
export function sumAssetNBV(assets: readonly CapExAssetLike[]): number {
  return roundTo(sumMoney(assets.map((a) => a.nbv)));
}

const HELP_SECTIONS = [
  {
    title: 'What is CapEx Tracking?',
    content:
      'Capital Expenditure (CapEx) tracking monitors your long-term asset investments — purchases of property, equipment, and other major assets that provide value over multiple years.',
  },
  {
    title: 'Projects vs Assets',
    content:
      'Projects represent planned or in-progress capital initiatives with budgets. Assets are capitalized items with depreciation schedules tracking value over their useful life.',
  },
  {
    title: 'Depreciation Schedule',
    content:
      'Each asset is depreciated over its useful life. The schedule shows beginning book value, annual depreciation expense, and ending book value for each year.',
  },
  {
    title: 'Status Meanings',
    content:
      'Planned = budgeted but not started. In Progress = actively being deployed. Completed = operational and depreciating. Cancelled = abandoned.',
  },
];

const statusColors: Record<string, string> = {
  planned: 'bg-slate-600 text-slate-200',
  'in-progress': 'bg-blue-600 text-blue-200',
  completed: 'bg-green-600 text-green-200',
  cancelled: 'bg-red-600 text-red-200',
};

const projectColumns: Column[] = [
  { key: 'name', header: 'Project Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'budget', header: 'Budget', align: 'right', sortable: true },
  { key: 'actual', header: 'Actual', align: 'right', sortable: true },
  { key: 'variance', header: 'Variance', align: 'right', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'paybackPeriod', header: 'Payback (yrs)', align: 'right', sortable: true },
  { key: 'irr', header: 'IRR', align: 'right', sortable: true },
];

const assetColumns: Column[] = [
  { key: 'name', header: 'Asset Name', sortable: true },
  { key: 'category', header: 'Category', sortable: true },
  { key: 'cost', header: 'Cost', align: 'right', sortable: true },
  { key: 'nbv', header: 'Net Book Value', align: 'right', sortable: true },
  { key: 'annualDep', header: 'Annual Depreciation', align: 'right', sortable: true },
  { key: 'usefulLife', header: 'Useful Life (yrs)', align: 'right', sortable: true },
  { key: 'acquisitionDate', header: 'Acquired', sortable: true },
];

const depColumns: Column[] = [
  { key: 'year', header: 'Year', align: 'right', sortable: true },
  { key: 'assetName', header: 'Asset', sortable: true },
  { key: 'beginningValue', header: 'Beginning Value', align: 'right', sortable: true },
  { key: 'depreciation', header: 'Depreciation', align: 'right', sortable: true },
  { key: 'endingValue', header: 'Ending Value', align: 'right', sortable: true },
];

export function CapexTracker() {
  const [helpOpen, setHelpOpen] = useState(false);
  const { entries, isLoading: glLoading } = useGLStore();
  const { projects, assets, depreciationSchedule, isLoading: storeLoading } = useCapExStore();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'FinPlan Pro — CapEx Tracker';
  }, []);

  const totalBudget = useMemo(() => sumProjectBudgets(projects), [projects]);
  const totalActual = useMemo(() => sumProjectActuals(projects), [projects]);
  const activeProjects = useMemo(
    () => projects.filter((p) => p.status !== 'cancelled'),
    [projects]
  );
  const _totalAssetCost = useMemo(() => sumAssetCosts(assets), [assets]);
  const totalNBV = useMemo(() => sumAssetNBV(assets), [assets]);

  const projectData = useMemo(
    () =>
      projects.map((p) => ({
        name: p.name,
        category: p.category,
        budget: formatCurrency(p.budget),
        actual: formatCurrency(p.actual),
        variance: formatCurrency(projectVariance(p)),
        status: (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-slate-600'}`}
          >
            {p.status}
          </span>
        ),
        paybackPeriod: p.paybackPeriod > 0 ? formatPercent(p.paybackPeriod) : '-',
        irr: p.irr > 0 ? formatPercent(p.irr) : '-',
      })),
    [projects]
  );

  const assetData = useMemo(
    () =>
      assets.map((a) => ({
        name: a.name,
        category: a.category,
        cost: formatCurrency(a.cost),
        nbv: formatCurrency(a.nbv),
        annualDep: formatCurrency(a.annualDep),
        usefulLife: a.usefulLife,
        acquisitionDate: a.acquisitionDate,
      })),
    [assets]
  );

  const depData = useMemo(
    () =>
      depreciationSchedule.map((d) => ({
        year: d.year,
        assetName: d.assetName,
        beginningValue: formatCurrency(d.beginningValue),
        depreciation: formatCurrency(d.depreciation),
        endingValue: formatCurrency(d.endingValue),
      })),
    [depreciationSchedule]
  );

  if (glLoading || storeLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton count={1} height="40px" width="30%" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} count={1} height="80px" variant="rectangular" />
          ))}
        </div>
        <Skeleton count={4} variant="rectangular" height="48px" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center" role="main" aria-label="CapEx Tracker - No Data">
        <Truck className="h-10 w-10 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No CapEx Data</h2>
        <p className="text-slate-400 mb-6">Import GL data to view CapEx tracker.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </main>
    );
  }

  return (
    <main
      className="p-6 space-y-6 animate-fade-in"
      role="main"
      aria-label="CapEx Tracker Dashboard"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">CapEx Tracker</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {projects.length} projects &middot; {assets.length} assets &middot;{' '}
            {entries.length.toLocaleString()} GL entries
          </p>
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="CapEx KPIs">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <DollarSign className="h-4 w-4" />
              Total Budget
            </div>
            <div className="text-xl font-bold">{formatCompactNumber(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Actual
            </div>
            <div className="text-xl font-bold">{formatCompactNumber(totalActual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Layers className="h-4 w-4" />
              Active Projects
            </div>
            <div className="text-xl font-bold">{activeProjects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Truck className="h-4 w-4" />
              Net Asset Value
            </div>
            <div className="text-xl font-bold">{formatCompactNumber(totalNBV)}</div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Capital Projects</CardTitle>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projectData.length > 0 ? (
            <DataTable
              columns={projectColumns}
              data={projectData}
              sortable
              caption="Capital projects tracker table"
              ariaLabel="Capital projects tracker"
            />
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              No capital projects yet. Add a project to start tracking.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fixed Assets</CardTitle>
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assetData.length > 0 ? (
            <DataTable
              columns={assetColumns}
              data={assetData}
              sortable
              caption="Fixed assets table"
              ariaLabel="Fixed assets"
            />
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No fixed assets recorded.</p>
          )}
        </CardContent>
      </Card>

      {depreciationSchedule.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Depreciation Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={depColumns}
              data={depData}
              sortable
              caption="Depreciation schedule table"
              ariaLabel="Depreciation schedule"
            />
          </CardContent>
        </Card>
      )}

      <HelpPanel
        title="CapEx Tracker Help"
        sections={HELP_SECTIONS}
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </main>
  );
}

export default CapexTracker;
