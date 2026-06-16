import {
  type MigrationSource,
  type MigrationReadiness,
  type ColumnMapping,
} from '@/engines/MigrationEngine';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Globe,
  Shield,
  Upload,
} from 'lucide-react';

export type WizardStep = 'upload' | 'analyze' | 'map' | 'import' | 'verify';

interface MigrationWizardProps {
  wizardStep: WizardStep;
  detectedSource: MigrationSource;
  readiness: MigrationReadiness | null;
  columnMappings: ColumnMapping[];
  migrationProgress: number;
  migrationError: string | null;
  onFile: (file: File) => void;
  onColumnMappingChange: (sourceColumn: string, targetField: string) => void;
  onExecuteMigration: () => void;
  onRollback: () => void;
  onStepChange: (step: WizardStep) => void;
  onFileReset: () => void;
}

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

export function MigrationWizard({
  wizardStep,
  detectedSource,
  readiness,
  columnMappings,
  migrationProgress,
  migrationError,
  onFile,
  onColumnMappingChange,
  onExecuteMigration,
  onRollback,
  onStepChange,
  onFileReset,
}: MigrationWizardProps) {
  return (
    <div className="p-4">
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
            onFile={onFile}
            accept=".xlsx,.xls,.csv"
            aria-label="Upload file for migration"
          />
          {migrationError && (
            <Alert type="error" title="Migration Error" message={migrationError} className="mt-4" />
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

          <div>
            <h4 className="text-sm font-medium mb-2">Column Mappings</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Data migration preview">
                <caption className="sr-only">Detailed data migration preview</caption>
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
                          onChange={(e) => onColumnMappingChange(m.sourceColumn, e.target.value)}
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
                onStepChange('upload');
                onFileReset();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={onExecuteMigration}
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
            <p className="text-slate-400">Importing data from {sourceLabel(detectedSource)}...</p>
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
            <Button variant="ghost" onClick={onRollback} aria-label="Rollback migration">
              <XCircle className="h-4 w-4 mr-2" />
              Rollback
            </Button>
            <Button onClick={() => onStepChange('upload')} aria-label="Import another file">
              <Upload className="h-4 w-4 mr-2" />
              Import Another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
