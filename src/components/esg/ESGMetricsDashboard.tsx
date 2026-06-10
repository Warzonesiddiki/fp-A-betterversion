import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import { GaugeChart } from '@/components/ui/GaugeChart';
import { useESGStore } from '@/store/esgStore';
import { ESGEngine } from '@/engines/ESGEngine';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Leaf, Users, Shield, TrendingUp } from 'lucide-react';

interface ESGMetricsDashboardProps {
  className?: string;
}

interface CategoryScore {
  category: string;
  score: number;
  metricCount: number;
  target: number;
}

export function ESGMetricsDashboard({ className }: ESGMetricsDashboardProps) {
  const { metrics, initiatives, getOverallScore, getMetricsByCategory } = useESGStore();

  const overallScore = useMemo(() => getOverallScore(), [getOverallScore]);

  const categoryScores = useMemo((): CategoryScore[] => {
    const categories = ['environmental', 'social', 'governance'] as const;

    return categories.map((cat) => {
      const catMetrics = getMetricsByCategory(cat);
      const score =
        catMetrics.length > 0
          ? Math.round(
              catMetrics.reduce((sum, m) => sum + (m.value / m.target) * 100, 0) / catMetrics.length
            )
          : 0;

      return {
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
        score,
        metricCount: catMetrics.length,
        target: 100,
      };
    });
  }, [getMetricsByCategory]);

  const chartData = useMemo(
    () =>
      categoryScores.map((cs) => ({
        name: cs.category,
        score: cs.score,
        target: cs.target,
      })),
    [categoryScores]
  );

  const initiativeStats = useMemo(() => {
    const total = initiatives.length;
    const onTrack = initiatives.filter((i) => i.progress >= 75).length;
    const atRisk = initiatives.filter((i) => i.progress >= 50 && i.progress < 75).length;
    const behind = initiatives.filter((i) => i.progress < 50).length;
    const totalBudget = initiatives.reduce((s, i) => s + i.budget, 0);
    const totalSpent = initiatives.reduce((s, i) => s + i.spent, 0);
    return { total, onTrack, atRisk, behind, totalBudget, totalSpent };
  }, [initiatives]);

  const diversityMetrics = useMemo(() => {
    return ESGEngine.calculateDiversityScore([]);
  }, []);

  if (metrics.length === 0) {
    return (
      <div className={className} role="region" aria-label="ESGMetricsDashboard">
        <Card>
          <CardContent className="p-12 text-center">
            <Leaf className="h-10 w-10 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No ESG Metrics
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Add ESG metrics to the store to view the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <KPIValue
          label="Overall ESG Score"
          value={`${overallScore}/100`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={overallScore >= 80 ? 'up' : overallScore >= 60 ? 'neutral' : 'down'}
        />
        <KPIValue
          label="Environmental"
          value={`${categoryScores[0]?.score ?? 0}/100`}
          icon={<Leaf className="h-4 w-4" />}
          trend={
            (categoryScores[0]?.score ?? 0) >= 80
              ? 'up'
              : (categoryScores[0]?.score ?? 0) >= 60
                ? 'neutral'
                : 'down'
          }
        />
        <KPIValue
          label="Social"
          value={`${categoryScores[1]?.score ?? 0}/100`}
          icon={<Users className="h-4 w-4" />}
          trend={
            (categoryScores[1]?.score ?? 0) >= 80
              ? 'up'
              : (categoryScores[1]?.score ?? 0) >= 60
                ? 'neutral'
                : 'down'
          }
        />
        <KPIValue
          label="Governance"
          value={`${categoryScores[2]?.score ?? 0}/100`}
          icon={<Shield className="h-4 w-4" />}
          trend={
            (categoryScores[2]?.score ?? 0) >= 80
              ? 'up'
              : (categoryScores[2]?.score ?? 0) >= 60
                ? 'neutral'
                : 'down'
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>ESG Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #334155)" />
                <XAxis dataKey="name" stroke="var(--text-secondary, #94a3b8)" />
                <YAxis stroke="var(--text-secondary, #94a3b8)" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated, #1e293b)',
                    border: '1px solid var(--border-subtle, #334155)',
                    borderRadius: 8,
                  }}
                />
                <Legend />
                <Bar dataKey="score" name="Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall ESG Gauge</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <GaugeChart
              value={overallScore}
              min={0}
              max={100}
              threshold={60}
              critical={40}
              label="ESG Score"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Initiatives Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {initiativeStats.total}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Initiatives</div>
              </div>
              <div className="text-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {initiativeStats.onTrack}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">On Track</div>
              </div>
              <div className="text-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {initiativeStats.atRisk}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">At Risk</div>
              </div>
              <div className="text-center p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400" role="alert">
                  {initiativeStats.behind}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Behind</div>
              </div>
            </div>
            {initiativeStats.totalBudget > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Budget Utilization</span>
                  <span className="text-slate-900 dark:text-white">
                    {((initiativeStats.totalSpent / initiativeStats.totalBudget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (initiativeStats.totalSpent / initiativeStats.totalBudget) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diversity Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Gender Ratio (Female)</span>
                  <span className="text-slate-900 dark:text-white">
                    {(diversityMetrics.genderRatio * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{ width: `${diversityMetrics.genderRatio * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Ethnic Diversity</span>
                  <span className="text-slate-900 dark:text-white">
                    {(diversityMetrics.ethnicDiversity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{ width: `${diversityMetrics.ethnicDiversity * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Management Diversity</span>
                  <span className="text-slate-900 dark:text-white">
                    {(diversityMetrics.managementDiversity * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500"
                    style={{ width: `${diversityMetrics.managementDiversity * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
