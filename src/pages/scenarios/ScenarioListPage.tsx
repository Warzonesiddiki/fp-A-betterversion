import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useScenarioStore } from '@/store/scenarioStore';
import { useShallow } from 'zustand/react/shallow';
import { CompetitiveGapsToolbar } from '@/components/competitive/CompetitiveGapsToolbar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { lazy, Suspense } from 'react';
import { Plus, FlaskConical, Lock, Unlock } from 'lucide-react';
import { formatPercent } from '@/utils/financialFormatting';
import type { TreemapDataPoint } from '@/components/charts/TreemapChart';

const TreemapChart = lazy(() =>
  import('@/components/charts/TreemapChart').then((m) => ({ default: m.TreemapChart }))
);

export default function ScenarioListPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Scenario List';
  }, []);

  const { scenarios, isLoading, error, clearError } = useScenarioStore(
    useShallow((s) => ({
      scenarios: s.scenarios,
      isLoading: s.isLoading,
      error: s.error,
      clearError: s.clearError,
    }))
  );
  const setSelectedScenario = useScenarioStore((s) => s.setSelectedScenario);
  const lockScenario = useScenarioStore((s) => s.lockScenario);
  const unlockScenario = useScenarioStore((s) => s.unlockScenario);
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = useMemo(() => {
    let list = scenarios;
    if (typeFilter !== 'all') list = list.filter((s) => s.type === typeFilter);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [scenarios, typeFilter]);

  const treemapData = useMemo<TreemapDataPoint[]>(() => {
    return scenarios.map((s) => ({
      name: s.name,
      size: Math.round(s.probability * 100) || 1,
    }));
  }, [scenarios]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" srLabel="Loading scenarios…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Scenarios failed to load"
        message={error}
        onRetry={() => clearError()}
        retryLabel="Retry"
      />
    );
  }

  if (scenarios.length === 0) {
    return (
      <EmptyState
        title="No Scenarios Yet"
        description="Create scenarios to model different financial outcomes and compare them side by side. Driver-based modeling: 5-7 drivers explain 80% variance."
        icon={<FlaskConical className="h-12 w-12 text-[var(--text-muted)]" />}
        action={
          <Button onClick={() => navigate('/scenarios/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Scenario
          </Button>
        }
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <CompetitiveGapsToolbar activeSheetId="sheet-default" />

      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Scenarios"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            }
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">{scenarios.length} scenarios</p>
        </div>
        <Button onClick={() => navigate('/scenarios/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Scenario
        </Button>
      </div>

      <div className="flex gap-1">
        {['all', 'Base', 'Optimistic', 'Pessimistic', 'Custom'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={
              'px-2.5 py-1.5 rounded text-xs font-medium transition-colors ' +
              (typeFilter === t
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700')
            }
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {treemapData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-medium mb-2">Scenario Probability Distribution</h2>
            <Suspense
              fallback={<div className="h-[200px] animate-pulse bg-[var(--bg-elevated)] rounded" />}
            >
              <TreemapChart
                data={treemapData}
                height={200}
                ariaLabel="Scenario probability treemap"
              />
            </Suspense>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div
            className="col-span-full text-center py-8 text-[var(--text-muted)]"
            role="status"
            aria-live="polite"
          >
            No scenarios match the filter.
          </div>
        ) : (
          filtered.map((s) => (
            <Card
              key={s.id}
              className="cursor-pointer hover:border-blue-500/50 transition-all"
              onClick={() => {
                setSelectedScenario(s.id);
                navigate('/scenarios/' + s.id);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{s.name}</h3>
                  <div className="flex items-center gap-1">
                    <Badge variant={s.isActive ? 'default' : 'outline'} className="text-[10px]">
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.isLocked) unlockScenario(s.id);
                        else lockScenario(s.id);
                      }}
                      title={s.isLocked ? 'Unlock scenario' : 'Lock scenario'}
                      aria-label={s.isLocked ? `Unlock ${s.name}` : `Lock ${s.name}`}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400"
                    >
                      {s.isLocked ? (
                        <Lock className="h-3.5 w-3.5 text-amber-700" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2">
                  {s.description}
                </p>
                <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                  <Badge variant="secondary" className="text-[10px]">
                    {s.type}
                  </Badge>
                  <span>{formatPercent(s.probability * 100, 0)} probability</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
