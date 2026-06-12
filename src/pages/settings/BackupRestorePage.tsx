/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/settingsStore';
import { BackupRestore, type BackupData } from '@/utils/backupRestore';
import {
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  Clock,
  FileJson,
  AlertTriangle,
  CheckCircle,
  HardDrive,
} from 'lucide-react';
import { FinPlanFileEngine } from '@/engines/FinPlanFileEngine';

export default function BackupRestorePage() {
  const { organization } = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    errors: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'FinPlan Pro - Backup & Restore';
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await BackupRestore.exportBackup();
      setLastBackupDate(new Date().toISOString());
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);
    try {
      const result = await BackupRestore.importBackup(file);
      setImportResult(result);
      if (result.success) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        'This will permanently delete ALL local data including budgets, forecasts, scenarios, and settings. This cannot be undone. Continue?'
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <main
      className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in"
      role="main"
      aria-label="Backup and restore page"
    >
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white">Backup & Restore</h1>
        <p className="text-slate-400 text-sm">
          Export, import, and manage your local data for {organization.name || 'your organization'}.
        </p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-blue-400 shrink-0" />
            <div>
              <div className="text-sm text-slate-400">Storage Mode</div>
              <div className="font-medium text-white">Local (IndexedDB)</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <div className="text-sm text-slate-400">Last Backup</div>
              <div className="font-medium text-white">
                {lastBackupDate ? new Date(lastBackupDate).toLocaleString() : 'No recent backup'}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-violet-400 shrink-0" />
            <div>
              <div className="text-sm text-slate-400">Integrity</div>
              <div className="font-medium text-white">SHA-256 Checksum</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-400" />
            Export Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Generate a portable JSON file containing all your local records, settings, and imported
            data. The file includes a SHA-256 checksum for integrity verification.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
            aria-label="Download backup file"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Download Backup'}
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-green-400" />
            Restore Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Import a previously exported JSON file. The backup will be verified against its checksum
            before restoring. <strong>This will merge with existing data.</strong>
          </p>
          <div className="relative inline-block">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Select backup file to restore"
            />
            <Button
              variant="secondary"
              disabled={isImporting}
              className="w-full sm:w-auto"
              aria-label="Upload backup file"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isImporting ? 'Importing...' : 'Upload Backup File'}
            </Button>
          </div>

          {importResult && (
            <div
              className={`p-4 rounded-lg border ${
                importResult.success
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
              role="alert"
            >
              <div className="flex items-center gap-2 mb-1">
                {importResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                )}
                <span
                  className={`font-medium text-sm ${
                    importResult.success ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {importResult.success
                    ? 'Backup restored successfully. Reloading...'
                    : 'Import failed'}
                </span>
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-xs text-slate-400">
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-400">
            Completely wipe all locally stored data including budgets, forecasts, scenarios,
            settings, and imported GL data. <strong>This action is irreversible.</strong>
          </p>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="text-red-500 hover:bg-red-500/10 hover:text-red-400 border border-red-500/20"
            aria-label="Reset application - this will delete all local data"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset Application
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
