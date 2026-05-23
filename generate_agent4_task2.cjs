const fs = require('fs');
const path = require('path');

const HOOKS_DIR = path.join('src', 'hooks');
const COMPONENTS_DIR = path.join('src', 'components');

const dirs = [
  HOOKS_DIR,
  path.join(COMPONENTS_DIR, 'dashboard'),
  path.join(COMPONENTS_DIR, 'budgets'),
  path.join(COMPONENTS_DIR, 'analytics'),
  path.join(COMPONENTS_DIR, 'variance'),
  path.join(COMPONENTS_DIR, 'reports'),
  path.join(COMPONENTS_DIR, 'scenarios'),
  path.join(COMPONENTS_DIR, 'settings'),
  path.join(COMPONENTS_DIR, 'data'),
  path.join(COMPONENTS_DIR, 'saas'),
  path.join(COMPONENTS_DIR, 'manufacturing'),
  path.join(COMPONENTS_DIR, 'finance'),
  path.join(COMPONENTS_DIR, 'esg'),
  path.join(COMPONENTS_DIR, 'treasury'),
  path.join(COMPONENTS_DIR, 'workforce'),
  path.join(COMPONENTS_DIR, 'retail'),
  path.join(COMPONENTS_DIR, 'realestate'),
  path.join(COMPONENTS_DIR, 'construction'),
  path.join(COMPONENTS_DIR, 'insurance'),
];

dirs.forEach(d => fs.mkdirSync(d, { recursive: true }));

const hooks = {
  'useAuth.ts': `import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, isAuthenticated, isLoading, login, logout, switchEntity } = useAuthStore();
  return { user, isAuthenticated, isLoading, login, logout, switchEntity };
}`,

  'useDebounce.ts': `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    if (delay === 0) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}`,

  'useKeyboardShortcuts.ts': `import { useEffect } from 'react';

export interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutDef[]): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      for (const s of shortcuts) {
        const keyMatch = event.key.toLowerCase() === s.key.toLowerCase();
        const ctrlMatch = !!s.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = !!s.shift === event.shiftKey;
        const altMatch = !!s.alt === event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          s.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}`,

  'useIndexedDB.ts': `export function useIndexedDB(dbName: string, storeName: string) {
  const openDB = (): Promise<IDBDatabase | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(dbName);
      request.onerror = () => resolve(null);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  };

  const getItem = async <T>(key: string): Promise<T | null> => {
    const db = await openDB();
    if (!db) return null;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as T || null);
      request.onerror = () => resolve(null);
    });
  };

  const setItem = async <T>(key: string, value: T): Promise<void> => {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  };

  const removeItem = async (key: string): Promise<void> => {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  };

  const clear = async (): Promise<void> => {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  };

  const getAll = async <T>(): Promise<T[]> => {
    const db = await openDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => resolve([]);
    });
  };

  return { getItem, setItem, removeItem, clear, getAll };
}`,

  'usePersistence.ts': `import { useState, useEffect, useCallback } from 'react';
import { useIndexedDB } from './useIndexedDB';

export interface PersistenceOptions {
  key: string;
  storage?: 'indexeddb' | 'localstorage';
  version?: number;
  migrate?: (old: any, oldVersion: number) => any;
}

export function usePersistence<T>(options: PersistenceOptions) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getItem, setItem, removeItem } = useIndexedDB('FinPlanDB', 'persistence');

  const load = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    try {
      let stored: any;
      if (options.storage === 'localstorage') {
        const val = localStorage.getItem(options.key);
        stored = val ? JSON.parse(val) : null;
      } else {
        stored = await getItem(options.key);
      }

      if (stored && options.version && stored._version !== options.version) {
        if (options.migrate) {
          stored = options.migrate(stored, stored._version || 0);
        }
      }

      const result = stored ? (stored._data as T) : null;
      setData(result);
      return result;
    } catch (e) {
      setError('Failed to load data');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [options.key, options.storage, options.version, options.migrate, getItem]);

  const save = async (newData: T) => {
    try {
      const wrapper = { _data: newData, _version: options.version || 0 };
      if (options.storage === 'localstorage') {
        localStorage.setItem(options.key, JSON.stringify(wrapper));
      } else {
        await setItem(options.key, wrapper);
      }
      setData(newData);
    } catch (e) {
      setError('Failed to save data');
    }
  };

  const clear = async () => {
    try {
      if (options.storage === 'localstorage') {
        localStorage.removeItem(options.key);
      } else {
        await removeItem(options.key);
      }
      setData(null);
    } catch (e) {
      setError('Failed to clear data');
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return { data, save, load, clear, isLoading, error };
}`,

  'useOffline.ts': `import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { 
    isOnline, 
    pendingChanges: 0, 
    syncNow: async () => {}, 
    lastSyncedAt: new Date().toISOString() 
  };
}`,

  'useExport.ts': `import { useState } from 'react';
import { ExportEngine } from '@/engines/ExportEngine';

export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToPDF = async (data: any[], title: string) => {
    if (!data.length) { setError('No data to export'); return; }
    setIsExporting(true);
    try {
      await ExportEngine.toPDF(data, title);
    } catch (e) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (data: any[], fileName: string) => {
    if (!data.length) { setError('No data to export'); return; }
    setIsExporting(true);
    try {
      await ExportEngine.toExcel(data, fileName);
    } catch (e) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (data: any[], fileName: string) => {
    if (!data.length) { setError('No data to export'); return; }
    setIsExporting(true);
    try {
      await ExportEngine.toCSV(data, fileName);
    } catch (e) {
      setError('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPDF, exportToExcel, exportToCSV, isExporting, error };
}`,

  'useSector.ts': `import { useSettingsStore } from '@/store/settingsStore';
import { getSectorConfig, getAllSectors } from '@/config/sectors';
import type { SectorConfig } from '@/config/sectors';

export function useSector() {
  const activeSectorId = useSettingsStore(state => state.preferences.activeSector);
  const setSectorId = useSettingsStore(state => state.updatePreferences);

  const sectorConfig = getSectorConfig(activeSectorId) || getSectorConfig('technology');
  const availableSectors = getAllSectors();

  const setSector = (id: string) => {
    setSectorId({ activeSector: id });
  };

  return { 
    activeSector: activeSectorId, 
    sectorConfig, 
    setSector, 
    availableSectors 
  };
}`,
};

const components = {
  'dashboard/KPICard.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { KPIValue } from '@/components/ui/KPIValue';
import type { KPIMetric } from '@/types';

export interface KPICardProps {
  metric: KPIMetric;
  onClick?: () => void;
}

export function KPICard({ metric, onClick }: KPICardProps) {
  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-400">{metric.label}</span>
        <KPIValue 
          value={metric.formattedValue}
          change={metric.changeFormatted}
          changeType={metric.changeType}
          sparklineData={metric.sparklineData}
        />
      </div>
    </Card>
  );
}`,

  'dashboard/ActivityFeed.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import type { ActivityLog } from '@/types';

export interface ActivityFeedProps {
  activities: ActivityLog[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const items = activities.slice(0, maxItems);

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center text-slate-400">
        No recent activity
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-slate-800">
      {items.map((activity) => (
        <div key={activity.id} className="p-4 flex items-center gap-3">
          <Avatar name={activity.userName} src={activity.userAvatar} size="sm" />
          <div className="flex flex-col">
            <p className="text-sm text-slate-300">
              <span className="font-bold text-white">{activity.userName}</span> {activity.action}
            </p>
            <span className="text-xs text-slate-500">{activity.timestamp}</span>
          </div>
        </div>
      ))}
      {activities.length > maxItems && (
        <button className="w-full p-3 text-sm text-blue-400 hover:text-blue-300 font-medium text-center">
          View all
        </button>
      )}
    </Card>
  );
}`,

  'budgets/BudgetGrid.tsx': `import React from 'react';
import { DataGrid } from '@/components/ui/DataGrid';
import { FormulaBar } from '@/components/ui/FormulaBar';
import type { BudgetLineItem, GLAccount } from '@/types';

export interface BudgetGridProps {
  lineItems: BudgetLineItem[];
  accounts: GLAccount[];
  onCellEdit: (id: string, amount: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function BudgetGrid({ 
  lineItems, 
  onCellEdit, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo 
}: BudgetGridProps) {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      <div className="p-2 border-b border-slate-800 flex items-center gap-4 bg-slate-900">
        <div className="flex items-center gap-1">
          <button 
            onClick={onUndo} 
            disabled={!canUndo}
            className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-300"
          >
            Undo
          </button>
          <button 
            onClick={onRedo} 
            disabled={!canRedo}
            className="p-1.5 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-300"
          >
            Redo
          </button>
        </div>
        <FormulaBar className="flex-1" />
      </div>
      <div className="flex-1 overflow-hidden">
        <DataGrid 
          data={lineItems}
          onCellChange={(id, value) => onCellEdit(id, Number(value))}
        />
      </div>
    </div>
  );
}`,

  'analytics/ChartWrapper.tsx': `import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ComboChart } from '@/components/ui/ComboChart';

export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'composed';

export interface ChartWrapperProps {
  type: ChartType;
  data: any[];
  xKey: string;
  yKeys: { key: string; color?: string; name: string }[];
  height?: number;
  title?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export function ChartWrapper({
  type,
  data,
  xKey,
  yKeys,
  height = 300,
  title,
  loading,
  error,
  emptyMessage = 'No data available'
}: ChartWrapperProps) {
  if (loading) {
    return <Skeleton variant="rectangular" height={height} className="w-full" />;
  }

  if (error) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center border border-slate-800 rounded-lg bg-slate-900 p-6">
        <span className="text-red-400 mb-2 font-medium">Failed to load chart</span>
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center border border-slate-800 rounded-lg bg-slate-900">
        <span className="text-slate-500 text-sm">{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {title && <h3 className="text-sm font-semibold text-slate-300">{title}</h3>}
      <div style={{ height }}>
        <ComboChart data={data} xKey={xKey} yKeys={yKeys} />
      </div>
    </div>
  );
}`,

  'analytics/DataLineageViewer.tsx': `import React from 'react';

export interface DataLineageViewerProps {
  graph: {
    nodes: { id: string; name: string; type: 'source' | 'transform' | 'report' }[];
    edges: { from: string; to: string }[];
  };
  onNodeClick?: (id: string) => void;
  height?: number;
}

export function DataLineageViewer({ graph, onNodeClick, height = 400 }: DataLineageViewerProps) {
  if (!graph.nodes.length) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-slate-950 border border-slate-800 rounded-lg">
        <span className="text-slate-500">No lineage data</span>
      </div>
    );
  }

  return (
    <div style={{ height }} className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden p-6">
      <svg width="100%" height="100%" viewBox="0 0 800 400">
        {graph.nodes.map((node, i) => {
          const x = node.type === 'source' ? 100 : node.type === 'transform' ? 400 : 700;
          const y = (i % 5) * 80 + 40;
          const color = node.type === 'source' ? '#22c55e' : node.type === 'transform' ? '#f59e0b' : '#3b82f6';
          
          return (
            <g key={node.id} className="cursor-pointer group" onClick={() => onNodeClick?.(node.id)}>
              <rect 
                x={x - 60} y={y - 20} width={120} height={40} rx={4} 
                fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2}
                className="group-hover:fill-opacity-30 transition-all"
              />
              <text 
                x={x} y={y + 5} textAnchor="middle" fill="#fff" 
                fontSize="12" className="pointer-events-none"
              >
                {node.name}
              </text>
            </g>
          );
        })}
        {graph.edges.map((edge, i) => {
          const fromNode = graph.nodes.find(n => n.id === edge.from);
          const toNode = graph.nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const x1 = fromNode.type === 'source' ? 160 : fromNode.type === 'transform' ? 460 : 760;
          const y1 = (graph.nodes.indexOf(fromNode) % 5) * 80 + 40;
          const x2 = toNode.type === 'source' ? 40 : toNode.type === 'transform' ? 340 : 640;
          const y2 = (graph.nodes.indexOf(toNode) % 5) * 80 + 40;

          return (
            <path 
              key={i} d={\`M \${x1} \${y1} L \${x2} \${y2}\`} 
              stroke="#334155" strokeWidth="2" fill="none" 
            />
          );
        })}
      </svg>
    </div>
  );
}`,

  'variance/VarianceTable.tsx': `import React from 'react';
import { FinancialTable } from '@/components/ui/FinancialTable';
import { Badge } from '@/components/ui/Badge';
import type { VarianceAnalysis } from '@/types';

export interface VarianceTableProps {
  analyses: VarianceAnalysis[];
  onSelect: (accountId: string) => void;
  onCommentaryEdit: (accountId: string, commentary: string) => void;
  selectedAccountId?: string;
}

export function VarianceTable({ analyses, onSelect, onCommentaryEdit, selectedAccountId }: VarianceTableProps) {
  if (analyses.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-lg border border-slate-800">
        No variance data
      </div>
    );
  }

  return (
    <FinancialTable 
      data={analyses}
      onRowClick={(row) => onSelect(row.accountId)}
      selectedId={selectedAccountId}
      columns={[
        { key: 'accountName', label: 'Account', width: 200 },
        { key: 'budget', label: 'Budget', format: 'currency' },
        { key: 'actual', label: 'Actual', format: 'currency' },
        { 
          key: 'variance', 
          label: 'Var $', 
          format: 'currency',
          color: (val) => val >= 0 ? 'text-green-400' : 'text-red-400'
        },
        { 
          key: 'variancePercent', 
          label: 'Var %', 
          format: 'percent',
          color: (val) => val >= 0 ? 'text-green-400' : 'text-red-400'
        },
        { 
          key: 'status', 
          label: 'Status',
          render: (val) => (
            <Badge variant={val === 'Within' ? 'success' : val === 'Watch' ? 'warning' : 'danger'}>
              {val}
            </Badge>
          )
        },
        { 
          key: 'commentary', 
          label: 'Commentary',
          render: (val, row) => (
            <input 
              defaultValue={val} 
              onBlur={(e) => onCommentaryEdit(row.accountId, e.target.value)}
              className="bg-transparent border-none outline-none text-slate-400 text-sm w-full focus:text-white"
            />
          )
        }
      ]}
    />
  );
}`,

  'reports/ReportScheduler.tsx': `import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

export interface ScheduledReport {
  id: string;
  reportId: string;
  reportName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  format: 'pdf' | 'excel' | 'html';
  recipients: string[];
  isActive: boolean;
  nextRun: string;
}

export interface ReportSchedulerProps {
  schedules: ScheduledReport[];
  onAdd: (s: Omit<ScheduledReport, 'id'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  availableReports: { id: string; name: string }[];
}

export function ReportScheduler({ schedules, onAdd, onRemove, onToggle, availableReports }: ReportSchedulerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (schedules.length === 0 && !isModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 border border-dashed border-slate-700 rounded-lg">
        <p className="text-slate-400 mb-4">No schedules yet</p>
        <Button onClick={() => setIsModalOpen(true)}>Add Schedule</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Scheduled Reports</h3>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>Add Schedule</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map(s => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-slate-200">{s.reportName}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">
                {s.frequency} • {s.format}
              </span>
              <span className="text-xs text-slate-400">Next run: {s.nextRun}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onToggle(s.id)}
                className={\`w-10 h-6 rounded-full transition-colors \${s.isActive ? 'bg-blue-600' : 'bg-slate-700'}\`}
              />
              <button onClick={() => onRemove(s.id)} className="text-slate-500 hover:text-red-400">
                Remove
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Schedule">
        <form className="space-y-4" onSubmit={(e) => {
          e.preventDefault();
          onAdd({
            reportId: '1',
            reportName: 'P&L Statement',
            frequency: 'monthly',
            format: 'pdf',
            recipients: [],
            isActive: true,
            nextRun: '2025-02-01'
          });
          setIsModalOpen(false);
        }}>
          <Select label="Report" options={availableReports.map(r => ({ value: r.id, label: r.name }))} />
          <Select label="Frequency" options={[{value: 'daily', label: 'Daily'}, {value: 'weekly', label: 'Weekly'}]} />
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}`,

  'scenarios/DriverTreeView.tsx': `import React from 'react';
import { DriverSlider } from '@/components/ui/DriverSlider';
import type { ScenarioAssumption } from '@/types';

export interface DriverTreeViewProps {
  assumptions: ScenarioAssumption[];
  onUpdate: (assumptionId: string, value: number) => void;
  readOnly?: boolean;
}

export function DriverTreeView({ assumptions, onUpdate, readOnly }: DriverTreeViewProps) {
  if (assumptions.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 bg-slate-900 rounded-lg">
        No drivers defined
      </div>
    );
  }

  const groups = assumptions.reduce((acc, a) => {
    acc[a.type] = acc[a.type] || [];
    acc[a.type].push(a);
    return acc;
  }, {} as Record<string, ScenarioAssumption[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([type, list]) => (
        <div key={type} className="space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
            {type} Drivers
          </h4>
          <div className="space-y-2">
            {list.map(a => (
              <DriverSlider 
                key={a.id}
                label={a.name}
                value={a.value}
                min={a.min}
                max={a.max}
                unit={a.unit}
                onChange={(v) => onUpdate(a.id, v)}
                disabled={readOnly}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}`,

  'settings/TemplateMarketplace.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface TemplateMarketplaceProps {
  templates: ReportTemplate[];
  onSelect: (id: string) => void;
}

export function TemplateMarketplace({ templates, onSelect }: TemplateMarketplaceProps) {
  if (templates.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-xl border border-dashed border-slate-700">
        No templates available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map(t => (
        <Card 
          key={t.id} 
          className="p-6 flex flex-col h-full hover:border-blue-500 cursor-pointer transition-colors"
          onClick={() => onSelect(t.id)}
        >
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-bold text-slate-200">{t.name}</h4>
            <Badge variant="info">{t.category}</Badge>
          </div>
          <p className="text-sm text-slate-400 mb-6 flex-1">{t.description}</p>
          <button className="text-sm text-blue-400 font-semibold hover:text-blue-300 self-start">
            Use Template
          </button>
        </Card>
      ))}
    </div>
  );
}`,

  'data/FileUploader.tsx': `import React from 'react';
import { FileDropZone } from '@/components/ui/FileDropZone';

export function FileUploader() {
  return (
    <div className="max-w-2xl mx-auto">
      <FileDropZone 
        accept=".csv,.xlsx,.xls"
        onFilesDropped={(files) => console.log('Dropped:', files)}
      />
    </div>
  );
}`,

  'data/GLDropZone.tsx': `import React from 'react';
import { FileDropZone } from '@/components/ui/FileDropZone';

export function GLDropZone() {
  return (
    <div className="space-y-4">
      <FileDropZone 
        accept=".csv,.xlsx"
        onFilesDropped={(files) => console.log('GL Upload:', files)}
      />
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-500">
        <p className="font-semibold text-slate-400 mb-2">Expected columns:</p>
        <p>accountCode, postDate, debit, credit, entityId, departmentId, description</p>
      </div>
    </div>
  );
}`,

  'data/GLColumnMapper.tsx': `import React from 'react';
import { Select } from '@/components/ui/Select';

export interface GLColumnMapperProps {
  csvColumns: string[];
  mappings: Record<string, string>;
  onMap: (field: string, csvCol: string) => void;
}

export function GLColumnMapper({ csvColumns, mappings, onMap }: GLColumnMapperProps) {
  const fields = [
    { key: 'accountCode', label: 'Account Code' },
    { key: 'postDate', label: 'Posting Date' },
    { key: 'debit', label: 'Debit Amount' },
    { key: 'credit', label: 'Credit Amount' },
    { key: 'entityId', label: 'Entity ID' },
    { key: 'departmentId', label: 'Department ID' }
  ];

  const options = csvColumns.map(c => ({ value: c, label: c }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950 p-6 rounded-xl border border-slate-800">
      {fields.map(f => (
        <Select 
          key={f.key}
          label={f.label}
          value={mappings[f.key]}
          onChange={(val) => onMap(f.key, val)}
          options={options}
        />
      ))}
    </div>
  );
}`,

  'data/GLDataPreview.tsx': `import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';

export interface GLDataPreviewProps {
  data: any[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function GLDataPreview({ data, onConfirm, onCancel }: GLDataPreviewProps) {
  return (
    <div className="space-y-6">
      <div className="border border-slate-800 rounded-lg overflow-hidden h-96">
        <DataTable 
          data={data}
          columns={Object.keys(data[0] || {}).map(k => ({ key: k, label: k }))}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onConfirm}>Confirm Import</Button>
      </div>
    </div>
  );
}`,

  'data/GLTrialBalanceGrid.tsx': `import React from 'react';
import { DataGrid } from '@/components/ui/DataGrid';

export function GLTrialBalanceGrid() {
  return (
    <div className="h-[600px] border border-slate-800 rounded-lg overflow-hidden shadow-2xl">
      <DataGrid 
        data={[]} 
        readOnly
      />
    </div>
  );
}`,

  'data/GLAccountDrillDown.tsx': `import React from 'react';
import { Sparkline } from '@/components/ui/Sparkline';
import { DataTable } from '@/components/ui/DataTable';

export function GLAccountDrillDown() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-slate-900 p-6 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">61000 - Professional Services</h2>
          <p className="text-sm text-slate-500">Operating Expenses / Outside Services</p>
        </div>
        <div className="w-48 h-12">
          <Sparkline data={[10, 15, 8, 20, 12, 18, 25]} color="#3b82f6" />
        </div>
      </div>
      <DataTable data={[]} columns={[]} />
    </div>
  );
}`,

  'saas/SaaSCohortTable.tsx': `import React from 'react';

export interface CohortRow {
  cohort: string;
  size: number;
  retention: number[];
}

export interface SaaSCohortTableProps {
  data: CohortRow[];
}

export function SaaSCohortTable({ data }: SaaSCohortTableProps) {
  if (!data.length) return <div className="p-8 text-center text-slate-500">No cohort data</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="p-2 border-b border-r border-slate-800 text-left">Cohort</th>
            <th className="p-2 border-b border-r border-slate-800 text-right">Size</th>
            {Array.from({ length: 12 }).map((_, i) => (
              <th key={i} className="p-2 border-b border-slate-800 text-center">M{i}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-950">
          {data.map((row, i) => (
            <tr key={i}>
              <td className="p-2 border-r border-slate-800 font-medium text-slate-300">{row.cohort}</td>
              <td className="p-2 border-r border-slate-800 text-right text-slate-500">{row.size}</td>
              {row.retention.map((val, j) => {
                const opacity = val / 100;
                return (
                  <td 
                    key={j} 
                    className="p-2 text-center" 
                    style={{ backgroundColor: \`rgba(59, 130, 246, \${opacity})\`, color: opacity > 0.5 ? '#fff' : '#94a3b8' }}
                  >
                    {val}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}`,

  'saas/ChurnWaterfall.tsx': `import React from 'react';
import { WaterfallChart } from '@/components/ui/WaterfallChart';

export function ChurnWaterfall() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <WaterfallChart 
        data={[
          { name: 'Beginning', value: 100000 },
          { name: 'New', value: 20000 },
          { name: 'Expansion', value: 5000 },
          { name: 'Contraction', value: -2000 },
          { name: 'Churn', value: -8000 },
          { name: 'Ending', value: 115000, isTotal: true }
        ]} 
      />
    </div>
  );
}`,

  'saas/MRRBreakdown.tsx': `import React from 'react';
import { ComboChart } from '@/components/ui/ComboChart';

export function MRRBreakdown() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart 
        data={[]} 
        xKey="month" 
        yKeys={[
          { key: 'new', color: '#22c55e', name: 'New' },
          { key: 'expansion', color: '#3b82f6', name: 'Expansion' },
          { key: 'contraction', color: '#f59e0b', name: 'Contraction' },
          { key: 'churn', color: '#ef4444', name: 'Churn' }
        ]}
      />
    </div>
  );
}`,

  'manufacturing/ProductionDashboard.tsx': `import React from 'react';
import { GaugeChart } from '@/components/ui/GaugeChart';
import { Card } from '@/components/ui/Card';
import type { ProductionMetrics } from '@/types/sector-types';

export interface ProductionDashboardProps {
  metrics: ProductionMetrics;
}

export function ProductionDashboard({ metrics }: ProductionDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="flex flex-col items-center gap-2 p-4">
        <span className="text-xs font-bold text-slate-500 uppercase">OEE</span>
        <GaugeChart value={metrics.oee} />
      </Card>
      <div className="md:col-span-3 grid grid-cols-3 gap-4">
        {['Availability', 'Performance', 'Quality'].map(k => (
          <Card key={k} className="p-4 flex flex-col justify-center text-center">
            <span className="text-xs text-slate-400 mb-1">{k}</span>
            <span className="text-xl font-bold text-white">{(metrics as any)[k.toLowerCase()]}%</span>
          </Card>
        ))}
      </div>
    </div>
  );
}`,

  'finance/ConsolidationTree.tsx': `import React from 'react';
import { EntityTree } from '@/components/ui/EntityTree';

export function ConsolidationTree() {
  return (
    <div className="p-6 bg-slate-950 rounded-xl border border-slate-800">
      <EntityTree />
    </div>
  );
}`,

  'finance/RevRecSchedule.tsx': `import React from 'react';
import { ComboChart } from '@/components/ui/ComboChart';

export function RevRecSchedule() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart 
        data={[]} 
        xKey="period" 
        yKeys={[{ key: 'revenue', color: '#3b82f6', name: 'Revenue' }]}
      />
    </div>
  );
}`,

  'finance/LeaseSchedule.tsx': `import React from 'react';
import { ComboChart } from '@/components/ui/ComboChart';

export function LeaseSchedule() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart 
        data={[]} 
        xKey="period" 
        yKeys={[
          { key: 'rou', color: '#10b981', name: 'ROU Asset' },
          { key: 'liability', color: '#f43f5e', name: 'Liability' }
        ]}
      />
    </div>
  );
}`,

  'finance/DepreciationProjection.tsx': `import React from 'react';
import { ComboChart } from '@/components/ui/ComboChart';

export function DepreciationProjection() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <ComboChart 
        data={[]} 
        xKey="year" 
        yKeys={[{ key: 'depreciation', color: '#8b5cf6', name: 'Depreciation' }]}
      />
    </div>
  );
}`,

  'finance/FXPositionGrid.tsx': `import React from 'react';
import { FinancialTable } from '@/components/ui/FinancialTable';

export function FXPositionGrid() {
  return (
    <FinancialTable 
      data={[]} 
      columns={[
        { key: 'currency', label: 'Currency' },
        { key: 'long', label: 'Long', format: 'currency' },
        { key: 'short', label: 'Short', format: 'currency' },
        { key: 'net', label: 'Net Position', format: 'currency' },
        { key: 'rate', label: 'Current Rate' }
      ]}
    />
  );
}`,

  'reports/BoardPackBuilder.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function BoardPackBuilder() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-1 space-y-4">
        <h3 className="font-bold text-white">Sections</h3>
        <div className="space-y-2">
          {['Executive Summary', 'P&L Statement', 'Balance Sheet', 'Cash Flow', 'Variance Analysis'].map(s => (
            <Card key={s} className="p-3 text-sm cursor-move hover:border-blue-500">
              {s}
            </Card>
          ))}
        </div>
        <Button className="w-full">Generate PDF</Button>
      </div>
      <div className="md:col-span-2 bg-white rounded-lg p-12 min-h-[600px] shadow-2xl text-slate-900 overflow-hidden">
        <h1 className="text-3xl font-bold mb-8">Executive Summary</h1>
        <div className="h-4 bg-slate-100 w-3/4 mb-4" />
        <div className="h-4 bg-slate-100 w-full mb-4" />
        <div className="h-4 bg-slate-100 w-2/3 mb-4" />
      </div>
    </div>
  );
}`,

  'reports/ExecutiveSummary.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { Sparkline } from '@/components/ui/Sparkline';

export function ExecutiveSummary() {
  return (
    <div className="space-y-8 print:p-0">
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Revenue', val: '$4.2M', change: '+12%', data: [5, 6, 5.5, 7, 8] },
          { label: 'EBITDA', val: '$1.1M', change: '+4%', data: [1, 1.2, 0.9, 1.1, 1.3] },
          { label: 'Cash Flow', val: '$850k', change: '-2%', data: [1, 0.9, 1.1, 0.8, 0.85] }
        ].map(k => (
          <Card key={k.label} className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold">{k.label}</span>
              <div className="text-2xl font-bold text-white">{k.val}</div>
              <span className="text-xs text-green-400">{k.change} vs budget</span>
            </div>
            <div className="w-24 h-8">
              <Sparkline data={k.data} color="#3b82f6" />
            </div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-bold text-white mb-4">Management Commentary</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Strong revenue performance this period driven by new SaaS bookings. 
          Operating expenses remained within budget despite increased marketing spend.
          Cash position strengthened following timely AR collections.
        </p>
      </Card>
    </div>
  );
}`,

  'analytics/BenchmarkRadar.tsx': `import React from 'react';

export function BenchmarkRadar() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800 flex items-center justify-center">
      <span className="text-slate-500">Industry Benchmark Radar Chart</span>
    </div>
  );
}`,

  'esg/ESGDashboard.tsx': `import React from 'react';
import { GaugeChart } from '@/components/ui/GaugeChart';
import { Card } from '@/components/ui/Card';

export function ESGDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 flex flex-col items-center gap-4">
        <span className="text-sm font-bold text-slate-400 uppercase">Carbon Footprint</span>
        <GaugeChart value={65} />
      </Card>
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        <Card className="p-6">
          <h4 className="text-sm font-bold text-slate-500 mb-4">Emissions Breakdown</h4>
          <div className="space-y-3">
            {['Scope 1', 'Scope 2', 'Scope 3'].map(s => (
              <div key={s} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-16">{s}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-500 mb-1">Diversity Score</span>
          <span className="text-4xl font-bold text-white">82</span>
        </Card>
      </div>
    </div>
  );
}`,

  'treasury/CashForecastChart.tsx': `import React from 'react';
import { WaterfallChart } from '@/components/ui/WaterfallChart';

export function CashForecastChart() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <WaterfallChart 
        data={[
          { name: 'Start', value: 500000 },
          { name: 'Collections', value: 250000 },
          { name: 'Payroll', value: -120000 },
          { name: 'Vendors', value: -80000 },
          { name: 'Debt Svc', value: -30000 },
          { name: 'End', value: 520000, isTotal: true }
        ]} 
      />
    </div>
  );
}`,

  'workforce/HeadcountHeatmap.tsx': `import React from 'react';
import { Heatmap } from '@/components/ui/Heatmap';

export function HeadcountHeatmap() {
  return (
    <div className="h-80 bg-slate-950 p-6 rounded-xl border border-slate-800">
      <Heatmap data={[]} />
    </div>
  );
}`,

  'retail/StoreDashboard.tsx': `import React from 'react';
import { FinancialTable } from '@/components/ui/FinancialTable';

export function StoreDashboard() {
  return (
    <FinancialTable 
      data={[]} 
      columns={[
        { key: 'storeName', label: 'Store' },
        { key: 'sales', label: 'Sales', format: 'currency' },
        { key: 'traffic', label: 'Traffic', format: 'number' },
        { key: 'conversion', label: 'Conv %', format: 'percent' },
        { key: 'basketSize', label: 'Basket', format: 'currency' }
      ]}
    />
  );
}`,

  'realestate/PropertyDashboard.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { FinancialTable } from '@/components/ui/FinancialTable';

export function PropertyDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {['NOI', 'Occupancy', 'Cap Rate', 'WALT'].map(k => (
          <Card key={k} className="p-4 text-center">
            <span className="text-xs text-slate-500 uppercase font-bold">{k}</span>
            <div className="text-xl font-bold text-white">---</div>
          </Card>
        ))}
      </div>
      <FinancialTable data={[]} columns={[]} />
    </div>
  );
}`,

  'construction/JobCostDashboard.tsx': `import React from 'react';
import { Card } from '@/components/ui/Card';
import { FinancialTable } from '@/components/ui/FinancialTable';

export function JobCostDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {['Budget', 'Actual', 'SPI', 'CPI'].map(k => (
          <Card key={k} className="p-4 text-center">
            <span className="text-xs text-slate-500 uppercase font-bold">{k}</span>
            <div className="text-xl font-bold text-white">---</div>
          </Card>
        ))}
      </div>
      <FinancialTable data={[]} columns={[]} />
    </div>
  );
}`,

  'insurance/UnderwritingDashboard.tsx': `import React from 'react';
import { GaugeChart } from '@/components/ui/GaugeChart';
import { Card } from '@/components/ui/Card';

export function UnderwritingDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 flex flex-col items-center gap-4">
        <span className="text-sm font-bold text-slate-400 uppercase">Combined Ratio</span>
        <GaugeChart value={92} />
      </Card>
      <div className="md:col-span-2">
        <Card className="p-6 h-full">
          <h4 className="text-sm font-bold text-slate-500 mb-4">Premium Trend</h4>
          <div className="h-48 bg-slate-900 rounded border border-slate-800 flex items-center justify-center text-slate-600">
            Premium Bar Chart
          </div>
        </Card>
      </div>
    </div>
  );
}`,
};

Object.entries(hooks).forEach(([file, content]) => {
  fs.writeFileSync(path.join(HOOKS_DIR, file), content);
  console.log('Generated Hook:', file);
});

Object.entries(components).forEach(([file, content]) => {
  const fullPath = path.join(COMPONENTS_DIR, file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('Generated Component:', file);
});

console.log('Task 2 generation complete.');
