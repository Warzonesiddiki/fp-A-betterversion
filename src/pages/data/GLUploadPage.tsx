import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { PageHeader } from '@/components/ui/PageHeader';

import { useNavigate } from 'react-router-dom';
import { useGLStore } from '@/store/glStore';
import { FileDropZone } from '@/components/ui/FileDropZone';
import { GLColumnMapper } from '@/components/data/GLColumnMapper';
import { GLDataPreview } from '@/components/data/GLDataPreview';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ExcelImportEngine } from '@/engines/ExcelImportEngine';
import { hasDuplicateHeaders, parseCSV } from '@/utils/csv';
import { parseFinancialAmount } from '@/utils/parseFinancialAmount';
import { parseImportDate } from '@/utils/parseImportDate';
import type { GLEntry } from '@/types';
import {
  CheckCircle2,
  Upload,
  FileText,
  AlertCircle,
  RefreshCw,
  Undo2,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
} from 'lucide-react';

const excelEngine = new ExcelImportEngine();

function _mappingsToArray(
  mappings: Record<string, string>
): { sourceColumn: string; targetField: string; isRequired: boolean }[] {
  const requiredFields = ['accountCode', 'postDate'];
  return Object.entries(mappings).map(([targetField, sourceColumn]) => ({
    sourceColumn,
    targetField,
    isRequired: requiredFields.includes(targetField),
  }));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round((bytes / 1024) * 10) / 10} KB`;
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
}

export default function GLUploadPage() {
  const [_helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    document.title = 'FinPlan Pro — G L Upload';
  }, []);

  const {
    entries,
    importProgress,
    importStatus,
    importError,
    importHistory,
    setImportProgress,
    setImportStatus,
    setImportError,
    undoLastImport,
  } = useGLStore(
    useShallow((s) => ({
      entries: s.entries,
      importProgress: s.importProgress,
      importStatus: s.importStatus,
      importError: s.importError,
      importHistory: s.importHistory,
      setImportProgress: s.setImportProgress,
      setImportStatus: s.setImportStatus,
      setImportError: s.setImportError,
      undoLastImport: s.undoLastImport,
    }))
  );

  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [importedRowCount, setImportedRowCount] = useState(0);
  const [importedErrorCount, setImportedErrorCount] = useState(0);

  const resetWizard = useCallback(() => {
    setStep(0);
    setCurrentFile(null);
    setRawData([]);
    setCsvColumns([]);
    setMappings({});
    setImportError(null);
    setImportStatus('idle');
    setImportProgress(0);
    setImportedRowCount(0);
    setImportedErrorCount(0);
  }, [setImportError, setImportStatus, setImportProgress]);

  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  const handleFile = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
        setImportError('Unsupported file type. Please upload .csv, .xlsx, or .xls files.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setImportError('File too large. Maximum size is 50MB.');
        return;
      }
      setImportStatus('parsing');
      setImportError(null);
      setCurrentFile(file);

      try {
        if (ext === 'csv') {
          const text = await file.text();
          const { headers, rows: data } = parseCSV(text);
          if (headers.length === 0 || data.length === 0) {
            setImportError(
              'File contains no data. The file must have a header row and at least one data row.'
            );
            setImportStatus('idle');
            return;
          }
          if (hasDuplicateHeaders(headers)) {
            setImportError(
              'Duplicate column headers detected. Each column must have a unique name.'
            );
            setImportStatus('idle');
            return;
          }
          if (data.length === 0) {
            setImportError('No data rows found after the header. Please check your file.');
            setImportStatus('idle');
            return;
          }
          if (data.length > 100000) {
            setImportError(
              `File has ${data.length.toLocaleString()} rows. Maximum supported is 100,000 rows per import.`
            );
            setImportStatus('idle');
            return;
          }
          setCsvColumns(headers);
          setRawData(data);
          setSheetNames([]);
          setSelectedSheet('');
          setImportStatus('idle');
          setStep(1);
        } else {
          // Excel parsing via ExcelImportEngine
          const workbook = await excelEngine.parseFile(file);
          if (workbook.sheets.length === 0) {
            setImportError('No sheets found in the Excel file.');
            setImportStatus('idle');
            return;
          }
          const names = workbook.sheets.map((s) => s.name);
          setSheetNames(names);

          // Use first sheet with data, or first sheet
          const activeSheet = workbook.sheets.find((s) => s.rowCount > 0) || workbook.sheets[0];
          setSelectedSheet(activeSheet!.name);

          if (activeSheet!.rowCount === 0) {
            setImportError(`Sheet "${activeSheet!.name}" contains no data rows.`);
            setImportStatus('idle');
            return;
          }
          if (activeSheet!.rowCount > 100000) {
            setImportError(
              `Sheet has ${activeSheet!.rowCount.toLocaleString()} rows. Maximum supported is 100,000 rows per import.`
            );
            setImportStatus('idle');
            return;
          }

          // Convert to string rows for compatibility with existing mapper
          const stringRows: Record<string, string>[] = activeSheet!.rows.map((row) => {
            const stringRow: Record<string, string> = {};
            for (const h of activeSheet!.headers) {
              const val = row[h];
              stringRow[h] = val === null || val === undefined ? '' : String(val);
            }
            return stringRow;
          });

          setCsvColumns(activeSheet!.headers);
          setRawData(stringRows);
          setImportStatus('idle');
          setStep(1);
        }
      } catch (e: unknown) {
        setImportError(`Failed to parse file: ${e instanceof Error ? e.message : String(e)}`);
        setImportStatus('idle');
      }
    },
    [setImportError, setImportStatus]
  );

  const handleSheetChange = useCallback(
    async (sheetName: string) => {
      if (!currentFile) return;
      setSelectedSheet(sheetName);
      setImportStatus('parsing');
      setImportError(null);

      try {
        const workbook = await excelEngine.parseFile(currentFile);
        const sheet = workbook.sheets.find((s) => s.name === sheetName);
        if (!sheet) {
          setImportError(`Sheet "${sheetName}" not found.`);
          setImportStatus('idle');
          return;
        }
        if (sheet.rowCount === 0) {
          setImportError(`Sheet "${sheetName}" contains no data rows.`);
          setImportStatus('idle');
          return;
        }

        const stringRows: Record<string, string>[] = sheet.rows.map((row) => {
          const stringRow: Record<string, string> = {};
          for (const h of sheet.headers) {
            const val = row[h];
            stringRow[h] = val === null || val === undefined ? '' : String(val);
          }
          return stringRow;
        });

        setCsvColumns(sheet.headers);
        setRawData(stringRows);
        setImportStatus('idle');
      } catch (e: unknown) {
        setImportError(`Failed to read sheet: ${e instanceof Error ? e.message : String(e)}`);
        setImportStatus('idle');
      }
    },
    [currentFile, setImportError, setImportStatus]
  );

  const handleAutoMap = useCallback((newMappings: Record<string, string>) => {
    setMappings(newMappings);
  }, []);

  const handleMap = useCallback((field: string, csvCol: string) => {
    setMappings((prev) => {
      const next = { ...prev };
      if (csvCol) {
        next[field] = csvCol;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  const handlePreview = useCallback(() => {
    if (!mappings.accountCode || !mappings.postDate) {
      setImportError(
        'Account Code and Posting Date are required fields. Please map them before continuing.'
      );
      return;
    }
    setStep(2);
  }, [mappings, setImportError]);

  const handleImport = useCallback(() => {
    setImportStatus('importing');
    setImportProgress(0);

    // W6-P0-09/P0-10: strict per-row coercion. Amounts go through
    // parseFinancialAmount (bare parseFloat truncated "1,234.56" to 1) and
    // dates through parseImportDate (raw cells produced garbage periods).
    // Broken rows are excluded from the import and reported via the existing
    // importError channel — never silently stored.
    const rowErrors: string[] = [];
    const parsedEntries: Partial<GLEntry>[] = [];

    rawData.forEach((row, idx) => {
      const rowNum = idx + 2; // header occupies row 1 of the source file
      const getVal = (field: string) => row[mappings[field]!];

      const accountCode = getVal('accountCode') || '';
      if (!accountCode) rowErrors.push(`Row ${rowNum}: missing accountCode`);

      const rawDate = String(getVal('postDate') ?? '').trim();
      const postDate = parseImportDate(rawDate);
      if (!postDate) {
        rowErrors.push(`Row ${rowNum}: unparseable posting date "${rawDate}"`);
      }

      const parseCellAmount = (field: string): number => {
        if (!mappings[field]) return 0;
        const cell = String(getVal(field) ?? '').trim();
        if (cell === '') return 0;
        const value = parseFinancialAmount(cell);
        if (Number.isNaN(value)) {
          rowErrors.push(`Row ${rowNum}: unparseable ${field} amount "${cell}"`);
          return Number.NaN;
        }
        return value;
      };
      const debit = parseCellAmount('debit');
      const credit = parseCellAmount('credit');

      if (!accountCode || !postDate || Number.isNaN(debit) || Number.isNaN(credit)) return;

      const period = postDate.slice(0, 7); // canonical YYYY-MM
      parsedEntries.push({
        id: '',
        accountId: accountCode,
        accountCode,
        accountName: accountCode,
        period,
        periodName: period,
        debit,
        credit,
        netChange: 0,
        amount: 0,
        date: postDate,
        postDate,
        description: getVal('description') || '',
        reference: getVal('reference') || '',
        entityId: getVal('entityId') || '',
        departmentId: getVal('departmentId') || '',
      });
    });

    if (parsedEntries.length === 0) {
      setImportError(
        rowErrors.length > 0
          ? `No valid rows found. ${rowErrors.slice(0, 5).join('; ')}`
          : 'No valid rows found. All rows are missing required fields (accountCode + date).'
      );
      return;
    }

    // Use the new robust high-level import action
    const result = useGLStore.getState().importGLData(parsedEntries, currentFile?.name);

    if (!result.success) {
      setImportError(
        'Import failed: ' + (result.errors ? 'validation/duplicates issues' : 'unknown')
      );
      setImportStatus('error');
      return;
    }

    // Simulate nice progress bar
    let progress = 0;
    const interval = setInterval(() => {
      progress = Math.min(progress + 18, 100);
      setImportProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setImportedRowCount(result.imported || 0);
        setImportedErrorCount((result.errors || 0) + rowErrors.length);
        setImportStatus('complete');
        setStep(4);
        // Surface coercion errors only after the final status transition:
        // the store's setImportStatus('complete') clears importError.
        if (rowErrors.length > 0) {
          setImportError(rowErrors.slice(0, 5).join('; '));
        }
      }
    }, 40);
  }, [rawData, mappings, currentFile, setImportStatus, setImportProgress, setImportError]);

  const getStepStatus = (index: number): 'done' | 'current' | 'pending' => {
    if (step > index) return 'done';
    if (step === index) return 'current';
    return 'pending';
  };

  const steps = useMemo(
    () => [
      { label: 'Upload', status: getStepStatus(0), description: 'Select your file' },
      { label: 'Map', status: getStepStatus(1), description: 'Match columns' },
      { label: 'Preview', status: getStepStatus(2), description: 'Validate data' },
      { label: 'Import', status: getStepStatus(3), description: 'Processing' },
      { label: 'Done', status: getStepStatus(4), description: 'Complete' },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step]
  );

  if (importStatus === 'parsing' || importStatus === 'validating') {
    return (
      <div className="p-12 text-center">
        <Skeleton
          variant="rectangular"
          width="60%"
          height="2rem"
          className="mx-auto mb-6"
          srLabel="Loading GL upload…"
        />
        <Skeleton variant="rectangular" width="80%" height="16rem" className="mx-auto mb-4" />
        <p className="text-sm text-[var(--text-muted)] mt-4">
          {importStatus === 'parsing' ? 'Reading file contents...' : 'Validating data structure...'}
        </p>
      </div>
    );
  }

  if (importStatus === 'importing') {
    return (
      <div className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse mb-6">
            <Database className="h-12 w-12 text-blue-600 mx-auto" />
          </div>
          <h2 className="text-lg font-semibold mb-4">Importing records...</h2>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-2">{importProgress}% complete</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Processing {rawData.length.toLocaleString()} rows...
          </p>
        </div>
      </div>
    );
  }

  if (importError && entries.length === 0 && step === 0) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <Alert type="error" title="Import Failed" message={importError} />
        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={resetWizard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="secondary" onClick={() => navigate('/data')}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (entries.length === 0 && importStatus === 'idle' && importHistory.length === 0 && step === 0) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <div className="mb-6">
          <div className="p-4 bg-blue-50 rounded-full inline-block">
            <Upload className="h-10 w-10 text-blue-600" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Import Your Financial Data</h2>
        <p className="text-[var(--text-muted)] mb-6">
          Upload Excel or CSV files to load your General Ledger. Once imported, your data will
          appear in reports, dashboards, and budgets — all stored locally, nothing leaves your
          computer.
        </p>
        <FileDropZone onFile={handleFile} accept=".csv,.xlsx,.xls" />
        <div className="flex gap-4 justify-center mt-4 text-xs text-[var(--text-muted)]">
          <span>Max: 50MB</span>
          <span>Formats: CSV, XLSX, XLS</span>
          <span>All data stays on your machine</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Data Import"
            actions={
              <button
                onClick={() => setHelpOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
                aria-label="Help"
              ></button>
            }
          />
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {currentFile
              ? `${currentFile.name} (${formatFileSize(currentFile.size)})`
              : 'Import financial data from CSV or Excel files'}
          </p>
        </div>
        <div className="flex gap-2">
          {step > 0 && step < 4 && (
            <Button variant="ghost" onClick={resetWizard}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/data')}>
            Back to Data
          </Button>
        </div>
      </div>

      <ProgressStepper steps={steps} currentStep={step} />

      {step === 0 && importHistory.length > 0 && (
        <div className="text-center py-12">
          <FileDropZone onFile={handleFile} accept=".csv,.xlsx,.xls" />
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Map Columns</h3>
              <div className="flex items-center gap-3">
                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-400" />
                    <select
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white"
                      value={selectedSheet}
                      onChange={(e) => handleSheetChange(e.target.value)}
                    >
                      {sheetNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <span className="text-xs text-[var(--text-muted)]">
                  {csvColumns.length} columns detected
                </span>
              </div>
            </div>
            {csvColumns.length > 0 && (
              <GLColumnMapper
                csvColumns={csvColumns}
                mappings={mappings}
                onMap={handleMap}
                onAutoMap={handleAutoMap}
              />
            )}
            {csvColumns.length === 0 && (
              <div className="text-center py-8 bg-[var(--bg-elevated)] rounded-lg border border-dashed border-[var(--border-default)]">
                <AlertCircle className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-[var(--text-secondary)]">
                  No columns detected. Please upload a valid CSV file.
                </p>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!mappings.accountCode || !mappings.postDate}
              >
                Preview Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Preview & Validate</h3>
              <span className="text-xs text-[var(--text-muted)]">
                {rawData.length.toLocaleString()} total rows
              </span>
            </div>
            <GLDataPreview
              data={rawData}
              mappings={mappings}
              onConfirm={handleImport}
              onCancel={() => setStep(1)}
            />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent>
            <div className="text-center py-6">
              <div className="p-4 bg-green-50 rounded-full inline-block mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {importedErrorCount > 0 ? 'Import Completed with Warnings' : 'Import Complete'}
              </h2>
              <p className="text-[var(--text-muted)] mb-6">
                Successfully imported {importedRowCount.toLocaleString()} rows
                {importedErrorCount > 0 && ` with ${importedErrorCount} warnings`}.
              </p>
              <div className="flex gap-3 justify-center mb-8">
                <Button variant="outline" onClick={resetWizard}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Another
                </Button>
                <Button variant="outline" onClick={() => navigate('/data')}>
                  <Database className="h-4 w-4 mr-2" />
                  View Data
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {importHistory.length > 0 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold mb-3">Import History</h3>
            {importHistory.length === 0 ? (
              <p className="text-[var(--text-muted)] text-center py-4">No imports yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="GL upload preview">
                  <caption className="sr-only">Detailed gl upload preview</caption>
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] text-xs uppercase">
                      <th scope="col" className="pb-3 pr-4">
                        File Name
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Rows
                      </th>
                      <th scope="col" className="pb-3 pr-4 text-right">
                        Errors
                      </th>
                      <th scope="col" className="pb-3 pr-4">
                        Status
                      </th>
                      <th scope="col" className="pb-3 pr-4">
                        Date
                      </th>
                      <th scope="col" className="pb-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {importHistory.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-900/50">
                        <td className="py-3 pr-4 max-w-[200px] truncate" title={h.filename}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                            <span>{h.filename}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">
                          {h.rowCount.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right tabular-nums">{h.errorCount}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              h.status === 'success'
                                ? 'default'
                                : h.status === 'partial'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {h.status === 'success'
                              ? 'Success'
                              : h.status === 'partial'
                                ? 'Partial'
                                : 'Failed'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-400">
                          {new Date(h.timestamp).toLocaleDateString()}{' '}
                          {new Date(h.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => undoLastImport()}
                            title="Remove all entries from this import"
                          >
                            <Undo2 className="h-3 w-3 mr-1" />
                            Undo
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {importError && step > 0 && <Alert type="error" title="Import Error" message={importError} />}
    </div>
  );
}
