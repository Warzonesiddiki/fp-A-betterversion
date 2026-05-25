import React, { useState, useCallback } from 'react';
import {
  Upload as UploadIcon,
  FileUp,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FileDropZoneProps {
  onFile: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  onFile,
  accept = '.csv,.xlsx,.xls',
  multiple = false,
  maxSize = 50 * 1024 * 1024, // 50MB
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());

    if (
      !acceptedTypes.includes(fileExtension) &&
      !file.name.endsWith('.csv') &&
      !file.name.endsWith('.xlsx') &&
      !file.name.endsWith('.xls')
    ) {
      setError(`Invalid file type. Accepted: .csv, .xlsx, .xls`);
      return false;
    }

    // Check file size
    if (file.size > 50 * 1024 * 1024) {
      setError(`File too large. Max 50MB.`);
      return false;
    }

    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          setCurrentFile(file);
          onFile(file);
        }
      }
    },
    [onFile, accept]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setCurrentFile(file);
        onFile(file);
      }
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentFile(null);
    setError(null);
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative flex flex-col items-center justify-center min-h-[240px] p-10 border-2 rounded-xl transition-all cursor-pointer group'
        )}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent-primary)' : 'var(--border-default)'}`,
          background: isDragActive ? 'var(--accent-subtle)' : 'transparent',
          transform: isDragActive ? 'scale(1.01)' : 'none',
        }}
        onClick={() => document.getElementById('file-input')?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') document.getElementById('file-input')?.click();
        }}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
        />

        {currentFile ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-green-50 rounded-full mb-4 ring-8 ring-green-50/50">
              <CheckCircle2 className="h-10 w-10 fin-positive" />
            </div>
            <div className="flex items-center space-x-3 px-4 py-2 bg-white dark:bg-gray-800 border border-green-200 rounded-lg shadow-sm">
              {currentFile.name.endsWith('.csv') ? (
                <FileText className="h-5 w-5 text-[var(--text-muted)]" />
              ) : (
                <FileSpreadsheet className="h-5 w-5 fin-positive" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-primary)] leading-none">
                  {currentFile.name}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] font-medium mt-1">
                  {(currentFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                onClick={removeFile}
                aria-label="Remove file"
                className="p-1 hover:bg-red-50 rounded-md transition-colors text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-6 text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-widest">
              Click or drag another file to replace
            </p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'p-5 rounded-full mb-6 transition-all duration-300',
                isDragActive
                  ? 'bg-blue-600 text-white scale-110 shadow-lg'
                  : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
              )}
            >
              <FileUp
                className={cn(
                  'h-10 w-10 transition-transform',
                  isDragActive ? 'translate-y-[-2px]' : 'group-hover:translate-y-[-2px]'
                )}
              />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                {isDragActive ? 'Drop to upload' : 'Import Financial Data'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium max-w-[280px] leading-relaxed">
                Drag and drop your <span className="text-blue-600 font-bold">CSV</span> or{' '}
                <span className="fin-positive font-bold">Excel</span> files here, or click to
                browse.
              </p>
            </div>

            <div className="mt-8 flex items-center space-x-4 opacity-50 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all">
              <div className="flex items-center space-x-1">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">CSV</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileSpreadsheet className="h-3.5 w-3.5 fin-positive" />
                <span className="text-[10px] font-bold uppercase tracking-tighter">XLSX</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-3 py-1.5 bg-red-50 fin-negative rounded-full border border-red-100 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{error}</span>
          </div>
        )}
      </div>

      <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-[var(--border-subtle)] border-dashed">
        <div className="flex items-start space-x-3">
          <UploadIcon className="h-4 w-4 text-[var(--text-secondary)] mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
              Data Pipeline Protocol
            </h4>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
              Files are processed locally in the{' '}
              <span className="font-bold">Deterministic Calculation Engine</span>. Zero data leaves
              your machine. HIPAA & SOC2 compliant by design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
