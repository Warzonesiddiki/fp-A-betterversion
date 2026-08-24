import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/ui/PageHeader';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  Layers,
  Search,
  Scale,
} from 'lucide-react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';
import { ErrorState } from '@/components/ui/ErrorState';
import { activateOnKey } from '@/utils/a11yActivate';

const reports = [
  {
    name: 'Profit & Loss',
    icon: DollarSign,
    path: '/reports/profit-loss',
    desc: 'Revenue, expenses, and net income statement',
    category: 'Financial',
  },
  {
    name: 'Balance Sheet',
    icon: Layers,
    path: '/reports/balance-sheet',
    desc: 'Assets, liabilities, and equity position',
    category: 'Financial',
  },
  {
    name: 'Cash Flow',
    icon: TrendingUp,
    path: '/reports/cash-flow',
    desc: 'Operating, investing, and financing activities',
    category: 'Financial',
  },
  {
    name: 'Three-Statement Model',
    icon: Scale,
    path: '/reports/three-statement',
    desc: 'Integrated P&L, Balance Sheet, and Cash Flow with auto-linking',
    category: 'Financial',
  },
  {
    name: 'Budget vs Actual',
    icon: BarChart3,
    path: '/reports/budget-vs-actual',
    desc: 'Compare budgeted amounts to actual performance',
    category: 'Variance',
  },
  {
    name: 'Board Pack',
    icon: FileText,
    path: '/reports/board-pack',
    desc: 'Executive summary for board presentations',
    category: 'Executive',
  },
];

export default function ReportsListPage() {
  const { entries, importError } = useGLStore(
    useShallow((s) => ({ entries: s.entries, importError: s.importError }))
  );
  // K30 loading-state review: no async skeleton here by design — `entries`
  // is a synchronous read from the persisted Zustand GL store and the report
  // catalog above is static, so there is no pending state to represent.
  // The empty-state branch below covers "no data yet"; a skeleton would be
  // a fake loading indicator.
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    document.title = 'FinPlan Pro — Reports';
  }, []);

  const filtered = useMemo(() => {
    if (!search) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q)
    );
  }, [search]);

  const categories = useMemo(() => {
    const cats = new Map<string, typeof reports>();
    filtered.forEach((r) => {
      if (!cats.has(r.category)) cats.set(r.category, []);
      cats.get(r.category)!.push(r);
    });
    return cats;
  }, [filtered]);

  if (importError) {
    return (
      <ErrorState
        title="Failed to load data"
        message={importError}
        errorCode="GL-IMPORT-ERROR"
        onRetry={() => window.location.reload()}
        secondaryAction={{ label: 'Go to Data Import', onClick: () => navigate('/data') }}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-[var(--bg-elevated)] rounded-full inline-block mb-4">
          <FileText className="h-10 w-10 text-[var(--text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
        <p className="text-[var(--text-muted)] mb-6">Import GL data to generate financial reports.</p>
        <Button onClick={() => navigate('/data/gl-upload')}>Import Data</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
  title="Reports"
  purpose={<>{entries.length.toLocaleString()}GL entries available
          </>}
  actions={<div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm w-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              aria-label="Search reports"
            />
          </div>
        </div>}
/>

      <AICopilotPanel pathname={pathname} defaultCollapsed />

      {[...categories.entries()].map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
            {category}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((r) => (
              <Card
                key={r.name}
                role="button"
                tabIndex={0}
                aria-label={`Open ${r.name} report`}
                className="cursor-pointer hover:border-blue-500/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2"
                onClick={() => navigate(r.path)}
                onKeyDown={activateOnKey<HTMLDivElement>(() => navigate(r.path))}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg shrink-0">
                    <r.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{r.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{r.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[var(--text-muted)]" role="status" aria-live="polite">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
          <p>No reports match &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
