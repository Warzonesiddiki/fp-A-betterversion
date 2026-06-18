import React from 'react';
import { ShieldCheck, ShieldAlert, Database, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SystemHealthMonitorProps {
  isOnline: boolean;
  dbSize?: number;
  lastBackup?: string;
}

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  isOnline,
  dbSize,
  lastBackup,
}) => {
  if (isOnline === undefined && !dbSize && !lastBackup) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className="flex items-center space-x-4 p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm dark:bg-gray-900 dark:border-gray-800"
      role="region"
      aria-label="SystemHealthMonitor"
    >
      {/* Online Status */}
      <div className="flex items-center space-x-2 px-2 py-1 bg-[var(--bg-surface)] rounded-md border border-[var(--border-subtle)]">
        {isOnline ? (
          <ShieldCheck className="h-4 w-4 text-green-500" />
        ) : (
          <ShieldAlert className="h-4 w-4 text-red-600" />
        )}
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider',
            isOnline ? 'text-green-700' : 'text-red-700'
          )}
        >
          {isOnline ? 'System Healthy' : 'System Offline'}
        </span>
      </div>

      {/* DB Size */}
      {dbSize !== undefined && (
        <div className="flex items-center space-x-2 text-[var(--text-secondary)]">
          <Database className="h-3.5 w-3.5 opacity-60" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-tighter opacity-70 leading-none mb-0.5">
              DB Storage
            </span>
            <span className="text-[10px] font-semibold text-[var(--text-primary)] leading-none tabular-nums">
              {formatSize(dbSize)}
            </span>
          </div>
        </div>
      )}

      {/* Last Backup */}
      {lastBackup && (
        <div className="flex items-center space-x-2 text-[var(--text-secondary)] border-l border-[var(--border-subtle)] pl-4">
          <Clock className="h-3.5 w-3.5 opacity-60" />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-tighter opacity-70 leading-none mb-0.5">
              Last Sync
            </span>
            <span className="text-[10px] font-semibold text-[var(--text-primary)] leading-none">
              {lastBackup}
            </span>
          </div>
        </div>
      )}

      <button
        aria-label="View system health details"
        className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)] focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
