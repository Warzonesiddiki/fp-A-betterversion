import { useState, useEffect, useMemo, useCallback } from 'react';
import { useGLStore } from '@/store/glStore';
import { AIEngine } from '@/engines/AIEngine';
import type { AIStatus } from '@/engines/AIEngine';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { formatPercent } from '@/utils/financialFormatting';

import {
  Cpu,
  Brain,
  CheckCircle,
  Zap,
  RefreshCw,
  Download,
  Search,
  Sparkles,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';

interface AnomalyResult {
  description: string;
  sentiment: string;
  confidence: number;
}

const DEVICE_LABEL: Record<string, string> = {
  webgpu: 'WebGPU Enabled',
  wasm: 'CPU (WASM) Only',
  unknown: 'Checking...',
  checking: 'Checking...',
};

const DEVICE_COLOR: Record<string, string> = {
  webgpu: 'text-green-700 dark:text-green-300',
  wasm: 'text-yellow-700 dark:text-yellow-300',
  unknown: 'text-slate-500 dark:text-slate-400',
  checking: 'text-slate-500 dark:text-slate-400',
};

const SENTIMENT_OPTIONS = [
  { value: 'all', label: 'All sentiments' },
  { value: 'POSITIVE', label: 'Positive' },
  { value: 'NEGATIVE', label: 'Negative' },
  { value: 'NEUTRAL', label: 'Neutral' },
];

const CONFIDENCE_OPTIONS = [
  { value: 'all', label: 'All confidence levels' },
  { value: 'high', label: 'High (≥ 80%)' },
  { value: 'medium', label: 'Medium (50–80%)' },
  { value: 'low', label: 'Low (< 50%)' },
];

const BATCH_SIZE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
];

export function AIIntelligencePage() {
  const entries = useGLStore((state) => state.entries);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [results, setResults] = useState<AnomalyResult[]>([]);
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [batchSize, setBatchSize] = useState('10');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [modelLatencyMs, setModelLatencyMs] = useState<number | null>(null);
  const [lastAnalysisAt, setLastAnalysisAt] = useState<number | null>(null);

  // Real-time tick to refresh "Last analysis Xs ago" indicator every 30s
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Refresh engine status on mount and after init
  useEffect(() => {
    const current = AIEngine.getStatus();
    setStatus(current);
    if (current.initialized) {
      setInitialized(true);
    }
  }, [initialized]);

  const deviceKey: string =
    status?.device ?? (typeof navigator !== 'undefined' && 'gpu' in navigator ? 'webgpu' : 'wasm');
  const deviceLabel = DEVICE_LABEL[deviceKey] ?? DEVICE_LABEL['unknown']!;
  const deviceColor = DEVICE_COLOR[deviceKey] ?? DEVICE_COLOR['unknown']!;

  const handleInit = useCallback(async () => {
    setLoading(true);
    setProgress(0);
    try {
      await AIEngine.init((p) => setProgress(p));
      setInitialized(true);
      setStatus(AIEngine.getStatus());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!initialized) return;
    setLoading(true);
    const t0 = performance.now();
    try {
      const subset = entries.slice(0, 50).map((e) => e.description);
      const analysis = await AIEngine.detectAnomalies(subset, Number(batchSize) || 10, () => {
        /* progress callback — kept for future streaming UI */
      });
      setResults(analysis);
      setLastAnalysisAt(Date.now());
      setModelLatencyMs(Math.round(performance.now() - t0));
      setNowTick(Date.now());
    } finally {
      setLoading(false);
    }
  }, [initialized, entries, batchSize]);

  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return results.filter((r) => {
      if (sentimentFilter !== 'all' && r.sentiment !== sentimentFilter) return false;
      if (confidenceFilter === 'high' && r.confidence < 0.8) return false;
      if (confidenceFilter === 'medium' && (r.confidence < 0.5 || r.confidence >= 0.8))
        return false;
      if (confidenceFilter === 'low' && r.confidence >= 0.5) return false;
      if (q && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [results, searchQuery, sentimentFilter, confidenceFilter]);

  const positiveCount = useMemo(
    () => results.filter((r) => r.sentiment === 'POSITIVE').length,
    [results]
  );
  const negativeCount = useMemo(
    () => results.filter((r) => r.sentiment === 'NEGATIVE').length,
    [results]
  );
  const avgConfidence = useMemo(
    () =>
      results.length === 0 ? 0 : results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
    [results]
  );

  const positivePct = results.length === 0 ? 0 : (positiveCount / results.length) * 100;
  const negativePct = results.length === 0 ? 0 : (negativeCount / results.length) * 100;

  const secondsSinceAnalysis =
    lastAnalysisAt !== null ? Math.max(0, Math.floor((nowTick - lastAnalysisAt) / 1000)) : null;

  const handleExportCsv = useCallback(() => {
    if (filteredResults.length === 0) return;
    const header = 'description,sentiment,confidence';
    const rows = filteredResults.map((r) => {
      const safeDesc = `"${r.description.replace(/"/g, '""')}"`;
      return `${safeDesc},${r.sentiment},${r.confidence.toFixed(4)}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-intelligence-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredResults]);

  const handleRefresh = useCallback(() => {
    setNowTick(Date.now());
    setStatus(AIEngine.getStatus());
  }, []);

  return (
    <div className="p-6 space-y-6" aria-label="AI Intelligence Center">
      {/* Header */}
      <PageHeader
        icon={<Brain className="h-6 w-6 text-purple-700 dark:text-purple-300" />}
        title="AI Intelligence Center"
        purpose="Local-first, GPU-accelerated financial analysis."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="px-3 py-1 gap-1"
              aria-label={`Device status: ${deviceLabel}`}
            >
              <Cpu className={`h-4 w-4 ${deviceColor}`} aria-hidden="true" />
              <span className={`text-xs font-medium ${deviceColor}`}>{deviceLabel}</span>
            </Badge>
            {secondsSinceAnalysis !== null && (
              <span
                className="text-xs text-slate-500 dark:text-slate-400"
                aria-live="polite"
                aria-label={`Last analysis ${secondsSinceAnalysis} seconds ago`}
              >
                <Clock className="inline h-3 w-3 mr-1" aria-hidden="true" />
                Last analysis {secondsSinceAnalysis}s ago
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              aria-label="Refresh AI insights"
            >
              <RefreshCw className="h-4 w-4 mr-1" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Transactions Analyzed
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {results.length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-700 dark:text-blue-300" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Anomalies Detected
                </p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                  {negativeCount}
                </p>
              </div>
              <AlertTriangle
                className="h-8 w-8 text-red-700 dark:text-red-300"
                aria-hidden="true"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Avg Confidence
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {results.length === 0 ? '—' : `${formatPercent(avgConfidence, 1)}`}
                </p>
              </div>
              <TrendingUp
                className="h-8 w-8 text-purple-700 dark:text-purple-300"
                aria-hidden="true"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Model Latency
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {modelLatencyMs === null ? '—' : `${modelLatencyMs}ms`}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-700 dark:text-green-300" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        defaultValue={activeTab}
        aria-label="AI intelligence views"
      >
        <TabsList aria-label="Tab list">
          <TabsTrigger value="overview" aria-label="Overview tab">
            Overview
          </TabsTrigger>
          <TabsTrigger value="anomalies" aria-label="Anomalies tab">
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="sentiment" aria-label="Sentiment tab">
            Sentiment
          </TabsTrigger>
          <TabsTrigger value="insights" aria-label="Insights tab">
            Insights
          </TabsTrigger>
          <TabsTrigger value="model" aria-label="Model tab">
            Model
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Model Status</CardTitle>
                <CardDescription>DistilBERT on-device</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!initialized ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Initialize the DistilBERT model to enable transaction classification and
                      sentiment analysis.
                    </p>
                    {loading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Downloading Model...</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-1" />
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleInit}
                      disabled={loading}
                      aria-label="Initialize DistilBERT model"
                    >
                      <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
                      Initialize Model
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    Model Ready (GPU Optimized)
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Anomaly &amp; Sentiment Detection
                  </CardTitle>
                  <CardDescription>
                    Run inference on the {Math.min(50, entries.length)} most recent transactions.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAnalyze}
                  disabled={!initialized || loading || entries.length === 0}
                  aria-label="Analyze recent transactions"
                >
                  <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
                  Analyze
                </Button>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-3" aria-label="Analysis results">
                    {filteredResults.slice(0, 5).map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                          {r.description}
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              r.sentiment === 'POSITIVE'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : r.sentiment === 'NEGATIVE'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {r.sentiment}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 font-mono">
                            {formatPercent(r.confidence * 100, 1)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredResults.length > 5 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        Showing 5 of {filteredResults.length}. See the Anomalies tab for full list.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    Run analysis to detect patterns in GL transaction descriptions.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anomalies tab — filterable list with search and CSV export */}
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Anomaly &amp; Sentiment Results
                  </CardTitle>
                  <CardDescription>
                    {results.length} result{results.length === 1 ? '' : 's'} •{' '}
                    {filteredResults.length} shown
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportCsv}
                  disabled={filteredResults.length === 0}
                  aria-label="Export results to CSV"
                >
                  <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="relative">
                  <Search
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Search AI results"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    aria-label="Search AI results"
                  />
                </div>
                <Select
                  label="Sentiment"
                  options={SENTIMENT_OPTIONS}
                  value={sentimentFilter}
                  onChange={setSentimentFilter}
                />
                <Select
                  label="Confidence"
                  options={CONFIDENCE_OPTIONS}
                  value={confidenceFilter}
                  onChange={setConfidenceFilter}
                />
                <Select
                  label="Batch size"
                  options={BATCH_SIZE_OPTIONS}
                  value={batchSize}
                  onChange={setBatchSize}
                />
              </div>

              {filteredResults.length > 0 ? (
                <div
                  className="space-y-2 max-h-[480px] overflow-y-auto"
                  aria-label="Filtered anomaly results"
                >
                  {filteredResults.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="truncate flex-1 text-slate-700 dark:text-slate-300">
                        {r.description}
                      </span>
                      <div className="flex items-center gap-3 ml-3">
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            r.sentiment === 'POSITIVE'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : r.sentiment === 'NEGATIVE'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {r.sentiment}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono w-14 text-right">
                          {formatPercent(r.confidence * 100, 1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  {results.length === 0
                    ? 'Run analysis from the Overview tab to populate this list.'
                    : 'No results match your current filters.'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sentiment tab */}
        <TabsContent value="sentiment">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Sentiment breakdown</CardTitle>
              <CardDescription>
                Distribution across {results.length} analyzed transaction
                {results.length === 1 ? '' : 's'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No analysis has been run yet. Use the Overview tab to begin.
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    className="flex h-6 w-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
                    aria-label="Sentiment distribution bar"
                  >
                    <div
                      className="bg-green-700 dark:bg-green-600 flex items-center justify-center text-[10px] font-medium text-white"
                      style={{ width: `${positivePct}%` }}
                      aria-label={`Positive ${positiveCount} (${formatPercent(positivePct, 1)})`}
                    >
                      {positivePct >= 10 ? `${formatPercent(positivePct, 0)}` : ''}
                    </div>
                    <div
                      className="bg-red-700 dark:bg-red-600 flex items-center justify-center text-[10px] font-medium text-white"
                      style={{ width: `${negativePct}%` }}
                      aria-label={`Negative ${negativeCount} (${formatPercent(negativePct, 1)})`}
                    >
                      {negativePct >= 10 ? `${formatPercent(negativePct, 0)}` : ''}
                    </div>
                    <div
                      className="bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[10px] font-medium text-slate-700 dark:text-slate-200"
                      style={{
                        width: `${Math.max(0, 100 - positivePct - negativePct)}%`,
                      }}
                      aria-label={`Other ${results.length - positiveCount - negativeCount}`}
                    >
                      {100 - positivePct - negativePct >= 10
                        ? `${formatPercent(100 - positivePct - negativePct, 0)}`
                        : ''}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Positive</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">
                        {positiveCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Negative</p>
                      <p className="text-lg font-bold text-red-700 dark:text-red-300">
                        {negativeCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Other</p>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                        {results.length - positiveCount - negativeCount}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights tab */}
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Insights</CardTitle>
              <CardDescription>
                Auto-generated observations from the latest analysis run.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                  Run an analysis to see auto-generated insights.
                </div>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li>
                    <strong className="text-slate-900 dark:text-slate-100">{positiveCount}</strong>{' '}
                    positive and{' '}
                    <strong className="text-slate-900 dark:text-slate-100">{negativeCount}</strong>{' '}
                    negative transaction
                    {positiveCount + negativeCount === 1 ? '' : 's'} detected.
                  </li>
                  <li>
                    Average model confidence:{' '}
                    <strong className="text-slate-900 dark:text-slate-100">
                      {formatPercent(avgConfidence * 100, 1)}
                    </strong>
                    .
                  </li>
                  {modelLatencyMs !== null && (
                    <li>
                      Latest inference latency:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {modelLatencyMs}ms
                      </strong>{' '}
                      for {results.length} transactions.
                    </li>
                  )}
                  {negativeCount > positiveCount && (
                    <li className="text-red-700 dark:text-red-300">
                      ⚠ Negative transactions outnumber positive — review recent GL activity.
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model tab */}
        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Model Information</CardTitle>
              <CardDescription>DistilBERT inference engine details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Model</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">DistilBERT</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Backend</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{deviceLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {initialized ? 'Initialized' : 'Not initialized'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Classifier</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {status?.classifierReady ? 'Ready' : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Extractor</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {status?.extractorReady ? 'Ready' : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Latency</p>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {modelLatencyMs === null ? '—' : `${modelLatencyMs}ms`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help card */}
      <Card className="bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800">
        <CardContent className="pt-6 flex items-start gap-3">
          <Sparkles
            className="h-5 w-5 text-sky-700 dark:text-sky-300 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-sky-900 dark:text-sky-200">
              About AI Intelligence
            </p>
            <p className="text-xs text-sky-700 dark:text-sky-300 mt-1">
              All inference runs locally in your browser using a quantized DistilBERT model. No data
              leaves your device. Initialize the model on first use; subsequent analyses are
              near-instant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIIntelligencePage;
