import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { useDataStore } from '@/store/dataStore';
import {
  MigrationEngine,
  type MigrationSource,
  type MigrationReadiness,
  type ColumnMapping,
} from '@/engines/MigrationEngine';

import { FileDropZone } from '@/components/ui/FileDropZone';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  ArrowLeftRight,
  Upload,
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  FileSpreadsheet,
  Globe,
  Shield,
} from 'lucide-react';

const migrationEngine = new MigrationEngine();

type WizardStep = 'upload' | 'analyze' | 'map' | 'import' | 'verify';

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else current += c;
  }
  values.push(current);
  return values;
}

export default function DataImportPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — Data Import';
  }, []);

  const { entries, accounts, importHistory } = useGLStore();
  const { importJobs, addImportJob, updateImportStatus } = useDataStore();
  const navigate = useNavigate();

  // Migration wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('upload');
  const [migrationFile, setMigrationFile] = useState<File | null>(null);
  const [detectedSource, setDetectedSource] = useState<MigrationSource>('unknown');
  const [readiness, setReadiness] = useState<MigrationReadiness | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Reconciliation state
  const [recFile, setRecFile] = useState<File | null>(null);
  const [recData, setRecData] = useState<Record<string, string>[]>([]);
  const [recKeyCol, setRecKeyCol] = useState('');
  const [recValCol, setRecValCol] = useState('');
  const [recResult, setRecResult] = useState<{
    matching: number;
    mismatches: number;
    missing: number;
    details: { key: string; expected: number; actual: number; diff: number }[];
  } | null>(null);
  const [recError, setRecError] = useState<string | null>(null);
  const [_recLoading, setRecLoading] = useState(false);

  const currentSummary = useMemo(() => {
    if (entries.length === 0) return null;
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    return {
      totalEntries: entries.length,
      totalAccounts: accounts.length,
      totalDebit,
      totalCredit,
      lastImport: importHistory[0] || null,
    };
  }, [entries, accounts, importHistory]);

  // Migration wizard handlers
  const handleMigrationFile = useCallback(async (file: File) => {
    setMigrationFile(file);
    setMigrationError(null);
    setWizardStep('analyze');

    try {
      const source = await migrationEngine.detectMigrationSource(file);
      setDetectedSource(source);

      const { readiness: r, plan } = await migrationEngine.analyzeMigration(file);
      setReadiness(r);
      setColumnMappings(plan.mappings);
      setWizardStep('map');
    } catch (e) {
      setMigrationError(`Analysis failed: ${e instanceof Error ? e.message : String(e)}`);
      setWizardStep('upload');
    }
  }, []);

  const handleColumnMappingChange = useCallback((sourceColumn: string, targetField: string) => {
    setColumnMappings((prev) =>
      prev.map((m) =>
        m.sourceColumn === sourceColumn
          ? { ...m, targetField, matchType: 'manual' as const, confidence: 1.0 }
          : m
      )
    );
  }, []);

  const handleExecuteMigration = useCallback(async () => {
    if (!migrationFile) return;
    setWizardStep('import');
    setMigrationProgress(0);
    setMigrationError(null);

    const jobId = addImportJob({
      filename: migrationFile.name,
      fileType: detectedSource.toUpperCase(),
      rowCount: 0,
      successCount: 0,
      errorCount: 0,
      completedAt: null,
      startedBy: 'current-user',
      startedByName: 'Current User',
    });

    try {
      const unsub = migrationEngine.onProgress((p) => setMigrationProgress(p.percent));

      const { result } = await migrationEngine.executeMigration(migrationFile, columnMappings);

      unsub();

      if (!result.valid) {
        const errorMsg = result.errors.map((e) => e.message).join('; ');
        setMigrationError(errorMsg);
        updateImportStatus(jobId, 'Failed', errorMsg);
        setWizardStep('map');
        return;
      }

      updateImportStatus(jobId, 'Completed');
      setWizardStep('verify');
    } catch (e) {
      setMigrationError(`Migration failed: ${e instanceof Error ? e.message : String(e)}`);
      updateImportStatus(jobId, 'Failed', e instanceof Error ? e.message : 'Unknown error');
      setWizardStep('map');
    }
  }, [migrationFile, detectedSource, columnMappings, addImportJob, updateImportStatus]);

  const handleRollback = useCallback(() => {
    const snapshots = migrationEngine.getMigrationSnapshots();
    if (snapshots.length > 0) {
      const last = snapshots[snapshots.length - 1];
      migrationEngine.rollbackMigration(last!.id);
      setWizardStep('upload');
      setMigrationFile(null);
      setReadiness(null);
      setColumnMappings([]);
    }
  }, []);

  const handleRecFile = useCallback(async (file: File) => {
    setRecError(null);
    setRecResult(null);
    setRecLoading(true);
    setRecFile(file);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        setRecError('File must have a header row and at least one data row.');
        setRecLoading(false);
        return;
      }
      const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const data = lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          row[h] = (values[i] || '').trim();
        });
        return row;
      });
      setRecData(data);
      if (headers.length >= 2) {
        setRecKeyCol(headers[0]!);
        setRecValCol(headers[1]!);
      }
      setRecLoading(false);
    } catch (e: unknown) {
      setRecError('Failed to parse file: ' + (e instanceof Error ? e.message : String(e)));
      setRecLoading(false);
    }
  }, []);

  const runReconciliation = useCallback(() => {
    if (!recKeyCol || !recValCol || recData.length === 0 || entries.length === 0) return;
    const expectedMap = new Map<string, number>();
    entries.forEach((e) => {
      const key = e.accountCode || e.accountId;
      expectedMap.set(key, (expectedMap.get(key) || 0) + (e.debit - e.credit));
    });
    let matching = 0,
      mismatches = 0,
      missing = 0;
    const details: { key: string; expected: number; actual: number; diff: number }[] = [];
    recData.forEach((row) => {
      const key = row[recKeyCol]!;
      const actual = parseFloat(row[recValCol]!) || 0;
      const expected = expectedMap.get(key) || 0;
      if (expected === 0) {
        missing++;
      } else if (Math.abs(expected - actual) < 0.01) {
        matching++;
      } else {
        mismatches++;
      }
      details.push({ key, expected, actual, diff: actual - expected });
    });
    setRecResult({ matching, mismatches, missing, details });
  }, [recKeyCol, recValCol, recData, entries]);

  const csvHeaders = recData.length > 0 ? Object.keys(recData[0]!) : [];

  const sourceLabel = (s: MigrationSource) => {
    switch (s) {
      case 'planful':
        return 'Planful';
      case 'adaptive':
        return 'Workday Adaptive Planning';
      case 'anaplan':
        return 'Anaplan';
      case 'excel':
        return 'Excel Workbook';
      case 'csv':
        return 'CSV File';
      default:
        return 'Unknown Source';
    }
  };

  if (entries.length === 0) {
    return (
      <main className="p-12 text-center max-w-md mx-auto" role="main" aria-label="Data import page">
        <div className="p-4 bg-slate-800 rounded-full inline-block mb-4">
          <Upload className="h-10 w-10 text-slate-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No Data Imported</h2>
        <p className="text-slate-400 mb-6">
          Use the GL Upload page to import your financial data first, then come here to reconcile
          against external reports.
        </p>
        <Button onClick={() => navigate('/data/gl-upload')} aria-label="Go to GL upload page">
          <Upload className="h-4 w-4 mr-2" />
          Go to GL Upload
        </Button>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6" role="main" aria-label="Data import and reconciliation page">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Data Import & Reconciliation</h1>
            <button
              onClick={() => setHelpOpen(true)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label="Help"
            />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Migrate data from Excel, Planful, Adaptive, or Anaplan. Verify against source files.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/data/gl-upload')}
          aria-label="Import new data"
        >
          <Upload className="h-4 w-4 mr-2" />
          Import New Data
        </Button>
      </div>

      {/* Migration Wizard */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <h3 className="font-semibold">Migration Wizard</h3>
            <div className="flex gap-1 ml-auto">
              {(['upload', 'analyze', 'map', 'import', 'verify'] as WizardStep[]).map((step, i) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full ${
                    wizardStep === step
                      ? 'bg-blue-500'
                      : ['upload', 'analyze', 'map', 'import', 'verify'].indexOf(wizardStep) > i
                        ? 'bg-green-500'
                        : 'bg-slate-700'
                  }`}
                  title={step}
                />
              ))}
            </div>
          </div>

          {wizardStep === 'upload' && (
            <div>
              <p className="text-sm text-slate-400 mb-4">
                Upload a file to migrate from Excel, Planful, Adaptive Insights, or Anaplan.
                Auto-detects source format and maps columns automatically.
              </p>
              <FileDropZone
                onFile={handleMigrationFile}
                accept=".xlsx,.xls,.csv"
                aria-label="Upload file for migration"
              />
              {migrationError && (
                <Alert
                  type="error"
                  title="Migration Error"
                  message={migrationError}
                  className="mt-4"
                />
              )}
            </div>
          )}

          {wizardStep === 'analyze' && (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-400">Analyzing file structure...</p>
            </div>
          )}

          {wizardStep === 'map' && readiness && (
            <div className="space-y-4">
              {/* Readiness Report */}
              <div
                className={`p-4 rounded-lg border ${
                  readiness.status === 'green'
                    ? 'bg-green-900/20 border-green-800/30'
                    : readiness.status === 'yellow'
                      ? 'bg-yellow-900/20 border-yellow-800/30'
                      : 'bg-red-900/20 border-red-800/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Shield
                    className={`h-5 w-5 ${
                      readiness.status === 'green'
                        ? 'text-green-400'
                        : readiness.status === 'yellow'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                    }`}
                  />
                  <span className="font-semibold">Migration Readiness: {readiness.score}%</span>
                  <Badge
                    variant={
                      readiness.status === 'green'
                        ? 'default'
                        : readiness.status === 'yellow'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {readiness.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <div className="text-slate-500">Source</div>
                    <div className="font-medium">{sourceLabel(detectedSource)}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Sheets</div>
                    <div className="font-medium">{readiness.sheetCount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Rows</div>
                    <div className="font-medium">{readiness.totalRows.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Formula Complexity</div>
                    <div className="font-medium capitalize">{readiness.formulaComplexity}</div>
                  </div>
                </div>
                {readiness.issues.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {readiness.issues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        {issue.severity === 'error' ? (
                          <XCircle className="h-3 w-3 text-red-400" />
                        ) : issue.severity === 'warning' ? (
                          <AlertTriangle className="h-3 w-3 text-yellow-400" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-blue-400" />
                        )}
                        <span className="text-slate-400">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column Mappings */}
              <div>
                <h4 className="text-sm font-medium mb-2">Column Mappings</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" aria-label="Data import preview">
                    <caption className="sr-only">Detailed GL data import preview</caption>
                    <thead>
                      <tr className="text-left text-slate-400 text-xs uppercase border-b border-slate-800">
                        <th scope="col" className="pb-2 pr-4">
                          Source Column
                        </th>
                        <th scope="col" className="pb-2 pr-4">
                          Target Field
                        </th>
                        <th scope="col" className="pb-2 pr-4">
                          Confidence
                        </th>
                        <th scope="col" className="pb-2">
                          Match Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {columnMappings.map((m, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 font-mono text-xs">{m.sourceColumn}</td>
                          <td className="py-2 pr-4">
                            <select
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs"
                              value={m.targetField}
                              onChange={(e) =>
                                handleColumnMappingChange(m.sourceColumn, e.target.value)
                              }
                            >
                              <option value="">-- Skip --</option>
                              <option value="account">Account</option>
                              <option value="accountName">Account Name</option>
                              <option value="department">Department</option>
                              <option value="entity">Entity</option>
                              <option value="period">Period</option>
                              <option value="date">Date</option>
                              <option value="debit">Debit</option>
                              <option value="credit">Credit</option>
                              <option value="amount">Amount</option>
                              <option value="scenario">Scenario</option>
                              <option value="currency">Currency</option>
                            </select>
                          </td>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    m.confidence > 0.8
                                      ? 'bg-green-500'
                                      : m.confidence > 0.5
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${m.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500">
                                {Math.round(m.confidence * 100)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2">
                            <Badge
                              variant={
                                m.matchType === 'exact'
                                  ? 'default'
                                  : m.matchType === 'manual'
                                    ? 'secondary'
                                    : 'outline'
                              }
                              className="text-[10px]"
                            >
                              {m.matchType}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setWizardStep('upload');
                    setMigrationFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecuteMigration}
                  disabled={readiness.status === 'red'}
                  aria-label="Start migration"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Start Migration
                </Button>
              </div>
            </div>
          )}

          {wizardStep === 'import' && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-slate-400">
                  Importing data from {sourceLabel(detectedSource)}...
                </p>
                <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${migrationProgress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">{migrationProgress}% complete</p>
              </div>
              {migrationError && (
                <Alert type="error" title="Migration Error" message={migrationError} />
              )}
            </div>
          )}

          {wizardStep === 'verify' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-900/20 rounded-lg border border-green-800/30">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                  <div>
                    <p className="font-semibold text-green-400">Migration Complete</p>
                    <p className="text-sm text-slate-400">
                      Data imported from {sourceLabel(detectedSource)}. Run reconciliation to verify
                      totals.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={handleRollback} aria-label="Rollback migration">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rollback
                </Button>
                <Button onClick={() => setWizardStep('upload')} aria-label="Import another file">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Another
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {currentSummary && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Current Data Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-slate-400">Total Entries</div>
                <div className="text-lg font-bold">
                  {currentSummary.totalEntries.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Accounts</div>
                <div className="text-lg font-bold">{currentSummary.totalAccounts}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Debits</div>
                <div className="text-lg font-bold text-blue-400">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(currentSummary.totalDebit)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Total Credits</div>
                <div className="text-lg font-bold text-green-400">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(currentSummary.totalCredit)}
                </div>
              </div>
            </div>
            {currentSummary.lastImport && (
              <div className="mt-2 text-xs text-slate-500">
                Last import: {currentSummary.lastImport.filename} on{' '}
                {new Date(currentSummary.lastImport.timestamp).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <ArrowLeftRight className="h-5 w-5 text-blue-400" aria-hidden="true" />
            <h3 className="font-semibold">Data Reconciliation</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Upload a CSV file from your source system to compare against imported data. The
            reconciliation will check account-level balances.
          </p>
          <FileDropZone
            onFile={handleRecFile}
            accept=".csv"
            aria-label="Upload reconciliation CSV file"
          />
          {recError && (
            <Alert type="error" title="Reconciliation Error" message={recError} className="mt-4" />
          )}
          {recData.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-400 mb-2">
                  {recData.length.toLocaleString()} rows loaded from {recFile?.name}. Select columns
                  to match:
                </p>
                <div className="flex gap-3 items-center">
                  <div>
                    <label htmlFor="rec-key-col" className="block text-xs text-slate-500 mb-1">
                      Account Key Column
                    </label>
                    <select
                      id="rec-key-col"
                      className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      value={recKeyCol}
                      onChange={(e) => setRecKeyCol(e.target.value)}
                      aria-label="Select account key column"
                    >
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="rec-val-col" className="block text-xs text-slate-500 mb-1">
                      Balance Column
                    </label>
                    <select
                      id="rec-val-col"
                      className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
                      value={recValCol}
                      onChange={(e) => setRecValCol(e.target.value)}
                      aria-label="Select balance column"
                    >
                      {csvHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    className="mt-5"
                    onClick={runReconciliation}
                    disabled={!recKeyCol || !recValCol}
                    aria-label="Run reconciliation"
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" aria-hidden="true" />
                    Run Reconciliation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {recResult && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Reconciliation Results</h3>
            <div
              className="grid grid-cols-3 gap-4 mb-4"
              role="group"
              aria-label="Reconciliation summary"
            >
              <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30 text-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mx-auto mb-1" aria-hidden="true" />
                <div
                  className="text-xl font-bold text-green-400"
                  aria-label={`${recResult.matching} matching`}
                >
                  {recResult.matching}
                </div>
                <div className="text-xs text-green-400/70">Matching</div>
              </div>
              <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30 text-center">
                <XCircle className="h-5 w-5 text-red-400 mx-auto mb-1" aria-hidden="true" />
                <div
                  className="text-xl font-bold text-red-400"
                  aria-label={`${recResult.mismatches} mismatches`}
                >
                  {recResult.mismatches}
                </div>
                <div className="text-xs text-red-400/70">Mismatches</div>
              </div>
              <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-800/30 text-center">
                <AlertTriangle
                  className="h-5 w-5 text-yellow-400 mx-auto mb-1"
                  aria-hidden="true"
                />
                <div
                  className="text-xl font-bold text-yellow-400"
                  aria-label={`${recResult.missing} missing`}
                >
                  {recResult.missing}
                </div>
                <div className="text-xs text-yellow-400/70">Missing</div>
              </div>
            </div>
            <div className="overflow-x-auto" aria-live="polite">
              <table className="w-full text-sm" role="grid" aria-label="Reconciliation details">
                <thead>
                  <tr
                    className="text-left text-slate-400 text-xs uppercase border-b border-slate-800"
                    role="row"
                  >
                    <th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">
                      Account Key
                    </th>
                    <th
                      scope="col"
                      className="pb-3 pr-4 text-right"
                      role="columnheader"
                      scope="col"
                    >
                      Expected (GL)
                    </th>
                    <th
                      scope="col"
                      className="pb-3 pr-4 text-right"
                      role="columnheader"
                      scope="col"
                    >
                      Actual (File)
                    </th>
                    <th
                      scope="col"
                      className="pb-3 pr-4 text-right"
                      role="columnheader"
                      scope="col"
                    >
                      Difference
                    </th>
                    <th scope="col" className="pb-3" role="columnheader" scope="col">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recResult.details
                    .filter((d) => d.expected !== 0 || d.actual !== 0)
                    .map((d) => {
                      const status =
                        d.expected === 0
                          ? 'missing'
                          : Math.abs(d.diff) < 0.01
                            ? 'match'
                            : 'mismatch';
                      return (
                        <tr
                          key={d.key}
                          className={`hover:bg-slate-900/50 ${
                            status === 'mismatch'
                              ? 'bg-red-900/10'
                              : status === 'missing'
                                ? 'bg-yellow-900/10'
                                : ''
                          }`}
                        >
                          <td className="py-3 pr-4 font-mono text-xs">{d.key}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                            }).format(d.expected)}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                            }).format(d.actual)}
                          </td>
                          <td
                            className={`py-3 pr-4 text-right tabular-nums font-medium ${
                              Math.abs(d.diff) < 0.01
                                ? 'text-slate-400'
                                : d.diff > 0
                                  ? 'text-green-400'
                                  : 'text-red-400'
                            }`}
                          >
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                              minimumFractionDigits: 0,
                              signDisplay: 'exceptZero',
                            }).format(d.diff)}
                          </td>
                          <td className="py-3">
                            {status === 'match' && (
                              <Badge variant="default" className="text-[10px]">
                                Match
                              </Badge>
                            )}
                            {status === 'mismatch' && (
                              <Badge variant="destructive" className="text-[10px]">
                                Mismatch
                              </Badge>
                            )}
                            {status === 'missing' && (
                              <Badge variant="secondary" className="text-[10px]">
                                Missing
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="ghost" aria-label="Export differences to file">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Differences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {importJobs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Database className="h-5 w-5 text-purple-400" aria-hidden="true" />
              <h3 className="font-semibold">Import Job History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="grid" aria-label="Import job history">
                <thead>
                  <tr
                    className="text-left text-slate-400 text-xs uppercase border-b border-slate-800"
                    role="row"
                  >
                    <th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">
                      File
                    </th>
                    <th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">
                      Type
                    </th>
                    <th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">
                      Rows
                    </th>
                    <th scope="col" className="pb-3 pr-4" role="columnheader" scope="col">
                      Status
                    </th>
                    <th scope="col" className="pb-3" role="columnheader" scope="col">
                      Started
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {importJobs.slice(0, 10).map((job) => (
                    <tr key={job.id} className="hover:bg-slate-900/50" role="row">
                      <td className="py-2 pr-4 font-mono text-xs" role="gridcell">
                        {job.filename}
                      </td>
                      <td className="py-2 pr-4" role="gridcell">
                        {job.fileType}
                      </td>
                      <td className="py-2 pr-4" role="gridcell">
                        {job.rowCount.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4" role="gridcell">
                        <Badge
                          variant={
                            job.status === 'Completed'
                              ? 'default'
                              : job.status === 'Failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-slate-400" role="gridcell">
                        {new Date(job.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
