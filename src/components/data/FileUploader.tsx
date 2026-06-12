/* eslint-disable react/no-unescaped-entities */
import { useState, useCallback, useEffect, useRef } from 'react';

import { FileDropZone } from '@/components/ui/FileDropZone';
import { Button } from '@/components/ui/Button';
import {
  ImportEngine,
  type ImportValidationResult,
  type ImportProgress,
  type ImportSnapshot,
} from '@/engines/ImportEngine';
import { CheckCircle2, AlertCircle, RotateCcw, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileUploaderProps {
  onImport?: (data: Record<string, unknown>[], columns: string[]) => void;
  requiredColumns?: string[];
  numericColumns?: string[];
  dateColumns?: string[];
  maxRows?: number;
}

export function FileUploader({
  onImport,
  requiredColumns,
  numericColumns,
  dateColumns,
  maxRows,
}: FileUploaderProps) {
  const engineRef = useRef(new ImportEngine());
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle',
    percent: 0,
    message: '',
  });
  const [result, setResult] = useState<ImportValidationResult | null>(null);
  const [snapshot, setSnapshot] = useState<ImportSnapshot | null>(null);
  const [history, setHistory] = useState<ImportSnapshot[]>([]);

  useEffect(() => {
    const engine = engineRef.current;
    const unsub = engine.onProgress(setProgress);
    setHistory(engine.getSnapshots());
    return unsub;
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      setResult(null);
      setSnapshot(null);

      const engine = engineRef.current;
      const { result: importResult, snapshot: importSnapshot } = await engine.importFile(file, {
        requiredColumns,
        numericColumns,
        dateColumns,
        maxRows,
      });

      setResult(importResult);
      setSnapshot(importSnapshot);
      setHistory(engine.getSnapshots());
    },
    [requiredColumns, numericColumns, dateColumns, maxRows]
  );

  const handleConfirm = useCallback(() => {
    if (result && result.valid && onImport) {
      onImport(result.preview, result.columns);
      if (snapshot) {
        setSnapshot({ ...snapshot, applied: true });
        setHistory(engineRef.current.getSnapshots());
      }
    }
  }, [result, snapshot, onImport]);

  const handleRollback = useCallback((snapshotId: string) => {
    const engine = engineRef.current;
    engine.rollback(snapshotId);
    setHistory(engine.getSnapshots());
    setResult(null);
    setSnapshot(null);
  }, []);

  const hasErrors = result ? result.errors.length > 0 : false;
  const hasWarnings = result ? result.warnings.length > 0 : false;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Drop Zone */}
      <FileDropZone onFile={handleFile} accept=".csv,.xlsx,.xls,.json" />

      {/* Progress Bar */}
      {progress.status !== 'idle' &&
        progress.status !== 'complete' &&
        progress.status !== 'error' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>{progress.message}</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="h-2 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

      {/* Error Display */}
      {progress.status === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          {' '}
          role="alert" role="alert"
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-500">Import Failed</p>
            <p className="text-xs text-red-400 mt-1">{progress.message}</p>
          </div>
        </div>
      )}

      {/* Validation Result Summary */}
      {result && (
        <div
          className={cn(
            'p-4 rounded-lg border',
            hasErrors
              ? 'bg-red-500/10 border-red-500/30'
              : hasWarnings
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-green-500/10 border-green-500/30'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {hasErrors ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : hasWarnings ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <span className="font-bold text-sm">
              {result.rowCount} rows, {result.columnCount} columns
            </span>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.errors.slice(0, 5).map((err, i) => (
                <p key={i} className="text-xs text-red-400">
                  Row {err.row}: {err.message}
                </p>
              ))}
              {result.errors.length > 5 && (
                <p className="text-xs text-red-400">
                  ...and {result.errors.length - 5} more errors
                </p>
              )}
            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {result.warnings.slice(0, 3).map((warn, i) => (
                <p key={i} className="text-xs text-yellow-400">
                  Row {warn.row}: {warn.message}
                </p>
              ))}
              {result.warnings.length > 3 && (
                <p className="text-xs text-yellow-400">
                  ...and {result.warnings.length - 3} more warnings
                </p>
              )}
            </div>
          )}

          {/* Confirm Button */}
          <div className="mt-3 flex gap-2">
            <Button onClick={handleConfirm} disabled={hasErrors} size="sm">
              {hasErrors ? 'Fix Errors to Continue' : 'Confirm & Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Import History (Rollback) */}
      {history.length > 0 && (
        <div className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            Import History
          </h4>
          <div className="space-y-2">
            {history
              .slice(-5)
              .reverse()
              .map((snap) => (
                <div key={snap.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
                    <span className="text-[var(--text-primary)]">{snap.fileName}</span>
                    <span className="text-[var(--text-secondary)]">
                      {snap.rowCount} rows &middot; {snap.columns.length} cols
                    </span>
                    {snap.applied && <span className="text-green-500 font-bold">Applied</span>}
                  </div>
                  {!snap.applied && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRollback(snap.id)}
                      className="h-6 px-2"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
