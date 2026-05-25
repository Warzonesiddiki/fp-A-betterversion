import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';
import { useForecastStore } from '@/store/forecastStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { HeatmapChart, HeatmapDataPoint } from '@/components/charts/HeatmapChart';
import { Plus, Eye, TrendingUp } from 'lucide-react';
import { AICopilotPanel } from '@/components/ai/AICopilotPanel';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  if (days < 7) return days + 'd ago';
  return new Date(timestamp).toLocaleDateString();
}

export default function ForecastListPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Forecast List';
  }, []);

  const { forecasts } = useForecastStore();
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
    return forecasts.slice(0, 12).map((f) => ({
      x: f.type || 'Unknown',
      y: f.name.slice(0, 15),
      value: parseFloat(f.confidenceLevel) || 50,
    }));
  }, [forecasts]);

  if (forecasts.length === 0) {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <TrendingUp className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Forecasts Yet</h2>
        <p className="text-slate-400 mb-6">
          Create a forecast to predict future financial performance based on your data.
        </p>
        <Button onClick={() => navigate('/forecasts/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Forecast
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Forecasts</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors"
              aria-label="Help"
            ></button>
          </div>
          <p className="text-sm text-slate-400 mt-1">{forecasts.length} forecasts</p>
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
            <HeatmapChart
              data={heatmapData}
              cellSize={50}
              ariaLabel="Forecast confidence heatmap"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 w-20">Type</th>
                  <th className="px-4 py-3 w-20">Status</th>
                  <th className="px-4 py-3 w-24">Confidence</th>
                  <th className="px-4 py-3 w-24">Updated</th>
                  <th className="px-4 py-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No forecasts match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-900/50 cursor-pointer"
                      onClick={() => navigate('/forecasts/' + f.id)}
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
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatRelativeTime(f.lastUpdated || f.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/forecasts/' + f.id);
                          }}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-400 transition-colors"
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
