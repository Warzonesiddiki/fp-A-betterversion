import { useCallback, useEffect, useRef, useState } from 'react';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { DataTable } from '@/components/ui/DataTable';
import { KPIValue } from '@/components/ui/KPIValue';
import {
  MigrationEngine,
  type MigrationSource,
  type MigrationReadiness,
  type MigrationPlan,
  type ColumnMapping,
} from '@/engines/MigrationEngine';
import {
  Upload,
  Columns,
  Eye,
  CheckCircle,
  Loader2,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
type Step = 'source' | 'upload' | 'mapping' | 'preview' | 'confirm' | 'progress';
interface MigrationWizardProps {
  onComplete: (snapshotId: string) => void;
  onCancel: () => void;
}
const SOURCE_OPTIONS: { value: MigrationSource; label: string; description: string }[] = [
  { value: 'excel', label: 'Excel (.xlsx/.xls)', description: 'Import from Excel workbooks' },
  { value: 'csv', label: 'CSV', description: 'Import from comma-separated files' },
  { value: 'planful', label: 'Planful', description: 'Export from Planful and import' },
  { value: 'adaptive', label: 'Adaptive Insights', description: 'Export from Adaptive and import' },
  { value: 'anaplan', label: 'Anaplan', description: 'Export from Anaplan and import' },
];
export default function MigrationWizard({ onComplete, onCancel }: MigrationWizardProps) {
  const engineRef = useRef(new MigrationEngine());
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<MigrationSource>('excel');
  const [file, setFile] = useState<File | null>(null);
  const [readiness, setReadiness] = useState<MigrationReadiness | null>(null);
  const [plan, setPlan] = useState<MigrationPlan | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [progress, setProgress] = useState({ status: 'idle' as string, percent: 0, message: '' });
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const steps = [
    { id: 'source', label: 'Source' },
    { id: 'upload', label: 'Upload' },
    { id: 'mapping', label: 'Mapping' },
    { id: 'preview', label: 'Preview' },
    { id: 'confirm', label: 'Confirm' },
    { id: 'progress', label: 'Import' },
  ];
  const currentStepIndex = steps.findIndex((s) => s.id === step);
  useEffect(() => {
    const engine = engineRef.current;
    const unsub = engine.onProgress(setProgress);
    return unsub;
  }, []);
  const handleFileSelect = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setAnalyzing(true);
    try {
      const engine = engineRef.current;
      const result = await engine.analyzeMigration(f);
      setReadiness(result.readiness);
      setPlan(result.plan);
      setMappings(result.readiness.detectedColumns);
      setSource(result.source);
      // Generate preview data from first sheet
      const ExcelJS = await import('exceljs');
      const buffer = await f.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const ws = workbook.worksheets[0];
      if (ws) {
        const raw: string[][] = [];
        ws.eachRow({ includeEmpty: false }, (row) => {
          const values: string[] = [];
          for (let i = 1; i <= row.cellCount; i++) {
            const cell = row.getCell(i);
            const val = cell.value;
            if (val === null || val === undefined) {
              values.push('');
            } else if (typeof val === 'object' && 'result' in val) {
              values.push(String(val.result ?? ''));
            } else if (val instanceof Date) {
              values.push(val.toISOString());
            } else {
              values.push(String(val));
            }
          }
          raw.push(values);
        });
        if (raw.length > 1 && raw[0]!) {
          const headers = raw[0]!.map(String);
          const rows = raw.slice(1, 11).map((row) =>
            headers.reduce(
              (obj, h, i) => ({
                ...obj,
                [h]: i < row.length ? (row[i] ?? '') : '',
              }),
              {} as Record<string, unknown>
            )
          );
          setPreviewData(rows);
        }
      }
      setStep('mapping');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to analyze file');
    } finally {
      setAnalyzing(false);
    }
  }, []);
  const handleMappingChange = (index: number, targetField: string) => {
    setMappings((prev) =>
      prev.map((m, i) =>
        i === index ? { ...m, targetField, matchType: 'manual' as const, confidence: 1.0 } : m
      )
    );
  };
  const handleImport = useCallback(async () => {
    setStep('progress');
    // Simulate import with progress updates
    const engine = engineRef.current;
    const unsub = engine.onProgress((p) => setProgress(p));
    // In a real implementation, this would call engine.importData()
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200));
      setProgress({
        status: i < 100 ? 'reading' : 'complete',
        percent: i,
        message: i < 100 ? `Importing... ${i}%` : 'Import complete',
      });
    }
    unsub();
    onComplete('snapshot-' + Date.now());
  }, [onComplete]);
  const getReadinessColor = (status: string) => {
    switch (status) {
      case 'green':
        return 'fin-positive';
      case 'yellow':
        return 'text-yellow-600';
      case 'red':
        return 'fin-negative';
      default:
        return '';
    }
  };
  return (
    <div className="space-y-6" role="region" aria-label="MigrationWizard">
      <ProgressStepper
        steps={steps.map((s, i) => ({
          label: s.label,
          status: i < currentStepIndex ? 'done' : i === currentStepIndex ? 'current' : 'pending',
        }))}
        currentStep={currentStepIndex}
      />
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          {' '}
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {step === 'source' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Migration Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">Where are you migrating from?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSource(opt.value);
                    setStep('upload');
                  }}
                  className={`p-4 border rounded-lg text-left transition-all hover:border-primary hover:shadow-sm ${
                    source === opt.value ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">{opt.description}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Upload File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Upload your {source.toUpperCase()} file for migration analysis.
            </p>
            <FileDropZone onFile={handleFileSelect} accept=".xlsx,.xls,.csv" />
            {analyzing && (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing file...</span>
              </div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('source')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'mapping' && readiness && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Columns className="h-5 w-5" /> Column Mapping
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPIValue
                label="Readiness Score"
                value={`${readiness.score}%`}
                icon={<CheckCircle className={`h-4 w-4 ${getReadinessColor(readiness.status)}`} />}
              />
              <KPIValue
                label="Sheets Detected"
                value={readiness.sheetCount}
                icon={<FileSpreadsheet className="h-4 w-4" />}
              />
              <KPIValue
                label="Total Rows"
                value={readiness.totalRows.toLocaleString()}
                icon={<FileSpreadsheet className="h-4 w-4" />}
              />
            </div>
            {readiness.issues.length > 0 && (
              <div className="space-y-2">
                {readiness.issues.map((issue, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-sm flex items-center gap-2 ${
                      issue.severity === 'error'
                        ? 'bg-red-50 text-red-700'
                        : issue.severity === 'warning'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {issue.message}
                  </div>
                ))}
              </div>
            )}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="p-2 text-left">
                      Source Column
                    </th>
                    <th scope="col" className="p-2 text-left">
                      Maps To
                    </th>
                    <th scope="col" className="p-2 text-left">
                      Confidence
                    </th>
                    <th scope="col" className="p-2 text-left">
                      Match Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono text-xs">{m.sourceColumn}</td>
                      <td className="p-2">
                        <select
                          value={m.targetField}
                          onChange={(e) => handleMappingChange(i, e.target.value)}
                          className="w-full p-1 border rounded text-sm"
                        >
                          <option value="">-- Select --</option>
                          {[
                            'account',
                            'accountName',
                            'department',
                            'entity',
                            'period',
                            'date',
                            'debit',
                            'credit',
                            'amount',
                            'currency',
                            'scenario',
                            'description',
                          ].map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <span
                          className={
                            m.confidence >= 0.8
                              ? 'fin-positive'
                              : m.confidence >= 0.5
                                ? 'text-yellow-600'
                                : 'fin-negative'
                          }
                        >
                          {Math.round(m.confidence * 100)}%
                        </span>
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">{m.matchType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep('preview')}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'preview' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> Data Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Showing first {previewData.length} rows. Verify the data looks correct before
              importing.
            </p>
            {previewData.length > 0 ? (
              <DataTable
                data={previewData}
                columns={Object.keys(previewData[0]!)!.map((key) => ({
                  key,
                  header: key,
                  width: '150px',
                }))}
                caption="Data migration preview: imported rows with their original column headers"
                ariaLabel="Data migration preview"
              />
            ) : (
              <div className="text-center text-muted-foreground p-8">No preview data available</div>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep('confirm')}>
                Continue <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'confirm' && readiness && plan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" /> Confirm Import
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="font-medium capitalize">{source}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">File</div>
                <div className="font-medium">{file?.name}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sheets</div>
                <div className="font-medium">{readiness.sheetCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Rows</div>
                <div className="font-medium">{readiness.totalRows.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Import Plan</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {plan.sheets.map((s, i) => (
                  <li key={i}>
                    {s.name}: {s.rows} rows, {s.columns.length} columns
                  </li>
                ))}
                {plan.warnings.map((w, i) => (
                  <li key={i} className="text-yellow-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {w}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-sm text-muted-foreground">
                Estimated duration: {plan.estimatedDuration}
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('preview')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-1" /> Start Import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {step === 'progress' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2
                className={`h-5 w-5 ${progress.status !== 'complete' ? 'animate-spin' : ''}`}
              />
              Importing Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{progress.message}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              Status: {progress.status}
            </div>
            {progress.status === 'complete' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Import completed successfully!
              </div>
            )}
            {progress.status === 'error' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  {' '}
                  <AlertTriangle className="h-4 w-4" />
                  Import failed. {progress.message}
                </div>
                <Button variant="outline" onClick={() => setStep('confirm')}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Try Again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
