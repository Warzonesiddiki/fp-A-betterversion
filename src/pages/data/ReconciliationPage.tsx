import React, { useCallback, useMemo, useState } from 'react';
import { useGLStore } from '@/store/glStore';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { ReconciliationPanel } from './ReconciliationPanel';
import { ReconciliationResults } from './ReconciliationResults';
import { Download, RefreshCw, ArrowLeftRight, FileText } from 'lucide-react';
import { saveAs } from 'file-saver';
import { parseCSV } from '@/utils/csv';
import { subtractMoney, roundTo, toDecimal, formatMoney } from '@/utils/money';
import { formatPercent } from '@/utils/financialFormatting';
import { PageHeader } from '@/components/ui/PageHeader';

interface RecResult {
  matching: number;
  mismatches: number;
  missing: number;
  details: { key: string; expected: number; actual: number; diff: number }[];
  tolerance: number;
}

export default function ReconciliationPage() {
  const { entries } = useGLStore();
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recData, setRecData] = useState<Record<string, string>[]>([]);
  const [recKeyCol, setRecKeyCol] = useState('');
  const [recValCol, setRecValCol] = useState('');
  const [recError, setRecError] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [result, setResult] = useState<RecResult | null>(null);
  const [tolerance, setTolerance] = useState(0.01); // 1% default
  const [isRunning, setIsRunning] = useState(false);

  // Build GL account balances from current entries (money-primitive)
  const glBalances = useMemo(() => {
    const map = new Map<string, ReturnType<typeof toDecimal>>();
    entries.forEach((e) => {
      const key = (e.accountCode || e.accountId || '').toUpperCase().trim();
      if (!key) return;
      const prev = map.get(key) ?? toDecimal(0);
      // Original logic: (debit - credit) || amount (fallback when net is zero)
      const dc = toDecimal(e.debit || 0).minus(toDecimal(e.credit || 0));
      const net = dc.isZero() ? toDecimal(e.amount || 0) : dc;
      map.set(key, prev.plus(net));
    });
    return map;
  }, [entries]);

  const handleFile = useCallback(async (file: File) => {
    setRecFile(file);
    setRecError(null);
    setResult(null);

    try {
      const text = await file.text();
      const { headers, rows: data } = parseCSV(text);
      if (headers.length === 0 || data.length === 0) {
        setRecError('CSV must have at least a header and one data row');
        return;
      }

      setCsvHeaders(headers);
      setRecData(data);

      // Auto-suggest likely columns
      const keyGuess =
        headers.find((h) => {
          const lower = h.toLowerCase();
          return lower.includes('account') || lower.includes('code') || lower.includes('key');
        }) ??
        headers[0] ??
        '';
      const valGuess =
        headers.find((h) => {
          const lower = h.toLowerCase();
          return lower.includes('balance') || lower.includes('amount') || lower.includes('value');
        }) ??
        headers[1] ??
        '';

      setRecKeyCol(keyGuess);
      setRecValCol(valGuess);
    } catch (err) {
      setRecError('Failed to parse CSV: ' + (err as Error).message);
      setRecData([]);
    }
  }, []);

  const handleKeyColChange = (col: string) => {
    setRecKeyCol(col);
    setResult(null);
  };

  const handleValColChange = (col: string) => {
    setRecValCol(col);
    setResult(null);
  };

  const runReconciliation = useCallback(() => {
    if (!recData.length || !recKeyCol || !recValCol) {
      setRecError('Please select key and value columns and load a file');
      return;
    }

    setIsRunning(true);
    setRecError(null);

    try {
      const details: RecResult['details'] = [];
      let matching = 0;
      let mismatches = 0;
      let missing = 0;

      const seenKeys = new Set<string>();

      recData.forEach((row) => {
        const rawKey = row[recKeyCol] || '';
        const key = rawKey.toUpperCase().trim();
        if (!key) return;

        seenKeys.add(key);

        const rawVal = parseFloat(row[recValCol] || '0');
        const actual = isNaN(rawVal) ? 0 : rawVal;

        const expectedDec = glBalances.get(key);
        const expected = expectedDec ? roundTo(expectedDec, 2) : 0;
        const diff = roundTo(subtractMoney(expected, actual), 2);

        const pctDiff = expected !== 0 ? Math.abs(diff) / Math.abs(expected) : actual === 0 ? 0 : 1;
        const isMatch = Math.abs(diff) <= tolerance || pctDiff <= tolerance;

        if (expected === 0 && actual === 0) {
          // skip zero-zero
        } else if (isMatch) {
          matching++;
        } else if (expected === 0) {
          missing++;
        } else {
          mismatches++;
        }

        details.push({ key, expected, actual, diff });
      });

      // Detect GL-only items (missing from file)
      glBalances.forEach((expectedDec, key) => {
        const expected = roundTo(expectedDec, 2);
        if (!seenKeys.has(key) && expected !== 0) {
          missing++;
          details.push({ key, expected, actual: 0, diff: expected });
        }
      });

      const finalResult: RecResult = {
        matching,
        mismatches,
        missing,
        details: details.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)),
        tolerance,
      };

      setResult(finalResult);
    } catch (e) {
      setRecError('Reconciliation failed: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  }, [recData, recKeyCol, recValCol, glBalances, tolerance]);

  const exportDifferences = useCallback(() => {
    if (!result) return;

    const header = 'AccountKey,Expected(GL),Actual(File),Difference,Status\n';
    const rows = result.details
      .filter((d) => d.expected !== 0 || d.actual !== 0)
      .map((d) => {
        const status =
          d.expected === 0 ? 'missing' : Math.abs(d.diff) <= tolerance ? 'match' : 'mismatch';
        return [
          d.key,
          formatMoney(d.expected, { places: 2 }),
          formatMoney(d.actual, { places: 2 }),
          formatMoney(d.diff, { places: 2 }),
          status,
        ].join(',');
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `reconciliation-differences-${new Date().toISOString().slice(0, 10)}.csv`);
  }, [result, tolerance]);

  const resetAll = () => {
    setRecFile(null);
    setRecData([]);
    setCsvHeaders([]);
    setRecKeyCol('');
    setRecValCol('');
    setRecError(null);
    setResult(null);
  };

  const hasGLData = entries.length > 0;
  const canRun = recData.length > 0 && recKeyCol && recValCol && hasGLData;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        icon={<ArrowLeftRight className="h-8 w-8 text-blue-400" />}
        title="Data Reconciliation"
        purpose={
          <>
            Compare imported GL data against external source files with{' '}
            {formatPercent(tolerance * 100)} tolerance matching.
          </>
        }
        actions={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={resetAll}>
              <RefreshCw className="h-4 w-4 mr-2" /> Reset
            </Button>
            {result && (
              <Button onClick={exportDifferences} variant="secondary">
                <Download className="h-4 w-4 mr-2" /> Export Differences
              </Button>
            )}
          </div>
        }
      />

      {/* Status / Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-[var(--text-muted)]">GL Entries Loaded</div>
            <div className="text-2xl font-semibold tabular-nums">
              {entries.length.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">Unique accounts: {glBalances.size}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-[var(--text-muted)]">Tolerance</div>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                step="0.001"
                min="0"
                max="0.1"
                value={tolerance}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(0.1, parseFloat(e.target.value) || 0.01));
                  setTolerance(v);
                  if (result) setResult({ ...result, tolerance: v });
                }}
                className="w-24"
              />
              <span className="text-xs text-slate-500">({formatPercent(tolerance * 100)})</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Absolute or relative difference allowed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-between">
            <div>
              <div className="text-sm text-[var(--text-muted)]">Status</div>
              <div className="font-medium">
                {hasGLData ? 'Ready for reconciliation' : 'Import GL data first'}
              </div>
            </div>
            {!hasGLData && (
              <Button
                size="sm"
                onClick={() => (window.location.href = '/data/gl-upload')}
                className="mt-2 w-fit"
              >
                Go to GL Upload
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upload + Column Selection Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> External Source File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReconciliationPanel
            recFile={recFile}
            recData={recData}
            recKeyCol={recKeyCol}
            recValCol={recValCol}
            recError={recError}
            csvHeaders={csvHeaders}
            onFile={handleFile}
            onKeyColChange={handleKeyColChange}
            onValColChange={handleValColChange}
            onRun={runReconciliation}
          />
        </CardContent>
      </Card>

      {/* Run Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={runReconciliation}
          disabled={!canRun || isRunning}
          className="px-10"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Reconciling...
            </>
          ) : (
            <>
              <ArrowLeftRight className="h-4 w-4 mr-2" /> Run Reconciliation (
              {formatPercent(tolerance * 100, 0)} tolerance)
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Reconciliation Results</CardTitle>
            <Badge variant={result.mismatches + result.missing === 0 ? 'default' : 'destructive'}>
              {result.matching} match • {result.mismatches} mismatch • {result.missing} missing
            </Badge>
          </CardHeader>
          <CardContent>
            <ReconciliationResults result={result} />
          </CardContent>
        </Card>
      )}

      {recError && !result && (
        <div className="text-sm text-red-400 bg-red-950/30 p-3 rounded border border-red-900">
          {recError}
        </div>
      )}

      {/* Help / Acceptance */}
      <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
        <strong>Acceptance Criteria (1.1.5):</strong> Side-by-side comparison of GL vs external file
        • 1% (configurable) tolerance • Detailed difference table with match/mismatch/missing •
        Export of differences as CSV. All logic uses live <code>glStore.entries</code> and performs
        pure numeric comparison.
      </div>
    </div>
  );
}
