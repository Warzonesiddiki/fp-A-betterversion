import { useEffect, useState } from 'react';
import { useGLStore } from '@/store/glStore';
import { AIEngine } from '@/engines/AIEngine';
import { AICopilotEngine } from '@/engines/AICopilotEngine';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Progress } from '@/components/ui';
import { Cpu, Brain, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function AIIntelligencePage() {
  const { entries } = useGLStore();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [results, setResults] = useState<Array<{ label: string; score: number; category: string }>>(
    []
  );
  const [isGPU, setIsGPU] = useState(false);

  useEffect(() => {
    // Check if WebGPU is supported in the browser
    if ('gpu' in navigator) {
      setIsGPU(true);
    }
  }, []);

  const handleInit = async () => {
    setLoading(true);
    await AIEngine.init((p) => setProgress(p));
    setInitialized(true);
    setLoading(false);
  };

  const handleAnalyze = async () => {
    if (!initialized) return;
    setLoading(true);
    const subset = entries.slice(0, 50).map((e) => e.description);
    const analysis = await AIEngine.detectAnomalies(subset);
    setResults(analysis);
    setLoading(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-400" />
            AI Intelligence Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Local-first, GPU-accelerated financial analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
          <Cpu className={`h-4 w-4 ${isGPU ? 'text-green-400' : 'text-yellow-400'}`} />
          <span className="text-xs font-medium">
            {isGPU ? 'WebGPU Enabled' : 'CPU (WASM) Only'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Model Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!initialized ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Initialize the DistilBERT model to enable transaction classification and sentiment
                  analysis.
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
                <Button className="w-full" onClick={handleInit} disabled={loading}>
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize Model
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <CheckCircle className="h-4 w-4" />
                Model Ready (GPU Optimized)
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Anomaly & Sentiment Detection</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              disabled={!initialized || loading || entries.length === 0}
            >
              Analyze Recent Transactions
            </Button>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-slate-900/50 border border-slate-800 text-xs"
                  >
                    <span className="truncate flex-1 text-slate-300">{r.description}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-0.5 rounded-full ${r.sentiment === 'POSITIVE' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                      >
                        {r.sentiment}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {(r.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-sm">
                Run analysis to detect patterns in GL transaction descriptions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
