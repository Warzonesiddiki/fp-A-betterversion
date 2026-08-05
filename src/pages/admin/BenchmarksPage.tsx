import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { Play, Activity, Database, Cpu, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

import { BenchmarkService, BenchmarkResult, BenchmarkReport } from '@/services/BenchmarkService';
import { createLogger } from '@/utils/logger';
import { formatNumber } from '@/utils/financialFormatting';

const benchmarksPageLogger = createLogger('BenchmarksPage');

const BenchmarksPage: React.FC = () => {
  const [history, setHistory] = useState<BenchmarkResult[]>([]);
  const [latestReport, setLatestReport] = useState<BenchmarkReport | null>(null);
  const [isRunning, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      const data = await BenchmarkService.getHistory();
      setHistory(data);
    } catch (err) {
      setError('Failed to load benchmark history');
      benchmarksPageLogger.error('Failed to load benchmark history', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const runBenchmarks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const report = await BenchmarkService.runFullSuite();
      setLatestReport(report);
      await BenchmarkService.saveResult(report);
      await loadHistory();
    } catch (err) {
      setError('Benchmark execution failed. Check console for details.');
      benchmarksPageLogger.error('Benchmark execution failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    // Group history by timestamp (roughly, since they are saved in a batch)
    // For visualization, we'll map each batch to a single data point
    const groups: Record<
      number,
      { timestamp: number; timeLabel: string; [key: string]: number | string }
    > = {};

    history.forEach((res) => {
      // Round to nearest second to group the batch
      const ts = Math.floor(res.timestamp / 1000) * 1000;
      if (!groups[ts]!) {
        groups[ts] = { timestamp: ts, timeLabel: new Date(ts).toLocaleTimeString() };
      }
      groups[ts]![res.name] = res.duration;
    });

    return Object.values(groups).sort((a, b) => a.timestamp - b.timestamp);
  }, [history]);

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            System Benchmarks
          </h1>
          <p className="text-slate-500">Monitor AIEngine and Storage performance trends</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadHistory}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={runBenchmarks}
            disabled={isRunning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Play className="w-4 h-4 fill-current" />
            Run Benchmarks
          </Button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Cpu className="w-4 h-4" />
            AI Classification
          </div>
          <div className="text-3xl font-bold">
            {latestReport ? `${formatNumber(latestReport.aiEngine.classify, 2)} ms` : '--'}
          </div>
          <Badge
            variant={(latestReport?.aiEngine.classify ?? Infinity) < 50 ? 'default' : 'destructive'}
          >
            {(latestReport?.aiEngine.classify ?? Infinity) < 50 ? 'Healthy' : 'Degraded'}
          </Badge>
        </Card>

        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Database className="w-4 h-4" />
            Storage Write
          </div>
          <div className="text-3xl font-bold">
            {latestReport ? `${formatNumber(latestReport.storage.write, 2)} ms` : '--'}
          </div>
          <Badge
            variant={(latestReport?.storage.write ?? Infinity) < 10 ? 'default' : 'destructive'}
          >
            {(latestReport?.storage.write ?? Infinity) < 10 ? 'Fast' : 'Slow'}
          </Badge>
        </Card>

        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Clock className="w-4 h-4" />
            AI Latency (Avg)
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {latestReport
              ? `${((latestReport.aiEngine.classify + latestReport.aiEngine.embedding) / 2).toFixed(2)}ms`
              : '--'}
          </div>
          <p className="text-xs text-slate-400">Combined inference & embedding</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-600" />
            AI Engine Latency Trends (ms)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" hide />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="ai_classify"
                  name="Classification"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorAi)"
                />
                <Area
                  type="monotone"
                  dataKey="ai_embedding"
                  name="Embedding"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorAi)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            Storage Performance (ms)
          </h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" hide />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="storage_write"
                  name="Write (100KB)"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="storage_read"
                  name="Read"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Raw Performance Data</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Admin benchmarks history">
            <caption className="sr-only">
              Raw performance data showing timestamp, operation, and latency for the last 10 entries
            </caption>
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th scope="col" className="p-2">
                  Timestamp
                </th>
                <th scope="col" className="p-2">
                  Operation
                </th>
                <th scope="col" className="p-2 text-right">
                  Latency
                </th>
              </tr>
            </thead>
            <tbody>
              {history
                .slice(-10)
                .reverse()
                .map((res, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    <td className="p-2 text-slate-500">
                      {new Date(res.timestamp).toLocaleString()}
                    </td>
                    <td className="p-2 font-mono uppercase text-xs">{res.name}</td>
                    <td className="p-2 text-right font-medium">{res.duration.toFixed(3)}ms</td>
                  </tr>
                ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                    No benchmark data available. Run benchmarks to start collecting data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BenchmarksPage;
