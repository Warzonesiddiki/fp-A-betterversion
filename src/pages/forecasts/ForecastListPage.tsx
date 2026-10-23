import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { activateOnKey } from '@/utils/a11yActivate';
import { PageHeader } from '@/components/ui/PageHeader';
import { reportingCurrency } from '@/store/financialContextStore';
import { currencyFormatter } from '@/utils/financialFormatting';
import { toDecimal } from '@/utils/money';

import { useNavigate, useLocation } from 'react-router-dom';
import { useForecastStore } from '@/store/forecastStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import type { HeatmapDataPoint } from '@/components/charts/HeatmapChart';
import { Plus, Eye, TrendingUp } from 'lucide-react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';

const HeatmapChart = lazy(() =>
  import('@/components/charts/HeatmapChart').then((m) => ({ default: m.HeatmapChart }))
);
// CHRONOS 2026-06-15: replaced local formatRelativeTime (BUG-CHR-D-1) with
// canonical import. Uses default 7-day cap, "Just now" capitalization.
import { formatRelativeTimeLegacy as formatRelativeTime } from '@/engines/temporal';

function _formatCurrency(n: number): string {
  return currencyFormatter(reportingCurrency(), { decimals: 0 })(n);
}

export default function ForecastListPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Forecast List';
  }, []);

  const { forecasts, isLoading, error, clearError } = useForecastStore(
    useShallow((s) => ({
      forecasts: s.forecasts,
      isLoading: s.isLoading,
      error: s.error,
      clearError: s.clearError,
    }))
  );
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [search, _setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = forecasts;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [forecasts, search]);

  const heatmapData = useMemo<HeatmapDataPoint[]>(() => {
    return forecasts.slice(0, 12).map((f) => {
      // Confidence level is a percentage, not money, but parse through decimal.js
      // for consistent numeric handling (avoids float parsing drift).
      const parsed = (() => {
        try {
          return Number(toDecimal(f.confidenceLevel || '50'));
        } catch {
          return 50;
        }
      })();
      return {
        x: f.type || 'Unknown',
        y: f.name.slice(0, 15),
        value: parsed,
      };
    });
  }, [forecasts]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" srLabel="Loading forecasts…" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Forecasts failed to load"
        message={error}
        onRetry={() => clearError()}
        retryLabel="Retry"
      />
    );
  }

  if (forecasts.length === 0) {
    return (
      <EmptyState
        title="No Forecasts Yet"
        description="Create a forecast to predict future financial performance based on your data. Rolling forecast: 12-18 month horizon, 5-day cycle, driver-based."
        icon={<TrendingUp className="h-12 w-12 text-[var(--text-muted)]" />}
        action={
          <Button onClick={() => navigate('/forecasts/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Forecast
          </Button>
        }
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Forecasts"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            }
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">{forecasts.length} forecasts</p>
        </div>
        <Button onClick={() => navigate('/forecasts/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Forecast
        </Button>
      </div>

      <AICopilotPanel pathname={pathname} defaultCollapsed />

      {heatmapData.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Forecast Confidence Heatmap</h3>
            <Suspense
              fallback={<div className="h-[200px] animate-pulse bg-[var(--bg-elevated)] rounded" />}
            >
              <HeatmapChart
                data={heatmapData}
                cellSize={50}
                ariaLabel="Forecast confidence heatmap"
              />
            </Suspense>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Forecast scenarios list">
              <caption className="sr-only">
                Forecast scenarios showing name, type, horizon, base scenario, and status
              </caption>
              <thead>
                <tr className="text-left text-[var(--text-muted)] text-xs uppercase border-b border-slate-800">
                  <th scope="col" className="px-4 py-3">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Type
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 w-24">
                    Confidence
                  </th>
                  <th scope="col" className="px-4 py-3 w-24">
                    Updated
                  </th>
                  <th scope="col" className="px-4 py-3 w-20">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">
                      <span role="status" aria-live="polite">
                        No forecasts match your search.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-900/50 cursor-pointer"
                      onClick={() => navigate('/forecasts/' + f.id)}
                      onKeyDown={activateOnKey(() => navigate('/forecasts/' + f.id))}
                      tabIndex={0}
                    >
                      <td className="px-4 py-3 font-medium">{f.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{f.type}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            f.status === 'Completed'
                              ? 'default'
                              : f.status === 'InProgress'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="text-[10px]"
                        >
                          {f.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{f.confidenceLevel}</td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {formatRelativeTime(f.lastUpdated || f.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/forecasts/' + f.id);
                          }}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                          aria-label="View forecast"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
